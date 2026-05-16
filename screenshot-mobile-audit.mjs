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
  { url: 'http://localhost:3000/dronevisuals.html', label: 'drone' },
  { url: 'http://localhost:3000/portretfotografie.html', label: 'portret' },
];

const browser = await puppeteer.launch({ headless: 'new' });

for (const p of pages) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 30000 });

  // Disable animations and force all elements visible
  await page.addStyleTag({ content: `
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
    }
  ` });

  // Trigger all intersection observer callbacks by forcing visible class
  await page.evaluate(() => {
    document.querySelectorAll('.fade-in, .dienst-card, .over-photo, .dienst-tag').forEach(el => {
      el.classList.add('is-visible');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    // Force all elements with opacity 0 to be visible
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.opacity === '0') el.style.opacity = '1';
    });
  });

  await new Promise(r => setTimeout(r, 300));
  const outPath = path.join(screenshotDir, `screenshot-${next}-audit-${p.label}.png`);
  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`Saved: screenshot-${next}-audit-${p.label}.png`);
  next++;
  await page.close();
}

await browser.close();
