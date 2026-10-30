// Controleert de LIVE site na een deploy (headers, 404's, redirects, CSP).
//   node scripts/check-live.mjs [https://mvdbmedia.nl]
// Cache-buster op elke request: Cloudflare Pages heeft 1-2 minuten propagatie na een push.
const BASE = (process.argv[2] || 'https://mvdbmedia.nl').replace(/\/$/, '');
const failures = [];
const bust = (p) => `${BASE}${p}${p.includes('?') ? '&' : '?'}x=${Math.random().toString(36).slice(2)}`;
const get = (p, opts = {}) => fetch(bust(p), { redirect: 'manual', ...opts });
const check = (cond, msg) => { console.log(`${cond ? 'ok' : 'xx'}  ${msg}`); if (!cond) failures.push(msg); };

// Security headers + CSP op de homepage
const home = await get('/');
check(home.status === 200, `/ geeft 200 (was ${home.status})`);
const csp = home.headers.get('content-security-policy') ?? '';
check(csp && !csp.includes(','), 'precies één CSP-header op /');
const script = /script-src([^;]*)/.exec(csp)?.[1] ?? '';
check(!/unsafe-inline|unsafe-eval/.test(script), `script-src zonder unsafe-inline/eval (${script.trim()})`);
for (const [h, re] of [['strict-transport-security', /max-age=\d{7,}/], ['x-content-type-options', /nosniff/], ['referrer-policy', /./], ['x-frame-options', /SAMEORIGIN|DENY/], ['permissions-policy', /./]]) {
  check(re.test(home.headers.get(h) ?? ''), `header ${h}`);
}

// Scripts staan extern en laden
const html = await home.text();
// Cloudflare Bot Fight Mode (JavaScript detections) injecteert aan de edge een inline loader (__CF$cv$params).
// Onze CSP blokkeert die: uitzetten via dashboard > Security > Settings > Bot traffic > JavaScript detections.
const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
const own = inline.filter((s) => !s.includes('__CF$cv$params'));
check(own.length === 0, 'homepage bevat geen eigen inline <script>');
if (inline.length > own.length) console.log('!!  Cloudflare JS-detections inline script aanwezig (geblokkeerd door CSP, console-error). Zet "JavaScript detections" uit in het dashboard.');
const ui = await get('/js/ui.js');
check(ui.status === 200 && /javascript/.test(ui.headers.get('content-type') ?? ''), '/js/ui.js 200 + javascript content-type');

// Turnstile-pagina's: precies 1 CSP (de ! override moet werken)
for (const p of ['/intake/', '/admin/login/']) {
  const r = await get(p);
  const c = r.headers.get('content-security-policy') ?? '';
  check(r.status === 200 && c && !c.includes(',') && c.includes('challenges.cloudflare.com'), `${p}: 200, 1 CSP-header mét Turnstile-host`);
  check(!/unsafe-inline/.test(/script-src([^;]*)/.exec(c)?.[1] ?? ''), `${p}: script-src zonder unsafe-inline`);
}

// Afgeschermde bestanden en 404's
for (const p of ['/package.json', '/CLAUDE.md', '/audit.mjs', '/scripts/check.mjs', '/docs/x', '/_headers', '/zeker-niet-bestaand-' + Date.now()]) {
  const r = await get(p);
  check(r.status === 404, `${p} → 404 (was ${r.status})`);
}
const admin = await get('/admin/factuur/');
check(admin.status === 302, `/admin/factuur/ zonder sessie → 302 (was ${admin.status})`);
const api = await get('/api/klanten');
check(api.status === 401, `/api/klanten zonder sessie → 401 (was ${api.status})`);

// Redirects
const idx = await get('/index.html');
check(idx.status === 301 && new URL(idx.headers.get('location') ?? '', BASE).pathname === '/', '/index.html → 301 → /');

// Sitemap
const sm = await get('/sitemap.xml');
const smText = await sm.text();
check(sm.status === 200 && smText.includes('xmlns:image'), 'sitemap.xml 200 met image-namespace');
const urls = [...smText.matchAll(/<loc>(https:\/\/mvdbmedia\.nl[^<]*)<\/loc>/g)].map((m) => m[1]);
let bad = 0;
for (const u of urls) {
  const r = await fetch(u.replace('https://mvdbmedia.nl', BASE) + '?x=1', { redirect: 'manual' });
  if (r.status !== 200) { bad++; console.log(`xx  ${u} → ${r.status}`); }
}
check(bad === 0, `alle ${urls.length} sitemap-URL's geven 200`);

console.log(failures.length ? `\n${failures.length} FOUT(EN)` : '\nAlles OK');
process.exit(failures.length ? 1 : 0);
