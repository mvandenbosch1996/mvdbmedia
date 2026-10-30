// Statische bewaking van de site: geen dependencies, geen browser, < 2 seconden.
//   node scripts/check.mjs          (= npm run check)
// Exit 1 bij een fout; waarschuwingen blokkeren niet. Draait ook in GitHub Actions.
// Browser-test met echte CSP: node scripts/csp-smoke.mjs (vereist wrangler pages dev).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://mvdbmedia.nl';
const errors = [];
const warnings = [];
const err = (group, msg) => errors.push(`[${group}] ${msg}`);
const warn = (group, msg) => warnings.push(`[${group}] ${msg}`);
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// ---------- pagina's verzamelen ----------
const SKIP_DIRS = new Set(['node_modules', '.git', 'temporary screenshots', '.playwright-mcp', '.superpowers', '.claude', 'docs', 'fotos', 'fonts', '.wrangler']);
const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) walk(rel);
    else if (e.name.endsWith('.html') && !/^google[0-9a-f]+\.html$/.test(e.name)) pages.push(rel);
  }
})('');

const urlOf = (file) => {
  if (file === 'index.html') return '/';
  if (file.endsWith('/index.html')) return '/' + file.slice(0, -'/index.html'.length);
  return '/' + file.replace(/\.html$/, '');
};

const stripScripts = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
const attr = (tag, name) => new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag)?.[1];

const info = new Map();
for (const file of pages) {
  const html = read(file);
  const body = stripScripts(html);
  info.set(file, {
    file,
    url: urlOf(file),
    html,
    body,
    isAdmin: file.startsWith('admin/'),
    noindex: /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html),
    title: /<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim(),
    description: /<meta\s+name="description"\s+content="([^"]*)"/i.exec(html)?.[1],
    canonical: /<link\s+rel="canonical"\s+href="([^"]*)"/i.exec(html)?.[1],
    ids: new Set([...body.matchAll(/\s(?:id|name)="([^"]+)"/g)].map((m) => m[1])),
  });
}

// ---------- _headers / CSP ----------
const headers = read('_headers');
const cspLines = headers.split(/\r?\n/).filter((l) => /^\s*Content-Security-Policy:/i.test(l));
if (cspLines.length === 0) err('csp', '_headers bevat geen Content-Security-Policy');
cspLines.forEach((line, i) => {
  const dir = (name) => new RegExp(`(?:^|[:;]\\s*)${name}\\s+([^;]*)`).exec(line)?.[1] ?? '';
  const script = dir('script-src');
  if (/'unsafe-inline'|'unsafe-eval'/.test(script)) err('csp', `CSP #${i + 1}: script-src bevat unsafe-inline/unsafe-eval (${script.trim()})`);
  if (!/'none'/.test(dir('object-src'))) err('csp', `CSP #${i + 1}: object-src 'none' ontbreekt`);
  if (!/'self'/.test(dir('base-uri'))) err('csp', `CSP #${i + 1}: base-uri 'self' ontbreekt`);
  if (!dir('frame-ancestors')) err('csp', `CSP #${i + 1}: frame-ancestors ontbreekt`);
  if (!dir('default-src')) err('csp', `CSP #${i + 1}: default-src ontbreekt`);
  if (/https?:\/\/(?!challenges\.cloudflare\.com|static\.cloudflareinsights\.com|cloudflareinsights\.com|formspree\.io|mvdbmedia\.nl)/.test(line)) {
    warn('csp', `CSP #${i + 1}: onbekende externe host in beleid — bewust?`);
  }
});

// ---------- _redirects ----------
const redirects = new Set(
  read('_redirects').split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => l.trim().split(/\s+/)[0]),
);

// ---------- JS-functies per script ----------
const fnCache = new Map();
function definedFunctions(scriptUrl) {
  const rel = scriptUrl.replace(/^\//, '');
  if (fnCache.has(rel)) return fnCache.get(rel);
  const set = new Set();
  if (exists(rel)) {
    const js = read(rel);
    for (const m of js.matchAll(/(?:^|[^.\w$])function\s+([A-Za-z_$][\w$]*)/g)) set.add(m[1]);
    for (const m of js.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)) set.add(m[1]);
    for (const m of js.matchAll(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\()/gm)) set.add(m[1]);
  }
  fnCache.set(rel, set);
  return set;
}

// ---------- link-resolutie ----------
function resolvesToTarget(p) {
  const clean = decodeURIComponent(p.replace(/\/$/, '')) || '/';
  if (clean === '/') return 'index.html';
  const rel = clean.slice(1);
  for (const cand of [rel, `${rel}.html`, `${rel}/index.html`]) {
    if (exists(cand) && fs.statSync(path.join(ROOT, cand)).isFile()) return cand;
  }
  return null;
}

// ---------- per pagina ----------
const titles = new Map();
const descs = new Map();
for (const p of info.values()) {
  const g = p.file;
  const { html, body } = p;

  // CSP-compliantie in markup
  const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter((m) => !/\bsrc=/.test(m[1]) && !/application\/(ld\+)?json/.test(m[1]));
  if (inlineScripts.length) err('csp', `${g}: ${inlineScripts.length} inline <script> (CSP staat dat niet toe)`);
  const handlers = [...body.matchAll(/<[a-zA-Z][^<>]*?\s(on[a-z]+)\s*=/g)].map((m) => m[1]);
  if (handlers.length) err('csp', `${g}: inline event-handler(s) ${[...new Set(handlers)].join(', ')} — gebruik data-a-*/data-s-* (zie js/ui.js)`);
  if (/(?:href|src|action)\s*=\s*"\s*javascript:/i.test(body)) err('csp', `${g}: javascript:-URL`);

  // ui.js-koppeling
  const usesBridge = /\sdata-(?:a|s)-[a-z]+=/.test(body);
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)].map((m) => m[1]);
  if (usesBridge && !scripts.includes('/js/ui.js')) err('csp', `${g}: gebruikt data-a-*/data-s-* maar laadt /js/ui.js niet`);
  const defined = new Set(scripts.flatMap((s) => [...definedFunctions(s)]));
  for (const m of body.matchAll(/\sdata-a-[a-z]+="([^"]+)"/g)) {
    if (!m[1].startsWith('@') && !defined.has(m[1])) err('js', `${g}: data-a-* verwijst naar onbekende functie "${m[1]}"`);
  }
  for (const m of body.matchAll(/\sdata-args-[a-z]+='([^']*)'/g)) {
    try { JSON.parse(m[1]); } catch { err('js', `${g}: ongeldige data-args JSON: ${m[1]}`); }
  }

  // externe resources moeten bestaan
  const refs = [
    ...[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)].map((m) => m[1]),
    ...[...html.matchAll(/<link\b[^>]*\bhref="([^"]+)"/gi)].filter((m) => !/rel="(?:canonical|alternate)"/i.test(m[0])).map((m) => m[1]),
    ...[...body.matchAll(/<img\b[^>]*?\ssrc="([^"]+)"/gi)].map((m) => m[1]),
    ...[...body.matchAll(/<source\b[^>]*?\ssrcset="([^"]+)"/gi)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0])),
    ...[...body.matchAll(/<img\b[^>]*?\ssrcset="([^"]+)"/gi)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0])),
  ];
  for (const r of new Set(refs)) {
    if (/^(https?:|data:|mailto:|tel:|#)/.test(r)) continue;
    const abs = r.startsWith('/') ? r : path.posix.join(path.posix.dirname('/' + g), r);
    let onDisk;
    try { onDisk = decodeURIComponent(abs.split('?')[0]); } catch { err('links', `${g}: ongeldige URL ${r}`); continue; }
    if (!exists(onDisk.slice(1))) err('assets', `${g}: bestand ontbreekt: ${r}`);
  }
  for (const m of html.matchAll(/<(?:script|link|img)\b[^>]*(?:src|href)="(http:\/\/[^"]+)"/gi)) err('security', `${g}: http:// (onversleuteld) resource ${m[1]}`);

  // interne links
  for (const m of body.matchAll(/<a\b[^>]*?\shref="([^"]*)"/gi)) {
    const href = m[1];
    if (!href || /^(https?:|mailto:|tel:|data:|javascript:)/.test(href)) continue;
    const [pathPart, frag] = href.split('#');
    const targetPath = pathPart === '' ? p.url : pathPart.split('?')[0];
    if (!targetPath.startsWith('/')) { warn('links', `${g}: relatieve link ${href}`); continue; }
    const target = resolvesToTarget(targetPath);
    if (!target && !redirects.has(targetPath)) { err('links', `${g}: dode interne link ${href}`); continue; }
    if (frag && target?.endsWith('.html')) {
      const tinfo = info.get(target);
      if (tinfo && !tinfo.ids.has(frag)) err('links', `${g}: anker #${frag} bestaat niet op ${targetPath}`);
    }
    if (/^\/index(\.html)?$/.test(targetPath)) warn('links', `${g}: link naar ${href} i.p.v. /`);
    if (/\.html$/.test(targetPath) && target?.endsWith('.html')) warn('links', `${g}: link met .html (${href}), gebruik clean URL`);
  }
  for (const m of body.matchAll(/<a\b[^>]*\btarget="_blank"[^>]*>/gi)) {
    if (!/rel="[^"]*noopener/i.test(m[0])) err('security', `${g}: target=_blank zonder rel=noopener`);
  }

  // a11y / structuur
  for (const m of body.matchAll(/<img\b[^>]*>/gi)) if (!/\salt\s*=/.test(m[0])) err('a11y', `${g}: <img> zonder alt (${attr(m[0], 'src')})`);
  const mains = (body.match(/<main\b/gi) || []).length;
  if (mains !== 1) err('a11y', `${g}: ${mains}× <main> (verwacht 1)`);
  const h1s = (body.match(/<h1\b/gi) || []).length;
  if (!p.isAdmin && h1s !== 1) err('seo', `${g}: ${h1s}× <h1> (verwacht 1)`);
  if (!/<html[^>]*\slang="nl"/i.test(html)) err('a11y', `${g}: <html lang="nl"> ontbreekt`);
  if (!/<meta\s+name="viewport"/i.test(html)) err('a11y', `${g}: viewport-meta ontbreekt`);
  if (!p.isAdmin && !/href="#main(?:-content)?"/.test(body)) warn('a11y', `${g}: skip-link naar #main(-content) ontbreekt`);
  if (/\r\r\n/.test(html)) err('format', `${g}: dubbele \\r (\\r\\r\\n) — kapotte regeleinden`);

  // SEO (alleen indexeerbare pagina's)
  if (!p.isAdmin && !p.noindex) {
    if (!p.title) err('seo', `${g}: <title> ontbreekt`);
    if (!p.description) err('seo', `${g}: meta description ontbreekt`);
    if (p.canonical !== `${SITE}${p.url === '/' ? '/' : p.url}`) err('seo', `${g}: canonical ${p.canonical} ≠ ${SITE}${p.url}`);
    if (p.title) { if (titles.has(p.title)) err('seo', `${g}: dubbele title (ook ${titles.get(p.title)})`); titles.set(p.title, g); if (p.title.length > 70) warn('seo', `${g}: title ${p.title.length} tekens (>70)`); }
    if (p.description) { if (descs.has(p.description)) err('seo', `${g}: dubbele description (ook ${descs.get(p.description)})`); descs.set(p.description, g); if (p.description.length > 165) warn('seo', `${g}: description ${p.description.length} tekens (>165)`); if (p.description.length < 70) warn('seo', `${g}: description ${p.description.length} tekens (<70)`); }
    const og = /<meta\s+property="og:image"\s+content="([^"]+)"/i.exec(html)?.[1];
    if (!og) warn('seo', `${g}: og:image ontbreekt`);
    else if (og.startsWith(SITE) && !exists(decodeURIComponent(og.slice(SITE.length + 1)))) err('seo', `${g}: og:image bestaat niet op schijf: ${og}`);

    // JSON-LD
    const blocks = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
    if (!blocks.length) warn('schema', `${g}: geen JSON-LD`);
    blocks.forEach((raw, i) => {
      let data;
      try { data = JSON.parse(raw); } catch (e) { err('schema', `${g}: JSON-LD blok ${i + 1} is geen geldige JSON (${e.message})`); return; }
      (function visit(node) {
        if (Array.isArray(node)) return node.forEach(visit);
        if (node && typeof node === 'object') {
          const types = [].concat(node['@type'] ?? []);
          if (types.includes('ImageObject')) {
            if (!node.license) err('schema', `${g}: ImageObject zonder license (${node.url ?? node.contentUrl ?? '?'})`);
            if (!node.acquireLicensePage) err('schema', `${g}: ImageObject zonder acquireLicensePage`);
          }
          Object.values(node).forEach(visit);
        }
      })(data);
    });
  }
}

// ---------- sitemap ----------
const sitemap = read('sitemap.xml');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const dupes = sitemapUrls.filter((u, i) => sitemapUrls.indexOf(u) !== i);
if (dupes.length) err('sitemap', `dubbele URL's: ${dupes.join(', ')}`);
for (const u of sitemapUrls) {
  if (!u.startsWith(SITE)) { err('sitemap', `URL buiten ${SITE}: ${u}`); continue; }
  const pth = u.slice(SITE.length) || '/';
  const file = resolvesToTarget(pth);
  if (!file) { err('sitemap', `${u} wijst naar niets`); continue; }
  const p = info.get(file);
  if (p?.noindex) err('sitemap', `${u} is noindex maar staat in de sitemap`);
}
for (const p of info.values()) {
  if (p.isAdmin || p.noindex || p.file === '404.html' || p.file.startsWith('intake/')) continue;
  const u = `${SITE}${p.url === '/' ? '/' : p.url}`;
  if (!sitemapUrls.includes(u)) err('sitemap', `${u} is indexeerbaar maar mist in de sitemap`);
}
for (const m of sitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)) {
  const u = m[1].replace(/&amp;/g, '&');
  if (!u.startsWith(SITE) || !exists(decodeURIComponent(u.slice(SITE.length + 1)))) err('sitemap', `image:loc bestaat niet: ${u}`);
}
try {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/build-sitemap.mjs'), '--check'], { stdio: 'pipe' });
} catch (e) {
  err('sitemap', 'sitemap.xml is niet in sync met de pagina\'s — draai `node scripts/build-sitemap.mjs`');
}
if (!/Sitemap:\s*https:\/\/mvdbmedia\.nl\/sitemap\.xml/i.test(read('robots.txt'))) err('seo', 'robots.txt verwijst niet naar de sitemap');

// ---------- interne bestanden afgeschermd ----------
try {
  const mw = read('functions/_middleware.js');
  const routes = JSON.parse(read('_routes.json')).include;
  const files = [...(/BLOCKED_FILES\s*=\s*new Set\(\[([\s\S]*?)\]\)/.exec(mw)?.[1] ?? '').matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const prefixes = [...(/BLOCKED_PREFIXES\s*=\s*\[([\s\S]*?)\]/.exec(mw)?.[1] ?? '').matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  for (const f of files) if (!routes.includes(f)) err('routes', `_routes.json mist ${f} (staat wel in _middleware.js)`);
  for (const pf of prefixes) if (!routes.includes(`${pf}*`)) err('routes', `_routes.json mist ${pf}* (staat wel in _middleware.js)`);
  for (const must of ['/api/*', '/admin/*']) if (!routes.includes(must)) err('routes', `_routes.json mist ${must} — die functions zouden stoppen`);
  let tracked;
  try { tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean); } catch { tracked = fs.readdirSync(ROOT); }
  const rootFiles = tracked.filter((f) => !f.includes('/'));
  const internal = rootFiles.filter((f) => /\.(mjs|py|log|md|lock)$/i.test(f) || ['package.json', 'package-lock.json'].includes(f));
  for (const f of internal) if (!files.includes(`/${f.toLowerCase()}`)) err('routes', `/${f} staat in de repo-root maar wordt niet geblokkeerd (voeg toe aan _routes.json + BLOCKED_FILES)`);
  const publicDirs = ['scripts', 'docs'];
  for (const d of publicDirs) if (tracked.some((f) => f.startsWith(`${d}/`)) && !prefixes.includes(`/${d}/`)) err('routes', `/${d}/ is niet geblokkeerd`);
} catch (e) {
  err('routes', `controle mislukt: ${e.message}`);
}

// ---------- geheimen ----------
try {
  const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter((f) => /\.(html|js|mjs|json|css|md|txt|xml|toml)$/.test(f) && !f.includes('node_modules') && !/package-lock/.test(f) && !f.startsWith('admin/vendor/'));
  const patterns = [[/\bre_[A-Za-z0-9]{20,}\b/, 'Resend API-key'], [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'], [/\b(?:sk|pk)_live_[A-Za-z0-9]{10,}/, 'live API-key'], [/\bAKIA[0-9A-Z]{16}\b/, 'AWS key']];
  for (const f of tracked) {
    if (!exists(f)) continue;
    const txt = read(f);
    for (const [re, label] of patterns) if (re.test(txt)) err('security', `${f}: lijkt een ${label} te bevatten`);
  }
} catch { warn('security', 'geheimen-scan overgeslagen (geen git)'); }

// ---------- rapport ----------
const byGroup = (list) => list.reduce((acc, l) => { const g = /^\[([^\]]+)\]/.exec(l)[1]; (acc[g] ||= []).push(l); return acc; }, {});
if (warnings.length) {
  console.log(`\n${warnings.length} waarschuwing(en):`);
  for (const [g, l] of Object.entries(byGroup(warnings))) { console.log(`  ${g} (${l.length})`); l.slice(0, 8).forEach((x) => console.log('   ', x.replace(/^\[[^\]]+\]\s*/, ''))); if (l.length > 8) console.log(`    … +${l.length - 8}`); }
}
if (errors.length) {
  console.log(`\n${errors.length} FOUT(EN):`);
  errors.forEach((e) => console.log('  ✗', e));
  process.exit(1);
}
console.log(`\n✓ ${pages.length} pagina's, ${sitemapUrls.length} sitemap-URL's, ${cspLines.length} CSP-beleid(en): geen fouten`);
