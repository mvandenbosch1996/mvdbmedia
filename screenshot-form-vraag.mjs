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
const outPath = path.join(screenshotDir, `screenshot-${next}-form-vraag.png`);

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
await page.evaluate(() => document.getElementById('contact').scrollIntoView());
await new Promise(r => setTimeout(r, 400));

// Select "Algemene vraag stellen"
await page.select('#form-reden', 'vraag');
await new Promise(r => setTimeout(r, 500));

const form = await page.$('#contact .contact-grid > div:last-child');
await form.screenshot({ path: outPath });
console.log(`Screenshot saved: temporary screenshots/screenshot-${next}-form-vraag.png`);
await browser.close();
