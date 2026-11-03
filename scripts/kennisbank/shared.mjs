export const SITE = 'https://mvdbmedia.nl';
export const DATE = '2026-10-23';

export const PERSON = {
  '@type': 'Person',
  name: 'Michael van den Bosch',
  '@id': `${SITE}/#michael-van-den-bosch`,
};

export const AREA_SERVED = [
  { '@type': 'City', name: 'Sneek' },
  { '@type': 'City', name: 'Leeuwarden' },
  { '@type': 'City', name: 'Heerenveen' },
  { '@type': 'City', name: 'Drachten' }, { '@type': 'City', name: 'Harlingen' },
  { '@type': 'AdministrativeArea', name: 'Friesland' },
  { '@type': 'Country', name: 'Nederland' },
];

export const AGGREGATE_RATING = {
  '@type': 'AggregateRating',
  ratingValue: '5.0',
  bestRating: '5',
  worstRating: '1',
  reviewCount: '1',
};

export const REVIEW = {
  '@type': 'Review',
  reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5', worstRating: '1' },
  author: { '@type': 'Person', name: 'Gerlof (Friesland Ontruimingen)' },
  publisher: { '@type': 'Organization', name: 'Google' },
  reviewBody: 'Zeer professionele service, ruimdenkend en creatief om tot het beste resultaat te me komen. Daarnaast ook nog eens hele scherpe prijzen!',
};

export const LOCAL_BUSINESS = {
  '@type': ['ProfessionalService', 'LocalBusiness'],
  '@id': SITE,
  name: 'MVDBmedia',
  url: SITE,
  description: 'MVDBmedia levert webdesign op maat en professionele portret-, vastgoed- en dronefotografie. Gevestigd in Sneek, actief in Leeuwarden, Heerenveen, Harlingen, Drachten en heel Friesland, en landelijk beschikbaar.',
  image: `${SITE}/fotos/michael-profiel.jpg`,
  telephone: '+31624819278',
  email: 'info@mvdbmedia.nl',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Dagpauwoog 15',
    postalCode: '8607 HN',
    addressLocality: 'Sneek',
    addressRegion: 'Friesland',
    addressCountry: 'NL',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 53.033, longitude: 5.659 },
  areaServed: AREA_SERVED,
  priceRange: '€€',
  currenciesAccepted: 'EUR',
  knowsLanguage: 'nl-NL',
  founder: { '@type': 'Person', '@id': `${SITE}/#michael-van-den-bosch`, name: 'Michael van den Bosch' },
  sameAs: ['https://www.instagram.com/mvdbmedia', 'https://maps.app.goo.gl/tzDFTKJLBTuvmsKy8', 'https://g.page/r/CW9KIY_IYVdrEBM/review'],
  aggregateRating: AGGREGATE_RATING,
  review: REVIEW,
};

export const GUIDES_LABEL = 'Webdesign Gidsen';

export const TOP4 = [
  { href: '/webdesign-kosten-friesland', text: 'Wat kost een website?' },
  { href: '/maatwerk-website-vs-wordpress', text: 'Maatwerk vs WordPress' },
  { href: '/snelle-website-laten-maken', text: 'Snelle website laten maken' },
  { href: '/website-laten-maken-sneek', text: 'Webdesigner in Sneek' },
];
export const ALL_GUIDES_LINK = { href: '/kennisbank', text: 'Bekijk alle gidsen →' };

const INLINE_LINK_STYLE = 'font-size:0.8rem;color:var(--text-secondary);text-decoration:none;transition:color 0.2s ease;';
const INLINE_HOVER = `data-s-mouseover="this.style.color='var(--text-primary)'" data-s-mouseout="this.style.color='var(--text-secondary)'"`;

export function guidesColumn({ labelOpen, gap = 11, useClass = true, indent = '        ', eol = '\n' } = {}) {
  const link = ({ href, text }, extra = '') =>
    useClass
      ? `<a href="${href}" class="footer-link${extra ? ' ' + extra : ''}">${text}</a>`
      : extra
        ? `<a href="${href}" style="${INLINE_LINK_STYLE}color:var(--orange);font-weight:600;">${text}</a>`
        : `<a href="${href}" style="${INLINE_LINK_STYLE}" ${INLINE_HOVER}>${text}</a>`;
  const lines = [
    '<div>',
    `  ${labelOpen}${GUIDES_LABEL}</div>`,
    `  <div style="display:flex;flex-direction:column;gap:${gap}px;">`,
    ...TOP4.map((l) => `    ${link(l)}`),
    `    ${link(ALL_GUIDES_LINK, 'all')}`,
    '  </div>',
    '</div>',
  ];
  return lines.map((l, i) => (i === 0 ? l : indent + l)).join(eol);
}
