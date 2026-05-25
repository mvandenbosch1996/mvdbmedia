import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new' });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/business-website-pakket', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.querySelectorAll('.scroll-reveal').forEach(el => { el.style.opacity='1'; el.style.transform='none'; }));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'temporary screenshots/screenshot-354-business-full.png', fullPage: true });
  console.log('done');
} finally {
  await browser.close();
}
