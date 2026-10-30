// Unieke OG-afbeeldingen (1200x630 JPG) per pagina: fotos/og/<slug>.jpg
// Gebruik: node scripts/og-images.mjs   (OG-config wordt ook door build-kennisbank.mjs gelezen)
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OG_W = 1200;
export const OG_H = 630;

// photo: bronbestand in /fotos (null = donkere merkkaart); title: max 2 regels, \n = regelbreuk
export const OG = {
  'index':                         { photo: 'drone-fort.webp', label: 'Fotografie & Webdesign', title: 'Beeld en websites\nvoor Friesland' },
  'portfolio':                     { photo: 'nesaclinics-fitplan/nesaclinics-fitplan-team-behandelkamer.webp', label: 'Portfolio', title: 'Projecten en\ncase studies' },
  'dronevisuals':                  { photo: 'drone-park.webp', label: 'Dronevisuals', title: 'Dronebeelden voor\nbedrijven in Friesland' },
  'drone-vastgoed':                { photo: 'drone-fort.webp', label: 'Drone vastgoed', title: 'Luchtfoto\'s voor\nmakelaars en vastgoed' },
  'drone-events':                  { photo: 'drone-event-stock.webp', label: 'Drone events', title: 'Evenementen vanuit\nde lucht' },
  'drone-auto':                    { photo: 'drone-auto-stock.webp', label: 'Drone auto', title: 'Cinematische\nautocontent' },
  'drone-constructie':             { photo: 'drone-bouwplaats.webp', label: 'Constructie in beeld', title: 'Bouwvoortgang\nvanuit de lucht' },
  'evenementen':                   { photo: 'events-groep.webp', label: 'Evenementen', title: 'Eventfotografie\nin Friesland' },
  'groepsfotografie':              { photo: 'groepsfoto 1.webp', label: 'Groepsfotografie', title: 'Teamfoto\'s die\nbij jullie passen' },
  'portretfotografie':             { photo: 'portret-ollie.webp', label: 'Portretfotografie', title: 'Portretten met\npersoonlijkheid' },
  'portret-groepsfotografie':      { photo: 'marit/marit 1.webp', pos: 'north', label: 'Portret & groep', title: 'Portret- en\ngroepsfotografie' },
  'vastgoedfotografie':            { photo: 'vastgoed-stock.webp', label: 'Vastgoedfotografie', title: 'Woningen op hun\nbest in beeld' },
  'webdesignopmaat':               { photo: 'webdesign-op-maat-mvdb-media.jpg.webp', label: 'Webdesign op maat', title: 'Websites die\naanvragen opleveren' },
  'starter-website-pakket':        { photo: null, label: 'Starter pakket', title: 'Website vanaf €499\nexcl. btw' },
  'business-website-pakket':       { photo: null, label: 'Business pakket', title: 'Website vanaf €999\nexcl. btw' },
  'kampr':                         { photo: null, label: 'Case study', title: 'Kampr.nl — SaaS\nvoor campings' },
  'kennisbank':                    { photo: null, label: 'Kennisbank', title: 'Webdesign gidsen\nvoor ondernemers' },
  'conversie-gericht-webdesign':   { photo: null, label: 'Gids · Webdesign', title: 'Conversiegericht\nwebdesign' },
  'maatwerk-website-vs-wordpress': { photo: null, label: 'Gids · Webdesign', title: 'Maatwerk website\nof WordPress?' },
  'seo-webdesign-hoger-in-google': { photo: null, label: 'Gids · SEO', title: 'Webdesign en SEO:\nhoger in Google' },
  'snelle-website-laten-maken':    { photo: null, label: 'Gids · Webdesign', title: 'Snel een website\nlaten maken' },
  'webapplicatie-saas-laten-maken':{ photo: null, label: 'Gids · Webapplicatie', title: 'Webapplicatie of\nSaaS laten maken' },
  'webdesign-kosten-friesland':    { photo: null, label: 'Gids · Prijzen', title: 'Wat kost een\nwebsite in Friesland?' },
  'website-beveiliging-onderhoud': { photo: null, label: 'Gids · Onderhoud', title: 'Website beveiliging\nen onderhoud' },
  'website-laten-maken-sneek':     { photo: null, label: 'Gids · Sneek', title: 'Website laten maken\nin Sneek' },
  'algemene-voorwaarden':          { photo: null, label: 'Juridisch', title: 'Algemene\nvoorwaarden' },
  'privacybeleid':                 { photo: null, label: 'Juridisch', title: 'Privacybeleid' },
};

export const ogAlt = (slug) => {
  const o = OG[slug];
  return `${o.title.replace(/\n/g, ' ')} — ${o.label}, MVDBmedia Sneek`;
};
export const ogUrl = (slug) => `https://mvdbmedia.nl/fotos/og/${slug}.jpg`;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function overlaySvg({ label, title, photo }) {
  const lines = title.split('\n');
  const titleY = 520 - (lines.length - 1) * 74;
  const text = lines.map((l, i) => `<text x="72" y="${titleY + i * 74}" font-size="66" font-weight="700" letter-spacing="-2" fill="#f0ede8">${esc(l)}</text>`).join('');
  const bg = photo
    ? `<defs>
         <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d0d0d" stop-opacity="0.86"/><stop offset="0.6" stop-color="#0d0d0d" stop-opacity="0.38"/><stop offset="1" stop-color="#0d0d0d" stop-opacity="0"/></linearGradient>
         <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="#0d0d0d" stop-opacity="0"/><stop offset="1" stop-color="#0d0d0d" stop-opacity="0.8"/></linearGradient>
       </defs>
       <rect width="${OG_W}" height="${OG_H}" fill="url(#g1)"/><rect width="${OG_W}" height="${OG_H}" fill="url(#g2)"/>`
    : `<defs>
         <radialGradient id="r1" cx="0.88" cy="0.08" r="0.75"><stop offset="0" stop-color="#ff8c00" stop-opacity="0.34"/><stop offset="1" stop-color="#ff8c00" stop-opacity="0"/></radialGradient>
         <radialGradient id="r2" cx="0.05" cy="1" r="0.7"><stop offset="0" stop-color="#c96e00" stop-opacity="0.22"/><stop offset="1" stop-color="#c96e00" stop-opacity="0"/></radialGradient>
       </defs>
       <rect width="${OG_W}" height="${OG_H}" fill="#0d0d0d"/><rect width="${OG_W}" height="${OG_H}" fill="url(#r1)"/><rect width="${OG_W}" height="${OG_H}" fill="url(#r2)"/>
       <text x="1190" y="640" font-size="760" font-weight="700" text-anchor="end" fill="#ff8c00" fill-opacity="0.07">M</text>`;
  return Buffer.from(`<svg width="${OG_W}" height="${OG_H}" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">
    ${bg}
    <rect x="72" y="${titleY - 128}" width="56" height="4" fill="#ff8c00"/>
    <text x="72" y="${titleY - 74}" font-size="26" font-weight="700" letter-spacing="6" fill="#ff8c00">${esc(label.toUpperCase())}</text>
    ${text}
    <text x="168" y="104" font-size="30" font-weight="700" letter-spacing="1" fill="#f0ede8">MVDBmedia</text>
    <text x="168" y="136" font-size="20" letter-spacing="3" fill="#a09890">SNEEK · FRIESLAND</text>
  </svg>`);
}

async function build() {
  const outDir = path.join(ROOT, 'fotos', 'og');
  fs.mkdirSync(outDir, { recursive: true });
  const logo = await sharp(path.join(ROOT, 'apple-touch-icon.png')).resize(80, 80).toBuffer();
  for (const [slug, o] of Object.entries(OG)) {
    const base = o.photo
      ? sharp(path.join(ROOT, 'fotos', o.photo)).resize(OG_W, OG_H, { fit: 'cover', position: o.pos || sharp.strategy.attention })
      : sharp({ create: { width: OG_W, height: OG_H, channels: 3, background: '#0d0d0d' } });
    const buf = await base
      .composite([{ input: overlaySvg(o) }, { input: logo, left: 72, top: 62 }])
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    fs.writeFileSync(path.join(outDir, slug + '.jpg'), buf);
    console.log(slug.padEnd(34), Math.round(buf.length / 1024) + 'KB');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await build();
