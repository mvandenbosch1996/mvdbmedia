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
const next = existing.length ? Math.max(...existing) + 1 : 1;
const label = process.argv[2] ? `-${process.argv[2]}` : '';
const outPath = path.join(screenshotDir, `screenshot-${next}${label}.png`);

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
await page.evaluate(() => document.getElementById('contact').scrollIntoView());
await new Promise(r => setTimeout(r, 600));
const form = await page.$('#contact .contact-grid > div:last-child');
if (form) {
  await form.screenshot({ path: outPath });
  console.log(`Screenshot saved: temporary screenshots/screenshot-${next}${label}.png`);
} else {
  await page.screenshot({ path: outPath, fullPage: false });
  console.log(`Fallback screenshot saved`);
}
await browser.close();
