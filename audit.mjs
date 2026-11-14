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
  'http://localhost:3000/portfolio/kampr.html',
  'http://localhost:3000/portfolio/fitplan-nesaclinics.html',
  'http://localhost:3000/portfolio/portretshoot-marit.html',
  'http://localhost:3000/portfolio/luchtfotografie-bled-slovenie.html',
  'http://localhost:3000/portfolio/hondenfotos-ollie.html',
  'http://localhost:3000/portfolio/hondenfotos-ziggy.html',
  'http://localhost:3000/portfolio/bouwbedrijf-vellinga-bouwplaats.html',
  'http://localhost:3000/portfolio/friesland-ontruimingen-groepsfoto.html',
  'http://localhost:3000/webapplicatie-saas-laten-maken.html',
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
      // ERR_ABORTED = door de browser afgebroken (lazy image bij sluiten pagina), geen echte fout
      if (req.failure()?.errorText === 'net::ERR_ABORTED') return;
      failedRequests.push('FAIL: ' + req.url() + ' — ' + (req.failure()?.errorText ?? 'unknown'));
    });
    page.on('response', async res => {
      if (res.status() === 404) failedRequests.push('404: ' + res.url());
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

      // Scroll to trigger lazy-loaded images, then wait until every image has finished loading
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
          }, 100);
        });
      });
      await page.waitForFunction(
        () => Array.from(document.images).every(img => !img.src || img.src.startsWith('data:') || img.complete),
        { timeout: 10000 }
      ).catch(() => {});
      await new Promise(r => setTimeout(r, 300));

      // Kapot = geladen maar leeg, of nog niet geladen (lazy buiten beeld) terwijl het bestand niet bestaat
      const brokenImgs = await page.evaluate(async () => {
        const broken = [];
        for (const img of Array.from(document.images)) {
          if (!img.src || img.src.startsWith('data:')) continue;
          if (img.complete && img.naturalWidth > 0) continue;
          if (img.complete) { broken.push(img.src); continue; }
          const res = await fetch(img.currentSrc || img.src, { method: 'HEAD' }).catch(() => null);
          if (!res || !res.ok) broken.push(img.src);
        }
        return broken;
      });

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
