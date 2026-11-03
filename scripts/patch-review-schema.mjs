// Voegt aggregateRating + review (bron: kennisbank/shared.mjs) toe aan de LocalBusiness JSON-LD van alle statische pagina's.
// Idempotent: pagina's met aggregateRating worden overgeslagen. Gebruik: node scripts/patch-review-schema.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AGGREGATE_RATING, REVIEW } from './kennisbank/shared.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'temporary screenshots', '.playwright-mcp']);
const SAME_AS = /([ \t]*)"sameAs":\s*\[[^\]]*g\.page\/r\/CW9KIY_IYVdrEBM\/review"\s*\]/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(path.join(dir, e.name));
    return e.name.endsWith('.html') ? [path.join(dir, e.name)] : [];
  });
}

let patched = 0;
for (const file of walk(ROOT)) {
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes('"aggregateRating"')) continue;
  const m = SAME_AS.exec(html);
  if (!m) continue;
  const eol = m[0].includes('\r\n') ? '\r\n' : '\n';
  const indent = m[1];
  const block = (key, obj) =>
    JSON.stringify({ [key]: obj }, null, 2).split('\n').slice(1, -1).map((l) => indent + l.slice(2)).join(eol);
  const insert = `,${eol}${block('aggregateRating', AGGREGATE_RATING)},${eol}${block('review', REVIEW)}`;
  const at = m.index + m[0].length;
  fs.writeFileSync(file, html.slice(0, at) + insert + html.slice(at));
  patched++;
  console.log('patched', path.relative(ROOT, file));
}
console.log(`${patched} bestanden bijgewerkt`);
