// functions/_lib/boekhouding.js
// Validatie en mutaties voor de boekhouding (één JSON-document per boekjaar in KV).
// Pure functies, zonder Workers-API's, zodat scripts/test-belasting.mjs ze kan draaien.

export const TARIEVEN = [0, 9, 21];
export const MAX_BEDRAG = 10_000_000;
export const MAX_REGELS = 2000;
export const MAX_IMPORT = 500;

// Bijlage bij een kostenpost: bestand staat in KV onder "bon-<uuid>" en wordt alleen via /api/bon geserveerd.
export const BON_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const bonUrl = (id) => `/api/bon?id=${id}`;
export function bonIdUitUrl(url) {
  const m = typeof url === "string" ? /^\/api\/bon\?id=([0-9a-f-]{36})$/.exec(url) : null;
  return m && BON_ID_RE.test(m[1]) ? m[1] : null;
}

const rond2 = (n) => Math.round(n * 100) / 100;

export function kwartaalVan(iso) {
  const m = Number(String(iso).slice(5, 7));
  return Math.ceil(m / 3);
}

export function geldigeDatum(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// Accepteert 1250.5, "1250.5" en Nederlandse notatie "1.250,50". null = leeg, NaN = ongeldig.
export function parseBedrag(v) {
  if (v === null || v === undefined || v === "") return null;
  let n;
  if (typeof v === "number") n = v;
  else if (typeof v === "string") {
    const s = v.trim().replace(/\s/g, "");
    n = s.includes(",") ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s);
  } else return NaN;
  if (!Number.isFinite(n) || Math.abs(n) > MAX_BEDRAG) return NaN;
  return rond2(n);
}

const bool = (v) => v === true || v === "true" || v === "ja" || v === "on" || v === 1;

// Vervangt stuurtekens (code < 32 en 127) door een spatie, trimt en kapt af.
const tekst = (v, max) =>
  Array.from(String(v ?? ""), (ch) => {
    const c = ch.charCodeAt(0);
    return c < 32 || c === 127 ? " " : ch;
  }).join("").trim().slice(0, max);

const fout = (error) => ({ ok: false, error });

function basis(input, jaar, { voorStart = false } = {}) {
  const datum = tekst(input.datum, 10);
  if (!geldigeDatum(datum)) return fout("Ongeldige datum.");
  const dj = Number(datum.slice(0, 4));
  if (voorStart ? dj !== jaar && dj !== jaar - 1 : dj !== jaar) return fout(`Datum valt niet in boekjaar ${jaar}.`);
  const omschrijving = tekst(input.omschrijving, 200);
  if (!omschrijving) return fout("Omschrijving ontbreekt.");
  const netto = parseBedrag(input.netto);
  if (netto === null || Number.isNaN(netto) || netto === 0) return fout("Ongeldig bedrag excl. btw.");
  return { ok: true, datum, dj, omschrijving, netto };
}

export function schoonOmzet(input, jaar) {
  if (!input || typeof input !== "object") return fout("Ongeldig verzoek.");
  const b = basis(input, jaar);
  if (!b.ok) return b;
  const tarief = Number(input.tarief);
  if (!TARIEVEN.includes(tarief)) return fout("Btw-tarief moet 21%, 9% of 0% zijn.");
  const bron = input.bron ? tekst(input.bron, 60) : "";
  if (bron && !/^factuur:[A-Za-z0-9-]{1,40}$/.test(bron)) return fout("Ongeldige bron.");
  return {
    ok: true,
    item: {
      id: tekst(input.id, 60) || undefined,
      datum: b.datum, omschrijving: b.omschrijving, klant: tekst(input.klant, 120),
      netto: b.netto, tarief, kwartaal: kwartaalVan(b.datum), ...(bron ? { bron } : {}),
    },
  };
}

export function schoonKosten(input, jaar) {
  if (!input || typeof input !== "object") return fout("Ongeldig verzoek.");
  const voorStart = bool(input.voorStart);
  const b = basis(input, jaar, { voorStart });
  if (!b.ok) return b;
  const btw = parseBedrag(input.btw ?? 0);
  if (btw === null || Number.isNaN(btw)) return fout("Ongeldig btw-bedrag.");
  if (btw !== 0 && Math.sign(btw) !== Math.sign(b.netto)) return fout("Btw moet hetzelfde teken hebben als het bedrag.");
  if (Math.abs(btw) > Math.abs(b.netto) * 0.21 + 0.1) return fout("Btw is hoger dan 21% van het bedrag.");
  // Optioneel kenmerk; ontbreekt bij bestaande records en betekent dan "regulier".
  const verlegd = bool(input.verlegd);
  if (verlegd && btw !== 0) return fout("Bij btw verlegd is de betaalde btw € 0,00.");
  // eu = rubriek 4b, non_eu = rubriek 4a. Ontbreekt de regio (oudere client), dan geldt eu zoals voorheen.
  const regio = input.verlegdRegio === undefined || input.verlegdRegio === null || input.verlegdRegio === "" ? "eu" : input.verlegdRegio;
  if (verlegd && regio !== "eu" && regio !== "non_eu") return fout("Ongeldige regio voor btw verlegd (eu of non_eu).");

  let kwartaal = kwartaalVan(b.datum);
  if (voorStart) {
    // Voorbelasting van vóór de start gaat mee in de eerste aangifte (standaard het startkwartaal).
    const k = Number(input.kwartaal);
    kwartaal = Number.isInteger(k) && k >= 1 && k <= 4 ? k : b.dj === jaar ? kwartaal : 1;
  }
  // Optioneel: ontbreekt = bestaande bijlage behouden, "" = bijlage verwijderen, anders een geldige /api/bon-url.
  let factuurUrl;
  if (input.factuur_url !== undefined && input.factuur_url !== null) {
    if (input.factuur_url !== "" && !bonIdUitUrl(input.factuur_url)) return fout("Ongeldige bijlage.");
    factuurUrl = input.factuur_url;
  }
  return {
    ok: true,
    item: {
      id: tekst(input.id, 60) || undefined,
      datum: b.datum, omschrijving: b.omschrijving, netto: b.netto, btw, voorStart, kwartaal,
      ...(verlegd ? { verlegd: true, verlegdRegio: regio } : {}),
      ...(factuurUrl !== undefined ? { factuur_url: factuurUrl } : {}),
    },
  };
}

export function schoonAangifte(input) {
  if (!input || typeof input !== "object") return fout("Ongeldig verzoek.");
  const velden = {};
  for (const v of ["omzetNetto", "btwOmzet", "voorbelasting", "kostenNetto"]) {
    const n = parseBedrag(input[v]);
    if (Number.isNaN(n)) return fout(`Ongeldig bedrag bij ${v}.`);
    velden[v] = n;
  }
  const datum = tekst(input.datum, 10);
  if (datum && !geldigeDatum(datum)) return fout("Ongeldige datum.");
  const voldaan = bool(input.voldaan);
  return {
    ok: true,
    aangifte: { ingediend: bool(input.ingediend) || voldaan, voldaan, datum, ...velden, notitie: tekst(input.notitie, 300) },
  };
}

export function schoonInstellingen(input) {
  if (!input || typeof input !== "object") return fout("Ongeldig verzoek.");
  const startdatum = tekst(input.startdatum, 10);
  if (!geldigeDatum(startdatum)) return fout("Ongeldige startdatum.");
  const extra = parseBedrag(input.extraWinst ?? 0);
  if (Number.isNaN(extra)) return fout("Ongeldige extra winst.");
  return {
    ok: true,
    instellingen: {
      startdatum,
      urencriterium: bool(input.urencriterium),
      starter: bool(input.starter),
      extraWinst: extra ?? 0,
    },
  };
}

export function leegBoek(jaar) {
  return {
    jaar,
    omzet: [],
    kosten: [],
    aangiften: {},
    instellingen: { startdatum: jaar === 2026 ? "2026-06-15" : `${jaar}-01-01`, urencriterium: true, starter: true, extraWinst: 0 },
    bijgewerkt: null,
  };
}

export function geldigJaar(j) {
  const n = Number(j);
  return Number.isInteger(n) && n >= 2020 && n <= 2100 ? n : null;
}

// Voert één actie uit op het boek. Geeft { ok, boek, info } of { ok:false, error, status }.
export function pasToe(boek, actie, body, nu = new Date()) {
  const jaar = boek.jaar;
  const afgewezen = (error, status = 400) => ({ ok: false, error, status });
  const nieuweId = () => crypto.randomUUID();

  const opslaanItem = (lijst, schoon) => {
    if (!schoon.ok) return afgewezen(schoon.error);
    const item = schoon.item;
    if (item.id) {
      const i = lijst.findIndex((x) => x.id === item.id);
      if (i < 0) return afgewezen("Regel niet gevonden.", 404);
      if (lijst[i].bron && !item.bron) item.bron = lijst[i].bron;
      if (item.factuur_url === undefined && lijst[i].factuur_url) item.factuur_url = lijst[i].factuur_url;
      if (item.factuur_url === "") delete item.factuur_url;
      lijst[i] = item;
    } else {
      if (lijst.length >= MAX_REGELS) return afgewezen("Maximum aantal regels bereikt.");
      if (item.factuur_url === "") delete item.factuur_url;
      item.id = nieuweId();
      lijst.push(item);
    }
    return null;
  };
  const verwijder = (lijst, id) => {
    const i = lijst.findIndex((x) => x.id === String(id || ""));
    if (i < 0) return afgewezen("Regel niet gevonden.", 404);
    lijst.splice(i, 1);
    return null;
  };

  let fail = null;
  let info;
  switch (actie) {
    case "omzet.opslaan":
      fail = opslaanItem(boek.omzet, schoonOmzet(body.item, jaar));
      break;
    case "omzet.verwijder":
      fail = verwijder(boek.omzet, body.id);
      break;
    case "omzet.importeer": {
      const items = Array.isArray(body.items) ? body.items : null;
      if (!items || items.length > MAX_IMPORT) return afgewezen("Ongeldige import.");
      const bekend = new Set(boek.omzet.map((o) => o.bron).filter(Boolean));
      let toegevoegd = 0, overgeslagen = 0, ongeldig = 0;
      for (const raw of items) {
        const s = schoonOmzet({ ...raw, id: undefined }, jaar);
        if (!s.ok || !s.item.bron) { ongeldig++; continue; }
        if (bekend.has(s.item.bron)) { overgeslagen++; continue; }
        if (boek.omzet.length >= MAX_REGELS) return afgewezen("Maximum aantal regels bereikt.");
        s.item.id = nieuweId();
        boek.omzet.push(s.item);
        bekend.add(s.item.bron);
        toegevoegd++;
      }
      info = { toegevoegd, overgeslagen, ongeldig };
      break;
    }
    case "kosten.opslaan":
      fail = opslaanItem(boek.kosten, schoonKosten(body.item, jaar));
      break;
    case "kosten.verwijder":
      fail = verwijder(boek.kosten, body.id);
      break;
    case "aangifte.opslaan": {
      const q = Number(body.kwartaal);
      if (![1, 2, 3, 4].includes(q)) return afgewezen("Ongeldig kwartaal.");
      const s = schoonAangifte(body.aangifte);
      if (!s.ok) return afgewezen(s.error);
      boek.aangiften[q] = s.aangifte;
      break;
    }
    case "aangifte.status": {
      const q = Number(body.kwartaal);
      if (![1, 2, 3, 4].includes(q)) return afgewezen("Ongeldig kwartaal.");
      const huidig = boek.aangiften[q] || {
        ingediend: false, voldaan: false, datum: "", omzetNetto: null, btwOmzet: null, voorbelasting: null, kostenNetto: null, notitie: "",
      };
      const voldaan = bool(body.voldaan);
      boek.aangiften[q] = { ...huidig, voldaan, ingediend: bool(body.ingediend) || voldaan };
      break;
    }
    case "instellingen.opslaan": {
      const s = schoonInstellingen(body.instellingen);
      if (!s.ok) return afgewezen(s.error);
      boek.instellingen = s.instellingen;
      break;
    }
    default:
      return afgewezen("Onbekende actie.");
  }
  if (fail) return fail;
  boek.bijgewerkt = nu.toISOString();
  return { ok: true, boek, info };
}
