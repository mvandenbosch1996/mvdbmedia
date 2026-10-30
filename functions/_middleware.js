// functions/_middleware.js
// Geeft 404 voor interne bestanden (tooling, scripts, docs) die anders als
// statische bestanden zouden worden meegeserveerd. Alleen de paden uit
// _routes.json komen hier langs; houd beide lijsten gelijk.

const BLOCKED_FILES = new Set([
  "/package.json",
  "/package-lock.json",
  "/claude.md",
  "/audit.mjs",
  "/serve.mjs",
  "/indexnow.mjs",
  "/convert-webp.mjs",
  "/perf-pass2.mjs",
  "/update-html-webp.mjs",
  "/download_instagram.py",
  "/_live-check.mjs",
  "/screenshot.mjs",
  "/screenshot-compare.mjs",
  "/screenshot-contact-mobile.mjs",
  "/screenshot-contact-noani.mjs",
  "/screenshot-element.mjs",
  "/screenshot-features.mjs",
  "/screenshot-form-vraag.mjs",
  "/screenshot-form.mjs",
  "/screenshot-mobile-audit.mjs",
  "/screenshot-mobile-zoom.mjs",
  "/screenshot-mobile.mjs",
  "/.dev.vars",
]);

const BLOCKED_PREFIXES = [
  "/scripts/",
  "/docs/",
  "/.cursor/",
  "/.claude/",
  "/.superpowers/",
  "/.wrangler/",
  "/.playwright-mcp/",
];

function isBlocked(pathname) {
  let p;
  try {
    p = decodeURIComponent(pathname).toLowerCase();
  } catch {
    return true;
  }
  if (BLOCKED_FILES.has(p)) return true;
  if (/^\/_wrangler\d*\.log$/.test(p)) return true;
  return BLOCKED_PREFIXES.some((prefix) => p.startsWith(prefix) || p === prefix.slice(0, -1));
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const { pathname } = new URL(request.url);

  if (isBlocked(pathname)) {
    return env.ASSETS.fetch(new URL("/__niet-gevonden__", request.url));
  }
  return next();
}
