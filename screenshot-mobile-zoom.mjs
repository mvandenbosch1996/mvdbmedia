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

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
await page.evaluate(() => {
  document.querySelectorAll('*').forEach(el => {
    if (window.getComputedStyle(el).opacity === '0') el.style.opacity = '1';
  });
});
await new Promise(r => setTimeout(r, 300));

// Stats balk
const stats = await page.$('.over-stats-balk');
if (stats) {
  await stats.screenshot({ path: path.join(screenshotDir, `screenshot-${next}-stats-mobile.png`) });
  console.log(`Saved: screenshot-${next}-stats-mobile.png`); next++;
}

// Contact form
await page.evaluate(() => document.getElementById('contact').scrollIntoView());
await new Promise(r => setTimeout(r, 200));
const contact = await page.$('#contact');
if (contact) {
  await contact.screenshot({ path: path.join(screenshotDir, `screenshot-${next}-contact-mobile.png`) });
  console.log(`Saved: screenshot-${next}-contact-mobile.png`); next++;
}

// Check horizontal overflow
const hasOverflow = await page.evaluate(() => document.body.scrollWidth > document.body.clientWidth);
console.log(`Horizontal overflow: ${hasOverflow} (scrollWidth: ${document.body?.scrollWidth})`);
const overflow = await page.evaluate(() => ({
  scrollWidth: document.body.scrollWidth,
  clientWidth: document.body.clientWidth,
}));
console.log(`Body scrollWidth: ${overflow.scrollWidth}, clientWidth: ${overflow.clientWidth}`);

await browser.close();
