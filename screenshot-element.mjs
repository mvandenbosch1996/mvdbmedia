import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'temporary screenshots');
const existing = fs.readdirSync(screenshotDir)
  .filter(f => f.startsWith('screenshot-') && f.endsWith('.png'))
  .map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] ?? '0'))
  .filter(n => !isNaN(n));
let next = existing.length ? Math.max(...existing) + 1 : 1;

const url = process.argv[2];
const selector = process.argv[3];
const label = process.argv[4] || 'element';

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2' });
await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
await page.evaluate(() => {
  document.querySelectorAll('.scroll-reveal, .dienst-card, .fade-in').forEach(el => {
    el.classList.add('is-visible');
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.filter = 'none';
  });
});
await new Promise(r => setTimeout(r, 400));
const el = await page.$(selector);
if (el) {
  const outPath = path.join(screenshotDir, `screenshot-${next}-${label}.png`);
  await el.screenshot({ path: outPath });
  console.log(`Saved: screenshot-${next}-${label}.png`);
} else {
  console.log('Element niet gevonden');
}
await browser.close();
