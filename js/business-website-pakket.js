function toggleMenu() {
  const m = document.getElementById('mobile-menu');
  m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
}

const FAQ_PAD_BOTTOM = 20;
function fitFaqAnswer(item) {
  const answer = item.querySelector('.faq-answer');
  answer.style.maxHeight = answer.scrollHeight + FAQ_PAD_BOTTOM + 'px';
}
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => {
    i.classList.remove('open');
    i.querySelector('.faq-answer').style.maxHeight = '';
    i.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
  });
  if (!isOpen) {
    item.classList.add('open');
    fitFaqAnswer(item);
    btn.setAttribute('aria-expanded', 'true');
  }
}
window.addEventListener('resize', () => {
  document.querySelectorAll('.faq-item.open').forEach(fitFaqAnswer);
}, { passive: true });

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); observer.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
