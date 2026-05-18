import puppeteer from 'puppeteer';

const pages = [
  'http://localhost:3000',
  'http://localhost:3000/portret-groepsfotografie.html',
  'http://localhost:3000/portretfotografie.html',
  'http://localhost:3000/groepsfotografie.html',
  'http://localhost:3000/vastgoedfotografie.html',
  'http://localhost:3000/dronevisuals.html',
  'http://localhost:3000/drone-vastgoed.html',
  'http://localhost:3000/drone-events.html',
  'http://localhost:3000/drone-constructie.html',
  'http://localhost:3000/drone-auto.html',
  'http://localhost:3000/evenementen.html',
  'http://localhost:3000/webdesignopmaat.html',
  'http://localhost:3000/portfolio.html',
];

const browser = await puppeteer.launch({ headless: 'new' });

try {
  for (const url of pages) {
    const page = await browser.newPage();
    const jsErrors = [];
    const failedRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') jsErrors.push(msg.text());
    });
    page.on('requestfailed', req => {
      failedRequests.push('FAIL: ' + req.url() + ' — ' + (req.failure()?.errorText ?? 'unknown'));
    });
    page.on('response', async res => {
      if (res.status() === 404) failedRequests.push('404: ' + res.url());
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

      // Scroll to trigger lazy-loaded images before checking
      await page.evaluate(async () => {
        await new Promise(resolve => {
          let totalHeight = 0;
          const distance = 400;
          const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;
            if (totalHeight >= document.body.scrollHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0);
              resolve();
            }
          }, 50);
        });
      });
      await new Promise(r => setTimeout(r, 800));

      const brokenImgs = await page.evaluate(() =>
        Array.from(document.images)
          .filter(img => {
            if (!img.src || img.src.startsWith('data:')) return false;
            if (img.loading === 'lazy' && !img.getBoundingClientRect().width) return false;
            return !img.complete || img.naturalWidth === 0;
          })
          .map(img => img.src)
      );

      const name = url.replace('http://localhost:3000/', '') || 'index.html';
      console.log('\n=== ' + name + ' ===');
      console.log('JS errors:', jsErrors.length ? jsErrors : 'geen');
      console.log('Failed requests:', failedRequests.length ? failedRequests : 'geen');
      console.log('Broken images:', brokenImgs.length ? brokenImgs : 'geen');
    } catch (err) {
      console.log('\n=== ' + url + ' — ERROR ===');
      console.log(err.message);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
