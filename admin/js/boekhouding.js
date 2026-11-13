// Boekhouding-dashboard: btw per kwartaal, omzet, kosten en inkomstenbelasting-indicatie.
// Rekenregels staan in /admin/js/belasting.js, opslag en validatie in /api/boekhouding.
(function () {
  "use strict";

  const B = window.Belasting;
  const nu = new Date();
  const huidigJaar = nu.getFullYear();
  const vandaagIso = () => new Date(nu.getTime() - nu.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const state = {
    jaar: Math.max(2026, huidigJaar),
    boek: null,
    tab: "btw",
    filter: { omzet: 0, kosten: 0 },
    omzetDatumHandmatig: false,
    voorStartHandmatig: false,
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fmtEuro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
  const euro = (n) => fmtEuro.format(Number(n) || 0);
  const fmtEuroHeel = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0, minimumFractionDigits: 0 });
  const euroHeel = (n) => fmtEuroHeel.format(Number(n) || 0);
  const pct = (n) => (n * 100).toLocaleString("nl-NL", { maximumFractionDigits: 2 }) + "%";
  const datumNl = (iso) => (iso ? new Date(iso + "T00:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "");
  const MAANDEN = ["jan – mrt", "apr – jun", "jul – sep", "okt – dec"];

  // ---------- melding & api ----------
  let meldTimer;
  function toon(tekst, soort) {
    const m = $("melding");
    m.textContent = tekst;
    m.className = "melding " + (soort || "ok");
    m.hidden = false;
    clearTimeout(meldTimer);
    meldTimer = setTimeout(() => { m.hidden = true; }, soort === "fout" ? 8000 : 4000);
  }

  async function verzoek(url, opties) {
    const res = await fetch(url, opties);
    if (res.status === 401) { location.href = "/admin/login/"; throw new Error("Niet ingelogd."); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Er ging iets mis.");
    return data;
  }

  async function opslaan(actie, extra) {
    const data = await verzoek("/api/boekhouding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jaar: state.jaar, actie, ...extra }),
    });
    state.boek = data.boek;
    render();
    return data;
  }

  async function probeer(fn) {
    try { return await fn(); } catch (e) { toon(e.message || "Er ging iets mis.", "fout"); return null; }
  }

  async function laad() {
    const data = await probeer(() => verzoek("/api/boekhouding?jaar=" + state.jaar));
    if (!data) return;
    state.boek = data.boek;
    render();
  }

  // ---------- afgeleide waarden ----------
  const startKwartaal = () => {
    const s = state.boek.instellingen.startdatum;
    return Number(s.slice(0, 4)) === state.jaar ? B.kwartaalVan(s) : 1;
  };
  function huidigKwartaal() {
    if (state.jaar === huidigJaar) return B.kwartaalVan(vandaagIso());
    return state.jaar < huidigJaar ? 4 : 1;
  }
  function berekeningen() {
    const jaar = B.berekenJaar(state.boek);
    const ib = B.berekenInkomstenbelasting(jaar.winst, state.boek.instellingen, state.jaar);
    return { jaar, ib };
  }

  // ---------- render ----------
  function render() {
    if (!state.boek) return;
    const c = berekeningen();
    renderKpi(c);
    renderKwartalen(c.jaar);
    renderFilters();
    renderOmzet();
    renderKosten();
    renderIb(c);
  }

  function saldoTekst(saldo) {
    if (saldo > 0) return { klasse: "betalen", label: "te betalen" };
    if (saldo < 0) return { klasse: "ontvangen", label: "te ontvangen" };
    return { klasse: "", label: "geen btw" };
  }

  function statusBadge(k) {
    const tekst = { open: "Open", ingediend: "Ingediend", voldaan: k.saldo < 0 ? "Ontvangen" : "Voldaan" }[k.status];
    return `<span class="badge b-${k.status}">${tekst}</span>`;
  }

  function renderKpi({ jaar, ib }) {
    const kq = huidigKwartaal();
    const k = jaar.kwartalen[kq - 1];
    const s = saldoTekst(k.saldo);
    let sub;
    if (k.voldaan) sub = k.saldo < 0 ? "Ontvangen" : "Voldaan";
    else if (k.ingediend) sub = "Ingediend, nog " + (k.saldo < 0 ? "te ontvangen" : "te betalen");
    else sub = "Aangifte uiterlijk " + datumNl(B.deadline(state.jaar, kq));
    const winstKlasse = jaar.winst < 0 ? "negatief" : "";
    const extra = Number(state.boek.instellingen.extraWinst) || 0;

    $("kpi").innerHTML =
      `<div class="kpi"><div class="kpi-label">Btw Q${kq} ${state.jaar} · ${s.label}</div>` +
        `<div class="kpi-waarde ${s.klasse}">${euro(Math.abs(k.saldo))}</div><div class="kpi-sub">${esc(sub)}</div></div>` +
      `<div class="kpi"><div class="kpi-label">Totale omzet ${state.jaar}</div>` +
        `<div class="kpi-waarde">${euro(jaar.omzetNetto)}</div><div class="kpi-sub">excl. btw</div></div>` +
      `<div class="kpi"><div class="kpi-label">Geschatte winst</div>` +
        `<div class="kpi-waarde ${winstKlasse}">${euro(jaar.winst)}</div><div class="kpi-sub">omzet − kosten (${euro(jaar.kostenNetto)})</div></div>` +
      `<div class="kpi"><div class="kpi-label">Indicatie inkomstenbelasting</div>` +
        `<div class="kpi-waarde">${euro(ib.inkomstenbelasting)}</div>` +
        `<div class="kpi-sub">+ Zvw ${euro(ib.zvw)} · totaal ${euro(ib.totaal)}${extra ? " (incl. prognose)" : ""}</div></div>`;
  }

  function kwartaalKaart(k, huidig, start) {
    const q = k.kwartaal;
    const s = saldoTekst(k.saldo);
    const tariefRegels = [21, 9, 0]
      .filter((t) => k.perTarief[t] && (k.perTarief[t].netto !== 0 || k.perTarief[t].btw !== 0))
      .map((t) => `<dt>Omzet ${t}%</dt><dd>${euro(k.perTarief[t].netto)}${t ? ` · btw ${euro(k.perTarief[t].btw)}` : ""}</dd>`)
      .join("");
    const verlegd = k.berekend.verlegd.aantal ? k.berekend.verlegd : null;
    const verlegdRegels = verlegd
      ? `<dt><span class="rubriek">4b</span>Verlegd (21%), omzet</dt><dd>${euro(verlegd.netto)}</dd>` +
        `<dt class="sub">in aangifte, hele euro's</dt><dd class="sub">${euroHeel(verlegd.nettoHeleEuros)}</dd>` +
        `<dt><span class="rubriek">4b</span>Verlegde btw 21%</dt><dd>${euro(verlegd.btw)}</dd>`
      : "";
    const voorStart = k.berekend.voorbelastingVoorStart
      ? `<dt class="sub">waarvan vóór startdatum</dt><dd class="sub">${euro(k.berekend.voorbelastingVoorStart)}</dd>` : "";
    const aangegeven = k.aangegeven
      ? `<dt>Aangegeven bij Belastingdienst</dt><dd>${euro(k.aangegeven.btwOmzet)} − ${euro(k.aangegeven.voorbelasting)}</dd>` : "";
    const afwijking = k.afwijking
      ? `<div class="afwijking" role="note">Administratie wijkt ${euro(Math.abs(k.afwijking))} af van de aangifte (${k.afwijking > 0 ? "meer te betalen" : "minder te betalen"}).</div>` : "";
    const bron = k.bron === "aangifte" ? `<div class="deadline">Cijfers komen uit de aangifte; geen regels ingevoerd voor dit kwartaal.</div>` : "";
    const startNoot = q === start && state.boek.instellingen.startdatum.startsWith(String(state.jaar))
      ? `<span class="badge b-start">startkwartaal</span>` : "";

    return `<article class="kaart kw${huidig ? " huidig" : ""}" aria-label="Kwartaal ${q}">
      <div class="kw-kop"><div><span class="kw-titel">Q${q}</span><span class="kw-periode">${MAANDEN[q - 1]}${startNoot}</span></div>${statusBadge(k)}</div>
      <div class="deadline">${k.ingediend ? "Aangifte ingediend" + (state.boek.aangiften[q]?.datum ? " op " + datumNl(state.boek.aangiften[q].datum) : "") : "Aangifte uiterlijk " + datumNl(B.deadline(state.jaar, q))}</div>
      <dl class="regels">
        ${tariefRegels}
        ${verlegdRegels}
        <dt><span class="rubriek">5a</span>Verschuldigde btw</dt><dd>${euro(k.berekend.btwOmzet)}</dd>
        ${verlegd ? `<dt class="sub">waarvan verlegd</dt><dd class="sub">${euro(verlegd.btw)}</dd>` : ""}
        <dt><span class="rubriek">5b</span>Af: voorbelasting</dt><dd>${euro(k.berekend.voorbelasting)}</dd>
        ${verlegd ? `<dt class="sub">waarvan verlegd</dt><dd class="sub">${euro(verlegd.btw)}</dd>` : ""}
        ${voorStart}${aangegeven}
      </dl>
      ${afwijking}${bron}
      <div class="saldo"><span class="saldo-label">Saldo ${s.label}</span><span class="saldo-bedrag ${s.klasse}">${euro(Math.abs(k.saldo))}</span></div>
      <div class="kw-onder">
        <label class="vink"><input type="checkbox" data-status="ingediend" data-kw="${q}"${k.ingediend ? " checked" : ""}> Reeds aangegeven bij Belastingdienst</label>
        <label class="vink"><input type="checkbox" data-status="voldaan" data-kw="${q}"${k.voldaan ? " checked" : ""}> ${k.saldo < 0 ? "Teruggekregen" : "Voldaan"}</label>
        <div class="acties"><button class="btn btn-ghost btn-klein" type="button" data-actie="aangifte" data-kw="${q}">Aangifte vastleggen</button></div>
      </div>
    </article>`;
  }

  function renderKwartalen(jaar) {
    const huidig = huidigKwartaal();
    const start = startKwartaal();
    let html = jaar.kwartalen.map((k) => kwartaalKaart(k, k.kwartaal === huidig && state.jaar === huidigJaar, start)).join("");
    $("kwartalen").innerHTML = html;
  }

  function renderFilters() {
    for (const tabel of ["omzet", "kosten"]) {
      const el = document.querySelector(`[data-filters="${tabel}"]`);
      el.innerHTML = [0, 1, 2, 3, 4].map((q) =>
        `<button class="chip-knop" type="button" data-filter="${q}" data-tabel="${tabel}" aria-pressed="${state.filter[tabel] === q}">${q ? "Q" + q : "Alle"}</button>`).join("");
    }
  }

  const perDatum = (a, b) => String(b.datum).localeCompare(String(a.datum));

  function renderOmzet() {
    const f = state.filter.omzet;
    const rijen = state.boek.omzet.filter((r) => !f || r.kwartaal === f).sort(perDatum);
    let netto = 0, btw = 0;
    $("tbody-omzet").innerHTML = rijen.map((r) => {
      const b = Math.round(Math.round(r.netto * 100) * r.tarief / 100) / 100;
      netto += Math.round(r.netto * 100); btw += Math.round(b * 100);
      const label = esc(r.omschrijving);
      return `<tr><td data-label="Datum">${datumNl(r.datum)}</td>` +
        `<td data-label="Omschrijving">${label}${r.bron ? '<span class="badge b-bron">factuur</span>' : ""}${r.klant ? `<span class="klein">${esc(r.klant)}</span>` : ""}</td>` +
        `<td data-label="Kwartaal">Q${r.kwartaal}</td><td class="r" data-label="Excl. btw">${euro(r.netto)}</td>` +
        `<td class="r" data-label="Tarief">${r.tarief}%</td><td class="r" data-label="Btw">${euro(b)}</td>` +
        `<td class="acties-cel"><button class="btn btn-ghost btn-klein" type="button" data-actie="bewerk-omzet" data-id="${esc(r.id)}" aria-label="Bewerk ${label}">Bewerk</button> ` +
        `<button class="btn btn-ghost btn-klein btn-gevaar" type="button" data-actie="verwijder-omzet" data-id="${esc(r.id)}" aria-label="Verwijder ${label}">Verwijder</button></td></tr>`;
    }).join("");
    $("tfoot-omzet").innerHTML = rijen.length
      ? `<tr><td colspan="3" data-label="Totaal">Totaal${f ? " Q" + f : ""}</td><td class="r" data-label="Excl. btw">${euro(netto / 100)}</td><td></td><td class="r" data-label="Btw">${euro(btw / 100)}</td><td></td></tr>` : "";
    $("leeg-omzet").hidden = rijen.length > 0;
  }

  function renderKosten() {
    const f = state.filter.kosten;
    const rijen = state.boek.kosten.filter((r) => !f || r.kwartaal === f).sort(perDatum);
    let netto = 0, btw = 0;
    $("tbody-kosten").innerHTML = rijen.map((r) => {
      netto += Math.round(r.netto * 100); btw += Math.round(r.btw * 100);
      const label = esc(r.omschrijving);
      return `<tr><td data-label="Datum">${datumNl(r.datum)}</td>` +
        `<td data-label="Omschrijving">${label}${r.voorStart ? '<span class="badge b-start">vóór start</span>' : ""}${r.verlegd ? '<span class="badge b-verlegd">verlegd (21%)</span>' : ""}</td>` +
        `<td data-label="Kwartaal">Q${r.kwartaal}</td><td class="r" data-label="Excl. btw">${euro(r.netto)}</td>` +
        `<td class="r" data-label="Voorbelasting">${euro(r.btw)}${r.verlegd ? `<span class="klein">(${euro(Math.round(Math.round(r.netto * 100) * B.VERLEGD_TARIEF / 100) / 100)} verlegd)</span>` : ""}</td>` +
        `<td class="acties-cel"><button class="btn btn-ghost btn-klein" type="button" data-actie="bewerk-kosten" data-id="${esc(r.id)}" aria-label="Bewerk ${label}">Bewerk</button> ` +
        `<button class="btn btn-ghost btn-klein btn-gevaar" type="button" data-actie="verwijder-kosten" data-id="${esc(r.id)}" aria-label="Verwijder ${label}">Verwijder</button></td></tr>`;
    }).join("");
    $("tfoot-kosten").innerHTML = rijen.length
      ? `<tr><td colspan="3" data-label="Totaal">Totaal${f ? " Q" + f : ""}</td><td class="r" data-label="Excl. btw">${euro(netto / 100)}</td><td class="r" data-label="Voorbelasting">${euro(btw / 100)}</td><td></td></tr>` : "";
    $("leeg-kosten").hidden = rijen.length > 0;
  }

  function renderIb({ jaar, ib }) {
    const w = $("ib-waarschuwing");
    w.hidden = ib.exact;
    if (!ib.exact) w.textContent = `Voor ${state.jaar} zijn nog geen tarieven en aftrekposten ingebouwd; de berekening gebruikt die van 2026.`;

    const i = state.boek.instellingen;
    const form = $("form-instellingen");
    if (!form.contains(document.activeElement)) {
      $("in-start").value = i.startdatum;
      $("in-uren").checked = !!i.urencriterium;
      $("in-starter").checked = !!i.starter;
      $("in-extra").value = i.extraWinst || "";
    }

    const rij = (label, waarde, klasse) => `<tr${klasse ? ` class="${klasse}"` : ""}><td>${label}</td><td class="r">${waarde}</td></tr>`;
    const sectie = (t) => `<tr class="sectie"><td colspan="2">${t}</td></tr>`;
    const min = (n) => `<span class="min">− ${euro(n)}</span>`;
    let html = sectie("Winst") +
      rij("Omzet excl. btw", euro(jaar.omzetNetto)) +
      rij("Kosten excl. btw", min(jaar.kostenNetto)) +
      (ib.winst !== jaar.winst ? rij("Verwachte extra winst", euro(ib.winst - jaar.winst)) : "") +
      rij("<strong>Fiscale winst</strong>", `<strong>${euro(ib.winst)}</strong>`) +
      sectie("Ondernemersaftrek") +
      rij("Zelfstandigenaftrek", min(ib.zelfstandigenaftrek)) +
      rij("Startersaftrek", min(ib.startersaftrek)) +
      rij("MKB-winstvrijstelling 12,7%", min(ib.mkbVrijstelling)) +
      rij("<strong>Belastbare winst</strong>", `<strong>${euro(ib.belastbaar)}</strong>`) +
      sectie("Inkomstenbelasting box 1");
    for (const s of ib.schijven) {
      const tot = s.tot === Infinity ? "daarboven" : "tot " + euro(s.tot);
      html += rij(`${pct(s.tarief)} over ${euro(s.inkomen)} <span class="klein">schijf ${tot}</span>`, euro(s.belasting));
    }
    html += rij("Heffing vóór kortingen", euro(ib.bruto)) +
      rij("Algemene heffingskorting", min(ib.algemeneHeffingskorting)) +
      rij("Arbeidskorting", min(ib.arbeidskorting)) +
      rij("<strong>Inkomstenbelasting</strong>", `<strong>${euro(ib.inkomstenbelasting)}</strong>`) +
      rij("Bijdrage Zvw 4,85%", euro(ib.zvw)) +
      rij("Totaal te betalen (indicatie)", euro(ib.totaal), "totaal") +
      rij(`<span class="klein">Gemiddeld ${pct(ib.effectief)} van de winst</span>`, "");
    $("ib-tabel").innerHTML = html;

    $("ib-noten").innerHTML =
      "<li>Indicatie op basis van de winst tot nu toe, voor een ondernemer onder de AOW-leeftijd zonder partner, overige inkomsten of andere aftrekposten (KIA, FOR, hypotheek).</li>" +
      "<li>Tarieven en bedragen 2026: Belastingdienst. De heffing is inclusief premies volksverzekeringen (35,75% in de eerste schijf). De Zvw-bijdrage wordt apart opgelegd.</li>" +
      "<li>Investeringen boven € 450 per stuk schrijf je af in plaats van ze in één keer als kosten te nemen; houd daar rekening mee bij het invoeren van kosten.</li>" +
      "<li>Geen belastingadvies. Laat de definitieve aangifte controleren door een boekhouder of de Belastingdienst.</li>";
  }

  // ---------- tabs ----------
  const TABS = ["btw", "omzet", "kosten", "ib"];
  function kiesTab(naam, focus) {
    state.tab = naam;
    for (const t of TABS) {
      const actief = t === naam;
      const knop = $("tab-" + t);
      knop.setAttribute("aria-selected", String(actief));
      knop.tabIndex = actief ? 0 : -1;
      $("paneel-" + t).hidden = !actief;
      if (actief && focus) knop.focus();
    }
  }

  // ---------- formulieren ----------
  function toonForm(id) {
    const f = $(id);
    f.hidden = false;
    f.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function omzetHint() {
    const netto = Number($("oz-netto").value) || 0;
    const t = Number($("oz-tarief").value) || 0;
    const btw = Math.round(netto * t) / 100;
    $("oz-hint").textContent = netto ? `Btw ${euro(btw)} · totaal incl. btw ${euro(netto + btw)}` : "";
  }

  function openOmzetForm(r) {
    $("oz-titel").textContent = r ? "Omzet bewerken" : "Omzet toevoegen";
    $("oz-id").value = r ? r.id : "";
    $("oz-datum").value = r ? r.datum : (state.jaar === huidigJaar ? vandaagIso() : `${state.jaar}-01-01`);
    $("oz-datum").min = `${state.jaar}-01-01`; $("oz-datum").max = `${state.jaar}-12-31`;
    $("oz-omschrijving").value = r ? r.omschrijving : "";
    $("oz-klant").value = r ? r.klant || "" : "";
    $("oz-netto").value = r ? r.netto : "";
    $("oz-tarief").value = r ? String(r.tarief) : "21";
    omzetHint();
    toonForm("form-omzet");
    $("oz-omschrijving").focus();
  }

  function kostenHint() {
    const d = $("ko-datum").value;
    const start = state.boek.instellingen.startdatum;
    const delen = [];
    if ($("ko-tarief").value === "verlegd") {
      const netto = Number($("ko-netto").value) || 0;
      const btw = Math.round(Math.round(netto * 100) * B.VERLEGD_TARIEF / 100) / 100;
      delen.push(`Btw verlegd: je betaalt € 0,00 btw aan de leverancier. Het dashboard rekent ${euro(btw)} (21%) mee in rubriek 4b/5a en trekt dezelfde btw af in 5b.`);
    }
    if ($("ko-voorstart").checked) delen.push(`Telt mee in de btw-aangifte van Q${$("ko-kwartaal").value}.`);
    else if (d && d < start) delen.push(`Deze datum ligt vóór de startdatum (${datumNl(start)}); vink "voorbelasting van vóór de startdatum" aan om de btw mee te nemen.`);
    $("ko-hint").textContent = delen.join(" ");
  }

  function kostenBtwAuto() {
    const t = $("ko-tarief").value;
    const verlegd = t === "verlegd";
    $("ko-btw").readOnly = verlegd;
    if (verlegd) { $("ko-btw").value = "0.00"; kostenHint(); return; }
    if (t === "") return;
    const netto = Number($("ko-netto").value) || 0;
    $("ko-btw").value = netto ? (Math.round(netto * Number(t)) / 100).toFixed(2) : "";
  }

  function openKostenForm(r) {
    $("ko-titel").textContent = r ? "Kosten bewerken" : "Kosten toevoegen";
    $("ko-id").value = r ? r.id : "";
    $("ko-datum").value = r ? r.datum : (state.jaar === huidigJaar ? vandaagIso() : `${state.jaar}-01-01`);
    $("ko-datum").min = `${state.jaar - 1}-01-01`; $("ko-datum").max = `${state.jaar}-12-31`;
    $("ko-omschrijving").value = r ? r.omschrijving : "";
    $("ko-netto").value = r ? r.netto : "";
    $("ko-tarief").value = r ? (r.verlegd ? "verlegd" : "") : "21";
    $("ko-btw").value = r ? r.btw : "";
    $("ko-btw").readOnly = !!(r && r.verlegd);
    $("ko-voorstart").checked = r ? !!r.voorStart : false;
    $("ko-kwartaal").value = String(r ? r.kwartaal : startKwartaal());
    $("ko-kw-veld").hidden = !$("ko-voorstart").checked;
    state.voorStartHandmatig = !!r;
    kostenHint();
    toonForm("form-kosten");
    $("ko-omschrijving").focus();
  }

  function openAangifteForm(q) {
    const k = berekeningen().jaar.kwartalen[q - 1];
    const a = state.boek.aangiften[q] || {};
    const bron = k.aangegeven || k.berekend;
    $("af-titel").textContent = `Aangifte Q${q} ${state.jaar} vastleggen`;
    $("af-kw").value = q;
    $("af-datum").value = a.datum || "";
    $("af-omzet").value = a.omzetNetto ?? bron.omzetNetto;
    $("af-btwomzet").value = a.btwOmzet ?? bron.btwOmzet;
    $("af-voorbel").value = a.voorbelasting ?? bron.voorbelasting;
    $("af-kosten").value = a.kostenNetto ?? (k.aangegeven ? k.aangegeven.kostenNetto : k.berekend.kostenNetto);
    $("af-notitie").value = a.notitie || "";
    $("af-ingediend").checked = a.ingediend !== undefined ? !!a.ingediend : true;
    $("af-voldaan").checked = !!a.voldaan;
    toonForm("form-aangifte");
    $("af-datum").focus();
  }

  const num = (id) => $(id).value;

  // ---------- facturen importeren ----------
  function nettoVanDocument(doc) {
    const sub = (doc.regels || []).reduce((s, r) => s + (Number(r.aantal) || 0) * (Number(r.stukprijs) || 0), 0);
    const k = doc.korting || {};
    let korting = 0;
    if (k.type === "bedrag") korting = Number(k.waarde) || 0;
    else if (k.type === "percentage") korting = (sub * (Number(k.waarde) || 0)) / 100;
    return Math.round(Math.max(0, sub - Math.min(korting, sub)) * 100) / 100;
  }

  async function importeerFacturen() {
    const knop = $("import-facturen");
    knop.disabled = true;
    try {
      const { documenten } = await verzoek("/api/documenten");
      const items = [];
      for (const d of documenten || []) {
        if (d.type !== "factuur" || String(d.datum || "").slice(0, 4) !== String(state.jaar)) continue;
        const netto = nettoVanDocument(d);
        const tarief = d.btwVerlegd ? 0 : Number(d.btwTarief ?? 21);
        if (!netto || ![0, 9, 21].includes(tarief)) continue;
        const kl = d.klant || {};
        items.push({
          bron: "factuur:" + d.nummer,
          datum: d.datum,
          omschrijving: `Factuur ${d.nummer}${d.btwVerlegd ? " (btw verlegd)" : ""}`,
          klant: kl.bedrijf || kl.contact || "",
          netto, tarief,
        });
      }
      if (!items.length) { toon(`Geen facturen van ${state.jaar} gevonden in de factuurgenerator.`); return; }
      const { info } = await opslaan("omzet.importeer", { items });
      toon(`${info.toegevoegd} factuur/facturen toegevoegd, ${info.overgeslagen} al aanwezig${info.ongeldig ? `, ${info.ongeldig} overgeslagen` : ""}.`);
    } catch (e) {
      toon(e.message || "Importeren mislukt.", "fout");
    } finally {
      knop.disabled = false;
    }
  }

  // ---------- events ----------
  document.addEventListener("click", (e) => {
    const el = e.target.closest("button");
    if (!el) return;

    if (el.dataset.tab) return kiesTab(el.dataset.tab);
    if (el.dataset.filter !== undefined && el.dataset.tabel) {
      state.filter[el.dataset.tabel] = Number(el.dataset.filter);
      renderFilters(); renderOmzet(); renderKosten();
      return;
    }
    if (el.dataset.sluit) { $(el.dataset.sluit).hidden = true; return; }

    switch (el.dataset.actie) {
      case "aangifte": openAangifteForm(Number(el.dataset.kw)); break;
      case "bewerk-omzet": openOmzetForm(state.boek.omzet.find((r) => r.id === el.dataset.id)); break;
      case "bewerk-kosten": openKostenForm(state.boek.kosten.find((r) => r.id === el.dataset.id)); break;
      case "verwijder-omzet":
        if (confirm("Deze omzetregel verwijderen?")) probeer(() => opslaan("omzet.verwijder", { id: el.dataset.id }).then(() => toon("Verwijderd.")));
        break;
      case "verwijder-kosten":
        if (confirm("Deze kostenregel verwijderen?")) probeer(() => opslaan("kosten.verwijder", { id: el.dataset.id }).then(() => toon("Verwijderd.")));
        break;
    }
  });

  document.addEventListener("change", (e) => {
    const cb = e.target;
    if (!cb.dataset || !cb.dataset.status) return;
    const q = Number(cb.dataset.kw);
    const kaart = cb.closest(".kw");
    let ingediend = kaart.querySelector('[data-status="ingediend"]').checked;
    let voldaan = kaart.querySelector('[data-status="voldaan"]').checked;
    if (cb.dataset.status === "voldaan" && voldaan) ingediend = true;
    if (cb.dataset.status === "ingediend" && !ingediend) voldaan = false;
    probeer(() => opslaan("aangifte.status", { kwartaal: q, ingediend, voldaan })).then((r) => { if (!r) render(); });
  });

  $("tab-btw").parentElement.addEventListener("keydown", (e) => {
    const i = TABS.indexOf(state.tab);
    if (e.key === "ArrowRight") { e.preventDefault(); kiesTab(TABS[(i + 1) % TABS.length], true); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); kiesTab(TABS[(i + TABS.length - 1) % TABS.length], true); }
    else if (e.key === "Home") { e.preventDefault(); kiesTab(TABS[0], true); }
    else if (e.key === "End") { e.preventDefault(); kiesTab(TABS[TABS.length - 1], true); }
  });

  $("nieuw-omzet").addEventListener("click", () => openOmzetForm(null));
  $("nieuw-kosten").addEventListener("click", () => openKostenForm(null));
  $("import-facturen").addEventListener("click", importeerFacturen);
  $("af-annuleer").addEventListener("click", () => { $("form-aangifte").hidden = true; });
  $("af-vul").addEventListener("click", () => {
    const k = berekeningen().jaar.kwartalen[Number($("af-kw").value) - 1].berekend;
    $("af-omzet").value = k.omzetNetto; $("af-btwomzet").value = k.btwOmzet;
    $("af-voorbel").value = k.voorbelasting; $("af-kosten").value = k.kostenNetto;
  });

  $("oz-netto").addEventListener("input", omzetHint);
  $("oz-tarief").addEventListener("change", omzetHint);

  $("ko-netto").addEventListener("input", kostenBtwAuto);
  $("ko-tarief").addEventListener("change", kostenBtwAuto);
  $("ko-kwartaal").addEventListener("change", kostenHint);
  $("ko-voorstart").addEventListener("change", () => {
    state.voorStartHandmatig = true;
    $("ko-kw-veld").hidden = !$("ko-voorstart").checked;
    kostenHint();
  });
  $("ko-datum").addEventListener("change", () => {
    if (!state.voorStartHandmatig && state.boek) {
      const voor = $("ko-datum").value && $("ko-datum").value < state.boek.instellingen.startdatum;
      $("ko-voorstart").checked = !!voor;
      $("ko-kw-veld").hidden = !voor;
      if (voor) $("ko-kwartaal").value = String(startKwartaal());
    }
    kostenHint();
  });

  $("form-omzet").addEventListener("submit", (e) => {
    e.preventDefault();
    const item = {
      id: num("oz-id") || undefined, datum: num("oz-datum"), omschrijving: num("oz-omschrijving"),
      klant: num("oz-klant"), netto: num("oz-netto"), tarief: Number(num("oz-tarief")),
    };
    probeer(() => opslaan("omzet.opslaan", { item })).then((r) => { if (r) { $("form-omzet").hidden = true; toon("Omzet opgeslagen."); } });
  });

  $("form-kosten").addEventListener("submit", (e) => {
    e.preventDefault();
    const item = {
      id: num("ko-id") || undefined, datum: num("ko-datum"), omschrijving: num("ko-omschrijving"),
      netto: num("ko-netto"), btw: num("ko-btw"), voorStart: $("ko-voorstart").checked, kwartaal: Number(num("ko-kwartaal")),
      verlegd: num("ko-tarief") === "verlegd",
    };
    probeer(() => opslaan("kosten.opslaan", { item })).then((r) => { if (r) { $("form-kosten").hidden = true; toon("Kosten opgeslagen."); } });
  });

  $("form-aangifte").addEventListener("submit", (e) => {
    e.preventDefault();
    const aangifte = {
      datum: num("af-datum"), omzetNetto: num("af-omzet"), btwOmzet: num("af-btwomzet"), voorbelasting: num("af-voorbel"),
      kostenNetto: num("af-kosten"), notitie: num("af-notitie"), ingediend: $("af-ingediend").checked, voldaan: $("af-voldaan").checked,
    };
    probeer(() => opslaan("aangifte.opslaan", { kwartaal: Number(num("af-kw")), aangifte })).then((r) => { if (r) { $("form-aangifte").hidden = true; toon("Aangifte vastgelegd."); } });
  });

  $("form-instellingen").addEventListener("submit", (e) => {
    e.preventDefault();
    const instellingen = {
      startdatum: num("in-start"), urencriterium: $("in-uren").checked, starter: $("in-starter").checked, extraWinst: num("in-extra") || 0,
    };
    probeer(() => opslaan("instellingen.opslaan", { instellingen })).then((r) => { if (r) toon("Uitgangspunten opgeslagen."); });
  });

  $("jaar-select").addEventListener("change", () => {
    state.jaar = Number($("jaar-select").value);
    state.boek = null;
    for (const f of ["form-omzet", "form-kosten", "form-aangifte"]) $(f).hidden = true;
    laad();
  });

  $("logout-knop").addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    location.href = "/admin/login/";
  });

  // ---------- start ----------
  const jaren = [];
  for (let j = 2026; j <= Math.max(2026, huidigJaar); j++) jaren.push(j);
  $("jaar-select").innerHTML = jaren.map((j) => `<option value="${j}"${j === state.jaar ? " selected" : ""}>${j}</option>`).join("");
  laad();
})();
