// Zet het blok "Ook interessant" (onderlinge links tussen foto- en dronediensten) op de dienstpagina's.
// Idempotent: tussen de markers wordt het blok telkens vervangen.
//   node scripts/link-services.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageCards, relatedSection } from './kennisbank/related.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!-- rel-pages:start -->';
const END = '<!-- rel-pages:end -->';

const PAGES = {
  'drone-events': ['evenementen', 'groep', 'drone'],
  evenementen: ['droneEvents', 'groep', 'portretGroep'],
  'drone-vastgoed': ['vastgoed', 'droneConstructie', 'drone'],
  vastgoedfotografie: ['droneVastgoed', 'drone', 'caseVellinga'],
  'drone-constructie': ['caseVellinga', 'droneVastgoed', 'drone'],
  'drone-auto': ['droneEvents', 'caseBled', 'drone'],
  dronevisuals: ['droneVastgoed', 'evenementen', 'caseBled'],
  groepsfotografie: ['evenementen', 'caseOntruimingen', 'portret'],
  portretfotografie: ['groep', 'evenementen', 'portretGroep'],
  'portret-groepsfotografie': ['evenementen', 'caseOntruimingen', 'vastgoed'],
};

for (const [page, keys] of Object.entries(PAGES)) {
  const file = path.join(ROOT, `${page}.html`);
  let html = fs.readFileSync(file, 'utf8');
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const block = [
    START,
    relatedSection({
      id: 'rel-pages-title',
      label: 'Ook interessant',
      titleHtml: 'MEER <span class="rel-accent">MOGELIJKHEDEN</span>',
      cardsHtml: pageCards(keys),
      allLink: false,
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
  console.log(`ok ${page}: ${keys.length} links`);
}
