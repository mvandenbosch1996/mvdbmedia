// functions/api/turnstile.js
// GET /api/turnstile - geeft de publieke Turnstile-sitekey terug zodra
// Turnstile is geconfigureerd, anders {}. De secret verlaat de server nooit.

import { turnstileEnabled } from "../_lib/abuse.js";

export async function onRequestGet({ env }) {
  const body = turnstileEnabled(env) ? { sitekey: env.TURNSTILE_SITE_KEY } : {};
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
