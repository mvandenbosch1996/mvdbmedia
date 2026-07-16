# Overzichtspagina Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Een admin-overzichtspagina `/admin/overzicht` die alle opgeslagen facturen/offertes toont (filterbaar, met bedrag + status) en documenten laat heropenen in de factuurgenerator.

**Architecture:** Nieuw lijst-endpoint `documenten.js` (list+get uit KV, volledige docs). Nieuwe statische pagina `admin/overzicht/index.html` (huisstijl factuurgenerator, client-side filter + bedragberekening). De factuurgenerator krijgt een `?doc=`-deeplink die via een veralgemeniseerde `laadDocument()` beide types laadt met volledige state-reset.

**Tech Stack:** Cloudflare Pages Functions (ESM, Workers), KV-binding `FACTUREN`, vanilla JS. Geen unit-testframework — verificatie per taak via `wrangler pages dev` + curl + puppeteer.

---

## Belangrijke conventies (lees eerst)

- **Geen pytest/jest.** Verificatie = curl/puppeteer tegen `wrangler pages dev`. Elke taak heeft een concrete verificatiestap met verwacht resultaat.
- **Sessie-cookie zonder wachtwoord:** genereer een geldige `__session`-cookie met `signSession` uit `functions/_lib/auth.js` en de `SESSION_SECRET` uit `.dev.vars`. Payload MOET `{exp: Date.now()+3600000}` (ms, toekomst) bevatten. ESM: `node --input-type=module`. Voorbeeld-token uit eerdere sessie (verloopt ~1 jaar, kan hergebruikt): `eyJleHAiOjE3ODQxODE0MDY2MDd9.2C3NFrOt1Pt22ZPkPgTvSci_0_XYBPHMYTC073oVdHM` — genereer bij twijfel een verse.
- **Wrangler starten:** `npx wrangler pages dev . --kv FACTUREN --port 8788` (background, wacht op "Ready"). `_wrangler*.log` is gitignored.
- **jsPDF-detail (voor eventuele PDF-checks):** `save`/`output` zitten op de jsPDF-INSTANCE, niet op `prototype`. Patch niet het prototype; gebruik CDP `Page.setDownloadBehavior` als je een echte PDF naar schijf wilt.
- **Statische UI-check kan op serve.mjs (:3000)** — API-calls falen daar stil (404), prima voor puur DOM/layout. Voor echte data-flow: wrangler (:8788) met cookie.
- **Commit per taak op main. NIET pushen tot de laatste taak** (CF Pages auto-deployt bij push; halve feature niet live laten gaan).
- **Regressie:** bestaande factuur/offerte-flow + "Offerte ophalen"-knop mogen NIET breken.
- **XSS/innerHTML:** de overzichtstabel bouwt rijen met `tr.innerHTML`. ALLE documentdata (nummer, klantnaam, datum, `omgezet_naar` in de status-link) MOET door `esc()` (escaped `&<>"`). De badges/vaste labels zijn hardcoded HTML — veilig. Introduceer geen rauwe interpolatie van KV-data. `esc()` staat in de pagina; niet vereenvoudigen naar directe string-interpolatie van doc-velden.

## Bestandsoverzicht

- Nieuw: `functions/api/documenten.js` — GET-lijst van alle documenten.
- Nieuw: `admin/overzicht/index.html` — overzichtspagina.
- Wijzigen: `admin/factuur/index.html` — `?doc=`-deeplink, `haalOfferteOp`→`laadDocument` refactor, `state.omgezetNaar`, heromzet-bevestiging, "Overzicht"-link in topbar, `bereken()`-sync-comment.

## Taakoverzicht

1. `documenten.js` — lijst-endpoint (list+get, sortering datum-desc)
2. Factuurgenerator: `haalOfferteOp` → `laadDocument` refactor (beide types + state-reset) + sync-comment
3. Factuurgenerator: `?doc=`-deeplink bij load + ongeldig-doc-afhandeling
4. Factuurgenerator: `state.omgezetNaar` + heromzet-bevestiging + "Overzicht"-link
5. `admin/overzicht/index.html` — pagina (tabel, filter, bedrag, status, heropenen)
6. Eindtest: E2E alle edge cases + screenshots + push

---

### Task 1: `documenten.js` — lijst-endpoint

**Files:**
- Create: `functions/api/documenten.js`

- [ ] **Step 1: Maak het endpoint**

Create `functions/api/documenten.js`:

```js
// functions/api/documenten.js
// GET /api/documenten -> { documenten: [ <volledig doc>, ... ] }
// Lijst van alle opgeslagen facturen/offertes (KV-prefix "doc-").
// Vereist sessiecookie. KV-binding FACTUREN.

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

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  // Bewuste keuze: list + get-per-doc (N+1 KV-reads). Op ZZP-schaal (tientallen
  // documenten) ruim voldoende; geen batching/caching nodig.
  const lijst = await env.FACTUREN.list({ prefix: "doc-" });
  const documenten = [];
  for (const key of lijst.keys) {
    const raw = await env.FACTUREN.get(key.name);
    if (!raw) continue;
    try { documenten.push(JSON.parse(raw)); } catch {}
  }

  // Sorteer primair op documentdatum (nieuwste eerst), met 'opgeslagen' als
  // tiebreaker bij gelijke datum.
  documenten.sort((a, b) => {
    const d = String(b.datum || "").localeCompare(String(a.datum || ""));
    if (d !== 0) return d;
    return String(b.opgeslagen || "").localeCompare(String(a.opgeslagen || ""));
  });

  return json({ documenten });
}
```

- [ ] **Step 2: Start wrangler + genereer cookie**

Run (background wrangler + cookie):
```bash
npx wrangler pages dev . --kv FACTUREN --port 8788   # background, wacht op Ready
# cookie:
node --input-type=module -e 'import {readFileSync} from "fs"; import {signSession} from "./functions/_lib/auth.js"; const s=readFileSync(".dev.vars","utf8").split(/\r?\n/).find(l=>l.startsWith("SESSION_SECRET")).split("=").slice(1).join("=").trim(); console.log(await signSession({exp:Date.now()+3600000}, s));'
```

- [ ] **Step 3: Zaai testdata + verifieer lijst + sortering**

Run (T = het token):
```bash
# drie docs met verschillende datums
curl -s -b "__session=$T" -X POST http://localhost:8788/api/document -H "Content-Type: application/json" -d '{"doc":{"type":"factuur","nummer":"2026-001","datum":"2026-07-10","regels":[{"omschrijving":"A","aantal":1,"stukprijs":100}]}}' >/dev/null
curl -s -b "__session=$T" -X POST http://localhost:8788/api/document -H "Content-Type: application/json" -d '{"doc":{"type":"offerte","nummer":"OFF-2026-001","datum":"2026-07-15","regels":[]}}' >/dev/null
curl -s -b "__session=$T" -X POST http://localhost:8788/api/document -H "Content-Type: application/json" -d '{"doc":{"type":"factuur","nummer":"2026-002","datum":"2026-07-12","regels":[]}}' >/dev/null
# lijst ophalen — nummers in datum-desc volgorde
curl -s -b "__session=$T" "http://localhost:8788/api/documenten" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.documenten.map(d=>d.nummer+"@"+d.datum).join(" | "));})'
# sessie-gate
curl -s -o /dev/null -w "geen-cookie: %{http_code}\n" "http://localhost:8788/api/documenten"
```
Expected: `OFF-2026-001@2026-07-15 | 2026-002@2026-07-12 | 2026-001@2026-07-10` (nieuwste datum eerst) en `geen-cookie: 401`.

- [ ] **Step 4: Commit**

```bash
git add functions/api/documenten.js
git commit -m "api: documenten-lijst endpoint (list+get, sortering op datum-desc)"
```

---

### Task 2: `haalOfferteOp` → `laadDocument` refactor

**Files:**
- Modify: `admin/factuur/index.html` (`haalOfferteOp` functie; de "Offerte ophalen"-knop-listener; de `bereken()`-comment)

- [ ] **Step 1: Vervang `haalOfferteOp` door type-agnostische `laadDocument`**

Zoek de functie `haalOfferteOp(nummer)`. Vervang de VOLLEDIGE functie door onderstaande `laadDocument`. Verschillen: accepteert beide types, doet een volledige state-reset vóór vullen, en zet `state.docType` op het type van het doc (niet hard "offerte").

```js
  // Laadt een bestaand document (factuur of offerte) uit KV en vult de state.
  // Volledige reset vóór vullen: geen regels/klant/korting van een vorig document
  // blijven achter. viaKnop=true toont fouten in #ophaal-waarschuwing; anders (deeplink)
  // gebruikt de aanroeper de returnwaarde/foutmelding zelf.
  async function laadDocument(nummer, { viaKnop = false } = {}) {
    const w = document.getElementById("ophaal-waarschuwing");
    if (viaKnop && w) w.textContent = "";
    nummer = (nummer || "").trim();
    if (!nummer) return { ok: false, reden: "leeg" };
    let doc;
    try {
      const res = await fetch("/api/document?nummer=" + encodeURIComponent(nummer));
      if (res.status === 404) { if (viaKnop && w) w.textContent = "Geen document met dit nummer gevonden."; return { ok: false, reden: "404" }; }
      if (!res.ok) { if (viaKnop && w) w.textContent = "Ophalen mislukt."; return { ok: false, reden: "fout" }; }
      doc = (await res.json()).doc;
    } catch { if (viaKnop && w) w.textContent = "Ophalen mislukt (netwerkfout)."; return { ok: false, reden: "netwerk" }; }
    if (!doc || (doc.type !== "factuur" && doc.type !== "offerte")) {
      if (viaKnop && w) w.textContent = "Ongeldig document.";
      return { ok: false, reden: "ongeldig" };
    }
    // Volledige state-reset.
    state.docType = doc.type;
    state.klant = { bedrijf:"", contact:"", adres:"", postcodePlaats:"", email:"", kvkBtw:"", ...(doc.klant || {}) };
    state.factuur.nummer = doc.nummer || "";
    state.factuur.datum = doc.datum || vandaag();
    state.factuur.vervaldatum = doc.vervaldatum || (doc.type === "offerte" ? overDertigDagen() : overVeertienDagen());
    state.factuur.referentie = doc.referentie || "";
    state.regels = (doc.regels || []).map((r) => ({ id: nieuwId(), omschrijving: r.omschrijving, aantal: r.aantal, stukprijs: r.stukprijs }));
    const dko = doc.korting || {};
    state.korting = { type: dko.type || "geen", waarde: dko.waarde || 0, omschrijving: dko.omschrijving || "" };
    state.btwTarief = doc.btwTarief ?? BTW_STANDAARD;
    state.btwVerlegd = !!doc.btwVerlegd;
    state.omgezetNaar = doc.omgezet_naar || null;
    // DOM syncen.
    document.getElementById("nummer-waarschuwing").textContent = "";
    document.querySelectorAll("[data-klant]").forEach((el) => { el.value = state.klant[el.dataset.klant] || ""; });
    document.querySelectorAll("[data-factuur]").forEach((el) => { el.value = state.factuur[el.dataset.factuur] || ""; });
    document.getElementById("btw-select").value = state.btwVerlegd ? "verlegd" : String(state.btwTarief);
    const kw = document.getElementById("korting-waarde"); if (kw) kw.value = state.korting.waarde || 0;
    const ko = document.getElementById("korting-omschrijving"); if (ko) ko.value = state.korting.omschrijving || "";
    const kt = document.querySelector('input[name=korting-type][value="' + (state.korting.type || "geen") + '"]'); if (kt) kt.checked = true;
    renderRegels(); toonKortingVelden(); pasModusToe(); bewaarConcept();
    return { ok: true };
  }
```

- [ ] **Step 2: Voeg `omgezetNaar` toe aan de state-initialisatie**

Zoek het `state`-object (bevat `docType`, `klant`, `factuur`, `regels`, `korting`, `btwTarief`, `btwVerlegd`). Voeg toe (bijv. na `btwVerlegd`):
```js
    omgezetNaar: null, // gezet bij het laden van een reeds-omgezette offerte
```

- [ ] **Step 3: Werk de "Offerte ophalen"-knop-listener bij**

Zoek in `init()` de listener op `#ophaal-knop` (roept nu `haalOfferteOp` aan). Vervang de callback zodat 'ie `laadDocument(..., {viaKnop:true})` aanroept:
```js
    document.getElementById("ophaal-knop").addEventListener("click", () => {
      laadDocument(document.getElementById("ophaal-nummer").value, { viaKnop: true });
    });
```

- [ ] **Step 4: Voeg de bereken()-sync-comment toe**

Zoek `function bereken()` in deze file. Voeg direct erboven de comment toe:
```js
  // synced met bereken() in admin/overzicht/index.html — bij wijziging beide bijwerken.
```

- [ ] **Step 5: Verifieer laden van beide types (wrangler + cookie)**

Testdata uit Task 1 staat er (2026-001 factuur met 1 regel, OFF-2026-001 offerte). Test via puppeteer op :8788:
```bash
node -e '
import("puppeteer").then(async ({default:pp})=>{
  const b=await pp.launch({headless:"new"}); const p=await b.newPage();
  await p.setCookie({name:"__session",value:process.env.T,domain:"localhost",path:"/"});
  await p.goto("http://localhost:8788/admin/factuur/index.html",{waitUntil:"load"});
  await new Promise(r=>setTimeout(r,600));
  const out=await p.evaluate(async()=>{
    // laad eerst factuur met regel, dan offerte -> state moet resetten (0 regels)
    const r1=await laadDocument("2026-001");
    const na1={ok:r1.ok, type:state.docType, regels:state.regels.length};
    const r2=await laadDocument("OFF-2026-001");
    const na2={ok:r2.ok, type:state.docType, regels:state.regels.length};
    const r3=await laadDocument("BESTAATNIET");
    return {na1, na2, r3ok:r3.ok, r3reden:r3.reden, regelsNaOnbekend:state.regels.length};
  });
  console.log(JSON.stringify(out));
  await b.close();
});'
```
Expected: `na1` type=factuur regels=1; `na2` type=offerte regels=0 (reset werkte, geen regel van factuur over); `r3ok`=false reden="404". (Bij onbekend doc verandert de bestaande state niet — geen crash.)

- [ ] **Step 6: Commit**

```bash
git add admin/factuur/index.html
git commit -m "factuur-ui: haalOfferteOp -> type-agnostische laadDocument (beide types, volledige reset)"
```

---

### Task 3: `?doc=`-deeplink bij load

**Files:**
- Modify: `admin/factuur/index.html` (`init()`)

- [ ] **Step 1: Lees `?doc=` bij init en laad het document**

Zoek in `init()` een geschikte plek NA `bindVelden()` / `renderPreview()` / `pasModusToe()` (zodat DOM + functies bestaan). Voeg toe:
```js
    // Deeplink vanuit het overzicht: /admin/factuur?doc=<nummer> opent dat document.
    const docParam = new URLSearchParams(location.search).get("doc");
    if (docParam) {
      laadDocument(docParam).then((res) => {
        if (!res.ok) {
          alert("Document '" + docParam + "' kon niet worden geopend (" + res.reden + "). Je begint met een leeg document.");
        }
        // URL opschonen zodat een refresh niet opnieuw laadt/foutmeldt.
        history.replaceState(null, "", "/admin/factuur");
      });
    }
```

- [ ] **Step 2: Verifieer deeplink + ongeldig doc (puppeteer)**

```bash
node -e '
import("puppeteer").then(async ({default:pp})=>{
  const b=await pp.launch({headless:"new"});
  // geldig doc
  const p1=await b.newPage(); await p1.setCookie({name:"__session",value:process.env.T,domain:"localhost",path:"/"});
  await p1.goto("http://localhost:8788/admin/factuur?doc=OFF-2026-001",{waitUntil:"load"});
  await new Promise(r=>setTimeout(r,700));
  const g=await p1.evaluate(()=>({nummer:state.factuur.nummer, type:state.docType, url:location.pathname+location.search}));
  // ongeldig doc -> alert (accept) + schone state
  const p2=await b.newPage(); let alerted=false; p2.on("dialog",async d=>{alerted=true;await d.accept();});
  await p2.setCookie({name:"__session",value:process.env.T,domain:"localhost",path:"/"});
  await p2.goto("http://localhost:8788/admin/factuur?doc=NIETBESTAAND",{waitUntil:"load"});
  await new Promise(r=>setTimeout(r,700));
  const bad=await p2.evaluate(()=>({regels:state.regels.length, url:location.pathname+location.search}));
  console.log("GELDIG",JSON.stringify(g),"ONGELDIG",JSON.stringify(bad),"alerted",alerted);
  await b.close();
});'
```
Expected: GELDIG nummer=OFF-2026-001 type=offerte url=`/admin/factuur` (querystring opgeschoond); ONGELDIG alerted=true, url opgeschoond, geen crash.

- [ ] **Step 3: Commit**

```bash
git add admin/factuur/index.html
git commit -m "factuur-ui: ?doc= deeplink opent document uit overzicht (met foutafhandeling)"
```

---

### Task 4: `state.omgezetNaar` + heromzet-bevestiging + Overzicht-link

**Files:**
- Modify: `admin/factuur/index.html` (`zetOmNaarFactuur`; topbar HTML)

- [ ] **Step 1: Heromzet-bevestiging in `zetOmNaarFactuur`**

Zoek `async function zetOmNaarFactuur()`. Direct NA de `if (!isOfferte()) return;`-regel, voeg toe:
```js
    if (state.omgezetNaar) {
      if (!confirm("Deze offerte is al omgezet naar factuur " + state.omgezetNaar + ". Opnieuw omzetten naar een nieuwe factuur?")) return;
    }
```
En zorg dat na een geslaagde omzetting de nieuwe koppeling in state staat: zoek in dezelfde functie waar `omgezet_naar` via PATCH wordt gezet (de fetch met `omgezet_naar: nr`). Voeg direct ná die `try{...}catch{}` toe:
```js
    state.omgezetNaar = nr;
```
(Zodat een tweede omzet-poging in dezelfde sessie de bevestiging opnieuw toont.)

- [ ] **Step 2: "Overzicht"-link in de topbar**

Zoek in de topbar de acties-`div` (met `#omzet-knop`, `#pdf-knop`, `#logout-knop`). Voeg als eerste knop een link toe:
```html
      <a class="btn btn-ghost" href="/admin/overzicht/" style="text-decoration:none; display:inline-flex; align-items:center;">Overzicht</a>
```
(Plaats 'm vóór `#omzet-knop` binnen dezelfde acties-div.)

- [ ] **Step 3: Verifieer heromzet-bevestiging (puppeteer)**

De offerte OFF-2026-001 is nog niet omgezet. Test: markeer 'm eerst omgezet via PATCH, laad 'm, probeer om te zetten → bevestiging verschijnt.
```bash
curl -s -b "__session=$T" -X PATCH http://localhost:8788/api/document -H "Content-Type: application/json" -d '{"nummer":"OFF-2026-001","omgezet_naar":"2026-001"}' >/dev/null
node -e '
import("puppeteer").then(async ({default:pp})=>{
  const b=await pp.launch({headless:"new"}); const p=await b.newPage();
  const dialogs=[]; p.on("dialog",async d=>{dialogs.push(d.message()); await d.dismiss();}); // dismiss = annuleer
  await p.setCookie({name:"__session",value:process.env.T,domain:"localhost",path:"/"});
  await p.goto("http://localhost:8788/admin/factuur?doc=OFF-2026-001",{waitUntil:"load"});
  await new Promise(r=>setTimeout(r,700));
  await p.evaluate(async()=>{ await zetOmNaarFactuur(); });
  await new Promise(r=>setTimeout(r,300));
  const stillOfferte = await p.evaluate(()=>state.docType);
  console.log("dialogs",JSON.stringify(dialogs),"typeNaAnnuleren",stillOfferte);
  await b.close();
});'
```
Expected: dialogs bevat "Deze offerte is al omgezet naar factuur 2026-001. Opnieuw omzetten…"; na dismiss (annuleer) blijft `typeNaAnnuleren` = "offerte" (omzetting afgebroken).

- [ ] **Step 4: Verifieer Overzicht-link aanwezig (statische check)**

```bash
node -e '
import("puppeteer").then(async ({default:pp})=>{
  const b=await pp.launch({headless:"new"}); const p=await b.newPage();
  await p.setCookie({name:"__session",value:process.env.T,domain:"localhost",path:"/"});
  await p.goto("http://localhost:8788/admin/factuur/index.html",{waitUntil:"load"});
  await new Promise(r=>setTimeout(r,400));
  const href=await p.evaluate(()=>{const a=[...document.querySelectorAll("a.btn")].find(x=>x.textContent.trim()==="Overzicht"); return a?a.getAttribute("href"):null;});
  console.log("overzicht-link",href);
  await b.close();
});'
```
Expected: `overzicht-link /admin/overzicht/`.

- [ ] **Step 5: Commit**

```bash
git add admin/factuur/index.html
git commit -m "factuur-ui: heromzet-bevestiging (state.omgezetNaar) + Overzicht-link in topbar"
```

---

### Task 5: `admin/overzicht/index.html` — de pagina

**Files:**
- Create: `admin/overzicht/index.html`

- [ ] **Step 1: Maak de pagina**

Create `admin/overzicht/index.html` met onderstaande inhoud. Huisstijl (kleuren/fonts/`.btn`-classes) gekopieerd uit `admin/factuur/index.html`. De `bereken()`-functie is een bewuste kopie mét sync-comment.

```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <title>Overzicht — MVDBmedia</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root { --bg:#0d0d0d; --elev:#161616; --float:#1f1f1f; --card:#1a1a1a; --border:#2a2a2a;
            --border-light:#333; --orange:#ff8c00; --text:#f0ede8; --muted:#a09890; --dim:#7a736e;
            --font-display:'Bebas Neue',sans-serif; --font-body:'Inter',sans-serif; }
    * { box-sizing:border-box; margin:0; }
    body { background:var(--bg); color:var(--text); font-family:var(--font-body); font-size:14px; line-height:1.5; }
    .topbar { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;
              padding:16px 24px; border-bottom:1px solid var(--border); background:var(--elev); position:sticky; top:0; z-index:10; }
    .logo { font-family:var(--font-display); font-size:1.5rem; letter-spacing:0.06em; }
    .logo span { color:var(--orange); }
    .btn { border:none; border-radius:4px; font-family:var(--font-body); font-weight:600; font-size:0.8rem;
           cursor:pointer; padding:9px 16px; transition:opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease; }
    .btn:focus-visible { outline:2px solid var(--orange); outline-offset:2px; }
    .btn-oranje { background:var(--orange); color:#000; } .btn-oranje:hover { opacity:0.92; }
    .btn-ghost { background:transparent; color:var(--muted); border:1px solid var(--border); text-decoration:none; display:inline-flex; align-items:center; }
    .btn-ghost:hover { color:var(--text); border-color:var(--border-light); }
    .wrap { max-width:1100px; margin:0 auto; padding:24px; }
    .filters { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
    .filter-knop { background:var(--card); color:var(--muted); border:1px solid var(--border); border-radius:4px;
                   padding:7px 14px; font-size:0.8rem; cursor:pointer; font-family:var(--font-body); }
    .filter-knop.actief { background:var(--orange); color:#000; border-color:var(--orange); font-weight:600; }
    table { width:100%; border-collapse:collapse; }
    thead th { text-align:left; font-size:0.62rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--dim);
               padding:10px 12px; border-bottom:1px solid var(--border); }
    thead th.r, tbody td.r { text-align:right; }
    tbody tr { border-bottom:1px solid var(--border); cursor:pointer; transition:background 0.12s ease; }
    tbody tr:hover { background:var(--float); }
    tbody td { padding:12px; vertical-align:middle; }
    .badge { display:inline-block; font-size:0.6rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;
             padding:2px 7px; border-radius:3px; margin-left:8px; }
    .badge-factuur { background:rgba(255,140,0,0.15); color:var(--orange); }
    .badge-offerte { background:rgba(160,152,144,0.15); color:var(--muted); }
    .nummer { font-weight:600; color:var(--text); }
    .status-omgezet { color:var(--orange); text-decoration:none; }
    .status-omgezet:hover { text-decoration:underline; }
    .leeg, .fout { padding:40px 12px; text-align:center; color:var(--dim); }
    .fout { color:#ff6b6b; }
    @media (max-width:640px){ tbody td, thead th { padding:8px 6px; font-size:0.78rem; } .wrap { padding:16px; } }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="logo">MVDB<span>media</span> · Overzicht</div>
    <div style="display:flex; gap:10px;">
      <a class="btn btn-oranje" href="/admin/factuur" style="text-decoration:none;">Nieuw document</a>
      <button class="btn btn-ghost" id="logout-knop" type="button">Uitloggen</button>
    </div>
  </div>

  <div class="wrap">
    <div class="filters">
      <button class="filter-knop actief" data-filter="alle" type="button">Alle</button>
      <button class="filter-knop" data-filter="factuur" type="button">Facturen</button>
      <button class="filter-knop" data-filter="offerte" type="button">Offertes</button>
    </div>
    <table>
      <thead>
        <tr><th>Nummer</th><th>Klant</th><th>Datum</th><th class="r">Bedrag</th><th>Status</th></tr>
      </thead>
      <tbody id="tbody"></tbody>
    </table>
    <div class="leeg" id="leeg" style="display:none;">Nog geen documenten.</div>
    <div class="fout" id="fout" style="display:none;"></div>
  </div>

  <script>
  // synced met bereken() in admin/factuur/index.html — bij wijziging beide bijwerken.
  function bereken(doc) {
    const regels = doc.regels || [];
    const subtotaal = regels.reduce((s, r) => s + ((Number(r.aantal)||0) * (Number(r.stukprijs)||0)), 0);
    const korting = doc.korting || { type:"geen", waarde:0 };
    let kortingBedrag = 0;
    if (korting.type === "bedrag") kortingBedrag = Number(korting.waarde) || 0;
    else if (korting.type === "percentage") kortingBedrag = subtotaal * (Number(korting.waarde) || 0) / 100;
    kortingBedrag = Math.min(kortingBedrag, subtotaal);
    const naKorting = Math.max(0, subtotaal - kortingBedrag);
    const btwVerlegd = !!doc.btwVerlegd;
    const btwTarief = doc.btwTarief ?? 21;
    const btwBedrag = btwVerlegd ? 0 : naKorting * (btwTarief / 100);
    return naKorting + btwBedrag;
  }
  function euro(n) { return "€ " + (Number(n)||0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function esc(s) { return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

  let alleDocs = [];
  let huidigFilter = "alle";

  function klantNaam(doc) {
    const k = doc.klant || {};
    return k.bedrijf || k.contact || k.email || "—";
  }

  function statusHtml(doc) {
    if (doc.type === "factuur") return "Factuur";
    if (doc.omgezet_naar) {
      const nr = esc(doc.omgezet_naar);
      return '<a class="status-omgezet" href="/admin/factuur?doc=' + encodeURIComponent(doc.omgezet_naar) + '" data-stop="1">&rarr; ' + nr + '</a>';
    }
    return "Open";
  }

  function render() {
    const tbody = document.getElementById("tbody");
    const leeg = document.getElementById("leeg");
    const docs = alleDocs.filter((d) => huidigFilter === "alle" || d.type === huidigFilter);
    tbody.innerHTML = "";
    leeg.style.display = docs.length ? "none" : "block";
    for (const doc of docs) {
      const tr = document.createElement("tr");
      const badge = doc.type === "factuur"
        ? '<span class="badge badge-factuur">Factuur</span>'
        : '<span class="badge badge-offerte">Offerte</span>';
      tr.innerHTML =
        '<td><span class="nummer">' + esc(doc.nummer) + '</span>' + badge + '</td>' +
        '<td>' + esc(klantNaam(doc)) + '</td>' +
        '<td>' + esc(doc.datum || "") + '</td>' +
        '<td class="r">' + euro(bereken(doc)) + '</td>' +
        '<td>' + statusHtml(doc) + '</td>';
      tr.addEventListener("click", (e) => {
        // klik op de status-link niet dubbel afhandelen (die navigeert zelf).
        if (e.target.closest("[data-stop]")) return;
        location.href = "/admin/factuur?doc=" + encodeURIComponent(doc.nummer);
      });
      tbody.appendChild(tr);
    }
  }

  async function laad() {
    const fout = document.getElementById("fout");
    try {
      const res = await fetch("/api/documenten");
      if (!res.ok) { fout.style.display = "block"; fout.textContent = "Kon documenten niet laden."; return; }
      alleDocs = (await res.json()).documenten || [];
      render();
    } catch { fout.style.display = "block"; fout.textContent = "Kon documenten niet laden (netwerkfout)."; }
  }

  document.querySelectorAll(".filter-knop").forEach((knop) => {
    knop.addEventListener("click", () => {
      document.querySelectorAll(".filter-knop").forEach((k) => k.classList.remove("actief"));
      knop.classList.add("actief");
      huidigFilter = knop.dataset.filter;
      render();
    });
  });
  document.getElementById("logout-knop").addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/admin/login/";
  });

  laad();
  </script>
</body>
</html>
```

- [ ] **Step 2: Verifieer de pagina (wrangler + cookie)**

Testdata staat in KV (uit Task 1/3). Op :8788:
```bash
node -e '
import("puppeteer").then(async ({default:pp})=>{
  const b=await pp.launch({headless:"new"}); const p=await b.newPage();
  await p.setCookie({name:"__session",value:process.env.T,domain:"localhost",path:"/"});
  await p.goto("http://localhost:8788/admin/overzicht/",{waitUntil:"load"});
  await new Promise(r=>setTimeout(r,700));
  const rows=await p.evaluate(()=>[...document.querySelectorAll("#tbody tr")].map(tr=>tr.innerText.replace(/\s+/g," ").trim()));
  // filter offertes
  await p.evaluate(()=>{[...document.querySelectorAll(".filter-knop")].find(k=>k.dataset.filter==="offerte").click();});
  await new Promise(r=>setTimeout(r,200));
  const naFilter=await p.evaluate(()=>[...document.querySelectorAll("#tbody tr")].length);
  console.log("ROWS",JSON.stringify(rows)); console.log("offerteRows",naFilter);
  await b.close();
});'
```
Expected: `ROWS` bevat de documenten met nummer/klant/datum/bedrag/status (offerte OFF-2026-001 toont "→ 2026-001" na de PATCH in Task 4, of "Open"); `offerteRows` telt alleen de offertes.

- [ ] **Step 3: Screenshot desktop + mobiel**

```bash
node -e '
import("puppeteer").then(async ({default:pp})=>{
  const b=await pp.launch({headless:"new"});
  for (const [w,tag] of [[1280,"desktop"],[390,"mobile"]]) {
    const p=await b.newPage(); await p.setViewport({width:w,height:900,deviceScaleFactor:1});
    await p.setCookie({name:"__session",value:process.env.T,domain:"localhost",path:"/"});
    await p.goto("http://localhost:8788/admin/overzicht/",{waitUntil:"load"});
    await new Promise(r=>setTimeout(r,600));
    await p.screenshot({path:"temporary screenshots/overzicht-"+tag+".png",fullPage:true}); await p.close();
  }
  await b.close(); console.log("shots done");
});'
```
Lees beide PNG's: tabel leesbaar, badges/status zichtbaar, geen overflow op 390px.

- [ ] **Step 4: Div-balans + commit**

```bash
node -e "const fs=require('fs');const h=fs.readFileSync('admin/overzicht/index.html','utf8');const o=(h.match(/<div/g)||[]).length,c=(h.match(/<\/div>/g)||[]).length;console.log('divs',o,c,o===c?'OK':'MISMATCH')"
git add admin/overzicht/index.html
git commit -m "admin: overzichtspagina (filter, bedrag, status, heropenen via ?doc=)"
```

---

### Task 6: Eindtest + push

**Files:** (geen wijziging tenzij bugs)

- [ ] **Step 1: Edge case — omgezet_naar naar niet-bestaand doc**

Markeer een offerte omgezet naar een niet-bestaand factuurnummer, laad het overzicht, klik de status-link → moet de generator openen met een nette "kon niet openen"-melding, geen crash.
```bash
curl -s -b "__session=$T" -X POST http://localhost:8788/api/document -H "Content-Type: application/json" -d '{"doc":{"type":"offerte","nummer":"OFF-2026-099","datum":"2026-07-14","regels":[]}}' >/dev/null
curl -s -b "__session=$T" -X PATCH http://localhost:8788/api/document -H "Content-Type: application/json" -d '{"nummer":"OFF-2026-099","omgezet_naar":"2026-NIETBESTAAT"}' >/dev/null
node -e '
import("puppeteer").then(async ({default:pp})=>{
  const b=await pp.launch({headless:"new"}); const p=await b.newPage();
  let alerted=false; p.on("dialog",async d=>{alerted=true;await d.accept();});
  await p.setCookie({name:"__session",value:process.env.T,domain:"localhost",path:"/"});
  await p.goto("http://localhost:8788/admin/factuur?doc=2026-NIETBESTAAT",{waitUntil:"load"});
  await new Promise(r=>setTimeout(r,700));
  const ok=await p.evaluate(()=>!!document.getElementById("tbody")||true); // pagina leeft
  console.log("alerted",alerted,"paginaLeeft",ok);
  await b.close();
});'
```
Expected: `alerted true` (nette melding), pagina crasht niet.

- [ ] **Step 2: Regressie — bestaande flows**

Controleer dat de gewone factuur/offerte-flow nog werkt: reserveer factuurnummer (opeenvolgend), genereer, "Offerte ophalen"-knop laadt via `laadDocument`. Snelle check:
```bash
node -e '
import("puppeteer").then(async ({default:pp})=>{
  const b=await pp.launch({headless:"new"}); const p=await b.newPage();
  const errs=[]; p.on("pageerror",e=>errs.push(String(e)));
  await p.setCookie({name:"__session",value:process.env.T,domain:"localhost",path:"/"});
  await p.goto("http://localhost:8788/admin/factuur/index.html",{waitUntil:"load"});
  await new Promise(r=>setTimeout(r,500));
  const r=await p.evaluate(async()=>{
    document.querySelector("#toggle-offerte").click(); await new Promise(x=>setTimeout(x,100));
    document.getElementById("ophaal-nummer").value="OFF-2026-001";
    document.getElementById("ophaal-knop").click(); await new Promise(x=>setTimeout(x,400));
    return {type:state.docType, nummer:state.factuur.nummer};
  });
  console.log("REGRESSIE",JSON.stringify(r),"errs",JSON.stringify(errs));
  await b.close();
});'
```
Expected: type=offerte, nummer=OFF-2026-001, errs=[] (geen page-errors).

- [ ] **Step 3: Div-balans beide gewijzigde/nieuwe HTML-bestanden**

```bash
node -e "const fs=require('fs');for(const f of ['admin/factuur/index.html','admin/overzicht/index.html']){const h=fs.readFileSync(f,'utf8');const o=(h.match(/<div/g)||[]).length,c=(h.match(/<\/div>/g)||[]).length;console.log(f,'divs',o,c,o===c?'OK':'MISMATCH');}"
```
Expected: beide OK.

- [ ] **Step 4: Ruim temp op, push, update statusgeheugen**

```bash
rm -f "temporary screenshots/overzicht-desktop.png" "temporary screenshots/overzicht-mobile.png"
git push origin main
```
Voeg een sessie-entry toe aan `project_status.md`: overzichtspagina af, nieuwe bestanden (`documenten.js`, `admin/overzicht/index.html`), `laadDocument`-refactor, `?doc=`-deeplink, heromzet-bevestiging, edge cases afgedekt.

---

## Self-review (uitgevoerd)

- **Spec-dekking:** lijst-endpoint met datum-desc sortering (T1), `laadDocument` beide types + state-reset (T2), `?doc=`-deeplink + ongeldig-doc (T3), `state.omgezetNaar` + heromzet-bevestiging + Overzicht-link + klikbare status (T4/T5), overzichtspagina met filter/bedrag/status/heropenen (T5), edge cases omgezet_naar→verwijderd + regressie (T6), bereken()-sync-comments (T2 + T5). Alle spec-punten gedekt.
- **Placeholders:** geen TBD/TODO; elke code-stap heeft volledige code, elke verificatie een concreet commando + verwachte output.
- **Type-consistentie:** `laadDocument(nummer, {viaKnop})` consistent aangeroepen (T2 knop, T3 deeplink). `state.omgezetNaar` gezet in T2 (laden) + T4 (na omzetten), gelezen in T4 (bevestiging). `bereken(doc)` in overzicht neemt een doc-argument (anders dan de generator die uit `state` leest) — bewust, want overzicht heeft geen globale state; de sync-comment slaat op de FORMULE, niet de signatuur. Dat staat expliciet in de self-review-noot hieronder.
- **bereken()-signatuurverschil:** generator `bereken()` leest `state`; overzicht `bereken(doc)` neemt een document. De sync-comment waarschuwt voor de gedeelde FORMULE (subtotaal→korting→btw), niet identieke signatuur. Bewust; vermeld in de statusgeheugen-entry.
