// functions/api/document.js
// POST  /api/document {doc, overwrite?}  -> slaat doc-<nummer> op; factuur onveranderlijk (409 zonder overwrite)
// GET   /api/document?nummer=...          -> { doc } of 404
// PATCH /api/document {nummer, omgezet_naar} -> markeert offerte als omgezet
// Vereist sessiecookie. KV-binding FACTUREN. Key: doc-<nummer>.

import { parseCookie, verifySession } from "../_lib/auth.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json" },
  });
}

async function geautoriseerd(request, env) {
  const token = parseCookie(request.headers.get("Cookie"));
  return env.SESSION_SECRET && (await verifySession(token, env.SESSION_SECRET));
}

const KEY = (nummer) => `doc-${nummer}`;
function geldigNummer(n) { return typeof n === "string" && /^[A-Za-z0-9-]+$/.test(n); }

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Ongeldig verzoek." }, 400); }
  const doc = body && body.doc;
  const overwrite = body && body.overwrite === true;
  if (!doc || !geldigNummer(doc.nummer) || (doc.type !== "factuur" && doc.type !== "offerte")) {
    return json({ error: "Ongeldig document." }, 400);
  }

  const bestaandRaw = await env.FACTUREN.get(KEY(doc.nummer));
  if (bestaandRaw) {
    let bestaand = {};
    try { bestaand = JSON.parse(bestaandRaw); } catch {}
    if (bestaand.type === "factuur" && !overwrite) {
      return json({ error: "Factuur bestaat al.", bestaat: true }, 409);
    }
    // Behoud een reeds gezette omzet-markering: het overschrijvende document
    // (bijv. een offerte die opnieuw gegenereerd wordt) draagt omgezet_naar niet
    // mee, maar de conversie-koppeling naar de factuur mag niet stil verdwijnen.
    if (bestaand.omgezet_naar && !doc.omgezet_naar) {
      doc.omgezet_naar = bestaand.omgezet_naar;
    }
  }

  doc.opgeslagen = new Date().toISOString();
  await env.FACTUREN.put(KEY(doc.nummer), JSON.stringify(doc));
  return json({ ok: true });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  const url = new URL(request.url);
  const nummer = (url.searchParams.get("nummer") || "").trim();
  if (!geldigNummer(nummer)) return json({ error: "Ongeldig nummer." }, 400);

  const raw = await env.FACTUREN.get(KEY(nummer));
  if (!raw) return json({ error: "Niet gevonden." }, 404);
  let doc;
  try { doc = JSON.parse(raw); } catch { return json({ error: "Document beschadigd." }, 500); }
  return json({ doc });
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Ongeldig verzoek." }, 400); }
  const nummer = (body.nummer || "").trim();
  if (!geldigNummer(nummer)) return json({ error: "Ongeldig nummer." }, 400);

  const raw = await env.FACTUREN.get(KEY(nummer));
  if (!raw) return json({ error: "Niet gevonden." }, 404);
  let doc;
  try { doc = JSON.parse(raw); } catch { return json({ error: "Document beschadigd." }, 500); }
  doc.omgezet_naar = body.omgezet_naar || null;
  doc.opgeslagen = new Date().toISOString();
  await env.FACTUREN.put(KEY(nummer), JSON.stringify(doc));
  return json({ ok: true });
}
