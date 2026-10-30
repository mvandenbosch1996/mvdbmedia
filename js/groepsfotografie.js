function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}
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

(function() {
  const nav = document.getElementById('nav');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const scrolled = window.scrollY > 20;
      nav.style.background = scrolled ? 'rgba(22,22,22,0.98)' : 'var(--bg-elevated)';
      nav.style.boxShadow = scrolled ? '0 4px 24px rgba(0,0,0,0.4)' : 'none';
      ticking = false;
    });
    ticking = true;
  });
})();
