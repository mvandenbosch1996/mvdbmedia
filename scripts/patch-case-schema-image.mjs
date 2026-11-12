// Zet `image` in het LocalBusiness JSON-LD van portfolio.html en portfolio/*.html gelijk aan de eigen og:image van de pagina.
// `logo` blijft ongemoeid. Idempotent. Gebruik: node scripts/patch-case-schema-image.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  path.join(ROOT, 'portfolio.html'),
  ...fs.readdirSync(path.join(ROOT, 'portfolio')).filter((f) => f.endsWith('.html')).map((f) => path.join(ROOT, 'portfolio', f)),
];

const OG = /<meta\s+property="og:image"\s+content="([^"]+)"/i;
const LB_IMAGE = /^(\s*"image":\s*")[^"]+(",?\s*\r?\n\s*"logo":)/m;

let patched = 0;
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const og = OG.exec(html)?.[1];
  if (!og) { console.warn('geen og:image', path.relative(ROOT, file)); continue; }
  if (!LB_IMAGE.test(html)) { console.warn('geen LocalBusiness image+logo', path.relative(ROOT, file)); continue; }
  const next = html.replace(LB_IMAGE, (_, a, b) => `${a}${og}${b}`);
  if (next === html) continue;
  fs.writeFileSync(file, next);
  patched++;
  console.log('patched', path.relative(ROOT, file), '->', og);
}
console.log(`${patched} bestanden bijgewerkt`);
