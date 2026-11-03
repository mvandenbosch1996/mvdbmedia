export default {
  slug: 'maatwerk-html-website-vs-wordpress-conversie',
  date: '2026-11-03',
  dateLabel: 'november 2026',
  title: 'Waarom een maatwerk HTML/JS website sneller converteert dan WordPress',
  crumb: 'HTML/JS vs WordPress: conversie',
  h1: 'WAAROM EEN MAATWERK <em>HTML/JS WEBSITE</em> SNELLER CONVERTEERT DAN WORDPRESS',
  metaTitle: 'HTML/JS website vs WordPress: sneller en meer aanvragen | MVDBmedia',
  metaDescription: 'Waarom een maatwerk HTML/JS website sneller laadt en beter converteert dan WordPress: Core Web Vitals, plugins en beveiliging uitgelegd. Lees de gids.',
  category: 'Techniek & Conversie',
  schemaType: 'TechArticle',
  tags: ['Conversie', 'HTML/JS', 'WordPress'],
  keywords: ['maatwerk website sneller dan WordPress', 'HTML JS website', 'website conversie verhogen', 'WordPress traag', 'Core Web Vitals WordPress', 'WordPress alternatief'],
  cardSummary: 'Hoe laadtijd, plugins en beveiliging bepalen hoeveel aanvragen je website oplevert, en waarom handgeschreven HTML/JS daarin vaak wint van WordPress.',
  lead: 'Twee websites kunnen er hetzelfde uitzien en toch een heel ander aantal aanvragen opleveren. Het verschil zit onder de motorkap: in laadtijd, stabiliteit en in hoeveel er tussen je bezoeker en je contactknop staat. In deze gids leg ik uit waarom een handgeschreven HTML/JS website in de praktijk sneller converteert dan een gemiddelde WordPress-site, en wanneer dat verschil klein is.',
  answer: 'Een <strong>maatwerk HTML/JS website</strong> converteert doorgaans beter dan WordPress, omdat hij sneller laadt, stabieler is en geen plugins of paginabouwer tussen bezoeker en aanvraag zet. Snelle pagina\'s verliezen minder bezoekers: <strong>53% van de mobiele bezoekers haakt af</strong> bij een laadtijd boven de 3 seconden. Een goed afgestelde WordPress-site kan dicht in de buurt komen, maar dat kost extra werk en onderhoud.',
  sections: [
    {
      h2: 'Wat is een maatwerk HTML/JS website?',
      html: `
        <p>Bij een maatwerk HTML/JS website schrijf ik de pagina's zelf, zonder contentmanagementsysteem (CMS) als tussenlaag. HTML bepaalt de structuur, CSS de opmaak en JavaScript komt alleen terug waar interactie echt iets toevoegt, zoals een menu, een formulier of een fotogalerij. De pagina's staan als kant-en-klare bestanden op een snel netwerk, dicht bij je bezoeker.</p>
        <p>Dat betekent niet dat zo'n website alleen statisch kan zijn. Een contactformulier, een boekingsmodule of een klantaccount werkt met kleine losse functies die alleen draaien als iemand ze gebruikt. De pagina's zelf blijven licht.</p>
        <h3>Wat er gebeurt bij een bezoek aan een WordPress-pagina</h3>
        <p>De server start PHP, vraagt de inhoud, het menu en de instellingen op uit een database, laat thema en plugins hun werk doen, bouwt daar een pagina van en stuurt die op. Daarna downloadt de browser de CSS- en JavaScript-bestanden van het thema en van elke actieve plugin. Een cachingplugin kan het eindresultaat bewaren, maar dat is weer extra software die je moet beheren.</p>
        <h3>Wat er gebeurt bij een bezoek aan een HTML/JS-pagina</h3>
        <p>De browser haalt een kant-en-klaar bestand op bij de dichtstbijzijnde server. Er hoeft niets samengesteld te worden en de browser krijgt alleen de CSS en JavaScript die deze ene pagina nodig heeft. Minder stappen betekent minder wachttijd, en wachttijd is precies waar bezoekers op afhaken. Het verschil tussen maatwerk en een CMS in het algemeen bespreek ik ook in <a href="/maatwerk-website-vs-wordpress">maatwerk website vs. WordPress</a>.</p>`,
    },
    {
      h2: 'Van laadtijd naar conversie: waarom snelheid direct geld kost',
      html: `
        <p>Conversie is het percentage bezoekers dat doet wat jij wilt: bellen, mailen of een offerte aanvragen. Snelheid werkt daar op twee manieren op in:</p>
        <ul>
          <li><strong>Minder afhakers.</strong> Volgens Google (2016) verlaat 53% van de mobiele bezoekers een pagina die langer dan 3 seconden nodig heeft om te laden. Wie afhaakt, ziet je aanbod nooit.</li>
          <li><strong>Meer actie.</strong> Een onderzoek van Deloitte in opdracht van Google (2020) liet zien dat 0,1 seconde snellere laadtijd de conversie in retail met zo'n 8% verhoogde.</li>
          <li><strong>Meer vertrouwen.</strong> Een website die direct reageert voelt als een bedrijf dat zijn zaken op orde heeft. Een trage site roept twijfel op voordat je een woord hebt gezegd.</li>
        </ul>
        <h3>Een rekenvoorbeeld</h3>
        <p>Stel dat je website 1.000 mobiele bezoekers per maand krijgt en 3% daarvan een aanvraag doet: dat zijn 30 aanvragen. Verliest een trage pagina 20% van die bezoekers voordat de inhoud zichtbaar is, dan blijven er 800 over en zijn het nog 24 aanvragen. Dat zijn 6 aanvragen per maand die je al betaalde via Google, advertenties of mond-tot-mondreclame en die verloren gaan zonder dat je het merkt. Dit is een illustratief voorbeeld, geen garantie, maar het laat zien waarom laadtijd een zakelijke keuze is en geen technisch detail.</p>`,
    },
    {
      h2: 'Core Web Vitals: waar WordPress tijd verliest',
      html: `
        <p>Google meet de gebruikservaring met drie waarden: LCP, INP en CLS (zie <a href="/snelle-website-laten-maken">waarom een snelle website meer klanten oplevert</a>). Op alle drie heeft een gemiddelde WordPress-site een structureel nadeel, simpelweg omdat er meer software tussen de bezoeker en de pagina zit.</p>
        <h3>LCP: het grootste element is lang onderweg</h3>
        <p>De tijd tot de eerste byte (TTFB) is bij WordPress afhankelijk van PHP en database. Daarbovenop komen render-blocking CSS van thema en plugins, en een hoofdafbeelding die een paginabouwer vaak pas laat in beeld zet. Bij maatwerk geef ik de hoofdafbeelding vaste afmetingen en laat ik de browser die als eerste ophalen.</p>
        <h3>INP: reactietijd door zwaar JavaScript</h3>
        <p>Elke plugin met een slider, popup of animatie voegt JavaScript toe dat de browser moet uitvoeren. Dat kan een tik op je menu merkbaar vertragen. Bij maatwerk schrijf ik het minimum aan JavaScript dat de pagina nodig heeft, vaak enkele kilobytes in plaats van honderden.</p>
        <h3>CLS: een pagina die verspringt</h3>
        <p>Cookiemeldingen, laat ladende lettertypen en widgets die zich pas na het laden invoegen laten de pagina verspringen, juist op het moment dat iemand op een knop wil tikken. Bij maatwerk leg ik de ruimte van elk element vooraf vast.</p>
        <div class="kb-table-wrap" tabindex="0" role="region" aria-label="Core Web Vitals: typische oorzaken bij WordPress en aanpak bij maatwerk">
          <table>
            <caption>Core Web Vitals: WordPress vs. maatwerk HTML/JS</caption>
            <thead><tr><th scope="col">Meetwaarde</th><th scope="col">Typische oorzaak bij WordPress</th><th scope="col">Aanpak bij maatwerk</th></tr></thead>
            <tbody>
              <tr><td>LCP</td><td>PHP en database per bezoek, render-blocking thema-CSS, laat ontdekte hoofdafbeelding</td><td>Kant-en-klare pagina vanaf een snel netwerk, hoofdafbeelding met voorrang</td></tr>
              <tr><td>INP</td><td>JavaScript van meerdere plugins en een paginabouwer</td><td>Alleen de code die de pagina gebruikt</td></tr>
              <tr><td>CLS</td><td>Widgets en lettertypen die zich laat invoegen</td><td>Vaste afmetingen voor afbeeldingen en blokken</td></tr>
            </tbody>
          </table>
        </div>
        <div class="kb-callout"><p class="kb-callout-title">Let op</p><p>Dit zijn typische oorzaken, geen wetten. Een WordPress-site met een lichtgewicht thema, weinig plugins en goede caching kan ook goed scoren. Bij maatwerk is dat de standaard en bij WordPress het resultaat van doorlopend afstellen.</p></div>`,
    },
    {
      h2: 'Geen bloatware: elke plugin kost seconden en vertrouwen',
      html: `
        <p>Een zakelijke WordPress-site heeft al snel plugins voor SEO, formulieren, caching, beveiliging, back-ups, cookies en misschien een slider of paginabouwer. Veel van die plugins laden hun CSS en JavaScript op elke pagina, ook waar ze niets doen. Paginabouwers produceren bovendien diep geneste HTML, die de browser trager verwerkt.</p>
        <p>Bij een maatwerk website bouw ik die functies in de code zelf: metagegevens, gestructureerde data, responsive afbeeldingen, lazy loading en formuliervalidatie. Er is geen plugin om bij te werken, geen licentie om te verlengen en geen conflict tussen twee plugins dat je formulier stil legt. Dat laatste is precies het soort probleem dat je pas merkt als er weken geen aanvragen binnenkomen.</p>
        <p>Het gaat niet om minder code per se, maar om geen ongebruikte code. Wat de bezoeker niet nodig heeft, hoeft niet over de lijn.</p>`,
    },
    {
      h2: 'Beveiliging en betrouwbaarheid zijn ook conversiefactoren',
      html: `
        <p>Een gehackte site, een browserwaarschuwing of een formulier vol spam kost aanvragen en vertrouwen, vaak zonder dat je het direct ziet. WordPress is door zijn populariteit een dagelijks doelwit van geautomatiseerde aanvallen op bekende paden als <code>/wp-login.php</code>, en de meeste kwetsbaarheden zitten in plugins en thema's van derden.</p>
        <p>Een maatwerk website heeft een kleiner aanvalsoppervlak: geen inlogpagina voor bezoekers, geen database achter de pagina's en geen stapel plugins om bij te houden. Daarbovenop stel ik strikte beveiligingsheaders en een Content-Security-Policy in, valideer ik formulieren en schakel ik botbescherming in zonder bezoekers lastig te vallen met irritante captcha's. Hoe ik dat aanpak lees je in <a href="/website-beveiliging-onderhoud">website beveiliging &amp; onderhoud</a>.</p>`,
    },
    {
      h2: 'Volledige controle over het conversiepad',
      html: `
        <p>Een WordPress-thema bepaalt voor een groot deel hoe je pagina's eruitzien en waar je knoppen staan. Bij maatwerk ontwerp ik elke pagina rond één doel. Dat vertaalt zich in concrete keuzes:</p>
        <ul>
          <li><strong>Eén duidelijke hoofdactie</strong> zichtbaar zonder scrollen, met een tweede, rustigere route voor wie nog twijfelt.</li>
          <li><strong>Korte formulieren</strong> met alleen de velden die je echt nodig hebt, zodat iemand binnen een halve minuut klaar is.</li>
          <li><strong>Mobiel eerst</strong>, met knoppen die groot genoeg zijn en bellen of appen met één tik.</li>
          <li><strong>Echt vertrouwen</strong>: eigen foto's, referenties en cases die niet vertragen omdat ze goed zijn verkleind.</li>
        </ul>
        <p>Hoe je dat opbouwt staat uitgebreid in de gids over <a href="/conversie-gericht-webdesign">conversiegericht webdesign</a>. En omdat er geen template tussen zit, kan ik een knop, tekst of indeling aanpassen zonder de rest van de site te raken.</p>
        ${'{{CTA}}'}`,
    },
    {
      h2: 'Conversiefactoren op een rij',
      html: `
        <div class="kb-table-wrap" tabindex="0" role="region" aria-label="Conversiefactoren: maatwerk HTML/JS en WordPress">
          <table>
            <caption>Maatwerk HTML/JS vs. WordPress: wat bepaalt je conversie</caption>
            <thead><tr><th scope="col">Factor</th><th scope="col">WordPress</th><th scope="col">Maatwerk HTML/JS</th></tr></thead>
            <tbody>
              <tr><td>Laadtijd op mobiel</td><td>Afhankelijk van thema, plugins en caching</td><td>Standaard licht en snel</td></tr>
              <tr><td>Reactietijd server</td><td>PHP en database per bezoek</td><td>Kant-en-klare pagina's</td></tr>
              <tr><td>JavaScript-belasting</td><td>Per plugin en paginabouwer</td><td>Alleen waar nodig</td></tr>
              <tr><td>Stabiele layout</td><td>Risico door widgets en late lettertypen</td><td>Vooraf vastgelegd</td></tr>
              <tr><td>Beveiliging en uptime</td><td>Doorlopende updates nodig</td><td>Klein aanvalsoppervlak</td></tr>
              <tr><td>Controle over conversiepad</td><td>Beperkt door thema</td><td>Volledig op maat</td></tr>
              <tr><td>Zelf aanpassen</td><td>Eenvoudig via beheeromgeving</td><td>Via dashboard (Business) of door mij</td></tr>
              <tr><td>Past het best bij</td><td>Grote redacties en grote webshops</td><td>Bedrijfswebsites die aanvragen moeten opleveren</td></tr>
            </tbody>
          </table>
        </div>`,
    },
    {
      h2: 'Eerlijk: wanneer is het verschil klein?',
      html: `
        <p>Ik bouw zelf maatwerk, maar een snelle website is geen toverformule. Het verschil is klein of afwezig in deze situaties:</p>
        <ul>
          <li>Je WordPress-site is al goed afgesteld: lichtgewicht thema, weinig plugins, goede caching en een score in het groen op mobiel.</li>
          <li>Je grootste probleem zit niet in snelheid maar in je aanbod, je teksten of het ontbreken van vertrouwen. Een razendsnelle pagina met een vaag aanbod converteert nog steeds slecht.</li>
          <li>Je publiceert dagelijks met een team of beheert honderden artikelen. Dan weegt het redactiegemak van WordPress zwaarder (zie <a href="/maatwerk-website-vs-wordpress">wanneer WordPress wél de slimste keuze is</a>).</li>
        </ul>
        <p>Meet daarom eerst waar je nu staat. Is je site al snel, zoek de winst dan in inhoud en structuur, bijvoorbeeld met <a href="/seo-webdesign-hoger-in-google">SEO en GEO in webdesign</a>.</p>`,
    },
    {
      h2: 'Zo meet je het verschil voor je eigen website',
      html: `
        <ol>
          <li><strong>Test je mobiele score.</strong> Open PageSpeed Insights en test je homepage en je belangrijkste dienstpagina op mobiel. Noteer LCP, INP en CLS.</li>
          <li><strong>Tel je scripts en plugins.</strong> Bekijk in de ontwikkelaarstools van je browser (tabblad Netwerk) hoeveel bestanden en hoeveel kilobytes je pagina laadt voordat de inhoud zichtbaar is.</li>
          <li><strong>Test je formulier op een telefoon.</strong> Gebruik 4G in plaats van wifi, en kijk hoe lang het duurt voordat je kunt typen en verzenden.</li>
          <li><strong>Leg je conversie vast.</strong> Reken uit hoeveel aanvragen je per 100 bezoekers krijgt. Zo kun je na een verbetering vergelijken in plaats van gokken.</li>
        </ol>
        <p>Valt je mobiele LCP boven de 2,5 seconden uit, dan is er winst te halen, en bij een zware opbouw is die vaak aanzienlijk.</p>`,
    },
    {
      h2: 'Wat kost het en wanneer verdient het zich terug?',
      html: `
        <p>Een Starter-website begint bij €499 excl. btw en staat binnen 7 werkdagen live. Een Business-website, opgebouwd om aanvragen te genereren, begint bij €999 excl. btw en staat binnen 2 weken live. Een uitgebreide uitleg van de prijzen vind je in <a href="/webdesign-kosten-friesland">wat kost een professionele website in Friesland</a>.</p>
        <p>Reken met de waarde van één aanvraag. Levert een snellere website één extra opdracht per maand op ter waarde van €500, dan is het Business-pakket in ongeveer twee maanden terugverdiend. Dat is een voorbeeld, geen belofte, maar het is de rekensom die ik je aanraad te maken voor je eigen bedrijf. Bovendien vallen bij maatwerk de terugkerende kosten van plugin-licenties en herstel na updates grotendeels weg.</p>`,
    },
  ],
  faqTitle: 'VRAGEN OVER<br><span>HTML/JS VS WORDPRESS</span>',
  faq: [
    { q: 'Is een HTML/JS website echt sneller dan WordPress?', a: `Meestal wel. Een HTML/JS website levert kant-en-klare pagina's zonder PHP en database en laadt alleen de code die de pagina nodig heeft. Een goed afgestelde WordPress-site kan ook snel zijn, maar dat vraagt doorlopend afstellen van thema, plugins en caching.` },
    { q: 'Converteert een snellere website altijd beter?', a: `Niet automatisch. Snelheid haalt een belangrijke drempel weg: bezoekers haken minder af en de pagina voelt betrouwbaarder. Maar je aanbod, je teksten en je vertrouwenselementen bepalen daarna of iemand ook echt contact opneemt. Snelheid en een sterke inhoud versterken elkaar.` },
    { q: 'Hoeveel bezoekers verlies ik door een trage website?', a: `Volgens Google (2016) verlaat 53% van de mobiele bezoekers een pagina die er langer dan 3 seconden over doet om te laden. Hoeveel dat voor jou betekent, hangt af van je verkeer en je huidige laadtijd. Meet daarom eerst je mobiele score in PageSpeed Insights.` },
    { q: 'Kan ik een HTML/JS website zelf aanpassen?', a: `Ja. Bij het Business-pakket van MVDBmedia beheer je teksten, foto's en pagina's zelf via een gebruiksvriendelijk dashboard. Bij het Starter-pakket verzorg ik de aanpassingen voor je, zodat je niet vastzit aan technische kennis.` },
    { q: 'Is een HTML/JS website goed voor SEO?', a: `Een snelle, schone website met nette koppen en gestructureerde data is een sterke basis voor vindbaarheid, in Google en in AI-zoekmachines. Het is geen garantie voor een hoge positie: daarvoor zijn goede inhoud en een duidelijke structuur minstens zo belangrijk.` },
    { q: 'Hoe lang duurt de overstap van WordPress naar maatwerk?', a: `Dat hangt af van de omvang van je site. Een Starter-website staat binnen 7 werkdagen live en een Business-website binnen 2 weken. Ik neem je bestaande inhoud over en zorg dat je belangrijke URL's behouden blijven of netjes worden doorgestuurd, zodat je vindbaarheid niet verloren gaat.` },
  ],
  cta: {
    title: 'Wil je een snellere website die meer aanvragen oplevert?',
    text: 'Bekijk hoe ik maatwerk HTML/JS websites bouw voor ondernemers in Friesland en heel Nederland. Vrijblijvende offerte, meestal binnen 24 uur.',
  },
  finalCtaTitle: 'SNELLERE WEBSITE,<br><em>MEER AANVRAGEN?</em>',
  finalCtaText: 'Vertel me over jouw website en je doelen. Ik laat je zien wat maatwerk voor jouw laadtijd en aanvragen kan betekenen, vrijblijvend en meestal binnen 24 uur.',
  related: ['maatwerk-website-vs-wordpress', 'snelle-website-laten-maken', 'conversie-gericht-webdesign'],
};
