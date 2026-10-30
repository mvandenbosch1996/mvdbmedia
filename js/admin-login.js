const form = document.getElementById('loginform');
const foutEl = document.getElementById('fout');
const pwEl = document.getElementById('wachtwoord');
let tsOn = false, tsToken = '', tsWidget = null;
const tsReset = () => { if (tsOn && window.turnstile && tsWidget !== null) window.turnstile.reset(tsWidget); tsToken = ''; };
// Cloudflare Turnstile: alleen actief als de server een sitekey teruggeeft
fetch('/api/turnstile', { cache: 'no-store' })
  .then((r) => r.json())
  .then((d) => {
    if (!d || !d.sitekey) return;
    tsOn = true;
    const sc = document.createElement('script');
    sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    sc.async = true;
    sc.onload = () => {
      tsWidget = window.turnstile.render('#ts-box', {
        sitekey: d.sitekey, theme: 'dark', language: 'nl',
        callback: (t) => { tsToken = t; },
        'expired-callback': () => { tsToken = ''; },
        'error-callback': () => { tsToken = ''; },
      });
    };
    document.head.appendChild(sc);
  })
  .catch(() => {});
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  foutEl.textContent = '';
  pwEl.setAttribute('aria-invalid', 'false');
  if (tsOn && !tsToken) { foutEl.textContent = 'Bevestig eerst de beveiligingscontrole.'; return; }
  const wachtwoord = pwEl.value;
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wachtwoord, turnstile: tsToken }),
    });
    if (res.ok) { window.location.href = '/admin/factuur/'; return; }
    let data = {};
    try { data = await res.json(); } catch {}
    if (res.status === 401) pwEl.setAttribute('aria-invalid', 'true');
    foutEl.textContent = data.error || 'Inloggen mislukt. Probeer opnieuw.';
    tsReset();
  } catch { foutEl.textContent = 'Er ging iets mis. Probeer opnieuw.'; tsReset(); }
});
