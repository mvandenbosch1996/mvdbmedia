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

// PBKDF2 -> hex hash
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
