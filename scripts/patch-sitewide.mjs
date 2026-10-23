// Voegt de Kennisbank-link toe aan de navigatie en de kolom "Webdesign Gidsen" aan de footer van alle publieke pagina's.
// Idempotent: opnieuw draaien verandert niets. Werkt ook sitemap.xml en indexnow.mjs bij.
// Gebruik: node scripts/patch-sitewide.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { guidesColumn, GUIDES_LABEL, DATE, SITE } from './kennisbank/shared.mjs';
import guides from './kennisbank/content/index.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PAGES = [
  'index', 'portret-groepsfotografie', 'portretfotografie', 'groepsfotografie', 'vastgoedfotografie',
  'dronevisuals', 'drone-vastgoed', 'drone-constructie', 'drone-events', 'drone-auto', 'evenementen',
  'webdesignopmaat', 'starter-website-pakket', 'business-website-pakket', 'portfolio',
  'privacybeleid', 'algemene-voorwaarden',
];

const PATCH_CSS = '<style>/*kb-patch*/@media(max-width:1180px){#nav-links{gap:18px!important}}@media(min-width:769px) and (max-width:1024px){.footer-grid{grid-template-columns:1fr 1fr 1fr!important}}@media(max-width:768px){.footer-grid{grid-template-columns:1fr!important;gap:32px!important}}</style>';

const isNavPortfolioLine = (l) =>
  /<a [^>]*href="\/portfolio"[^>]*>Portfolio<\/a>\s*$/.test(l) &&
  /^\s*<a /.test(l) &&
  !/footer-link|btn-ghost|showreel|diensten-link/.test(l) &&
  (/nav-link|toggleMenu|font-size:\s*0\.92rem/.test(l) || /^\s*<a href="\/portfolio">Portfolio<\/a>\s*$/.test(l));

function patchNav(html, eol, file) {
  const lines = html.split(eol);
  const out = [];
  let added = 0;
  for (let i = 0; i < lines.length; i++) {
    out.push(lines[i]);
    if (isNavPortfolioLine(lines[i]) && !/href="\/kennisbank"/.test(lines[i + 1] ?? '')) {
      let clone = lines[i].replace('href="/portfolio"', 'href="/kennisbank"').replace('>Portfolio</a>', '>Kennisbank</a>');
      if (file === 'portfolio') clone = clone.replace(/color:\s*var\(--orange\)/g, 'color:var(--text-secondary)').replace(/\s*aria-current="page"/, '');
      out.push(clone);
      added++;
    }
  }
  if (added !== 2) console.warn(`  ! ${file}: ${added} nav-links toegevoegd (verwacht 2: desktop + mobiel)`);
  return out.join(eol);
}

function patchFooter(html, eol, file) {
  const fStart = html.indexOf('<footer');
  const fEnd = html.indexOf('</footer>', fStart);
  if (fStart < 0 || fEnd < 0) throw new Error(`${file}: geen footer`);
  let foot = html.slice(fStart, fEnd);

  const re = /<div style="[^"]*">(Volg ons|Contact)<\/div>/g;
  let m;
  let last = null;
  while ((m = re.exec(foot))) last = m;
  if (!last) throw new Error(`${file}: footer-label (Volg ons/Contact) niet gevonden`);

  const labelOpen = last[0].slice(0, last[0].indexOf('>') + 1);
  const wrapStart = foot.lastIndexOf('<div', last.index - 1);
  const gapMatch = /flex-direction:column;gap:(\d+)px/.exec(foot.slice(last.index));
  const gap = gapMatch ? Number(gapMatch[1]) : 11;
  const lineStart = foot.lastIndexOf('\n', wrapStart) + 1;
  const between = foot.slice(lineStart, wrapStart);
  const indent = /^[ \t]*$/.test(between) ? between : '        ';
  const useClass = /\.footer-link\s*\{/.test(html);

  const column = guidesColumn({ labelOpen, gap, useClass, indent, eol });
  foot = foot.slice(0, wrapStart) + column + eol + indent + foot.slice(wrapStart);
  foot = foot
    .replace('grid-template-columns:1.5fr 1fr 1fr 1fr', 'grid-template-columns:1.4fr 1fr 1fr 1.15fr 1fr')
    .replace('grid-template-columns:2fr 1fr 1fr 1fr', 'grid-template-columns:1.6fr 1fr 1fr 1.15fr 1fr');

  let result = html.slice(0, fStart) + foot + html.slice(fEnd);
  result = result.replace(/(\.footer-grid\s*\{[^}]*?grid-template-columns:\s*)1\.5fr 1fr 1fr 1fr/, (_, a) => `${a}1.4fr 1fr 1fr 1.15fr 1fr`);
  return result;
}

let changed = 0;
for (const page of PAGES) {
  const file = path.join(ROOT, `${page}.html`);
  let html = fs.readFileSync(file, 'utf8');
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const before = html;

  if (!html.includes('href="/kennisbank"')) html = patchNav(html, eol, page);
  if (!html.includes(GUIDES_LABEL)) html = patchFooter(html, eol, page);
  if (!html.includes('/*kb-patch*/')) html = html.replace('</head>', `  ${PATCH_CSS}${eol}</head>`);

  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    changed++;
    console.log(`gepatcht: ${page}.html`);
  } else {
    console.log(`ongewijzigd: ${page}.html`);
  }
}

// ── sitemap.xml ─────────────────────────────────────────────────────────────
const sitemapPath = path.join(ROOT, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf8');
const sEol = sitemap.includes('\r\n') ? '\r\n' : '\n';
const entries = [{ loc: `${SITE}/kennisbank`, priority: '0.8' }, ...guides.map((g) => ({ loc: g.url, priority: '0.7' }))];
const missing = entries.filter((e) => !sitemap.includes(`<loc>${e.loc}</loc>`));
if (missing.length) {
  const block = missing.map((e) => `  <url>${sEol}    <loc>${e.loc}</loc>${sEol}    <lastmod>${DATE}</lastmod>${sEol}    <priority>${e.priority}</priority>${sEol}  </url>${sEol}`).join(sEol);
  sitemap = sitemap.replace('</urlset>', `${block}${sEol}</urlset>`);
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
  console.log(`sitemap.xml: ${missing.length} URL's toegevoegd`);
}

// ── indexnow.mjs ────────────────────────────────────────────────────────────
const inPath = path.join(ROOT, 'indexnow.mjs');
let inSrc = fs.readFileSync(inPath, 'utf8');
const iEol = inSrc.includes('\r\n') ? '\r\n' : '\n';
const newUrls = entries.map((e) => e.loc).filter((u) => !inSrc.includes(`'${u}'`));
if (newUrls.length) {
  const anchor = "  'https://mvdbmedia.nl/privacybeleid',";
  if (!inSrc.includes(anchor)) throw new Error('indexnow.mjs: anker niet gevonden');
  inSrc = inSrc.replace(anchor, anchor + iEol + newUrls.map((u) => `  '${u}',`).join(iEol));
  fs.writeFileSync(inPath, inSrc, 'utf8');
  console.log(`indexnow.mjs: ${newUrls.length} URL's toegevoegd`);
}

console.log(`Klaar. ${changed} pagina's gewijzigd.`);
