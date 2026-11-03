// Content voor de GEO-landingspagina's (webdesign + fotografie per stad). Bron voor scripts/build-geo.mjs.
// Elke stad heeft een eigen invalshoek; prijzen/levertijden komen overeen met de pakketpagina's.
// Alleen algemeen bekende lokale feiten gebruiken; geen verzonnen klanten, reviews of cijfers.

export const STEDEN = [
  {
    slug: 'webdesign-fotografie-leeuwarden',
    stad: 'Leeuwarden',
    rijtijd: '25 min',
    rijtijdTekst: 'ongeveer 25 minuten rijden',
    tags: ['Leeuwarden', 'Webdesign', 'Fotografie'],
    metaTitle: 'Webdesign & Fotografie Leeuwarden — vanaf €499 | MVDBmedia',
    metaDescription: 'Webdesigner en fotograaf voor Leeuwarden: maatwerk websites vanaf €499, portretten, teamfoto’s, vastgoed en drone. Persoonlijk en snel. Vraag offerte aan.',
    crumb: 'Leeuwarden',
    h1: 'WEBDESIGN <em>&amp; FOTOGRAFIE</em> IN LEEUWARDEN',
    lead: 'Leeuwarden is de hoofdstad van Friesland en een stad waar ondernemers elkaar elke dag tegenkomen: in de binnenstad, op de bedrijventerreinen, in zorg en onderwijs. Wie hier opvalt, wint klanten. Ik bouw de website en maak het beeld dat daarbij hoort.',
    answer: 'MVDBmedia is webdesigner en fotograaf voor ondernemers in Leeuwarden. Vanuit Sneek (ongeveer 25 minuten rijden) bouw ik maatwerk websites vanaf €499 excl. btw en maak ik portretten, teamfoto’s, vastgoedfoto’s en dronebeelden. Je hebt één aanspreekpunt, doorgaans binnen 24 uur een reactie en een vrijblijvende offerte op maat.',
    keywords: ['webdesign Leeuwarden', 'website laten maken Leeuwarden', 'fotograaf Leeuwarden', 'zakelijke fotografie Leeuwarden', 'drone Leeuwarden', 'webdesigner Leeuwarden'],
    sections: [
      {
        h2: 'Opvallen in de hoofdstad van Friesland',
        html: `
        <p>Leeuwarden is de grootste stad van de provincie, en dat merk je online. Wie hier een winkel, praktijk, horecazaak of adviesbureau runt, staat in dezelfde zoekresultaten als tientallen collega’s. De eerste indruk van je website bepaalt dan of iemand belt of doorklikt naar de concurrent.</p>
        <p>Dit zijn de ondernemers voor wie ik in Leeuwarden het vaakst aan de slag ga:</p>
        <ul>
          <li><strong>Winkels en horeca in de binnenstad.</strong> Rond Nieuwestad, de Voorstreek en het Waagplein zoeken bezoekers op hun telefoon. Je website moet binnen een paar seconden laten zien wie je bent, waar je zit en wanneer je open bent.</li>
          <li><strong>Zorg- en praktijkondernemers.</strong> Fysiotherapeuten, coaches en andere zorgprofessionals die vertrouwen moeten wekken, met een heldere aanmeldroute.</li>
          <li><strong>Zakelijke dienstverleners.</strong> Advies, administratie, juridisch en techniek: websites die expertise tonen en offerteaanvragen opleveren.</li>
          <li><strong>Creatieve en culturele ondernemers.</strong> Sinds Leeuwarden-Fryslân in 2018 Culturele Hoofdstad van Europa was, is de creatieve scene in de stad zichtbaarder dan ooit. Daar hoort een portfolio bij dat er net zo goed uitziet als het werk zelf.</li>
          <li><strong>Startende ondernemers.</strong> Net begonnen? Met het Starter-pakket sta je binnen een week online, zonder dat je meteen een groot budget nodig hebt.</li>
        </ul>`,
      },
      {
        h2: 'Webdesign voor Leeuwarder ondernemers',
        html: `
        <p>Ik ontwerp en bouw elke website op maat. Geen kant-en-klaar thema met jouw logo erop, maar een ontwerp dat past bij je bedrijf en bij de mensen die je wilt bereiken. Je kiest uit twee vaste pakketten of vraagt een offerte op maat aan:</p>
        <ul>
          <li><a href="/starter-website-pakket">Starter-website</a> vanaf €499 excl. btw: compact en snel, binnen 7 werkdagen live.</li>
          <li><a href="/business-website-pakket">Business-website</a> vanaf €999 excl. btw: uitgebreider, opgebouwd om aanvragen te krijgen, binnen 2 weken live.</li>
          <li><a href="/webdesignopmaat">Webdesign op maat</a> voor grotere websites en webapplicaties.</li>
        </ul>
        <p>Voor een bedrijf in Leeuwarden bouw ik de lokale vindbaarheid direct in: de stad in titels en koppen waar dat natuurlijk leest, een eigen pagina per dienst en gestructureerde gegevens die zoekmachines en AI-assistenten vertellen wie je bent en waar je werkt. Hoe dat werkt lees je in de gids over <a href="/seo-webdesign-hoger-in-google">SEO en GEO in webdesign</a>. Wil je vooraf weten waar je aan toe bent? <a href="/webdesign-kosten-friesland">Wat een website in Friesland kost</a> staat eerlijk uitgeschreven.</p>
        {{CTA}}`,
      },
      {
        h2: 'Fotografie in en rond de Leeuwarder binnenstad',
        html: `
        <p>Leeuwarden heeft decors die je niet hoeft te verzinnen: de scheve Oldehove, de Prinsentuin, grachten, pakhuizen en rustige hofjes. Een portret of teamfoto tussen die gevels geeft een website direct meer karakter dan een foto in een kale vergaderruimte.</p>
        <ul>
          <li><a href="/portretfotografie">Portretten en headshots</a> voor je website, LinkedIn en pers: ontspannen, natuurlijk en op locatie.</li>
          <li><a href="/groepsfotografie">Teamfoto’s</a> voor kantoren, praktijken en winkels, buiten of op de werkvloer.</li>
          <li><a href="/evenementen">Eventfotografie</a> voor openingen, netwerkborrels, bedrijfsfeesten en culturele bijeenkomsten.</li>
        </ul>
        <p>Foto’s en website komen uit één hand, dus de beelden worden op de pagina’s afgestemd op het ontwerp. Je levert niets aan bij een derde partij en krijgt bestanden in de juiste formaten voor web en print.</p>`,
      },
      {
        h2: 'Vastgoed en drone: Leeuwarden van boven',
        html: `
        <p>Voor makelaars, verhuurders en eigenaren van bedrijfspanden maak ik <a href="/vastgoedfotografie">vastgoedfoto’s</a> van interieur en exterieur. Met een <a href="/dronevisuals">drone</a> laat ik zien wat een gevelfoto niet kan: de ligging, de kavel, de omgeving. Handig bij een verkoop of verhuur, maar ook voor een nieuw bedrijfsterrein of een <a href="/drone-constructie">bouwproject in uitvoering</a>.</p>
        <p>Een drone binnen de bebouwde kom vraagt om zorgvuldigheid. Ik controleer vooraf per locatie welke regels gelden en vlieg alleen waar het mag.</p>`,
      },
      {
        h2: 'Zo werkt het vanuit Sneek',
        html: `
        <p>Sneek ligt ongeveer 25 minuten rijden van Leeuwarden, dus een kennismaking of fotoshoot op jouw locatie is geen enkel probleem. Het overige werk gaat efficiënt op afstand: feedback, teksten en ontwerp via telefoon, e-mail of WhatsApp.</p>
        <ol>
          <li><strong>Kennismaking.</strong> We bespreken je bedrijf, je klanten en wat de website of de foto’s moeten opleveren.</li>
          <li><strong>Voorstel.</strong> Je krijgt een duidelijke offerte met vaste prijs, meestal binnen 24 uur.</li>
          <li><strong>Maken.</strong> Ik ontwerp en bouw, of plan de fotoshoot op een moment dat het licht goed is.</li>
          <li><strong>Oplevering.</strong> Je website gaat live of je ontvangt je beelden, en ik blijf bereikbaar voor vragen.</li>
        </ol>`,
      },
    ],
    faq: [
      { q: 'Kom je ook naar Leeuwarden voor een kennismaking of fotoshoot?', a: 'Ja. Vanuit Sneek ben ik ongeveer 25 minuten onderweg, dus ik kom graag langs op jouw locatie in Leeuwarden. Heb je liever een videogesprek of telefoontje, dan kan dat net zo goed.' },
      { q: 'Wat kost een website laten maken in Leeuwarden?', a: 'Een Starter-website begint bij MVDBmedia vanaf €499 en een Business-website vanaf €999, beide exclusief btw. Voor uitgebreidere websites of webapplicaties maak ik een offerte op maat. De prijs is niet afhankelijk van waar in Friesland je gevestigd bent.' },
      { q: 'Kan ik mijn website en bedrijfsfoto’s in één keer laten doen?', a: 'Ja. Ik ben zowel webdesigner als fotograaf. Daardoor sluiten beeld en ontwerp op elkaar aan en heb je maar één aanspreekpunt. Je kunt de foto’s ook los bestellen.' },
      { q: 'Hoe zorg je dat mijn website in Leeuwarden gevonden wordt?', a: 'Ik bouw snelle, mobielvriendelijke websites met een heldere structuur, goede koppen, een eigen pagina per dienst en lokale structured data. Bij het Business-pakket is basis SEO inbegrepen. Rankings kan niemand garanderen, maar een goed fundament geeft je de beste kans.' },
      { q: 'Maak je ook foto’s en dronebeelden van panden in Leeuwarden?', a: 'Ja. Voor makelaars, verhuurders en bedrijven maak ik vastgoedfoto’s van binnen en buiten en dronebeelden van de ligging. Vooraf controleer ik per locatie welke regels gelden voor drones.' },
    ],
    faqTitle: 'VRAGEN OVER<br><span>LEEUWARDEN</span>',
    pages: ['portretGroep', 'evenementen', 'vastgoed'],
    finalCtaTitle: 'JOUW BEDRIJF<br><em>OPVALLEND ONLINE?</em>',
    finalCtaText: 'Vertel me over jouw bedrijf in Leeuwarden. Ik maak een vrijblijvende offerte op maat, meestal binnen 24 uur.',
  },

  {
    slug: 'webdesign-fotografie-heerenveen',
    stad: 'Heerenveen',
    rijtijd: '25 min',
    rijtijdTekst: 'ongeveer 25 minuten rijden',
    tags: ['Heerenveen', 'Webdesign', 'Fotografie'],
    metaTitle: 'Webdesign & Fotografie Heerenveen — vanaf €499 | MVDBmedia',
    metaDescription: 'Snelle websites vanaf €499 en foto’s met energie voor ondernemers in Heerenveen: teamfoto’s, evenementen, portretten en drone. Vraag een offerte aan.',
    crumb: 'Heerenveen',
    h1: 'WEBDESIGN <em>&amp; FOTOGRAFIE</em> IN HEERENVEEN',
    lead: 'Heerenveen draait op beweging: schaatsen in Thialf, voetbal in het Abe Lenstra Stadion, evenementen in Sportstad en een regio vol ondernemers die daar omheen werken. Ik bouw websites die net zo snel zijn als de stad en maak beeld met energie.',
    answer: 'MVDBmedia is webdesigner en fotograaf voor ondernemers in Heerenveen. Vanuit Sneek (ongeveer 25 minuten rijden) bouw ik snelle maatwerk websites vanaf €499 excl. btw en fotografeer ik teams, evenementen en portretten, aangevuld met dronebeelden. Je krijgt doorgaans binnen 24 uur reactie en een vrijblijvende offerte.',
    keywords: ['webdesign Heerenveen', 'website laten maken Heerenveen', 'fotograaf Heerenveen', 'eventfotografie Heerenveen', 'teamfoto Heerenveen', 'webdesigner Heerenveen'],
    sections: [
      {
        h2: 'Een sportstad met eigen ondernemers',
        html: `
        <p>Heerenveen is bekend van sc Heerenveen en Thialf, en dat trekt een heel ecosysteem aan: sportscholen, fysiotherapeuten, trainers, horeca, verenigingen, organisatoren van evenementen en ZZP’ers die hun diensten rond sport en gezondheid aanbieden. Allemaal hebben ze iets gemeen: klanten beslissen snel, vaak op hun telefoon, en kiezen wie er energiek en betrouwbaar uitziet.</p>
        <ul>
          <li><strong>Sport en gezondheid.</strong> Studio’s, coaches en praktijken die proefles- of intakeaanvragen willen ontvangen.</li>
          <li><strong>Verenigingen en clubs.</strong> Een duidelijke website met agenda, aanmelden en nieuws, die niet afhankelijk is van één vrijwilliger met een oud websitesysteem.</li>
          <li><strong>Horeca en evenementen.</strong> Locaties en organisatoren die uitstraling nodig hebben vóór het evenement begint.</li>
          <li><strong>Bouw, installatie en handel.</strong> Het MKB rondom de stad dat vooral via mond-tot-mondreclame en Google nieuwe klanten krijgt.</li>
        </ul>`,
      },
      {
        h2: 'Webdesign dat snel is en aanvragen oplevert',
        html: `
        <p>Een trage website kost je bezoekers. Mijn websites zijn op maat gebouwd, zonder zware plugins of onnodige code, en laden daardoor snel op mobiel. Hoe dat werkt en wat het verschil is met een kant-en-klaar systeem lees je in <a href="/maatwerk-website-vs-wordpress">maatwerk versus WordPress</a>.</p>
        <p>Je kiest wat bij je past:</p>
        <ul>
          <li><a href="/starter-website-pakket">Starter-website</a> vanaf €499 excl. btw, in 7 werkdagen live. Ideaal voor een ZZP’er of kleine club.</li>
          <li><a href="/business-website-pakket">Business-website</a> vanaf €999 excl. btw, in 2 weken live, met een structuur gericht op aanvragen.</li>
          <li><a href="/webdesignopmaat">Webdesign op maat</a> als je meer wilt, zoals een aanmeldmodule of een eigen webapplicatie.</li>
        </ul>
        <p>Haast? Lees dan hoe je <a href="/snelle-website-laten-maken">snel een website laat maken</a> zonder dat de kwaliteit eronder lijdt.</p>
        {{CTA}}`,
      },
      {
        h2: 'Teamfoto’s en evenementen in beeld',
        html: `
        <p>Een sportteam, een bedrijfsteam of een volle zaal: goede foto’s laten zien wie je bent. Ik fotografeer natuurlijk en met regie, zodat iedereen er goed op staat en de sfeer klopt.</p>
        <ul>
          <li><a href="/groepsfotografie">Teamfoto’s</a> voor bedrijven, clubs en verenigingen, met een uitstraling die bij jullie past.</li>
          <li><a href="/evenementen">Eventfotografie</a> voor bedrijfsdagen, toernooien, openingen en feesten: de deelnemers, de details en de sfeer.</li>
          <li><a href="/portretfotografie">Portretten</a> voor trainers, coaches en ondernemers die hun gezicht willen laten zien op hun website.</li>
          <li><a href="/drone-events">Dronebeelden</a> van evenementen en terreinen, voor een perspectief dat niemand kan kopiëren.</li>
        </ul>
        <p>Bij besloten of ticketed evenementen stem ik vooraf met de organisator af over toegang en fotograferen. Dat geldt ook op locaties met eigen regels.</p>`,
      },
      {
        h2: 'Centraal in Friesland, snel bij jou',
        html: `
        <p>Heerenveen ligt centraal in de provincie, op korte afstand van Leeuwarden, Drachten, Joure en Sneek. Vanuit Sneek ben ik ongeveer 25 minuten onderweg. Ook voor ondernemers in Oranjewoud, Jubbega, Katlijk en de andere dorpen rond Heerenveen kom ik graag langs voor een kennismaking of fotoshoot.</p>
        <p>Een groot deel van het werk doe je met mij via telefoon, e-mail of WhatsApp. Zo blijft het efficiënt en ben je niet afhankelijk van agenda’s. Je spreekt altijd rechtstreeks met degene die jouw website bouwt, en meestal heb je binnen 24 uur antwoord.</p>`,
      },
      {
        h2: 'Drone en vastgoed rond Heerenveen',
        html: `
        <p>Rond Heerenveen wordt gebouwd, verhuisd en verhuurd. Voor bedrijven en makelaars maak ik <a href="/vastgoedfotografie">vastgoedfoto’s</a> van binnen en buiten, en laat ik met een <a href="/drone-vastgoed">drone</a> de ligging en de omgeving zien. Voor aannemers is een periodieke luchtopname van een <a href="/drone-constructie">bouwproject</a> een handige manier om voortgang vast te leggen. Per locatie controleer ik vooraf welke regels gelden voor het vliegen met een drone.</p>`,
      },
    ],
    faq: [
      { q: 'Bouw je ook websites voor sportverenigingen en sportbedrijven in Heerenveen?', a: 'Ja. Een club of sportbedrijf krijgt een duidelijke, snelle website met bijvoorbeeld een agenda, aanmeldformulier en nieuws. Voor kleine verenigingen is het Starter-pakket vaak voldoende, voor sportbedrijven met meer diensten past het Business-pakket beter.' },
      { q: 'Hoe snel staat mijn website online?', a: 'Een Starter-website is binnen 7 werkdagen klaar en een Business-website binnen 2 weken, zodra ik je teksten en foto’s heb. Heb je die nog niet, dan help ik met de aanpak en kan ik de foto’s zelf maken.' },
      { q: 'Fotografeer je ook bij evenementen in Heerenveen?', a: 'Ja, bij bedrijfsevenementen, toernooien, openingen en feesten. Bij besloten of ticketed evenementen stem ik vooraf met de organisator af over toegang en fotograferen. Op locaties met eigen regels volg ik die.' },
      { q: 'Wat kost een website laten maken in Heerenveen?', a: 'Een Starter-website begint bij MVDBmedia vanaf €499 en een Business-website vanaf €999, beide exclusief btw. Grotere websites en webapplicaties krijgen een offerte op maat. Reizen binnen Friesland verandert daar niets aan.' },
      { q: 'Kom je ook naar Oranjewoud, Jubbega en andere dorpen rond Heerenveen?', a: 'Ja. Voor een kennismaking of fotoshoot kom ik graag naar jou toe, in Heerenveen zelf en in de omliggende dorpen. De rest van het traject loopt gewoon via telefoon, e-mail of WhatsApp.' },
    ],
    faqTitle: 'VRAGEN OVER<br><span>HEERENVEEN</span>',
    pages: ['groep', 'droneEvents', 'portret'],
    finalCtaTitle: 'EEN WEBSITE<br><em>MET TEMPO?</em>',
    finalCtaText: 'Vertel me over jouw bedrijf of club in Heerenveen. Ik maak een vrijblijvende offerte op maat, meestal binnen 24 uur.',
  },

  {
    slug: 'webdesign-fotografie-harlingen',
    stad: 'Harlingen',
    rijtijd: '30 min',
    rijtijdTekst: 'ongeveer een half uur rijden',
    tags: ['Harlingen', 'Webdesign', 'Fotografie'],
    metaTitle: 'Webdesign & Fotografie Harlingen — vanaf €499 | MVDBmedia',
    metaDescription: 'Website, foto’s en dronebeelden voor ondernemers in Harlingen: horeca, verhuur, watersport en toerisme. Maatwerk vanaf €499. Vraag een offerte aan.',
    crumb: 'Harlingen',
    h1: 'WEBDESIGN <em>&amp; FOTOGRAFIE</em> IN HARLINGEN',
    lead: 'Harlingen is haven, Waddenzee en historische binnenstad ineen. Bezoekers komen voor de sfeer en kiezen op beeld. Ik bouw de website en maak de foto’s en luchtbeelden waarmee jouw bedrijf in Harlingen die eerste indruk wint.',
    answer: 'MVDBmedia is webdesigner en fotograaf voor ondernemers in Harlingen. Vanuit Sneek (ongeveer een half uur rijden) bouw ik maatwerk websites vanaf €499 excl. btw en maak ik foto’s van panden, mensen en sfeer, aangevuld met dronebeelden. Ideaal voor horeca, verhuur, watersport en toerisme: bedrijven waar beeld het verschil maakt.',
    keywords: ['webdesign Harlingen', 'website laten maken Harlingen', 'fotograaf Harlingen', 'drone Harlingen', 'vastgoedfotografie Harlingen', 'webdesigner Harlingen'],
    sections: [
      {
        h2: 'In Harlingen is beeld het product',
        html: `
        <p>Harlingen leeft van de haven, de Waddenzee en de historische kern rond Noorderhaven en Zuiderhaven, met monumentale gevels, bruine vloot en de veerboten naar Terschelling en Vlieland. Zoekt iemand een plek om te eten, te slapen of de zee op te gaan, dan beslist de website, en vooral wat daarop te zien is. Voor deze ondernemers bouw ik graag:</p>
        <ul>
          <li><strong>Horeca en gastronomie.</strong> Restaurants, cafés en lunchrooms bij de haven, waar de sfeer op foto’s bepaalt of iemand reserveert.</li>
          <li><strong>Verhuur en overnachten.</strong> B&amp;B’s, vakantiewoningen en appartementen die concurreren om aandacht van gasten die vooraf alles online bekijken.</li>
          <li><strong>Watersport en scheepvaart.</strong> Zeilcharters, rondvaarten en bedrijven rond de haven, met boekingen of aanvragen via de website.</li>
          <li><strong>Winkels, galeries en ateliers.</strong> Ondernemers in de binnenstad die met een mooie website bezoekers de deur in krijgen.</li>
          <li><strong>Maritieme en zakelijke bedrijven.</strong> Bedrijven in en rond de haven die zakelijk willen overkomen: duidelijk, betrouwbaar en vindbaar.</li>
        </ul>`,
      },
      {
        h2: 'Een website voor een seizoen vol pieken',
        html: `
        <p>In Harlingen zijn er drukke maanden en rustige maanden. Je website moet in de piek niet alleen mooi zijn, maar ook rustig werken: snel op een telefoon in de wind, met een duidelijke knop om te reserveren of te boeken. Bezoekers vergelijken vaak onderweg, dus ik ontwerp altijd eerst voor mobiel.</p>
        <ul>
          <li><a href="/starter-website-pakket">Starter-website</a> vanaf €499 excl. btw: voor een kleine zaak of verhuurder die snel online wil, in 7 werkdagen live.</li>
          <li><a href="/business-website-pakket">Business-website</a> vanaf €999 excl. btw: uitgebreider, met meerdere pagina’s en een structuur gericht op reserveringen en aanvragen, in 2 weken live.</li>
          <li>Een meertalige website, bijvoorbeeld in het Nederlands, Duits en Engels, is mogelijk als maatwerk en bespreken we in de <a href="/webdesignopmaat">offerte op maat</a>.</li>
        </ul>
        <p>Begin liefst ruim voor het seizoen. Dan is er tijd voor teksten, foto’s en een fatsoenlijke test voordat de eerste gasten komen.</p>
        {{CTA}}`,
      },
      {
        h2: 'Foto’s van haven, gevels en mensen',
        html: `
        <p>De sfeer van Harlingen zit in de details: de kade bij gouden uur, de kleuren van de gevels, de ondernemer achter de toonbank. Foto’s die dat vangen, doen meer voor je website dan welke tekst ook.</p>
        <ul>
          <li><a href="/vastgoedfotografie">Vastgoedfotografie</a> voor B&amp;B’s, vakantiewoningen en makelaars: interieur en exterieur, helder en uitnodigend.</li>
          <li><a href="/portretfotografie">Portretten</a> van jou en je team, zodat gasten en klanten zien met wie ze te maken hebben.</li>
          <li><a href="/groepsfotografie">Teamfoto’s</a> op locatie, in je zaak of buiten aan het water.</li>
        </ul>
        <p>Ik plan een shoot op het moment dat het licht en de drukte goed zijn, en stem vooraf met je af wat je nodig hebt, zodat je na afloop genoeg beeld hebt voor je website, je social media en je print.</p>`,
      },
      {
        h2: 'Vanuit de lucht: haven en Waddenzee',
        html: `
        <p>Harlingen vanuit de lucht laat zien wat vanaf de grond niet past in één foto: de ligging aan het water, de haven, de dijk en het kronkelende stratenpatroon. Voor een jachtverhuurder, een restaurant met terras of een vastgoedproject is dat een sterk visitekaartje. Een voorbeeld van mijn werk boven water is de <a href="/portfolio/luchtfotografie-bled-slovenie">luchtfotografie van het eiland in het Meer van Bled</a>. Alle opties vind je op de pagina <a href="/dronevisuals">dronevisuals</a>.</p>
        <p>Let op: in en rond de Waddenzee gelden strengere regels voor vliegen dan op gewone locaties. In natuurgebieden en bij de haven kunnen beperkingen gelden. Ik controleer vooraf per locatie wat mag en vlieg alleen waar dat is toegestaan.</p>`,
      },
      {
        h2: 'Van Sneek naar Harlingen',
        html: `
        <p>Sneek ligt ongeveer een half uur rijden van Harlingen. Voor een kennismaking of een fotoshoot kom ik naar je toe; voor de rest hoef je je zaak niet te verlaten, want teksten, ontwerp en feedback regelen we via telefoon, e-mail of WhatsApp. Je spreekt altijd rechtstreeks met mij, en meestal heb je binnen 24 uur antwoord.</p>`,
      },
    ],
    faq: [
      { q: 'Maak je ook foto’s van vakantiewoningen en B&B’s in Harlingen?', a: 'Ja. Ik fotografeer interieur en exterieur van vakantiewoningen, B&B’s en appartementen, plus eventueel dronebeelden van de ligging. Zo toon je gasten op je website precies wat ze kunnen verwachten.' },
      { q: 'Mag je met een drone boven de haven en de Waddenzee vliegen?', a: 'Niet overal. In natuurgebieden, zoals grote delen van de Waddenzee, en bij havens kunnen beperkingen gelden. Ik controleer vooraf per locatie wat is toegestaan en vlieg alleen waar dat mag.' },
      { q: 'Kan mijn website ook in het Engels of Duits?', a: 'Ja, een meertalige website is mogelijk als maatwerk. Dat bespreken we in de offerte, omdat het invloed heeft op de opzet en de teksten.' },
      { q: 'Wat kost een website laten maken in Harlingen?', a: 'Een Starter-website begint bij MVDBmedia vanaf €499 en een Business-website vanaf €999, beide exclusief btw. Voor uitgebreidere websites, zoals een meertalige site met reserveringen, maak ik een offerte op maat.' },
      { q: 'Hoe vroeg moet ik beginnen als ik voor het seizoen online wil zijn?', a: 'Een Starter-website is binnen 7 werkdagen klaar en een Business-website binnen 2 weken, zodra teksten en foto’s binnen zijn. Plan ruim voor de start van het seizoen, zodat er tijd is voor foto’s, teksten en een goede test.' },
    ],
    faqTitle: 'VRAGEN OVER<br><span>HARLINGEN</span>',
    pages: ['vastgoed', 'drone', 'caseBled'],
    finalCtaTitle: 'BEELD DAT<br><em>GASTEN TREKT?</em>',
    finalCtaText: 'Vertel me over jouw zaak in Harlingen. Ik maak een vrijblijvende offerte op maat, meestal binnen 24 uur.',
  },

  {
    slug: 'webdesign-fotografie-drachten',
    stad: 'Drachten',
    rijtijd: '30 min',
    rijtijdTekst: 'ongeveer 30 minuten rijden',
    tags: ['Drachten', 'Webdesign', 'Fotografie'],
    metaTitle: 'Webdesign & Fotografie Drachten — vanaf €499 | MVDBmedia',
    metaDescription: 'Zakelijke websites vanaf €499, bedrijfsfoto’s, teamportretten en dronebeelden voor ondernemers in Drachten. Persoonlijk en maatwerk. Vraag een offerte aan.',
    crumb: 'Drachten',
    h1: 'WEBDESIGN <em>&amp; FOTOGRAFIE</em> IN DRACHTEN',
    lead: 'Drachten is een van de grootste plaatsen van Friesland, met sterke industrie, techniek en zakelijke dienstverlening. Zakelijke klanten kiezen anders dan consumenten: ze vergelijken, vragen offertes aan en letten op uitstraling. Ik bouw websites en maak beeld dat dat vertrouwen wekt.',
    answer: 'MVDBmedia is webdesigner en fotograaf voor ondernemers in Drachten. Vanuit Sneek (ongeveer 30 minuten rijden) bouw ik maatwerk websites vanaf €499 excl. btw, ook voor B2B en webapplicaties, en maak ik bedrijfsfoto’s, teamportretten en dronebeelden van terreinen en bouwprojecten. Reactie doorgaans binnen 24 uur.',
    keywords: ['webdesign Drachten', 'website laten maken Drachten', 'fotograaf Drachten', 'bedrijfsfotografie Drachten', 'drone Drachten', 'webdesigner Drachten'],
    sections: [
      {
        h2: 'Een zakelijke markt vraagt een zakelijke website',
        html: `
        <p>Met grote werkgevers als Philips in de stad draait er in Drachten een heel ecosysteem aan toeleveranciers, installateurs, technische bedrijven en dienstverleners. Veel van die bedrijven werken voor andere bedrijven. Hun klanten bezoeken een website niet voor de sfeer, maar om te beoordelen of je kunt leveren: wat doe je precies, wie ben je, wie heb je al geholpen en hoe vraag ik een offerte aan?</p>
        <ul>
          <li><strong>Industrie en techniek.</strong> Fabrikanten, toeleveranciers en technische dienstverleners die hun specialisme helder willen uitleggen.</li>
          <li><strong>Bouw, installatie en onderhoud.</strong> Bedrijven die vooral werk binnenhalen via aanbevelingen en een goede vindbaarheid.</li>
          <li><strong>Zakelijke dienstverleners.</strong> Adviseurs, accountants en juristen die vertrouwen moeten opbouwen voordat het eerste gesprek plaatsvindt.</li>
          <li><strong>Detailhandel en horeca in het centrum.</strong> Winkels en horecazaken die lokaal gevonden willen worden.</li>
        </ul>`,
      },
      {
        h2: 'Wat een B2B-website moet doen',
        html: `
        <p>Een goede zakelijke website beantwoordt vragen voordat ze gesteld worden. Ik zorg dat bezoekers binnen enkele klikken kunnen vinden wat ze zoeken en een aanvraag kunnen doen. Standaard denk ik mee over:</p>
        <ol>
          <li><strong>Diensten en specialismen.</strong> Een eigen pagina per dienst, zodat zoekmachines en bezoekers precies weten wat je doet.</li>
          <li><strong>Offerteformulier.</strong> Een korte, veilige aanvraagroute met spambeveiliging, zodat je bruikbare leads krijgt in plaats van ruis.</li>
          <li><strong>Referenties en cases.</strong> Zichtbaar bewijs van wat je maakt, zoals ik zelf laat zien in mijn <a href="/portfolio">portfolio</a>.</li>
          <li><strong>Snelheid en betrouwbaarheid.</strong> Een website die snel laadt en veilig is, want dat ziet een inkoper ook.</li>
        </ol>
        <p>Heb je iets nodig dat verder gaat dan een website, zoals een klantportaal, een planningsmodule of een eigen online platform? Dan bouw ik dat als <a href="/webapplicatie-saas-laten-maken">webapplicatie op maat</a>. Een voorbeeld is het SaaS-platform <a href="/portfolio/kampr">Kampr.nl</a>. Voor kleinere bedrijven zijn er de vaste pakketten: <a href="/starter-website-pakket">Starter</a> vanaf €499 excl. btw en <a href="/business-website-pakket">Business</a> vanaf €999 excl. btw. Meer over conversie lees je in de gids <a href="/conversie-gericht-webdesign">conversiegericht webdesign</a>.</p>
        {{CTA}}`,
      },
      {
        h2: 'Bedrijfsfoto’s en teamportretten',
        html: `
        <p>Echte foto’s van jouw bedrijf werken beter dan stockbeelden. Ze laten zien wie er achter de telefoon zit, hoe jullie werken en waar het gebeurt. Dat geeft een inkoper vertrouwen en een sollicitant een beeld van de werkplek.</p>
        <ul>
          <li><a href="/portretfotografie">Teamportretten en headshots</a> voor je website, LinkedIn en offertes.</li>
          <li><a href="/groepsfotografie">Groepsfoto’s</a> van het team, binnen op de werkvloer of buiten bij het pand. Een voorbeeld is de <a href="/portfolio/friesland-ontruimingen-groepsfoto">teamfoto voor Friesland Ontruimingen</a>.</li>
          <li><strong>Bedrijfsreportage.</strong> Mensen, machines, werkplekken en producten in actie, voor je website en vacatures.</li>
        </ul>
        <p>Op werkvloeren en bedrijfsterreinen houd ik me aan de veiligheidsregels van de locatie.</p>`,
      },
      {
        h2: 'Bedrijfsterrein, bouw en vastgoed vanuit de lucht',
        html: `
        <p>Een bedrijfsterrein of nieuwbouwproject laat zich vanuit de lucht in één beeld uitleggen. Met een <a href="/drone-constructie">drone leg ik de voortgang van een bouwproject</a> periodiek vast, handig voor aannemers, opdrachtgevers en projectontwikkelaars. Voor verhuurders en makelaars van bedrijfspanden maak ik <a href="/drone-vastgoed">dronebeelden van de ligging</a> naast <a href="/vastgoedfotografie">vastgoedfoto’s</a> van binnen. Een voorbeeld is de <a href="/portfolio/bouwbedrijf-vellinga-bouwplaats">bouwplaats van Bouwbedrijf Vellinga</a>.</p>
        <p>Vliegen boven een bedrijfsterrein doe ik alleen met toestemming van de eigenaar en binnen de geldende regels, die ik vooraf per locatie controleer.</p>`,
      },
      {
        h2: 'Eenvoudig ontwerp, zoals het Laweiplein',
        html: `
        <p>Drachten staat internationaal bekend om het Laweiplein, een kruispunt zonder verkeerslichten waar slim ontwerp het werk doet. Die gedachte gebruik ik ook voor websites: weinig regels, een duidelijke route en geen overbodige afleiding tussen een bezoeker en zijn doel.</p>
        <p>Vanuit Sneek ben ik ongeveer 30 minuten onderweg naar Drachten. Voor een kennismaking, een fotoshoot of een bedrijfsbezoek kom ik naar je toe. Voor de rest werken we via telefoon, e-mail of WhatsApp, rechtstreeks met mij, met doorgaans binnen 24 uur een reactie.</p>`,
      },
    ],
    faq: [
      { q: 'Bouw je ook webapplicaties of klantportalen voor bedrijven in Drachten?', a: 'Ja. Naast websites bouw ik webapplicaties en SaaS-platforms op maat, zoals Kampr.nl. Beschrijf wat je nodig hebt en ik maak een offerte op maat.' },
      { q: 'Kan mijn website een offerteformulier voor zakelijke klanten bevatten?', a: 'Ja. Ik bouw aanvraagformulieren met spambeveiliging en duidelijke velden, zodat je alleen bruikbare aanvragen ontvangt. De berichten komen rechtstreeks in je mailbox.' },
      { q: 'Maak je foto’s op de werkvloer of het bedrijfsterrein?', a: 'Ja, voor teamfoto’s, bedrijfsreportages en vacaturebeelden. Op werkvloeren en bedrijfsterreinen houd ik me aan de veiligheidsregels van de locatie en stem ik vooraf af wat nodig is.' },
      { q: 'Wat kost een website laten maken in Drachten?', a: 'Een Starter-website begint bij MVDBmedia vanaf €499 en een Business-website vanaf €999, beide exclusief btw. Voor uitgebreidere websites of webapplicaties maak ik een offerte op maat.' },
      { q: 'Mag je met een drone boven een bedrijfsterrein vliegen?', a: 'Alleen met toestemming van de eigenaar en binnen de geldende regels. Ik controleer vooraf per locatie wat is toegestaan en regel de afstemming met jou.' },
    ],
    faqTitle: 'VRAGEN OVER<br><span>DRACHTEN</span>',
    pages: ['droneConstructie', 'groep', 'caseOntruimingen'],
    finalCtaTitle: 'EEN WEBSITE DIE<br><em>ZAKEN DOET?</em>',
    finalCtaText: 'Vertel me over jouw bedrijf in Drachten. Ik maak een vrijblijvende offerte op maat, meestal binnen 24 uur.',
  },
];

// Slotsectie per stad: gidsen en portfolio-cases met beschrijvende ankerteksten (hub-and-spoke). Gebruikt door scripts/build-geo.mjs.
export const VERDER = {
  'webdesign-fotografie-leeuwarden': {
    h2: 'Gidsen en voorbeelden uit mijn portfolio',
    html: `
        <p>Wil je weten hoe een zakelijke website aanvragen oplevert? Lees de gids over <a href="/conversie-gericht-webdesign">conversiegericht webdesign</a>, en over het <a href="/website-beveiliging-onderhoud">onderhouden en beveiligen van je website</a> na de oplevering. Voorbeelden van mijn fotografie: de <a href="/portfolio/portretshoot-marit">portretshoot voor Marit</a>, de <a href="/portfolio/friesland-ontruimingen-groepsfoto">teamfoto voor Friesland Ontruimingen</a> en de <a href="/portfolio/fitplan-nesaclinics">bedrijfsfotografie voor Fitplan en NESAclinics in Sneek</a>.</p>`,
  },
  'webdesign-fotografie-heerenveen': {
    h2: 'Gidsen en voorbeelden uit mijn portfolio',
    html: `
        <p>Benieuwd naar de kosten? <a href="/webdesign-kosten-friesland">Wat een website in Friesland kost</a> staat eerlijk uitgeschreven, en in de gids over <a href="/conversie-gericht-webdesign">conversiegericht webdesign</a> lees je hoe een site meer aanvragen oplevert. Voorbeelden van mijn fotografie: de <a href="/portfolio/friesland-ontruimingen-groepsfoto">teamfoto voor Friesland Ontruimingen</a>, de <a href="/portfolio/fitplan-nesaclinics">bedrijfsfotografie voor het sport-medisch centrum Fitplan in Sneek</a> en de <a href="/portfolio/hondenfotos-ollie">hondenportretten van Ollie</a>.</p>`,
  },
  'webdesign-fotografie-harlingen': {
    h2: 'Gidsen en voorbeelden uit mijn portfolio',
    html: `
        <p>Een website die gasten en huurders trekt begint met de juiste keuzes. Lees <a href="/webdesign-kosten-friesland">wat een website in Friesland kost</a>, hoe je <a href="/snelle-website-laten-maken">snel een website laat maken</a> en hoe je <a href="/seo-webdesign-hoger-in-google">hoger in Google komt met je webdesign</a>. Voorbeelden van mijn werk vanuit de lucht: de <a href="/portfolio/bouwbedrijf-vellinga-bouwplaats">luchtfoto’s van de bouwplaats van Bouwbedrijf Vellinga</a>.</p>`,
  },
  'webdesign-fotografie-drachten': {
    h2: 'Gidsen en voorbeelden uit mijn portfolio',
    html: `
        <p>Voor zakelijke websites zijn deze gidsen het meest relevant: <a href="/maatwerk-website-vs-wordpress">maatwerk versus WordPress</a>, <a href="/website-beveiliging-onderhoud">beveiliging en onderhoud van je website</a>, <a href="/webdesign-kosten-friesland">wat een website in Friesland kost</a> en <a href="/seo-webdesign-hoger-in-google">SEO en GEO in webdesign</a>. Een voorbeeld van een groter maatwerkproject is de <a href="/portfolio/kampr">case-study van het boekingsplatform Kampr.nl</a>.</p>`,
  },
};
