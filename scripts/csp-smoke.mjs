// Browser-test tegen een server MET de _headers-CSP (wrangler pages dev), niet tegen serve.mjs.
//   npx wrangler@4 pages dev . --port 8788   (andere terminal)
//   node scripts/csp-smoke.mjs [baseUrl]
// Controleert per pagina op 390 en 1440px: CSP-violations, JS-fouten, mislukte requests,
// kapotte afbeeldingen, horizontale overflow. Plus interactie-tests voor de ui.js-bridge.
import fs from 'fs';
import puppeteer from 'puppeteer';

const BASE = (process.argv[2] || 'http://127.0.0.1:8788').replace(/\/$/, '');
const sitemap = fs.readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const urls = [...sitemap.matchAll(/<loc>https:\/\/mvdbmedia\.nl([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
for (const extra of ['/intake', '/admin/login/', '/privacybeleid', '/404-bestaat-niet']) if (!urls.includes(extra)) urls.push(extra);

const failures = [];
const fail = (msg) => { failures.push(msg); console.log('  FAIL', msg); };

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

async function scan(path, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  const problems = [];
  await page.evaluateOnNewDocument(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/status of 404/.test(m.text())) problems.push('console: ' + m.text().slice(0, 160));
  });
  page.on('requestfailed', (r) => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') problems.push('requestfailed: ' + r.url()); });
  await page.goto(BASE + path, { waitUntil: 'networkidle0', timeout: 45000 });
  await page.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; }));
  await new Promise((r) => setTimeout(r, 400));
  const info = await page.evaluate(() => ({
    csp: window.__csp,
    broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).map((i) => i.currentSrc).slice(0, 3),
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    inlineHandlers: document.querySelectorAll('[onclick],[onmouseover],[onmouseout],[onfocus],[onblur],[onchange],[onsubmit],[onload],[onerror]').length,
    inlineScripts: [...document.scripts].filter((s) => !s.src && !/json/.test(s.type)).length,
  }));
  info.csp.forEach((v) => problems.push('CSP-violation: ' + v));
  if (info.broken.length) problems.push('broken img: ' + info.broken.join(', '));
  if (info.overflow) problems.push('horizontale overflow');
  if (info.inlineHandlers) problems.push(`${info.inlineHandlers} inline handlers in DOM`);
  if (info.inlineScripts) problems.push(`${info.inlineScripts} inline scripts in DOM`);
  await page.close();
  return problems;
}

for (const path of urls) {
  for (const width of [390, 1440]) {
    const problems = await scan(path, width);
    console.log(`${problems.length ? 'xx' : 'ok'} ${String(width).padStart(4)} ${path}`);
    problems.forEach((p) => fail(`${path}@${width}: ${p}`));
  }
}

// ---- Interactie-tests (ui.js-bridge) ----
console.log('\nInteractie-tests');
async function withPage(path, width, fn) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + path, { waitUntil: 'networkidle0' });
  try { await fn(page); } catch (e) { fail(`${path}: ${e.message}`); }
  if (errs.length) fail(`${path}: pageerror ${errs[0]}`);
  await page.close();
}
const check = (cond, msg) => { if (!cond) throw new Error(msg); };

await withPage('/', 390, async (page) => {
  await page.click('#menu-btn');
  check(await page.$eval('#mobile-menu', (e) => e.style.display) === 'flex', 'index: menu opent niet via data-a-click');
  await page.click('#menu-btn');
  check(await page.$eval('#mobile-menu', (e) => e.style.display) === 'none', 'index: menu sluit niet');
  await page.select('#form-dienst', 'portret');
  await new Promise((r) => setTimeout(r, 200));
  check((await page.$$('#pakket-opties button')).length > 0, 'index: pakketkeuze verschijnt niet na dienst-select');
  await page.focus('#form-naam');
  check(await page.$eval('#form-naam', (e) => e.style.borderColor) !== '', 'index: focus-stijl (data-s-focus) niet toegepast');
  await page.type('#form-naam', 'x');
  await page.$eval('#form-naam', (e) => e.blur());
});

await withPage('/', 1440, async (page) => {
  const sel = '#nav-links a';
  await page.hover(sel);
  const hov = await page.$eval(sel, (e) => e.style.color);
  check(hov.includes('var(--text-primary)') || hov !== '', 'index: nav-hover niet toegepast');
  await page.keyboard.press('Tab');
  const left = await page.$eval('a[href="#main-content"]', (e) => e.style.left);
  check(left === '16px', `skip-link niet zichtbaar bij focus (left=${left})`);
});

await withPage('/starter-website-pakket', 1440, async (page) => {
  const btn = await page.$('.faq-btn');
  await btn.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await btn.click();
  check(await page.$eval('.faq-item', (e) => e.classList.contains('open')), 'starter: FAQ opent niet (toggleFaq)');
});

await withPage('/portfolio', 1440, async (page) => {
  const card = await page.$('.proj-card');
  await card.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await card.click({ offset: { x: 10, y: 10 } });
  await new Promise((r) => setTimeout(r, 400));
  check(await page.$eval('#lightbox', (e) => e.classList.contains('lb-open')), 'portfolio: lightbox opent niet (openProject)');
  const before = await page.$eval('#lightbox-img', (e) => e.getAttribute('src'));
  await page.click('#lb-next');
  await new Promise((r) => setTimeout(r, 200));
  check(before !== await page.$eval('#lightbox-img', (e) => e.getAttribute('src')), 'portfolio: lbNext werkt niet');
  await page.click('#lb-close');
  await new Promise((r) => setTimeout(r, 400));
  check(!(await page.$eval('#lightbox', (e) => e.classList.contains('lb-open'))), 'portfolio: lightbox sluit niet');
  await page.click('.filter-btn[data-filter="drone"]');
  check(await page.$$eval('.proj-card.is-hidden', (n) => n.length) > 0, 'portfolio: filter werkt niet');
});

await withPage('/privacybeleid', 390, async (page) => {
  await page.click('#menu-btn');
  check(await page.$eval('#mobile-menu', (e) => e.style.display) === 'flex', 'privacybeleid: @toggleMenu werkt niet');
});

await withPage('/intake', 1440, async (page) => {
  await page.type('#bedrijf', 'Testbedrijf');
  const pct = await page.$eval('#pct', (e) => e.textContent);
  check(pct !== '0%', 'intake: voortgangsbalk reageert niet (intake.js)');
});

// Canary: bewijst dat de CSP echt inline scripts blokkeert (anders zijn bovenstaande tests betekenisloos)
await withPage('/', 1440, async (page) => {
  await page.evaluate(() => {
    const s = document.createElement('script');
    s.textContent = 'window.__inlineRan = true';
    document.body.appendChild(s);
  });
  const res = await page.evaluate(() => ({ ran: !!window.__inlineRan }));
  check(!res.ran, 'CANARY: inline script werd uitgevoerd, CSP staat niet af');
});

await browser.close();
console.log(failures.length ? `\n${failures.length} FOUT(EN)` : '\nAlles OK');
process.exit(failures.length ? 1 : 0);
