# Beheeromgeving — setup

De factuurgenerator staat op `/admin/factuur/`, achter een wachtwoord op `/admin/login/`.
Precies één gebruiker, geen registratie. Deze map wordt niet geïndexeerd (noindex + robots.txt).

## 1. Environment variables (Cloudflare Pages → Settings → Environment variables)

| Variabele | Hoe verkrijgen |
|---|---|
| `ADMIN_PASSWORD_SALT` | `node scripts/genereer-wachtwoord-hash.js` — voer je wachtwoord in, plak de SALT-regel |
| `ADMIN_PASSWORD_HASH` | idem, dezelfde run (de HASH-regel) |
| `SESSION_SECRET` | random, min. 32 tekens: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

Zet deze bij **Production** (en desgewenst Preview). Je wachtwoord zelf komt nergens in de repo —
alleen de salt + hash. Wil je het wachtwoord wijzigen: draai het script opnieuw en vervang beide vars.

## 2. KV-namespace voor de factuurteller

1. Cloudflare dashboard → **Workers & Pages → KV** → **Create namespace**, naam bijv. `facturen`.
2. Pages-project → **Settings → Functions → KV namespace bindings** → **Add binding**:
   - Variable name: **`FACTUREN`** (exact deze naam)
   - KV namespace: de zojuist aangemaakte namespace
3. De teller start vanzelf op `2026-001` bij de eerste PDF-generatie.

## 3. Nog aanleveren (nu bewust weggelaten uit PAKKETTEN)

Deze diensten staan (nog) niet met prijs op de site en zijn daarom weggelaten:

- **Website Premium** — prijs?
- **Videografie** — los pakket + prijs?
- **Onderhoud/hosting-abonnement** — prijs per maand/jaar?

Vul aan in de `PAKKETTEN`-lijst bovenaan `admin/factuur/index.html`. Er staat al een
uitgecommentarieerd voorbeeld met TODO. Tot dan kun je ze per factuur via **"+ Regel toevoegen"** invoeren.

## 4. Lokaal draaien / testen

Maak een `.dev.vars` (gitignored) met dezelfde drie vars:

```
ADMIN_PASSWORD_SALT=...
ADMIN_PASSWORD_HASH=...
SESSION_SECRET=...
```

Start dan de lokale Cloudflare-omgeving:

```
npx wrangler pages dev . --kv FACTUREN
```

Open `http://localhost:8788/admin/login/`.

## Beveiliging in het kort

- Wachtwoord: PBKDF2-SHA256, 100.000 iteraties, constant-tijd vergelijking.
- Sessie: HMAC-gesigneerd token in een `HttpOnly; Secure; SameSite=Strict`-cookie, 7 dagen geldig.
- `/admin/*` wordt server-side afgeschermd (`functions/admin/_middleware.js`) — niet te omzeilen client-side.
- Login-pogingen: oplopende vertraging per IP (max 4 s) bij herhaald falen.
