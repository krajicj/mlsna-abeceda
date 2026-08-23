# STEP-01 · Projekt, izolovaný toolchain, repozitář a nasazení na Pages

Status: done
Milník: M0 · Po: — · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 12 · Pravidla: `CLAUDE.md › Supply-chain security`

## Shrnutí

Založí kostru projektu tak, aby od prvního dne platila pravidla proti supply-chain útokům:
veškerý toolchain (pnpm, Vite, TypeScript, Vitest, Prettier) běží výhradně v Docker
kontejnerech – `node_modules` a pnpm store žijí v pojmenovaných volumech, dev/test/build
kontejnery nemají přístup k internetu, instalují se jen verze starší než 14 dní a install
skripty závislostí jsou zakázané. K tomu git repozitář, veřejný GitHub repozitář
`krajicj/mlsna-abeceda`, GitHub Actions workflow (akce pinnuté na SHA) a placeholder stránka
živě na `https://krajicj.github.io/mlsna-abeceda/`. Umožní STEP-02 (scéna) a STEP-03 (logika)
bez infrastrukturních starostí. Hra nemá žádné runtime závislosti.

## Rozsah

**V rozsahu**
- `Dockerfile` (Node 22 pinnutý na digest, pnpm zapečené přes corepack) a `compose.yaml`
  se službami `init`, `install`, `add`, `vite` + `dev` (socat proxy), `test`, `check`, `build`.
- `package.json` (pinnuté verze, `packageManager` s hashem), `pnpm-workspace.yaml`
  (cooldown, exotické zdroje, trust policy), `pnpm-lock.yaml`.
- `tsconfig.json` (strict), `vite.config.ts` (`base`, dev server pro kontejner, Vitest).
- `index.html` + `src/main.ts` + `src/style.css`: placeholder jen s názvem hry (logo).
- `src/game/version.ts` + `src/game/version.test.ts`: první modul logiky a reálný test.
- `.gitignore`, `.dockerignore`, `elevenlabs.env.example`, `.nvmrc`, `.prettierrc`,
  `.prettierignore`, `README.md` (EN), `LICENSE` (MIT), `LICENSE-ASSETS.md` (CC BY-NC 4.0).
- `.github/workflows/deploy.yml`: install → check → test → build → Pages, akce na SHA.
- Aktualizace `CLAUDE.md` (sekce *Project status*; v *Commands* poznámka k první instalaci).
- `git init`, vytvoření repozitáře přes `gh`, zapnutí Pages (zdroj GitHub Actions), ověření
  nasazené stránky. Empirické ověření cooldownu, blokace skriptů a izolace sítě.

**Mimo rozsah**
- Škálovaná scéna, přepínání scén, audio, orientace (STEP-02); herní logika (STEP-03).
- Služba `voice` a skript pro ElevenLabs (STEP-07); PWA, fonty (STEP-19).
- ESLint, Playwright, Dependabot, ochrana větve, vlastní doména, `preview` server.

## Implementace

**Soubory**
```
Dockerfile                           (nový)
.dockerignore                        (nový)  → "*" + "!Dockerfile" (Dockerfile nic nekopíruje)
compose.yaml                         (nový)
pnpm-workspace.yaml                  (nový)
package.json                         (nový)
pnpm-lock.yaml                       (nový, generuje první install; commituje se)
tsconfig.json                        (nový)
vite.config.ts                       (nový)
index.html                           (nový)
src/main.ts                          (nový)
src/style.css                        (nový)
src/game/version.ts                  (nový)
src/game/version.test.ts             (nový)
.gitignore                           (nový)
elevenlabs.env.example               (nový)
.nvmrc                               (nový)  → "22"
.prettierrc                          (nový)
.prettierignore                      (nový)
README.md                            (nový, anglicky)
LICENSE                              (nový, MIT)
LICENSE-ASSETS.md                    (nový, CC BY-NC 4.0)
.github/workflows/deploy.yml         (nový)
CLAUDE.md                            (změna) „Project status“ (M0 hotovo, kód existuje) a v „Commands“
                                     jen poznámka k první instalaci bez lockfile (ostatní příkazy už tam jsou)
```
Existující `.claude/` a `docs/` jdou do prvního commitu beze změny.

**Verze (cooldown 14 dní, dnes 23. 8. 2026 → nic mladšího než 9. 8. 2026)**

| Balíček | Verze | Publikováno | Poznámka |
|---|---|---|---|
| pnpm | 11.20.0 | 2026-08-03 | v `packageManager`, hash níže; 11.21+ je mladší než 14 dní |
| vite | 8.2.1 | 2026-08-06 | 8.2.2 vyšlo 20. 8. – příliš čerstvé |
| vitest | 4.1.10 | 2026-07-06 | peer `vite ^6 \|\| ^7 \|\| ^8` |
| typescript | 5.9.3 | 2025-09-30 | existují i 6.0.3 (2026-04-16, přechodová řada s deprecacemi) a 7.0.2 (2026-07-08, nový nativní kompilátor `tsgo`); záměrně 5.9.3 – typy Vite 8 / Vitest 4 jsou vydané proti 5.x, potřebujeme jen `tsc --noEmit`, a nový major bereme až po ≥ 60 dnech a při kvartální aktualizaci (viz `CLAUDE.md › Supply-chain security` bod 2) |
| prettier | 3.9.6 | 2026-07-21 | bez závislostí |
| node image | `node:22-bookworm-slim@sha256:d649c27dae7ba0137b3cef5dd75baa422c08dc3d9e3fc0c23dfb172dc3cc6436` | Node 22.23.2 | digest ověřen 23. 8. 2026 |
| socat image | `alpine/socat@sha256:3d9e7966201dd3a065df591020a09fd3c70845de7e7086e3531ea69db774406b` | | jen TCP proxy portu |

Žádné runtime závislosti. Install skripty zůstávají zakázané (Vite/esbuild/rolldown je
nepotřebují – binárky mají v optional dependencies); `allowBuilds` se nevyplňuje.

**Kroky**
1. Napsat soubory z tabulky (obsah v Kontraktu). Ne `npm create vite`, ne `corepack use` –
   vše ručně a pinnuté.
2. `docker compose build` (vytvoří image `mlsna-abeceda-toolchain` s pnpm 11.20.0).
3. První instalace bez lockfile: `docker compose run --rm install pnpm install`
   (služba `install` má výchozí `--frozen-lockfile`, které bez lockfile selže). Vznikne
   `pnpm-lock.yaml`; výstup pnpm má obsahovat „Ignored build scripts“ (nebo žádnou zmínku
   o skriptech) – nic se nespustilo.
3b. `docker compose run --rm check pnpm format` – sjednotí formátování všech souborů podle
   Prettieru (jinak `check` selže na `package.json` a CSS).
4. `docker compose run --rm check`, `test`, `build` – vše zelené; `dist/` vznikne na hostiteli
   (bind mount), `node_modules/` na hostiteli zůstane **prázdný adresář** (jen mountpoint).
5. `docker compose --profile dev up` → `http://localhost:5173/mlsna-abeceda/` zobrazí
   placeholder; v druhém terminálu ověřit izolaci:
   `docker compose exec vite node -e "fetch('https://registry.npmjs.org/').catch(e=>console.log(e.cause?.code))"`
   → `EAI_AGAIN` (žádné DNS/egress). Když HMR nereaguje na změnu souboru, spustit
   s `VITE_POLL=1 docker compose --profile dev up` a zapsat to do Výsledku.
6. Empirický test cooldownu: dočasně v `package.json` nastavit `"vite": "8.2.2"`, smazat
   `pnpm-lock.yaml`, `docker compose run --rm install pnpm install` → musí selhat s chybou
   o `minimumReleaseAge` (`ERR_PNPM_NO_MATURE_MATCHING_VERSION`); vrátit ručně `8.2.1`
   a znovu `docker compose run --rm install pnpm install` (git ještě neexistuje).
7. `git init -b main`; ověřit `git status`, že `node_modules/`, `dist/`, `personal.json`,
   `elevenlabs.env` ani `docs/design/mlsna-abeceda-screens.html` nejsou ve výpisu (dočasně
   vytvořit prázdné `personal.json` a `elevenlabs.env`, zkontrolovat, smazat).
8. **Zastavit a nahlásit autorovi.** Po pokynu „commit“:
   - `git add -A && git commit -m "STEP-01: project setup, isolated toolchain and Pages deploy"`
   - `gh repo create krajicj/mlsna-abeceda --public --source=. --remote=origin
     --description "Educational web game for a 4-year-old: letters, digits, counting and first reading through a magic kitchen (Czech)"`
     (**bez `--push`** – push by spustil workflow dřív, než jsou Pages zapnuté)
   - `gh api -X POST repos/krajicj/mlsna-abeceda/pages -f build_type=workflow`
     (když už existují → `-X PUT`)
   - `git push -u origin main` → `gh run watch`; po doběhnutí
     `curl -s https://krajicj.github.io/mlsna-abeceda/ | grep -q "<title>Mlsná abeceda</title>"`
     a `curl -s -o /dev/null -w "%{http_code}" https://krajicj.github.io/mlsna-abeceda/` → `200`.
9. Vyplnit Výsledek implementace, přepnout stavy.

**Klíčová rozhodnutí**
- **pnpm místo npm**: npm 10 žádné „minimální stáří verze“ neumí; pnpm `minimumReleaseAge`
  platí i pro tranzitivní balíčky a s explicitním nastavením je strict (instalace selže,
  místo aby potichu vzala mladší verzi). Blokuje install skripty defaultně.
- **pnpm zapečené v image přes corepack** (`corepack install -g pnpm@11.20.0` při buildu,
  `COREPACK_ENABLE_NETWORK=0` za běhu): služby bez sítě by si jinak pnpm nemohly stáhnout.
  Hash v `packageManager` corepack kontroluje **při stahování** (tedy v CI po `corepack enable`
  a při buildu obrazu); offline v kontejneru už jen vybere zapečenou verzi podle čísla –
  integrita pnpm v obrazu tak stojí na buildu z registru a na digestu obrazu.
- **Profily**: služby bez `profiles` Compose startuje při každém `up`; proto mají
  `install`/`add`/`test`/`check`/`build` profil `cli` a `vite`/`dev` profil `dev` –
  `--profile dev up` pak spustí jen `init` + `vite` + `dev`, `run --rm <služba>` si svůj profil
  zapne sám.
- **Izolace sítě dev serveru**: Docker nepublikuje porty ze sítě `internal: true`, proto
  běží Vite na interní síti a port 5173 na hostitele publikuje socat sidecar (`dev`), který je
  v obou sítích. Vite kontejner nemá DNS ani egress (ověřeno: `EAI_AGAIN`). `test`/`check`/
  `build` mají rovnou `network_mode: none`.
- **Non-root v kontejneru**: služby běží jako `node` (uid 1000), `cap_drop: ALL`,
  `no-new-privileges`. Pojmenované volumy vznikají root-owned, proto služba `init` (jediná
  jako root, bez sítě) udělá `chown` – ostatní služby na ni závisí přes `depends_on`, takže
  běží automaticky a je idempotentní.
- `node_modules` v pojmenovaném volumu (ne na hostiteli) – na hostiteli zůstane jen prázdný
  mountpoint; pnpm store v druhém volumu, aby se balíčky nestahovaly při každém `run`.
- `base: '/mlsna-abeceda/'` natvrdo; dev i produkce na stejné cestě.
- Vitest s `environment: 'node'`; jsdom až bude potřeba.
- Akce pinnuté na commit SHA s komentářem verze; žádné cache akce (instalace trvá sekundy).
- Copyright v `LICENSE`: `Copyright (c) 2026 krajicj`, dokud autor neřekne jméno.

## Kontrakt

**`Dockerfile`**
```dockerfile
FROM node:22-bookworm-slim@sha256:d649c27dae7ba0137b3cef5dd75baa422c08dc3d9e3fc0c23dfb172dc3cc6436
ENV COREPACK_HOME=/opt/corepack \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# Bake the pinned pnpm into the image so every service runs without network access.
RUN corepack enable \
 && corepack install -g pnpm@11.20.0 \
 && chmod -R a+rX /opt/corepack
ENV COREPACK_ENABLE_NETWORK=0
USER node
WORKDIR /app
```

**`compose.yaml`**
```yaml
# All toolchain commands run here – see CLAUDE.md › Commands.
x-toolchain: &toolchain
  build: .
  image: mlsna-abeceda-toolchain
  user: node
  working_dir: /app
  init: true
  cap_drop: [ALL]
  security_opt: ['no-new-privileges:true']
  volumes:
    - .:/app
    - node_modules:/app/node_modules
    - pnpm-store:/home/node/.local/share/pnpm
  depends_on:
    init:
      condition: service_completed_successfully

services:
  # Named volumes are created root-owned; hand them to user `node`. Idempotent.
  init:
    build: .
    image: mlsna-abeceda-toolchain
    user: root
    network_mode: none
    volumes:
      - node_modules:/app/node_modules
      - pnpm-store:/home/node/.local/share/pnpm
    command: chown node:node /app/node_modules /home/node/.local/share/pnpm

  # Services under the `cli` profile are never started by `--profile dev up`; `docker compose run`
  # enables a profile automatically for the service it targets.
  install: # internet access (registry); first time without a lockfile: `run --rm install pnpm install`
    <<: *toolchain
    profiles: [cli]
    command: pnpm install --frozen-lockfile

  add: # internet access; usage: docker compose run --rm add -D <pkg>@<exact-version>
    <<: *toolchain
    profiles: [cli]
    entrypoint: ['pnpm', 'add']

  vite: # dev server on an internal network – no DNS, no egress
    <<: *toolchain
    profiles: [dev]
    networks: [isolated]
    environment:
      VITE_POLL: ${VITE_POLL:-0}
    command: pnpm dev

  dev: # publishes the dev server to the host: http://localhost:5173/mlsna-abeceda/
    image: alpine/socat@sha256:3d9e7966201dd3a065df591020a09fd3c70845de7e7086e3531ea69db774406b
    profiles: [dev]
    user: '65534:65534'
    cap_drop: [ALL]
    read_only: true
    networks: [default, isolated]
    ports: ['127.0.0.1:5173:5173']
    command: TCP-LISTEN:5173,fork,reuseaddr TCP:vite:5173
    depends_on: [vite]

  test:
    <<: *toolchain
    profiles: [cli]
    network_mode: none
    command: pnpm test

  check:
    <<: *toolchain
    profiles: [cli]
    network_mode: none
    command: pnpm check

  build:
    <<: *toolchain
    profiles: [cli]
    network_mode: none
    command: pnpm build

networks:
  isolated:
    internal: true

volumes:
  node_modules:
  pnpm-store:
```

**`pnpm-workspace.yaml`**
```yaml
minimumReleaseAge: 20160 # 14 days, applies to transitive packages too; strict by default when set
blockExoticSubdeps: true # transitive deps may not come from git/tarball URLs
trustPolicy: no-downgrade
savePrefix: '' # exact versions, never ^ or ~
```

**`package.json`**
```json
{
  "name": "mlsna-abeceda",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "packageManager": "pnpm@11.20.0+sha512.9a6f330a95b66446ea088faf1521405a8a01f07fde7124cc9958dfed52d4bb436737e65b08f85f37b46fcba375092558ac51262b816844b22f63406ed166bfee",
  "engines": {
    "node": ">=22.12"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "check": "tsc --noEmit && prettier --check .",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "prettier": "3.9.6",
    "typescript": "5.9.3",
    "vite": "8.2.1",
    "vitest": "4.1.10"
  }
}
```
(Hash = hex sha512 tarballu `pnpm@11.20.0` z registru – `dist.integrity` převedené z base64;
corepack vyžaduje hex.)

**`tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "useDefineForClassFields": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```
(`vite.config.ts` není v `include` – používá `process.env`, které bez `@types/node` typy
neznají; Vite si config transpiluje sám.)

**`vite.config.ts`**
```ts
import { defineConfig } from 'vitest/config';

const usePolling = process.env['VITE_POLL'] === '1'; // fallback when bind-mount file events do not reach the container

export default defineConfig({
  base: '/mlsna-abeceda/',
  server: {
    host: true, // listen on 0.0.0.0 inside the container (reached through the socat proxy)
    port: 5173,
    strictPort: true,
    watch: usePolling ? { usePolling: true, interval: 500 } : undefined,
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
```

**`src/game/version.ts`** – první modul logiky; STEP-03 naváže ukládáním.
```ts
/** Version of the localStorage save format. Bump on every breaking change (with a migration). */
export const SAVE_VERSION = 1 as const;
/** localStorage key of the save record. */
export const SAVE_KEY = 'kk.save.v1' as const;
```
Test `src/game/version.test.ts` (Vitest `describe/it/expect`): `SAVE_VERSION === 1` a `SAVE_KEY`
končí na `.v${SAVE_VERSION}`.

**`index.html`**
```html
<!doctype html>
<html lang="cs">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Mlsná abeceda</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```
**`src/main.ts`** – **začíná `import './style.css';`** a do `#app` vloží
`<main class="splash"><h1>Mlsná abeceda</h1></main>` – jen název hry (logo), žádný další text,
aby placeholder neporušoval pravidlo „hráč neumí číst“; nahradí ho STEP-02.
**`src/style.css`** (už ve tvaru, který Prettier nechá být – jedna deklarace na řádek, hex malými písmeny)
```css
html,
body {
  margin: 0;
  height: 100%;
  overflow: hidden;
}

body {
  background: #ffe9d1;
  color: #3b2a1a;
  font-family: system-ui, sans-serif;
}

.splash {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 24px;
}

h1 {
  font-size: clamp(32px, 6vw, 64px);
  margin: 0;
}
```
Všechny soubory z Kontraktu se po napsání prohnaly `docker compose run --rm check pnpm format`
(krok 3b), aby `check` v Dockeru i v CI prošel – Prettier mj. rozepisuje `engines` v `package.json`
na více řádků.

**`.gitignore`**
```
node_modules/
dist/
coverage/
*.env
!*.env.example
.env*
personal.json
docs/design/mlsna-abeceda-screens.html
.DS_Store
```

**`elevenlabs.env.example`** (kopie patří do `~/.config/mlsna-abeceda/elevenlabs.env`, mimo repozitář)
```
# Copy to ~/.config/mlsna-abeceda/elevenlabs.env – used only by the `voice` service (STEP-07), never by the game.
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

**`.prettierrc`**: `{ "singleQuote": true, "printWidth": 100 }`.
**`.prettierignore`**: `dist/`, `node_modules/`, `docs/`, `.claude/`, `pnpm-lock.yaml`.

**`.github/workflows/deploy.yml`**
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version-file: .nvmrc
      - run: corepack enable # pnpm version + hash come from package.json#packageManager
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - run: pnpm test
      - run: pnpm build
      - uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128 # v5.0.0
```

**`README.md`** (anglicky, ~25 řádků): co hra je, odkaz na živou verzi, Docker příkazy
(`docker compose build`, `run --rm install pnpm install` poprvé, `--profile dev up`, `run --rm test|check|build`),
proč Docker (odkaz na `CLAUDE.md › Supply-chain security`), odkaz na `docs/navrh-hry.md` (Czech), licence. Žádná jména.

**`LICENSE-ASSETS.md`**: graphics in `src/art/`, `docs/design/` and audio in `public/audio/` are
CC BY-NC 4.0; the Fredoka font keeps its OFL license; ElevenLabs audio is subject to their terms.

**`CLAUDE.md` změny**: v *Project status* nahradit „Phase: design. No code yet“ za
„Phase: M0 – project skeleton exists, deployed to Pages (STEP-01)“; v *Commands* doplnit
poznámku, že první instalace bez lockfile je `docker compose run --rm install pnpm install`
(ostatní příkazy tam už jsou).

## Akceptační kritéria

- KDYŽ `docker compose build`, PAK `docker compose run --rm test pnpm -v` vypíše `11.20.0`
  (služba `test` má `network_mode: none`, pnpm tedy běží z obrazu bez sítě).
- KDYŽ `docker compose run --rm install pnpm install` (první instalace), PAK vznikne
  `pnpm-lock.yaml`, výstup neobsahuje žádný spuštěný build skript (pouze případné
  „Ignored build scripts“) a `pnpm-workspace.yaml` nemá `allowBuilds`.
- KDYŽ se v `package.json` nastaví `"vite": "8.2.2"` a smaže lockfile, PAK
  `docker compose run --rm install pnpm install` **selže** s chybou zmiňující
  `minimumReleaseAge`; po návratu na `8.2.1` projde.
- KDYŽ `docker compose run --rm check` / `test` / `build`, PAK každé skončí kódem 0; `test`
  vypíše 1 soubor, 2 testy; `build` vytvoří `dist/index.html`, v němž odkazy na assety
  začínají `/mlsna-abeceda/`.
- KDYŽ `docker compose run --rm test id -u`, PAK `1000` (uživatel `node`, ne root).
- KDYŽ `docker compose --profile dev up`, PAK `http://localhost:5173/mlsna-abeceda/` v Chrome
  zobrazí „Mlsná abeceda“ na krémovém pozadí a `curl -sI http://localhost:5173/` vrátí `302`
  s `Location: /mlsna-abeceda/`.
- KDYŽ v běžícím `vite` kontejneru `fetch('https://registry.npmjs.org/')`, PAK selže
  s `EAI_AGAIN` (žádný egress).
- KDYŽ se na hostiteli spustí `ls node_modules`, PAK je adresář prázdný (balíčky jsou jen ve volumu);
  na hostiteli se nikdy nespouští `pnpm`, `npm` ani `node` pro tento projekt.
- KDYŽ existují `personal.json`, `elevenlabs.env` a `docs/design/mlsna-abeceda-screens.html`,
  PAK `git status --porcelain` žádný z nich neukáže.
- KDYŽ se pushne `main`, PAK workflow „Deploy to GitHub Pages“ projde (install s
  `--frozen-lockfile`, check, test, build) a do 5 minut `https://krajicj.github.io/mlsna-abeceda/`
  vrátí HTTP 200 s `<title>Mlsná abeceda</title>`.
- KDYŽ workflow selže v `check`, `test` nebo `build`, PAK job `deploy` neběží.
- KDYŽ `grep -E "uses: .*@v[0-9]" .github/workflows/deploy.yml`, PAK nic nenajde (všechny
  akce na SHA).
- KDYŽ se nasazená stránka otevře v rozměru mobilu na šířku (844×390), PAK nemá vodorovné
  posouvání a text je čitelný.
- KDYŽ `gh repo view krajicj/mlsna-abeceda`, PAK je repozitář veřejný s výchozí větví `main`;
  `gh api repos/krajicj/mlsna-abeceda/pages --jq .build_type` vrací `workflow`.

## Testy

- Unit (Vitest): `src/game/version.test.ts` – dva asserty na `SAVE_VERSION` a `SAVE_KEY`.
- Spuštění: `docker compose run --rm test`; v CI krok `pnpm test` před `pnpm build`.

## Ruční ověření

- [ ] `docker compose --profile dev up` → `http://localhost:5173/mlsna-abeceda/`: název hry na krémovém pozadí, bez chyb v konzoli; změna textu v `src/main.ts` se projeví (HMR) – jinak zapsat nutnost `VITE_POLL=1`.
- [ ] `docker compose exec vite node -e "fetch('https://registry.npmjs.org/').catch(e=>console.log(e.cause?.code))"` → `EAI_AGAIN`.
- [ ] Cooldown test z kroku 6 (vite 8.2.2 odmítnuto).
- [ ] `ls node_modules` na hostiteli prázdný; `docker volume ls` ukazuje `mlsna-abeceda_node_modules` a `mlsna-abeceda_pnpm-store`.
- [ ] `git status` před commitem neukazuje ignorované soubory.
- [ ] Po pushi: `gh run watch` zelený; `https://krajicj.github.io/mlsna-abeceda/` v Chrome na desktopu i v emulaci mobilu na šířku (844×390) bez vodorovného scrollu.

## DoD

- [ ] Všechna akceptační kritéria splněna
- [ ] Testy, check a build zelené (lokálně v Dockeru i v CI)
- [ ] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [ ] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

Implementováno a nasazeno 23. 8. 2026. Hotové jsou všechny kroky včetně kroku 8
(commit `117bfae`, veřejný repozitář, Pages, živá stránka).

**Vytvořené soubory** (přesně podle Kontraktu): `Dockerfile`, `.dockerignore`, `compose.yaml`,
`pnpm-workspace.yaml`, `package.json`, `pnpm-lock.yaml` (46 balíčků), `tsconfig.json`,
`vite.config.ts`, `index.html`, `src/main.ts`, `src/style.css`, `src/game/version.ts`,
`src/game/version.test.ts`, `.gitignore`, `elevenlabs.env.example`, `.nvmrc`, `.prettierrc`,
`.prettierignore`, `README.md`, `LICENSE`, `LICENSE-ASSETS.md`,
`.github/workflows/deploy.yml`. Upraveno: `CLAUDE.md` (*Project status* → M0, v *Commands*
řádek pro první instalaci bez lockfile). Založen git repozitář (`git init -b main`),
zatím bez commitu.

**Odchylky od plánu**

1. **`name: mlsna-abeceda` v `compose.yaml`.** Pracovní adresář se jmenoval
   `pismenka_a_cislice` (po dokončení kroku přejmenován na `mlsna-abeceda`), Compose z něj
   odvozoval jméno projektu i prefix volumů. Plán
   (Ruční ověření) počítá s `mlsna-abeceda_node_modules` / `mlsna-abeceda_pnpm-store`;
   explicitní `name` to zaručuje nezávisle na jménu adresáře.
2. **pnpm store visí na `/app/.pnpm-store`, ne na `/home/node/.local/share/pnpm`.** První
   instalace ukázala, že pnpm si store vybírá na stejném zařízení jako projekt: protože
   `/app` je bind mount, uložil ho do `/app/.pnpm-store` – tedy 67 MB **na hostiteli**, přesně
   to, čemu se plán chtěl vyhnout. Volume `pnpm-store` je proto namountovaný rovnou na
   `/app/.pnpm-store` (a `init` chownuje tuto cestu). Absolutní cestu do `pnpm-workspace.yaml`
   jsem záměrně nedával – v CI (GitHub Actions) by neexistovala. Do `.gitignore` přibyl řádek
   `.pnpm-store/`; na hostiteli zůstávají oba adresáře prázdné (0 B).
3. **Prettier přeformátoval `CLAUDE.md`** (krok 3b) – zarovnal sloupce tabulky technologií.
   Obsah beze změny, jen kosmetika; `check` teď na `CLAUDE.md` prochází.

**Ověření** (vše v Dockeru, na hostiteli neběžel žádný `node`/`pnpm`/`npm`)

- `docker compose build`; `run --rm test pnpm -v` → `11.20.0`, `run --rm test id -u` → `1000`.
- První instalace `run --rm install pnpm install`: vznikl `pnpm-lock.yaml`, žádný build skript
  se nespustil ani nebyl hlášen jako ignorovaný (rolldown 1.2.3 má binárky v optional
  dependencies), `allowBuilds` prázdné.
- `check`, `test` (1 soubor, 2 testy), `build` – vše kód 0; `dist/index.html` odkazuje na
  `/mlsna-abeceda/assets/…`, CSS se emituje (import v `main.ts` funguje).
- Cooldown: `vite 8.2.2` + smazaný lockfile → instalace selhala kódem 1 s
  `ERR_PNPM_NO_MATURE_MATCHING_VERSION` (a odmítla i tranzitivní `rolldown@1.2.4`); po návratu
  na `8.2.1` se lockfile vygeneroval **bajt po bajtu stejný** jako předtím.
- `--profile dev up`: `curl -sI http://127.0.0.1:5173/` → `302` na `/mlsna-abeceda/`; stránka
  se servíruje. V Chrome (desktop) název „Mlsná abeceda“ na krémovém pozadí `rgb(255,233,209)`,
  v konzoli jen `[vite] connecting…/connected.`, žádná chyba. Mobil na šířku ověřen v iframe
  844×390 (okno prohlížeče na Retině nejde zmenšit pod velikost viewportu): žádné vodorovné
  ani svislé posouvání, `scrollWidth` 844, velikost písma 50,6 px.
- HMR: změna textu v `src/main.ts` se projevila bez `VITE_POLL` (`page reload src/main.ts`
  v logu Vite, DOM aktualizován) – proměnná `VITE_POLL` tedy zůstává jen jako pojistka.
- Izolace: `docker compose exec vite node -e "fetch('https://registry.npmjs.org/')…"` →
  `EAI_AGAIN`. `test`/`check`/`build` mají `network_mode: none`.
- Hostitel čistý: `node_modules` i `.pnpm-store` 0 B; volumy `mlsna-abeceda_node_modules`
  a `mlsna-abeceda_pnpm-store`.
- `.gitignore`: `git check-ignore` potvrdil `personal.json`, `elevenlabs.env`,
  `docs/design/mlsna-abeceda-screens.html`, `node_modules/`, `.pnpm-store/`; `git status`
  ukazuje jen `elevenlabs.env.example` (záměrná výjimka `!*.env.example`).
- Akce ve workflow: `grep -E "uses: .*@v[0-9]"` nic nenajde – vše na SHA.

**Krok 8 – repozitář a nasazení** (na pokyn autora)

- Commit `117bfae` (33 souborů), repozitář `krajicj/mlsna-abeceda` založen jako **veřejný**
  s výchozí větví `main`, remote přes SSH (token `gh` nemá scope `workflow`, přes HTTPS by
  push souboru ve `.github/workflows/` neprošel).
- Pages zapnuty přes API ještě před pushem: `build_type=workflow`.
- Push `main` → workflow „Deploy to GitHub Pages" (run 32660463695) zelený: `install
  --frozen-lockfile`, `check`, `test`, `build` (18 s), pak `deploy` (8 s).
- `https://krajicj.github.io/mlsna-abeceda/` vrací **200** s `<title>Mlsná abeceda</title>`,
  assety na `/mlsna-abeceda/assets/…` (CSS 200). V Chrome název na krémovém pozadí, konzole
  bez jediné zprávy; v rámu 844×390 (mobil na šířku) bez vodorovného i svislého posouvání.

**Neověřeno**

- Dotyk na skutečném tabletu (ověřeno jen v Chrome na desktopu a v emulaci rozměrem).
- Že `deploy` neproběhne při selhání `check`/`test`/`build` – plyne z `needs: build`,
  ale reálné selhání jsme nevyvolávali.

**Poznámky a návrhy mimo rozsah**

- Dev server se zastavuje `docker compose --profile dev down` (bez profilu `down` kontejnery
  profilu `dev` nesmaže) nebo Ctrl+C.
- Token `gh` má scopes `repo, read:org, gist, admin:public_key`, tedy **bez `workflow`** –
  push přes HTTPS by soubor `.github/workflows/deploy.yml` odmítl. Git protokol je nastavený
  na `ssh`, takže push přes SSH projde; jinak bude potřeba `gh auth refresh -s workflow`.
- pnpm hlásí dostupnou verzi 11.23.0 (mladší než 14 dní) – necháváme 11.20.0 na příští
  aktualizační kolo.
- Placeholder je zatím obyčejná stránka bez škálované scény; nahradí ho STEP-02.
