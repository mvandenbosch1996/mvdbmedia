// Perf pass 2 n.a.v. PageSpeed (LCP 9,3s):
// 1. -800.webp varianten voor de 3 showreel-foto's die er nog geen hebben
// 2. index showreel: srcset zodat mobiel ~60KB-varianten pakt i.p.v. full-size
// 3. alle pagina's: Google Fonts CSS async (preload + media=print swap) — was 1.770ms render-blocking
// Draaien: node perf-pass2.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import sharp from "sharp";

// --- 1. ontbrekende -800 varianten ---
const need800 = ["fotos/marit/marit 1.jpg", "fotos/portret-ziggy.jpg", "fotos/luchtfotos/IMG-20251109-WA0012.jpg"];
for (const src of need800) {
  const out = src.replace(/\.(jpe?g|png)$/i, "-800.webp");
  if (existsSync(out)) { console.log(`bestaat al: ${out}`); continue; }
  await sharp(src).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
  console.log(`${out}  ${Math.round(statSync(out).size / 1024)} KB`);
}

// --- 2. showreel srcset (alleen index.html) ---
let index = readFileSync("index.html", "utf8");
const showreel = [
  "fotos/drone-fort", "fotos/portret-ollie", "fotos/drone-kasteel", "fotos/events-groep",
  "fotos/marit/marit%201", "fotos/vastgoed-huis", "fotos/drone-eiland", "fotos/portret-ziggy",
  "fotos/drone-park", "fotos/luchtfotos/IMG-20251109-WA0012",
];
let sr = 0;
index = index.replace(/(<div class="showreel-frame"[^>]*><img )(src="(fotos\/[^"]+)\.webp")/gi, (m, pre, srcAttr, base) => {
  if (!showreel.includes(base)) return m;
  sr++;
  // sizes: mobiel toont frame ~300px -> dpr2 pakt 800w; desktop dpr1 ook 800w (frame max 480px)
  return `${pre}${srcAttr} srcset="${base}-800.webp 800w, ${base}.webp 1920w" sizes="(max-width:600px) 300px, 480px"`;
});
writeFileSync("index.html", index);
console.log(`showreel srcset: ${sr} imgs`);

// --- 3. fonts async op alle pagina's ---
const files = [...readdirSync(".").filter(f => f.endsWith(".html")), "intake/index.html"];
let fontFixed = 0;
for (const f of files) {
  let html = readFileSync(f, "utf8");
  const re = /<link href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)" rel="stylesheet">/;
  const m = html.match(re);
  if (!m) continue;
  const url = m[1];
  html = html.replace(re,
    `<link rel="preload" as="style" href="${url}">\n` +
    `  <link rel="stylesheet" href="${url}" media="print" onload="this.media='all'">\n` +
    `  <noscript><link rel="stylesheet" href="${url}"></noscript>`);
  writeFileSync(f, html);
  fontFixed++;
}
console.log(`fonts async: ${fontFixed} pagina's`);
