// functions/api/boekhouding.js
// Boekhouding per boekjaar in KV (namespace FACTUREN, key "boek-<jaar>").
// GET  /api/boekhouding?jaar=2026            -> { boek }
// POST /api/boekhouding {jaar, actie, ...}   -> { boek, info? }   (acties: zie _lib/boekhouding.js)
// Vereist sessiecookie. Alle invoer wordt server-side gevalideerd.

import { parseCookie, verifySession } from "../_lib/auth.js";
import { isCrossSite } from "../_lib/abuse.js";
import { geldigJaar, leegBoek, pasToe } from "../_lib/boekhouding.js";

const KEY = (jaar) => `boek-${jaar}`;
const MAX_BODY_BYTES = 400_000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json" },
  });
}

async function geautoriseerd(request, env) {
  const token = parseCookie(request.headers.get("Cookie"));
  return env.SESSION_SECRET && (await verifySession(token, env.SESSION_SECRET));
}

async function laadBoek(env, jaar) {
  const raw = await env.FACTUREN.get(KEY(jaar));
  const leeg = leegBoek(jaar);
  if (!raw) return leeg;
  try {
    const b = JSON.parse(raw);
    return {
      ...leeg, ...b, jaar,
      omzet: Array.isArray(b.omzet) ? b.omzet : [],
      kosten: Array.isArray(b.kosten) ? b.kosten : [],
      aangiften: b.aangiften && typeof b.aangiften === "object" ? b.aangiften : {},
      instellingen: { ...leeg.instellingen, ...(b.instellingen || {}) },
    };
  } catch {
    return null;
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  const jaar = geldigJaar(new URL(request.url).searchParams.get("jaar"));
  if (!jaar) return json({ error: "Ongeldig jaar." }, 400);
  const boek = await laadBoek(env, jaar);
  if (!boek) return json({ error: "Boekhouding beschadigd." }, 500);
  return json({ boek });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);
  if (isCrossSite(request)) return json({ error: "Verzoek geweigerd." }, 403);

  if (Number(request.headers.get("Content-Length") || 0) > MAX_BODY_BYTES) {
    return json({ error: "Verzoek te groot." }, 413);
  }
  let body;
  try {
    const tekst = await request.text();
    if (tekst.length > MAX_BODY_BYTES) return json({ error: "Verzoek te groot." }, 413);
    body = JSON.parse(tekst);
  } catch {
    return json({ error: "Ongeldig verzoek." }, 400);
  }
  if (!body || typeof body !== "object") return json({ error: "Ongeldig verzoek." }, 400);

  const jaar = geldigJaar(body.jaar);
  if (!jaar) return json({ error: "Ongeldig jaar." }, 400);

  const boek = await laadBoek(env, jaar);
  if (!boek) return json({ error: "Boekhouding beschadigd." }, 500);

  const res = pasToe(boek, String(body.actie || ""), body);
  if (!res.ok) return json({ error: res.error }, res.status || 400);

  await env.FACTUREN.put(KEY(jaar), JSON.stringify(res.boek));
  return json({ boek: res.boek, info: res.info });
}
