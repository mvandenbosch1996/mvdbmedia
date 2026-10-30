const PAKKETTEN = {
  portret: [
    { label: 'Solo', prijs: '€95' },
    { label: 'Signatuur', prijs: '€195' },
    { label: 'Verhaal', prijs: '€345' },
  ],
  groep: [
    { label: 'Klein', prijs: '€125' },
    { label: 'Groep', prijs: '€195' },
    { label: 'Uitgebreid', prijs: '€345' },
    { label: 'Zakelijk', prijs: '€595' },
  ],
  vastgoed: [
    { label: 'Compact', prijs: '€175' },
    { label: 'Standaard', prijs: '€295' },
    { label: 'Premium', prijs: '€495' },
  ],
  webdesign: [
    { label: 'Starter', prijs: 'v.a. €499' },
    { label: 'Business', prijs: 'v.a. €999' },
  ],
  constructie: [
    { label: 'Start', prijs: '€295' },
    { label: 'Progres', prijs: '€795' },
    { label: 'Archief', prijs: '€1.495' },
  ],
  events: [
    { label: 'Kort', prijs: '€295' },
    { label: 'Halve dag', prijs: '€595' },
    { label: 'Volledig', prijs: '€995' },
  ],
  droneauto: [
    { label: 'Strak', prijs: '€125' },
    { label: 'Reveal', prijs: '€225' },
    { label: 'Cinematic', prijs: '€395' },
  ],
};

function handleDienstChange(val) {
  const wrapper = document.getElementById('pakket-wrapper');
  const opties = document.getElementById('pakket-opties');
  const input = document.getElementById('form-pakket');

  if (PAKKETTEN[val]) {
    opties.innerHTML = '';
    input.value = '';
    PAKKETTEN[val].forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.pakket = p.label;
      btn.innerHTML = `<span style="font-weight:600;font-size:0.82rem;">${p.label}</span><span style="color:var(--orange);font-size:0.78rem;font-weight:700;">${p.prijs}</span>`;
      btn.style.cssText = 'display:flex;justify-content:space-between;align-items:center;width:100%;padding:10px 14px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:3px;color:var(--text-primary);font-family:var(--font-body);cursor:pointer;transition:border-color 0.2s ease,background 0.2s ease;text-align:left;';
      btn.addEventListener('mouseenter', () => { if (!btn.classList.contains('selected')) btn.style.borderColor = 'rgba(255,140,0,0.4)'; });
      btn.addEventListener('mouseleave', () => { if (!btn.classList.contains('selected')) btn.style.borderColor = 'var(--border)'; });
      btn.addEventListener('click', () => {
        opties.querySelectorAll('button').forEach(b => {
          b.classList.remove('selected');
          b.style.borderColor = 'var(--border)';
          b.style.background = 'var(--bg-elevated)';
        });
        btn.classList.add('selected');
        btn.style.borderColor = 'var(--orange)';
        btn.style.background = 'rgba(255,140,0,0.06)';
        input.value = p.label;
      });
      opties.appendChild(btn);
    });
    wrapper.style.display = 'block';
    requestAnimationFrame(() => {
      wrapper.style.opacity = '1';
      wrapper.style.transform = 'translateY(0)';
    });
  } else {
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'translateY(-6px)';
    setTimeout(() => { wrapper.style.display = 'none'; }, 300);
    input.value = '';
  }
}

document.getElementById('form-dienst').addEventListener('change', function() {
  handleDienstChange(this.value);
});

function toggleDienst(val) {
  const wrapper = document.getElementById('dienst-wrapper');
  const select = document.getElementById('form-dienst');
  const bericht = document.getElementById('form-bericht');
  const pakketWrapper = document.getElementById('pakket-wrapper');
  if (val === 'vraag') {
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'translateY(-6px)';
    setTimeout(() => { wrapper.style.display = 'none'; }, 300);
    pakketWrapper.style.opacity = '0';
    pakketWrapper.style.transform = 'translateY(-6px)';
    setTimeout(() => { pakketWrapper.style.display = 'none'; }, 300);
    select.required = false;
    bericht.placeholder = 'Stel gerust je vraag, ik reageer binnen 24 uur...';
  } else {
    wrapper.style.display = 'block';
    requestAnimationFrame(() => {
      wrapper.style.opacity = '1';
      wrapper.style.transform = 'translateY(0)';
    });
    select.required = true;
    bericht.placeholder = 'Vertel me over jouw project, wensen en beschikbaarheid...';
    handleDienstChange(select.value);
  }
}

function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('menu-btn');
  const isOpen = menu.style.display === 'flex';
  menu.style.display = isOpen ? 'none' : 'flex';
  btn.setAttribute('aria-label', isOpen ? 'Menu openen' : 'Menu sluiten');
}

// Nav links hover
document.querySelectorAll('#nav-links a').forEach(link => {
  link.addEventListener('mouseenter', () => link.style.color = 'var(--text-primary)');
  link.addEventListener('mouseleave', () => link.style.color = 'var(--text-secondary)');
});

// Responsive nav — gebruik ID in plaats van fragiele selector
function handleResize() {
  const w = window.innerWidth;
  document.getElementById('nav-links').style.display = w < 1100 ? 'none' : 'flex';
  document.getElementById('nav-cta').style.display = w < 1100 ? 'none' : 'inline-block';
  document.getElementById('menu-btn').style.display = w < 1100 ? 'flex' : 'none';
}
window.addEventListener('resize', handleResize);
handleResize();

// Sticky nav scroll effect
(function() {
  const nav = document.getElementById('nav');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (window.scrollY > 20) {
        nav.style.background = 'rgba(13,13,13,0.96)';
        nav.style.backdropFilter = 'blur(12px)';
        nav.style.boxShadow = '0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.5)';
      } else {
        nav.style.background = 'var(--bg-elevated)';
        nav.style.backdropFilter = 'none';
        nav.style.boxShadow = 'none';
      }
      ticking = false;
    });
  });
})();

// Dienst card hover
document.querySelectorAll('.dienst-card').forEach(card => {
  const border = card.querySelector('.dienst-border');
  const img   = card.querySelector('.dienst-img');
  const icon  = card.querySelector('.dienst-icon');
  card.addEventListener('mouseenter', () => {
    if (border) border.style.transform = 'scaleX(1)';
    if (img)   img.style.transform   = 'scale(1.05)';
    if (icon) {
      icon.style.transform   = 'scale(1.2) rotate(8deg)';
      icon.style.background  = 'rgba(255,140,0,0.2)';
      icon.style.borderColor = 'rgba(255,140,0,0.55)';
    }
  });
  card.addEventListener('mouseleave', () => {
    if (border) border.style.transform = 'scaleX(0)';
    if (img)   img.style.transform   = 'scale(1)';
    if (icon) {
      icon.style.transform   = 'scale(1) rotate(0deg)';
      icon.style.background  = 'rgba(255,140,0,0.1)';
      icon.style.borderColor = 'rgba(255,140,0,0.22)';
    }
  });
});

// Scroll-indicator: verberg op mobiel zodra hero uit beeld scrolt
(function initScrollHint() {
  if (window.innerWidth > 768) return;
  const indicator = document.querySelector('.scroll-mouse-wrap');
  const hero = document.querySelector('#hero');
  if (!indicator || !hero) return;
  window.addEventListener('scroll', function() {
    const heroBottom = hero.getBoundingClientRect().bottom;
    const visible = heroBottom > 80;
    indicator.style.opacity = visible ? '' : '0';
    indicator.style.pointerEvents = visible ? '' : 'none';
  }, { passive: true });
})();


// Scroll reveal (IntersectionObserver, no library)
(function initScrollReveal() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  // Label badge-items inside cards so CSS stagger transitions can target them
  document.querySelectorAll('.dienst-card').forEach(card => {
    const tagsWrap = card.querySelector('div[style*="gap:6px"][style*="margin-bottom"]');
    if (tagsWrap) {
      tagsWrap.querySelectorAll(':scope > div').forEach(tag => tag.classList.add('dienst-tag'));
    }
  });

  // General section targets (.over-grid removed — photo has own observer, text col added separately)
  const targets = [
    ...document.querySelectorAll(
      '#diensten h2, #diensten p,' +
      '#over .over-grid > div:last-child, #over .over-stats-balk,' +
      '#contact .contact-grid,' +
      'footer .footer-grid, footer > div > div:last-child'
    )
  ];

  const textTargets = [
    ...document.querySelectorAll('#diensten h3, #diensten .dienst-card p, #over p, #over .over-aanpak-grid > div, #contact p')
  ];

  const allTargets = [...targets, ...textTargets];
  allTargets.forEach((el, index) => {
    el.classList.add('scroll-reveal');
    const delay = index % 4;
    if (delay > 0) el.classList.add(`reveal-delay-${delay}`);
  });

  // Service cards stagger individually (left → right, 0 / 0.1 / 0.2 / 0.3s)
  const cardDelays = ['', 'reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3'];
  document.querySelectorAll('.dienst-card').forEach((card, i) => {
    card.classList.add('scroll-reveal');
    if (cardDelays[i]) card.classList.add(cardDelays[i]);
    allTargets.push(card);
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, {
    root: null,
    threshold: 0.10,
    rootMargin: '0px 0px -6% 0px'
  });

  allTargets.forEach((el) => observer.observe(el));
})();

// ── STATS COUNTER ──
(function initStats() {
  const statEls = document.querySelectorAll('[data-count]');
  const obs = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const duration = 1600;
      let start = null;
      const tick = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.6 });
  statEls.forEach(el => obs.observe(el));
})();

// Form field validation checkmarks
function validateField(fieldId, checkId, testFn) {
  const el    = document.getElementById(fieldId);
  const check = document.getElementById(checkId);
  if (!el || !check) return;
  const valid = testFn(el.value);
  if (valid) {
    check.classList.remove('is-valid');
    void check.offsetWidth;        // force reflow → restart animation
    check.classList.add('is-valid');
  } else {
    check.classList.remove('is-valid');
  }
}

(function initFormValidation() {
  const rules = [
    { id: 'form-naam',    check: 'check-naam',    event: 'blur',   test: v => v.trim().length >= 2 },
    { id: 'form-email',   check: 'check-email',   event: 'blur',   test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    { id: 'form-dienst',  check: 'check-dienst',  event: 'change', test: v => v !== '' },
    { id: 'form-bericht', check: 'check-bericht', event: 'blur',   test: v => v.trim().length >= 10 },
  ];
  rules.forEach(({ id, check, event, test }) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, () => validateField(id, check, test));
  });
  // Submit button hover — pause glow
  const btn = document.getElementById('submit-btn');
  if (btn) {
    btn.addEventListener('mouseenter', () => btn.style.setProperty('--glow','0'));
    btn.addEventListener('mouseleave', () => btn.style.removeProperty('--glow'));
  }
})();

// Over mij: photo slide-in + border-draw corner
(function() {
  const photo = document.querySelector('.over-photo');
  if (!photo || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (photo) { photo.style.opacity = '1'; photo.style.transform = 'none'; }
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.18 });
  obs.observe(photo);
})();

// Scroll progress bar
(function() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  let ticking = false;
  function update() {
    const scrollTop = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (docH > 0 ? Math.min(scrollTop / docH, 1) * 100 : 0) + '%';
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
})();

// Hero parallax — achtergrond beweegt 35% trager dan de tekst
(function() {
  const bg = document.getElementById('hero-parallax-bg');
  if (!bg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function() {
      bg.style.transform = 'translateY(' + (window.scrollY * 0.35) + 'px)';
      ticking = false;
    });
  }, { passive: true });
})();

// Tijdstempel voor timing-check bij submit — reset na elke geslaagde verzending
let _formLoadedAt = Date.now();

const FORM_RULES = [
  { id: 'form-naam',    msg: 'Vul je naam in (minimaal 2 tekens).', test: v => v.trim().length >= 2 },
  { id: 'form-email',   msg: 'Vul een geldig e-mailadres in, bijvoorbeeld naam@bedrijf.nl.', test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
  { id: 'form-dienst',  msg: 'Kies een dienst.', test: v => v !== '', skip: reden => reden === 'vraag' },
  { id: 'form-bericht', msg: 'Schrijf een bericht (minimaal 3 tekens).', test: v => v.trim().length >= 3 },
];

function setFormStatus(text, kind) {
  const box = document.getElementById('form-status');
  if (!box) return;
  box.textContent = text;
  box.className = kind === 'error' ? 'is-error' : kind === 'ok' ? 'is-ok' : '';
}

function clearFieldError(el) {
  el.setAttribute('aria-invalid', 'false');
  el.style.borderColor = 'var(--border)';
  const p = document.getElementById('err-' + el.id.replace('form-', ''));
  if (p) p.textContent = '';
}

function showFieldError(el, rule) {
  el.setAttribute('aria-invalid', 'true');
  el.style.borderColor = '#e05555';
  const p = document.getElementById('err-' + el.id.replace('form-', ''));
  if (p) p.textContent = rule.msg;
  if (el.dataset.live) return;
  el.dataset.live = '1';
  const recheck = () => { if (rule.test(el.value)) clearFieldError(el); };
  el.addEventListener('input', recheck);
  el.addEventListener('change', recheck);
}

// Contact form submit — stuurt berichten naar info@mvdbmedia.nl via Formspree
async function handleFormSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  const form = e.target;

  // Voorkom dubbele verzending terwijl er al een loopt
  if (btn.disabled) return;

  // Timing-check: bots submitten direct, mensen doen er minstens 1,5s over
  if (Date.now() - _formLoadedAt < 1500) return;

  // Honeypot-check: als _gotcha is ingevuld is het een bot
  const gotcha = form.querySelector('[name="_gotcha"]');
  if (gotcha && gotcha.value) return;

  const redenVal = document.getElementById('form-reden').value;
  let firstInvalid = null;
  FORM_RULES.forEach(rule => {
    const el = document.getElementById(rule.id);
    if (!el) return;
    if (rule.skip && rule.skip(redenVal)) { clearFieldError(el); return; }
    if (rule.test(el.value)) { clearFieldError(el); return; }
    showFieldError(el, rule);
    if (!firstInvalid) firstInvalid = el;
  });
  if (firstInvalid) {
    setFormStatus('Controleer de gemarkeerde velden en probeer het opnieuw.', 'error');
    firstInvalid.focus();
    return;
  }

  btn.textContent = 'Verzenden...';
  btn.disabled = true;
  setFormStatus('Bericht wordt verzonden...', '');

  try {
    const res = await fetch('https://formspree.io/f/xbdqvdpd', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    });
    if (res.ok) {
      btn.textContent = 'Verzonden ✓';
      btn.style.background = '#1a4d1a';
      btn.style.color = '#7dfa7d';
      form.reset();
      form.querySelectorAll('input, select, textarea').forEach(el => {
        el.style.borderColor = 'var(--border)';
        el.setAttribute('aria-invalid', 'false');
      });
      form.querySelectorAll('.field-error').forEach(p => { p.textContent = ''; });
      setFormStatus('Bedankt! Je bericht is verzonden. Ik reageer binnen 24 uur.', 'ok');
      // Timing-klok opnieuw starten voor de volgende invulling
      _formLoadedAt = Date.now();
      setTimeout(() => {
        btn.textContent = 'Verstuur aanvraag of vraag';
        btn.style.background = 'var(--orange)';
        btn.style.color = '#000';
        btn.disabled = false;
      }, 4000);
    } else {
      throw new Error('server error');
    }
  } catch {
    btn.textContent = 'Probeer opnieuw';
    btn.style.background = '#5c1a1a';
    btn.style.color = '#fa7d7d';
    setFormStatus('Verzenden is mislukt. Probeer het opnieuw of mail naar info@mvdbmedia.nl.', 'error');
    btn.disabled = false;
  }
}

function fieldBlurStyle() {
  this.style.borderColor = this.getAttribute('aria-invalid') === 'true' ? '#e05555' : 'var(--border)';
}
