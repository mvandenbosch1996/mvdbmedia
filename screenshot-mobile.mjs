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

const pages = [
  { url: 'http://localhost:3000', label: 'home' },
  { url: 'http://localhost:3000/portretfotografie.html', label: 'portret' },
  { url: 'http://localhost:3000/dronevisuals.html', label: 'drone' },
  { url: 'http://localhost:3000/portfolio.html', label: 'portfolio' },
];

const browser = await puppeteer.launch({ headless: 'new' });
for (const p of pages) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 30000 });
  const outPath = path.join(screenshotDir, `screenshot-${next}-mobile-${p.label}.png`);
  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`Saved: screenshot-${next}-mobile-${p.label}.png`);
  next++;
  await page.close();
}
await browser.close();
