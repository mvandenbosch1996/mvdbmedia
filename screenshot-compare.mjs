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

const images = [
  { url: 'https://images.unsplash.com/photo-1656624991202-51c345f6eb4c?w=800&q=80&fit=crop', label: 'chase-1' },
  { url: 'https://images.unsplash.com/photo-1656622213931-bbd139651eb0?w=800&q=80&fit=crop', label: 'chase-2' },
  { url: 'https://images.unsplash.com/photo-1656624991208-d7fa00058f44?w=800&q=80&fit=crop', label: 'chase-3' },
  { url: 'https://images.unsplash.com/photo-1656623607569-e9e254d33aa1?w=800&q=80&fit=crop', label: 'chase-4' },
  { url: 'https://images.unsplash.com/photo-1656622110501-f80452c7e195?w=800&q=80&fit=crop', label: 'chase-5' },
];

const browser = await puppeteer.launch({ headless: 'new' });
for (const img of images) {
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 300 });
  await page.setContent(`<img src="${img.url}" style="width:400px;height:300px;object-fit:cover;display:block;">`);
  await page.waitForSelector('img');
  await new Promise(r => setTimeout(r, 1500));
  const outPath = path.join(screenshotDir, `screenshot-${next}-${img.label}.png`);
  await page.screenshot({ path: outPath });
  console.log(`Saved: screenshot-${next}-${img.label}.png`);
  next++;
  await page.close();
}
await browser.close();
