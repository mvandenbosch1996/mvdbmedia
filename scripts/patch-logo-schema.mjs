// Zet `logo` in de LocalBusiness JSON-LD van alle statische pagina's op het ronde merklogo.
// Niet-case pagina's krijgen het logo ook als entiteits-`image`; portfolio/ houdt de eigen projectfoto als `image`.
// Idempotent. Gebruik: node scripts/patch-logo-schema.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'temporary screenshots', '.playwright-mcp']);
const LOGO = 'https://mvdbmedia.nl/fotos/logo-mvdbmedia.png';
const OLD = 'https://mvdbmedia.nl/fotos/michael-profiel.jpg';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(path.join(dir, e.name));
    return e.name.endsWith('.html') ? [path.join(dir, e.name)] : [];
  });
}

const IMAGE_LINE = new RegExp(`^([ \\t]*)"image":\\s*"${OLD.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}",?(\\r?\\n)`, 'm');
const LOGO_LINE = new RegExp(`("logo":\\s*")${OLD.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(")`, 'g');

let patched = 0;
for (const file of walk(ROOT)) {
  const isCase = path.relative(ROOT, file).split(path.sep)[0] === 'portfolio' || path.basename(file) === 'portfolio.html';
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes(OLD) && !html.includes(LOGO)) continue;
  let next = html.replace(LOGO_LINE, `$1${LOGO}$2`);
  if (!isCase) {
    next = next.replace(IMAGE_LINE, (_, indent, eol) => `${indent}"image": "${LOGO}",${eol}`);
  }
  const hasLogoKey = /"logo":\s*"https:\/\/mvdbmedia\.nl\/fotos\/logo-mvdbmedia\.png"/.test(next);
  if (!hasLogoKey && /"@type":\s*\[\s*"ProfessionalService"/.test(next)) {
    next = next.replace(/^([ \t]*)"image":\s*"[^"]+",?(\r?\n)/m, (m, indent, eol) => `${m.replace(/,?(\r?\n)$/, ',$1')}${indent}"logo": "${LOGO}",${eol}`);
  }
  if (next === html) continue;
  fs.writeFileSync(file, next);
  patched++;
  console.log('patched', path.relative(ROOT, file));
}
console.log(`${patched} bestanden bijgewerkt`);
