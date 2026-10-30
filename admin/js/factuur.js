// ===================== CONFIG =====================
const AFZENDER = {
  naam: "MVDBmedia",
  contact: "Michael van den Bosch",
  adres: "Dagpauwoog 15",
  postcodePlaats: "8607 HN Sneek",
  kvk: "42084901",
  btw: "NL005483105B05",
  iban: "NL93BUNQ2199250679",
  tel: "+31 6 24 81 92 78",
  email: "info@mvdbmedia.nl",
  web: "mvdbmedia.nl",
  voorwaarden: "mvdbmedia.nl/algemene-voorwaarden",
};

// prijs in hele euro's (ex. btw). omschrijving = standaardtekst op de factuurregel.
const PAKKETTEN = [
  { groep: "Portret",  label: "Solo",       prijs: 95,   omschrijving: "Portretfotografie — Solo" },
  { groep: "Portret",  label: "Signatuur",  prijs: 195,  omschrijving: "Portretfotografie — Signatuur" },
  { groep: "Portret",  label: "Verhaal",    prijs: 345,  omschrijving: "Portretfotografie — Verhaal" },
  { groep: "Groep",    label: "Klein",      prijs: 125,  omschrijving: "Groepsfotografie — Klein" },
  { groep: "Groep",    label: "Groep",      prijs: 195,  omschrijving: "Groepsfotografie — Groep" },
  { groep: "Groep",    label: "Uitgebreid", prijs: 345,  omschrijving: "Groepsfotografie — Uitgebreid" },
  { groep: "Groep",    label: "Zakelijk",   prijs: 595,  omschrijving: "Groepsfotografie — Zakelijk" },
  { groep: "Vastgoed", label: "Compact",    prijs: 175,  omschrijving: "Vastgoedfotografie — Compact" },
  { groep: "Vastgoed", label: "Standaard",  prijs: 295,  omschrijving: "Vastgoedfotografie — Standaard" },
  { groep: "Vastgoed", label: "Premium",    prijs: 495,  omschrijving: "Vastgoedfotografie — Premium" },
  { groep: "Webdesign",label: "Starter",    prijs: 499,  omschrijving: "Website Starter-pakket" },
  { groep: "Webdesign",label: "Business",   prijs: 999,  omschrijving: "Website Business-pakket" },
  { groep: "Drone",    label: "Constructie — Start",   prijs: 295,  omschrijving: "Drone constructiefotografie — Start" },
  { groep: "Drone",    label: "Constructie — Progres", prijs: 795,  omschrijving: "Drone constructiefotografie — Progres" },
  { groep: "Drone",    label: "Constructie — Archief", prijs: 1495, omschrijving: "Drone constructiefotografie — Archief" },
  { groep: "Drone",    label: "Auto — Strak",      prijs: 125,  omschrijving: "Drone autovideo — Strak" },
  { groep: "Drone",    label: "Auto — Reveal",     prijs: 225,  omschrijving: "Drone autovideo — Reveal" },
  { groep: "Drone",    label: "Auto — Cinematic",  prijs: 395,  omschrijving: "Drone autovideo — Cinematic" },
  { groep: "Events",   label: "Kort",       prijs: 295,  omschrijving: "Evenementfotografie — Kort" },
  { groep: "Events",   label: "Halve dag",  prijs: 595,  omschrijving: "Evenementfotografie — Halve dag" },
  { groep: "Events",   label: "Volledig",   prijs: 995,  omschrijving: "Evenementfotografie — Volledig" },
  // TODO Michael: prijs aanleveren — nog niet op de site:
  //   { groep:"Webdesign", label:"Premium",   prijs:0, omschrijving:"Website Premium-pakket" },
  //   { groep:"Video",     label:"Videografie", prijs:0, omschrijving:"Videografie" },
  //   { groep:"Onderhoud", label:"Onderhoud/hosting", prijs:0, omschrijving:"Onderhoud & hosting" },
];

const BTW_STANDAARD = 21;

// ===================== STATE =====================
function vandaag() { return new Date().toISOString().slice(0, 10); }
function overVeertienDagen() {
  const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().slice(0, 10);
}
function overDertigDagen() {
  const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10);
}
let idTeller = 0;
function nieuwId() { return "r" + (++idTeller) + "-" + Date.now(); }

const state = {
  klant: { bedrijf:"", contact:"", adres:"", postcodePlaats:"", email:"", kvkBtw:"" },
  factuur: { nummer:"", datum:vandaag(), vervaldatum:overVeertienDagen(), referentie:"" },
  regels: [], // { id, omschrijving, aantal, stukprijs }
  korting: { type:"geen", waarde:0, omschrijving:"" },
  btwTarief: BTW_STANDAARD,
  btwVerlegd: false,
  docType: "factuur", // "factuur" | "offerte"
  omgezetNaar: null, // gezet bij het laden van een reeds-omgezette offerte
};

const OPSLAG_KEY = "mvdb-factuur-concept";
function bewaarConcept() { localStorage.setItem(OPSLAG_KEY, JSON.stringify(state)); }
function laadConcept() {
  try {
    const opgeslagen = JSON.parse(localStorage.getItem(OPSLAG_KEY));
    if (opgeslagen) {
      Object.assign(state.klant, opgeslagen.klant || {});
      Object.assign(state.factuur, opgeslagen.factuur || {});
      state.regels = Array.isArray(opgeslagen.regels) ? opgeslagen.regels : [];
      Object.assign(state.korting, opgeslagen.korting || {});
      state.btwTarief = opgeslagen.btwTarief ?? BTW_STANDAARD;
      state.btwVerlegd = !!opgeslagen.btwVerlegd;
      state.docType = opgeslagen.docType === "offerte" ? "offerte" : "factuur";
      state.omgezetNaar = opgeslagen.omgezetNaar || null; // behoud heromzet-guard na kale reload
    }
  } catch {}
}

// ===================== BEREKENING =====================
// synced met bereken() in admin/overzicht/index.html — bij wijziging beide bijwerken.
function bereken() {
  const subtotaal = state.regels.reduce((s, r) => s + ((Number(r.aantal)||0) * (Number(r.stukprijs)||0)), 0);
  let kortingBedrag = 0;
  if (state.korting.type === "bedrag") kortingBedrag = Number(state.korting.waarde) || 0;
  else if (state.korting.type === "percentage") kortingBedrag = subtotaal * (Number(state.korting.waarde) || 0) / 100;
  kortingBedrag = Math.min(kortingBedrag, subtotaal);
  const naKorting = Math.max(0, subtotaal - kortingBedrag);
  const btwBedrag = state.btwVerlegd ? 0 : naKorting * (state.btwTarief / 100);
  const totaal = naKorting + btwBedrag;
  return { subtotaal, kortingBedrag, naKorting, btwBedrag, totaal };
}
function euro(n) { return "€ " + (Number(n)||0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function esc(s) { return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
// Kortinglabel: bij percentage het % erbij, bij vast bedrag niet. Gedeeld door preview + PDF.
function kortingLabel() {
  const oms = state.korting.omschrijving ? state.korting.omschrijving.trim() : "";
  const basis = oms || "Korting";
  if (state.korting.type === "percentage") {
    const pct = Number(state.korting.waarde) || 0;
    return `${basis} (${pct}%)`;
  }
  return basis;
}

// ===================== RENDER: dienstkaarten =====================
// Categorie van een pakket: 'Drone' splitst in Drone-constructie / Drone-auto op basis van het label.
function categorieVan(p) {
  if (p.groep === "Drone") {
    if (/^Constructie/i.test(p.label)) return "Drone-constructie";
    if (/^Auto/i.test(p.label)) return "Drone-auto";
  }
  return p.groep;
}
// Kaartnaam zonder categorie-prefix ("Constructie — Start" -> "Start", "Auto — Strak" -> "Strak").
function kaartNaam(p) {
  return p.label.replace(/^(Constructie|Auto)\s*—\s*/i, "");
}
const CATEGORIE_VOLGORDE = ["Portret", "Groep", "Vastgoed", "Webdesign", "Drone-constructie", "Drone-auto", "Events"];

function renderDienstkaarten() {
  const wrap = document.getElementById("dienstkaarten");
  wrap.innerHTML = "";

  // Groepeer pakketten per categorie.
  const perCategorie = {};
  PAKKETTEN.forEach((p) => {
    const cat = categorieVan(p);
    (perCategorie[cat] = perCategorie[cat] || []).push(p);
  });

  // Behoud de gewenste volgorde; onbekende categorieën komen erachteraan.
  const categorieen = [...CATEGORIE_VOLGORDE.filter((c) => perCategorie[c]),
                       ...Object.keys(perCategorie).filter((c) => !CATEGORIE_VOLGORDE.includes(c))];

  categorieen.forEach((cat) => {
    const groepEl = document.createElement("div");
    groepEl.className = "dienstgroep";
    const kop = document.createElement("div");
    kop.className = "dienstgroep-kop";
    kop.textContent = cat;
    groepEl.appendChild(kop);

    const rij = document.createElement("div");
    rij.className = "kaarten";
    perCategorie[cat].forEach((p) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "dienstkaart";
      el.innerHTML = `<span class="k-label">${esc(kaartNaam(p))}</span> · <span class="k-prijs">${euro(p.prijs)}</span>`;
      el.addEventListener("click", () => {
        state.regels.push({ id: nieuwId(), omschrijving: p.omschrijving, aantal: 1, stukprijs: p.prijs });
        renderRegels(); renderPreview(); bewaarConcept();
      });
      rij.appendChild(el);
    });
    groepEl.appendChild(rij);
    wrap.appendChild(groepEl);
  });
}

// ===================== RENDER: regels =====================
let sleepId = null;
function renderRegels() {
  const wrap = document.getElementById("regels");
  wrap.innerHTML = "";
  state.regels.forEach((r) => {
    const rij = document.createElement("div");
    rij.className = "regel";
    rij.draggable = true;
    rij.dataset.id = r.id;
    const totaal = (Number(r.aantal)||0) * (Number(r.stukprijs)||0);
    rij.innerHTML = `
      <span class="greep" title="Sleep om te herordenen">⠿</span>
      <input class="r-oms" value="${esc(r.omschrijving)}" placeholder="Omschrijving">
      <input class="r-aantal" type="number" min="0" step="1" value="${esc(r.aantal)}">
      <input class="r-prijs" type="number" min="0" step="0.01" value="${esc(r.stukprijs)}">
      <span class="regeltotaal">${euro(totaal)}</span>
      <button class="verwijder" title="Verwijder regel" type="button">✕</button>`;

    rij.querySelector(".r-oms").addEventListener("input", (e) => { r.omschrijving = e.target.value; renderPreview(); bewaarConcept(); });
    rij.querySelector(".r-aantal").addEventListener("input", (e) => { r.aantal = e.target.value; rij.querySelector(".regeltotaal").textContent = euro((Number(r.aantal)||0)*(Number(r.stukprijs)||0)); renderPreview(); bewaarConcept(); });
    rij.querySelector(".r-prijs").addEventListener("input", (e) => { r.stukprijs = e.target.value; rij.querySelector(".regeltotaal").textContent = euro((Number(r.aantal)||0)*(Number(r.stukprijs)||0)); renderPreview(); bewaarConcept(); });
    rij.querySelector(".verwijder").addEventListener("click", () => { state.regels = state.regels.filter((x) => x.id !== r.id); renderRegels(); renderPreview(); bewaarConcept(); });

    rij.addEventListener("dragstart", () => { sleepId = r.id; });
    rij.addEventListener("dragover", (e) => { e.preventDefault(); rij.classList.add("sleep-over"); });
    rij.addEventListener("dragleave", () => rij.classList.remove("sleep-over"));
    rij.addEventListener("drop", (e) => {
      e.preventDefault(); rij.classList.remove("sleep-over");
      if (sleepId === null || sleepId === r.id) return;
      const van = state.regels.findIndex((x) => x.id === sleepId);
      const naar = state.regels.findIndex((x) => x.id === r.id);
      const [verplaatst] = state.regels.splice(van, 1);
      state.regels.splice(naar, 0, verplaatst);
      sleepId = null; renderRegels(); renderPreview(); bewaarConcept();
    });

    wrap.appendChild(rij);
  });
}

// ===================== RENDER: preview =====================
function renderPreview() {
  const c = bereken();
  const k = state.klant, f = state.factuur;
  const klantregels = [k.bedrijf, k.contact, k.adres, k.postcodePlaats, k.email, k.kvkBtw].filter(Boolean).map(esc).join("<br>");
  const regelsHtml = state.regels.map((r) => {
    const t = (Number(r.aantal)||0)*(Number(r.stukprijs)||0);
    return `<tr><td>${esc(r.omschrijving)}</td><td class="r">${esc(r.aantal)}</td><td class="r">${euro(r.stukprijs)}</td><td class="r">${euro(t)}</td></tr>`;
  }).join("") || `<tr><td colspan="4" style="color:#bbb;">Nog geen regels</td></tr>`;

  let totRijen = `<div class="tr"><span>Subtotaal</span><span>${euro(c.subtotaal)}</span></div>`;
  if (c.kortingBedrag > 0) {
    totRijen += `<div class="tr"><span>${esc(kortingLabel())}</span><span>−${euro(c.kortingBedrag)}</span></div>`;
    totRijen += `<div class="tr"><span>Subtotaal na korting</span><span>${euro(c.naKorting)}</span></div>`;
  }
  totRijen += `<div class="tr"><span>${state.btwVerlegd ? "Btw" : "Btw " + state.btwTarief + "%"}</span><span>${state.btwVerlegd ? "verlegd" : euro(c.btwBedrag)}</span></div>`;
  totRijen += `<div class="tr groot"><span>Totaal</span><span>${euro(c.totaal)}</span></div>`;

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
}

// ===================== INPUT-BINDINGEN =====================
function bindVelden() {
  document.querySelectorAll("[data-klant]").forEach((el) => {
    el.value = state.klant[el.dataset.klant] || "";
    el.addEventListener("input", () => { state.klant[el.dataset.klant] = el.value; renderPreview(); bewaarConcept(); });
  });
  document.querySelectorAll("[data-factuur]").forEach((el) => {
    el.value = state.factuur[el.dataset.factuur] || "";
    el.addEventListener("input", () => {
      state.factuur[el.dataset.factuur] = el.value; renderPreview(); bewaarConcept();
      if (el.dataset.factuur === "nummer") controleerNummer(el.value);
    });
  });

  // korting
  document.querySelectorAll("input[name=korting-type]").forEach((radio) => {
    if (radio.value === state.korting.type) radio.checked = true;
    radio.addEventListener("change", () => {
      state.korting.type = radio.value;
      toonKortingVelden();
      renderPreview(); bewaarConcept();
    });
  });
  const kw = document.getElementById("korting-waarde");
  kw.value = state.korting.waarde || 0;
  kw.addEventListener("input", () => { state.korting.waarde = kw.value; renderPreview(); bewaarConcept(); });
  const ko = document.getElementById("korting-omschrijving");
  ko.value = state.korting.omschrijving || "";
  ko.addEventListener("input", () => { state.korting.omschrijving = ko.value; renderPreview(); bewaarConcept(); });
  toonKortingVelden();

  // btw
  const btw = document.getElementById("btw-select");
  btw.value = state.btwVerlegd ? "verlegd" : String(state.btwTarief);
  btw.addEventListener("change", () => {
    if (btw.value === "verlegd") { state.btwVerlegd = true; }
    else { state.btwVerlegd = false; state.btwTarief = Number(btw.value); }
    renderPreview(); bewaarConcept();
  });
}

function toonKortingVelden() {
  const velden = document.getElementById("korting-velden");
  const label = document.getElementById("korting-waarde-label");
  velden.style.display = state.korting.type === "geen" ? "none" : "grid";
  label.textContent = state.korting.type === "percentage" ? "Percentage (%)" : "Bedrag (€)";
}

// ===================== FACTUURNUMMER =====================
async function controleerNummer(nummer) {
  const w = document.getElementById("nummer-waarschuwing");
  w.textContent = "";
  if (!nummer.trim()) return;
  try {
    const res = await fetch("/api/factuurnummer", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nummer: nummer.trim() }),
    });
    if (res.ok) {
      const { bestaat } = await res.json();
      w.textContent = bestaat ? "⚠ Dit factuurnummer is al eerder uitgegeven." : "";
    }
  } catch {}
}

async function reserveerNummer() {
  try {
    const res = await fetch("/api/factuurnummer" + (state.docType === "offerte" ? "?type=offerte" : ""));
    if (res.ok) {
      const { nummer } = await res.json();
      state.factuur.nummer = nummer;
      document.getElementById("f-nummer").value = nummer;
      document.getElementById("nummer-waarschuwing").textContent = "";
      renderPreview(); bewaarConcept();
      return nummer;
    }
    const err = await res.json().catch(() => ({}));
    alert("Kon geen nummer reserveren: " + (err.error || res.status));
  } catch { alert("Kon geen nummer reserveren (netwerkfout)."); }
  return null;
}

// ===================== KLANTENBESTAND (KV) =====================
let klantenCache = []; // [{id, bedrijf, contact, adres, postcodePlaats, email, kvkBtw}]

async function laadKlanten() {
  try {
    const res = await fetch("/api/klanten");
    if (!res.ok) return;
    klantenCache = (await res.json()).klanten || [];
    vulKlantSelect();
  } catch {}
}

function vulKlantSelect() {
  const sel = document.getElementById("klant-select");
  const huidig = sel.value;
  sel.innerHTML = '<option value="">— Nieuwe klant —</option>';
  klantenCache.forEach((k) => {
    const opt = document.createElement("option");
    opt.value = k.id;
    const naam = k.bedrijf || k.contact || k.email || "(naamloos)";
    opt.textContent = k.email ? `${naam} — ${k.email}` : naam;
    sel.appendChild(opt);
  });
  if ([...sel.options].some((o) => o.value === huidig)) sel.value = huidig;
  document.getElementById("klant-verwijder").disabled = !sel.value;
}

function kiesKlant(id) {
  const k = klantenCache.find((x) => x.id === id);
  if (!k) return;
  ["bedrijf", "contact", "adres", "postcodePlaats", "email", "kvkBtw"].forEach((v) => {
    state.klant[v] = k[v] || "";
  });
  // inputvelden bijwerken
  document.querySelectorAll("[data-klant]").forEach((el) => { el.value = state.klant[el.dataset.klant] || ""; });
  renderPreview(); bewaarConcept();
}

async function verwijderKlant(id) {
  const k = klantenCache.find((x) => x.id === id);
  const naam = k ? (k.bedrijf || k.email || "deze klant") : "deze klant";
  if (!confirm(`Klant "${naam}" verwijderen uit het klantenbestand?`)) return;
  try {
    const res = await fetch("/api/klanten", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      klantenCache = klantenCache.filter((x) => x.id !== id);
      document.getElementById("klant-select").value = "";
      vulKlantSelect();
    }
  } catch {}
}

// Sla de huidige klant op / werk bij (match op bedrijf+email server-side). Ververst de lijst.
async function bewaarKlant() {
  if (!state.klant.bedrijf.trim() && !state.klant.email.trim()) return;
  try {
    const res = await fetch("/api/klanten", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ klant: state.klant }),
    });
    if (res.ok) { await laadKlanten(); }
  } catch {}
}

// ===================== MODUS =====================
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
  const nieuweDefault = nieuw === "offerte" ? overDertigDagen() : overVeertienDagen();
  state.docType = nieuw;
  // datum-default bijwerken alleen als de gebruiker 'm niet handmatig zette
  if (!state.factuur.vervaldatum || state.factuur.vervaldatum === oudeDefault) {
    state.factuur.vervaldatum = nieuweDefault;
    const vd = document.querySelector('[data-factuur="vervaldatum"]');
    if (vd) vd.value = state.factuur.vervaldatum;
  }
  pasModusToe();
  bewaarConcept();
}

// ===================== DOCUMENT ARCHIVEREN =====================
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
    if (!res.ok) {
      alert("Archiveren in het archief mislukt. De PDF is wél gedownload.");
    }
    return res.ok;
  } catch {
    alert("Archiveren mislukt (netwerkfout). De PDF is wél gedownload.");
    return false;
  }
}

// ===================== DOCUMENT LADEN =====================
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
  state.omgezetNaar = doc.omgezet_naar || null; // extra state-veld: expliciet resetten bij elk laden
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

// ===================== OMZETTEN OFFERTE → FACTUUR =====================
async function zetOmNaarFactuur() {
  if (!isOfferte()) return;
  if (state.omgezetNaar) {
    if (!confirm("Deze offerte is al omgezet naar factuur " + state.omgezetNaar + ". Opnieuw omzetten naar een nieuwe factuur?")) return;
  }
  const oudNummer = (state.factuur.nummer || "").trim();
  // wissel naar factuur-modus vóór reserveren zodat een factuurnummer wordt gehaald
  state.docType = "factuur";
  state.factuur.nummer = "";
  const nr = await reserveerNummer();
  if (!nr) {
    // reservering mislukt: terug naar offerte-modus om dataverlies te voorkomen
    state.docType = "offerte";
    state.factuur.nummer = oudNummer;
    document.querySelectorAll("[data-factuur]").forEach((el) => { el.value = state.factuur[el.dataset.factuur] || ""; });
    pasModusToe(); bewaarConcept();
    alert("Kon geen factuurnummer reserveren. Omzetten afgebroken.");
    return;
  }
  state.factuur.datum = vandaag();
  state.factuur.vervaldatum = overVeertienDagen();
  if (oudNummer) state.factuur.referentie = "offerte " + oudNummer;
  // DOM-velden bijwerken
  document.querySelectorAll("[data-factuur]").forEach((el) => { el.value = state.factuur[el.dataset.factuur] || ""; });
  // oude offerte markeren als omgezet (best-effort)
  if (oudNummer) {
    try {
      await fetch("/api/document", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nummer: oudNummer, omgezet_naar: nr }),
      });
    } catch (e) { console.info("Offerte-markering mislukt (best-effort):", e); }
  }
  // Nieuwe koppeling in state, zodat een tweede omzet-poging opnieuw bevestiging vraagt.
  state.omgezetNaar = nr;
  pasModusToe(); bewaarConcept();
}

// ===================== INIT =====================
function init() {
  laadConcept();
  renderDienstkaarten();
  renderRegels();
  bindVelden();
  renderPreview();
  laadKlanten();

  document.getElementById("regel-toevoegen").addEventListener("click", () => {
    state.regels.push({ id: nieuwId(), omschrijving: "", aantal: 1, stukprijs: 0 });
    renderRegels(); renderPreview(); bewaarConcept();
  });
  document.getElementById("reserveer-knop").addEventListener("click", reserveerNummer);
  document.getElementById("klant-select").addEventListener("change", (e) => {
    document.getElementById("klant-verwijder").disabled = !e.target.value;
    if (e.target.value) kiesKlant(e.target.value);
  });
  document.getElementById("klant-verwijder").addEventListener("click", () => {
    const id = document.getElementById("klant-select").value;
    if (id) verwijderKlant(id);
  });
  document.getElementById("logout-knop").addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/admin/login/";
  });
  document.getElementById("pdf-knop").addEventListener("click", genereerPdf);
  document.getElementById("toggle-factuur").addEventListener("click", () => wisselModus("factuur"));
  document.getElementById("toggle-offerte").addEventListener("click", () => wisselModus("offerte"));
  // Knop staat in offerte-modus, maar laadt bewust ELK document (factuur of offerte)
  // via dezelfde laadDocument; een geladen factuur valt onder de read-only 409-rem.
  document.getElementById("ophaal-knop").addEventListener("click", () => {
    laadDocument(document.getElementById("ophaal-nummer").value, { viaKnop: true });
  });
  document.getElementById("omzet-knop").addEventListener("click", zetOmNaarFactuur);
  pasModusToe();

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
}

// ===================== PDF =====================
function pdfEuro(n) { return "€ " + (Number(n)||0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

async function genereerPdf() {
  if (state.regels.length === 0) { alert("Voeg minstens één factuurregel toe."); return; }

  // Reserveer nummer als het veld nog leeg is.
  if (!state.factuur.nummer) {
    const nr = await reserveerNummer();
    if (!nr) return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) { alert("PDF-bibliotheek niet geladen."); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  let displayFont = "helvetica";
  if (window.BEBAS_TTF_B64) {
    doc.addFileToVFS("Bebas.ttf", window.BEBAS_TTF_B64);
    doc.addFont("Bebas.ttf", "Bebas", "normal");
    displayFont = "Bebas";
  }

  const oranje = [255, 140, 0];
  const donker = [13, 13, 13];
  const M = 48;

  // Kop
  doc.setFont(displayFont, "normal"); doc.setFontSize(28); doc.setTextColor(...donker);
  doc.text("MVDB", M, 60);
  const wMvdb = doc.getTextWidth("MVDB");
  doc.setTextColor(...oranje); doc.text("media", M + wMvdb + 2, 60);
  doc.setTextColor(...donker); doc.setFontSize(30);
  doc.text(isOfferte() ? "OFFERTE" : "FACTUUR", 547, 60, { align: "right" });

  // Afzender links onder de logo-kop (eigen kolom, geen overlap met meta)
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(120);
  [AFZENDER.naam, AFZENDER.adres, AFZENDER.postcodePlaats, AFZENDER.email, AFZENDER.tel]
    .forEach((r, i) => doc.text(r, M, 84 + i * 11, { align: "left" }));

  // Factuurmeta rechts (label links van de waarde, allebei binnen de rechterkolom)
  const meta = [
    [isOfferte() ? "Offertenummer" : "Factuurnummer", state.factuur.nummer],
    [isOfferte() ? "Offertedatum" : "Factuurdatum", state.factuur.datum],
    [isOfferte() ? "Geldig tot" : "Vervaldatum", state.factuur.vervaldatum],
  ];
  if (state.factuur.referentie) meta.push(["Referentie", state.factuur.referentie]);
  doc.setTextColor(...donker); doc.setFontSize(9);
  meta.forEach((r, i) => {
    doc.text(r[0], 400, 84 + i * 13);
    doc.text(String(r[1] || ""), 547, 84 + i * 13, { align: "right" });
  });

  // Klant links, onder het afzenderblok
  doc.setTextColor(...donker); doc.setFontSize(9);
  doc.text(isOfferte() ? "Offerte voor:" : "Factuur aan:", M, 158);
  const klant = [state.klant.bedrijf, state.klant.contact, state.klant.adres,
                 state.klant.postcodePlaats, state.klant.email, state.klant.kvkBtw].filter(Boolean);
  klant.forEach((r, i) => doc.text(String(r), M, 172 + i * 12));

  // Regeltabel begint onder het langste bovenblok
  const klantHoogte = 172 + klant.length * 12;
  const tabelStart = Math.max(klantHoogte + 10, 210);

  // Regeltabel
  const c = bereken();
  const body = state.regels.map((r) => [
    r.omschrijving, String(r.aantal),
    pdfEuro(r.stukprijs), pdfEuro((Number(r.aantal)||0) * (Number(r.stukprijs)||0)),
  ]);
  doc.autoTable({
    startY: tabelStart,
    head: [["Omschrijving", "Aantal", "Stukprijs", "Totaal"]],
    body,
    theme: "plain",
    headStyles: { fillColor: donker, textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: donker },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    margin: { left: M, right: M },
  });

  // Totalen
  let y = doc.lastAutoTable.finalY + 20;
  const rij = (label, waarde, vet) => {
    doc.setFont("helvetica", vet ? "bold" : "normal");
    doc.text(label, 400, y); doc.text(waarde, 547, y, { align: "right" }); y += 16;
  };
  rij("Subtotaal", pdfEuro(c.subtotaal));
  if (c.kortingBedrag > 0) {
    rij(kortingLabel(), "-" + pdfEuro(c.kortingBedrag));
    rij("Subtotaal na korting", pdfEuro(c.naKorting));
  }
  rij(state.btwVerlegd ? "Btw" : "Btw " + state.btwTarief + "%", state.btwVerlegd ? "verlegd" : pdfEuro(c.btwBedrag));
  // Scheidingsstreep exact tussen de Btw-regel en de Totaal-regel.
  // Btw-baseline = y-16, Totaal-baseline = y; regelafstand 16 -> midden op y-8.
  doc.setDrawColor(...oranje); doc.setLineWidth(1); doc.line(400, y - 8, 547, y - 8);
  y += 2; // iets extra lucht onder de streep vóór de Totaal-regel
  rij("Totaal", pdfEuro(c.totaal), true);

  // Voettekst: direct onder de totalen, niet op een vaste bodempositie
  // (voorkomt een leeg gat / tweede pagina bij een korte factuur).
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(90);
  const bodem = doc.internal.pageSize.getHeight() - 40; // 802 op A4
  let voet = y + 30;
  if (voet > bodem - 40) voet = bodem - 40; // val terug binnen de pagina als het lang is
  if (isOfferte()) {
    doc.text(`Deze offerte is geldig tot ${state.factuur.vervaldatum}.`, M, voet, { maxWidth: 499 });
  } else {
    doc.text(`Gelieve het bedrag binnen 14 dagen over te maken op IBAN ${AFZENDER.iban} o.v.v. het factuurnummer ${state.factuur.nummer}.`, M, voet, { maxWidth: 499 });
  }
  doc.text(`Op al onze diensten zijn de algemene voorwaarden van toepassing, te vinden op ${AFZENDER.voorwaarden}.`, M, voet + 12, { maxWidth: 499 });
  doc.text(`${AFZENDER.naam}  |  KvK ${AFZENDER.kvk}  |  BTW ${AFZENDER.btw}  |  ${AFZENDER.web}`, M, voet + 30);

  const veiligeKlant = (state.klant.bedrijf || state.klant.contact || "klant")
    .replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "klant";
  const prefix = isOfferte() ? "Offerte" : "Factuur";
  doc.save(`${prefix}-${state.factuur.nummer}-${veiligeKlant}.pdf`);

  // Document (factuur/offerte) archiveren in KV, daarna klant bijwerken.
  await bewaarDocument();
  // Klant automatisch opslaan/bijwerken in het klantenbestand (match op bedrijf+email).
  bewaarKlant(); // bewust fire-and-forget: bijzaak, PDF is al gedownload
}

init();
