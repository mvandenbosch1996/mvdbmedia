// functions/api/documenten.js
// GET /api/documenten -> { documenten: [ <volledig doc>, ... ] }
// Lijst van alle opgeslagen facturen/offertes (KV-prefix "doc-").
// Vereist sessiecookie. KV-binding FACTUREN.

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

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  // Bewuste keuze: list + get-per-doc (N+1 KV-reads). Op ZZP-schaal (tientallen
  // documenten) ruim voldoende; geen batching/caching nodig.
  const lijst = await env.FACTUREN.list({ prefix: "doc-" });
  const documenten = [];
  for (const key of lijst.keys) {
    const raw = await env.FACTUREN.get(key.name);
    if (!raw) continue;
    try { documenten.push(JSON.parse(raw)); } catch {}
  }

  // Sorteer primair op documentdatum (nieuwste eerst), met 'opgeslagen' als
  // tiebreaker bij gelijke datum.
  documenten.sort((a, b) => {
    const d = String(b.datum || "").localeCompare(String(a.datum || ""));
    if (d !== 0) return d;
    return String(b.opgeslagen || "").localeCompare(String(a.opgeslagen || ""));
  });

  return json({ documenten });
}
