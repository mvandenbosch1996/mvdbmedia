// functions/api/login.js
// POST /api/login - verifieert wachtwoord, zet sessiecookie.
// Env vars: ADMIN_PASSWORD_HASH, ADMIN_PASSWORD_SALT, SESSION_SECRET.
// Optioneel: TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY (Cloudflare Turnstile).

import { verifyPassword, signSession, sessionCookie, SEVEN_DAYS } from "../_lib/auth.js";
import { isCrossSite, createLimiter, turnstileEnabled, verifyTurnstile, clientIp } from "../_lib/abuse.js";

// Mislukte pogingen per IP (in-memory per isolate, geen KV): na MAX_MISLUKT
// binnen het venster volgt een lockout; daarvoor een oplopende vertraging.
const MAX_MISLUKT = 5;
const VENSTER_MS = 15 * 60 * 1000;
const mislukt = createLimiter({ max: MAX_MISLUKT, windowMs: VENSTER_MS });

const MAX_BODY_BYTES = 4096;
const MAX_WACHTWOORD = 256;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json", ...headers },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = clientIp(request);

  if (!env.ADMIN_PASSWORD_HASH || !env.ADMIN_PASSWORD_SALT || !env.SESSION_SECRET) {
    return json({ error: "Server niet geconfigureerd." }, 500);
  }

  if (isCrossSite(request)) {
    return json({ error: "Verzoek geweigerd." }, 403);
  }

  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > MAX_BODY_BYTES) {
    return json({ error: "Ongeldig verzoek." }, 413);
  }

  // Lockout vóór het (dure) wachtwoord-hashen
  const lock = mislukt.check(ip);
  if (!lock.ok) {
    return json(
      { error: "Te veel mislukte pogingen. Probeer het later opnieuw." },
      429,
      { "Retry-After": String(lock.retryAfter) }
    );
  }

  let wachtwoord = "";
  let tsToken = "";
  const ct = request.headers.get("Content-Type") || "";
  try {
    if (ct.includes("application/json")) {
      const body = await request.json();
      wachtwoord = String(body.wachtwoord || "");
      tsToken = String(body.turnstile || "");
    } else {
      const form = await request.formData();
      wachtwoord = String(form.get("wachtwoord") || "");
      tsToken = String(form.get("cf-turnstile-response") || "");
    }
  } catch {
    return json({ error: "Ongeldig verzoek." }, 400);
  }

  if (wachtwoord.length > MAX_WACHTWOORD) {
    mislukt.hit(ip);
    return json({ error: "Onjuist wachtwoord." }, 401);
  }

  // Turnstile (alleen als geconfigureerd) — een mislukte controle telt als poging
  if (turnstileEnabled(env)) {
    const ts = await verifyTurnstile(env, tsToken, ip);
    if (!ts.ok) {
      mislukt.hit(ip);
      return json(
        { error: ts.reason === "unavailable"
            ? "Beveiligingscontrole tijdelijk niet beschikbaar. Probeer het zo opnieuw."
            : "Beveiligingscontrole mislukt. Ververs de pagina en probeer opnieuw." },
        ts.reason === "unavailable" ? 503 : 403
      );
    }
  }

  // Oplopende vertraging voor verificatie
  const eerder = mislukt.count(ip);
  if (eerder > 0) {
    await new Promise((r) => setTimeout(r, Math.min(eerder * 400, 4000)));
  }

  const ok = wachtwoord
    ? await verifyPassword(wachtwoord, env.ADMIN_PASSWORD_SALT, env.ADMIN_PASSWORD_HASH)
    : false;

  if (!ok) {
    mislukt.hit(ip);
    return json({ error: "Onjuist wachtwoord." }, 401);
  }

  mislukt.reset(ip);
  const token = await signSession({ exp: Date.now() + SEVEN_DAYS * 1000 }, env.SESSION_SECRET);
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token) });
}
