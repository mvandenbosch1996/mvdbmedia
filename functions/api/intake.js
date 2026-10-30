// Cloudflare Pages Function — POST /api/intake
// Ontvangt het intakeformulier (multipart) en mailt het via Resend
// naar MVDBmedia, inclusief logobestand(en) als bijlage.
//
// Vereist in Cloudflare Pages → Settings → Environment variables:
//   RESEND_API_KEY  (verplicht)
//   INTAKE_TO       (optioneel, standaard info@mvdbmedia.nl)
//   INTAKE_FROM     (optioneel, standaard intake@mvdbmedia.nl — domein moet
//                    geverifieerd zijn in Resend)
//   TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY  (optioneel; beide zetten
//                    activeert Cloudflare Turnstile op dit formulier)

import { isCrossSite, createLimiter, turnstileEnabled, verifyTurnstile, clientIp } from "../_lib/abuse.js";

// Per IP (in-memory per isolate): extra laag naast de Cloudflare rate-limit-regel.
const verzoeken = createLimiter({ max: 8, windowMs: 60 * 60 * 1000 });

const MAX_ATTACH_BYTES = 15 * 1024 * 1024; // 15 MB totaal
const MAX_ATTACH_COUNT = 5; // max aantal logobestanden
// Toegestane logobestanden: afbeeldingen + vector/ontwerpformaten
const ALLOWED_EXT = /\.(png|jpe?g|webp|gif|svg|pdf|ai|eps)$/i;
const MAX_BODY_BYTES = MAX_ATTACH_BYTES + 1024 * 1024; // bijlagen + formuliertekst

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RESEND_API_KEY) {
    return json({ error: "Server niet geconfigureerd (RESEND_API_KEY ontbreekt)." }, 500);
  }

  if (isCrossSite(request)) {
    return json({ error: "Verzoek geweigerd." }, 403);
  }

  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > MAX_BODY_BYTES) {
    return json({ error: "Het formulier is te groot." }, 413);
  }

  const ip = clientIp(request);
  const limiet = verzoeken.check(ip);
  if (!limiet.ok) {
    return json(
      { error: "Te veel verzoeken — probeer het later opnieuw." },
      429,
      { "Retry-After": String(limiet.retryAfter) }
    );
  }
  verzoeken.hit(ip);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Ongeldig verzoek." }, 400);
  }

  // Honeypot: onzichtbaar veld dat mensen leeg laten, bots vullen het in.
  if (form.get("website_hp")) {
    return json({ ok: true }); // spam stilletjes accepteren
  }

  // Turnstile (alleen als geconfigureerd)
  if (turnstileEnabled(env)) {
    const ts = await verifyTurnstile(env, String(form.get("cf-turnstile-response") || ""), ip);
    if (!ts.ok) {
      return json(
        { error: ts.reason === "unavailable"
            ? "Beveiligingscontrole tijdelijk niet beschikbaar — probeer het zo opnieuw."
            : "Beveiligingscontrole mislukt — ververs de pagina en probeer opnieuw." },
        ts.reason === "unavailable" ? 503 : 403
      );
    }
  }

  const summary = String(form.get("summary") || "").trim();
  // bedrijf gaat in de mail-subject: newlines strippen + lengte begrenzen
  const bedrijf = String(form.get("bedrijf") || "").replace(/[\r\n]+/g, " ").trim().slice(0, 200);
  const email = String(form.get("email") || "").trim().slice(0, 254);

  if (!summary) {
    return json({ error: "Het formulier is leeg." }, 400);
  }
  if (summary.length > 100_000) {
    return json({ error: "Het formulier is te groot." }, 413);
  }

  // Bijlagen (logobestanden) verzamelen
  const attachments = [];
  let total = 0;
  for (const entry of form.getAll("logo")) {
    if (typeof entry === "string" || !entry || !entry.size) continue;
    if (attachments.length >= MAX_ATTACH_COUNT) {
      return json({ error: `Te veel bestanden — maximaal ${MAX_ATTACH_COUNT} logobestanden.` }, 413);
    }
    const name = entry.name || "logo";
    if (!ALLOWED_EXT.test(name)) {
      return json({ error: "Bestandstype niet toegestaan — alleen afbeeldingen (PNG, JPG, WebP, GIF, SVG) of ontwerpbestanden (PDF, AI, EPS)." }, 415);
    }
    total += entry.size;
    if (total > MAX_ATTACH_BYTES) {
      return json({ error: "Logobestand(en) te groot — maximaal 15 MB totaal." }, 413);
    }
    const buf = await entry.arrayBuffer();
    attachments.push({
      filename: sanitizeFilename(name),
      content: toBase64(buf),
    });
  }

  const payload = {
    from: env.INTAKE_FROM || "MVDBmedia Intake <intake@mvdbmedia.nl>",
    to: [env.INTAKE_TO || "info@mvdbmedia.nl"],
    subject: "Website intake" + (bedrijf ? " — " + bedrijf : ""),
    html: renderHtml(summary, bedrijf, email),
    text: summary,
  };
  if (attachments.length) payload.attachments = attachments;
  if (isEmail(email)) payload.reply_to = email;

  // try/catch: netwerkfout naar Resend mag geen kale 500-pagina opleveren
  let res;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Resend fetch failed:", err);
    return json({ error: "Versturen mislukt — probeer het later opnieuw." }, 502);
  }

  if (!res.ok) {
    console.error("Resend error:", res.status, await res.text());
    return json({ error: "Versturen mislukt — probeer het later opnieuw." }, 502);
  }

  return json({ ok: true });
}

// Andere methodes netjes afwijzen
export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return json({ error: "Method not allowed" }, 405);
}

/* ---------- helpers ---------- */

// Zet de platte-tekst samenvatting om naar een nette HTML-mail.
// Structuur van summary:
//   regel 1: "WEBSITE INTAKE — MVDBmedia"
//   regel 2: "Ingevuld op: <datum>"
//   daarna per sectie:  "=== TITEL ===", gevolgd door "label: waarde" regels
function renderHtml(summary, bedrijf, email) {
  const lines = String(summary).split("\n");
  let ingevuld = "";
  const sections = []; // { title, rows: [{label, value}] }
  let current = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("WEBSITE INTAKE")) continue;
    if (/^Ingevuld op:/i.test(line)) {
      ingevuld = line.replace(/^Ingevuld op:\s*/i, "").trim();
      continue;
    }
    const sec = line.match(/^===\s*(.*?)\s*===$/);
    if (sec) {
      current = { title: sec[1], rows: [] };
      sections.push(current);
      continue;
    }
    const idx = line.indexOf(":");
    const row = idx > -1
      ? { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() }
      : { label: "", value: line };
    if (current) current.rows.push(row);
  }

  const GOLD = "#c4a96e";
  const INK = "#1c1915";
  const MUTED = "#6b6459";
  const LINE = "#e7e2d8";
  const BG = "#f4f1ea";

  const sectionsHtml = sections.map((s) => {
    const rows = s.rows.map((r) => {
      if (!r.label) {
        return `<tr><td colspan="2" style="padding:8px 0;color:${INK};font-size:15px;line-height:1.6;">${esc(r.value)}</td></tr>`;
      }
      return `<tr>
        <td style="padding:8px 16px 8px 0;color:${MUTED};font-size:13px;vertical-align:top;white-space:nowrap;">${esc(r.label)}</td>
        <td style="padding:8px 0;color:${INK};font-size:15px;line-height:1.5;">${esc(r.value)}</td>
      </tr>`;
    }).join("");
    return `
      <tr><td style="padding:28px 0 0;">
        <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${GOLD};border-bottom:2px solid ${GOLD};padding-bottom:6px;margin-bottom:4px;">${esc(s.title)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>
      </td></tr>`;
  }).join("");

  const meta = [
    bedrijf ? `<strong style="color:#ffffff;">${esc(bedrijf)}</strong>` : "",
    isEmail(email) ? `<a href="mailto:${esc(email)}" style="color:${GOLD};text-decoration:none;">${esc(email)}</a>` : "",
    ingevuld ? `Ingevuld op ${esc(ingevuld)}` : "",
  ].filter(Boolean).join(" &nbsp;·&nbsp; ");

  return `<!doctype html><html><body style="margin:0;padding:0;background:${BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:12px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="background:#161411;padding:24px 32px;">
          <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.02em;">Website intake — <span style="color:${GOLD};">MVDBmedia</span></div>
          ${meta ? `<div style="color:#b9b1a2;font-size:13px;margin-top:6px;">${meta}</div>` : ""}
        </td></tr>
        <tr><td style="padding:8px 32px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${sectionsHtml}</table>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#faf8f3;border-top:1px solid ${LINE};color:${MUTED};font-size:12px;">
          Ingevuld via het intakeformulier op mvdbmedia.nl. Reageren gaat rechtstreeks naar de aanvrager.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function sanitizeFilename(name) {
  return name.replace(/[^\w.\- ()]/g, "_").slice(0, 120);
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
