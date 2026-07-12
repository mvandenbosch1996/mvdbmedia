# Verborgen factuurgenerator met login — MVDBmedia

**Datum:** 2026-07-12
**Platform:** Cloudflare Pages (statische site + Pages Functions), bestaand project.

## Doel

Een privé-pagina waar Michael snel een factuur samenstelt door diensten aan te klikken,
prijzen/omschrijvingen te overschrijven, korting en vrije regels toe te voegen, en daarna
een PDF genereert die hij zelf naar de klant mailt. Precies één gebruiker, geen registratie.

## Bevindingen uit bestaande codebase

**Bedrijfsgegevens** (uit `index.html` footer + JSON-LD):
- Naam: Michael van den Bosch — MVDBmedia
- Adres: Dagpauwoog 15, 8607 HN Sneek
- KvK: 42084901 · BTW: NL005483105B05 · IBAN: NL93BUNQ2199250679
- Tel: +31 6 24 81 92 78 · E-mail: info@mvdbmedia.nl · Web: mvdbmedia.nl

**Huisstijl** (uit `index.html` `:root`):
- Accent oranje `#ff8c00` (dim `#c96e00`), bg `#0d0d0d`/`#161616`/`#1a1a1a`, tekst `#f0ede8`/`#a09890`
- Fonts: Bebas Neue (display) + Inter (body). Geen logobestand; tekst-lockup `MVDB` + oranje `media`.
- Besluit: factuur volgt de **echte site** (oranje + Bebas/Inter), niet het goud/Cormorant uit de brief.

**Prijzen** (uit `PAKKETTEN` in `index.html` + servicepagina's):
- Portret: Solo €95 · Signatuur €195 · Verhaal €345
- Groep: Klein €125 · Groep €195 · Uitgebreid €345 · Zakelijk €595
- Vastgoed: Compact €175 · Standaard €295 · Premium €495 (+ makelaar-abo v.a. €1.295/mnd)
- Webdesign: Starter v.a. €499 · Business v.a. €999
- Drone-constructie: Start €295 · Progres €795 · Archief €1.495
- Events: Kort €295 · Halve dag €595 · Volledig €995
- Drone-auto: Strak €125 · Reveal €225 · Cinematic €395

**Techniek:** Pages Functions al in gebruik (`functions/api/intake.js`, Resend). `_headers` heeft
strikte CSP met `script-src 'self'` → CDN's geblokkeerd. Robots.txt blokkeert al `/intake/`.

## Gaten (geen data in code — bewust weggelaten)

- **Website Premium** — bestaat niet als webpakket (alleen Starter/Business). Kaart weggelaten.
- **Videografie** — geen los prijspakket (alleen "Reel/Video" add-on). Kaart weggelaten.
- **Onderhoud/hosting abonnement** — site zegt "hosting niet inbegrepen", geen prijs. Kaart weggelaten.

Deze drie voegt Michael later toe via de config, of per factuur via "Regel toevoegen".

## Genomen beslissingen

| Onderwerp | Keuze |
|---|---|
| Huisstijl PDF & UI | Echte site: oranje `#ff8c00` + Bebas Neue/Inter |
| PDF-library | jsPDF + jsPDF-autotable **lokaal gehost** in `/admin/vendor/` (CSP-safe) |
| PDF-font koppen | Bebas Neue **embedden** in jsPDF (exacte match met site) |
| Login rate-limiting | Oplopende vertraging (in-memory per isolate), **geen KV** |
| Factuurnummer-teller | **Cloudflare KV**, gedeeld over apparaten |
| Teller start | Vers bij `2026-001` |
| Concept-formulier | localStorage (per apparaat prima) |

## Architectuur

```
functions/
  _lib/auth.js               gedeelde crypto: PBKDF2-verify, HMAC sign/verify,
                             constant-time compare, cookie parse/serialize
  admin/_middleware.js       auth-gate op /admin/* (server-side cookie-check)
  api/login.js               POST: PBKDF2-verify wachtwoord, zet sessiecookie
  api/logout.js              POST: cookie wissen (Max-Age=0)
  api/factuurnummer.js       achter gate: GET=reserveer volgend nr, POST=check bestaat
admin/
  login/index.html           wachtwoordveld, huisstijl, noindex
  factuur/index.html         generator: config + formulier + live preview, noindex
  vendor/jspdf.umd.min.js     lokaal
  vendor/jspdf.plugin.autotable.min.js  lokaal
  vendor/bebas-font.js        Bebas Neue als base64 VFS voor jsPDF
scripts/genereer-wachtwoord-hash.js   lokaal Node-script: print salt+hash
```

Aangepast: `_headers` (X-Robots-Tag + CSP-uitzondering /admin/), `robots.txt` (Disallow /admin/).
`sitemap.xml`: /admin staat er niet in — geen wijziging nodig, valt al buiten.

## Deel 1 — Login & beveiliging

**`_lib/auth.js`** (gedeelde helpers, geen state):
- `verifyPassword(password, saltHex, expectedHashHex)`: PBKDF2-SHA256, 100.000 iteraties,
  32-byte afgeleide sleutel via `crypto.subtle.deriveBits`. Vergelijkt met `timingSafeEqual`.
- `timingSafeEqual(a, b)`: HMAC-SHA256 beide waarden met een random per-request key en vergelijk
  de MAC's byte-voor-byte (voorkomt lengte/inhoud-leak; geen `===` op hash-string).
- `signSession(payload, secret)` / `verifySession(token, secret)`: token =
  `base64url(json).base64url(HMAC-SHA256(json, secret))`. Payload `{ exp }`. Verify checkt
  MAC constant-tijd én `exp > now`.
- `parseCookie(header, name)` / `sessionCookie(token)` / `clearCookie()`:
  `__session=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`.

**`api/login.js`** (`onRequestPost`):
1. Lees `password` uit body (JSON of form).
2. `verifyPassword` tegen env `ADMIN_PASSWORD_HASH` + `ADMIN_PASSWORD_SALT`.
3. Succes → `signSession({exp: now+7d}, SESSION_SECRET)`, zet cookie, redirect/200.
4. Mislukking → oplopende vertraging: houd `Map<ip, {count, ts}>` in module-scope; delay
   `min(count * 400ms, 4000ms)` vóór generieke fout `401 "Onjuist wachtwoord."`. Reset na 15 min.
   (In-memory per isolate; acceptabel voor één gebruiker, geen KV.)
5. Ontbrekende env vars → `500` generiek.

**`admin/_middleware.js`** (`onRequest`): voor elk `/admin/*`-verzoek behalve `/admin/login/`:
geldige `__session`-cookie via `verifySession` → door; anders `302` naar `/admin/login/`.
Server-side, niet te omzeilen client-side.

**`api/logout.js`** (`onRequestPost`): zet `clearCookie()`, redirect naar login.
Logout-knop op factuurpagina POST hierheen.

**`scripts/genereer-wachtwoord-hash.js`** (Node, lokaal): vraagt wachtwoord via readline
(verborgen), genereert random 16-byte salt, PBKDF2-SHA256 100k → 32 byte hash, print
`ADMIN_PASSWORD_SALT=<hex>` en `ADMIN_PASSWORD_HASH=<hex>`. Wachtwoord staat nergens in repo.
Gebruikt Node `crypto` met dezelfde parameters als de Worker-verificatie.

## Deel 2 — Niet indexeren

- `<meta name="robots" content="noindex, nofollow, noarchive">` op login- én factuurpagina.
- `_headers`: blok `/admin/*` → `X-Robots-Tag: noindex, nofollow`.
- `robots.txt`: `Disallow: /admin/`.
- `sitemap.xml`: bevat geen /admin — geen wijziging.

## Deel 3 — Factuurgenerator (`/admin/factuur/`)

**Config bovenaan het bestand** (makkelijk aanpasbaar):
- `AFZENDER = { naam, adres, postcodePlaats, kvk, btw, iban, tel, email, web }` — vaste waarden hierboven.
- `PAKKETTEN = [{ groep, label, prijs, omschrijving }]` — alle echte prijzen hierboven.
  Premium-web/video/onderhoud als commentaar-TODO in de config.
- `BTW_STANDAARD = 21`, opties `0` en `verlegd`.

**Klantvelden:** bedrijfsnaam, contactpersoon, adres, postcode+plaats, e-mail, KvK/btw (optioneel).

**Factuurvelden:** factuurnummer (`2026-NNN`, gereserveerd bij PDF-generatie, bewerkbaar),
factuurdatum (vandaag), vervaldatum (+14 dagen, aanpasbaar), referentie/projectnaam (optioneel).

**Dienstkaarten:** klik → factuurregel met standaardprijs; prijs én omschrijving zijn
bewerkbare inputs. Zelfde pakket met afwijkende prijs mogelijk.

**Vrije regels:** knop "Regel toevoegen"; elke regel omschrijving/aantal/stukprijs/regeltotaal;
verwijderbaar en herordenbaar (drag).

**Korting:** vast bedrag óf percentage, met eigen omschrijvingsveld.

**Berekening (live):** subtotaal → korting → subtotaal-na-korting → btw (21%/0%/verlegd) → totaal.

**Werkgemak:** live preview naast formulier; concept auto-opslaan in localStorage
(overleeft refresh); volledig Nederlands; mobiel bruikbaar, desktop-geoptimaliseerd.

## Deel 4 — PDF

- Client-side via lokale jsPDF + autotable. Geen server.
- Bebas Neue embedded voor koppen; Inter/Helvetica voor body.
- Oranje `#ff8c00` accent, near-black koptekst, veel witruimte, tekst-logo bovenaan.
- Afzenderblok (AFZENDER-config) + betalingsvoorwaarden onderaan:
  "Gelieve het bedrag binnen 14 dagen over te maken op IBAN NL93BUNQ2199250679 o.v.v. het factuurnummer."
- Download `Factuur-{factuurnummer}-{klantnaam}.pdf` (klantnaam ge-sanitized).

## Deel 5 — Factuurnummer (KV)

**`api/factuurnummer.js`** (achter middleware-gate):
- `GET ?reserveer=1`: lees `factuurteller-<jaar>` uit KV, +1, schrijf terug, voeg toe aan
  set `uitgegeven-<jaar>`, return `{ nummer: "2026-007" }`. Alleen aangeroepen bij PDF-generatie
  → geen gaten bij openen pagina.
- `POST { nummer }`: check of nummer in `uitgegeven-<jaar>`; return `{ bestaat: true|false }`.
- Frontend: nummer blijft handmatig overschrijfbaar; bij handmatige invoer POST-check →
  duidelijke waarschuwing als nummer al bestaat.
- KV-namespace `FACTUREN` gebonden in Cloudflare. Teller start ongezet = 0 → eerste reserve = `2026-001`.

## Foutafhandeling

- Login: generieke fouten, geen onderscheid "gebruiker bestaat niet" vs "wachtwoord fout".
- Ontbrekende env vars → 500 generiek, gelogd server-side.
- KV onbereikbaar bij nummer-reserve → toon fout, laat gebruiker handmatig nummer invoeren.
- PDF-generatie faalt → melding, formulierdata blijft (localStorage).

## Testen

- `scripts/genereer-wachtwoord-hash.js` lokaal: hash reproduceerbaar, verifieert in Worker.
- Login: juist wachtwoord → cookie + toegang; fout → vertraging + geen toegang;
  `/admin/factuur/` zonder cookie → redirect.
- Nummer-reserve: opvolgende GET's geven oplopende, gat-loze nummers; dubbel-check POST werkt.
- PDF: rendert met alle regels, korting, btw-varianten; bestandsnaam correct.
- Mobiel 390px + desktop screenshot-audit vóór deploy.

## Environment variables (Cloudflare Pages → Settings)

| Var | Bron |
|---|---|
| `ADMIN_PASSWORD_HASH` | output van hash-script |
| `ADMIN_PASSWORD_SALT` | output van hash-script |
| `SESSION_SECRET` | random 32+ byte hex, zelf genereren |
| KV-binding `FACTUREN` | nieuwe KV-namespace, binden aan Pages-project |

## Openstaande TODO's voor Michael

1. Prijs + omschrijving aanleveren voor Website Premium, Videografie, Onderhoud/hosting (nu weggelaten).
2. Env vars zetten + KV-namespace `FACTUREN` aanmaken en binden.
3. `SESSION_SECRET` genereren.
