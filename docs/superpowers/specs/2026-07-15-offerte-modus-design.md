# Offerte-modus voor /admin/factuur — Ontwerp

Datum: 2026-07-15
Status: goedgekeurd (brainstorm)

## Doel

De bestaande factuurgenerator (`/admin/factuur`) uitbreiden met een offerte-modus.
Eén pagina, één codebase, PDF-opzet en huisstijl identiek. Facturen en offertes
krijgen gescheiden nummerreeksen en worden (voorbereidend) met een type-veld in KV
opgeslagen, zodat een latere overzichtspagina ze kan onderscheiden.

## Scope (optie 3)

- WEL: toggle factuur/offerte, aparte nummerreeks, geldig-tot i.p.v. betaaltermijn,
  offerte-voettekst, omzetten naar factuur, documenten met type-veld opslaan in KV,
  offerte ophalen via nummer, offerte-status bij omzetten.
- NIET (nu): overzichtspagina. Wordt later gebouwd; de opslag is er alvast klaar voor.

## Backend

### `functions/api/factuurnummer.js` — uitbreiden

- Nieuwe optionele param `type` (`"factuur"` | `"offerte"`), default `"factuur"`.
  - GET: leest querystring `?type=offerte` of body-loos → default factuur.
    (Implementatie: lees uit URL-searchparam, want GET.)
- Aparte teller-keys:
  - factuur: `factuurteller-<jaar>` (ongewijzigd) → nummer `JJJJ-NNN`
  - offerte: `offerteteller-<jaar>` → nummer `OFF-JJJJ-NNN`
- `uitgegeven-<nummer>` marker blijft (nummer bevat prefix → geen botsing tussen reeksen).
- Factuurnummers blijven volledig ongemoeid en opeenvolgend.
- POST (bestaat-check) blijft werken op volledig nummer incl. prefix.

### `functions/api/document.js` — nieuw

Zelfde sessie-gate (`parseCookie` + `verifySession`) en KV-binding `FACTUREN` als de
andere endpoints. KV-key: `doc-<nummer>` met JSON-waarde.

Documentvorm (JSON):
```
{
  type: "factuur" | "offerte",
  nummer, datum, vervaldatum,        // vervaldatum = geldig-tot bij offerte
  referentie,
  klant: { bedrijf, contact, adres, postcodePlaats, email, kvkBtw },
  regels: [ { omschrijving, aantal, stukprijs } ],
  korting: { type, waarde, omschrijving },
  btwTarief, btwVerlegd,
  omgezet_naar: <factuurnummer> | undefined,   // alleen op offertes
  opgeslagen: <ISO-datum>
}
```

**POST** `{doc, overwrite?}` — sla document op onder `doc-<doc.nummer>`.
- Bestaat er al een document met dit nummer én `type === "factuur"` én geen
  `overwrite === true` → **409** `{error, bestaat:true}`. Verstuurde facturen zijn
  onveranderlijk; overschrijven vereist expliciete flag.
- Offertes overschrijven mag altijd (geen 409).
- Nieuwe documenten: altijd opslaan.
- Retour: `{ok:true}` of 409.

**GET** `?nummer=OFF-2026-003` — haal document op.
- Gevonden → `{doc}`. Niet gevonden → **404** `{error}`.

**PATCH** `{nummer, omgezet_naar}` — markeer een bestaande offerte als omgezet.
- Leest `doc-<nummer>`, zet `omgezet_naar`, schrijft terug.
- Niet gevonden → 404. (Alleen bedoeld voor offertes.)

## Frontend (`admin/factuur/index.html`)

### State

`state.docType` toegevoegd (`"factuur"` default). Meegenomen in localStorage-concept.
Bij laden concept: default naar `"factuur"` als afwezig.

### Toggle & reactieve labels

- Topbar: twee toggle-knoppen "Factuur" / "Offerte" links naast de acties. Actieve =
  `btn-oranje`, inactieve = `btn-ghost`. Klik wisselt `state.docType` en her-rendert.
- Reactief op `docType`:
  - Topbar-titel `· Factuur` / `· Offerte`
  - Sectiekop "Factuurgegevens" / "Offertegegevens"; label "Factuurnummer" /
    "Offertenummer"
  - PDF-knop "Factuur genereren (PDF)" / "Offerte genereren (PDF)"
  - Datumlabel "Vervaldatum" / "Geldig tot"
  - Bij wisselen: als de vervaldatum nog de default van de andere modus is, herbereken
    → offerte `vandaag+30`, factuur `vandaag+14`. (Handmatig gezette datum niet
    overschrijven: alleen bijwerken als datum leeg of gelijk aan oude default.)
- "Zet om naar factuur"-knop: alleen zichtbaar in offerte-modus.
- Offerte ophalen: in offerte-modus een klein invoerveld + knop "Offerte ophalen"
  naast het nummerveld → `GET /api/document?nummer=` → vult state (klant/regels/
  korting/btw/datum/referentie) en her-rendert. 404 → nette melding.

### Reserveer-nummer

`reserveerNummer()` stuurt `type` mee (`GET /api/factuurnummer?type=<docType>`).
Waarschuwing/bestaat-check ongewijzigd (werkt op volledig nummer).

### Preview & PDF

Gedeelde helper `isOfferte()` = `state.docType === "offerte"`.

- Titel: "FACTUUR" / "OFFERTE" in preview-titel én PDF-kop.
- Meta-labels: "Factuurnummer/Factuurdatum/Vervaldatum" ↔
  "Offertenummer/Offertedatum/Geldig tot".
- Voettekst:
  - factuur (ongewijzigd): betaalregel (IBAN/14 dagen) + AV-regel + bedrijfsregel.
  - offerte: geldigheidsregel `"Deze offerte is geldig tot <vervaldatum>."` + AV-regel
    + bedrijfsregel. Géén betaalregel.
- Bestandsnaam: `Factuur-<nr>-<klant>.pdf` / `Offerte-<nr>-<klant>.pdf`.

### Opslaan bij genereren

Na `doc.save(...)`:
1. Bouw documentobject uit state.
2. `POST /api/document {doc}`.
   - 409 (factuur bestaat) → `confirm("Deze factuur bestaat al in het archief. "
     + "Overschrijven?")`; bij ja → herhaal met `{doc, overwrite:true}`. Bij nee →
     laat staan (PDF is al gedownload).
   - Offerte → geen 409, overschrijft stil.
3. `bewaarKlant()` blijft (ongewijzigd).

### Omzetten naar factuur

Knop "Zet om naar factuur" (offerte-modus):
1. Onthoud `oudNummer = state.factuur.nummer` (offertenummer, kan leeg zijn).
2. Als `oudNummer` niet leeg: probeer de offerte in KV te markeren ná stap 5
   (want factuurnummer moet eerst bestaan). Zie stap 6.
3. `state.docType = "factuur"`.
4. Reserveer vers factuurnummer (`reserveerNummer()` met factuur-type),
   `state.factuur.datum = vandaag`, `vervaldatum = vandaag+14`.
5. Als `oudNummer` niet leeg → `state.factuur.referentie =
   "offerte " + oudNummer` (bestaande referentie niet overschrijven als al gevuld?
   → wél overschrijven: expliciete omzet-actie).
6. Offerte-status markeren (best-effort): als `oudNummer` niet leeg →
   `PATCH /api/document {nummer:oudNummer, omgezet_naar:<nieuwFactuurnr>}`.
   - 200 → offerte in KV gemarkeerd als omgezet.
   - 404 → offerte was nooit gearchiveerd (nooit gegenereerd); niets om te markeren.
     Console-info, ga door. De omzetting zelf slaagt hoe dan ook.
   De markering blokkeert de omzetting nooit.
7. Her-render (labels, preview, knop-zichtbaarheid). Gebruiker genereert daarna zelf
   de factuur-PDF (die dan het factuurdocument opslaat).

Volgorde-noot: reserveer factuurnummer (stap 4) vóór PATCH (stap 6), want
`omgezet_naar` heeft het factuurnummer nodig.

## Testplan (wrangler pages dev + puppeteer, lokaal)

1. `factuurnummer.js`: GET zonder type → `JJJJ-NNN`; GET `?type=offerte` →
   `OFF-JJJJ-NNN`; tellers onafhankelijk (factuur blijft doorlopen ongeacht offertes).
2. `document.js`: POST nieuw doc → ok; GET → zelfde doc terug; POST zelfde factuurnr
   zonder overwrite → 409; met `overwrite:true` → ok; POST zelfde offertenr → stil ok;
   PATCH offerte → `omgezet_naar` gezet; GET onbekend → 404.
3. UI: toggle wisselt titel/labels/knoppen; offerte-modus toont geldig-tot (vandaag+30)
   + omzet-knop + ophaal-veld; factuur-modus verbergt die.
4. PDF: offerte-PDF titel OFFERTE, geldigheidsregel aanwezig, betaalregel afwezig,
   bestandsnaam Offerte-…; factuur-PDF ongewijzigd. Raster-check met pdf.js (memory:
   reference_pdf_render_check) voor beide.
5. Omzetten: offerte met nummer → vers factuurnr, datum vandaag, referentie
   "offerte OFF-…", oude offerte in KV krijgt `omgezet_naar`.
6. Ophalen: offerte opslaan, pagina herladen, "Offerte ophalen" met nummer → state
   gevuld, preview correct.
7. Regressie: bestaande factuur-flow (reserveer/genereer/klant opslaan) ongewijzigd.
   audit + desktop/mobiel screenshot.

## Niet in scope

- Overzichtspagina (`/admin/overzicht`) — later, aparte spec.
- Verwijderen/bewerken van gearchiveerde documenten.
- E-mailen van offerte/factuur.
