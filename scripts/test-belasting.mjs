// Rekentests voor admin/js/belasting.js en de validatie in functions/_lib/boekhouding.js.
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

console.log(fouten ? `\n${fouten} test(s) mislukt` : '✓ belasting- en validatietests: geen fouten');
process.exit(fouten ? 1 : 0);
