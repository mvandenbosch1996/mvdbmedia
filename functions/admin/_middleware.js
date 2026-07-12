// functions/admin/_middleware.js
// Beschermt elke /admin/*-route (behalve de loginpagina zelf) server-side.

import { parseCookie, verifySession } from "../_lib/auth.js";

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Loginpagina is publiek toegankelijk.
  if (url.pathname === "/admin/login" || url.pathname === "/admin/login/") {
    return next();
  }

  const token = parseCookie(request.headers.get("Cookie"));
  const payload = env.SESSION_SECRET ? await verifySession(token, env.SESSION_SECRET) : null;

  if (!payload) {
    return Response.redirect(`${url.origin}/admin/login/`, 302);
  }
  return next();
}
