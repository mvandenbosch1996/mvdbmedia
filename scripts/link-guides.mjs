// Zet het blok "Verder lezen" (gidsen uit de kennisbank) op de webdesign-dienstpagina's.
// Idempotent: tussen de markers wordt het blok telkens vervangen.
//   node scripts/link-guides.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { guideCards, relatedSection } from './kennisbank/related.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!-- rel-guides:start -->';
const END = '<!-- rel-guides:end -->';

const PAGES = {
  webdesignopmaat: ['webdesign-kosten-friesland', 'maatwerk-website-vs-wordpress', 'snelle-website-laten-maken', 'website-laten-maken-sneek', 'conversie-gericht-webdesign', 'seo-webdesign-hoger-in-google'],
  'starter-website-pakket': ['snelle-website-laten-maken', 'webdesign-kosten-friesland', 'website-laten-maken-sneek'],
  'business-website-pakket': ['conversie-gericht-webdesign', 'seo-webdesign-hoger-in-google', 'maatwerk-website-vs-wordpress', 'website-beveiliging-onderhoud'],
};

for (const [page, slugs] of Object.entries(PAGES)) {
  const file = path.join(ROOT, `${page}.html`);
  let html = fs.readFileSync(file, 'utf8');
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const block = [
    START,
    relatedSection({
      id: 'rel-guides-title',
      label: 'Verder lezen',
      titleHtml: 'HANDIGE <span class="rel-accent">GIDSEN</span>',
      cardsHtml: guideCards(slugs),
    }),
    END,
  ].join('\n').replace(/\n/g, eol);

  if (html.includes(START)) {
    html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), () => block);
  } else {
    const end = html.lastIndexOf('</main>');
    const lastSection = html.lastIndexOf('<section', end);
    if (end < 0 || lastSection < 0) throw new Error(`${page}: geen <main>/<section> gevonden`);
    html = html.slice(0, lastSection) + block + eol + eol + html.slice(lastSection);
  }
  if (!html.includes('href="/related.css"')) {
    html = html.replace('</head>', () => `  <link rel="stylesheet" href="/related.css">${eol}</head>`);
  }
  fs.writeFileSync(file, html);
  console.log(`ok ${page}: ${slugs.length} gidsen`);
}
