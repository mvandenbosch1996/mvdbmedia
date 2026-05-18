// IndexNow — meldt alle pagina's aan bij Bing + Google
// Gebruik: node indexnow.mjs

const KEY = 'ab82fe5c2ec026af9d15f773349cb4b6';
const HOST = 'mvdbmedia.nl';

const urls = [
  'https://mvdbmedia.nl/',
  'https://mvdbmedia.nl/portret-groepsfotografie.html',
  'https://mvdbmedia.nl/portretfotografie.html',
  'https://mvdbmedia.nl/groepsfotografie.html',
  'https://mvdbmedia.nl/vastgoedfotografie.html',
  'https://mvdbmedia.nl/dronevisuals.html',
  'https://mvdbmedia.nl/drone-vastgoed.html',
  'https://mvdbmedia.nl/drone-constructie.html',
  'https://mvdbmedia.nl/drone-events.html',
  'https://mvdbmedia.nl/drone-auto.html',
  'https://mvdbmedia.nl/evenementen.html',
  'https://mvdbmedia.nl/webdesignopmaat.html',
  'https://mvdbmedia.nl/portfolio.html',
];

const body = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList: urls,
});

console.log(`Melden van ${urls.length} pagina's bij IndexNow...`);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body,
});

if (res.status === 200 || res.status === 202) {
  console.log('✓ Aangemeld! Zoekmachines crawlen binnenkort de bijgewerkte pagina\'s.');
} else {
  console.log('Status: ' + res.status);
  console.log(await res.text());
}
