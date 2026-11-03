// Gedeelde HTML voor de interne-linkblokken: dienstpagina's -> gidsen en gidsen -> diensten.
import guides from './content/index.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const SERVICES = {
  starter: {
    href: '/starter-website-pakket',
    cat: 'Vanaf €499 excl. btw',
    name: 'Starter Website Pakket',
    text: 'Een compacte, snelle website voor ondernemers die online willen starten. Oplevering binnen 7 werkdagen.',
  },
  business: {
    href: '/business-website-pakket',
    cat: 'Vanaf €999 excl. btw',
    name: 'Business Website Pakket',
    text: 'Een uitgebreide website die is opgebouwd om meer aanvragen te krijgen. Oplevering binnen 2 weken.',
  },
  maatwerk: {
    href: '/webdesignopmaat',
    cat: 'Webdesign op maat',
    name: 'Alle pakketten en werkwijze',
    text: 'Van eerste gesprek tot livegang: zo werk ik, wat het kost en welk pakket bij jou past.',
  },
};

// Foto- en dronediensten: cards voor onderlinge links (zie scripts/link-services.mjs).
export const PAGES = {
  evenementen: { href: '/evenementen', cat: 'Evenementfotografie', name: 'Evenementenfotograaf Friesland', text: 'Festivals, openingen en bedrijfsfeesten: sfeervolle beelden, snel geleverd.' },
  droneEvents: { href: '/drone-events', cat: 'Drone', name: 'Drone-eventfotografie', text: 'Luchtbeelden van festivals en bedrijfsdagen voor een uniek perspectief.' },
  droneVastgoed: { href: '/drone-vastgoed', cat: 'Drone', name: 'Drone vastgoedfotografie', text: 'Luchtfoto’s en video van panden voor makelaars en bouwbedrijven.' },
  droneConstructie: { href: '/drone-constructie', cat: 'Drone', name: 'Bouwvoortgang vanuit de lucht', text: 'Drone-inspecties en visuele rapportages van bouwprojecten.' },
  droneAuto: { href: '/drone-auto', cat: 'Drone', name: 'Cinematische autobeelden', text: 'Car photography en dronevideo’s voor dealers en content creators.' },
  drone: { href: '/dronevisuals', cat: 'Drone', name: 'Alle dronevisuals', text: 'Cinematische dronebeelden in 4K voor bedrijven, vastgoed en evenementen.' },
  vastgoed: { href: '/vastgoedfotografie', cat: 'Vastgoed', name: 'Vastgoedfotografie', text: 'Interieur, exterieur en 360°-tours voor makelaars, geleverd binnen 72 uur.' },
  groep: { href: '/groepsfotografie', cat: 'Groepsfotografie', name: 'Groepsfotografie', text: 'Teams, families en verenigingen: strakke regie en een natuurlijke uitstraling.' },
  portret: { href: '/portretfotografie', cat: 'Portretfotografie', name: 'Portretfotograaf Sneek', text: 'Zakelijke headshots, LinkedIn-foto’s en portretten op locatie.' },
  portretGroep: { href: '/portret-groepsfotografie', cat: 'Fotografie', name: 'Portret- en groepsfotografie', text: 'Headshots, familieportretten en teamfoto’s met bewerking inbegrepen.' },
  caseVellinga: { href: '/portfolio/bouwbedrijf-vellinga-bouwplaats', cat: 'Case-study', name: 'Bouwplaats Bouwbedrijf Vellinga', text: '13 luchtfoto’s van grondwerk tot rieten daken.' },
  caseBled: { href: '/portfolio/luchtfotografie-bled-slovenie', cat: 'Case-study', name: 'Luchtfotografie Bled, Slovenië', text: 'Drone-opname van het eiland in het Meer van Bled.' },
  caseOntruimingen: { href: '/portfolio/friesland-ontruimingen-groepsfoto', cat: 'Case-study', name: 'Teamfoto Friesland Ontruimingen', text: 'Zakelijke groepsfoto buiten op locatie.' },
};

// Welke dienstpagina's passen bij welke gids (contextuele interne links gids -> dienst).
export const GUIDE_SERVICES = {
  'webdesign-kosten-friesland': ['starter', 'business', 'maatwerk'],
  'maatwerk-website-vs-wordpress': ['business', 'maatwerk'],
  'snelle-website-laten-maken': ['starter', 'maatwerk'],
  'website-laten-maken-sneek': ['starter', 'business', 'maatwerk'],
  'website-beveiliging-onderhoud': ['business', 'maatwerk'],
  'seo-webdesign-hoger-in-google': ['business', 'maatwerk'],
  'conversie-gericht-webdesign': ['business', 'maatwerk'],
  'webapplicatie-saas-laten-maken': ['maatwerk', 'business'],
};

// Slotsectie per gids: contextuele links naar portfolio-cases en stadspagina's met beschrijvende ankers (hub-and-spoke).
const CITY = (slug) => `/webdesign-fotografie-${slug}`;
export const GUIDE_PRACTICE = {
  'webdesign-kosten-friesland': {
    h2: 'Prijzen in de praktijk en in jouw regio',
    html: `
        <p>Wil je zien wat een maatwerk traject oplevert? Lees de case-study van het <a href="/portfolio/kampr">boekingsplatform Kampr.nl</a>, een volledig zelfgebouwd SaaS-product. Voor lokale ondernemers staan prijzen en werkwijze ook uitgewerkt op de pagina's over <a href="${CITY('leeuwarden')}">webdesign in Leeuwarden</a> en <a href="${CITY('heerenveen')}">webdesign in Heerenveen</a>.</p>`,
  },
  'maatwerk-website-vs-wordpress': {
    h2: 'Maatwerk in de praktijk',
    html: `
        <p>Een voorbeeld van maatwerk is het <a href="/portfolio/kampr">SaaS-boekingsplatform Kampr.nl</a>, gebouwd rond één duidelijk probleem voor één doelgroep. Wil je lezen hoe dat voor een lokale ondernemer uitpakt? Bekijk <a href="${CITY('heerenveen')}">snelle maatwerk websites voor ondernemers in Heerenveen</a> of <a href="${CITY('drachten')}">zakelijke websites voor industrie en techniek in Drachten</a>.</p>`,
  },
  'snelle-website-laten-maken': {
    h2: 'Snel online in jouw regio',
    html: `
        <p>Een snelle start werkt het best als ook de beelden op orde zijn. Een voorbeeld daarvan is de case <a href="/portfolio/fitplan-nesaclinics">bedrijfsfotografie voor Fitplan en NESAclinics in Sneek</a>. Zoek je een snelle website in de buurt? Bekijk <a href="${CITY('heerenveen')}">webdesign voor ondernemers in Heerenveen</a> of <a href="${CITY('harlingen')}">webdesign voor horeca en verhuur in Harlingen</a>.</p>`,
  },
  'website-laten-maken-sneek': {
    h2: 'Voorbeelden van mijn werk',
    html: `
        <p>Een greep uit het portfolio: de <a href="/portfolio/fitplan-nesaclinics">bedrijfsfotografie voor Fitplan en NESAclinics in Sneek</a> en het SaaS-platform <a href="/portfolio/kampr">Kampr.nl</a>. Meer voorbeelden vind je in het <a href="/portfolio">volledige portfolio van MVDBmedia</a>.</p>`,
  },
  'website-beveiliging-onderhoud': {
    h2: 'Beveiliging in de praktijk',
    html: `
        <p>Beveiliging telt extra zwaar als een site betalingen of accounts verwerkt, zoals het boekingsplatform in de <a href="/portfolio/kampr">case-study van Kampr.nl</a>. Voor zakelijke websites lees je meer over <a href="${CITY('drachten')}">websites voor industrie en techniek in Drachten</a> en <a href="${CITY('leeuwarden')}">webdesign voor zakelijke dienstverleners in Leeuwarden</a>.</p>`,
  },
  'seo-webdesign-hoger-in-google': {
    h2: 'Lokale vindbaarheid in de praktijk',
    html: `
        <p>Lokale SEO werkt het best met een eigen pagina per plaats. Zo ziet dat eruit voor <a href="${CITY('leeuwarden')}">webdesign en fotografie in Leeuwarden</a> en <a href="${CITY('harlingen')}">webdesign en fotografie in Harlingen</a>. Ook eigen beeld versterkt het vertrouwen: zie de <a href="/portfolio/fitplan-nesaclinics">bedrijfsfotografie voor Fitplan en NESAclinics</a> als voorbeeld.</p>`,
  },
  'conversie-gericht-webdesign': {
    h2: 'Vertrouwen en conversie in de praktijk',
    html: `
        <p>Echte foto's van team en werkplek geven bezoekers vertrouwen. Bekijk de <a href="/portfolio/friesland-ontruimingen-groepsfoto">teamfoto voor Friesland Ontruimingen</a> en de <a href="/portfolio/fitplan-nesaclinics">bedrijfsfotografie voor Fitplan en NESAclinics</a>. Voor ondernemers die meer aanvragen willen: <a href="${CITY('drachten')}">zakelijke websites in Drachten</a> en <a href="${CITY('leeuwarden')}">webdesign in Leeuwarden</a>.</p>`,
  },
  'webapplicatie-saas-laten-maken': {
    h2: 'Webapplicaties voor ondernemers in de regio',
    html: `
        <p>Naast de case-study van <a href="/portfolio/kampr">Kampr.nl</a> bouw ik webapplicaties voor ondernemers in heel Friesland. Lees over <a href="${CITY('drachten')}">maatwerk websites en webapplicaties in Drachten</a> of <a href="${CITY('leeuwarden')}">webdesign in Leeuwarden</a>.</p>`,
  },
};

export const card = ({ href, cat, name, text, more }) => `
          <li><a class="rel-card" href="${href}">
            <span class="rel-cat">${esc(cat)}</span>
            <span class="rel-name">${esc(name)}</span>
            <span class="rel-text">${esc(text)}</span>
            <span class="rel-more" aria-hidden="true">${more}</span>
          </a></li>`;

export const guideCards = (slugs) =>
  slugs
    .map((slug) => {
      const g = guides.find((x) => x.slug === slug);
      if (!g) throw new Error(`Onbekende gids: ${slug}`);
      return card({ href: `/${g.slug}`, cat: g.category, name: g.title, text: g.cardSummary, more: 'Lees de gids →' });
    })
    .join('');

export const pageCards = (keys) =>
  keys.map((k) => { if (!PAGES[k]) throw new Error(`Onbekende pagina: ${k}`); return card({ ...PAGES[k], more: PAGES[k].cat === 'Case-study' ? 'Bekijk case →' : 'Bekijk dienst →' }); }).join('');

export const serviceCards = (keys) =>
  keys.map((k) => card({ ...SERVICES[k], more: 'Bekijk dienst →' })).join('');

export const relatedSection = ({ id, label, titleHtml, cardsHtml, allLink = true, extraClass = '' }) => `<section class="rel-section${extraClass ? ' ' + extraClass : ''}" aria-labelledby="${id}">
  <div class="rel-inner">
    <div class="orange-label">${esc(label)}</div>
    <h2 class="rel-title" id="${id}">${titleHtml}</h2>
    <ul class="rel-grid">${cardsHtml}
    </ul>${allLink ? `
    <p class="rel-all"><a href="/kennisbank">Bekijk alle gidsen in de kennisbank →</a></p>` : ''}
  </div>
</section>`;
