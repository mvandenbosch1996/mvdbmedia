// ── Mobile menu toggle ──
function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

// ── Responsive nav ──
function handleResize() {
  const w = window.innerWidth;
  const navLinks = document.getElementById('nav-links');
  const navCta = document.getElementById('nav-cta');
  const menuBtn = document.getElementById('menu-btn');
  if (navLinks) navLinks.style.display = w <= 900 ? 'none' : 'flex';
  if (navCta)   navCta.style.display   = w <= 900 ? 'none' : 'inline-block';
  if (menuBtn)  menuBtn.style.display  = w <= 900 ? 'flex' : 'none';
  if (w > 900) document.getElementById('mobile-menu').style.display = 'none';
}
window.addEventListener('resize', handleResize);
handleResize();

// ── Sticky nav scroll effect ──
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
