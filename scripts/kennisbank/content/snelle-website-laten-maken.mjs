export default {
  slug: 'snelle-website-laten-maken',
  title: 'Waarom een snelle laadtijd zorgt voor meer klanten en betere Google-posities',
  crumb: 'Snelle website',
  h1: 'SNELLE <em>LAADTIJD</em>: MEER KLANTEN EN BETERE GOOGLE-POSITIES',
  metaTitle: 'Snelle website laten maken: laadtijd, klanten & Google | MVDBmedia',
  metaDescription: 'Waarom laadtijd bepaalt hoeveel klanten je krijgt en hoe hoog je scoort in Google. Core Web Vitals uitgelegd en zo bouw ik websites die razendsnel laden.',
  category: 'Snelheid & Performance',
  schemaType: 'TechArticle',
  tags: ['Snelheid', 'Core Web Vitals', 'SEO'],
  keywords: ['snelle website', 'laadtijd website', 'Core Web Vitals', 'PageSpeed verbeteren', 'website sneller maken'],
  cardSummary: 'Elke seconde telt. Ontdek hoe laadtijd je omzet en Google-positie beïnvloedt, wat Core Web Vitals zijn en hoe ik websites razendsnel bouw.',
  lead: 'Bezoekers wachten niet. Een trage website kost je klanten voordat ze je aanbod hebben gezien, en Google houdt daar rekening mee. Hier lees je waarom snelheid zo belangrijk is en wat je eraan kunt doen.',
  answer: 'Een snelle website houdt bezoekers vast, verhoogt het aantal aanvragen en geeft je een voordeel in Google. Onderzoek van Google (2016) toonde dat <strong>53% van de mobiele bezoekers afhaakt</strong> als een pagina langer dan 3 seconden laadt. Streef naar een <strong>LCP onder 2,5 seconden</strong>, een INP onder 200 ms en een CLS onder 0,1.',
  sections: [
    {
      h2: 'Waarom laadtijd je omzet bepaalt',
      html: `
        <p>Snelheid is de eerste indruk. Nog voordat iemand je tekst leest, heeft hij al ervaren of je website prettig of frustrerend is. En bezoekers zijn ongeduldig: op mobiel, onderweg en met een telefoon in één hand, haken ze in een paar seconden af.</p>
        <ul>
          <li><strong>Afhakers:</strong> volgens Google (2016) verlaat 53% van de mobiele bezoekers een pagina die langer dan 3 seconden nodig heeft om te laden.</li>
          <li><strong>Conversie:</strong> een onderzoek van Deloitte in opdracht van Google (2020) liet zien dat een verbetering van de laadtijd met 0,1 seconde de conversie in retail met zo'n 8% verhoogde.</li>
          <li><strong>Vertrouwen:</strong> een snelle site voelt professioneel. Een trage site roept twijfel op over de kwaliteit van je bedrijf.</li>
        </ul>
        <p>Concreet: als je website veel bezoekers heeft maar weinig aanvragen oplevert, kan snelheid een van de eerste dingen zijn die je moet controleren.</p>`,
    },
    {
      h2: 'Wat zijn Core Web Vitals?',
      html: `
        <p>Core Web Vitals zijn drie meetwaarden van Google die de gebruikservaring van een pagina beoordelen. Ze maken deel uit van de page experience-signalen die Google meeweegt in de ranking.</p>
        <div class="kb-table-wrap" tabindex="0" role="region" aria-label="Core Web Vitals streefwaarden">
          <table>
            <caption>Streefwaarden Core Web Vitals (goed)</caption>
            <thead><tr><th scope="col">Meetwaarde</th><th scope="col">Wat het meet</th><th scope="col">Goed</th></tr></thead>
            <tbody>
              <tr><td>LCP (Largest Contentful Paint)</td><td>Hoe snel het grootste zichtbare element laadt</td><td>≤ 2,5 seconden</td></tr>
              <tr><td>INP (Interaction to Next Paint)</td><td>Hoe snel de pagina reageert op klikken en tikken</td><td>≤ 200 milliseconden</td></tr>
              <tr><td>CLS (Cumulative Layout Shift)</td><td>Hoeveel de pagina tijdens het laden verspringt</td><td>≤ 0,1</td></tr>
            </tbody>
          </table>
        </div>
        <p>Let op: relevante, nuttige inhoud blijft belangrijker dan snelheid. Maar bij twee even sterke pagina's kan een betere gebruikservaring het verschil maken. En ook los van Google levert snelheid je meer klanten op.</p>`,
    },
    {
      h2: 'Waarom zijn websites traag?',
      html: `
        <p>In mijn ervaring zijn dit de meest voorkomende oorzaken:</p>
        <ul>
          <li><strong>Zware afbeeldingen:</strong> foto's in volle resolutie van meerdere megabytes, niet gecomprimeerd en niet aangepast aan het scherm.</li>
          <li><strong>Te veel plugins en scripts:</strong> elke extra plugin, tracker of chatwidget voegt code toe die geladen moet worden. Lees ook <a href="/maatwerk-website-vs-wordpress">maatwerk vs. WordPress</a>.</li>
          <li><strong>Zware thema's en page builders:</strong> ze leveren veel functies die je niet gebruikt, maar die wel worden geladen.</li>
          <li><strong>Webfonts en render-blocking bestanden:</strong> lettertypen of stijlbestanden die de weergave tegenhouden.</li>
          <li><strong>Trage hosting:</strong> goedkope servers met lange responstijden.</li>
        </ul>
        ${'{{CTA}}'}`,
    },
    {
      h2: 'Zo bouw ik een razendsnelle website',
      html: `
        <p>Snelheid is bij mij geen achteraf-optimalisatie, maar een uitgangspunt van het ontwerp. Dit is mijn aanpak:</p>
        <ol>
          <li><strong>Moderne afbeeldingen.</strong> Foto's gaan in WebP-formaat, in meerdere afmetingen (responsive <code>srcset</code>), zodat een telefoon geen desktopafbeelding hoeft te downloaden.</li>
          <li><strong>Lazy loading.</strong> Afbeeldingen buiten beeld worden pas geladen wanneer ze nodig zijn.</li>
          <li><strong>Minimale code.</strong> Alleen de HTML, CSS en JavaScript die echt nodig zijn, zonder zware frameworks of plugins.</li>
          <li><strong>Slim laden van lettertypen.</strong> Met <code>preconnect</code> en <code>font-display: swap</code>, zodat tekst direct zichtbaar is.</li>
          <li><strong>Snelle levering.</strong> Bestanden worden via een snel netwerk aangeboden en efficiënt in de cache van de browser opgeslagen.</li>
          <li><strong>Stabiele layout.</strong> Afmetingen van afbeeldingen zijn vastgelegd, zodat er niets verspringt tijdens het laden.</li>
        </ol>`,
    },
    {
      h2: 'Zo test je de snelheid van je website',
      html: `
        <p>Je kunt zelf in een paar minuten een indruk krijgen:</p>
        <ul>
          <li><strong>PageSpeed Insights</strong> van Google toont je Core Web Vitals, met zowel labgegevens als (indien beschikbaar) gegevens van echte bezoekers.</li>
          <li><strong>Lighthouse</strong> in Chrome DevTools geeft een gedetailleerd rapport met verbeterpunten.</li>
          <li><strong>WebPageTest</strong> laat zien hoe je pagina laadt op verschillende apparaten en verbindingen.</li>
        </ul>
        <p>Test altijd je <strong>mobiele</strong> score, want dat is waar de meeste bezoekers vandaan komen en waar Google primair naar kijkt. Vergelijk daarnaast meerdere pagina's, niet alleen je homepage.</p>`,
    },
    {
      h2: 'Snelheid en SEO: hoe hangt dat samen?',
      html: `
        <p>Snelheid is één onderdeel van een groter geheel. Een snelle site wordt makkelijker en efficiënter gecrawld, geeft bezoekers een betere ervaring en draagt bij aan lagere bouncepercentages. Samen met goede inhoud, structuur en gestructureerde data vormt het de basis voor vindbaarheid, ook in AI-zoekmachines. Hoe dat samenwerkt lees je in <a href="/seo-webdesign-hoger-in-google">SEO &amp; GEO in webdesign</a>.</p>`,
    },
    {
      h2: 'Checklist: is jouw website snel genoeg?',
      html: `
        <ul>
          <li>Laadt je homepage op mobiel in minder dan 2,5 seconden (LCP)?</li>
          <li>Zijn al je afbeeldingen gecomprimeerd en in WebP of een vergelijkbaar formaat?</li>
          <li>Gebruik je minder dan een handvol externe scripts en plugins?</li>
          <li>Verspringt de pagina niet tijdens het laden?</li>
          <li>Reageert je menu direct op een tik?</li>
          <li>Staat je website op snelle, betrouwbare hosting?</li>
        </ul>
        <p>Scoor je op meer dan twee punten negatief? Dan is er winst te halen, en vaak is die aanzienlijk.</p>`,
    },
  ],
  faqTitle: 'VRAGEN OVER<br><span>WEBSITESNELHEID</span>',
  faq: [
    { q: 'Wat is een goede laadtijd voor een website?', a: 'Streef naar een Largest Contentful Paint (LCP) van maximaal 2,5 seconden op mobiel. Daaronder voelt een website voor bezoekers als snel. Hoe korter, hoe beter, vooral voor bezoekers met een tragere verbinding.' },
    { q: 'Beïnvloedt de laadtijd mijn positie in Google?', a: 'Ja, in beperkte mate. Core Web Vitals maken deel uit van de page experience-signalen van Google. Inhoud en relevantie wegen zwaarder, maar bij vergelijkbare pagina\'s kan een snellere website voordeel opleveren. Bovendien levert snelheid direct meer conversies op.' },
    { q: 'Waarom is mijn WordPress-website traag?', a: 'De meest voorkomende oorzaken zijn te veel plugins, een zwaar thema of page builder, niet-geoptimaliseerde afbeeldingen en trage hosting. Met een lichter thema, minder plugins en goede caching is veel winst te halen.' },
    { q: 'Kan een bestaande website sneller gemaakt worden?', a: 'Vaak wel. Afbeeldingen optimaliseren, onnodige scripts verwijderen en lettertypen slimmer laden geeft meestal direct resultaat. Bij een zware opbouw is een nieuwe, lichte maatwerk website uiteindelijk effectiever.' },
    { q: 'Bouwt MVDBmedia websites die vanaf het begin snel zijn?', a: 'Ja. Snelheid is een uitgangspunt van elk ontwerp: moderne afbeeldingsformaten, lazy loading, minimale code en een stabiele layout. Zo voldoet je website aan de Core Web Vitals zonder dat je daar later extra voor hoeft te betalen.' },
  ],
  related: ['seo-webdesign-hoger-in-google', 'maatwerk-website-vs-wordpress', 'conversie-gericht-webdesign'],
};
