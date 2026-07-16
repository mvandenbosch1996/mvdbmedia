// functions/api/factuurnummer.js
// GET  /api/factuurnummer            -> reserveert en retourneert het volgende nummer
// POST /api/factuurnummer {nummer}   -> { bestaat: bool } (controleert of nummer al uitgegeven is)
// Vereist sessiecookie. Gebruikt KV-binding FACTUREN.

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

function jaar() { return new Date().getFullYear(); }
function formatteer(type, j, n) {
  const kern = `${j}-${String(n).padStart(3, "0")}`;
  return type === "offerte" ? `OFF-${kern}` : kern;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  const url = new URL(request.url);
  const type = url.searchParams.get("type") === "offerte" ? "offerte" : "factuur";

  const j = jaar();
  const tellerKey = type === "offerte" ? `offerteteller-${j}` : `factuurteller-${j}`;
  const huidig = parseInt((await env.FACTUREN.get(tellerKey)) || "0", 10);
  const volgend = huidig + 1;
  await env.FACTUREN.put(tellerKey, String(volgend));

  const nummer = formatteer(type, j, volgend);
  // Registreer als uitgegeven (individuele key per nummer = eenvoudige set).
  await env.FACTUREN.put(`uitgegeven-${nummer}`, "1");

  return json({ nummer });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  let nummer = "";
  try { nummer = String((await request.json()).nummer || "").trim(); }
  catch { return json({ error: "Ongeldig verzoek." }, 400); }
  if (!nummer) return json({ error: "Geen nummer opgegeven." }, 400);

  const bestaat = (await env.FACTUREN.get(`uitgegeven-${nummer}`)) !== null;
  return json({ bestaat });
}
