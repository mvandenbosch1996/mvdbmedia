# Verborgen Factuurgenerator — Implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bouw een met wachtwoord beveiligde, niet-geïndexeerde factuurgenerator op `/admin/` voor MVDBmedia op Cloudflare Pages, die client-side PDF's genereert.

**Architecture:** Cloudflare Pages Functions leveren auth (PBKDF2 + HMAC-sessiecookie) en een KV-gebaseerde factuurnummer-teller. Statische `/admin/`-pagina's bevatten de generator; jsPDF draait lokaal en client-side. Login-rate-limiting via oplopende vertraging (geen KV).

**Tech Stack:** Cloudflare Pages Functions (Workers runtime), Web Crypto API (`crypto.subtle`), Cloudflare KV, jsPDF + jsPDF-autotable (lokaal gehost), vanilla JS/HTML/CSS.

**Testomgeving:** Geen unit-test-runner in deze repo. Verificatie per taak via:
- `npx wrangler pages dev . --kv FACTUREN` (lokale Functions + KV)
- `curl` tegen endpoints
- Node-script voor crypto-pariteit (hash-script ↔ Worker-verify)
- Screenshot-workflow (`node serve.mjs` + `node screenshot.mjs`) voor UI
Commit-messages in het Nederlands.

---

## Bestandsstructuur

| Bestand | Verantwoordelijkheid |
|---|---|
| `functions/_lib/auth.js` | Gedeelde crypto: PBKDF2-verify, HMAC sign/verify, constant-time compare, cookie-helpers |
| `functions/api/login.js` | POST: wachtwoord verifiëren, sessiecookie zetten, oplopende vertraging |
| `functions/api/logout.js` | POST: sessiecookie wissen |
| `functions/api/factuurnummer.js` | Achter gate: GET reserveer nr, POST check-bestaat (KV) |
| `functions/admin/_middleware.js` | Auth-gate op `/admin/*` (behalve login) |
| `admin/login/index.html` | Loginpagina, huisstijl, noindex |
| `admin/factuur/index.html` | Generator: config + formulier + preview + PDF |
| `admin/vendor/*.js` | jsPDF, autotable, Bebas-font (lokaal) |
| `scripts/genereer-wachtwoord-hash.js` | Lokaal Node-script: print salt + hash |
| `_headers` | + `X-Robots-Tag` voor `/admin/*` |
| `robots.txt` | + `Disallow: /admin/` |

Crypto-parameters (overal identiek): **PBKDF2-SHA256, 100.000 iteraties, 32-byte output, salt 16 byte.**

---

## Task 1: Crypto-helpers + hash-script (pariteit vaststellen)

De hash die het Node-script produceert MOET door de Worker verifieerbaar zijn. We bouwen beide samen en bewijzen pariteit.

**Files:**
- Create: `functions/_lib/auth.js`
- Create: `scripts/genereer-wachtwoord-hash.js`
- Create: `scripts/_test-pariteit.mjs` (tijdelijk verificatiescript, na taak verwijderen)

- [ ] **Step 1: Schrijf `functions/_lib/auth.js` — PBKDF2 + helpers**

```js
// functions/_lib/auth.js
// Gedeelde auth-helpers voor de admin-omgeving. Draait in de Workers-runtime.

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = "SHA-256";
const KEY_BYTES = 32;

const enc = new TextEncoder();

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// PBKDF2 → hex hash
export async function derivePbkdf2Hex(password, saltBytes) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    keyMaterial, KEY_BYTES * 8
  );
  return bytesToHex(new Uint8Array(bits));
}

// Constant-time vergelijking van twee hex-strings via HMAC over een random key.
export async function timingSafeEqualHex(aHex, bHex) {
  const key = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const macA = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(aHex)));
  const macB = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(bHex)));
  if (macA.length !== macB.length) return false;
  let diff = 0;
  for (let i = 0; i < macA.length; i++) diff |= macA[i] ^ macB[i];
  return diff === 0;
}

export async function verifyPassword(password, saltHex, expectedHashHex) {
  const hashHex = await derivePbkdf2Hex(password, hexToBytes(saltHex));
  return timingSafeEqualHex(hashHex, expectedHashHex);
}

// ---- Sessietoken: base64url(json).base64url(HMAC(json, secret)) ----

function b64urlEncode(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmac(dataBytes, secret) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, dataBytes));
}

export async function signSession(payload, secret) {
  const json = enc.encode(JSON.stringify(payload));
  const mac = await hmac(json, secret);
  return `${b64urlEncode(json)}.${b64urlEncode(mac)}`;
}

export async function verifySession(token, secret) {
  if (!token || !token.includes(".")) return null;
  const [jsonPart, macPart] = token.split(".");
  let jsonBytes, macBytes;
  try {
    jsonBytes = b64urlDecode(jsonPart);
    macBytes = b64urlDecode(macPart);
  } catch { return null; }
  const expectedMac = await hmac(jsonBytes, secret);
  if (expectedMac.length !== macBytes.length) return null;
  let diff = 0;
  for (let i = 0; i < expectedMac.length; i++) diff |= expectedMac[i] ^ macBytes[i];
  if (diff !== 0) return null;
  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(jsonBytes)); } catch { return null; }
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

// ---- Cookie-helpers ----
const COOKIE_NAME = "__session";
const SEVEN_DAYS = 7 * 24 * 60 * 60;

export function parseCookie(header, name = COOKIE_NAME) {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

export function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SEVEN_DAYS}`;
}

export function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export { SEVEN_DAYS, COOKIE_NAME };
```

- [ ] **Step 2: Schrijf `scripts/genereer-wachtwoord-hash.js` (Node, zelfde parameters)**

```js
// scripts/genereer-wachtwoord-hash.js
// Lokaal draaien: node scripts/genereer-wachtwoord-hash.js
// Vraagt een wachtwoord, print SALT + HASH om in Cloudflare als env vars te plakken.
// Het wachtwoord komt nergens in de repo.

const crypto = require("node:crypto");
const readline = require("node:readline");

const ITERATIONS = 100_000;
const KEYLEN = 32;
const DIGEST = "sha256";

function vraagWachtwoord() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // verberg invoer
    const stdout = process.stdout;
    rl._writeToOutput = function (str) {
      if (str.includes("Wachtwoord")) stdout.write(str);
      else stdout.write("*");
    };
    rl.question("Wachtwoord: ", (answer) => { rl.close(); stdout.write("\n"); resolve(answer); });
  });
}

(async () => {
  const wachtwoord = await vraagWachtwoord();
  if (!wachtwoord) { console.error("Leeg wachtwoord."); process.exit(1); }
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(wachtwoord, salt, ITERATIONS, KEYLEN, DIGEST);
  console.log("\nPlak deze twee in Cloudflare Pages → Settings → Environment variables:\n");
  console.log(`ADMIN_PASSWORD_SALT=${salt.toString("hex")}`);
  console.log(`ADMIN_PASSWORD_HASH=${hash.toString("hex")}`);
})();
```

- [ ] **Step 3: Schrijf tijdelijk pariteitsscript `scripts/_test-pariteit.mjs`**

Bewijst dat Node-hash == Worker-hash voor dezelfde salt+wachtwoord.

```js
// scripts/_test-pariteit.mjs  (tijdelijk — verwijder na taak)
import crypto from "node:crypto";
import { derivePbkdf2Hex } from "../functions/_lib/auth.js";

const wachtwoord = "test-wachtwoord-123";
const salt = crypto.randomBytes(16);
const saltHex = salt.toString("hex");

const nodeHash = crypto.pbkdf2Sync(wachtwoord, salt, 100_000, 32, "sha256").toString("hex");
const workerHash = await derivePbkdf2Hex(wachtwoord, new Uint8Array(salt));

console.log("Node  :", nodeHash);
console.log("Worker:", workerHash);
console.log(nodeHash === workerHash ? "PARITEIT OK" : "MISMATCH");
process.exit(nodeHash === workerHash ? 0 : 1);
```

- [ ] **Step 4: Draai het pariteitsscript**

Run: `node scripts/_test-pariteit.mjs`
Expected: twee identieke hashes + `PARITEIT OK`, exit 0.

(`functions/_lib/auth.js` gebruikt `crypto.subtle` en `btoa`/`atob` — beschikbaar in Node 18+. Bij een oudere Node: gebruik `node --experimental-global-webcrypto` of upgrade.)

- [ ] **Step 5: Verwijder het tijdelijke script + commit**

```bash
rm scripts/_test-pariteit.mjs
git add functions/_lib/auth.js scripts/genereer-wachtwoord-hash.js
git commit -m "auth: PBKDF2/HMAC-helpers en lokaal wachtwoord-hash-script"
```

---

## Task 2: Login-endpoint

**Files:**
- Create: `functions/api/login.js`

- [ ] **Step 1: Schrijf `functions/api/login.js`**

```js
// functions/api/login.js
// POST /api/login — verifieert wachtwoord, zet sessiecookie.
// Env vars: ADMIN_PASSWORD_HASH, ADMIN_PASSWORD_SALT, SESSION_SECRET.

import { verifyPassword, signSession, sessionCookie, SEVEN_DAYS } from "../_lib/auth.js";

// Oplopende vertraging per IP (in-memory per isolate, geen KV).
const pogingen = new Map(); // ip -> { count, ts }
const VENSTER_MS = 15 * 60 * 1000;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json", ...headers },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get("CF-Connecting-IP") || "onbekend";

  if (!env.ADMIN_PASSWORD_HASH || !env.ADMIN_PASSWORD_SALT || !env.SESSION_SECRET) {
    return json({ error: "Server niet geconfigureerd." }, 500);
  }

  let wachtwoord = "";
  const ct = request.headers.get("Content-Type") || "";
  try {
    if (ct.includes("application/json")) {
      wachtwoord = String((await request.json()).wachtwoord || "");
    } else {
      wachtwoord = String((await request.formData()).get("wachtwoord") || "");
    }
  } catch {
    return json({ error: "Ongeldig verzoek." }, 400);
  }

  // Oplopende vertraging vóór verificatie
  const nu = Date.now();
  const rec = pogingen.get(ip);
  if (rec && nu - rec.ts < VENSTER_MS && rec.count > 0) {
    const delay = Math.min(rec.count * 400, 4000);
    await new Promise((r) => setTimeout(r, delay));
  }

  const ok = wachtwoord
    ? await verifyPassword(wachtwoord, env.ADMIN_PASSWORD_SALT, env.ADMIN_PASSWORD_HASH)
    : false;

  if (!ok) {
    const prev = rec && nu - rec.ts < VENSTER_MS ? rec.count : 0;
    pogingen.set(ip, { count: prev + 1, ts: nu });
    return json({ error: "Onjuist wachtwoord." }, 401);
  }

  pogingen.delete(ip);
  const token = await signSession({ exp: nu + SEVEN_DAYS * 1000 }, env.SESSION_SECRET);
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token) });
}
```

- [ ] **Step 2: Start lokale dev met test-env vars**

Genereer eerst een test-hash. Run:
`node scripts/genereer-wachtwoord-hash.js` → voer `geheim123` in → noteer SALT en HASH.

Maak `.dev.vars` (gitignored — zie stap 4):
```
ADMIN_PASSWORD_SALT=<uit script>
ADMIN_PASSWORD_HASH=<uit script>
SESSION_SECRET=test-secret-minstens-32-tekens-lang-abc
```

Run (background): `npx wrangler pages dev . --kv FACTUREN --port 8788`

- [ ] **Step 3: Test login met curl**

Run (fout wachtwoord):
`curl -s -X POST http://localhost:8788/api/login -H "Content-Type: application/json" -d "{\"wachtwoord\":\"fout\"}"`
Expected: `{"error":"Onjuist wachtwoord."}`, HTTP 401.

Run (goed wachtwoord, toon headers):
`curl -si -X POST http://localhost:8788/api/login -H "Content-Type: application/json" -d "{\"wachtwoord\":\"geheim123\"}"`
Expected: `{"ok":true}` + `Set-Cookie: __session=...; HttpOnly; Secure; SameSite=Strict; ...`

- [ ] **Step 4: Zorg dat `.dev.vars` gitignored is + commit**

Voeg `.dev.vars` toe aan `.gitignore` als het er niet in staat.
```bash
git add functions/api/login.js .gitignore
git commit -m "auth: login-endpoint met sessiecookie en oplopende vertraging"
```

---

## Task 3: Middleware-gate + logout

**Files:**
- Create: `functions/admin/_middleware.js`
- Create: `functions/api/logout.js`

- [ ] **Step 1: Schrijf `functions/admin/_middleware.js`**

```js
// functions/admin/_middleware.js
// Beschermt elke /admin/*-route (behalve de loginpagina zelf) server-side.

import { parseCookie, verifySession } from "../_lib/auth.js";

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Loginpagina is publiek toegankelijk.
  if (url.pathname === "/admin/login" || url.pathname === "/admin/login/") {
    return next();
  }

  const token = parseCookie(request.headers.get("Cookie"));
  const payload = env.SESSION_SECRET ? await verifySession(token, env.SESSION_SECRET) : null;

  if (!payload) {
    return Response.redirect(`${url.origin}/admin/login/`, 302);
  }
  return next();
}
```

- [ ] **Step 2: Schrijf `functions/api/logout.js`**

```js
// functions/api/logout.js
// POST /api/logout — wist de sessiecookie.
import { clearCookie } from "../_lib/auth.js";

export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": clearCookie() },
  });
}
```

- [ ] **Step 3: Maak een tijdelijke test-pagina + test de gate**

Maak `admin/factuur/index.html` tijdelijk met alleen `<h1>GEHEIM</h1>` (wordt in Task 6 vervangen).

Herstart wrangler dev indien nodig. Test:

Run (geen cookie → redirect):
`curl -si http://localhost:8788/admin/factuur/`
Expected: `HTTP/1.1 302` + `Location: .../admin/login/`

Run (met geldige cookie → 200):
Login eerst en bewaar cookie:
`curl -s -c cookies.txt -X POST http://localhost:8788/api/login -H "Content-Type: application/json" -d "{\"wachtwoord\":\"geheim123\"}"`
Dan:
`curl -si -b cookies.txt http://localhost:8788/admin/factuur/`
Expected: `HTTP/1.1 200` + bevat `GEHEIM`.

Run (logout wist cookie):
`curl -si -b cookies.txt -X POST http://localhost:8788/api/logout`
Expected: `Set-Cookie: __session=; ... Max-Age=0`.

- [ ] **Step 4: Commit**

```bash
git add functions/admin/_middleware.js functions/api/logout.js
git commit -m "auth: server-side gate op /admin/* en logout-endpoint"
```

---

## Task 4: Niet-indexeren (headers + robots)

**Files:**
- Modify: `_headers`
- Modify: `robots.txt`

- [ ] **Step 1: Voeg X-Robots-Tag toe aan `_headers`**

Voeg onderaan `_headers` toe (na het bestaande `/*`-blok):
```
/admin/*
  X-Robots-Tag: noindex, nofollow
```

CSP niet aanpassen — jsPDF is lokaal en download gaat via `doc.save()`.

- [ ] **Step 2: Voeg Disallow toe aan `robots.txt`**

Wijzig `robots.txt` naar:
```
User-agent: *
Allow: /
Disallow: /intake/
Disallow: /admin/

Sitemap: https://mvdbmedia.nl/sitemap.xml
```

- [ ] **Step 3: Verifieer header lokaal**

Run: `curl -si -b cookies.txt http://localhost:8788/admin/factuur/ | findstr /I "X-Robots-Tag"`
Expected: `X-Robots-Tag: noindex, nofollow`
(Bij wrangler dev worden `_headers` toegepast; zo niet, verifieer visueel dat het bestand klopt.)

- [ ] **Step 4: Commit**

```bash
git add _headers robots.txt
git commit -m "seo: /admin/* uitsluiten van indexering (X-Robots-Tag + robots.txt)"
```

---

## Task 5: Factuurnummer-endpoint (KV)

**Files:**
- Create: `functions/api/factuurnummer.js`

Achter de gate? Nee — `/api/*` valt buiten `/admin/*`. Daarom checkt dit endpoint zélf de sessie.

- [ ] **Step 1: Schrijf `functions/api/factuurnummer.js`**

```js
// functions/api/factuurnummer.js
// GET  /api/factuurnummer            -> reserveert en retourneert het volgende nummer
// POST /api/factuurnummer {nummer}   -> { bestaat: bool } (controleert of nummer al uitgegeven is)
// Vereist sessiecookie. Gebruikt KV-binding FACTUREN.

import { parseCookie, verifySession } from "../_lib/auth.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json" },
  });
}

async function geautoriseerd(request, env) {
  const token = parseCookie(request.headers.get("Cookie"));
  return env.SESSION_SECRET && (await verifySession(token, env.SESSION_SECRET));
}

function jaar() { return new Date().getFullYear(); }
function formatteer(j, n) { return `${j}-${String(n).padStart(3, "0")}`; }

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  const j = jaar();
  const tellerKey = `factuurteller-${j}`;
  const huidig = parseInt((await env.FACTUREN.get(tellerKey)) || "0", 10);
  const volgend = huidig + 1;
  await env.FACTUREN.put(tellerKey, String(volgend));

  const nummer = formatteer(j, volgend);
  // Registreer als uitgegeven (individuele key per nummer = eenvoudige set).
  await env.FACTUREN.put(`uitgegeven-${nummer}`, "1");

  return json({ nummer });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!(await geautoriseerd(request, env))) return json({ error: "Niet ingelogd." }, 401);
  if (!env.FACTUREN) return json({ error: "KV niet geconfigureerd." }, 500);

  let nummer = "";
  try { nummer = String((await request.json()).nummer || "").trim(); }
  catch { return json({ error: "Ongeldig verzoek." }, 400); }
  if (!nummer) return json({ error: "Geen nummer opgegeven." }, 400);

  const bestaat = (await env.FACTUREN.get(`uitgegeven-${nummer}`)) !== null;
  return json({ bestaat });
}
```

- [ ] **Step 2: Test reserve met curl (opeenvolgend + gat-loos)**

Zorg dat wrangler dev draait met `--kv FACTUREN` en dat je een geldige `cookies.txt` hebt (Task 3).

Run tweemaal:
`curl -s -b cookies.txt http://localhost:8788/api/factuurnummer`
Expected 1e: `{"nummer":"2026-001"}` — 2e: `{"nummer":"2026-002"}` (oplopend, geen gaten).

- [ ] **Step 3: Test check-bestaat**

Run (bestaand nummer):
`curl -s -b cookies.txt -X POST http://localhost:8788/api/factuurnummer -H "Content-Type: application/json" -d "{\"nummer\":\"2026-001\"}"`
Expected: `{"bestaat":true}`

Run (onbekend nummer):
`curl -s -b cookies.txt -X POST http://localhost:8788/api/factuurnummer -H "Content-Type: application/json" -d "{\"nummer\":\"2026-999\"}"`
Expected: `{"bestaat":false}`

Run (zonder cookie → 401):
`curl -s http://localhost:8788/api/factuurnummer`
Expected: `{"error":"Niet ingelogd."}`

- [ ] **Step 4: Commit**

```bash
git add functions/api/factuurnummer.js
git commit -m "factuur: KV-endpoint voor gat-loze factuurnummer-reservering"
```

---

## Task 6: Loginpagina (UI)

**Files:**
- Create: `admin/login/index.html`

- [ ] **Step 1: Schrijf `admin/login/index.html`**

Huisstijl: bg `#0d0d0d`, accent `#ff8c00`, Bebas Neue (display) + Inter (body) via Google Fonts, tekst-logo `MVDB`+oranje `media`. `noindex`.

```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <title>Inloggen — MVDBmedia</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root { --bg:#0d0d0d; --elev:#161616; --border:#2a2a2a; --orange:#ff8c00;
            --text:#f0ede8; --muted:#a09890; --font-display:'Bebas Neue',sans-serif;
            --font-body:'Inter',sans-serif; }
    * { box-sizing:border-box; margin:0; }
    body { background:var(--bg); color:var(--text); font-family:var(--font-body);
           min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
    .kaart { background:var(--elev); border:1px solid var(--border); border-radius:8px;
             padding:40px 32px; width:100%; max-width:380px;
             box-shadow:0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,140,0,0.04); }
    .logo { font-family:var(--font-display); font-size:2rem; letter-spacing:0.06em;
            text-align:center; margin-bottom:8px; }
    .logo span { color:var(--orange); }
    .sub { text-align:center; color:var(--muted); font-size:0.78rem; letter-spacing:0.1em;
           text-transform:uppercase; margin-bottom:28px; }
    label { display:block; font-size:0.72rem; letter-spacing:0.08em; text-transform:uppercase;
            color:var(--muted); margin-bottom:8px; }
    input { width:100%; padding:12px 14px; background:var(--bg); border:1px solid var(--border);
            border-radius:4px; color:var(--text); font-size:0.9rem; font-family:var(--font-body);
            outline:none; transition:border-color 0.2s ease; }
    input:focus { border-color:var(--orange); }
    button { width:100%; margin-top:20px; padding:12px; background:var(--orange); color:#000;
             border:none; border-radius:4px; font-family:var(--font-body); font-weight:600;
             font-size:0.85rem; letter-spacing:0.04em; cursor:pointer;
             transition:transform 0.15s ease, opacity 0.2s ease; }
    button:hover { opacity:0.92; }
    button:active { transform:translateY(1px); }
    button:focus-visible { outline:2px solid var(--text); outline-offset:2px; }
    .fout { color:#ff6b6b; font-size:0.8rem; margin-top:14px; text-align:center; min-height:1.2em; }
  </style>
</head>
<body>
  <form class="kaart" id="loginform">
    <div class="logo">MVDB<span>media</span></div>
    <div class="sub">Beheeromgeving</div>
    <label for="wachtwoord">Wachtwoord</label>
    <input type="password" id="wachtwoord" name="wachtwoord" autocomplete="current-password" required autofocus>
    <button type="submit">Inloggen</button>
    <div class="fout" id="fout" role="alert"></div>
  </form>
  <script>
    const form = document.getElementById('loginform');
    const foutEl = document.getElementById('fout');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      foutEl.textContent = '';
      const wachtwoord = document.getElementById('wachtwoord').value;
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wachtwoord }),
        });
        if (res.ok) { window.location.href = '/admin/factuur/'; }
        else { foutEl.textContent = 'Onjuist wachtwoord.'; }
      } catch { foutEl.textContent = 'Er ging iets mis. Probeer opnieuw.'; }
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Screenshot desktop + mobiel**

Run: `node serve.mjs` (background, indien niet actief).
Note: `serve.mjs` serveert statisch — login-POST werkt daar niet, maar de UI wel. Screenshot via wrangler-poort als je de flow wilt testen; voor puur uiterlijk volstaat serve.

Run: `node screenshot.mjs http://localhost:3000/admin/login/ login-desktop`
Run: `node screenshot.mjs http://localhost:3000/admin/login/ login-mobiel` (mobiel: screenshot.mjs 390px indien ondersteund; anders `screenshot-mobile.mjs`).

Lees beide PNG's uit `temporary screenshots/`. Check: oranje accent, Bebas-logo, gecentreerde kaart, focus-state zichtbaar, leesbaar op 390px.

- [ ] **Step 3: Fix visuele mismatches indien nodig, re-screenshot**

Minstens 2 vergelijkingsronden (CLAUDE.md-regel). Stop pas bij geen zichtbare gebreken.

- [ ] **Step 4: Commit**

```bash
git add admin/login/index.html
git commit -m "admin: loginpagina in MVDBmedia-huisstijl"
```

---

## Task 7: Factuurgenerator — config + formulier + live berekening (zonder PDF)

**Files:**
- Create/Replace: `admin/factuur/index.html` (vervangt de tijdelijke stub)

Dit is de grootste taak. Bouw formulier + live preview + berekening; PDF komt in Task 8.

- [ ] **Step 1: Schrijf `admin/factuur/index.html` — config-blok**

Bovenaan `<script>`, exact deze waarden (uit codebase):

```js
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
```

- [ ] **Step 2: Bouw de HTML-structuur + state-model**

Layout: twee kolommen (formulier links, live preview rechts; op mobiel gestapeld). State:
```js
const state = {
  klant: { bedrijf:"", contact:"", adres:"", postcodePlaats:"", email:"", kvkBtw:"" },
  factuur: { nummer:"", datum:vandaag(), vervaldatum:overVeertienDagen(), referentie:"" },
  regels: [], // { id, omschrijving, aantal, stukprijs }
  korting: { type:"geen", waarde:0, omschrijving:"" }, // type: geen|bedrag|percentage
  btwTarief: BTW_STANDAARD, // of 0
  btwVerlegd: false,
};
```
Datumhelpers, `nieuwId()`, en render-functie die na elke wijziging de preview + totalen herberekent. Gebruik event-delegation of per-input listeners; bij elke change: `state` bijwerken → `render()`.

Verplichte UI-elementen:
- Klantvelden (6 inputs).
- Factuurvelden: nummer (tekst, met "Reserveer"-knop die `/api/factuurnummer` GET aanroept en bij handmatige invoer POST-check doet → waarschuwing als `bestaat`), datum, vervaldatum, referentie.
- Dienstkaarten gegroepeerd per `groep`; klik voegt een regel toe met `omschrijving`+`prijs` (bewerkbaar).
- "Regel toevoegen" (lege regel).
- Regels: omschrijving (input), aantal (number), stukprijs (number), regeltotaal (readonly), verwijder-knop, herorden via drag (`draggable` + drop-reorder in `state.regels`).
- Korting: radio geen/bedrag/percentage + waarde + omschrijving.
- Btw: select 21% / 0% / btw verlegd.
- Totalenblok.

- [ ] **Step 3: Berekening**

```js
function bereken() {
  const subtotaal = state.regels.reduce((s, r) => s + (r.aantal * r.stukprijs), 0);
  let kortingBedrag = 0;
  if (state.korting.type === "bedrag") kortingBedrag = Number(state.korting.waarde) || 0;
  else if (state.korting.type === "percentage") kortingBedrag = subtotaal * (Number(state.korting.waarde) || 0) / 100;
  const naKorting = Math.max(0, subtotaal - kortingBedrag);
  const btwBedrag = state.btwVerlegd ? 0 : naKorting * (state.btwTarief / 100);
  const totaal = naKorting + btwBedrag;
  return { subtotaal, kortingBedrag, naKorting, btwBedrag, totaal };
}
function euro(n) { return "€ " + n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
```
Toon subtotaal → korting (indien >0) → subtotaal na korting → btw (of "btw verlegd") → totaal.

- [ ] **Step 4: Concept auto-opslaan in localStorage**

```js
const OPSLAG_KEY = "mvdb-factuur-concept";
function bewaarConcept() { localStorage.setItem(OPSLAG_KEY, JSON.stringify(state)); }
function laadConcept() {
  try {
    const opgeslagen = JSON.parse(localStorage.getItem(OPSLAG_KEY));
    if (opgeslagen) Object.assign(state, opgeslagen);
  } catch {}
}
```
`laadConcept()` bij init, `bewaarConcept()` na elke `render()`.

- [ ] **Step 5: Logout-knop**

Knop rechtsboven → `fetch('/api/logout',{method:'POST'})` → redirect `/admin/login/`.

- [ ] **Step 6: Screenshot + handmatige rekentest**

Run: `node serve.mjs` (indien niet actief).
Run: `node screenshot.mjs http://localhost:3000/admin/factuur/ factuur-desktop`
Run mobiel-variant (390px).
Lees PNG's. Klik-test handmatig in browser óf verifieer via console-eval dat `bereken()` klopt voor: 2 regels + 10% korting + 21% btw. Voorbeeld: regel €100×2 + €50×1 = €250; −10% = €25 → €225; +21% = €47,25 → totaal €272,25.

Check ook: mobiel 390px niet gebroken (memory-regel mobile-first).

- [ ] **Step 7: Fix mismatches, re-screenshot (min. 2 ronden), commit**

```bash
git add admin/factuur/index.html
git commit -m "factuur: generator met dienstkaarten, regels, korting, btw en live preview"
```

---

## Task 8: PDF-generatie (lokale jsPDF + Bebas embed)

**Files:**
- Create: `admin/vendor/jspdf.umd.min.js`
- Create: `admin/vendor/jspdf.plugin.autotable.min.js`
- Create: `admin/vendor/bebas-font.js`
- Modify: `admin/factuur/index.html` (PDF-knop + generatie)

- [ ] **Step 1: Download jsPDF + autotable lokaal**

```bash
curl -L -o admin/vendor/jspdf.umd.min.js https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js
curl -L -o admin/vendor/jspdf.plugin.autotable.min.js https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js
```
Verifieer: beide bestanden > 10 kB en beginnen niet met een HTML-foutpagina (`head -c 100`).

- [ ] **Step 2: Genereer `admin/vendor/bebas-font.js` (Bebas Neue als jsPDF-VFS)**

Download de TTF en converteer naar base64-VFS. Script (eenmalig, lokaal):
```bash
curl -L -o bebas.ttf "https://github.com/dharmatype/Bebas-Neue/raw/master/fonts/ttf/BebasNeue-Regular.ttf"
node -e "const fs=require('fs');const b=fs.readFileSync('bebas.ttf').toString('base64');fs.writeFileSync('admin/vendor/bebas-font.js','window.BEBAS_TTF_B64='+JSON.stringify(b)+';');"
```
Verifieer: `admin/vendor/bebas-font.js` bestaat en bevat een lange base64-string. Verwijder `bebas.ttf`.
Als de download faalt (404): laat een TODO-comment in de PDF-code en val terug op Helvetica; meld dit aan Michael.

- [ ] **Step 3: Voeg script-tags + PDF-knop toe aan `admin/factuur/index.html`**

In `<head>` of vóór eigen script:
```html
<script src="/admin/vendor/jspdf.umd.min.js"></script>
<script src="/admin/vendor/jspdf.plugin.autotable.min.js"></script>
<script src="/admin/vendor/bebas-font.js"></script>
```
Knop "Factuur genereren (PDF)".

- [ ] **Step 4: Schrijf de PDF-generatie**

```js
async function genereerPdf() {
  // 1) Reserveer nummer als het veld leeg is of als het nog geen gereserveerd nr is.
  if (!state.factuur.nummer) {
    try {
      const res = await fetch('/api/factuurnummer');
      if (res.ok) { state.factuur.nummer = (await res.json()).nummer; render(); }
    } catch { alert('Kon geen factuurnummer reserveren — vul handmatig in.'); return; }
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  // Bebas-font registreren (indien beschikbaar)
  let displayFont = 'helvetica';
  if (window.BEBAS_TTF_B64) {
    doc.addFileToVFS('Bebas.ttf', window.BEBAS_TTF_B64);
    doc.addFont('Bebas.ttf', 'Bebas', 'normal');
    displayFont = 'Bebas';
  }

  const oranje = [255, 140, 0];
  const donker = [13, 13, 13];
  const M = 48; // marge

  // Kop: logo + FACTUUR
  doc.setFont(displayFont, 'normal'); doc.setFontSize(28); doc.setTextColor(...donker);
  doc.text('MVDB', M, 60);
  const wMvdb = doc.getTextWidth('MVDB');
  doc.setTextColor(...oranje); doc.text('media', M + wMvdb, 60);
  doc.setTextColor(...donker); doc.setFontSize(30);
  doc.text('FACTUUR', 547, 60, { align: 'right' });

  // Afzender (rechtsboven, klein)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120);
  const afz = [AFZENDER.naam, AFZENDER.adres, AFZENDER.postcodePlaats, AFZENDER.email, AFZENDER.tel];
  afz.forEach((r, i) => doc.text(r, 547, 76 + i * 11, { align: 'right' }));

  // Klant (links)
  doc.setTextColor(...donker); doc.setFontSize(9);
  doc.text('Factuur aan:', M, 110);
  const klant = [state.klant.bedrijf, state.klant.contact, state.klant.adres,
                 state.klant.postcodePlaats, state.klant.email].filter(Boolean);
  klant.forEach((r, i) => doc.text(r, M, 124 + i * 12));

  // Factuurmeta (rechts)
  const meta = [
    ['Factuurnummer', state.factuur.nummer],
    ['Factuurdatum', state.factuur.datum],
    ['Vervaldatum', state.factuur.vervaldatum],
  ];
  if (state.factuur.referentie) meta.push(['Referentie', state.factuur.referentie]);
  meta.forEach((r, i) => {
    doc.text(r[0], 400, 124 + i * 12);
    doc.text(String(r[1]), 547, 124 + i * 12, { align: 'right' });
  });

  // Regeltabel
  const c = bereken();
  const body = state.regels.map((r) => [
    r.omschrijving, String(r.aantal),
    euro(r.stukprijs), euro(r.aantal * r.stukprijs),
  ]);
  doc.autoTable({
    startY: 200,
    head: [['Omschrijving', 'Aantal', 'Stukprijs', 'Totaal']],
    body,
    theme: 'plain',
    headStyles: { fillColor: donker, textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: donker },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: M, right: M },
  });

  // Totalen
  let y = doc.lastAutoTable.finalY + 20;
  const rij = (label, waarde, vet) => {
    doc.setFont('helvetica', vet ? 'bold' : 'normal');
    doc.text(label, 400, y); doc.text(waarde, 547, y, { align: 'right' }); y += 16;
  };
  rij('Subtotaal', euro(c.subtotaal));
  if (c.kortingBedrag > 0) rij(`Korting${state.korting.omschrijving ? ' — ' + state.korting.omschrijving : ''}`, '−' + euro(c.kortingBedrag));
  if (c.kortingBedrag > 0) rij('Subtotaal na korting', euro(c.naKorting));
  rij(state.btwVerlegd ? 'Btw' : `Btw ${state.btwTarief}%`, state.btwVerlegd ? 'verlegd' : euro(c.btwBedrag));
  doc.setDrawColor(...oranje); doc.line(400, y - 6, 547, y - 6);
  rij('Totaal', euro(c.totaal), true);

  // Betalingsvoorwaarden + bedrijfsgegevens onderaan
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(90);
  const voet = 780;
  doc.text(`Gelieve het bedrag binnen 14 dagen over te maken op IBAN ${AFZENDER.iban} o.v.v. het factuurnummer ${state.factuur.nummer}.`, M, voet, { maxWidth: 499 });
  doc.text(`${AFZENDER.naam} · KvK ${AFZENDER.kvk} · BTW ${AFZENDER.btw} · ${AFZENDER.web}`, M, voet + 24);

  // Opslaan
  const veiligeKlant = (state.klant.bedrijf || state.klant.contact || 'klant')
    .replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'klant';
  doc.save(`Factuur-${state.factuur.nummer}-${veiligeKlant}.pdf`);
}
```

- [ ] **Step 5: Test PDF-download in browser via wrangler dev**

jsPDF vanaf `/admin/vendor/` vereist geldige sessie (middleware). Draai:
`npx wrangler pages dev . --kv FACTUREN --port 8788` (met `.dev.vars`).
Login in browser op `http://localhost:8788/admin/login/` → ga naar factuur → vul een klant + klik een dienstkaart → klik "Factuur genereren (PDF)".
Expected: PDF downloadt als `Factuur-2026-00X-<klant>.pdf`; open hem: logo, oranje accent, regeltabel, totalen, betalingsvoorwaarden met IBAN + factuurnummer.

Controleer console: geen CSP-fouten (`script-src`), geen 404 op vendor-bestanden.

- [ ] **Step 6: Verifieer CSP niet gebroken**

Open DevTools → Console tijdens PDF-generatie. Expected: geen `Refused to load/execute` meldingen. Vendor-scripts laden onder `script-src 'self'`. Download via `doc.save()` triggert geen blob-CSP.

- [ ] **Step 7: Commit**

```bash
git add admin/vendor/ admin/factuur/index.html
git commit -m "factuur: client-side PDF-generatie met lokale jsPDF en Bebas-font"
```

---

## Task 9: Eindcontrole + documentatie voor Michael

**Files:**
- Create: `admin/README-setup.md` (setup-instructies, gitignored? nee — handig in repo, geen geheimen)

- [ ] **Step 1: Volledige flow-test (wrangler dev)**

1. `/admin/factuur/` zonder login → redirect naar login. ✓
2. Fout wachtwoord → foutmelding, geen toegang. ✓
3. Goed wachtwoord → factuurpagina. ✓
4. Dienstkaart klikken → regel met bewerkbare prijs/omschrijving. ✓
5. Vrije regel + korting + btw 0%/verlegd → totalen kloppen. ✓
6. PDF genereren → nummer gereserveerd (KV), download correct. ✓
7. Refresh → concept nog aanwezig (localStorage). ✓
8. Logout → cookie weg, `/admin/factuur/` weer geblokkeerd. ✓

- [ ] **Step 2: Draai audit.mjs + mobiel-screenshot (memory-regel voor deploy)**

Run: `node audit.mjs` (indien van toepassing op de nieuwe pagina's).
Run mobiel-screenshot van login + factuur op 390px. Lees, fix breuk.

- [ ] **Step 3: Schrijf `admin/README-setup.md`**

```markdown
# Beheeromgeving — setup

## Environment variables (Cloudflare Pages → Settings → Environment variables)

| Variabele | Hoe verkrijgen |
|---|---|
| `ADMIN_PASSWORD_SALT` | `node scripts/genereer-wachtwoord-hash.js` |
| `ADMIN_PASSWORD_HASH` | idem (zelfde run) |
| `SESSION_SECRET` | random, min. 32 tekens: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

## KV-namespace

1. Cloudflare dashboard → Workers & Pages → KV → namespace `facturen` aanmaken.
2. Pages-project → Settings → Functions → KV namespace bindings → variabelenaam **`FACTUREN`** koppelen.

## Nog aanleveren (nu weggelaten uit PAKKETTEN)

- Website Premium — prijs?
- Videografie — los pakket + prijs?
- Onderhoud/hosting-abonnement — prijs per maand/jaar?

Vul aan in `PAKKETTEN` bovenaan `admin/factuur/index.html` (comment-TODO staat er al).

## Lokaal draaien

`.dev.vars` met dezelfde vars, dan: `npx wrangler pages dev . --kv FACTUREN`
```

- [ ] **Step 4: Commit + eindrapport**

```bash
git add admin/README-setup.md
git commit -m "docs: setup-instructies beheeromgeving"
```

Rapporteer aan Michael: env vars, KV-binding, 3 ontbrekende prijzen.

---

## Zelfcontrole (dekking spec)

- Deel 1 login/beveiliging → Task 1,2,3 ✓ · Deel 2 niet-indexeren → Task 4 ✓
- Deel 3 generator → Task 7 ✓ · Deel 4 PDF → Task 8 ✓ · Deel 5 werkgemak (localStorage, preview, NL, mobiel) → Task 7 ✓
- Factuurnummer KV gat-loos + dubbelcheck → Task 5 ✓
- Hash-script → Task 1 ✓ · env vars gerapporteerd → Task 9 ✓
- Crypto-namen consistent: `derivePbkdf2Hex`, `verifyPassword`, `signSession`, `verifySession`, `parseCookie`, `sessionCookie`, `clearCookie` — identiek in `_lib/auth.js` en consumers ✓
