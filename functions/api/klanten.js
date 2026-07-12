// functions/api/klanten.js
// Klantenbestand in KV (namespace FACTUREN, key-prefix "klant-"), gedeeld over apparaten.
// GET    /api/klanten            -> { klanten: [ {id, ...velden} ] }  (lijst)
// POST   /api/klanten {klant}    -> { id }  (opslaan of bijwerken; match op bedrijf+email)
// DELETE /api/klanten {id}       -> { ok }  (verwijderen)
// Vereist sessiecookie.

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

// Deterministische id uit bedrijf + e-mail (genormaliseerd), zodat "bijwerken" dezelfde
// KV-key raakt. base64url zonder padding.
function klantId(bedrijf, email) {
  const sleutel = `${(bedrijf || "").trim().toLowerCase()}|${(email || "").trim().toLowerCase()}`;
  const bytes = new TextEncoder().encode(sleutel);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const VELDEN = ["bedrijf", "contact", "adres", "postcodePlaats", "email", "kvkBtw"];

function schoonKlant(input) {
  const k = {};
  for (const v of VELDEN) k[v] = String(input[v] || "").slice(0, 300);
  return k;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  const lijst = await env.FACTUREN.list({ prefix: "klant-" });
  const klanten = [];
  for (const key of lijst.keys) {
    const waarde = await env.FACTUREN.get(key.name);
    if (!waarde) continue;
    try {
      const k = JSON.parse(waarde);
      klanten.push({ id: key.name.slice("klant-".length), ...k });
    } catch {}
  }
  // Sorteer op bedrijfsnaam voor een nette lijst.
  klanten.sort((a, b) => (a.bedrijf || "").localeCompare(b.bedrijf || "", "nl"));
  return json({ klanten });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  let body;
  try { body = (await request.json()).klant || {}; }
  catch { return json({ error: "Ongeldig verzoek." }, 400); }

  const klant = schoonKlant(body);
  // Zonder bedrijf én e-mail geen zinnige match-sleutel; niet opslaan.
  if (!klant.bedrijf.trim() && !klant.email.trim()) {
    return json({ error: "Bedrijfsnaam of e-mail vereist." }, 400);
  }

  const id = klantId(klant.bedrijf, klant.email);
  await env.FACTUREN.put(`klant-${id}`, JSON.stringify(klant));
  return json({ id });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  let id = "";
  try { id = String((await request.json()).id || "").trim(); }
  catch { return json({ error: "Ongeldig verzoek." }, 400); }
  if (!id) return json({ error: "Geen id opgegeven." }, 400);

  await env.FACTUREN.delete(`klant-${id}`);
  return json({ ok: true });
}
