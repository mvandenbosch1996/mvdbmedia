(function () {
  var nav = document.getElementById('nav');
  var btn = document.getElementById('menu-btn');
  var menu = document.getElementById('mobile-menu');

  if (btn && menu) {
    var setOpen = function (open) {
      menu.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    };
    btn.addEventListener('click', function () { setOpen(!menu.classList.contains('open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) setOpen(false); });
  }

  if (nav) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var scrolled = window.scrollY > 20;
        nav.style.background = scrolled ? 'rgba(13,13,13,0.96)' : '';
        nav.style.backdropFilter = scrolled ? 'blur(12px)' : '';
        nav.style.boxShadow = scrolled ? '0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.5)' : '';
        ticking = false;
      });
    }, { passive: true });
  }

  var reveals = document.querySelectorAll('.scroll-reveal');
  if (!reveals.length) return;
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(function (el) { observer.observe(el); });
})();
