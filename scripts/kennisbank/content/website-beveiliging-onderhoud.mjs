export default {
  slug: 'website-beveiliging-onderhoud',
  title: 'Website beveiliging & onderhoudsarm bouwen zonder kwetsbare plugins',
  crumb: 'Beveiliging & onderhoud',
  h1: 'WEBSITE <em>BEVEILIGING</em> &amp; ONDERHOUDSARM BOUWEN',
  metaTitle: 'Veilige website bouwen zonder plugins | MVDBmedia',
  metaDescription: 'Zo bouw je een veilige website die weinig onderhoud vraagt. Beveiligingsheaders, formulieren, plugins en back-ups uitgelegd door webdesigner Michael van den Bosch.',
  category: 'Veiligheid & Onderhoud',
  schemaType: 'TechArticle',
  tags: ['Beveiliging', 'Onderhoud', 'Techniek'],
  keywords: ['website beveiliging', 'website onderhoud', 'veilige website', 'beveiligingsheaders', 'website zonder plugins'],
  cardSummary: 'Hoe bouw je een website die veilig is én weinig onderhoud vraagt? Over aanvalsoppervlak, beveiligingsheaders, veilige formulieren en waarom minder code vaak beter is.',
  lead: 'Een gehackte website kost je vertrouwen, klanten en zichtbaarheid in Google. Het goede nieuws: je voorkomt de meeste problemen niet met meer onderhoud, maar met een slimmere bouw. Zo doe ik dat.',
  answer: 'De veiligste websites zijn de websites met het <strong>kleinste aanvalsoppervlak</strong>: weinig externe code, geen onnodige plugins, geen openbare inlogpagina en geen database die niet nodig is. Voeg daar <strong>beveiligingsheaders</strong>, veilige formulieren en HTTPS aan toe, en je hebt een website die veilig is en nauwelijks onderhoud vraagt.',
  sections: [
    {
      h2: 'Waarom worden websites eigenlijk gehackt?',
      html: `
        <p>De meeste aanvallen zijn niet persoonlijk. Geautomatiseerde bots scannen continu het internet op bekende kwetsbaarheden: verouderde plugins, standaard inlogpagina's en zwakke wachtwoorden. Je website hoeft dus niet "interessant" te zijn om een doelwit te worden. Hij moet alleen een bekende zwakke plek hebben.</p>
        <p>De gevolgen kunnen ernstig zijn: een website die malware verspreidt, spam die in je naam wordt verstuurd, een waarschuwing in Google of het kwijtraken van gegevens van klanten.</p>`,
    },
    {
      h2: 'Het plugin-probleem',
      html: `
        <p>Elke plugin of externe bibliotheek die je toevoegt, is code van iemand anders die jij moet vertrouwen. Heeft die code een kwetsbaarheid of wordt hij niet meer bijgewerkt, dan wordt jouw website het slachtoffer. Bij systemen als WordPress zit het overgrote deel van de gemelde kwetsbaarheden in plugins en thema's, niet in de kern. Hoe dat zich verhoudt tot maatwerk lees je in <a href="/maatwerk-website-vs-wordpress">maatwerk website vs. WordPress</a>.</p>
        <p>Mijn uitgangspunt is daarom: <strong>alleen toevoegen wat echt nodig is</strong>. Elke regel code die er niet is, kan ook niet worden misbruikt.</p>`,
    },
    {
      h2: 'Onderhoudsarm bouwen: minder is meer',
      html: `
        <p>Onderhoudsarm betekent niet dat een website niet veilig hoeft te zijn. Het betekent dat veiligheid in het ontwerp is ingebouwd, zodat je niet elke week updates hoeft te doen. Dit zijn de principes waarmee ik werk:</p>
        <ul>
          <li><strong>Weinig afhankelijkheden.</strong> Geen stapel plugins die allemaal bijgewerkt moeten worden.</li>
          <li><strong>Geen onnodige database of beheeromgeving.</strong> Waar mogelijk bestaat de website uit statische bestanden, die van nature veel moeilijker aan te vallen zijn.</li>
          <li><strong>Gecontroleerde externe diensten.</strong> Voor formulieren en e-mail gebruik ik betrouwbare diensten in plaats van zelfgebouwde, kwetsbare scripts.</li>
          <li><strong>Versiebeheer.</strong> Elke wijziging wordt vastgelegd, zodat een eerdere versie altijd snel terug te zetten is.</li>
        </ul>
        ${'{{CTA}}'}`,
    },
    {
      h2: 'Beveiligingsheaders: onzichtbaar maar krachtig',
      html: `
        <p>Beveiligingsheaders zijn instructies die de server meestuurt en die de browser vertellen hoe hij je website veilig moet behandelen. Ze kosten niets aan snelheid en blokkeren hele categorieën aanvallen. Mijn eigen website gebruikt deze headers ook.</p>
        <div class="kb-table-wrap" tabindex="0" role="region" aria-label="Beveiligingsheaders">
          <table>
            <caption>Belangrijke beveiligingsheaders</caption>
            <thead><tr><th scope="col">Header</th><th scope="col">Wat het doet</th></tr></thead>
            <tbody>
              <tr><td>Strict-Transport-Security (HSTS)</td><td>Dwingt een beveiligde HTTPS-verbinding af</td></tr>
              <tr><td>Content-Security-Policy (CSP)</td><td>Bepaalt welke scripts, stijlen en afbeeldingen mogen laden, en beperkt zo XSS-aanvallen</td></tr>
              <tr><td>X-Frame-Options</td><td>Voorkomt dat je website in een frame op een andere site wordt geladen (clickjacking)</td></tr>
              <tr><td>X-Content-Type-Options</td><td>Voorkomt dat de browser bestandstypen verkeerd interpreteert</td></tr>
              <tr><td>Referrer-Policy</td><td>Beperkt welke gegevens met andere websites worden gedeeld</td></tr>
              <tr><td>Permissions-Policy</td><td>Schakelt browserfuncties uit die je niet nodig hebt, zoals camera of locatie</td></tr>
            </tbody>
          </table>
        </div>
        <p>Je kunt je eigen headers controleren met een gratis tool als securityheaders.com.</p>`,
    },
    {
      h2: 'Veilige formulieren en privacy',
      html: `
        <p>Een contactformulier is vaak het enige "invoerpunt" van een bedrijfswebsite, en dus het belangrijkste aandachtspunt:</p>
        <ul>
          <li><strong>Validatie.</strong> Invoer wordt gecontroleerd op het juiste formaat en de juiste lengte, ook aan de serverkant. Client-side controle alleen is niet genoeg.</li>
          <li><strong>Spambescherming.</strong> Onzichtbare honeypot-velden en limieten houden bots buiten zonder je bezoekers lastig te vallen met moeilijke puzzels.</li>
          <li><strong>Dataminimalisatie.</strong> Vraag alleen wat je nodig hebt. Wat je niet verzamelt, kan niet gelekt worden. Dat past ook bij de AVG.</li>
          <li><strong>Duidelijke privacyverklaring.</strong> Bezoekers weten wat er met hun gegevens gebeurt. Zie bijvoorbeeld mijn <a href="/privacybeleid">privacybeleid</a>.</li>
        </ul>`,
    },
    {
      h2: 'Wat je zelf in de gaten moet houden',
      html: `
        <p>Ook een onderhoudsarme website heeft een paar vaste aandachtspunten. Dit is de checklist:</p>
        <ol>
          <li><strong>Domein verlengen.</strong> Een verlopen domein is een van de duurste en meest voorkomende fouten. Zet automatische verlenging aan.</li>
          <li><strong>Sterke wachtwoorden en tweestapsverificatie</strong> op je domeinregistratie, hosting en e-mail.</li>
          <li><strong>Actuele contactgegevens en inhoud.</strong> Verouderde informatie schaadt je betrouwbaarheid.</li>
          <li><strong>Uptime-monitor.</strong> Een gratis dienst die een melding stuurt als je website niet bereikbaar is.</li>
          <li><strong>Back-up of versiebeheer</strong> van alle bestanden, zodat herstel snel gaat.</li>
        </ol>
        <p>Bij mijn pakketten is er na oplevering een periode gratis onderhoud, en daarna kun je kiezen voor een onderhoudsabonnement of losse aanpassingen. Wat dat kost? Zie <a href="/webdesign-kosten-friesland">wat een website kost</a>.</p>`,
    },
  ],
  faqTitle: 'VRAGEN OVER<br><span>WEBSITEBEVEILIGING</span>',
  faq: [
    { q: 'Hoe veilig is een website zonder plugins?', a: 'Een website zonder onnodige plugins heeft een veel kleiner aanvalsoppervlak. Er is minder externe code die kwetsbaar kan zijn, en dus minder dat moet worden bijgewerkt. Dat maakt de website van nature veiliger en onderhoudsarmer.' },
    { q: 'Wat zijn beveiligingsheaders?', a: 'Beveiligingsheaders zijn instructies die de server meestuurt en die de browser vertellen hoe hij je website veilig moet behandelen, zoals HSTS en Content-Security-Policy. Ze blokkeren veelvoorkomende aanvallen zoals clickjacking en XSS zonder dat bezoekers er iets van merken.' },
    { q: 'Hoeveel onderhoud heeft een maatwerk website nodig?', a: 'Weinig. Er hoeven geen plugin- en thema-updates te worden uitgevoerd. Je let vooral op domeinverlenging, hosting en actuele inhoud. Bij MVDBmedia zit er na oplevering een periode gratis onderhoud bij, waarna je kunt kiezen voor een abonnement of losse aanpassingen.' },
    { q: 'Hoe weet ik of mijn website is gehackt?', a: 'Signalen zijn onverwachte pagina\'s of omleidingen, een waarschuwing in Google of je browser, plotselinge daling van bezoekers, of spam die vanuit je domein wordt verstuurd. Neem bij twijfel direct contact op met je webbouwer of hostingpartij.' },
    { q: 'Is een contactformulier veilig?', a: 'Dat hangt af van de uitvoering. Een veilig formulier valideert invoer ook aan de serverkant, heeft spambescherming en vraagt alleen om de gegevens die echt nodig zijn. Zo blijft het formulier beschermd tegen misbruik en voldoe je aan de AVG.' },
  ],
  related: ['maatwerk-website-vs-wordpress', 'snelle-website-laten-maken', 'webapplicatie-saas-laten-maken'],
};
