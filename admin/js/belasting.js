// Rekenregels btw (per kwartaal) en inkomstenbelasting-indicatie voor een eenmanszaak.
// Browser: window.Belasting. Node: require() (zie scripts/test-belasting.mjs).
// Bedragen in de data zijn euro's; intern wordt in centen gerekend tegen afrondingsfouten.
(function (root) {
  "use strict";

  // Belastingparameters. Bronnen: Belastingdienst / Belastingplan 2026.
  // Voor andere jaren is niets bekend; dan geldt 2026 met een waarschuwing in de UI.
  const PARAMS = {
    2026: {
      zelfstandigenaftrek: 1200,
      startersaftrek: 2123,
      mkbVrijstelling: 0.127,
      schijven: [
        { tot: 38883, tarief: 0.3575 },
        { tot: 78426, tarief: 0.3756 },
        { tot: Infinity, tarief: 0.495 },
      ],
      algemeneHeffingskorting: { max: 3115, drempel: 29736, afbouw: 0.06398 },
      arbeidskorting: [
        { tot: 11965, basis: 0, perc: 0.08324, vanaf: 0 },
        { tot: 25845, basis: 996, perc: 0.31009, vanaf: 11965 },
        { tot: 45592, basis: 5300, perc: 0.0195, vanaf: 25845 },
        { tot: 132920, basis: 5685, perc: -0.0651, vanaf: 45592 },
      ],
      zvw: { perc: 0.0485, max: 79409 },
    },
  };
  const BASISJAAR = 2026;

  const naarCent = (euro) => Math.round((Number(euro) || 0) * 100);
  const naarEuro = (cent) => Math.round(cent) / 100;
  const rond = (euro) => naarEuro(naarCent(euro));

  function kwartaalVan(iso) {
    const m = Number(String(iso || "").slice(5, 7));
    return m >= 1 && m <= 12 ? Math.ceil(m / 3) : 0;
  }

  function parameters(jaar) {
    const exact = !!PARAMS[jaar];
    return { params: PARAMS[exact ? jaar : BASISJAAR], exact };
  }

  // Uiterste aangiftedatum: einde van de maand na afloop van het kwartaal.
  function deadline(jaar, q) {
    const maand = q * 3 + 1;
    const j = maand > 12 ? jaar + 1 : jaar;
    const m = maand > 12 ? 1 : maand;
    const laatste = new Date(Date.UTC(j, m, 0)).getUTCDate();
    return `${j}-${String(m).padStart(2, "0")}-${String(laatste).padStart(2, "0")}`;
  }

  function btwCent(nettoCent, tarief) {
    return Math.round((nettoCent * (Number(tarief) || 0)) / 100);
  }

  function berekenKwartaal(data, q) {
    const omzetRecs = (data.omzet || []).filter((r) => r.kwartaal === q);
    const kostenRecs = (data.kosten || []).filter((k) => k.kwartaal === q);

    const perTarief = { 21: { netto: 0, btw: 0 }, 9: { netto: 0, btw: 0 }, 0: { netto: 0, btw: 0 } };
    let omzetCent = 0, btwOmzetCent = 0;
    for (const r of omzetRecs) {
      const n = naarCent(r.netto);
      const b = btwCent(n, r.tarief);
      const slot = perTarief[r.tarief] || (perTarief[r.tarief] = { netto: 0, btw: 0 });
      slot.netto += n; slot.btw += b;
      omzetCent += n; btwOmzetCent += b;
    }
    let kostenCent = 0, voorbelastingCent = 0, voorStartCent = 0;
    for (const k of kostenRecs) {
      kostenCent += naarCent(k.netto);
      const b = naarCent(k.btw);
      voorbelastingCent += b;
      if (k.voorStart) voorStartCent += b;
    }

    const berekend = {
      omzetNetto: naarEuro(omzetCent),
      btwOmzet: naarEuro(btwOmzetCent),
      voorbelasting: naarEuro(voorbelastingCent),
      voorbelastingVoorStart: naarEuro(voorStartCent),
      kostenNetto: naarEuro(kostenCent),
      saldo: naarEuro(btwOmzetCent - voorbelastingCent),
    };
    for (const t of Object.keys(perTarief)) {
      perTarief[t] = { netto: naarEuro(perTarief[t].netto), btw: naarEuro(perTarief[t].btw) };
    }

    const a = (data.aangiften || {})[q] || {};
    const voldaan = !!a.voldaan;
    const ingediend = !!a.ingediend || voldaan;
    const heeftBedragen = ingediend && a.btwOmzet != null && a.voorbelasting != null;
    const aangegeven = heeftBedragen
      ? {
          omzetNetto: a.omzetNetto != null ? rond(a.omzetNetto) : berekend.omzetNetto,
          btwOmzet: rond(a.btwOmzet),
          voorbelasting: rond(a.voorbelasting),
          kostenNetto: a.kostenNetto != null ? rond(a.kostenNetto) : berekend.kostenNetto,
          saldo: naarEuro(naarCent(a.btwOmzet) - naarCent(a.voorbelasting)),
        }
      : null;

    const zonderRecords = !omzetRecs.length && !kostenRecs.length;
    // Is een kwartaal al ingediend maar niet in de administratie ingevoerd, dan telt de aangifte voor omzet/kosten.
    const bron = ingediend && zonderRecords && aangegeven ? "aangifte" : "administratie";
    const jaarOmzet = bron === "aangifte" ? aangegeven.omzetNetto : berekend.omzetNetto;
    const jaarKosten = bron === "aangifte" ? aangegeven.kostenNetto : berekend.kostenNetto;
    const gebruikt = aangegeven || berekend;

    return {
      kwartaal: q,
      status: voldaan ? "voldaan" : ingediend ? "ingediend" : "open",
      ingediend, voldaan,
      perTarief, berekend, aangegeven, bron,
      saldo: gebruikt.saldo,
      btwOmzet: gebruikt.btwOmzet,
      voorbelasting: gebruikt.voorbelasting,
      jaarOmzet, jaarKosten,
      afwijking: aangegeven && !zonderRecords ? naarEuro(naarCent(berekend.saldo) - naarCent(aangegeven.saldo)) : 0,
      aantalOmzet: omzetRecs.length,
      aantalKosten: kostenRecs.length,
    };
  }

  function berekenJaar(data) {
    const kwartalen = [1, 2, 3, 4].map((q) => berekenKwartaal(data, q));
    let omzet = 0, kosten = 0, nogAangeven = 0, nogTeBetalen = 0, saldo = 0;
    for (const k of kwartalen) {
      omzet += naarCent(k.jaarOmzet);
      kosten += naarCent(k.jaarKosten);
      saldo += naarCent(k.saldo);
      if (!k.ingediend) nogAangeven += naarCent(k.saldo);
      else if (!k.voldaan) nogTeBetalen += naarCent(k.saldo);
    }
    return {
      kwartalen,
      omzetNetto: naarEuro(omzet),
      kostenNetto: naarEuro(kosten),
      winst: naarEuro(omzet - kosten),
      btwSaldo: naarEuro(saldo),
      btwNogAangeven: naarEuro(nogAangeven),
      btwNogTeBetalen: naarEuro(nogTeBetalen),
    };
  }

  function arbeidskorting(arbeidsinkomen, p) {
    if (arbeidsinkomen <= 0) return 0;
    for (const s of p.arbeidskorting) {
      if (arbeidsinkomen <= s.tot) return Math.max(0, s.basis + s.perc * (arbeidsinkomen - s.vanaf));
    }
    return 0;
  }

  function algemeneHeffingskorting(inkomen, p) {
    const h = p.algemeneHeffingskorting;
    if (inkomen <= h.drempel) return h.max;
    return Math.max(0, h.max - h.afbouw * (inkomen - h.drempel));
  }

  // opties: { urencriterium, starter, extraWinst }. Indicatie voor een ondernemer onder de AOW-leeftijd
  // zonder overige inkomsten of aftrekposten (geen KIA/FOR/hypotheek/partner).
  function berekenInkomstenbelasting(winstEuro, opties, jaar) {
    const { params: p, exact } = parameters(jaar || BASISJAAR);
    const o = opties || {};
    const winst = rond((Number(winstEuro) || 0) + (Number(o.extraWinst) || 0));
    const pos = Math.max(0, winst);

    const zelfstandigenaftrek = o.urencriterium ? Math.min(p.zelfstandigenaftrek, pos) : 0;
    const startersaftrek = o.urencriterium && o.starter ? Math.min(p.startersaftrek, pos - zelfstandigenaftrek) : 0;
    const winstNaAftrek = pos - zelfstandigenaftrek - startersaftrek;
    const mkbVrijstelling = rond(winstNaAftrek * p.mkbVrijstelling);
    const belastbaar = Math.round(winstNaAftrek - mkbVrijstelling);

    let rest = belastbaar, van = 0, bruto = 0;
    const schijven = [];
    for (const s of p.schijven) {
      const deel = Math.max(0, Math.min(rest, s.tot - van));
      schijven.push({ van, tot: s.tot, tarief: s.tarief, inkomen: deel, belasting: rond(deel * s.tarief) });
      bruto += deel * s.tarief;
      rest -= deel; van = s.tot;
      if (rest <= 0) break;
    }
    bruto = rond(bruto);

    const ahk = belastbaar > 0 ? rond(algemeneHeffingskorting(belastbaar, p)) : 0;
    const ak = rond(arbeidskorting(winstNaAftrek, p));
    const inkomstenbelasting = Math.max(0, rond(bruto - ahk - ak));

    const zvwGrondslag = Math.min(belastbaar, p.zvw.max);
    const zvw = rond(Math.max(0, zvwGrondslag) * p.zvw.perc);
    const totaal = rond(inkomstenbelasting + zvw);

    return {
      exact, winst,
      zelfstandigenaftrek, startersaftrek, winstNaAftrek, mkbVrijstelling, belastbaar,
      schijven, bruto, algemeneHeffingskorting: ahk, arbeidskorting: ak,
      inkomstenbelasting, zvw, totaal,
      effectief: pos > 0 ? totaal / pos : 0,
    };
  }

  const api = {
    PARAMS, kwartaalVan, deadline, parameters, rond,
    berekenKwartaal, berekenJaar, berekenInkomstenbelasting,
    arbeidskorting, algemeneHeffingskorting,
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Belasting = api;
})(typeof self !== "undefined" ? self : this);
