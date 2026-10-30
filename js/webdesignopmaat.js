/* ── Hero mouse parallax ── */
(function() {
  const mockup = document.getElementById('hero-mockup');
  if (!mockup) return;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  const strength = 8;

  document.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    targetX = ((e.clientX - cx) / cx) * strength;
    targetY = ((e.clientY - cy) / cy) * strength;
  });

  function tick() {
    currentX += (targetX - currentX) * 0.07;
    currentY += (targetY - currentY) * 0.07;
    mockup.style.transform = `translate(${currentX}px, ${currentY}px)`;
    requestAnimationFrame(tick);
  }
  tick();
})();

function toggleFaq(btn) {
  const body = btn.nextElementSibling;
  const icon = btn.querySelector('.faq-icon');
  const isOpen = btn.getAttribute('aria-expanded') === 'true';
  document.querySelectorAll('.faq-item button').forEach(b => {
    b.setAttribute('aria-expanded', 'false');
    b.nextElementSibling.style.maxHeight = '0';
    b.querySelector('.faq-icon').textContent = '+';
    b.querySelector('.faq-icon').style.transform = 'rotate(0deg)';
    b.querySelector('.faq-icon').style.borderColor = 'var(--border-light)';
  });
  if (!isOpen) {
    btn.setAttribute('aria-expanded', 'true');
    body.style.maxHeight = body.scrollHeight + 'px';
    icon.textContent = '×';
    icon.style.transform = 'rotate(90deg)';
    icon.style.borderColor = 'var(--orange)';
  }
}
