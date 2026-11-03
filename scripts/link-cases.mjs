// Case -> stadspagina + dienst/gids: voegt onder "Het resultaat" een contextuele alinea met beschrijvende ankerteksten toe.
// Idempotent: tussen de markers wordt de alinea telkens vervangen.
//   node scripts/link-cases.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!-- rel-case:start -->';
const END = '<!-- rel-case:end -->';

const L = {
  leeuwarden: '/webdesign-fotografie-leeuwarden',
  heerenveen: '/webdesign-fotografie-heerenveen',
  harlingen: '/webdesign-fotografie-harlingen',
  drachten: '/webdesign-fotografie-drachten',
  sneek: '/website-laten-maken-sneek',
  kosten: '/webdesign-kosten-friesland',
  saas: '/webapplicatie-saas-laten-maken',
  business: '/business-website-pakket',
};
const a = (href, text) => `<a href="${href}">${text}</a>`;

const CASES = {
  'fitplan-nesaclinics': `Beeld en website uit één hand: lees over ${a(L.sneek, 'webdesign en fotografie voor ondernemers in Sneek')}, of bekijk wat ik doe voor ${a(L.heerenveen, 'sport- en zorgondernemers in Heerenveen')}. Wil je de foto's combineren met een nieuwe website? Kijk dan naar het ${a(L.business, 'Business Website Pakket')}.`,
  kampr: `Ik bouw maatwerk websites en webapplicaties voor ondernemers in heel Friesland. Lees wat ${a(L.sneek, 'een webdesigner in Sneek voor je doet')}, ontdek ${a(L.kosten, 'wat een website in Friesland kost')} of bekijk ${a(L.drachten, 'zakelijke websites en bedrijfsfotografie in Drachten')}.`,
  'portretshoot-marit': `Een portretshoot in de buurt? Bekijk ${a(L.leeuwarden, 'portretfotografie en webdesign in Leeuwarden')}, ongeveer 25 minuten rijden vanuit Sneek.`,
  'hondenfotos-ollie': `Ook in Heerenveen en omgeving maak ik portretten op locatie: bekijk ${a(L.heerenveen, 'portretfotografie en webdesign in Heerenveen')}.`,
  'hondenfotos-ziggy': `Portretten op locatie in en rond Leeuwarden? Bekijk ${a(L.leeuwarden, 'portretfotografie in Leeuwarden')} voor de mogelijkheden en de rijtijd vanuit Sneek.`,
  'luchtfotografie-bled-slovenie': `Luchtbeelden dichter bij huis, langs water, havens en dijken: bekijk ${a(L.harlingen, 'luchtfoto\'s en dronebeelden in Harlingen')}.`,
  'bouwbedrijf-vellinga-bouwplaats': `Bouw- en bedrijfsprojecten in Friesland vanuit de lucht: bekijk ${a(L.drachten, 'dronebeelden en bedrijfsfotografie voor industrie en techniek in Drachten')} of ${a(L.leeuwarden, 'luchtbeelden van bedrijfsterreinen in Leeuwarden')}.`,
  'friesland-ontruimingen-groepsfoto': `Een teamfoto in de regio laten maken? Bekijk ${a(L.heerenveen, 'teamfoto\'s in Heerenveen')} of ${a(L.leeuwarden, 'teamfoto\'s in Leeuwarden')}.`,
};

for (const [slug, text] of Object.entries(CASES)) {
  const file = path.join(ROOT, 'portfolio', `${slug}.html`);
  let html = fs.readFileSync(file, 'utf8');
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const block = `${START}<p>${text}</p>${END}`;
  if (html.includes(START)) {
    html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), () => block);
  } else {
    const res = html.indexOf('id="resultaat"');
    const secEnd = html.indexOf('</section>', res);
    const lastP = html.lastIndexOf('</p>', secEnd);
    if (res < 0 || lastP < 0) throw new Error(`${slug}: geen resultaat-sectie`);
    const at = lastP + '</p>'.length;
    html = html.slice(0, at) + eol + '          ' + block + html.slice(at);
  }
  fs.writeFileSync(file, html);
  console.log(`ok ${slug}`);
}
