export const SITE = 'https://mvdbmedia.nl';
export const DATE = '2026-10-23';

export const PERSON = {
  '@type': 'Person',
  name: 'Michael van den Bosch',
  '@id': `${SITE}/#michael-van-den-bosch`,
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
const INLINE_HOVER = `onmouseover="this.style.color='var(--text-primary)'" onmouseout="this.style.color='var(--text-secondary)'"`;

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
