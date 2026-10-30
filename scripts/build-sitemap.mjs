// Herschrijft sitemap.xml met <image:image>-vermeldingen per pagina (Google image sitemap-extensie).
// Behoudt de bestaande <url>-volgorde, lastmod en priority; voegt alleen de afbeeldingen toe die
// echt op de pagina staan (<img src>, lightbox data-full en de galerij in js/portfolio.js).
//   node scripts/build-sitemap.mjs          -> schrijft sitemap.xml
//   node scripts/build-sitemap.mjs --check  -> exit 1 als sitemap.xml niet up-to-date is
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://mvdbmedia.nl';
const check = process.argv.includes('--check');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

const current = read('sitemap.xml');
const entries = [...current.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
  loc: /<loc>([^<]+)<\/loc>/.exec(m[1])[1],
  lastmod: /<lastmod>([^<]+)<\/lastmod>/.exec(m[1])?.[1],
  changefreq: /<changefreq>([^<]+)<\/changefreq>/.exec(m[1])?.[1],
  priority: /<priority>([^<]+)<\/priority>/.exec(m[1])?.[1],
}));

const xmlEsc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const SKIP = /^(data:|https?:)|\/fotos\/og\/|favicon|apple-touch/;

function htmlFileFor(loc) {
  const p = loc.replace(SITE, '') || '/';
  return p === '/' ? 'index.html' : `${p.slice(1)}.html`;
}

function imagesFor(loc) {
  const file = htmlFileFor(loc);
  const html = read(file);
  const dir = path.posix.dirname('/' + file.replace(/\\/g, '/'));
  const raw = new Set();
  for (const m of html.matchAll(/<img\b[^>]*?\ssrc="([^"]+)"/g)) raw.add(m[1]);
  for (const m of html.matchAll(/data-full="([^"]+)"/g)) raw.add(m[1]);
  if (file === 'portfolio.html') {
    for (const m of read('js/portfolio.js').matchAll(/\bsrc:\s*'([^']+)'/g)) raw.add(m[1]);
  }
  const out = [];
  for (const src of raw) {
    if (SKIP.test(src)) continue;
    const abs = src.startsWith('/') ? src : path.posix.normalize(path.posix.join(dir, src));
    let onDisk;
    try { onDisk = decodeURIComponent(abs.split('?')[0]); } catch { continue; }
    if (!fs.existsSync(path.join(ROOT, onDisk))) {
      console.warn(`  ! ${file}: afbeelding bestaat niet: ${src}`);
      continue;
    }
    const url = SITE + abs.split('?')[0];
    if (!out.includes(url)) out.push(url);
  }
  return out.slice(0, 1000);
}

let total = 0;
const blocks = entries.map((e) => {
  const imgs = imagesFor(e.loc);
  total += imgs.length;
  const lines = [`    <loc>${e.loc}</loc>`];
  if (e.lastmod) lines.push(`    <lastmod>${e.lastmod}</lastmod>`);
  if (e.changefreq) lines.push(`    <changefreq>${e.changefreq}</changefreq>`);
  if (e.priority) lines.push(`    <priority>${e.priority}</priority>`);
  imgs.forEach((u) => lines.push(`    <image:image>\n      <image:loc>${xmlEsc(u)}</image:loc>\n    </image:image>`));
  return `  <url>\n${lines.join('\n')}\n  </url>`;
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n\n${blocks.join('\n\n')}\n\n</urlset>\n`;

const normalise = (s) => s.replace(/\r\n/g, '\n');
if (check) {
  if (normalise(current) !== xml) {
    console.error('sitemap.xml is niet up-to-date: draai `node scripts/build-sitemap.mjs`');
    process.exit(1);
  }
  console.log(`sitemap.xml up-to-date (${entries.length} URL's, ${total} afbeeldingen)`);
} else {
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
  console.log(`sitemap.xml geschreven: ${entries.length} URL's, ${total} afbeeldingen`);
}
