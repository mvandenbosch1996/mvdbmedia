// Voegt het M-monogram toe aan de merklink in de <nav> van alle statische pagina's (admin/intake uitgezonderd).
// Bron van de markup: scripts/kennisbank/layout.mjs (NAV_LOGO_IMG). Idempotent. Gebruik: node scripts/patch-nav-logo.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NAV_LOGO_IMG, NAV_LOGO_FLEX } from './kennisbank/layout.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'temporary screenshots', '.playwright-mcp', 'admin', 'intake']);
const BRAND = /<a href="\/"([^>]*)>MVDB<span/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(path.join(dir, e.name));
    return e.name.endsWith('.html') ? [path.join(dir, e.name)] : [];
  });
}

let patched = 0;
for (const file of walk(ROOT)) {
  const html = fs.readFileSync(file, 'utf8');
  const navStart = html.search(/<nav[\s>]/);
  const navEnd = html.indexOf('</nav>', navStart);
  if (navStart < 0 || navEnd < 0) continue;
  const nav = html.slice(navStart, navEnd);
  if (nav.includes('logo-mvdbmedia-nav')) continue;
  const m = BRAND.exec(nav);
  if (!m) { console.warn('geen merklink in nav:', path.relative(ROOT, file)); continue; }
  let attrs = m[1];
  attrs = /style="/.test(attrs)
    ? attrs.replace(/style="/, `style="${NAV_LOGO_FLEX}`)
    : `${attrs} style="${NAV_LOGO_FLEX}"`;
  const replacement = `<a href="/"${attrs}>${NAV_LOGO_IMG}MVDB<span`;
  const nextNav = nav.slice(0, m.index) + replacement + nav.slice(m.index + m[0].length);
  fs.writeFileSync(file, html.slice(0, navStart) + nextNav + html.slice(navEnd));
  patched++;
  console.log('patched', path.relative(ROOT, file));
}
console.log(`${patched} bestanden bijgewerkt`);
