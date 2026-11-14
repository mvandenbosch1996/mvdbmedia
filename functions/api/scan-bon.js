// functions/api/scan-bon.js
// Slimme scan: leest een factuur of bon (PDF, JPG, PNG of WebP) uit met Claude, voor het formulier "Kosten / bon toevoegen".
// POST /api/scan-bon (ruwe bestandsbytes) -> { datum, omschrijving, bedrag_excl_btw, btw_type, btw_bedrag, waarschuwingen }
// Vereist sessiecookie en de environment variable ANTHROPIC_API_KEY. Er wordt niets opgeslagen: het bestand gaat
// alleen naar de Claude API en de client vult het formulier in; opslaan gaat daarna via /api/boekhouding.
// Bewust één fetch-aanroep naar de Messages API en geen SDK: de SDK maakt de gedeelde Functions-bundel 20x groter.

import { parseCookie, verifySession } from "../_lib/auth.js";
import { createLimiter, isCrossSite } from "../_lib/abuse.js";
import { SCAN_MAX_BYTES, SCAN_MODEL, SCAN_SCHEMA, SCAN_SYSTEEM, scanBase64, scanTypeVanBytes, schoonScan } from "../_lib/scan-bon.js";

const API_URL = "https://api.anthropic.com/v1/messages";
const TIMEOUT_MS = 60_000;

// Elke scan kost API-tegoed; extra rem naast de sessie (per isolate, net als bij login en intake).
const limiter = createLimiter({ max: 30, windowMs: 10 * 60 * 1000 });

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

async function geautoriseerd(request, env) {
  const token = parseCookie(request.headers.get("Cookie"));
  return env.SESSION_SECRET && (await verifySession(token, env.SESSION_SECRET));
}

// Upstream-fouten krijgen nooit status 401: de client stuurt bij 401 door naar de loginpagina.
async function upstreamFout(res) {
  const body = await res.json().catch(() => ({}));
  console.error("scan-bon: Claude API gaf", res.status, body && body.error && body.error.type);
  if (res.status === 429) return json({ error: "De scan-dienst is even overbelast. Probeer het zo opnieuw." }, 429);
  if (res.status === 529 || res.status >= 500) return json({ error: "De scan-dienst is tijdelijk niet bereikbaar. Probeer het zo opnieuw." }, 503);
  return json({ error: "De slimme scan is nu niet beschikbaar. Controleer ANTHROPIC_API_KEY en het tegoed in de Anthropic-console." }, 502);
}

export async function onRequestPost({ request, env }) {
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.ANTHROPIC_API_KEY) return json({ error: "De slimme scan is niet ingesteld (ANTHROPIC_API_KEY ontbreekt in Cloudflare)." }, 503);
  if (isCrossSite(request)) return json({ error: "Verzoek geweigerd." }, 403);

  if (Number(request.headers.get("Content-Length") || 0) > SCAN_MAX_BYTES) return json({ error: "Bestand is te groot (max. 4 MB)." }, 413);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength === 0) return json({ error: "Leeg bestand." }, 400);
  if (bytes.byteLength > SCAN_MAX_BYTES) return json({ error: "Bestand is te groot (max. 4 MB)." }, 413);

  const type = scanTypeVanBytes(bytes);
  if (!type) return json({ error: "Alleen PDF, JPG, PNG of WebP kan worden uitgelezen." }, 415);

  if (!limiter.check("scan").ok) return json({ error: "Te veel scans achter elkaar. Probeer het over een paar minuten opnieuw." }, 429);
  limiter.hit("scan");

  const data = scanBase64(bytes);
  const bestand = type === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: type, data } }
    : { type: "image", source: { type: "base64", media_type: type, data } };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: SCAN_MODEL,
        max_tokens: 6000,
        thinking: { type: "adaptive" },
        output_config: { effort: "medium", format: { type: "json_schema", schema: SCAN_SCHEMA } },
        system: SCAN_SYSTEEM,
        messages: [{ role: "user", content: [bestand, { type: "text", text: "Read this document and return the fields." }] }],
      }),
      signal: ctrl.signal,
    });
  } catch {
    return json({ error: "De slimme scan kon geen verbinding maken of duurde te lang. Probeer het opnieuw." }, 504);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) return upstreamFout(res);

  const antwoord = await res.json().catch(() => null);
  const blok = antwoord && Array.isArray(antwoord.content) ? antwoord.content.find((b) => b.type === "text") : null;
  if (!blok || antwoord.stop_reason === "refusal" || antwoord.stop_reason === "max_tokens") {
    return json({ error: "Dit document kon niet worden uitgelezen." }, 422);
  }
  let raw;
  try {
    raw = JSON.parse(blok.text);
  } catch {
    return json({ error: "Het antwoord van de scan was onleesbaar." }, 422);
  }
  const schoon = schoonScan(raw);
  if (!schoon.ok) return json({ error: schoon.error }, 422);
  return json(schoon.resultaat);
}
