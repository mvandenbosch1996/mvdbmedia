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
  console.log("\nPlak deze twee in Cloudflare Pages -> Settings -> Environment variables:\n");
  console.log(`ADMIN_PASSWORD_SALT=${salt.toString("hex")}`);
  console.log(`ADMIN_PASSWORD_HASH=${hash.toString("hex")}`);
})();
