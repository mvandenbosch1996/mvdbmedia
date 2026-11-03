// Gedeelde pagina-onderdelen (nav, footer, <head>) voor de generators: kennisbank en GEO-landingspagina's.
import { TOP4, ALL_GUIDES_LINK, GUIDES_LABEL } from './shared.mjs';
import { ogUrl, ogAlt } from '../og-images.mjs';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const jsonLd = (obj) => `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2).replace(/</g, '\\u003c')}\n</script>`;

// ── Gedeelde onderdelen ─────────────────────────────────────────────────────
export const NAV_LINKS = [
  ['/webdesignopmaat', 'Webdesign'],
  ['/portret-groepsfotografie', 'Portret'],
  ['/vastgoedfotografie', 'Vastgoed'],
  ['/dronevisuals', 'Drone'],
  ['/portfolio', 'Portfolio'],
  ['/#over', 'Over mij'],
  ['/#contact', 'Contact'],
];

export const navHtml = () => `
  <a href="#main-content" class="skip-link">Naar hoofdinhoud</a>
  <nav id="nav" class="nav-pad" aria-label="Hoofdnavigatie">
    <a href="/" class="nav-logo" aria-label="MVDBmedia, naar de homepage">MVDB<span>media</span></a>
    <div id="nav-links">
${NAV_LINKS.map(([h, t]) => `      <a href="${h}" class="nav-link">${t}</a>`).join('\n')}
    </div>
    <a id="nav-cta" href="/#contact" class="btn-orange">Offerte aanvragen</a>
    <button id="menu-btn" type="button" aria-label="Menu openen" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span><span></span></button>
  </nav>
  <div id="mobile-menu">
${NAV_LINKS.map(([h, t]) => `    <a href="${h}">${t}</a>`).join('\n')}
    <a href="/#contact" class="mobile-cta">Offerte aanvragen</a>
  </div>`;

export const footerHtml = () => `
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-grid">
        <div>
          <a href="/" class="footer-brand">MVDB<span>media</span></a>
          <p class="footer-blurb">Webdesign, fotografie en drone vanuit Sneek. Actief in Leeuwarden, Heerenveen, Drachten en heel Friesland.</p>
          <div class="footer-label spaced">Algemeen</div>
          <address>Dagpauwoog 15<br>8607 HN Sneek<br><br>KVK: 42084901<br>BTW: NL005483105B05</address>
        </div>
        <div>
          <div class="footer-label">Diensten</div>
          <div class="footer-col">
            <a href="/webdesignopmaat" class="footer-link">Webdesign op maat</a>
            <a href="/portret-groepsfotografie" class="footer-link">Portret &amp; Groepsfotografie</a>
            <a href="/vastgoedfotografie" class="footer-link">Vastgoedfotografie</a>
            <a href="/dronevisuals" class="footer-link">Drone Visuals</a>
          </div>
        </div>
        <div>
          <div class="footer-label">Navigatie</div>
          <div class="footer-col">
            <a href="/portfolio" class="footer-link">Portfolio</a>
            <a href="/#over" class="footer-link">Over mij</a>
            <a href="/#contact" class="footer-link">Contact</a>
          </div>
        </div>
        <div>
          <div class="footer-label">${GUIDES_LABEL}</div>
          <div class="footer-col">
${TOP4.map((l) => `            <a href="${l.href}" class="footer-link">${l.text}</a>`).join('\n')}
            <a href="${ALL_GUIDES_LINK.href}" class="footer-link all">${ALL_GUIDES_LINK.text}</a>
          </div>
        </div>
        <div>
          <div class="footer-label">Volg ons</div>
          <div class="footer-col">
            <a href="https://www.instagram.com/mvdbmedia" target="_blank" rel="noopener noreferrer" class="footer-link">Instagram</a>
            <a href="https://g.page/r/CW9KIY_IYVdrEBM/review" target="_blank" rel="noopener noreferrer" class="footer-link"><span style="color:var(--orange);">★</span> Laat een review achter</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="copy">© 2026 MVDBmedia. Alle rechten voorbehouden.</div>
        <a href="/privacybeleid">Privacybeleid</a>
        <a href="/algemene-voorwaarden">Algemene voorwaarden</a>
      </div>
    </div>
  </footer>

  <a href="https://wa.me/31624819278" target="_blank" rel="noopener noreferrer" class="whatsapp-fab" aria-label="Neem contact op via WhatsApp">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
  </a>`;

export const headHtml = ({ title, description, url, ogType, ogSlug, extraMeta = '', schema }) => `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="author" content="Michael van den Bosch">
  <link rel="canonical" href="${url}">

  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${ogUrl(ogSlug)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:alt" content="${esc(ogAlt(ogSlug))}">
  <meta property="og:locale" content="nl_NL">
  <meta property="og:site_name" content="MVDBmedia">${extraMeta}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${ogUrl(ogSlug)}">
  <meta name="twitter:image:alt" content="${esc(ogAlt(ogSlug))}">

  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png">
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

${schema.map(jsonLd).join('\n')}

  <link rel="preload" href="/fonts/bebas-neue-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/fonts/fonts.css">
  <noscript><style>.scroll-reveal{opacity:1!important;transform:none!important}</style></noscript>
  <link rel="stylesheet" href="/kennisbank.css">
  <link rel="stylesheet" href="/related.css">
  <link rel="stylesheet" href="/faq.css">
</head>`;
