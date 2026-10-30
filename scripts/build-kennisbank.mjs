// Genereert kennisbank.html + de 8 gidsen uit scripts/kennisbank/content/*.mjs
// Gebruik: node scripts/build-kennisbank.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, DATE, PERSON, TOP4, ALL_GUIDES_LINK, GUIDES_LABEL } from './kennisbank/shared.mjs';
import guides from './kennisbank/content/index.mjs';
import { ogUrl, ogAlt } from './og-images.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const slugify = (s) => stripTags(s).toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const jsonLd = (obj) => `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2).replace(/</g, '\\u003c')}\n</script>`;

// ── Afgeleide velden ────────────────────────────────────────────────────────
for (const g of guides) {
  g.url = `${SITE}/${g.slug}`;
  g.sections.forEach((s) => { s.id = slugify(s.h2); });
  const text = [g.answer, g.lead, ...g.sections.map((s) => stripTags(s.h2) + ' ' + stripTags(s.html)), ...g.faq.map((f) => f.q + ' ' + f.a)].join(' ');
  g.words = stripTags(text).split(' ').length;
  g.readMin = Math.max(3, Math.round(g.words / 210));
}

// ── Gedeelde onderdelen ─────────────────────────────────────────────────────
const NAV_LINKS = [
  ['/webdesignopmaat', 'Webdesign'],
  ['/portret-groepsfotografie', 'Portret'],
  ['/vastgoedfotografie', 'Vastgoed'],
  ['/dronevisuals', 'Drone'],
  ['/portfolio', 'Portfolio'],
  ['/#over', 'Over mij'],
  ['/#contact', 'Contact'],
];

const navHtml = () => `
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

const footerHtml = () => `
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-grid">
        <div>
          <a href="/" class="footer-brand">MVDB<span>media</span></a>
          <p class="footer-blurb">Webdesign op maat in Sneek &amp; Friesland. Ook voor fotografie en drone — alles onder één dak.</p>
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

const headHtml = ({ title, description, url, ogType, ogSlug, extraMeta = '', schema }) => `<!DOCTYPE html>
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
  <link rel="stylesheet" href="/faq.css">
</head>`;

const tagsHtml = (tags) => `<ul class="kb-tags">${tags.map((t) => `<li class="kb-tag">${esc(t)}</li>`).join('')}</ul>`;

const cardHtml = (g, i, reveal = false) => `
          <li${reveal ? ` class="scroll-reveal${i % 3 ? ` reveal-delay-${i % 3}` : ''}"` : ''}>
            <article class="kb-card">
              <div class="kb-card-num" aria-hidden="true">${String(g.num).padStart(2, '0')}</div>
              ${tagsHtml(g.tags)}
              <h3 class="kb-card-title"><a href="/${g.slug}">${esc(g.title)}</a></h3>
              <p class="kb-card-text">${esc(g.cardSummary)}</p>
              <div class="kb-card-foot">
                <span class="kb-card-read">${g.readMin} min leestijd</span>
                <span class="kb-card-btn" aria-hidden="true">Lees artikel →</span>
              </div>
            </article>
          </li>`;

const breadcrumbSchema = (items) => ({
  '@type': 'BreadcrumbList',
  '@id': `${items[items.length - 1][1]}#breadcrumb`,
  itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
});

const finalCta = (h2, text) => `
    <section class="kb-final-cta" aria-labelledby="cta-title">
      <div class="kb-final-cta-inner scroll-reveal">
        <div class="orange-label" style="justify-content:center;">Klaar om te starten?</div>
        <h2 id="cta-title">${h2}</h2>
        <p>${text}</p>
        <div class="cta-row">
          <a href="/webdesignopmaat" class="btn-orange">Bekijk webdesign op maat</a>
          <a href="/#contact" class="btn-ghost">Offerte aanvragen</a>
        </div>
      </div>
    </section>`;

// ── Artikelpagina ───────────────────────────────────────────────────────────
const CTA_INLINE = (c) => `
        <aside class="kb-cta-inline" aria-label="Webdesign op maat">
          <div class="kb-cta-inline-text">
            <div class="kb-cta-inline-title">${c.title}</div>
            <p>${c.text}</p>
          </div>
          <a href="/webdesignopmaat" class="btn-orange">Bekijk webdesign op maat →</a>
        </aside>`;

function articlePage(g) {
  const cta = g.cta ?? { title: 'Een website die écht werkt voor jouw bedrijf?', text: 'Bekijk hoe ik maatwerk websites bouw voor ondernemers in Friesland en heel Nederland. Vrijblijvende offerte, meestal binnen 24 uur.' };
  const body = g.sections.map((s) => `
        <h2 id="${s.id}">${s.h2}</h2>
        ${s.html.replace('{{CTA}}', CTA_INLINE(cta))}`).join('\n');

  const related = g.related.map((slug) => guides.find((x) => x.slug === slug));
  const imageObj = { '@type': 'ImageObject', license: `${SITE}/algemene-voorwaarden`, acquireLicensePage: `${SITE}/#contact`, url: ogUrl(g.slug), width: 1200, height: 630 };
  const webpageId = `${g.url}#webpage`;

  const schema = [
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': webpageId,
          url: g.url,
          name: g.metaTitle,
          description: g.metaDescription,
          inLanguage: 'nl-NL',
          breadcrumb: { '@id': `${g.url}#breadcrumb` },
          primaryImageOfPage: imageObj,
          datePublished: DATE,
          dateModified: DATE,
        },
        {
          '@type': g.schemaType ?? 'Article',
          '@id': `${g.url}#article`,
          headline: g.title,
          description: g.metaDescription,
          image: imageObj,
          datePublished: DATE,
          dateModified: DATE,
          inLanguage: 'nl-NL',
          articleSection: g.category,
          keywords: g.keywords.join(', '),
          wordCount: g.words,
          mainEntityOfPage: { '@id': webpageId },
          author: PERSON,
          publisher: PERSON,
          ...(g.mentions ? { mentions: g.mentions } : {}),
        },
        breadcrumbSchema([['Home', `${SITE}/`], ['Kennisbank', `${SITE}/kennisbank`], [g.title, g.url]]),
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${g.url}#faq`,
      mainEntity: g.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return `${headHtml({
    title: g.metaTitle,
    description: g.metaDescription,
    url: g.url,
    ogType: 'article',
    ogSlug: g.slug,
    extraMeta: `\n  <meta property="article:published_time" content="${DATE}">\n  <meta property="article:modified_time" content="${DATE}">\n  <meta property="article:author" content="Michael van den Bosch">\n  <meta property="article:section" content="${esc(g.category)}">`,
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
            <li><a href="/kennisbank">Kennisbank</a></li>
            <li aria-current="page">${esc(g.crumb)}</li>
          </ol>
        </nav>
        ${tagsHtml(g.tags)}
        <h1 class="kb-h1">${g.h1}</h1>
        <p class="kb-lead">${g.lead}</p>
        <div class="kb-meta">
          <span>Door <strong>Michael van den Bosch</strong></span><span class="dot" aria-hidden="true"></span>
          <span>Bijgewerkt: <time datetime="${DATE}">oktober 2026</time></span><span class="dot" aria-hidden="true"></span>
          <span>${g.readMin} min leestijd</span>
        </div>
      </div>
    </header>

    <div class="kb-layout">
      <nav class="kb-toc" aria-label="Inhoudsopgave">
        <p class="kb-toc-title">In deze gids</p>
        <ol>
${g.sections.map((s) => `          <li><a href="#${s.id}">${s.h2}</a></li>`).join('\n')}
          <li><a href="#veelgestelde-vragen">Veelgestelde vragen</a></li>
        </ol>
      </nav>

      <article class="kb-prose">
        <div class="kb-answer">
          <p class="kb-answer-label">Kort antwoord</p>
          <p>${g.answer}</p>
        </div>
${body}

        <div class="kb-author">
          <img src="/fotos/michael-profiel.webp" width="72" height="72" alt="Michael van den Bosch, webdesigner en oprichter van MVDBmedia in Sneek" loading="lazy" decoding="async">
          <div>
            <p class="kb-author-name">Michael van den Bosch</p>
            <p>Oprichter van MVDBmedia in Sneek. Ik ontwerp en bouw websites en webapplicaties op maat voor ondernemers in Friesland en heel Nederland, en maak daarnaast foto's en dronebeelden. <a href="/#over">Meer over mij</a></p>
          </div>
        </div>
      </article>
    </div>

    <section class="mv-faq" id="veelgestelde-vragen" aria-labelledby="mv-faq-title">
      <div class="mv-faq-glow" aria-hidden="true"></div>
      <div class="mv-faq-inner">
        <div class="mv-faq-label">Veelgestelde vragen</div>
        <h2 class="mv-faq-title" id="mv-faq-title">${g.faqTitle}</h2>
        <div>
${g.faq.map((f) => `          <details class="mv-faq-item">
            <summary class="mv-faq-summary"><span class="mv-faq-q">${esc(f.q)}</span><span class="mv-faq-icon" aria-hidden="true">+</span></summary>
            <p class="mv-faq-a">${esc(f.a)}</p>
          </details>`).join('\n')}
        </div>
      </div>
    </section>

    <section class="kb-section" aria-labelledby="related-title" style="background:var(--bg-elevated);border-top:1px solid var(--border);">
      <div class="kb-section-inner">
        <div class="orange-label">Verder lezen</div>
        <h2 class="kb-section-title" id="related-title">MEER <em>GIDSEN</em></h2>
        <ul class="kb-grid">${related.map((r, i) => cardHtml(r, i)).join('')}
        </ul>
      </div>
    </section>
${finalCta(g.finalCtaTitle ?? 'WEBSITE DIE<br><em>RESULTAAT OPLEVERT?</em>', g.finalCtaText ?? 'Vertel me over jouw project. Ik maak een vrijblijvende offerte op maat — meestal binnen 24 uur.')}
  </main>
${footerHtml()}

  <script src="/kennisbank.js" defer></script>
</body>
</html>
`;
}

// ── Overzichtspagina ────────────────────────────────────────────────────────
function overviewPage() {
  const url = `${SITE}/kennisbank`;
  const title = 'Webdesign Kennisbank: 8 Gidsen over Websites, SEO & GEO | MVDBmedia';
  const description = 'Acht diepgaande gidsen over webdesign: kosten, maatwerk vs WordPress, snelheid, beveiliging, SEO & GEO, conversie en webapplicaties. Door webdesigner Michael van den Bosch uit Sneek.';
  const schema = [
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${url}#webpage`,
          url,
          name: 'Webdesign Kennisbank',
          description,
          inLanguage: 'nl-NL',
          breadcrumb: { '@id': `${url}#breadcrumb` },
          primaryImageOfPage: { '@type': 'ImageObject', license: `${SITE}/algemene-voorwaarden`, acquireLicensePage: `${SITE}/#contact`, url: ogUrl('kennisbank'), width: 1200, height: 630 },
          datePublished: DATE,
          dateModified: DATE,
          author: PERSON,
          publisher: PERSON,
          mainEntity: { '@id': `${url}#guides` },
        },
        {
          '@type': 'ItemList',
          '@id': `${url}#guides`,
          name: 'Webdesign Gidsen',
          numberOfItems: guides.length,
          itemListElement: guides.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: g.url, name: g.title })),
        },
        breadcrumbSchema([['Home', `${SITE}/`], ['Kennisbank', url]]),
      ],
    },
  ];

  return `${headHtml({ title, description, url, ogType: 'website', ogSlug: 'kennisbank', schema })}
<body>
${navHtml()}

  <main id="main-content">
    <header class="kb-hero grain-bg" style="padding-bottom:64px;">
      <div class="kb-hero-inner">
        <nav class="kb-crumbs" aria-label="Kruimelpad">
          <ol>
            <li><a href="/">Home</a></li>
            <li aria-current="page">Kennisbank</li>
          </ol>
        </nav>
        <div class="orange-label">Webdesign Gidsen</div>
        <h1 class="kb-h1">WEBDESIGN<br><em>KENNISBANK</em></h1>
        <p class="kb-lead">Acht diepgaande gidsen over wat een website kost, hoe je kiest tussen maatwerk en WordPress, en hoe je hoger scoort in Google én AI-zoekmachines. Praktisch, eerlijk en geschreven door een webdesigner uit Sneek.</p>
        <div class="kb-stats">
          <div class="kb-stat"><b>8</b><span>Gidsen</span></div>
          <div class="kb-stat"><b>SEO + GEO</b><span>Google &amp; AI</span></div>
          <div class="kb-stat"><b>Sneek</b><span>Friesland &amp; NL</span></div>
        </div>
      </div>
    </header>

    <section class="kb-section" aria-labelledby="gidsen-title">
      <div class="kb-section-inner">
        <div class="orange-label">Alle artikelen</div>
        <h2 class="kb-section-title" id="gidsen-title">ALLE <em>GIDSEN</em></h2>
        <ul class="kb-grid">${guides.map((g, i) => cardHtml(g, i, true)).join('')}
        </ul>
      </div>
    </section>

    <section class="kb-section" aria-labelledby="over-title" style="background:var(--bg-elevated);border-top:1px solid var(--border);padding-top:72px;padding-bottom:72px;">
      <div class="kb-section-inner kb-prose" style="max-width:820px;">
        <div class="orange-label">Over deze kennisbank</div>
        <h2 id="over-title" style="margin-top:0;">GESCHREVEN <span style="color:var(--orange);">VANUIT DE PRAKTIJK</span></h2>
        <p>Deze gidsen komen voort uit de websites die ik zelf ontwerp en bouw. Ik ben <a href="/#over">Michael van den Bosch</a>, oprichter van MVDBmedia in Sneek. Ik bouw maatwerk websites en webapplicaties, zoals het SaaS-platform <a href="/webapplicatie-saas-laten-maken">Kampr.nl</a>, en ik pas in elke gids dezelfde principes toe: snel, veilig, goed vindbaar en gericht op resultaat.</p>
        <p>Liever direct praten over jouw project? Bekijk <a href="/webdesignopmaat">webdesign op maat</a> of <a href="/#contact">vraag een vrijblijvende offerte aan</a>.</p>
      </div>
    </section>
${finalCta('WEBSITE DIE<br><em>INDRUK MAAKT?</em>', 'Vertel me over jouw project. Ik maak een vrijblijvende offerte op maat — meestal binnen 24 uur.')}
  </main>
${footerHtml()}

  <script src="/kennisbank.js" defer></script>
</body>
</html>
`;
}

// ── Schrijven ───────────────────────────────────────────────────────────────
const out = [['kennisbank.html', overviewPage()], ...guides.map((g) => [`${g.slug}.html`, articlePage(g)])];
for (const [file, html] of out) fs.writeFileSync(path.join(ROOT, file), html, 'utf8');
console.log(`Geschreven: ${out.map(([f]) => f).join(', ')}`);
console.log(guides.map((g) => `${g.slug}: ${g.words} woorden, ${g.readMin} min, ${g.faq.length} FAQ`).join('\n'));
