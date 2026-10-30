// Mobile menu toggle
function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

// Scroll reveal
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.scroll-reveal').forEach(el => revealObserver.observe(el));

// Nav hover highlight
document.querySelectorAll('#nav-links a').forEach(link => {
  link.addEventListener('mouseenter', () => link.style.color = 'var(--text-primary)');
  link.addEventListener('mouseleave', () => link.style.color = 'var(--text-secondary)');
});
