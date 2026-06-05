// IndexNow — meldt alle pagina's aan bij Bing/Yandex/Seznam (Google doet niet mee aan IndexNow)
// Gebruik: node indexnow.mjs
// URLs zijn clean (geen .html) zodat ze matchen met de canonical tags + sitemap.

const KEY = 'ab82fe5c2ec026af9d15f773349cb4b6';
const HOST = 'mvdbmedia.nl';

const urls = [
  'https://mvdbmedia.nl/',
  'https://mvdbmedia.nl/portret-groepsfotografie',
  'https://mvdbmedia.nl/portretfotografie',
  'https://mvdbmedia.nl/groepsfotografie',
  'https://mvdbmedia.nl/vastgoedfotografie',
  'https://mvdbmedia.nl/dronevisuals',
  'https://mvdbmedia.nl/drone-vastgoed',
  'https://mvdbmedia.nl/drone-constructie',
  'https://mvdbmedia.nl/drone-events',
  'https://mvdbmedia.nl/drone-auto',
  'https://mvdbmedia.nl/evenementen',
  'https://mvdbmedia.nl/webdesignopmaat',
  'https://mvdbmedia.nl/starter-website-pakket',
  'https://mvdbmedia.nl/business-website-pakket',
  'https://mvdbmedia.nl/portfolio',
  'https://mvdbmedia.nl/privacybeleid',
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
