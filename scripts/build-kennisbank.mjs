// Genereert kennisbank.html + de 8 gidsen uit scripts/kennisbank/content/*.mjs
// Gebruik: node scripts/build-kennisbank.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, DATE, PERSON, LOCAL_BUSINESS } from './kennisbank/shared.mjs';
import { esc, jsonLd, navHtml, footerHtml, headHtml } from './kennisbank/layout.mjs';
import guides from './kennisbank/content/index.mjs';
import { ogUrl } from './og-images.mjs';
import { GUIDE_SERVICES, serviceCards, relatedSection } from './kennisbank/related.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const stripTags = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const slugify = (s) => stripTags(s).toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── Afgeleide velden ────────────────────────────────────────────────────────
for (const g of guides) {
  g.url = `${SITE}/${g.slug}`;
  g.sections.forEach((s) => { s.id = slugify(s.h2); });
  const text = [g.answer, g.lead, ...g.sections.map((s) => stripTags(s.h2) + ' ' + stripTags(s.html)), ...g.faq.map((f) => f.q + ' ' + f.a)].join(' ');
  g.words = stripTags(text).split(' ').length;
  g.readMin = Math.max(3, Math.round(g.words / 210));
}


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
        LOCAL_BUSINESS,
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
${relatedSection({ id: 'services-title', label: 'Passende diensten', titleHtml: 'DIT KAN IK <span class="rel-accent">VOOR JE BOUWEN</span>', cardsHtml: serviceCards(GUIDE_SERVICES[g.slug]), allLink: false })}
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
  const title = 'Webdesign Kennisbank: gidsen over websites & SEO | MVDBmedia';
  const description = 'Acht gidsen over webdesign: kosten, maatwerk vs WordPress, snelheid, SEO & GEO en webapps. Van webdesigner Michael van den Bosch uit Sneek. Lees de gidsen.';
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
        LOCAL_BUSINESS,
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
