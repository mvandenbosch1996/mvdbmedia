// Hub -> spoke: zet de "werkgebied"-regel met beschrijvende ankerteksten naar de vier stadspagina's op de hoofd- en dienstpagina's.
// Idempotent: een bestaande <p class="werkgebied"> wordt vervangen, anders wordt hij voor </main> geplaatst.
//   node scripts/link-hubs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const P_STYLE = 'max-width:1280px;margin:0 auto;padding:32px clamp(20px,5vw,64px);font-size:0.85rem;line-height:1.7;color:var(--text-secondary);text-align:center;';
const A_STYLE = 'color:inherit;text-decoration:underline;text-decoration-color:rgba(255,140,0,0.5);text-underline-offset:3px;';
const HOVER = `data-s-mouseover="this.style.color='var(--orange)'" data-s-mouseout="this.style.color='inherit'"`;

const CITY = { Leeuwarden: 'leeuwarden', Heerenveen: 'heerenveen', Harlingen: 'harlingen', Drachten: 'drachten' };
const a = (href, text) => `<a href="${href}" style="${A_STYLE}" ${HOVER}>${text}</a>`;
const cities = (label) => {
  const links = Object.entries(CITY).map(([stad, slug]) => a(`/webdesign-fotografie-${slug}`, `${label} ${stad}`));
  return `${links.slice(0, -1).join(', ')} en ${links.at(-1)}`;
};
const sneek = (text) => a('/website-laten-maken-sneek', text);

const PAGES = {
  index: () => `MVDBmedia werkt vanuit Sneek (${sneek('webdesigner in Sneek')}) voor klanten in heel Friesland: ${cities('webdesign en fotografie in')}. Webdesign en fotografie zijn ook landelijk beschikbaar.`,
  webdesignopmaat: () => `Website laten maken in Sneek? Lees de gids over ${sneek('webdesign in Sneek en omgeving')} of bekijk ${cities('webdesign in')}. Ik werk met ondernemers in heel Friesland en lever webdesign op maat in heel Nederland.`,
  'starter-website-pakket': () => `Starterswebsite laten maken? Ik bouw websites voor zzp'ers en starters in Sneek (${sneek('webdesigner in Sneek')}), met lokale pagina's voor ${cities('starterswebsites in')} en de rest van Nederland.`,
  'business-website-pakket': () => `Zakelijke website laten maken in Sneek (${sneek('webdesigner in Sneek')})? Bekijk ook ${cities('zakelijke websites in')}. Ik werk met bedrijven in heel Friesland en landelijk.`,
  portfolio: () => `Portfolio van webdesigner en fotograaf MVDBmedia uit Sneek. Zie hoe ik werk in ${cities('webdesign en fotografie in')}, en in heel Friesland.`,
  dronevisuals: () => `Dronefotograaf in Sneek en omgeving: bekijk ${cities('dronefotografie in')}. Snel inzetbaar voor opdrachten in heel Friesland en de rest van Nederland.`,
  'drone-vastgoed': () => `Drone vastgoedfotografie voor makelaars en bouwbedrijven in Sneek en Friesland: ${cities('vastgoed- en dronefotografie in')}; ook elders in Nederland beschikbaar.`,
  'drone-constructie': () => `Bouwprojecten periodiek vanuit de lucht vastleggen? Bekijk ${cities('bouwvoortgang met drone in')}. Ook elders in Nederland beschikbaar.`,
  'drone-events': () => `Drone-eventfotografie voor festivals en evenementen in heel Friesland en Nederland: ${cities('eventbeelden en drone in')}.`,
  'drone-auto': () => `Autofotografie en dronevideo's voor dealers en creators in Sneek en Friesland: ${cities('autobeelden en drone in')}; ook in de rest van Nederland.`,
  portretfotografie: () => `Portretfotograaf in Sneek en Friesland: ${cities('portretfotografie in')}. Ook in de rest van Nederland op locatie beschikbaar.`,
  groepsfotografie: () => `Teamfoto's en groepsfoto's vanuit Sneek, in heel Friesland: ${cities('teamfotografie in')}. Ook in de rest van Nederland beschikbaar.`,
  vastgoedfotografie: () => `Vastgoedfotografie voor makelaars en verhuurders vanuit Sneek: ${cities('vastgoedfotografie in')}. Ook elders in Nederland beschikbaar.`,
  evenementen: () => `Evenementenfotograaf in Sneek en Friesland: ${cities('eventfotografie in')}. Ook voor evenementen in de rest van Nederland beschikbaar.`,
  'portret-groepsfotografie': () => `Zakelijke portret- en groepsfotografie vanuit Sneek: ${cities('portret- en teamfotografie in')}. Ook elders in Nederland op locatie beschikbaar.`,
};

for (const [page, text] of Object.entries(PAGES)) {
  const file = path.join(ROOT, `${page}.html`);
  let html = fs.readFileSync(file, 'utf8');
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const p = `<p class="werkgebied" style="${P_STYLE}">${text()}</p>`;
  const re = /<p class="werkgebied"[^>]*>[\s\S]*?<\/p>/;
  if (re.test(html)) {
    html = html.replace(re, () => p);
  } else {
    const end = html.lastIndexOf('</main>');
    if (end < 0) throw new Error(`${page}: geen </main>`);
    html = html.slice(0, end) + p + eol + '  ' + html.slice(end);
  }
  fs.writeFileSync(file, html);
  console.log(`ok ${page}`);
}
