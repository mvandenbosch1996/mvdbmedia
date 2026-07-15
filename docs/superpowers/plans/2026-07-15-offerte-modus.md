# Offerte-modus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** De factuurgenerator (`/admin/factuur`) uitbreiden met een offerte-modus: aparte nummerreeks, geldig-tot, omzetten naar factuur, en documenten met type-veld in KV opslaan.

**Architecture:** Één pagina/codebase. Backend: `factuurnummer.js` krijgt een `type`-param + aparte teller; nieuwe `document.js` slaat documenten op (`doc-<nummer>`) met facturen als onveranderlijk (409 zonder overwrite), plus GET-ophalen en PATCH-markeren. Frontend: `state.docType` stuurt labels/PDF/voettekst; omzet-knop en ophaal-veld verschijnen in offerte-modus.

**Tech Stack:** Cloudflare Pages Functions (ESM), KV-binding `FACTUREN`, jsPDF (lokaal), vanilla JS. Testen via `wrangler pages dev` + curl + puppeteer. Geen unit-testframework in dit project — verificatie is per taak een concreet commando met verwachte output.

---

## Belangrijke conventies (lees eerst)

- **Geen pytest/jest.** Verificatie = `curl`/puppeteer/handmatige DOM-check tegen `wrangler pages dev`. Elke taak heeft een "Verifieer"-stap met exact commando + verwachte output.
- **Sessie-gate:** alle `/api/*`-endpoints vereisen een geldige `__session`-cookie. Voor lokaal testen: log in via `/api/login` en hergebruik de cookie, óf test de endpoint-logica met een geldige cookie uit een login-call. Bestaande testaanpak: zie `functions/_lib/auth.js`.
- **KV lokaal:** `wrangler pages dev` maakt een lokale KV-namespace aan (bestandsgebaseerd in `.wrangler/`). Voldoende voor tests.
- **Commit na elke taak.** Werk op `main` (project-conventie: alle admin-taken los gecommit).
- **Regressie:** de bestaande factuur-flow mag NIET breken. Factuurnummers blijven opeenvolgend en ongemoeid.
- **XSS/innerHTML:** de preview gebruikt `innerHTML` met template-strings. ALLE user-content (klantvelden, nummer, datum, referentie, regels) MOET door `esc()`. Config-waarden (`AFZENDER.*`) zijn hardcoded en veilig. In Task 5: `esc(f.nummer)`, `esc(f.vervaldatum)` etc. zijn al zo geschreven — niet vereenvoudigen naar rauwe interpolatie. Geen nieuwe rauwe user-input in innerHTML introduceren.

---

## Taakoverzicht

1. `factuurnummer.js` — `type`-param + offerteteller
2. `document.js` — nieuw endpoint (POST/GET/PATCH)
3. Frontend: `state.docType` + toggle-UI in topbar
4. Frontend: reactieve labels (titel/sectiekop/knoppen/datumlabel/datum-default)
5. Frontend: preview + PDF per modus (titel/labels/voettekst/bestandsnaam)
6. Frontend: opslaan document bij genereren (incl. 409-afhandeling)
7. Frontend: offerte ophalen via nummer
8. Frontend: omzetten naar factuur (+ `omgezet_naar`-markering)
9. Eindtest: full E2E + PDF-raster + audit + screenshots

---

### Task 1: `factuurnummer.js` — type-param + offerteteller

**Files:**
- Modify: `functions/api/factuurnummer.js`

- [ ] **Step 1: Vervang de nummerlogica zodat GET een `type` accepteert**

Vervang `formatteer` + `onRequestGet` door onderstaande. Factuur ongewijzigd (`JJJJ-NNN`), offerte krijgt `OFF-` prefix + eigen teller.

```js
function jaar() { return new Date().getFullYear(); }
function formatteer(type, j, n) {
  const kern = `${j}-${String(n).padStart(3, "0")}`;
  return type === "offerte" ? `OFF-${kern}` : kern;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  const url = new URL(request.url);
  const type = url.searchParams.get("type") === "offerte" ? "offerte" : "factuur";

  const j = jaar();
  const tellerKey = type === "offerte" ? `offerteteller-${j}` : `factuurteller-${j}`;
  const huidig = parseInt((await env.FACTUREN.get(tellerKey)) || "0", 10);
  const volgend = huidig + 1;
  await env.FACTUREN.put(tellerKey, String(volgend));

  const nummer = formatteer(type, j, volgend);
  await env.FACTUREN.put(`uitgegeven-${nummer}`, "1");

  return json({ nummer });
}
```

- [ ] **Step 2: Start wrangler en log in om een cookie te krijgen**

Run:
```bash
npx wrangler pages dev . --kv FACTUREN --port 8788 &
# wacht tot "Ready on http://localhost:8788"
curl -s -c /tmp/mvdb-cookie.txt -X POST http://localhost:8788/api/login \
  -H "Content-Type: application/json" -d '{"wachtwoord":"<lokaal-testww>"}' -o /dev/null -w "%{http_code}\n"
```
Expected: `200` (login gelukt, cookie in /tmp/mvdb-cookie.txt).
Noot: gebruik het lokale test-wachtwoord uit `.dev.vars` (ADMIN_PASSWORD_*). Als `.dev.vars` ontbreekt, genereer via `node scripts/genereer-wachtwoord-hash.js` en zet in `.dev.vars`.

- [ ] **Step 3: Verifieer factuur- en offertenummer onafhankelijk**

Run:
```bash
curl -s -b /tmp/mvdb-cookie.txt "http://localhost:8788/api/factuurnummer" ; echo
curl -s -b /tmp/mvdb-cookie.txt "http://localhost:8788/api/factuurnummer?type=offerte" ; echo
curl -s -b /tmp/mvdb-cookie.txt "http://localhost:8788/api/factuurnummer" ; echo
```
Expected (bij lege KV): `{"nummer":"2026-001"}`, dan `{"nummer":"OFF-2026-001"}`, dan `{"nummer":"2026-002"}`.
Bewijst: aparte tellers, factuurreeks loopt door ondanks offerte ertussen.

- [ ] **Step 4: Commit**

```bash
git add functions/api/factuurnummer.js
git commit -m "factuurnummer: type-param voor aparte offerteteller (OFF-JJJJ-NNN)"
```

---

### Task 2: `document.js` — opslaan/ophalen/markeren

**Files:**
- Create: `functions/api/document.js`

- [ ] **Step 1: Maak het endpoint**

Create `functions/api/document.js`:

```js
// functions/api/document.js
// POST  /api/document {doc, overwrite?}  -> slaat doc-<nummer> op; factuur onveranderlijk (409 zonder overwrite)
// GET   /api/document?nummer=...          -> { doc } of 404
// PATCH /api/document {nummer, omgezet_naar} -> markeert offerte als omgezet
// Vereist sessiecookie. KV-binding FACTUREN. Key: doc-<nummer>.

import { parseCookie, verifySession } from "../_lib/auth.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json" },
  });
}

async function geautoriseerd(request, env) {
  const token = parseCookie(request.headers.get("Cookie"));
  return env.SESSION_SECRET && (await verifySession(token, env.SESSION_SECRET));
}

const KEY = (nummer) => `doc-${nummer}`;

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Ongeldig verzoek." }, 400); }
  const doc = body && body.doc;
  const overwrite = body && body.overwrite === true;
  if (!doc || !doc.nummer || (doc.type !== "factuur" && doc.type !== "offerte")) {
    return json({ error: "Ongeldig document." }, 400);
  }

  const bestaandRaw = await env.FACTUREN.get(KEY(doc.nummer));
  if (bestaandRaw) {
    let bestaand = {};
    try { bestaand = JSON.parse(bestaandRaw); } catch {}
    if (bestaand.type === "factuur" && !overwrite) {
      return json({ error: "Factuur bestaat al.", bestaat: true }, 409);
    }
  }

  doc.opgeslagen = new Date().toISOString();
  await env.FACTUREN.put(KEY(doc.nummer), JSON.stringify(doc));
  return json({ ok: true });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  const url = new URL(request.url);
  const nummer = (url.searchParams.get("nummer") || "").trim();
  if (!nummer) return json({ error: "Geen nummer opgegeven." }, 400);

  const raw = await env.FACTUREN.get(KEY(nummer));
  if (!raw) return json({ error: "Niet gevonden." }, 404);
  return json({ doc: JSON.parse(raw) });
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Ongeldig verzoek." }, 400); }
  const nummer = (body.nummer || "").trim();
  if (!nummer) return json({ error: "Geen nummer opgegeven." }, 400);

  const raw = await env.FACTUREN.get(KEY(nummer));
  if (!raw) return json({ error: "Niet gevonden." }, 404);
  const doc = JSON.parse(raw);
  doc.omgezet_naar = body.omgezet_naar || null;
  doc.opgeslagen = new Date().toISOString();
  await env.FACTUREN.put(KEY(nummer), JSON.stringify(doc));
  return json({ ok: true });
}
```

- [ ] **Step 2: Verifieer POST nieuw + GET terug**

Run (wrangler + cookie uit Task 1):
```bash
curl -s -b /tmp/mvdb-cookie.txt -X POST http://localhost:8788/api/document \
  -H "Content-Type: application/json" \
  -d '{"doc":{"type":"offerte","nummer":"OFF-2026-001","datum":"2026-07-15","regels":[]}}' ; echo
curl -s -b /tmp/mvdb-cookie.txt "http://localhost:8788/api/document?nummer=OFF-2026-001" ; echo
```
Expected: `{"ok":true}` en daarna `{"doc":{...,"nummer":"OFF-2026-001",...,"opgeslagen":"..."}}`.

- [ ] **Step 3: Verifieer factuur-onveranderlijkheid (409 + overwrite)**

Run:
```bash
curl -s -b /tmp/mvdb-cookie.txt -X POST http://localhost:8788/api/document \
  -H "Content-Type: application/json" \
  -d '{"doc":{"type":"factuur","nummer":"2026-001","datum":"2026-07-15","regels":[]}}' ; echo
# tweede keer zonder overwrite -> 409
curl -s -b /tmp/mvdb-cookie.txt -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8788/api/document \
  -H "Content-Type: application/json" \
  -d '{"doc":{"type":"factuur","nummer":"2026-001","datum":"2026-07-15","regels":[]}}'
# met overwrite -> 200
curl -s -b /tmp/mvdb-cookie.txt -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8788/api/document \
  -H "Content-Type: application/json" \
  -d '{"doc":{"type":"factuur","nummer":"2026-001","datum":"2026-07-15","regels":[]},"overwrite":true}'
# offerte overschrijven -> altijd 200
curl -s -b /tmp/mvdb-cookie.txt -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8788/api/document \
  -H "Content-Type: application/json" \
  -d '{"doc":{"type":"offerte","nummer":"OFF-2026-001","datum":"2026-07-15","regels":[]}}'
```
Expected: `{"ok":true}`, dan `409`, dan `200`, dan `200`.

- [ ] **Step 4: Verifieer PATCH + 404**

Run:
```bash
curl -s -b /tmp/mvdb-cookie.txt -X PATCH http://localhost:8788/api/document \
  -H "Content-Type: application/json" \
  -d '{"nummer":"OFF-2026-001","omgezet_naar":"2026-002"}' ; echo
curl -s -b /tmp/mvdb-cookie.txt "http://localhost:8788/api/document?nummer=OFF-2026-001" ; echo
curl -s -b /tmp/mvdb-cookie.txt -o /dev/null -w "%{http_code}\n" "http://localhost:8788/api/document?nummer=BESTAATNIET"
```
Expected: `{"ok":true}`; GET toont `"omgezet_naar":"2026-002"`; laatste = `404`.

- [ ] **Step 5: Commit**

```bash
git add functions/api/document.js
git commit -m "api: document endpoint - opslaan/ophalen/markeren (factuur onveranderlijk, 409)"
```

---

### Task 3: Frontend — `state.docType` + toggle-UI

**Files:**
- Modify: `admin/factuur/index.html` (topbar HTML rond regel 92-98; state rond 246-253; localStorage 255-269)

- [ ] **Step 1: Voeg toggle-knoppen toe aan de topbar**

Vervang het `<div class="topbar">…</div>`-blok (regels 92-98) door:

```html
  <div class="topbar">
    <div style="display:flex; align-items:center; gap:14px;">
      <div class="logo">MVDB<span>media</span> · <span id="topbar-type">Factuur</span></div>
      <div style="display:flex; gap:0; border:1px solid var(--border); border-radius:5px; overflow:hidden;">
        <button class="btn btn-klein" id="toggle-factuur" type="button" style="border-radius:0;">Factuur</button>
        <button class="btn btn-klein" id="toggle-offerte" type="button" style="border-radius:0;">Offerte</button>
      </div>
    </div>
    <div style="display:flex; gap:10px;">
      <button class="btn btn-ghost" id="omzet-knop" type="button" style="display:none;">Zet om naar factuur</button>
      <button class="btn btn-oranje" id="pdf-knop" type="button">Factuur genereren (PDF)</button>
      <button class="btn btn-ghost" id="logout-knop" type="button">Uitloggen</button>
    </div>
  </div>
```

- [ ] **Step 2: Voeg `docType` toe aan state + localStorage**

In het `state`-object (rond regel 246) voeg toe na `factuur: {...},`:
```js
    docType: "factuur", // "factuur" | "offerte"
```

In `laadConcept()` (rond regel 260, binnen `if (opgeslagen)`) voeg toe:
```js
        state.docType = opgeslagen.docType === "offerte" ? "offerte" : "factuur";
```

- [ ] **Step 3: Voeg de toggle-render-functie toe en roep 'm aan in init**

Voeg vóór `function init()` toe:
```js
  function isOfferte() { return state.docType === "offerte"; }

  function pasModusToe() {
    const off = isOfferte();
    document.getElementById("topbar-type").textContent = off ? "Offerte" : "Factuur";
    document.getElementById("toggle-factuur").className = "btn btn-klein " + (off ? "btn-ghost" : "btn-oranje");
    document.getElementById("toggle-offerte").className = "btn btn-klein " + (off ? "btn-oranje" : "btn-ghost");
    document.getElementById("omzet-knop").style.display = off ? "" : "none";
    document.getElementById("pdf-knop").textContent = off ? "Offerte genereren (PDF)" : "Factuur genereren (PDF)";
    const secKop = document.getElementById("sectie-doc-kop");
    if (secKop) secKop.textContent = off ? "Offertegegevens" : "Factuurgegevens";
    const nrLabel = document.getElementById("label-nummer");
    if (nrLabel) nrLabel.textContent = off ? "Offertenummer" : "Factuurnummer";
    const datumLabel = document.getElementById("label-vervaldatum");
    if (datumLabel) datumLabel.textContent = off ? "Geldig tot" : "Vervaldatum";
    const ophaal = document.getElementById("ophaal-blok");
    if (ophaal) ophaal.style.display = off ? "" : "none";
    renderPreview();
  }

  function wisselModus(nieuw) {
    if (state.docType === nieuw) return;
    const oudeDefault = state.docType === "offerte" ? overDertigDagen() : overVeertienDagen();
    state.docType = nieuw;
    // datum-default bijwerken alleen als de gebruiker 'm niet handmatig zette
    if (!state.factuur.vervaldatum || state.factuur.vervaldatum === oudeDefault) {
      state.factuur.vervaldatum = nieuw === "offerte" ? overDertigDagen() : overVeertienDagen();
      const vd = document.querySelector('[data-factuur="vervaldatum"]');
      if (vd) vd.value = state.factuur.vervaldatum;
    }
    pasModusToe(); bewaarConcept();
  }
```

Voeg de datum-helper toe naast `overVeertienDagen()` (rond regel 240):
```js
  function overDertigDagen() {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10);
  }
```

In `init()` (vóór de laatste `init()`-aanroep), voeg toe:
```js
    document.getElementById("toggle-factuur").addEventListener("click", () => wisselModus("factuur"));
    document.getElementById("toggle-offerte").addEventListener("click", () => wisselModus("offerte"));
    pasModusToe();
```

- [ ] **Step 4: Verifieer toggle in browser (puppeteer)**

Run:
```bash
node -e '
import("puppeteer").then(async ({default:pp})=>{
  const b=await pp.launch({headless:"new"}); const p=await b.newPage();
  await p.goto("http://localhost:3000/admin/factuur/index.html",{waitUntil:"load"});
  await new Promise(r=>setTimeout(r,500));
  await p.click("#toggle-offerte");
  const t=await p.evaluate(()=>({top:document.getElementById("topbar-type").textContent, pdf:document.getElementById("pdf-knop").textContent, omzet:document.getElementById("omzet-knop").style.display}));
  console.log(JSON.stringify(t));
  await b.close();
});'
```
Expected: `{"top":"Offerte","pdf":"Offerte genereren (PDF)","omzet":""}`.
Noot: gebruik de statische serve.mjs op :3000 (client-side render werkt zonder middleware; API-calls falen stil, prima voor UI-check).

- [ ] **Step 5: Commit**

```bash
git add admin/factuur/index.html
git commit -m "factuur-ui: docType-state + factuur/offerte toggle in topbar"
```

---

### Task 4: Frontend — reactieve labels op form-velden

**Files:**
- Modify: `admin/factuur/index.html` (sectiekop 127, nummerlabel 130, vervaldatum-label 141)

- [ ] **Step 1: Geef de te wisselen labels een id**

Regel 127 `<h2>Factuurgegevens</h2>` → `<h2 id="sectie-doc-kop">Factuurgegevens</h2>`

Regel 130 `<label>Factuurnummer</label>` → `<label id="label-nummer">Factuurnummer</label>`

Regel 141 `<div class="veld"><label>Vervaldatum</label><input id="f-vervaldatum" data-factuur="vervaldatum" type="date"></div>`
→ `<div class="veld"><label id="label-vervaldatum">Vervaldatum</label><input id="f-vervaldatum" data-factuur="vervaldatum" type="date"></div>`

(De `pasModusToe()` uit Task 3 zet deze teksten al; deze stap levert de id's.)

- [ ] **Step 2: Verifieer labelwissel**

Run:
```bash
node -e '
import("puppeteer").then(async ({default:pp})=>{
  const b=await pp.launch({headless:"new"}); const p=await b.newPage();
  await p.goto("http://localhost:3000/admin/factuur/index.html",{waitUntil:"load"});
  await new Promise(r=>setTimeout(r,500));
  await p.click("#toggle-offerte");
  const t=await p.evaluate(()=>({kop:document.getElementById("sectie-doc-kop").textContent, nr:document.getElementById("label-nummer").textContent, vd:document.getElementById("label-vervaldatum").textContent}));
  console.log(JSON.stringify(t));
  await b.close();
});'
```
Expected: `{"kop":"Offertegegevens","nr":"Offertenummer","vd":"Geldig tot"}`.

- [ ] **Step 3: Commit**

```bash
git add admin/factuur/index.html
git commit -m "factuur-ui: reactieve labels (sectiekop/nummer/geldig-tot) per modus"
```

---

### Task 5: Frontend — preview + PDF per modus

**Files:**
- Modify: `admin/factuur/index.html` (preview `renderPreview` 411-437; PDF `genereerPdf` 621-729)

- [ ] **Step 1: Preview-titel, meta-labels en voettekst per modus**

In `renderPreview()` vervang het `document.getElementById("preview").innerHTML = \`…\`;`-blok (regels 411-437) door onderstaande. Wijzigingen: titel, meta-labels, en voettekst afhankelijk van `isOfferte()`.

```js
    const off = isOfferte();
    const titel = off ? "OFFERTE" : "FACTUUR";
    const lblNummer = off ? "Offertenr" : "Nummer";
    const lblDatum = off ? "Offertedatum" : "Datum";
    const lblVerval = off ? "Geldig tot" : "Vervalt";
    const voet = off
      ? `Deze offerte is geldig tot ${esc(f.vervaldatum)}.<br>
         Op al onze diensten zijn de algemene voorwaarden van toepassing, te vinden op ${AFZENDER.voorwaarden}.<br>
         ${AFZENDER.naam} · ${AFZENDER.adres}, ${AFZENDER.postcodePlaats} · KvK ${AFZENDER.kvk} · BTW ${AFZENDER.btw} · ${AFZENDER.tel} · ${AFZENDER.email}`
      : `Gelieve het bedrag binnen 14 dagen over te maken op IBAN ${AFZENDER.iban} o.v.v. het factuurnummer${f.nummer ? " " + esc(f.nummer) : ""}.<br>
         Op al onze diensten zijn de algemene voorwaarden van toepassing, te vinden op ${AFZENDER.voorwaarden}.<br>
         ${AFZENDER.naam} · ${AFZENDER.adres}, ${AFZENDER.postcodePlaats} · KvK ${AFZENDER.kvk} · BTW ${AFZENDER.btw} · ${AFZENDER.tel} · ${AFZENDER.email}`;

    document.getElementById("preview").innerHTML = `
      <div class="pv-kop">
        <div class="pv-logo">MVDB<span>media</span></div>
        <div class="pv-titel">${titel}</div>
      </div>
      <div class="pv-meta-blok">
        <div>
          <div class="pv-label">${off ? "Offerte voor" : "Factuur aan"}</div>
          <div>${klantregels || '<span style="color:#bbb;">Klantgegevens…</span>'}</div>
        </div>
        <div style="text-align:right;">
          <div><span class="pv-label">${lblNummer}</span> ${esc(f.nummer) || "—"}</div>
          <div><span class="pv-label">${lblDatum}</span> ${esc(f.datum)}</div>
          <div><span class="pv-label">${lblVerval}</span> ${esc(f.vervaldatum)}</div>
          ${f.referentie ? `<div><span class="pv-label">Ref.</span> ${esc(f.referentie)}</div>` : ""}
        </div>
      </div>
      <table class="pv-tabel">
        <thead><tr><th>Omschrijving</th><th class="r">Aantal</th><th class="r">Stukprijs</th><th class="r">Totaal</th></tr></thead>
        <tbody>${regelsHtml}</tbody>
      </table>
      <div class="pv-tot">${totRijen}</div>
      <div class="pv-voet">${voet}</div>`;
```

- [ ] **Step 2: PDF-titel + meta-labels per modus**

In `genereerPdf()`: vervang de titelregel (regel 651)
```js
    doc.text("FACTUUR", 547, 60, { align: "right" });
```
door:
```js
    doc.text(isOfferte() ? "OFFERTE" : "FACTUUR", 547, 60, { align: "right" });
```

Vervang het `meta`-blok (regels 659-664):
```js
    const meta = [
      [isOfferte() ? "Offertenummer" : "Factuurnummer", state.factuur.nummer],
      [isOfferte() ? "Offertedatum" : "Factuurdatum", state.factuur.datum],
      [isOfferte() ? "Geldig tot" : "Vervaldatum", state.factuur.vervaldatum],
    ];
```
En het klant-label (regel 673):
```js
    doc.text(isOfferte() ? "Offerte voor:" : "Factuur aan:", M, 158);
```

- [ ] **Step 3: PDF-voettekst per modus + bestandsnaam**

Vervang de drie voettekst-regels (regels 723-725):
```js
    if (isOfferte()) {
      doc.text(`Deze offerte is geldig tot ${state.factuur.vervaldatum}.`, M, voet, { maxWidth: 499 });
    } else {
      doc.text(`Gelieve het bedrag binnen 14 dagen over te maken op IBAN ${AFZENDER.iban} o.v.v. het factuurnummer ${state.factuur.nummer}.`, M, voet, { maxWidth: 499 });
    }
    doc.text(`Op al onze diensten zijn de algemene voorwaarden van toepassing, te vinden op ${AFZENDER.voorwaarden}.`, M, voet + 12, { maxWidth: 499 });
    doc.text(`${AFZENDER.naam}  |  KvK ${AFZENDER.kvk}  |  BTW ${AFZENDER.btw}  |  ${AFZENDER.web}`, M, voet + 30);
```

Vervang de bestandsnaam-regel (regel 729):
```js
    const prefix = isOfferte() ? "Offerte" : "Factuur";
    doc.save(`${prefix}-${state.factuur.nummer}-${veiligeKlant}.pdf`);
```

- [ ] **Step 4: Verifieer preview offerte-modus**

Run:
```bash
node -e '
import("puppeteer").then(async ({default:pp})=>{
  const b=await pp.launch({headless:"new"}); const p=await b.newPage();
  await p.goto("http://localhost:3000/admin/factuur/index.html",{waitUntil:"load"});
  await new Promise(r=>setTimeout(r,500));
  await p.click("#toggle-offerte");
  await new Promise(r=>setTimeout(r,200));
  const t=await p.evaluate(()=>({titel:document.querySelector(".pv-titel").textContent, voet:document.querySelector(".pv-voet").textContent.includes("geldig tot"), betaal:document.querySelector(".pv-voet").textContent.includes("Gelieve het bedrag")}));
  console.log(JSON.stringify(t));
  await b.close();
});'
```
Expected: `{"titel":"OFFERTE","voet":true,"betaal":false}`.

- [ ] **Step 5: Commit**

```bash
git add admin/factuur/index.html
git commit -m "factuur-ui: preview + PDF per modus (titel/labels/voettekst/bestandsnaam)"
```

---

### Task 6: Frontend — document opslaan bij genereren

**Files:**
- Modify: `admin/factuur/index.html` (`genereerPdf` einde, na `doc.save`, rond regel 729-732)

- [ ] **Step 1: Voeg opslag-helper toe**

Voeg vóór `function init()` toe:
```js
  function huidigDocument() {
    return {
      type: state.docType,
      nummer: state.factuur.nummer,
      datum: state.factuur.datum,
      vervaldatum: state.factuur.vervaldatum,
      referentie: state.factuur.referentie,
      klant: { ...state.klant },
      regels: state.regels.map((r) => ({ omschrijving: r.omschrijving, aantal: r.aantal, stukprijs: r.stukprijs })),
      korting: { ...state.korting },
      btwTarief: state.btwTarief,
      btwVerlegd: state.btwVerlegd,
    };
  }

  async function bewaarDocument(overwrite = false) {
    try {
      const res = await fetch("/api/document", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc: huidigDocument(), overwrite }),
      });
      if (res.status === 409) {
        if (confirm("Deze factuur bestaat al in het archief. Overschrijven?")) {
          return bewaarDocument(true);
        }
        return false;
      }
      return res.ok;
    } catch { return false; }
  }
```

- [ ] **Step 2: Roep opslag aan na PDF-save**

In `genereerPdf()`, na `doc.save(...)` (na de nieuwe bestandsnaam-regel uit Task 5) en vóór/naast `bewaarKlant();`:
```js
    await bewaarDocument();
    bewaarKlant();
```

- [ ] **Step 3: Verifieer opslag end-to-end (wrangler, met echte KV)**

Dit vereist de pagina achter de gate. Test via wrangler pages dev (:8788) ingelogd. Vul de pagina, genereer, controleer KV:
```bash
# na genereren van een offerte OFF-2026-00X in de browser tegen :8788:
curl -s -b /tmp/mvdb-cookie.txt "http://localhost:8788/api/document?nummer=OFF-2026-001" | head -c 120 ; echo
```
Expected: JSON met `"type":"offerte"` en de regels. (Als handmatig genereren lastig is: de POST-flow is al los geverifieerd in Task 2; hier volstaat een DOM-trigger van `bewaarDocument()` via console.)

- [ ] **Step 4: Commit**

```bash
git add admin/factuur/index.html
git commit -m "factuur-ui: document opslaan in KV bij genereren (409-bevestiging bij factuur)"
```

---

### Task 7: Frontend — offerte ophalen via nummer

**Files:**
- Modify: `admin/factuur/index.html` (form-HTML bij nummerveld rond 128-138; JS)

- [ ] **Step 1: Voeg ophaal-blok toe onder het nummerveld**

Direct ná de `<div class="veld">` met het nummer + reserveer-knop (na regel 136, binnen de sectie), voeg een nieuw blok toe (verborgen in factuur-modus):

```html
        <div class="veld" id="ophaal-blok" style="display:none;">
          <label>Bestaande offerte ophalen</label>
          <div style="display:flex; gap:6px;">
            <input id="ophaal-nummer" placeholder="OFF-2026-001">
            <button class="btn btn-ghost btn-klein" id="ophaal-knop" type="button" style="white-space:nowrap;">Offerte ophalen</button>
          </div>
          <div class="waarschuwing" id="ophaal-waarschuwing"></div>
        </div>
```

- [ ] **Step 2: Voeg ophaal-logica toe**

Voeg vóór `function init()` toe:
```js
  async function haalOfferteOp(nummer) {
    const w = document.getElementById("ophaal-waarschuwing");
    w.textContent = "";
    nummer = (nummer || "").trim();
    if (!nummer) return;
    try {
      const res = await fetch("/api/document?nummer=" + encodeURIComponent(nummer));
      if (res.status === 404) { w.textContent = "Geen offerte met dit nummer gevonden."; return; }
      if (!res.ok) { w.textContent = "Ophalen mislukt."; return; }
      const { doc } = await res.json();
      if (doc.type !== "offerte") { w.textContent = "Dit nummer is geen offerte."; return; }
      // state vullen
      state.docType = "offerte";
      Object.assign(state.klant, doc.klant || {});
      state.factuur.nummer = doc.nummer || "";
      state.factuur.datum = doc.datum || vandaag();
      state.factuur.vervaldatum = doc.vervaldatum || overDertigDagen();
      state.factuur.referentie = doc.referentie || "";
      state.regels = (doc.regels || []).map((r) => ({ id: nieuwId(), omschrijving: r.omschrijving, aantal: r.aantal, stukprijs: r.stukprijs }));
      Object.assign(state.korting, doc.korting || {});
      state.btwTarief = doc.btwTarief ?? BTW_STANDAARD;
      state.btwVerlegd = !!doc.btwVerlegd;
      // velden bijwerken
      document.querySelectorAll("[data-klant]").forEach((el) => { el.value = state.klant[el.dataset.klant] || ""; });
      document.querySelectorAll("[data-factuur]").forEach((el) => { el.value = state.factuur[el.dataset.factuur] || ""; });
      document.getElementById("btw-select").value = state.btwVerlegd ? "verlegd" : String(state.btwTarief);
      renderRegels(); toonKortingVelden(); pasModusToe(); bewaarConcept();
    } catch { w.textContent = "Ophalen mislukt (netwerkfout)."; }
  }
```

In `init()` voeg toe:
```js
    document.getElementById("ophaal-knop").addEventListener("click", () => {
      haalOfferteOp(document.getElementById("ophaal-nummer").value);
    });
```

- [ ] **Step 3: Verifieer ophalen (wrangler, na Task 2 opgeslagen offerte)**

Met een in KV opgeslagen `OFF-2026-001` (uit Task 2), tegen :8788 ingelogd:
```bash
node -e '
import("puppeteer").then(async ({default:pp})=>{
  const b=await pp.launch({headless:"new"}); const p=await b.newPage();
  // login-cookie zetten valt buiten dit script; test desnoods de state-vulling met een stub-fetch.
  console.log("handmatige check: open :8788/admin/factuur, offerte-modus, vul OFF-2026-001, klik Offerte ophalen -> regels/klant gevuld");
  await b.close();
});'
```
Expected (handmatig): na "Offerte ophalen" met een bestaand nummer worden klant/regels/datum gevuld en toont de preview de offerte. Onbekend nummer → "Geen offerte met dit nummer gevonden."

- [ ] **Step 4: Commit**

```bash
git add admin/factuur/index.html
git commit -m "factuur-ui: offerte ophalen via nummer uit KV"
```

---

### Task 8: Frontend — omzetten naar factuur

**Files:**
- Modify: `admin/factuur/index.html` (JS; omzet-knop bestaat al uit Task 3)

- [ ] **Step 1: Voeg omzet-logica toe**

Voeg vóór `function init()` toe:
```js
  async function zetOmNaarFactuur() {
    if (!isOfferte()) return;
    const oudNummer = (state.factuur.nummer || "").trim();
    // 1. wissel naar factuur-modus
    state.docType = "factuur";
    state.factuur.nummer = "";
    // 2. vers factuurnummer reserveren
    const nr = await reserveerNummer(); // gebruikt docType=factuur
    if (!nr) { // reservering mislukt: terug naar offerte om dataverlies te voorkomen
      state.docType = "offerte"; state.factuur.nummer = oudNummer; pasModusToe();
      alert("Kon geen factuurnummer reserveren. Omzetten afgebroken.");
      return;
    }
    // 3. datum vandaag, vervaldatum +14
    state.factuur.datum = vandaag();
    state.factuur.vervaldatum = overVeertienDagen();
    // 4. offertenummer als referentie
    if (oudNummer) state.factuur.referentie = "offerte " + oudNummer;
    // velden bijwerken
    document.querySelectorAll("[data-factuur]").forEach((el) => { el.value = state.factuur[el.dataset.factuur] || ""; });
    // 5. oude offerte markeren (best-effort)
    if (oudNummer) {
      try {
        await fetch("/api/document", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nummer: oudNummer, omgezet_naar: nr }),
        });
      } catch {}
    }
    pasModusToe(); bewaarConcept();
  }
```

In `init()` voeg toe:
```js
    document.getElementById("omzet-knop").addEventListener("click", zetOmNaarFactuur);
```

- [ ] **Step 2: Verifieer omzetten (wrangler, handmatig)**

Handmatige stappen tegen :8788 (ingelogd):
1. Offerte-modus, reserveer offertenummer (bv. OFF-2026-002), voeg regel toe, genereer PDF (slaat offerte op).
2. Klik "Zet om naar factuur".
3. Controleer: modus = factuur, nummer = vers `2026-00X`, referentie = "offerte OFF-2026-002", geldig-tot label weg.
4. Controleer KV-markering:
```bash
curl -s -b /tmp/mvdb-cookie.txt "http://localhost:8788/api/document?nummer=OFF-2026-002" | grep -o '"omgezet_naar":"[^"]*"' ; echo
```
Expected: `"omgezet_naar":"2026-00X"` (het verse factuurnummer).

- [ ] **Step 3: Commit**

```bash
git add admin/factuur/index.html
git commit -m "factuur-ui: zet offerte om naar factuur (referentie + omgezet_naar-markering)"
```

---

### Task 9: Eindtest — E2E + PDF-raster + audit + screenshots

**Files:**
- (geen wijziging tenzij bugs)

- [ ] **Step 1: PDF-raster-check beide modi (memory: reference_pdf_render_check)**

Genereer een factuur-PDF én een offerte-PDF, raster de eerste pagina via pdf.js op about:blank (headless Chrome rendert PDF niet inline). Controleer visueel:
- Factuur: titel FACTUUR, betaalregel + AV + bedrijf, geen "geldig tot".
- Offerte: titel OFFERTE, "Deze offerte is geldig tot …" + AV + bedrijf, geen betaalregel; bestandsnaam Offerte-…

- [ ] **Step 2: Regressie factuur-flow**

Controleer dat de bestaande flow ongewijzigd werkt: reserveer factuurnummer → opeenvolgend; genereer factuur → PDF correct + document opgeslagen; tweede genereren zelfde nummer → 409-bevestiging.

- [ ] **Step 3: Desktop + mobiel screenshot (memory: mobile-first + audit_before_deploy)**

```bash
node -e '
import("puppeteer").then(async ({default:pp})=>{
  const b=await pp.launch({headless:"new"});
  for (const [w,tag] of [[1280,"desktop"],[390,"mobile"]]) {
    const p=await b.newPage(); await p.setViewport({width:w,height:900,deviceScaleFactor:1});
    await p.goto("http://localhost:3000/admin/factuur/index.html",{waitUntil:"load"});
    await new Promise(r=>setTimeout(r,400)); await p.click("#toggle-offerte"); await new Promise(r=>setTimeout(r,200));
    await p.screenshot({path:"temporary screenshots/offerte-"+tag+".png",fullPage:true}); await p.close();
  }
  await b.close(); console.log("done");
});'
```
Lees beide PNG's; controleer: toggle zichtbaar, geen overflow op 390px, omzet-knop + ophaal-veld tonen in offerte-modus.

- [ ] **Step 4: Div-balans + concept-veiligheid**

```bash
node -e "const fs=require('fs');const h=fs.readFileSync('admin/factuur/index.html','utf8');const o=(h.match(/<div/g)||[]).length,c=(h.match(/<\/div>/g)||[]).length;console.log('divs',o,c,o===c?'OK':'MISMATCH')"
```
Expected: `OK`.

- [ ] **Step 5: Ruim temp screenshots op, commit eventuele fixes, push alles**

```bash
rm -f "temporary screenshots/offerte-desktop.png" "temporary screenshots/offerte-mobile.png"
git push origin main
```

- [ ] **Step 6: Update projectstatus-geheugen**

Voeg een sessie-entry toe aan `project_status.md`: offerte-modus af, welke bestanden, KV-keys (`offerteteller-<jaar>`, `doc-<nummer>`), 409-onveranderlijkheid facturen, omzet-flow, overzichtspagina nog open.

---

## Self-review (uitgevoerd)

- **Spec-dekking:** type-param (T1), document-endpoint met 409/GET/PATCH (T2), toggle (T3), labels (T4), preview+PDF+voettekst (T5), opslaan (T6), ophalen (T7), omzetten+omgezet_naar (T8), tests (T9). Alle spec-secties gedekt.
- **Placeholders:** geen TBD/TODO in code-stappen; elke stap heeft concrete code of commando.
- **Type-consistentie:** `isOfferte()`, `pasModusToe()`, `overDertigDagen()`, `huidigDocument()`, `bewaarDocument()`, `haalOfferteOp()`, `zetOmNaarFactuur()` consistent gebruikt. KV-key `doc-<nummer>` en tellers `offerteteller-<jaar>` overal gelijk. `state.docType` overal identiek.
- **Aanname wachtwoord:** T1 Step 2 verwijst naar lokaal test-wachtwoord uit `.dev.vars`; als afwezig → genereren. Reëel, niet-blokkerend.
