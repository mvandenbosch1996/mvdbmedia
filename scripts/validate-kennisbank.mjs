// Valideert de kennisbank + gepatchte pagina's: JSON-LD, interne links, FAQ-sync, horizontale overflow (390px / 1440px).
// Vereist: node serve.mjs draait op http://localhost:3000
// Gebruik: node scripts/validate-kennisbank.mjs [--no-browser]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import guides from './kennisbank/content/index.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'http://localhost:3000';
const ALL = [
  'index', 'portret-groepsfotografie', 'portretfotografie', 'groepsfotografie', 'vastgoedfotografie',
  'dronevisuals', 'drone-vastgoed', 'drone-constructie', 'drone-events', 'drone-auto', 'evenementen',
  'webdesignopmaat', 'starter-website-pakket', 'business-website-pakket', 'portfolio',
  'privacybeleid', 'algemene-voorwaarden', 'kennisbank', ...guides.map((g) => g.slug),
];
const NEW = ['kennisbank', ...guides.map((g) => g.slug)];

let errors = 0;
const fail = (msg) => { errors++; console.log(`  FOUT  ${msg}`); };

const resolveTarget = (href) => {
  const clean = href.split('#')[0].split('?')[0];
  if (clean === '' ) return null;
  if (clean === '/') return 'index.html';
  const rel = clean.replace(/^\//, '');
  if (fs.existsSync(path.join(ROOT, rel)) && fs.statSync(path.join(ROOT, rel)).isFile()) return rel;
  if (fs.existsSync(path.join(ROOT, rel + '.html'))) return rel + '.html';
  return false;
};

console.log('── Statische checks ──');
for (const page of ALL) {
  const html = fs.readFileSync(path.join(ROOT, `${page}.html`), 'utf8');
  const problems = [];

  // JSON-LD
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  blocks.forEach((b, i) => { try { JSON.parse(b); } catch (e) { problems.push(`JSON-LD blok ${i + 1} ongeldig: ${e.message}`); } });

  // Interne links
  const hrefs = [...html.matchAll(/<a\b[^>]*\shref="([^"]*)"/g)].map((m) => m[1]);
  for (const href of hrefs) {
    if (href.includes('\\')) problems.push(`backslash in href: ${href}`);
    if (/^(https?:|mailto:|tel:|#|javascript:)/.test(href) || href === '') continue;
    if (href.startsWith('/') || !href.includes(':')) {
      if (href.endsWith('.html') && href !== '/') problems.push(`.html in interne link (gebruik clean URL): ${href}`);
      const target = resolveTarget(href.startsWith('/') ? href : '/' + href);
      if (target === false) problems.push(`dode interne link: ${href}`);
    }
  }
  if (html.includes('\\')  && NEW.includes(page) && /href="[^"]*\\/.test(html)) problems.push('backslash in href');

  // Anchors binnen de pagina
  if (NEW.includes(page)) {
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!ids.has(m[1])) problems.push(`anker #${m[1]} bestaat niet`);
  }

  // Nieuwe pagina's: structuur + FAQ-sync + auteur/publisher
  if (page !== 'kennisbank' && NEW.includes(page)) {
    const h1 = (html.match(/<h1\b/g) || []).length;
    if (h1 !== 1) problems.push(`${h1} H1's`);
    const faqBlock = blocks.map((b) => JSON.parse(b)).find((o) => o['@type'] === 'FAQPage');
    if (!faqBlock) problems.push('FAQPage ontbreekt');
    else {
      const visible = [...html.matchAll(/<span class="mv-faq-q">([\s\S]*?)<\/span>/g)].map((m) => m[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"'));
      const schemaQ = faqBlock.mainEntity.map((q) => q.name);
      if (JSON.stringify(visible) !== JSON.stringify(schemaQ)) problems.push('FAQ zichtbaar != FAQPage schema (vragen)');
      const visibleA = [...html.matchAll(/<p class="mv-faq-a">([\s\S]*?)<\/p>/g)].map((m) => m[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"'));
      const schemaA = faqBlock.mainEntity.map((q) => q.acceptedAnswer.text);
      if (JSON.stringify(visibleA) !== JSON.stringify(schemaA)) problems.push('FAQ zichtbaar != FAQPage schema (antwoorden)');
    }
    const graph = blocks.map((b) => JSON.parse(b)).find((o) => o['@graph'])?.['@graph'] ?? [];
    const art = graph.find((n) => ['Article', 'TechArticle', 'BlogPosting'].includes(n['@type']));
    if (!art) problems.push('Article ontbreekt in @graph');
    else for (const k of ['author', 'publisher']) {
      const p = art[k];
      if (!p || p['@type'] !== 'Person' || p.name !== 'Michael van den Bosch' || p['@id'] !== 'https://mvdbmedia.nl/#michael-van-den-bosch') problems.push(`${k} niet conform`);
    }
    if (!html.includes('href="/webdesignopmaat"')) problems.push('geen CTA naar /webdesignopmaat');
  }

  // Footer-kolom + nav op alle pagina's
  if (!html.includes('Webdesign Gidsen')) problems.push('footer-kolom "Webdesign Gidsen" ontbreekt');
  for (const l of ['/webdesign-kosten-friesland', '/maatwerk-website-vs-wordpress', '/snelle-website-laten-maken', '/website-laten-maken-sneek', '/kennisbank']) {
    if (!html.includes(`href="${l}"`)) problems.push(`footer/nav-link ${l} ontbreekt`);
  }

  console.log(`${problems.length ? '✗' : '✓'} ${page}.html (${blocks.length} JSON-LD, ${hrefs.length} links)`);
  problems.forEach(fail);
}

if (process.argv.includes('--no-browser')) {
  console.log(errors ? `\n${errors} fout(en)` : '\nStatische checks OK');
  process.exit(errors ? 1 : 0);
}

console.log('\n── Overflow (Puppeteer) ──');
const { default: puppeteer } = await import('puppeteer');
const browser = await puppeteer.launch({ headless: 'new' });
try {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h });
    for (const p of ALL) {
      const consoleErrors = [];
      const onConsole = (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); };
      page.on('console', onConsole);
      await page.goto(`${BASE}/${p === 'index' ? '' : p}`, { waitUntil: 'networkidle2', timeout: 30000 });
      const r = await page.evaluate(() => {
        const de = document.documentElement;
        const offenders = [];
        if (de.scrollWidth > de.clientWidth) {
          for (const el of document.querySelectorAll('body *')) {
            const rect = el.getBoundingClientRect();
            if (rect.right > de.clientWidth + 1 && rect.width > 0 && getComputedStyle(el).position !== 'fixed') {
              offenders.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 40)} right=${Math.round(rect.right)}`);
              if (offenders.length >= 4) break;
            }
          }
        }
        return { sw: de.scrollWidth, cw: de.clientWidth, offenders };
      });
      page.off('console', onConsole);
      const ok = r.sw <= r.cw;
      console.log(`${ok ? '✓' : '✗'} ${w}px ${p}  (scrollWidth ${r.sw} / ${r.cw})`);
      if (!ok) fail(`horizontale overflow ${w}px ${p}: ${r.offenders.join(' | ')}`);
      consoleErrors.filter((e) => !/favicon|fonts\.g/i.test(e)).forEach((e) => fail(`console error ${p}: ${e}`));
    }
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(errors ? `\n${errors} fout(en)` : '\nAlles OK');
process.exit(errors ? 1 : 0);
