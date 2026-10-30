// Mobile menu toggle
(function() {
  const btn = document.getElementById('menu-btn');
  const menu = document.getElementById('mobile-menu');
  const navLinks = document.getElementById('nav-links');
  const navCta = document.getElementById('nav-cta');

  function applyMobileLayout() {
    if (window.innerWidth <= 768) {
      btn.style.display = 'flex';
      navLinks.style.display = 'none';
      navCta.style.display = 'none';
    } else {
      btn.style.display = 'none';
      navLinks.style.display = 'flex';
      navCta.style.display = 'inline-block';
      menu.style.display = 'none';
      menu.style.flexDirection = '';
    }
  }

  applyMobileLayout();
  window.addEventListener('resize', applyMobileLayout);
})();

function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  const isOpen = menu.style.display === 'flex';
  menu.style.display = isOpen ? 'none' : 'flex';
  if (!isOpen) menu.style.flexDirection = 'column';
}

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

// Scroll reveal (IntersectionObserver)
(function initScrollReveal() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const targets = document.querySelectorAll('.scroll-reveal');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, {
    root: null,
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  targets.forEach(el => observer.observe(el));
})();
