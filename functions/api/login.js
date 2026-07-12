// functions/api/login.js
// POST /api/login - verifieert wachtwoord, zet sessiecookie.
// Env vars: ADMIN_PASSWORD_HASH, ADMIN_PASSWORD_SALT, SESSION_SECRET.

import { verifyPassword, signSession, sessionCookie, SEVEN_DAYS } from "../_lib/auth.js";

// Oplopende vertraging per IP (in-memory per isolate, geen KV).
const pogingen = new Map(); // ip -> { count, ts }
const VENSTER_MS = 15 * 60 * 1000;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json", ...headers },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get("CF-Connecting-IP") || "onbekend";

  if (!env.ADMIN_PASSWORD_HASH || !env.ADMIN_PASSWORD_SALT || !env.SESSION_SECRET) {
    return json({ error: "Server niet geconfigureerd." }, 500);
  }

  let wachtwoord = "";
  const ct = request.headers.get("Content-Type") || "";
  try {
    if (ct.includes("application/json")) {
      wachtwoord = String((await request.json()).wachtwoord || "");
    } else {
      wachtwoord = String((await request.formData()).get("wachtwoord") || "");
    }
  } catch {
    return json({ error: "Ongeldig verzoek." }, 400);
  }

  // Oplopende vertraging voor verificatie
  const nu = Date.now();
  const rec = pogingen.get(ip);
  if (rec && nu - rec.ts < VENSTER_MS && rec.count > 0) {
    const delay = Math.min(rec.count * 400, 4000);
    await new Promise((r) => setTimeout(r, delay));
  }

  const ok = wachtwoord
    ? await verifyPassword(wachtwoord, env.ADMIN_PASSWORD_SALT, env.ADMIN_PASSWORD_HASH)
    : false;

  if (!ok) {
    const prev = rec && nu - rec.ts < VENSTER_MS ? rec.count : 0;
    pogingen.set(ip, { count: prev + 1, ts: nu });
    return json({ error: "Onjuist wachtwoord." }, 401);
  }

  pogingen.delete(ip);
  const token = await signSession({ exp: nu + SEVEN_DAYS * 1000 }, env.SESSION_SECRET);
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token) });
}
