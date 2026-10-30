function toggleMenu() { const m = document.getElementById('mobile-menu'); m.style.display = m.style.display === 'flex' ? 'none' : 'flex'; }
function handleResize() {
  const w = window.innerWidth, nl = document.getElementById('nav-links'), nc = document.getElementById('nav-cta'), mb = document.getElementById('menu-btn');
  if (nl) nl.style.display = w <= 900 ? 'none' : 'flex';
  if (nc) nc.style.display = w <= 900 ? 'none' : 'inline-block';
  if (mb) mb.style.display = w <= 900 ? 'flex' : 'none';
  if (w > 900) document.getElementById('mobile-menu').style.display = 'none';
}
window.addEventListener('resize', handleResize); handleResize();
(function() {
  const nav = document.getElementById('nav'); let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      if (window.scrollY > 20) { nav.style.background = 'rgba(13,13,13,0.96)'; nav.style.backdropFilter = 'blur(12px)'; nav.style.boxShadow = '0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.5)'; }
      else { nav.style.background = 'var(--bg-elevated)'; nav.style.backdropFilter = 'none'; nav.style.boxShadow = 'none'; }
      ticking = false;
    });
  });
})();
