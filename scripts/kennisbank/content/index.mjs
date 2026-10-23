import kosten from './webdesign-kosten-friesland.mjs';
import maatwerk from './maatwerk-website-vs-wordpress.mjs';
import snelheid from './snelle-website-laten-maken.mjs';
import sneek from './website-laten-maken-sneek.mjs';
import beveiliging from './website-beveiliging-onderhoud.mjs';
import seo from './seo-webdesign-hoger-in-google.mjs';
import conversie from './conversie-gericht-webdesign.mjs';
import saas from './webapplicatie-saas-laten-maken.mjs';

const guides = [kosten, maatwerk, snelheid, sneek, beveiliging, seo, conversie, saas];
guides.forEach((g, i) => { g.num = i + 1; });
export default guides;
