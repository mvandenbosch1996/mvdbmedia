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

const card = ({ href, cat, name, text, more }) => `
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
