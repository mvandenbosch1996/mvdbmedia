// functions/_lib/abuse.js
// Gedeelde anti-misbruik helpers voor /api/login en /api/intake.
// Draait in de Workers-runtime. Limiter-state leeft per isolate (geen KV nodig):
// dit is een extra laag naast de Cloudflare rate-limit-regel, geen vervanging.

// ---- Cross-site check ----
// Browsers sturen bij elke POST een Origin- en/of Sec-Fetch-Site-header mee.
// Alleen verzoeken waar die header expliciet op een andere site wijst worden
// geweigerd; ontbreken ze (curl, oudere clients) dan beslist de rest van de
// keten (rate limit, Turnstile).
export function isCrossSite(request) {
  const origin = request.headers.get("Origin");
  if (origin && origin !== "null") {
    try {
      return new URL(origin).host !== new URL(request.url).host;
    } catch {
      return true;
    }
  }
  if (origin === "null") return true;
  const site = request.headers.get("Sec-Fetch-Site");
  if (site) return site !== "same-origin" && site !== "none";
  return false;
}

// ---- Limiter (sliding window per sleutel) ----
export function createLimiter({ max, windowMs }) {
  const hits = new Map(); // key -> number[] (timestamps)

  function prune(now) {
    if (hits.size < 2000) return;
    for (const [k, list] of hits) {
      if (!list.length || now - list[list.length - 1] > windowMs) hits.delete(k);
    }
  }

  function recent(key, now) {
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    hits.set(key, list);
    return list;
  }

  return {
    // Zonder te tellen: is deze sleutel al geblokkeerd?
    check(key, now = Date.now()) {
      const list = recent(key, now);
      if (list.length >= max) {
        return { ok: false, retryAfter: Math.max(1, Math.ceil((list[0] + windowMs - now) / 1000)) };
      }
      return { ok: true, retryAfter: 0 };
    },
    count(key, now = Date.now()) {
      return recent(key, now).length;
    },
    // Een poging registreren.
    hit(key, now = Date.now()) {
      prune(now);
      recent(key, now).push(now);
    },
    reset(key) {
      hits.delete(key);
    },
  };
}

// ---- Cloudflare Turnstile ----
// Alleen actief als zowel TURNSTILE_SITE_KEY als TURNSTILE_SECRET_KEY gezet zijn
// (Cloudflare Pages -> Settings -> Variables and secrets). Zo kan een halve
// configuratie nooit het formulier of de login blokkeren.
export function turnstileEnabled(env) {
  return Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(env, token, ip) {
  if (!token || typeof token !== "string" || token.length > 2048) return { ok: false, reason: "missing" };
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (ip && ip !== "onbekend") body.set("remoteip", ip);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: ctrl.signal,
    });
    const data = await res.json();
    return data && data.success === true ? { ok: true } : { ok: false, reason: "rejected" };
  } catch {
    return { ok: false, reason: "unavailable" };
  } finally {
    clearTimeout(timer);
  }
}

export function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "onbekend";
}
