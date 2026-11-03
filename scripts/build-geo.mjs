// Genereert de GEO-landingspagina's (webdesign + fotografie per stad) uit scripts/geo/steden.mjs
// Gebruik: node scripts/build-geo.mjs   (daarna: node scripts/og-images.mjs <slugs>, node scripts/build-sitemap.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, PERSON, LOCAL_BUSINESS } from './kennisbank/shared.mjs';
import { esc, navHtml, footerHtml, headHtml } from './kennisbank/layout.mjs';
import { card, serviceCards, pageCards, relatedSection } from './kennisbank/related.mjs';
import { ogUrl } from './og-images.mjs';
import { STEDEN, VERDER } from './geo/steden.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATE = '2026-11-03';
const DATE_LABEL = 'november 2026';

const stripTags = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const slugify = (s) => stripTags(s).toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const TEASERS = {
  'webdesign-fotografie-leeuwarden': 'Opvallen in de hoofdstad: websites, portretten, teamfoto’s en drone voor Leeuwarder ondernemers.',
  'webdesign-fotografie-heerenveen': 'Snelle websites en foto’s met energie voor sport, evenementen en MKB in Heerenveen.',
  'webdesign-fotografie-harlingen': 'Beeld dat gasten trekt: websites, vastgoedfoto’s en luchtbeelden voor haven, horeca en verhuur.',
  'webdesign-fotografie-drachten': 'Zakelijke websites, bedrijfsfoto’s en dronebeelden voor industrie, techniek en B2B.',
};

for (const c of STEDEN) {
  c.url = `${SITE}/${c.slug}`;
  if (VERDER[c.slug]) c.sections.push(VERDER[c.slug]);
  c.sections.forEach((s) => { s.id = slugify(s.h2); });
  const text = [c.answer, c.lead, ...c.sections.map((s) => `${stripTags(s.h2)} ${stripTags(s.html)}`), ...c.faq.map((f) => `${f.q} ${f.a}`)].join(' ');
  c.words = stripTags(text).split(' ').length;
}

const serviceNode = (c, kind) => {
  const area = { '@type': 'City', name: c.stad, containedInPlace: { '@type': 'AdministrativeArea', name: 'Friesland' } };
  if (kind === 'webdesign') {
    return {
      '@type': 'Service',
      '@id': `${c.url}#webdesign`,
      name: `Webdesign in ${c.stad}`,
      serviceType: 'Webdesign',
      description: `Maatwerk websites voor ondernemers in ${c.stad}: Starter-website vanaf €499 en Business-website vanaf €999, beide excl. btw.`,
      url: c.url,
      provider: { '@id': SITE },
      areaServed: area,
      offers: [
        { '@type': 'Offer', name: 'Starter-website', url: `${SITE}/starter-website-pakket`, priceCurrency: 'EUR', priceSpecification: { '@type': 'PriceSpecification', minPrice: 499, priceCurrency: 'EUR', valueAddedTaxIncluded: false } },
        { '@type': 'Offer', name: 'Business-website', url: `${SITE}/business-website-pakket`, priceCurrency: 'EUR', priceSpecification: { '@type': 'PriceSpecification', minPrice: 999, priceCurrency: 'EUR', valueAddedTaxIncluded: false } },
      ],
    };
  }
  return {
    '@type': 'Service',
    '@id': `${c.url}#fotografie`,
    name: `Fotografie en dronebeelden in ${c.stad}`,
    serviceType: 'Fotografie',
    description: `Portret-, groeps-, evenement- en vastgoedfotografie en dronebeelden voor ondernemers in ${c.stad}.`,
    url: c.url,
    provider: { '@id': SITE },
    areaServed: area,
  };
};

function page(c) {
  const webpageId = `${c.url}#webpage`;
  const imageObj = { '@type': 'ImageObject', license: `${SITE}/algemene-voorwaarden`, acquireLicensePage: `${SITE}/#contact`, url: ogUrl(c.slug), width: 1200, height: 630 };
  const crumbName = `Webdesign & fotografie ${c.stad}`;

  const schema = [
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': webpageId,
          url: c.url,
          name: c.metaTitle,
          description: c.metaDescription,
          inLanguage: 'nl-NL',
          breadcrumb: { '@id': `${c.url}#breadcrumb` },
          primaryImageOfPage: imageObj,
          about: [{ '@id': SITE }, { '@type': 'City', name: c.stad }],
          mainEntity: [{ '@id': `${c.url}#webdesign` }, { '@id': `${c.url}#fotografie` }],
          datePublished: DATE,
          dateModified: DATE,
          author: PERSON,
          publisher: PERSON,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${c.url}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
            { '@type': 'ListItem', position: 2, name: crumbName, item: c.url },
          ],
        },
        serviceNode(c, 'webdesign'),
        serviceNode(c, 'fotografie'),
        LOCAL_BUSINESS,
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${c.url}#faq`,
      mainEntity: c.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  const cta = {
    title: `Een website die opvalt in ${c.stad}?`,
    text: `Bekijk hoe ik maatwerk websites bouw voor ondernemers in ${c.stad} en de rest van Friesland. Vrijblijvende offerte, meestal binnen 24 uur.`,
  };
  const ctaInline = `
        <aside class="kb-cta-inline" aria-label="Offerte aanvragen">
          <div class="kb-cta-inline-text">
            <div class="kb-cta-inline-title">${esc(cta.title)}</div>
            <p>${esc(cta.text)}</p>
          </div>
          <a href="/#contact" class="btn-orange">Offerte aanvragen →</a>
        </aside>`;

  const body = c.sections.map((s) => `
        <h2 id="${s.id}">${s.h2}</h2>
        ${s.html.replace('{{CTA}}', ctaInline)}`).join('\n');

  const others = STEDEN.filter((x) => x.slug !== c.slug).map((x) => card({
    href: `/${x.slug}`, cat: 'Werkgebied', name: `Webdesign & fotografie ${x.stad}`, text: TEASERS[x.slug], more: 'Bekijk pagina →',
  }));
  others.push(card({ href: '/website-laten-maken-sneek', cat: 'Thuisbasis', name: 'Webdesigner in Sneek', text: 'Lokale webdesigner in Sneek en Friesland: persoonlijke aanpak, vaste prijzen en korte lijnen.', more: 'Lees de gids →' }));

  const html = `${headHtml({
    title: c.metaTitle,
    description: c.metaDescription,
    url: c.url,
    ogType: 'website',
    ogSlug: c.slug,
    schema,
  })}
<body>
${navHtml()}

  <main id="main-content">
    <header class="kb-hero grain-bg">
      <div class="kb-hero-inner">
        <nav class="kb-crumbs" aria-label="Kruimelpad">
          <ol>
            <li><a href="/">Home</a></li>
            <li aria-current="page">${esc(c.crumb)}</li>
          </ol>
        </nav>
        <ul class="kb-tags">${c.tags.map((t) => `<li class="kb-tag">${esc(t)}</li>`).join('')}</ul>
        <h1 class="kb-h1">${c.h1}</h1>
        <p class="kb-lead">${c.lead}</p>
        <div style="display:flex;flex-wrap:wrap;gap:14px;margin:0 0 4px;">
          <a href="/#contact" class="btn-orange">Offerte aanvragen</a>
          <a href="/portfolio" class="btn-ghost">Bekijk portfolio</a>
        </div>
        <div class="kb-stats">
          <div class="kb-stat"><b>€499</b><span>Website vanaf, excl. btw</span></div>
          <div class="kb-stat"><b>24 uur</b><span>Reactie op je aanvraag</span></div>
          <div class="kb-stat"><b>${esc(c.rijtijd)}</b><span>Vanuit Sneek naar ${esc(c.stad)}</span></div>
        </div>
        <div class="kb-meta" style="margin-top:22px;">
          <span>Door <strong>Michael van den Bosch</strong></span><span class="dot" aria-hidden="true"></span>
          <span>Bijgewerkt: <time datetime="${DATE}">${DATE_LABEL}</time></span>
        </div>
      </div>
    </header>

    <div class="kb-layout">
      <nav class="kb-toc" aria-label="Inhoudsopgave">
        <p class="kb-toc-title">Op deze pagina</p>
        <ol>
${c.sections.map((s) => `          <li><a href="#${s.id}">${s.h2}</a></li>`).join('\n')}
          <li><a href="#veelgestelde-vragen">Veelgestelde vragen</a></li>
        </ol>
      </nav>

      <article class="kb-prose">
        <div class="kb-answer">
          <p class="kb-answer-label">Kort antwoord</p>
          <p>${c.answer}</p>
        </div>
${body}

        <address style="font-size:0.95rem;line-height:1.8;color:var(--text-secondary);margin-top:36px;">
          <strong style="color:var(--text-primary);">MVDBmedia</strong><br>Dagpauwoog 15, 8607 HN Sneek<br>
          <a href="tel:+31624819278">+31 6 24 81 92 78</a> · <a href="mailto:info@mvdbmedia.nl">info@mvdbmedia.nl</a>
        </address>

        <div class="kb-author">
          <img src="/fotos/michael-profiel.webp" width="72" height="72" alt="Michael van den Bosch, webdesigner en fotograaf bij MVDBmedia in Sneek, actief in ${esc(c.stad)} en omgeving" loading="lazy" decoding="async">
          <div>
            <p class="kb-author-name">Michael van den Bosch</p>
            <p>Oprichter van MVDBmedia in Sneek. Ik ontwerp en bouw websites en webapplicaties op maat en maak foto’s en dronebeelden voor ondernemers in ${esc(c.stad)}, Friesland en heel Nederland. <a href="/#over">Meer over mij</a></p>
          </div>
        </div>
      </article>
    </div>

    <section class="mv-faq" id="veelgestelde-vragen" aria-labelledby="mv-faq-title">
      <div class="mv-faq-glow" aria-hidden="true"></div>
      <div class="mv-faq-inner">
        <div class="mv-faq-label">Veelgestelde vragen</div>
        <h2 class="mv-faq-title" id="mv-faq-title">${c.faqTitle}</h2>
        <div>
${c.faq.map((f) => `          <details class="mv-faq-item">
            <summary class="mv-faq-summary"><span class="mv-faq-q">${esc(f.q)}</span><span class="mv-faq-icon" aria-hidden="true">+</span></summary>
            <p class="mv-faq-a">${esc(f.a)}</p>
          </details>`).join('\n')}
        </div>
      </div>
    </section>
${relatedSection({ id: 'services-title', label: `Wat ik doe in ${c.stad}`, titleHtml: 'DIT KAN IK <span class="rel-accent">VOOR JE DOEN</span>', cardsHtml: serviceCards(['starter', 'business']) + pageCards(c.pages), allLink: false })}
${relatedSection({ id: 'werkgebied-title', label: 'Ook actief in', titleHtml: 'MEER <span class="rel-accent">WERKGEBIED</span>', cardsHtml: others.join(''), allLink: false })}

    <section class="kb-final-cta" aria-labelledby="cta-title">
      <div class="kb-final-cta-inner scroll-reveal">
        <div class="orange-label" style="justify-content:center;">Klaar om te starten?</div>
        <h2 id="cta-title">${c.finalCtaTitle}</h2>
        <p>${c.finalCtaText}</p>
        <div class="cta-row">
          <a href="/#contact" class="btn-orange">Offerte aanvragen</a>
          <a href="/webdesignopmaat" class="btn-ghost">Bekijk webdesign op maat</a>
        </div>
      </div>
    </section>
  </main>
${footerHtml()}

  <script src="/kennisbank.js" defer></script>
</body>
</html>
`;
  return html;
}

for (const c of STEDEN) fs.writeFileSync(path.join(ROOT, `${c.slug}.html`), page(c), 'utf8');
console.log(`Geschreven: ${STEDEN.map((c) => `${c.slug}.html`).join(', ')}`);
console.log(STEDEN.map((c) => `${c.slug}: ${c.words} woorden, ${c.faq.length} FAQ, title ${c.metaTitle.length}, description ${c.metaDescription.length}`).join('\n'));
