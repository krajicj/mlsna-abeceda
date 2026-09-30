# RESUME – Mlsná abeceda

Předávací dokument. Zdroj pravdy o mechanice: `docs/navrh-hry.md`; roadmapa: `docs/plan.md`; pravidla a technologie: `CLAUDE.md`.

## Kde jsme skončili

- Stav k 2026-09-30: `main` == `origin/main`, pracovní strom čistý, poslední commit `29dd4a1` (2026-09-02, doladění výslovnosti hlasových klipů písmen).
- Hotové jsou kroky STEP-01 až STEP-18 a STEP-20 (kostra, logika, kuchyně, hlas, smyčka, zvoneček a 3 zákazníci, adaptivní výběr, dvoupoložková objednávka, save v2, konec sezení, obchůdek, zmrzlinka, palačinky, slabikář a mluvící police) – milníky M0–M2 hotové, M3 rozpracovaný.
- Ruční ověření STEP-20 na tabletu nebylo provedeno (`docs/steps/STEP-20-primer-and-talking-shelves.md`, sekce s výsledkem: klepání v kuchyni, nad mříží a v otevřené klávesnici).
- STEP-19 (koktejl) nemá plán ani soubor v `docs/steps/`; `docs/plan.md` ho vede jako `—`.
- Nic nerozjetého v gitu: jen větev `main` (plus `agent/resume-md` s tímto souborem).

## Další 3 kroky

Plán říká (`docs/plan.md`): zbývá M3 (STEP-19, 21, 22, 31), pak M4 (23–25), M5, M6. Pořadí níže je **odhad**, plán žádné pořadí uvnitř M3 nestanovuje; kroky se stejným „Po“ jdou nezávisle.

1. **Ruční ověření STEP-20 na tabletu/dotykovém zařízení** (iPad landscape) – jediná explicitně nedokončená položka v repu. Jan/dcera vyzkouší; nálezy do `docs/steps/STEP-20-…md`.
2. **STEP-21 PWA** (service worker, manifest, offline, ikona na ploše) – závisí jen na STEP-02, odhad: další malý samostatný krok. `CLAUDE.md` počítá s ručně psaným `public/sw.js` (~50 řádků) a `manifest.webmanifest`; ve `public/` zatím žádný z nich není (jen `audio`, `fonts`). Poznámka z STEP-11: živá změna velikosti okna rozhodí popisky – při PWA srovnat.
3. **STEP-19 koktejl** (po STEP-17, hotovo) nebo **STEP-22 překvapení**: před implementací `/plan-step` (plán → review Sonnetem → schválení autorem, viz `CLAUDE.md` „How to work“). Volba mezi nimi je na Janovi (obsah hry).

Otevřené otázky z `docs/navrh-hry.md` kap. 13: přenos postupu mezi zařízeními (export/import vs. vlastní endpoint s rodinným kódem; druhá varianta porušuje pravidla „žádný backend/externí requesty“) – původně se mělo rozhodnout před obchůdkem, obchůdek už je hotový, rozhodnutí v repu nenalezeno.

---

## Jak spustit

Nikdy `npm`/`pnpm`/`node` na hostu; vše přes Docker Compose (`CLAUDE.md` › Commands).

```
docker compose build
docker compose run --rm install                 # pnpm install --frozen-lockfile
docker compose --profile dev up                 # http://localhost:5173/mlsna-abeceda/
docker compose run --rm test                    # vitest
docker compose run --rm check                   # tsc + prettier
docker compose run --rm build                   # vite build -> dist/
docker compose run --rm voice --dry-run         # kolik by stály chybějící hlášky
docker compose run --rm voice                   # generuje hlas (klíč ~/.config/mlsna-abeceda/elevenlabs.env)
docker compose run --rm normalize               # -18 LUFS
docker compose run --rm sfx                     # zvukové efekty
docker compose run --rm normalize-sfx
```

- Před commitem musí projít `test`, `check`, `build`.
- **Nikdy nezastavovat kontejnery** (`down`, `stop`, `kill`, `rm`) bez pokynu autora; dev server je to, v čem autor testuje. Při tvorbě tohoto dokumentu běží `mlsna-abeceda-dev-1` a `mlsna-abeceda-vite-1`.
- Nasazení: push do `main` spustí `.github/workflows/deploy.yml` (check, test, build, Pages) → https://krajicj.github.io/mlsna-abeceda/

## Architektura v kostce

- Vite + TypeScript strict, DOM + inline SVG, bez frameworku, **nula runtime závislostí**. Dev deps: typescript, vite, vitest, prettier.
- Složky `src/`: `stage/` (scéna 768 px vysoká, škálovaná, landscape), `scenes/`, `game/` (čistá logika bez DOM: objednávky, mastery, curriculum, save), `audio/`, `art/` (SVG), `data/` (manifest hlášek `lines.cs.ts`, `voices.ts`, `sfx.ts`, curriculum, zákazníci).
- Dvě nezávislé dráhy učení: čísla × písmena (`navrh-hry.md` kap. 5). Save v2 v `localStorage`, slučitelný (`earned` + `purchases`, migrace).
- Hlas: předgenerované MP3 z ElevenLabs (vypravěč `cook`), commitnuté v `public/audio/voice/<slug>/`; za běhu žádné požadavky. Věty se generují celé, nikdy se neskládají z fragmentů.
- Docs (česky): `docs/navrh-hry.md`, `docs/plan.md`, `docs/steps/STEP-NN-*.md`, `docs/design/`. Skills v `.claude/skills/`: `plan-step`, `implement-step`.

## Důležitá rozhodnutí a pravidla (z `CLAUDE.md`)

- Hráč neumí číst: žádný text v UI, vše hlasem a obrázkem. Nejde prohrát (žádné časovače/životy). Dotykové cíle ≥ 88 px, jen tap.
- Jména dítěte a rodiny jen v nastavení/`personal.json` (gitignorovaný), nikdy v kódu, testech, docs.
- Každý krok: `/plan-step` → schválení autorem → `/implement-step`. Commit a push jen na pokyn autora (`STEP-NN: název`). Bez codexu a externích review nástrojů.
- Supply-chain: 14denní cooldown balíčků, přesné verze, install skripty blokované, image Node pinnutý digestem. Nová závislost jen s odůvodněním v plánu kroku.
- Jazyk: čeština jen v chatu, `docs/` a textech hry; vše ostatní anglicky.
- Hudba ve v1 není. Zákazníci jsou jen zvířata; diakritika od stupně P4.
- Licence: kód MIT, grafika a audio CC BY-NC 4.0, Fredoka OFL.

## Známé problémy

- Při `READY_RATIO = 0,8` se může zavést další prvek dřív, než hra ukáže čekající (STEP-11, `docs/plan.md`); sledovat od sad P2/Č2.
- Živá změna velikosti okna rozhodí popisky na perníčcích a svíčkách (po reloadu OK) – `plan.md`, poznámka k STEP-11.
- ElevenLabs free tarif nestačí (HTTP 402 u Voice Library), generování potřebuje Starter.
- Kolize svíčky/perníčku u tří položek se řeší až od STEP-26/28.
- Hlasové klipy: poslední commit přegeneroval výslovnost písmen; manifest má dle plánu > 433 hlášek (přesný počet neověřen).
