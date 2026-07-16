# Overzichtspagina `/admin/overzicht` — Ontwerp

Datum: 2026-07-16
Status: goedgekeurd (brainstorm)

## Doel

Een admin-overzichtspagina die alle opgeslagen facturen en offertes toont (gescheiden
filterbaar), met per document nummer/type, klant, datum, bedrag en status. Een document
is klikbaar om te heropenen in de factuurgenerator: offertes volledig bewerkbaar,
facturen alleen-lezen (de bestaande 409-onveranderlijkheid blijft de rem).

Bouwt voort op de offerte-modus (documenten liggen in KV onder `doc-<nummer>` met
type-veld + `omgezet_naar`-status).

## Scope

- WEL: lijst-endpoint, overzichtspagina met filter/tabel, heropenen via `?doc=`-param,
  navigatie tussen /admin/factuur en /admin/overzicht, klikbare omzet-status.
- NIET: verwijderen/bewerken van documenten buiten de generator, exporteren, zoeken/
  paginering (YAGNI op deze schaal).

## Backend

### `functions/api/documenten.js` — nieuw (meervoud, naast `document.js`)

Zelfde sessie-gate (`parseCookie` + `verifySession`) en KV-binding `FACTUREN` als de
andere endpoints. Volgt het patroon van `klanten.js` (list + get-loop).

**GET** `/api/documenten` → `{ documenten: [ <volledig doc>, ... ] }`
- `env.FACTUREN.list({ prefix: "doc-" })`, dan per key een `get()`.
- **N+1 KV-reads (list + get per doc) is een bewuste keuze**: op ZZP-schaal (tientallen
  documenten) prima, geen batching/caching nodig. Code-comment toevoegen dat dit bewust is.
- Geeft de VOLLEDIGE documenten terug (nummer, type, datum, vervaldatum, referentie,
  klant, regels, korting, btwTarief, btwVerlegd, omgezet_naar, opgeslagen). Reden: het
  bedrag wordt client-side herberekend met de bestaande `bereken()`-logica; makkelijker
  dan die in de Worker te dupliceren, en de payload is klein.
- Corrupte JSON per doc → sla dat item over (try/catch), lijst niet laten crashen.
- **Sortering: primair op documentdatum (`datum`) aflopend (nieuwste eerst), met
  `opgeslagen` als tiebreaker bij gelijke datum.** Niet andersom.

## Frontend — `admin/overzicht/index.html`

Zelfde huisstijl als `admin/factuur/index.html` (donker, `--orange` #ff8c00,
Bebas Neue + Inter, `noindex,nofollow`).

### Layout

- Topbar: logo "MVDBmedia · Overzicht" + knop "Nieuw document" (→ `/admin/factuur`) +
  "Uitloggen" (POST /api/logout → /admin/login/).
- Filter-tabs: "Alle / Facturen / Offertes" (client-side filter op `type`).
- Tabel, kolommen:
  1. **Nummer + type** — nummer met een type-badge (Factuur/Offerte).
  2. **Klant** — `klant.bedrijf` (of contact/email als bedrijf leeg).
  3. **Datum** — `datum`.
  4. **Bedrag** — totaal incl. btw, client-side via `bereken()` uit regels/korting/btw.
  5. **Status** — factuur → "Factuur"; offerte open → "Open"; omgezette offerte →
     "→ <factuurnummer>" **klikbaar** naar dat factuurdocument (heropent de factuur).
- Rij (behalve de status-link) klikbaar → heropenen van dat document.
- Leeg-state: "Nog geen documenten." Bij fetch-fout: nette melding, geen kapotte tabel.

### `bereken()` in deze pagina

Compacte kopie van de berekening uit `admin/factuur/index.html` (subtotaal → korting →
btw → totaal). **Beide `bereken()`-comments krijgen een wederzijdse verwijzing:**
`// synced met bereken() in admin/factuur/index.html — bij wijziging beide bijwerken`
(en omgekeerd). Bewuste duplicatie: de twee pagina's delen nu geen JS-module.

### Status-kolom edge case

`omgezet_naar` kan naar een niet-bestaand/verwijderd factuurdocument wijzen. De
status-link mag dan NIET crashen: toon "→ <nummer>" als link; als heropenen daarvan
een 404 geeft, valt dat onder de generieke `?doc=`-foutafhandeling (zie hieronder). De
overzichtspagina hoeft het bestaan niet vooraf te verifiëren (extra KV-reads vermijden).

## Heropenen-flow

### Overzicht → generator

Klik op rij / status-link → navigeer naar `/admin/factuur?doc=<nummer>`.

### Factuurgenerator uitbreiden

Bij load: lees `?doc=`-param. Als aanwezig → `laadDocument(nummer)`.

Refactor: de bestaande `haalOfferteOp(nummer)` (alleen offertes) wordt veralgemeniseerd
naar **`laadDocument(nummer, { viaKnop })`** die BEIDE types aankan:
- `GET /api/document?nummer=`.
- **Ongeldig/leeg nummer of 404** → nette melding. Bij laden via `?doc=` (deeplink):
  toon een korte melding en blijf op de generator met een schone lege state (of redirect
  naar `/admin/overzicht`). Geen kapotte/half-gevulde state.
- **State-reset vóór vullen**: bij het openen van een ander document moet de state
  VOLLEDIG resetten — geen regels/klant/korting van een vorig document dat achterblijft.
  Reset regels naar [], klant/korting/factuur naar defaults, dan vullen uit het doc.
- Zet `state.docType` op het type van het doc, vul alle velden, sync DOM, `pasModusToe()`,
  `bewaarConcept()`.
- De bestaande "Offerte ophalen"-knop hergebruikt `laadDocument(..., {viaKnop:true})`.
  Besluit (eenduidig): de knop laadt ELK document dat bij het ingevoerde nummer hoort —
  offerte of factuur — via dezelfde `laadDocument`. Geen aparte offerte-only-check meer.
  Een factuur die zo geladen wordt valt onder dezelfde read-only-rem (409 bij hergenereren).
  De knop blijft in de UI alleen zichtbaar in offerte-modus (bestaand gedrag), maar de
  onderliggende functie is type-agnostisch.

### Factuur alleen-lezen

Geen aparte lock-UI. Een geladen factuur is bewerkbaar in de velden, maar opnieuw
genereren botst op de 409-bescherming → "factuur bestaat al, overschrijven?"-confirm.
Dat is het overeengekomen "alleen-lezen"-gedrag (rem, geen harde blokkade).

### Al omgezette offerte heropenen

Een offerte met `omgezet_naar` gezet kan heropend worden (bewerkbaar). Bij nogmaals
"Zet om naar factuur":
- De flow reserveert een NIEUW factuurnummer en PATCH't de offerte's `omgezet_naar` naar
  het nieuwe nummer. Dat overschrijft de oude koppeling. **Gewenst gedrag:** een offerte
  kan opnieuw omgezet worden (bijv. na correctie), en wijst dan naar de nieuwste factuur.
- **Waarborg tegen dataverlies:** de server behoudt al `omgezet_naar` bij overschrijven
  van de offerte via POST (bestaande fix). De PATCH bij heromzetten actualiseert de
  koppeling bewust. Geen crash, gedefinieerd gedrag.
- Overweeg (klein): in `zetOmNaarFactuur` een bevestiging tonen als de offerte al een
  `omgezet_naar` heeft ("Deze offerte is al omgezet naar <X>. Opnieuw omzetten?"). Dit
  vereist dat de generator de `omgezet_naar` van de geladen offerte kent → `laadDocument`
  bewaart die in state (`state.omgezetNaar`). Meenemen: JA, kleine UX-waarborg.

## Navigatie

- `admin/factuur/index.html` topbar: link "Overzicht" (→ `/admin/overzicht/`).
- `admin/overzicht/index.html` topbar: knop "Nieuw document" (→ `/admin/factuur`).
- Middleware `functions/admin/_middleware.js` beschermt `/admin/overzicht/*` automatisch
  (dekt alle /admin/* behalve login). Geen wijziging nodig.
- `robots.txt` blokkeert al `/admin/`. `_headers` zet al X-Robots-Tag noindex op /admin/*.

## Testplan (wrangler pages dev + zelf-gesignde cookie + puppeteer/curl)

1. `documenten.js`: list geeft alle `doc-*`; sortering datum-desc met opgeslagen-tiebreak;
   corrupte doc-JSON overgeslagen; sessie-gate 401 zonder cookie.
2. UI: filter Alle/Facturen/Offertes; bedrag-kolom == generator-bedrag voor hetzelfde doc;
   status open/omgezet/factuur; leeg-state; fetch-fout-melding.
3. Heropenen offerte `?doc=OFF-...`: state gereset + gevuld, bewerkbaar.
4. Heropenen factuur `?doc=2026-...`: gevuld; opnieuw genereren → 409-confirm.
5. Ongeldig `?doc=BESTAATNIET`: nette melding, schone state (geen crash/half-vuld).
6. State-reset: laad doc A (met regels), dan doc B → geen regels van A over.
7. `omgezet_naar` → niet-bestaand doc: status-link toont, klik → 404-melding, geen crash.
8. Al omgezette offerte heropenen + opnieuw omzetten: bevestiging getoond, koppeling
   actualiseert naar nieuw factuurnummer, geen crash.
9. Regressie: bestaande "Offerte ophalen"-knop + factuur/offerte-flow ongewijzigd.
10. Screenshots desktop + mobiel (390px), div-balans, geen console-errors.

## Bestandsoverzicht

- Nieuw: `functions/api/documenten.js` (lijst-endpoint).
- Nieuw: `admin/overzicht/index.html` (overzichtspagina).
- Wijzigen: `admin/factuur/index.html` (`?doc=`-param, `laadDocument` refactor,
  `state.omgezetNaar`, heromzet-bevestiging, "Overzicht"-link in topbar).
- Geen wijziging: middleware, robots.txt, _headers (dekken al).

## Niet in scope

- Verwijderen/archiveren van documenten via het overzicht.
- Zoeken, paginering, exporteren, datumrange-filter.
- Bedrag server-side berekenen (bewust client-side gehouden).
