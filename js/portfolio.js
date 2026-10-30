// NAV
function toggleMenu() {
  var m = document.getElementById('mobile-menu');
  m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
}
function handleResize() {
  var w = window.innerWidth;
  var nl = document.getElementById('nav-links');
  var nc = document.getElementById('nav-cta');
  var mb = document.getElementById('menu-btn');
  if (nl) nl.style.display = w <= 900 ? 'none' : 'flex';
  if (nc) nc.style.display = w <= 900 ? 'none' : 'inline-block';
  if (mb) mb.style.display = w <= 900 ? 'flex' : 'none';
  if (w > 900) document.getElementById('mobile-menu').style.display = 'none';
}
window.addEventListener('resize', handleResize);
handleResize();

(function() {
  var nav = document.getElementById('nav');
  var t = false;
  window.addEventListener('scroll', function() {
    if (t) return; t = true;
    requestAnimationFrame(function() {
      if (window.scrollY > 20) {
        nav.style.background = 'rgba(13,13,13,0.96)';
        nav.style.backdropFilter = 'blur(12px)';
        nav.style.boxShadow = '0 1px 0 rgba(255,255,255,0.04),0 4px 24px rgba(0,0,0,0.5)';
      } else {
        nav.style.background = 'var(--bg-elevated)';
        nav.style.backdropFilter = 'none';
        nav.style.boxShadow = 'none';
      }
      t = false;
    });
  });
})();

// FILTER
function filterProjects(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('is-active'); });
  btn.classList.add('is-active');
  document.querySelectorAll('.proj-card').forEach(function(card) {
    if (cat === 'all' || card.dataset.cat === cat) {
      card.classList.remove('is-hidden');
    } else {
      card.classList.add('is-hidden');
    }
  });
}

// KEYBOARD ACCESS voor projectkaarten
document.querySelectorAll('.proj-card[data-a-click]:not([data-has-link])').forEach(function(card) {
  var t = card.querySelector('.proj-title');
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  if (t) card.setAttribute('aria-label', t.textContent + ' — foto\'s bekijken');
  card.addEventListener('keydown', function(e) {
    if (e.target !== card) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
  });
});

// PROJECT DATA
var projects = [
  {
    label: 'Portretfotografie', title: 'Portretshoot Marit',
    photos: [
      { src: 'fotos/marit/marit%201.webp', title: 'Marit tussen de oranje tulpen', alt: 'Marit staat in een geruit overhemd tussen oranje tulpen onder een blauwe lucht' },
      { src: 'fotos/marit/marit%202.webp', title: 'Marit met open armen', alt: 'Marit staat met uitgestrekte armen onder een heldere lucht, met windmolens op de achtergrond' },
      { src: 'fotos/marit/marit%203.webp', title: 'Marit tussen de roze tulpen', alt: 'Marit zit lachend tussen roze tulpen met een bewolkte lucht achter zich' },
      { src: 'fotos/marit/marit%204.webp', title: 'Marit aan het water', alt: 'Marit zit in profiel op een steiger aan het water en kijkt weg in de verte' },
      { src: 'fotos/marit/marit%205.webp', title: 'Marit in beweging', alt: 'Marit loopt in beweging langs de waterkant onder een bewolkte lucht' }
    ]
  },
  {
    label: 'Portretfotografie', title: 'Hondenfoto\'s — Ollie',
    photos: [
      { src: 'fotos/portret%20honden/ollie%201.webp', title: 'Ollie van dichtbij', alt: 'Close-up van Ollie, een Jack Russell Terriër met een gevlekte vacht en doordringende blauwe ogen' },
      { src: 'fotos/portret%20honden/ollie%202.webp', title: 'Ollie op het bospad', alt: 'Ollie, een Jack Russell Terriër, rent met een tuigje en lijn over een bospad' }
    ]
  },
  {
    label: 'Portretfotografie', title: 'Hondenfoto\'s — Ziggy',
    photos: [
      { src: 'fotos/portret%20honden/ziggy%201.webp', title: 'Ziggy in de herfst', alt: 'Ziggy, een Australian Shepherd, kijkt met open bek in de camera voor een onscherpe herfstachtergrond' },
      { src: 'fotos/portret%20honden/ziggy%202.webp', title: 'Ziggy in het gras', alt: 'Ziggy, een Australian Shepherd, zit rechtop in het gras met een zachte, onscherpe achtergrond' }
    ]
  },
  {
    label: 'Drone Visuals', title: 'Luchtfotografie',
    photos: [
      { src: 'fotos/luchtfotos/eiland.webp', title: 'Bled — eiland met kerkje', alt: 'Luchtfoto van het eiland met kerkje en rode daken in het turquoise water van Bled, Slovenië' },
      { src: 'fotos/drone-eiland.webp', title: 'Gebogen eiland met schip', alt: 'Luchtfoto van een gebogen, begroeid eilandje met een binnenvaartschip in donker water' },
      { src: 'fotos/drone-fort.webp', title: 'Fort met stervormige wallen', alt: 'Luchtfoto van een stervormig fort met grachten, wallen en bomen eromheen' },
      { src: 'fotos/drone-kasteel.webp', title: 'Landhuis in herfstkleuren', alt: 'Luchtfoto van een wit landhuis tussen bomen in herfstkleuren' },
      { src: 'fotos/drone-park.webp', title: 'Park met symmetrische tuinaanleg', alt: 'Luchtfoto van een symmetrisch aangelegd park met paden en bomen in herfstkleuren' },
      { src: 'fotos/luchtfotos/IMG-20251109-WA0016.webp', title: 'Gebogen eiland met schip', alt: 'Luchtfoto van een gebogen, begroeid eilandje met een binnenvaartschip in donker water' },
      { src: 'fotos/luchtfotos/IMG-20251109-WA0017.webp', title: 'Park met symmetrische tuinaanleg', alt: 'Luchtfoto van een symmetrisch aangelegd park met paden en bomen in herfstkleuren' },
      { src: 'fotos/luchtfotos/IMG-20251109-WA0019.webp', title: 'Landhuis in herfstkleuren', alt: 'Luchtfoto van een wit landhuis tussen bomen in herfstkleuren' }
    ]
  },
  {
    label: 'Constructie in Beeld', title: 'Bouwplaats — Bouwbedrijf Vellinga',
    photos: [
      { src: 'fotos/drone-bouwplaats.webp', title: 'Nieuwbouwwijk rond de waterpartij', alt: 'Luchtfoto van een nieuwbouwwijk met halfronde vakantiewoningen rond een waterpartij' },
      { src: 'fotos/bouwplaats%20drone/IMG-20251109-WA0021.webp', title: 'Woningen met blauwe dakfolie', alt: 'Drone-opname van woningen in aanbouw met blauwe dakfolie, bouwputten en machines' },
      { src: 'fotos/bouwplaats%20drone/IMG-20251109-WA0022.webp', title: 'Houten dakconstructie in aanbouw', alt: 'Woning in aanbouw met steigers en een houten dakconstructie tussen afgewerkte huizen' },
      { src: 'fotos/bouwplaats%20drone/IMG-20251109-WA0023.webp', title: 'Bouwplaats aan de haven', alt: 'Drone-opname van woningen in aanbouw naast een haven, met blauwe daken' },
      { src: 'fotos/bouwplaats%20drone/IMG-20251109-WA0025.webp', title: 'Waterpartij met woningen in aanbouw', alt: 'Luchtfoto van de waterpartij met halfronde woningen in aanbouw en blauwe dakfolie' },
      { src: 'fotos/bouwplaats%20drone/IMG-20251109-WA0026.webp', title: 'Bouwterrein naast het water', alt: 'Luchtfoto van een bouwterrein met woningen in aanbouw naast een kronkelend waterlichaam' },
      { src: 'fotos/bouwplaats%20drone/IMG-20251109-WA0028.webp', title: 'Rij woningen met oranje daken', alt: 'Luchtfoto van een rij woningen met oranje daken naast het kronkelende bouwterrein' },
      { src: 'fotos/bouwplaats%20drone/IMG-20251109-WA0030.webp', title: 'Haven en bouwterrein overzien', alt: 'Luchtfoto van een haven met rode en blauwe daken en een groot bouwterrein' },
      { src: 'fotos/bouwplaats%20drone/IMG-20251109-WA0036.webp', title: 'Nieuwbouwwijk rond de waterpartij', alt: 'Luchtfoto van een nieuwbouwwijk met halfronde vakantiewoningen rond een waterpartij' },
      { src: 'fotos/bouwplaats%20drone/IMG-20251109-WA0037.webp', title: 'Houten woningen in ruwbouw', alt: 'Drone-opname van drie houten woningen in ruwbouw met schuine daken' },
      { src: 'fotos/bouwplaats%20drone/IMG-20251109-WA0038.webp', title: 'Woning met zwarte gevel', alt: 'Woning met zwarte gevel en houten dak in aanbouw, gezien vanuit de lucht' },
      { src: 'fotos/bouwplaats%20drone/IMG-20251109-WA0039.webp', title: 'Nieuwbouw met zonnepanelen', alt: 'Nieuwbouwwoningen met zonnepanelen en houten dakplaten in aanbouw' },
      { src: 'fotos/bouwplaats%20drone/IMG-20251109-WA0042.webp', title: 'Straat met drie woningen in opbouw', alt: 'Luchtfoto van drie nieuwbouwwoningen in aanbouw langs een straat' }
    ]
  },
  {
    label: 'Groepsfotografie', title: 'Groepsfoto — Friesland Ontruimingen',
    photos: [
      { src: 'fotos/groepsfoto%202.webp', title: 'Het team in een rij', alt: 'Het team van Friesland Ontruimingen staat in zwarte shirts naast elkaar in een weiland' },
      { src: 'fotos/events-groep.webp', title: 'Het team in twee rijen', alt: 'Het team staat en zit in twee rijen voor een groene achtergrond met bomen' }
    ]
  },
  {
    label: 'Bedrijfsfotografie', title: 'Fitplan & NESAclinics Sneek',
    photos: [
      { src: 'fotos/nesaclinics-fitplan/nesaclinics-fitplan-team-behandelkamer.webp', title: 'Het team in de behandelkamer', alt: 'Twee Fitplan-therapeuten poseren lachend in de blauw verlichte NESAclinics-behandelkamer in Sneek' },
      { src: 'fotos/nesaclinics-fitplan/fitplan-sport-medisch-centrum-sneek-gebouw.webp', title: 'Fitplan Sport-medisch Centrum', alt: 'Gebouw van Fitplan Sport-medisch Centrum aan de Simmerdyk in Sneek bij zonnig weer' },
      { src: 'fotos/nesaclinics-fitplan/fitplan-nesaclinics-bewegwijzering-simmerdyk.webp', title: 'Simmerdyk 2', alt: 'Bewegwijzeringszuil Simmerdyk 2 in Sneek met onder andere de logo\'s van Fitplan en NESAclinics' },
      { src: 'fotos/nesaclinics-fitplan/nesaclinics-fitplan-team-nesa-banner.webp', title: 'Team bij de NESA-banner', alt: 'Twee medewerkers van Fitplan staan naast een NESA-banner bij de voordeur van de praktijk' },
      { src: 'fotos/nesaclinics-fitplan/nesaclinics-fitplan-intakegesprek.webp', title: 'In gesprek aan tafel', alt: 'Twee medewerkers van Fitplan in gesprek aan een houten tafel met NESA-banner en een historische stadskaart aan de muur' },
      { src: 'fotos/nesaclinics-fitplan/nesaclinics-fitplan-high-five.webp', title: 'High five', alt: 'Twee medewerkers van Fitplan geven elkaar een high five aan tafel bij de NESA-banner' },
      { src: 'fotos/nesaclinics-fitplan/nesaclinics-behandelkamer-sneek.webp', title: 'De behandelkamer', alt: 'Behandelkamer van NESAclinics in Sneek met blauw LED-licht, behandelstoel en een scherm met natuurbeeld' },
      { src: 'fotos/nesaclinics-fitplan/nesaclinics-behandeling-fitplan.webp', title: 'Behandeling in de praktijk', alt: 'Therapeut en cliënt bij de behandelstoel in de NESAclinics-behandelkamer van Fitplan in Sneek' }
    ]
  },
];

// LIGHTBOX
var lbItems = [], lbIndex = 0, lbCurrentLabel = '', lbOpener = null;

function openProject(projectIndex) {
  var project = projects[projectIndex];
  lbOpener = document.activeElement;
  lbItems = project.photos;
  lbCurrentLabel = project.label;
  lbIndex = 0;
  showLb(0);
  var lb = document.getElementById('lightbox');
  lb.classList.add('lb-open');
  requestAnimationFrame(function() {
    requestAnimationFrame(function() { lb.classList.add('lb-visible'); });
  });
  document.body.style.overflow = 'hidden';
  document.getElementById('lightbox').setAttribute('aria-label', 'Foto\'s: ' + project.title);
  document.getElementById('lb-close').focus();
}

function showLb(i) {
  var item = lbItems[i];
  var imgEl = document.getElementById('lightbox-img');
  imgEl.src = item.src;
  imgEl.alt = item.alt || item.title;
  document.getElementById('lb-caption-cat').textContent = lbCurrentLabel;
  document.getElementById('lb-caption-title').textContent = item.title;
  document.getElementById('lb-counter').textContent = (i + 1) + ' / ' + lbItems.length;
  document.getElementById('lb-prev').style.display = lbItems.length > 1 ? 'flex' : 'none';
  document.getElementById('lb-next').style.display = lbItems.length > 1 ? 'flex' : 'none';
}

function closeLightbox() {
  var lb = document.getElementById('lightbox');
  lb.classList.remove('lb-visible');
  setTimeout(function() { lb.classList.remove('lb-open'); document.body.style.overflow = ''; }, 250);
  if (lbOpener && lbOpener.focus) lbOpener.focus();
}

function lbPrev() { lbIndex = (lbIndex - 1 + lbItems.length) % lbItems.length; showLb(lbIndex); }
function lbNext() { lbIndex = (lbIndex + 1) % lbItems.length; showLb(lbIndex); }

document.getElementById('lightbox').addEventListener('click', function(e) { if (e.target === this) closeLightbox(); });
document.addEventListener('keydown', function(e) {
  if (!document.getElementById('lightbox').classList.contains('lb-open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') lbPrev();
  if (e.key === 'ArrowRight') lbNext();
  if (e.key === 'Tab') {
    var f = Array.prototype.filter.call(document.querySelectorAll('#lightbox .lb-btn'), function(b) { return b.style.display !== 'none'; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (f.indexOf(document.activeElement) === -1) { e.preventDefault(); first.focus(); }
  }
});
