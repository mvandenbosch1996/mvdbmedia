// Rekentests voor admin/js/belasting.js, de validatie in functions/_lib/boekhouding.js en de slimme scan (/api/scan-bon).
//   node scripts/test-belasting.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B = createRequire(import.meta.url)(path.join(ROOT, 'admin/js/belasting.js'));
const V = await import(pathToFileURL(path.join(ROOT, 'functions/_lib/boekhouding.js')).href);

let fouten = 0;
const is = (naam, ok, extra = '') => { if (!ok) { fouten++; console.log(`  ✗ ${naam} ${extra}`); } };
const gelijk = (naam, a, b) => is(naam, a === b, `(was ${JSON.stringify(a)}, verwacht ${JSON.stringify(b)})`);

// ---- kwartalen & deadlines
gelijk('Q van 15 juni', B.kwartaalVan('2026-06-15'), 2);
gelijk('Q van 1 jan', B.kwartaalVan('2026-01-01'), 1);
gelijk('Q van 31 dec', B.kwartaalVan('2026-12-31'), 4);
gelijk('deadline Q1', B.deadline(2026, 1), '2026-04-30');
gelijk('deadline Q2', B.deadline(2026, 2), '2026-07-31');
gelijk('deadline Q3', B.deadline(2026, 3), '2026-10-31');
gelijk('deadline Q4', B.deadline(2026, 4), '2027-01-31');

// ---- btw per kwartaal, incl. voorbelasting van vóór de start
const data = {
  omzet: [
    { kwartaal: 2, netto: 1000, tarief: 21 },
    { kwartaal: 2, netto: 200, tarief: 9 },
    { kwartaal: 2, netto: 300, tarief: 0 },
    { kwartaal: 3, netto: 0.1, tarief: 21 },
  ],
  kosten: [
    { kwartaal: 2, netto: 400, btw: 84, voorStart: true },
    { kwartaal: 2, netto: 100, btw: 21, voorStart: false },
    { kwartaal: 3, netto: 1000, btw: 210, voorStart: false },
  ],
  aangiften: {},
};
let k2 = B.berekenKwartaal(data, 2);
gelijk('Q2 omzet netto', k2.berekend.omzetNetto, 1500);
gelijk('Q2 btw omzet', k2.berekend.btwOmzet, 228);
gelijk('Q2 voorbelasting', k2.berekend.voorbelasting, 105);
gelijk('Q2 waarvan vóór start', k2.berekend.voorbelastingVoorStart, 84);
gelijk('Q2 saldo te betalen', k2.saldo, 123);
gelijk('Q3 saldo te ontvangen', B.berekenKwartaal(data, 3).saldo, -209.98);
gelijk('Q2 status open', k2.status, 'open');

// ---- btw verlegd: 21% erbij in 5a én 5b, saldo ongewijzigd; bestaande records zonder kenmerk blijven regulier
{
  const vd = {
    omzet: [{ kwartaal: 3, netto: 1000, tarief: 21 }],
    kosten: [
      { kwartaal: 3, netto: 123.99, btw: 0, verlegd: true },
      { kwartaal: 3, netto: 50, btw: 0, verlegd: true },
      { kwartaal: 3, netto: 200, btw: 0 },
      { kwartaal: 3, netto: 100, btw: 21 },
    ],
    aangiften: {},
  };
  const zonder = { omzet: vd.omzet, kosten: vd.kosten.filter((k) => !k.verlegd), aangiften: {} };
  const k3 = B.berekenKwartaal(vd, 3);
  gelijk('oude verlegd-records (zonder regio) tellen als EU/4b', k3.verlegd.eu.netto, 173.99);
  gelijk('oude verlegd-records: niets in 4a', k3.verlegd.nonEu.aantal, 0);
  gelijk('verlegd hele euro\'s (afgekapt)', k3.verlegd.eu.nettoHeleEuros, 173);
  gelijk('verlegde btw 21%', k3.verlegd.btw, 36.54);
  gelijk('verlegd aantal', k3.verlegd.aantal, 2);
  gelijk('5a = omzetbtw + verlegd', k3.berekend.btwOmzet, B.rond(210 + 36.54));
  gelijk('5b = bon-voorbelasting + verlegd', k3.berekend.voorbelasting, B.rond(21 + 36.54));
  gelijk('saldo ongewijzigd door verlegging', k3.saldo, B.berekenKwartaal(zonder, 3).saldo);
  gelijk('0%-record zonder kenmerk blijft regulier', B.berekenKwartaal({ omzet: [], kosten: [{ kwartaal: 3, netto: 40, btw: 0 }], aangiften: {} }, 3).verlegd.aantal, 0);
  gelijk('kosten tellen volledig mee in winst', k3.berekend.kostenNetto, 473.99);
}

// ---- verlegd gesplitst: 4a (buiten EU) en 4b (EU), samen in 5a én 5b, saldo ongewijzigd
{
  const gem = {
    omzet: [{ kwartaal: 3, netto: 1000, tarief: 21 }],
    kosten: [
      { kwartaal: 3, netto: 18.5, btw: 0, verlegd: true, verlegdRegio: 'non_eu' },
      { kwartaal: 3, netto: 18.5, btw: 0, verlegd: true, verlegdRegio: 'non_eu' },
      { kwartaal: 3, netto: 90.99, btw: 0, verlegd: true, verlegdRegio: 'non_eu' },
      { kwartaal: 3, netto: 200, btw: 0, verlegd: true, verlegdRegio: 'eu' },
      { kwartaal: 3, netto: 50, btw: 0, verlegd: true },
      { kwartaal: 3, netto: 75, btw: 0 },
      { kwartaal: 3, netto: 100, btw: 21 },
    ],
    aangiften: {},
  };
  const q = B.berekenKwartaal(gem, 3);
  gelijk('4a netto', q.verlegd.nonEu.netto, 127.99);
  gelijk('4a hele euro\'s', q.verlegd.nonEu.nettoHeleEuros, 127);
  gelijk('4a btw (3,89 + 3,89 + 19,11)', q.verlegd.nonEu.btw, 26.89);
  gelijk('4a aantal', q.verlegd.nonEu.aantal, 3);
  gelijk('4b netto (eu + oud record)', q.verlegd.eu.netto, 250);
  gelijk('4b hele euro\'s', q.verlegd.eu.nettoHeleEuros, 250);
  gelijk('4b btw', q.verlegd.eu.btw, 52.5);
  gelijk('verlegd totaal = 4a + 4b', q.verlegd.btw, B.rond(26.89 + 52.5));
  gelijk('5a = omzetbtw + 4a + 4b', q.berekend.btwOmzet, B.rond(210 + 26.89 + 52.5));
  gelijk('5b = bon-btw + 4a + 4b', q.berekend.voorbelasting, B.rond(21 + 26.89 + 52.5));
  gelijk('saldo = alleen omzetbtw − bon-btw', q.saldo, 189);
  gelijk('terug te vragen = alleen reguliere voorbelasting (excl. verlegd)', q.berekend.voorbelastingBon, 21);
  gelijk('verlegd per saldo 0', q.verlegd.perSaldo, 0);
  gelijk('5b = terug te vragen + verlegd', q.berekend.voorbelasting, B.rond(q.berekend.voorbelastingBon + q.verlegd.btw));
  gelijk('5a = omzetbtw + verlegd', q.berekend.btwOmzet, B.rond(q.berekend.btwOmzetEigen + q.verlegd.btw));
  gelijk('verlegdRegio eu default', B.verlegdRegio({ verlegd: true }), 'eu');
  gelijk('verlegdRegio non_eu', B.verlegdRegio({ verlegd: true, verlegdRegio: 'non_eu' }), 'non_eu');
  gelijk('verlegdRegio regulier', B.verlegdRegio({ btw: 0 }), null);
  gelijk('verlegdRegio negeert regio zonder verlegd-vlag', B.verlegdRegio({ verlegdRegio: 'non_eu' }), null);
}

// ---- reeds ingediend: aangegeven bedragen gaan voor, afwijking wordt getoond
data.aangiften[2] = { ingediend: true, voldaan: false, btwOmzet: 200, voorbelasting: 100, omzetNetto: 1400, kostenNetto: 450 };
k2 = B.berekenKwartaal(data, 2);
gelijk('Q2 ingediend → aangegeven saldo', k2.saldo, 100);
gelijk('Q2 afwijking', k2.afwijking, 23);
gelijk('Q2 status ingediend', k2.status, 'ingediend');
gelijk('Q2 jaaromzet uit administratie', k2.jaarOmzet, 1500);
data.aangiften[2].voldaan = true;
gelijk('Q2 status voldaan', B.berekenKwartaal(data, 2).status, 'voldaan');

// ---- kwartaal zonder administratie maar wel aangifte (bijv. Q1 al gedaan, niets ingevoerd)
const alleenAangifte = { omzet: [], kosten: [], aangiften: { 1: { ingediend: true, btwOmzet: 50, voorbelasting: 10, omzetNetto: 240, kostenNetto: 40 } } };
const q1 = B.berekenKwartaal(alleenAangifte, 1);
gelijk('Q1 bron aangifte', q1.bron, 'aangifte');
gelijk('Q1 jaaromzet uit aangifte', q1.jaarOmzet, 240);
const jaar = B.berekenJaar(alleenAangifte);
gelijk('jaar winst uit aangifte', jaar.winst, 200);
gelijk('jaar nog te betalen', jaar.btwNogTeBetalen, 40);

// ---- floating point: 0,1 + 0,2 mag niet naar 0,30000000000000004
const fp = B.berekenKwartaal({ omzet: [{ kwartaal: 1, netto: 0.1, tarief: 0 }, { kwartaal: 1, netto: 0.2, tarief: 0 }], kosten: [], aangiften: {} }, 1);
gelijk('geen float-ruis', fp.berekend.omzetNetto, 0.3);

// ---- inkomstenbelasting 2026
const ib = (winst, o) => B.berekenInkomstenbelasting(winst, { urencriterium: true, starter: false, extraWinst: 0, ...o }, 2026);
let r = ib(30000);
gelijk('ZA', r.zelfstandigenaftrek, 1200);
gelijk('winst na aftrek', r.winstNaAftrek, 28800);
gelijk('MKB 12,7%', r.mkbVrijstelling, 3657.6);
gelijk('belastbaar', r.belastbaar, 25142);
gelijk('bruto IB schijf 1', r.bruto, B.rond(25142 * 0.3575));
gelijk('AHK vol', r.algemeneHeffingskorting, 3115);
gelijk('AK 28.800', r.arbeidskorting, B.rond(5300 + 0.0195 * (28800 - 25845)));
is('IB = bruto − AHK − AK', Math.abs(r.inkomstenbelasting - (r.bruto - r.algemeneHeffingskorting - r.arbeidskorting)) < 0.02);
gelijk('Zvw 4,85% over belastbaar', r.zvw, B.rond(25142 * 0.0485));

r = ib(30000, { starter: true });
gelijk('startersaftrek erbij', r.startersaftrek, 2123);
is('starter betaalt minder', r.inkomstenbelasting < ib(30000).inkomstenbelasting);

r = ib(30000, { urencriterium: false, starter: true });
gelijk('zonder urencriterium geen ZA', r.zelfstandigenaftrek, 0);
gelijk('zonder urencriterium geen SA', r.startersaftrek, 0);

r = ib(1000);
gelijk('ZA begrensd op winst', r.zelfstandigenaftrek, 1000);
gelijk('geen negatieve belasting', r.inkomstenbelasting, 0);

r = ib(-500);
gelijk('verlies → belastbaar 0', r.belastbaar, 0);
gelijk('verlies → IB 0', r.inkomstenbelasting, 0);

r = ib(0, { extraWinst: 10000 });
gelijk('extra prognosewinst telt mee', r.winst, 10000);

r = ib(120000, { urencriterium: false });
is('3 schijven bij hoge winst', r.schijven.length === 3 && r.schijven[2].inkomen > 0);
gelijk('AK nul bij hoge winst', B.arbeidskorting(140000, B.PARAMS[2026]), 0);
gelijk('Zvw maximum', r.zvw, B.rond(79409 * 0.0485));
gelijk('AHK afgebouwd tot 0', B.algemeneHeffingskorting(90000, B.PARAMS[2026]), 0);

// ---- validatie (server)
const ok = V.schoonOmzet({ datum: '2026-07-01', omschrijving: ' Website ', netto: '1.250,50', tarief: '21' }, 2026);
is('omzet geldig', ok.ok === true, JSON.stringify(ok));
gelijk('komma-bedrag', ok.item?.netto, 1250.5);
gelijk('kwartaal uit datum', ok.item?.kwartaal, 3);
gelijk('omschrijving getrimd', ok.item?.omschrijving, 'Website');
is('btw 12% geweigerd', V.schoonOmzet({ datum: '2026-07-01', omschrijving: 'x', netto: 1, tarief: 12 }, 2026).ok === false);
is('datum ander jaar geweigerd', V.schoonOmzet({ datum: '2025-07-01', omschrijving: 'x', netto: 1, tarief: 21 }, 2026).ok === false);
is('onmogelijke datum geweigerd', V.schoonOmzet({ datum: '2026-02-30', omschrijving: 'x', netto: 1, tarief: 21 }, 2026).ok === false);
is('absurd bedrag geweigerd', V.schoonOmzet({ datum: '2026-07-01', omschrijving: 'x', netto: 1e12, tarief: 21 }, 2026).ok === false);
is('NaN geweigerd', V.schoonOmzet({ datum: '2026-07-01', omschrijving: 'x', netto: 'abc', tarief: 21 }, 2026).ok === false);
is('lege omschrijving geweigerd', V.schoonOmzet({ datum: '2026-07-01', omschrijving: '  ', netto: 1, tarief: 21 }, 2026).ok === false);

const kv = V.schoonKosten({ datum: '2026-06-01', omschrijving: 'Camera', netto: 1000, btw: 210, voorStart: true, kwartaal: 2 }, 2026);
is('voorstart-kost geldig', kv.ok === true, JSON.stringify(kv));
gelijk('voorstart kwartaal expliciet', kv.item?.kwartaal, 2);
const kv2 = V.schoonKosten({ datum: '2025-12-20', omschrijving: 'Domein', netto: 10, btw: 2.1, voorStart: true, kwartaal: 2 }, 2026);
is('voorstart in vorig jaar toegestaan', kv2.ok === true, JSON.stringify(kv2));
is('gewone kost vorig jaar geweigerd', V.schoonKosten({ datum: '2025-12-20', omschrijving: 'x', netto: 10, btw: 2.1, voorStart: false }, 2026).ok === false);
const kn = V.schoonKosten({ datum: '2026-08-15', omschrijving: 'x', netto: 100, btw: 21, voorStart: false, kwartaal: 1 }, 2026);
gelijk('gewone kost: kwartaal volgt datum, niet de client', kn.item?.kwartaal, 3);
is('btw hoger dan 21% geweigerd', V.schoonKosten({ datum: '2026-08-15', omschrijving: 'x', netto: 100, btw: 30, voorStart: false }, 2026).ok === false);
is('negatieve btw geweigerd', V.schoonKosten({ datum: '2026-08-15', omschrijving: 'x', netto: 100, btw: -1, voorStart: false }, 2026).ok === false);

const vl = V.schoonKosten({ datum: '2026-08-26', omschrijving: 'Claude', netto: 18.5, btw: 0, voorStart: false, verlegd: true }, 2026);
is('verlegde kost geldig', vl.ok === true, JSON.stringify(vl));
gelijk('verlegd kenmerk opgeslagen', vl.item?.verlegd, true);
gelijk('verlegd zonder regio → eu (oude client)', vl.item?.verlegdRegio, 'eu');
const vn = V.schoonKosten({ datum: '2026-08-26', omschrijving: 'Claude', netto: 18.5, btw: 0, verlegd: true, verlegdRegio: 'non_eu' }, 2026);
gelijk('regio non_eu opgeslagen', vn.item?.verlegdRegio, 'non_eu');
is('ongeldige regio geweigerd', V.schoonKosten({ datum: '2026-08-26', omschrijving: 'Claude', netto: 18.5, btw: 0, verlegd: true, verlegdRegio: 'mars' }, 2026).ok === false);
is('regulier record krijgt geen regio', !('verlegdRegio' in V.schoonKosten({ datum: '2026-08-26', omschrijving: 'Stripe', netto: 40, btw: 0, verlegdRegio: 'non_eu' }, 2026).item));
is('verlegd met betaalde btw geweigerd', V.schoonKosten({ datum: '2026-08-26', omschrijving: 'Claude', netto: 100, btw: 21, verlegd: true }, 2026).ok === false);
is('bestaand 0%-record zonder kenmerk blijft regulier', !('verlegd' in V.schoonKosten({ datum: '2026-08-26', omschrijving: 'Stripe', netto: 40, btw: 0 }, 2026).item));
{
  const boek = V.leegBoek(2026);
  boek.kosten.push({ id: 'oud', datum: '2026-09-21', omschrijving: 'Claude', netto: 18.5, btw: 0, voorStart: false, kwartaal: 3 });
  const res = V.pasToe(boek, 'kosten.opslaan', { item: { id: 'oud', datum: '2026-09-21', omschrijving: 'Claude', netto: 18.5, btw: 0, voorStart: false, verlegd: true } });
  is('bestaande kost omzetten naar verlegd', res.ok && res.boek.kosten.length === 1 && res.boek.kosten[0].verlegd === true && res.boek.kosten[0].kwartaal === 3, JSON.stringify(res));
}

// ---- bijlage (factuur_url) bij kosten
{
  const URL1 = '/api/bon?id=0b6f1c2e-3a4d-4e5f-8a9b-0c1d2e3f4a5b';
  const basisKost = { datum: '2026-09-21', omschrijving: 'Claude', netto: 18.5, btw: 0, voorStart: false };
  is('record zonder bijlage krijgt geen factuur_url', !('factuur_url' in V.schoonKosten(basisKost, 2026).item));
  gelijk('geldige bijlage-url bewaard', V.schoonKosten({ ...basisKost, factuur_url: URL1 }, 2026).item?.factuur_url, URL1);
  is('externe url als bijlage geweigerd', V.schoonKosten({ ...basisKost, factuur_url: 'https://evil.example/x.pdf' }, 2026).ok === false);
  is('javascript-url als bijlage geweigerd', V.schoonKosten({ ...basisKost, factuur_url: 'javascript:alert(1)' }, 2026).ok === false);
  is('pad-traversal als bijlage geweigerd', V.schoonKosten({ ...basisKost, factuur_url: '/api/bon?id=../../boek-2026' }, 2026).ok === false);

  const boek = V.leegBoek(2026);
  boek.kosten.push({ id: 'k1', ...basisKost, kwartaal: 3, factuur_url: URL1 });
  let res = V.pasToe(boek, 'kosten.opslaan', { item: { id: 'k1', ...basisKost, omschrijving: 'Claude (bewerkt)' } });
  gelijk('bewerken zonder factuur_url behoudt bijlage', res.boek.kosten[0].factuur_url, URL1);
  res = V.pasToe(boek, 'kosten.opslaan', { item: { id: 'k1', ...basisKost, factuur_url: '' } });
  is('factuur_url "" verwijdert bijlage', res.ok && !('factuur_url' in res.boek.kosten[0]));
  res = V.pasToe(boek, 'kosten.opslaan', { item: { ...basisKost, factuur_url: '' } });
  is('nieuwe kost met lege bijlage heeft geen veld', res.ok && !('factuur_url' in res.boek.kosten[1]));
  gelijk('bonIdUitUrl geldig', V.bonIdUitUrl(URL1), '0b6f1c2e-3a4d-4e5f-8a9b-0c1d2e3f4a5b');
  gelijk('bonIdUitUrl ongeldig', V.bonIdUitUrl('/api/bon?id=x'), null);
}

const ag = V.schoonAangifte({ ingediend: false, voldaan: true, btwOmzet: '12,50', voorbelasting: 3 });
is('aangifte geldig', ag.ok === true, JSON.stringify(ag));
gelijk('voldaan impliceert ingediend', ag.aangifte?.ingediend, true);
gelijk('btwOmzet komma', ag.aangifte?.btwOmzet, 12.5);
gelijk('leeg bedrag blijft null', ag.aangifte?.omzetNetto, null);
is('aangifte ongeldig bedrag', V.schoonAangifte({ btwOmzet: 'x' }).ok === false);

const inst = V.schoonInstellingen({ startdatum: '2026-06-15', urencriterium: 1, starter: 'ja', extraWinst: '500' }, 2026);
is('instellingen geldig', inst.ok === true, JSON.stringify(inst));
gelijk('extraWinst', inst.instellingen?.extraWinst, 500);
is('startdatum ongeldig', V.schoonInstellingen({ startdatum: 'morgen' }, 2026).ok === false);

// ---- slimme scan: opschoning van het modelantwoord (functions/_lib/scan-bon.js)
const S = await import(pathToFileURL(path.join(ROOT, 'functions/_lib/scan-bon.js')).href);
const scanBasis = { datum: '2026-09-21', omschrijving: 'Claude Pro (september)', bedrag_excl_btw: 18, valuta: 'EUR', btw_type: '21%', btw_bedrag: 3.78 };
{
  const ok = (extra) => S.schoonScan({ ...scanBasis, ...extra });
  gelijk('scan 21%: btw van de factuur', ok().resultaat?.btw_bedrag, 3.78);
  gelijk('scan 21%: afrondingsverschil van de factuur blijft', ok({ btw_bedrag: 3.79 }).resultaat?.btw_bedrag, 3.79);
  gelijk('scan 21%: onwaarschijnlijke btw valt terug op netto x 21%', ok({ btw_bedrag: 40 }).resultaat?.btw_bedrag, 3.78);
  gelijk('scan 9%: ontbrekende btw wordt netto x 9%', ok({ btw_type: '9%', btw_bedrag: null }).resultaat?.btw_bedrag, 1.62);
  gelijk('scan 21%: btw 0 = onbekend → netto x 21%', ok({ btw_bedrag: 0 }).resultaat?.btw_bedrag, 3.78);
  gelijk('scan 0%: btw is 0', ok({ btw_type: '0%', btw_bedrag: 0 }).resultaat?.btw_bedrag, 0);
  gelijk('scan 0%: btw is altijd 0', ok({ btw_type: '0%', btw_bedrag: 3.78 }).resultaat?.btw_bedrag, 0);
  gelijk('scan lege datum geeft datum null', ok({ datum: '' }).resultaat?.datum, null);
  gelijk('scan verlegd buiten EU: 21% over netto', ok({ bedrag_excl_btw: 18.5, btw_type: 'verlegd_buiten_eu', btw_bedrag: 0 }).resultaat?.btw_bedrag, Math.round(Math.round(18.5 * 100) * B.VERLEGD_TARIEF / 100) / 100);
  gelijk('scan verlegd EU: 21% over netto, ook als het model iets anders gaf', ok({ btw_type: 'verlegd_eu', btw_bedrag: 99 }).resultaat?.btw_bedrag, 3.78);
  gelijk('scan creditnota: negatieve btw', ok({ bedrag_excl_btw: -10, btw_bedrag: -2.1 }).resultaat?.btw_bedrag, -2.1);
  gelijk('scan creditnota: btw met verkeerd teken valt terug', ok({ bedrag_excl_btw: -10, btw_bedrag: 2.1 }).resultaat?.btw_bedrag, -2.1);
  is('scan zonder bedrag geweigerd', ok({ bedrag_excl_btw: null }).ok === false);
  is('scan met onbekend btw-type geweigerd', ok({ btw_type: '6%' }).ok === false);
  is('scan met onleesbaar antwoord geweigerd', S.schoonScan(null).ok === false);
  gelijk('scan met ongeldige datum geeft datum null', ok({ datum: '2026-02-31' }).resultaat?.datum, null);
  is('scan met ongeldige datum waarschuwt', ok({ datum: 'gisteren' }).resultaat?.waarschuwingen.length === 1);
  is('scan in USD waarschuwt', ok({ valuta: 'usd' }).resultaat?.waarschuwingen.some((w) => w.includes('USD')));
  is('scan in EUR waarschuwt niet', ok().resultaat?.waarschuwingen.length === 0);
  gelijk('scan omschrijving zonder stuurtekens', ok({ omschrijving: ' Claude\n\tPro ' }).resultaat?.omschrijving, 'Claude Pro');
  // Wat de client daarmee invult moet door de bestaande kostenvalidatie komen (verlegd: btw betaald = 0).
  const r = ok({ bedrag_excl_btw: 18.5, btw_type: 'verlegd_buiten_eu', btw_bedrag: 0 }).resultaat;
  is('scan-uitkomst (verlegd) is een geldige kostenpost', V.schoonKosten({ datum: r.datum, omschrijving: r.omschrijving, netto: r.bedrag_excl_btw, btw: 0, verlegd: true, verlegdRegio: 'non_eu' }, 2026).ok === true);
  const g = ok().resultaat;
  is('scan-uitkomst (21%) is een geldige kostenpost', V.schoonKosten({ datum: g.datum, omschrijving: g.omschrijving, netto: g.bedrag_excl_btw, btw: g.btw_bedrag }, 2026).ok === true);

  gelijk('scan type pdf', S.scanTypeVanBytes(new TextEncoder().encode('%PDF-1.7')), 'application/pdf');
  gelijk('scan type jpeg', S.scanTypeVanBytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');
  gelijk('scan type onbekend', S.scanTypeVanBytes(new TextEncoder().encode('MZ.exe')), null);
  const groot = Uint8Array.from({ length: 100_000 }, (_, i) => (i * 31) % 256);
  gelijk('scan base64 klopt', S.scanBase64(groot), Buffer.from(groot).toString('base64'));
}

// ---- slimme scan: endpoint (sessie, invoer, Claude-aanroep gemockt, foutafhandeling)
{
  const A = await import(pathToFileURL(path.join(ROOT, 'functions/_lib/auth.js')).href);
  const H = await import(pathToFileURL(path.join(ROOT, 'functions/api/scan-bon.js')).href);
  const SECRET = 'test-secret-'.repeat(4);
  const cookie = `__session=${await A.signSession({ exp: Date.now() + 60_000 }, SECRET)}`;
  const PDF = new TextEncoder().encode('%PDF-1.4 test');
  const env = { SESSION_SECRET: SECRET, ANTHROPIC_API_KEY: 'sk-ant-test' };
  const roep = (body, { headers = {}, env: e = env } = {}) =>
    H.onRequestPost({ request: new Request('https://mvdbmedia.nl/api/scan-bon', { method: 'POST', body, headers }), env: e });
  const echteFetch = globalThis.fetch;
  let verstuurd = null;
  const mock = (res) => { globalThis.fetch = async (url, init) => { verstuurd = { url, init }; if (res instanceof Error) throw res; return res; }; };
  const claude = (obj, extra = {}) => new Response(JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(obj) }], ...extra }), { status: 200 });
  const fail = (status, type) => new Response(JSON.stringify({ type: 'error', error: { type, message: 'x' } }), { status });
  const stil = console.error; console.error = () => {};
  try {
    gelijk('scan-bon zonder sessie → 401', (await roep(PDF)).status, 401);
    gelijk('scan-bon met ongeldige sessie → 401', (await roep(PDF, { headers: { Cookie: '__session=x.y' } })).status, 401);
    gelijk('scan-bon zonder sessie → 401, ook zonder API-key', (await roep(PDF, { env: { SESSION_SECRET: SECRET } })).status, 401);
    gelijk('scan-bon zonder API-key → 503', (await roep(PDF, { headers: { Cookie: cookie }, env: { SESSION_SECRET: SECRET } })).status, 503);
    gelijk('scan-bon cross-site → 403', (await roep(PDF, { headers: { Cookie: cookie, Origin: 'https://evil.example' } })).status, 403);
    gelijk('scan-bon leeg bestand → 400', (await roep(new Uint8Array(0), { headers: { Cookie: cookie } })).status, 400);
    gelijk('scan-bon geen PDF/foto → 415', (await roep(new TextEncoder().encode('hallo'), { headers: { Cookie: cookie } })).status, 415);
    gelijk('scan-bon te groot → 413', (await roep(new Uint8Array(4 * 1024 * 1024 + 1).fill(0x25), { headers: { Cookie: cookie } })).status, 413);

    mock(claude({ ...scanBasis, bedrag_excl_btw: 18.5, btw_type: 'verlegd_buiten_eu', btw_bedrag: 0 }));
    const res = await roep(PDF, { headers: { Cookie: cookie } });
    const body = await res.json();
    gelijk('scan-bon geldig → 200', res.status, 200);
    gelijk('scan-bon geeft verlegd btw-type terug', body.btw_type, 'verlegd_buiten_eu');
    gelijk('scan-bon geeft berekende verlegde btw terug', body.btw_bedrag, 3.89);
    gelijk('scan-bon geeft datum terug', body.datum, '2026-09-21');
    const uit = JSON.parse(verstuurd.init.body);
    gelijk('Claude-aanroep: url', verstuurd.url, 'https://api.anthropic.com/v1/messages');
    gelijk('Claude-aanroep: api-key header', verstuurd.init.headers['x-api-key'], 'sk-ant-test');
    gelijk('Claude-aanroep: versie-header', verstuurd.init.headers['anthropic-version'], '2023-06-01');
    gelijk('Claude-aanroep: model', uit.model, 'claude-opus-4-8');
    gelijk('Claude-aanroep: PDF als document-blok', uit.messages[0].content[0].type, 'document');
    gelijk('Claude-aanroep: base64 van het bestand', uit.messages[0].content[0].source.data, Buffer.from(PDF).toString('base64'));
    is('Claude-aanroep: gestructureerde output', uit.output_config?.format?.type === 'json_schema' && uit.thinking?.type === 'adaptive');
    is('Claude-aanroep: geen sampling-parameters (400 op Opus 4.8)', !('temperature' in uit) && !('top_p' in uit) && !('top_k' in uit));
    is('API-key lekt niet naar de client', !JSON.stringify(body).includes('sk-ant'));

    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    mock(claude(scanBasis));
    await roep(jpeg, { headers: { Cookie: cookie } });
    gelijk('Claude-aanroep: foto als image-blok', JSON.parse(verstuurd.init.body).messages[0].content[0].type, 'image');

    mock(fail(429, 'rate_limit_error'));
    gelijk('Claude 429 → 429', (await roep(PDF, { headers: { Cookie: cookie } })).status, 429);
    mock(fail(401, 'authentication_error'));
    gelijk('Claude 401 (ongeldige key) wordt nooit 401 naar de client', (await roep(PDF, { headers: { Cookie: cookie } })).status, 502);
    mock(fail(400, 'invalid_request_error'));
    gelijk('Claude 400 (bv. tegoed op) → 502', (await roep(PDF, { headers: { Cookie: cookie } })).status, 502);
    mock(fail(529, 'overloaded_error'));
    gelijk('Claude 529 → 503', (await roep(PDF, { headers: { Cookie: cookie } })).status, 503);
    mock(new Error('netwerk'));
    gelijk('netwerkfout → 504', (await roep(PDF, { headers: { Cookie: cookie } })).status, 504);
    mock(claude({ ...scanBasis, bedrag_excl_btw: null }));
    gelijk('geen bedrag gevonden → 422', (await roep(PDF, { headers: { Cookie: cookie } })).status, 422);
    mock(claude(scanBasis, { stop_reason: 'refusal' }));
    gelijk('weigering door model → 422', (await roep(PDF, { headers: { Cookie: cookie } })).status, 422);
    mock(new Response(JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'geen json' }] }), { status: 200 }));
    gelijk('onleesbaar modelantwoord → 422', (await roep(PDF, { headers: { Cookie: cookie } })).status, 422);
  } finally {
    globalThis.fetch = echteFetch;
    console.error = stil;
  }
}

console.log(fouten ? `\n${fouten} test(s) mislukt` : '✓ belasting-, validatie- en scantests: geen fouten');
process.exit(fouten ? 1 : 0);
