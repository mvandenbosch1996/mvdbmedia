// Cloudflare Pages Function — POST /api/intake
// Ontvangt het intakeformulier (multipart) en mailt het via Resend
// naar MVDBmedia, inclusief logobestand(en) als bijlage.
//
// Vereist in Cloudflare Pages → Settings → Environment variables:
//   RESEND_API_KEY  (verplicht)
//   INTAKE_TO       (optioneel, standaard info@mvdbmedia.nl)
//   INTAKE_FROM     (optioneel, standaard intake@mvdbmedia.nl — domein moet
//                    geverifieerd zijn in Resend)

const MAX_ATTACH_BYTES = 15 * 1024 * 1024; // 15 MB totaal

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RESEND_API_KEY) {
    return json({ error: "Server niet geconfigureerd (RESEND_API_KEY ontbreekt)." }, 500);
  }

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

  const summary = String(form.get("summary") || "").trim();
  const bedrijf = String(form.get("bedrijf") || "").trim();
  const email = String(form.get("email") || "").trim();

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
    total += entry.size;
    if (total > MAX_ATTACH_BYTES) {
      return json({ error: "Logobestand(en) te groot — maximaal 15 MB totaal." }, 413);
    }
    const buf = await entry.arrayBuffer();
    attachments.push({
      filename: sanitizeFilename(entry.name || "logo"),
      content: toBase64(buf),
    });
  }

  const payload = {
    from: env.INTAKE_FROM || "MVDBmedia Intake <intake@mvdbmedia.nl>",
    to: [env.INTAKE_TO || "info@mvdbmedia.nl"],
    subject: "Website intake" + (bedrijf ? " — " + bedrijf : ""),
    text: summary,
  };
  if (attachments.length) payload.attachments = attachments;
  if (isEmail(email)) payload.reply_to = email;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

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
