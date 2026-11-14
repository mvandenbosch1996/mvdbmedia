// functions/api/bon.js
// Bijlagen (factuur/bon als PDF of foto) bij kostenposten, opgeslagen in KV (namespace FACTUREN, key "bon-<uuid>").
// POST   /api/bon (ruwe bestandsbytes)  -> { url, type, size }   bestand wordt op magic bytes gecontroleerd
// GET    /api/bon?id=<uuid>             -> het bestand (inline)
// DELETE /api/bon?id=<uuid>             -> verwijdert een net geüpload, nog niet gekoppeld bestand (max. 15 min oud)
// Vereist sessiecookie. Het Content-Type van de client wordt genegeerd; het type volgt uit de bestandsinhoud.

import { parseCookie, verifySession } from "../_lib/auth.js";
import { isCrossSite } from "../_lib/abuse.js";
import { BON_ID_RE, bonUrl } from "../_lib/boekhouding.js";

const MAX_BYTES = 4 * 1024 * 1024;
const VERWIJDER_VENSTER_MS = 15 * 60 * 1000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

async function geautoriseerd(request, env) {
  const token = parseCookie(request.headers.get("Cookie"));
  return env.SESSION_SECRET && (await verifySession(token, env.SESSION_SECRET));
}

function typeVanBytes(b) {
  const is = (...bytes) => bytes.every((v, i) => b[i] === v);
  if (is(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (is(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (is(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (is(0x25, 0x50, 0x44, 0x46, 0x2d)) return "application/pdf";
  return null;
}

const idUitRequest = (request) => {
  const id = new URL(request.url).searchParams.get("id") || "";
  return BON_ID_RE.test(id) ? id : null;
};

export async function onRequestPost({ request, env }) {
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);
  if (isCrossSite(request)) return json({ error: "Verzoek geweigerd." }, 403);

  if (Number(request.headers.get("Content-Length") || 0) > MAX_BYTES) return json({ error: "Bestand is te groot (max. 4 MB)." }, 413);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength === 0) return json({ error: "Leeg bestand." }, 400);
  if (bytes.byteLength > MAX_BYTES) return json({ error: "Bestand is te groot (max. 4 MB)." }, 413);

  const type = typeVanBytes(bytes);
  if (!type) return json({ error: "Alleen PDF, JPG, PNG of WebP is toegestaan." }, 415);

  const id = crypto.randomUUID();
  await env.FACTUREN.put(`bon-${id}`, bytes, { metadata: { type, size: bytes.byteLength, ts: Date.now() } });
  return json({ url: bonUrl(id), type, size: bytes.byteLength });
}

export async function onRequestGet({ request, env }) {
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);
  const id = idUitRequest(request);
  if (!id) return json({ error: "Ongeldig verzoek." }, 400);

  const { value, metadata } = await env.FACTUREN.getWithMetadata(`bon-${id}`, { type: "arrayBuffer" });
  if (!value) return json({ error: "Bestand niet gevonden." }, 404);
  const type = metadata && ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(metadata.type) ? metadata.type : "application/octet-stream";
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" }[type] || "bin";

  const headers = {
    "Content-Type": type,
    "Content-Disposition": `inline; filename="bon-${id.slice(0, 8)}.${ext}"`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };
  // Een strikte CSP (object-src 'none') blokkeert de ingebouwde PDF-viewer van Chrome, dus alleen voor afbeeldingen.
  if (type.startsWith("image/")) headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'";
  return new Response(value, { headers });
}

export async function onRequestDelete({ request, env }) {
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);
  if (isCrossSite(request)) return json({ error: "Verzoek geweigerd." }, 403);
  const id = idUitRequest(request);
  if (!id) return json({ error: "Ongeldig verzoek." }, 400);

  const { value, metadata } = await env.FACTUREN.getWithMetadata(`bon-${id}`, { type: "arrayBuffer" });
  if (!value) return json({ ok: true });
  if (!metadata || !metadata.ts || Date.now() - metadata.ts > VERWIJDER_VENSTER_MS) return json({ error: "Alleen een net geüpload bestand kan hier worden verwijderd." }, 403);
  await env.FACTUREN.delete(`bon-${id}`);
  return json({ ok: true });
}
