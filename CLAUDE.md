# Mlsná abeceda

Educational web game for a 4-year-old girl. Repository `krajicj/mlsna-abeceda` (public),
deployed at `https://krajicj.github.io/mlsna-abeceda/`.
Animals visit a magic kitchen and order cakes, ice creams and other treats; the child fulfils
the orders (counts fruit, picks the gingerbread cookie with the right letter) and thereby
learns letters and digits, later counting and reading. Static site on GitHub Pages; tablet,
touch laptop, phone and mouse-driven desktop — always landscape.

**The source of truth for game mechanics is `docs/navrh-hry.md` (Czech).** When code and
design disagree, ask which one is right first, then update the design doc.

## Language policy

Czech is allowed in exactly three places: **chat replies to the user**, **the `docs/`
folder** (design doc, roadmap, step plans, design-canvas notes) and **the game UI** (voice
lines, in-game text, speech bubbles). Everything else is English: code, comments,
identifiers, commit messages, file and directory names, skill names, status values,
`CLAUDE.md`, `.claude/*`, scripts, config, README. No Czech–English hybrids (`plan-krok` is
wrong; `plan-step` is right).

## Project status (August 2026)

- Phase: M0 done – project skeleton and isolated toolchain (STEP-01), scaled stage, scene
  switching, audio unlock on first tap and the portrait guard (STEP-02); the game itself is
  variant "C – Kouzelná kuchyně" (magic kitchen). A push to `main` deploys to Pages.
- The child does not know letters, counts to 20, recognises digits to 5 → learning runs on
  **two independent tracks** (numbers × letters), see design doc ch. 5.
- Names (child, family) live **only in settings** (localStorage) and in the git-ignored
  `personal.json` used to generate name voice clips — never in code, tests or docs in the repo.
- `docs/design/` – visual design (Claude Design canvas). `build-artboards.mjs` generates the
  artboards `Main.dc.html` (garden – rejected variant A) and `Kitchen.dc.html` (chosen
  kitchen); `mlsna-abeceda-screens.html` is generated output (git-ignored) — **never edit by
  hand**, regenerate and republish to the existing artifact URL.
- Open questions for the author: end of `docs/navrh-hry.md`. Step roadmap: `docs/plan.md`.
- Music: v1 ships without music (keep a toggle and `music.ts`; content later, maybe Suno).
- Customers are animals only; diacritics (Š, Č, …) only from letter stage P4.

## Technology (decided unless the author says otherwise)

| Area              | Choice                                                                                                                                                                           | Why                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Build             | Vite + TypeScript (`strict`)                                                                                                                                                     | fast dev server, static build for Pages                                                            |
| Rendering         | DOM + inline SVG + CSS animations / Web Animations API, no framework                                                                                                             | the game is "UI" (tap, move, animate); the design is already SVG; smallest surface for bugs        |
| Stage             | logical height 768, width 1024–1366 by aspect ratio, `transform: scale` to fit the window, landscape only                                                                        | one set of dimensions from phone to laptop; pointer events for touch and mouse                     |
| Audio             | own ~100-line wrapper over the Web Audio API (`src/audio/`)                                                                                                                      | our needs are small (play MP3 by id, queue, volume, unlock on first tap); no runtime dependency    |
| Voice             | ElevenLabs, one Voice Library voice (chosen by a casting, `ELEVENLABS_VOICE_ID`), **pre-generated** MP3 (model `eleven_multilingual_v2`, Czech), loudness-normalised to -18 LUFS | no API calls at runtime, zero latency, works offline; no voice cloning — the repo is public        |
| Fonts             | Fredoka (OFL), self-hosted in `public/fonts/`                                                                                                                                    | offline, no external requests                                                                      |
| Persistence       | `localStorage` (JSON, versioned key `kk.save.v1`) + export/import in the parent corner                                                                                           | no backend, no accounts                                                                            |
| PWA               | hand-written service worker (`public/sw.js`, ~50 lines: precache the build manifest) + `manifest.webmanifest`                                                                    | offline and home-screen icon without pulling in Workbox                                            |
| Tests             | Vitest for game logic (order generator, difficulty, Czech numeral forms)                                                                                                         | DOM-free logic is cheap to test; dev-only, runs in the container without network                   |
| Package manager   | pnpm (pinned via `packageManager` + corepack)                                                                                                                                    | enforces the release-age cooldown on all (transitive) packages, blocks install scripts by default  |
| Toolchain runtime | Docker Compose (`compose.yaml`), `node:22-bookworm-slim` pinned by digest                                                                                                        | nothing from npm ever runs or lands on the host; dev/test/build containers have no internet access |
| Deployment        | GitHub Actions → GitHub Pages (`vite build`, `base: '/mlsna-abeceda/'`)                                                                                                          | free, automatic from `main`                                                                        |
| Formatting        | Prettier (defaults)                                                                                                                                                              | no style debates                                                                                   |

**Runtime dependencies: zero.** Dev dependencies: `typescript`, `vite`, `vitest`, `prettier` — nothing
else without the justification described under "Supply-chain security".
Do not reopen the framework/engine question (Svelte, React, Phaser, Pixi) unless the author does.

## Planned structure

```
compose.yaml               # all toolchain commands run through Docker Compose (see Commands)
Dockerfile                 # node:22-bookworm-slim@sha256:… + corepack; runs as user `node`
pnpm-workspace.yaml        # pnpm settings: minimumReleaseAge, blockExoticSubdeps, trustPolicy
personal.json              # names for voice clips – git-ignored (template: personal.example.json)
public/
  audio/voice/<id>.mp3     # generated voice lines (committed)
  audio/voice/names/       # name clips (first names only) + index.json – committed
  audio/sfx/<id>.mp3       # sound effects
  fonts/                   # Fredoka
src/
  main.ts                  # bootstrap, stage scaling, audio unlock
  stage/                   # fixed 768-high stage scaled into the window, scene switching
  scenes/                  # title, kitchen, shop, album, parent (one folder = one scene)
  game/                    # pure DOM-free logic: orders.ts, mastery.ts (two tracks), curriculum.ts, save.ts
  audio/                   # voice.ts (playback by id), sfx.ts, music.ts – thin Web Audio wrapper, no library
  ui/                      # reusable pieces: speech bubble, pill, button, counter
  art/                     # SVG characters and props as TS templates (bear, cake, fruit…)
  data/
    lines.cs.ts            # manifest of ALL voice lines: { id, text, voice } – the only source for generation
    curriculum.ts          # letter/number order, words for letters ("M jako maminka")
    customers.ts           # customers and their lines
scripts/
  generate-voice.mjs       # ElevenLabs via plain fetch (no SDK): lines.cs.ts → public/audio/voice/; --names for personal.json
docs/navrh-hry.md          # game design (Czech)
docs/plan.md               # step roadmap and statuses (Czech)
docs/steps/                # one implementation plan per step (Czech)
docs/design/               # design canvas sources (see above)
```

## Commands

Never run `npm`, `pnpm` or `node` for this project on the host. Everything goes through
Docker Compose; `node_modules` and the pnpm store live in named volumes, not on the host.

```
docker compose build                     # toolchain image (Node 22 by digest + pinned pnpm)
docker compose run --rm install          # pnpm install --frozen-lockfile (internet: registry only)
docker compose run --rm install pnpm install   # only without a lockfile (first install / adding by hand)
docker compose --profile dev up          # dev server → http://localhost:5173/mlsna-abeceda/ (no internet in the container)
docker compose run --rm test             # vitest run          (network: none)
docker compose run --rm check            # tsc + prettier      (network: none)
docker compose run --rm build            # vite build → dist/  (network: none)
docker compose run --rm fonts            # download Fredoka (woff2 + OFL) into public/fonts/; run once, result is committed
docker compose run --rm voice            # generate voice lines; reads ~/.config/mlsna-abeceda/elevenlabs.env
docker compose run --rm normalize        # re-gain committed clips to -18 LUFS (ffmpeg, no key, no network)
docker compose run --rm add <pkg>@<ver>  # add a dependency (needs internet) – only with a justification in the step plan
```

The ElevenLabs key lives in `~/.config/mlsna-abeceda/elevenlabs.env` on the host — outside the
repository and outside the bind mount — and is passed only to the `voice` service.

## Non-negotiable rules

1. **The player cannot read.** No text in the game UI (exceptions: the parent corner, and the
   game title on the tap screen — a wordmark, not an instruction). Every instruction is voice +
   picture. Letters and digits on screen are _learning content_, not UI.
2. **You cannot lose.** No timers, lives, speed scores, red crosses. A mistake = gentle voice
   correction and a hint; the game never blocks progress.
3. **Touch targets ≥ 88 logical px** (≈ 44 physical px on a phone), landscape only, nothing
   scrolls, tap only — no drag, double tap or multi-finger gestures (except the parent lock).
   Pointer events, not separate touch/mouse handling.
4. **Progress is sacred.** Never delete saved data without explicit confirmation in the parent
   corner. A save-format change = migration with a version bump.
5. **No external requests at runtime.** No telemetry, ads, CDNs, web fonts. Names and personal
   settings live only in `localStorage` (and the git-ignored `personal.json`), never in code,
   tests or docs in the repo. The game must work without any name configured.
6. **Audio only after the first tap** (iOS/Chrome autoplay policy). The game starts with a
   "tap" screen that also unlocks audio.
7. **Every voice line has an id in `data/lines.cs.ts`.** Adding a line = add it to the manifest
   and run `docker compose run --rm voice`. Never concatenate fragments into sentences — Czech has cases and
   genders (tři jahody × pět jahod); whole sentences are generated.
8. **Art style:** flat, outline `#3B2A1A` 4 px, rounded shapes, Fredoka, palette from
   `docs/design/build-artboards.mjs`. New assets as inline SVG, no emoji.
9. **Secrets:** the ElevenLabs API key lives outside the repository
   (`~/.config/mlsna-abeceda/elevenlabs.env`) and never reaches code, the build or CI.
   Generated audio is committed so the CI build needs no key.

## Supply-chain security

npm supply-chain attacks (malicious `postinstall` scripts in freshly published versions of
popular transitive packages, exfiltrating host secrets) are the main technical risk of this
project. Rules:

1. **Minimal dependencies.** Runtime dependencies: zero. A new dev dependency needs, in the
   step plan: what work it saves, weekly downloads, number of transitive packages, whether it
   has install scripts, who maintains it. Prefer writing 100 lines over adding a package.
   Never run `npx` / `pnpm dlx` with arbitrary packages; no global installs.
2. **Release-age cooldown of 14 days** for every package, including transitive ones:
   `minimumReleaseAge: 20160` in `pnpm-workspace.yaml`. When pinning a version, check its
   publish date (`pnpm view <pkg> time`) and pick the newest stable version older than 14
   days. No prereleases (`beta`, `rc`, `next`, `canary`). A **new major** is adopted only
   after ≥ 60 days and during a planned update round, with the reason for skipping or taking
   it written in the step plan.
3. **Exact versions, committed lockfile.** No `^`/`~` in `package.json`; `pnpm install
--frozen-lockfile` in CI. pnpm itself is pinned in `packageManager` with its sha512 hash.
4. **Install scripts stay blocked** (pnpm default). Never add `allowBuilds` entries without a
   justification in the step plan; Vite/esbuild/rolldown work without scripts.
5. **Isolation.** All toolchain commands run in Docker (`compose.yaml`): dev/test/build/check
   containers have no network (`internal` network + socat port proxy for the dev server),
   run as user `node` with all capabilities dropped; only `install`, `add` and `voice` get
   internet. Node image pinned by digest. Nothing from npm is ever executed on the host.
6. **CI.** GitHub Actions pinned to commit SHAs (with a version comment), minimal
   `permissions`, no secrets, `--frozen-lockfile`, tests before deploy.
7. **Updates** are manual and rare (roughly quarterly), one step plan per update round,
   cooldown respected, changelogs read. No Dependabot/Renovate (noise, and auto-merge is
   exactly the wrong reflex).

## How to work

- **Every step goes through an implementation plan:** `/plan-step <brief>` writes
  `docs/steps/STEP-NN-<slug>.md` (draft → questions → plan → independent review by a fresh
  **Sonnet** agent → entry in `docs/plan.md`); the author **approves** it; only then
  `/implement-step STEP-NN` builds it. Roadmap and statuses: `docs/plan.md`.
  No codex or other external review tools — they waste tokens.
- New mechanic → write it into `docs/navrh-hry.md` first, then implement.
- Keep logic (orders, difficulty, persistence) in `src/game/` without DOM and cover it with tests.
- **Commits only on the author's instruction.** After a step is implemented and reported,
  the author reviews it and says "commit"; then commit (`STEP-NN: <step name>`) and push
  `main` (push = deploy to Pages). Never commit or push unprompted.
- Before a commit: `docker compose run --rm test`, `check` and `build` pass.
- **License:** code MIT; graphics and audio CC BY-NC 4.0 (`LICENSE`, `LICENSE-ASSETS.md`);
  Fredoka keeps its own OFL license.
- When testing in the browser, emulate a tablet (Chrome DevTools, iPad landscape) and try touch.
