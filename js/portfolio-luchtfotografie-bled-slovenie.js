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

// GALERIJ + LIGHTBOX
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.gal-item'));
  var lb = document.getElementById('lightbox');
  var imgEl = document.getElementById('lightbox-img');
  var idx = 0, opener = null, touchX = null;

  function show(i) {
    idx = (i + items.length) % items.length;
    var it = items[idx];
    imgEl.src = it.getAttribute('data-full');
    imgEl.alt = it.getAttribute('data-alt');
    document.getElementById('lb-caption-cat').textContent = "Luchtfotografie Bled, Slovenië";
    document.getElementById('lb-caption-title').textContent = it.getAttribute('data-title');
    document.getElementById('lb-counter').textContent = (idx + 1) + ' / ' + items.length;
  }
  function open(i, el) {
    opener = el;
    show(i);
    lb.classList.add('lb-open');
    requestAnimationFrame(function () { requestAnimationFrame(function () { lb.classList.add('lb-visible'); }); });
    document.body.style.overflow = 'hidden';
    document.getElementById('lb-close').focus();
  }
  window.closeLightbox = function () {
    lb.classList.remove('lb-visible');
    setTimeout(function () {
      lb.classList.remove('lb-open');
      document.body.style.overflow = '';
      if (opener) opener.focus();
    }, 250);
  };
  window.lbPrev = function () { show(idx - 1); };
  window.lbNext = function () { show(idx + 1); };

  items.forEach(function (el, i) { el.addEventListener('click', function () { open(i, el); }); });
  lb.addEventListener('click', function (e) { if (e.target === lb) window.closeLightbox(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('lb-open')) return;
    if (e.key === 'Escape') window.closeLightbox();
    if (e.key === 'ArrowLeft') window.lbPrev();
    if (e.key === 'ArrowRight') window.lbNext();
    if (e.key === 'Tab') {
      var f = [document.getElementById('lb-close'), document.getElementById('lb-prev'), document.getElementById('lb-next')];
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
    }
  });
  lb.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) { dx < 0 ? window.lbNext() : window.lbPrev(); }
  }, { passive: true });
})();
