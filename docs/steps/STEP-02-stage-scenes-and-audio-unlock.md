# STEP-02 · Responzivní scéna, přepínání scén, odemčení audia, orientace

Status: done
Milník: M0 · Po: [STEP-01](./STEP-01-project-setup-and-deploy.md) · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 2, 4, 10, 12

## Shrnutí

Postaví běhovou kostru hry, na které stojí všechny další scény: pevnou logickou scénu vysokou
768 px, jejíž šířka se řídí poměrem okna v rozmezí 1024–1366 px a která se do viewportu
škáluje jedním `transform: scale`. K tomu správce scén (mount, `destroy`, krátké prolnutí),
odemčení Web Audio prvním klepnutím podle pravidla 6 z `CLAUDE.md` a překryv „otoč zařízení“
pro režim na výšku. Grafika je záměrně jen placeholder – skutečnou kuchyni staví
[STEP-04](../plan.md) a herní logiku STEP-03. Tímto krokem je milník M0 hotový: kostra,
responzivní scéna, přepínání scén, audio odemčené dotykem, otočení na šířku a placeholder
grafika živě na Pages.

## Rozsah

**V rozsahu**

- `src/stage/layout.ts` – čistá matematika scény (`computeStage`, `isPortrait`) + Vitest testy.
- `src/stage/stage.ts` – DOM vrstva: `.viewport` / `.stage`, `ResizeObserver`, CSS proměnné
  `--stage-w`, `--stage-scale`, odběr změn velikosti.
- `src/stage/scenes.ts` – správce scén: registr, `go()`, `destroy()`, prolnutí 180 ms,
  přeposílání `resize` aktivní scéně, respekt k `prefers-reduced-motion`.
- `src/stage/orientation.ts` – překryv na výšku: animovaný telefon v SVG, bez textu.
- `src/audio/context.ts` – líné vytvoření `AudioContext`, `unlock()` v gestu, master gain,
  obnovení po návratu z pozadí; `src/audio/chime.ts` – dočasné cinknutí z oscilátoru.
- `src/scenes/title/` – úvodní obrazovka: nápis + pulzující dortík, klepnutí kamkoli
  odemkne zvuk, na dotykovém zařízení požádá o celou obrazovku a přejde do kuchyně.
- `src/scenes/kitchen/` – placeholder kuchyně: stěna, podlaha, tři kotvené bloky
  (zákazník vlevo / výrobek uprostřed / police vpravo) + dočasná dlaždice zpět na úvod
  (96 × 96, jen tvar – hvězdička v SVG, žádný text; STEP-04 ji odstraní).
- `src/style.css` – reset, letterbox, `.stage`, kotvicí třídy `.anchor-left/-center/-right`
  jako kontrakt pro STEP-04; per-scénové CSS v adresáři každé scény.
- `index.html` – `theme-color`, zákaz zoomu; `src/main.ts` – bootstrap.
- `CLAUDE.md` – aktualizace sekce *Project status* (M0 hotový) a **doplnění pravidla 1**
  o výjimku pro název hry na úvodní obrazovce (rozhodnutí autora 23. 8. 2026: úvod nese
  nápis „Mlsná abeceda“ jako značku; pokyn „klepni“ nese obrázek, ne text). Pravidlo se
  jinak nemění: v herním UI dál není žádný text kromě rodičovského koutku.

**Mimo rozsah**

- Skutečná grafika kuchyně, postavy a rekvizity (STEP-04), herní logika (STEP-03).
- Hlas – včetně hlášky „Otoč mě!“ a jejího záznamu v `src/data/lines.cs.ts` (STEP-07);
  v tomto kroku je překryv němý a v kódu je na to `TODO STEP-07`.
- Skutečné zvukové efekty (`sfx.ts`, `music.ts`), fronta hlášek (STEP-07).
- PWA, `manifest.webmanifest` s `orientation: landscape`, service worker, self-hostovaný
  Fredoka (STEP-19) – CSS už na Fredoku odkazuje, zatím padá na systémový zaoblený font.
- Ukládání a obnova scény po reloadu (STEP-11), rodičovský koutek a jeho zámek (STEP-16).
- Jakýkoli test v jsdom – přidání jsdom by znamenalo novou vývojovou závislost bez
  odpovídajícího užitku (viz `CLAUDE.md › Supply-chain security`, bod 1).

## Implementace

**Soubory**

```
src/main.ts                      (změna) bootstrap: stage, audio, orientace, správce scén
src/style.css                    (změna) reset, letterbox, .stage, kotvy
index.html                       (změna) theme-color, zákaz zoomu
src/stage/layout.ts              (nový)  čistá matematika scény
src/stage/layout.test.ts         (nový)  Vitest
src/stage/stage.ts               (nový)  DOM + ResizeObserver
src/stage/scenes.ts              (nový)  správce scén
src/stage/orientation.ts         (nový)  překryv na výšku
src/audio/context.ts             (nový)  AudioContext, unlock, master gain
src/audio/chime.ts               (nový)  dočasné cinknutí (nahradí STEP-07/09)
src/scenes/title/index.ts        (nový)  úvodní scéna
src/scenes/title/style.css       (nový)
src/scenes/kitchen/index.ts      (nový)  placeholder kuchyně
src/scenes/kitchen/style.css     (nový)
CLAUDE.md                        (změna) Project status + výjimka v pravidle 1 (název na úvodu)
```

**Knihovny** – **žádné nové závislosti.** Vše stojí na standardních API prohlížeče:
`ResizeObserver`, Web Animations API, `matchMedia`, Web Audio. Runtime závislosti zůstávají
nulové (`CLAUDE.md › Technology`).

**Kroky**

1. `src/stage/layout.ts` + test – nejdřív matematika, protože je jediná testovatelná
   a všechno ostatní z ní vychází.
2. `src/stage/stage.ts` – vytvoří `.viewport` a `.stage`, sleduje `.viewport`
   `ResizeObserver`em, po každé změně přepočítá a nastaví CSS proměnné.
3. `src/style.css` – reset (`overflow: hidden`, `touch-action: manipulation`,
   `user-select: none`, `-webkit-touch-callout: none`), letterbox `#3B2A1A` na `body`,
   `.stage`, `.scene`, kotvicí třídy.
4. `src/audio/context.ts` a `chime.ts`.
5. `src/stage/scenes.ts` – správce; pak obě scény (`title`, `kitchen`) s vlastním CSS.
6. `src/stage/orientation.ts`.
7. `src/main.ts` – poskládat dohromady, v dev režimu vystavit `__stage`, `__audio`,
   `__scenes` na `window` (kvůli ručnímu ověření v konzoli; `import.meta.env.DEV` to
   z produkčního buildu vyřízne).
8. `docker compose run --rm check`, `test`, `build`; ruční ověření podle checklistu níže.
9. Vyplnit *Výsledek implementace*, přepnout stavy v `docs/plan.md`.

**Klíčová rozhodnutí**

- **Škálování `transform: scale` na absolutně vystředěném prvku.** `.stage` má
  `position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) scale(s)`.
  Škálovaný prvek si v rozvržení drží nezmenšenou velikost, takže flex/grid centrování by
  při `scale < 1` přetékalo; překlad o −50 % vystředí spolehlivě při jakémkoli měřítku.
  `zoom` ani viewport jednotky nepoužíváme (jinak zaokrouhlování a rozdíly mezi prohlížeči).
- **Měříme `.viewport`, ne `window`.** `.viewport` je `position: fixed` s odsazením
  `env(safe-area-inset-*)`, takže se do měření samo promítne výřez a domovský indikátor na
  iPhonu i schovávání adresního řádku. `ResizeObserver` navíc dá jednu událost na snímek –
  není potřeba vlastní `requestAnimationFrame` slučování ani `orientationchange` posluchač.
- **Pruhy `#3B2A1A`** (rozhodnutí autora): barva obrysu z palety, scéna působí jako obrazovka
  v rámečku. Stejná barva je i v `theme-color`, aby s ní ladil adresní řádek na Androidu.
- **Klepnutí = `click`, odezva stisku = `pointerdown`.** Odemčení audia i `requestFullscreen`
  musí běžet v uživatelském gestu; `click` je gesto, které Safari uznává nejspolehlivěji
  (u `pointerdown` iOS historicky zlobí). Vizuální „stisknuto“ řeší CSS `:active`, takže
  odezva je okamžitá. Žádné oddělené `touch*` a `mouse*` větve (`CLAUDE.md`, pravidlo 3).
- **Odemčení nesmí hru zablokovat** (pravidlo 2): `unlock()` nikdy nevyhodí výjimku a v
  úvodní scéně je navíc obalený závodem s časovým limitem 300 ms – když `resume()` nedoběhne,
  hra jde do kuchyně tiše.
- **Překryv na výšku scénu neodmountuje.** Jen se překryje; po otočení zpět pokračuje táž
  instance scény. Jinak by se při každém otočení ztratil rozehraný stav objednávky (STEP-05).
- **Prolnutí 180 ms** přes Web Animations API, odcházející scéna dostane
  `pointer-events: none`. Splňuje kap. 10 návrhu („animace ≤ 600 ms, nikdy neblokují vstup
  déle než 1 s“). Při `prefers-reduced-motion: reduce` se scény vymění okamžitě.
- **Kotvené rozvržení** (kap. 2 návrhu) je konvence, ne komponenta: potomci `.stage` se
  pozicují absolutně a používají třídy `.anchor-left` / `.anchor-center` / `.anchor-right`.
  Šířka scény se mění, výška ne – proto se roztahují jen mezery. STEP-04 z toho vychází.

Pseudokód přepočtu a přepnutí scény:

```ts
// stage.ts
const observer = new ResizeObserver(([entry]) => {
  const box = entry.contentRect; // .viewport bez safe-area odsazení
  size = computeStage({ width: box.width, height: box.height });
  root.style.setProperty('--stage-w', `${size.width}px`);
  root.style.setProperty('--stage-scale', String(size.scale));
  for (const listener of listeners) listener(size);
});

// scenes.ts
function go(name: SceneName): void {
  if (name === current || transitioning) return;
  const next = scenes[name]({ stage, audio, go });
  next.el.classList.add('scene');
  stage.root.append(next.el);
  next.resize?.(stage.size);
  const previous = active;
  if (previous) previous.el.style.pointerEvents = 'none';
  transitioning = true;
  finish(crossfade(previous?.el, next.el), () => {
    previous?.el.remove();
    previous?.destroy?.();
    transitioning = false;
  });
  active = next;
  current = name;
}
```

## Kontrakt

### `src/stage/layout.ts`

```ts
export const STAGE_HEIGHT = 768;
export const STAGE_MIN_WIDTH = 1024;
export const STAGE_MAX_WIDTH = 1366;

export interface Viewport {
  width: number;
  height: number;
}

export interface StageSize {
  /** Logical width, integer, clamped to [STAGE_MIN_WIDTH, STAGE_MAX_WIDTH]. */
  width: number;
  /** Always STAGE_HEIGHT. */
  height: number;
  /** CSS transform scale that fits the stage into the viewport. Always finite and > 0. */
  scale: number;
  /** width * scale – never larger than viewport.width (rounding aside). */
  renderedWidth: number;
  /** height * scale – never larger than viewport.height (rounding aside). */
  renderedHeight: number;
}

/** Pure: viewport in CSS px → logical stage size and its scale. Never throws. */
export function computeStage(viewport: Viewport): StageSize;

/** Pure: true when the viewport is taller than wide (the rotate overlay shows). */
export function isPortrait(viewport: Viewport): boolean;
```

Výpočet (`clamp` je vlastní jednořádková pomocná funkce v modulu):

```ts
const w = finiteSize(viewport.width, STAGE_MIN_WIDTH); // Number.isFinite && > 0, jinak fallback
const h = finiteSize(viewport.height, STAGE_HEIGHT);
const width = clamp(STAGE_MIN_WIDTH, Math.round(STAGE_HEIGHT * (w / h)), STAGE_MAX_WIDTH);
const scale = Math.min(w / width, h / STAGE_HEIGHT);
```

Příklady (`height` je vždy 768):

| Viewport | width | scale | vykresleno | pruhy |
| --- | --- | --- | --- | --- |
| 1024 × 768 (iPad na šířku) | 1024 | 1 | 1024 × 768 | žádné |
| 1366 × 768 | 1366 | 1 | 1366 × 768 | žádné |
| 844 × 390 (mobil na šířku) | 1366 (ořez) | 0,507812… | 693,7 × 390 | boční, ≈ 75,1 px |
| 1280 × 1024 (poměr 1,25) | 1024 (ořez) | 1,25 | 1280 × 960 | horní/dolní, 32 px |
| 2304 × 768 (poměr 3:1) | 1366 (ořez) | 1 | 1366 × 768 | boční, 469 px |
| 1440 × 900 | 1229 | 1,171684… | 1440 × 899,9 | žádné (zaokrouhlení < 1 px) |
| 390 × 844 (na výšku) | 1024 (ořez) | 0,380859… | 390 × 292,5 | překryje overlay |
| 0 × 0 / NaN | 1024 | 1 | 1024 × 768 | fallback, nespadne |

### `src/stage/stage.ts`

```ts
export interface Stage {
  /** The scaled element scenes mount into: size.width × 768 logical px. */
  readonly root: HTMLElement;
  /** Current logical size; a new object on every change. */
  readonly size: StageSize;
  /** Subscribe to size changes; returns an unsubscribe function. */
  subscribe(listener: (size: StageSize) => void): () => void;
  destroy(): void;
}

export function createStage(host: HTMLElement): Stage;
```

Vytvořený DOM (uvnitř `#app`):

```html
<div class="viewport">
  <div class="stage" style="--stage-w: 1366px; --stage-scale: 0.5078125">
    <div class="scene scene-kitchen">…</div>
  </div>
</div>
```

### `src/stage/scenes.ts`

```ts
export type SceneName = 'title' | 'kitchen';

export interface SceneContext {
  readonly stage: Stage;
  readonly audio: AudioEngine;
  /** Switch scenes; a no-op for the current scene or while a transition runs. */
  go(name: SceneName): void;
}

export interface SceneHandle {
  /** Root element of the scene, mounted into stage.root. */
  readonly el: HTMLElement;
  /** Called before removal: clear timers, detach listeners. */
  destroy?(): void;
  /** Called right after mount and on every stage resize while mounted. */
  resize?(size: StageSize): void;
}

export type Scene = (ctx: SceneContext) => SceneHandle;

export interface SceneManager {
  readonly current: SceneName | null;
  /** Unknown name (only reachable from the dev console): no-op + console.warn in DEV. */
  go(name: SceneName): void;
  destroy(): void;
}

export function createSceneManager(
  stage: Stage,
  audio: AudioEngine,
  scenes: Readonly<Record<SceneName, Scene>>,
): SceneManager;
```

Příklad scény (tvar, který STEP-04 zdědí):

```ts
export const kitchenScene: Scene = (ctx) => {
  const el = document.createElement('div');
  el.className = 'scene-kitchen';
  el.innerHTML = `<div class="anchor-left customer-slot"></div>…`;
  const back = el.querySelector('.back-tile')!;
  const onClick = () => ctx.go('title');
  back.addEventListener('click', onClick);
  return { el, destroy: () => back.removeEventListener('click', onClick) };
};
```

### `src/audio/context.ts` a `src/audio/chime.ts`

```ts
export interface AudioEngine {
  /** Live read of `context?.state === 'running'` – not a latch: it goes false again while
   *  the context is suspended in the background and true after it resumes. */
  readonly unlocked: boolean;
  /** null until unlock() succeeds. */
  readonly context: AudioContext | null;
  /** Master gain – voice, sfx and music buses connect here in STEP-07. */
  readonly master: GainNode | null;
  readonly masterVolume: number;
  /** Call from a user-gesture handler. Idempotent, never rejects; false = still silent. */
  unlock(): Promise<boolean>;
  /** 0..1; remembered and applied when the context appears. Scaffolding for the volume
   *  sliders in STEP-16 – nothing in STEP-02 calls it except the manual check. */
  setMasterVolume(volume: number): void;
  destroy(): void;
}

export function createAudioEngine(): AudioEngine;

/** Placeholder start chime (two sine notes, ~350 ms). No-op when locked. STEP-07 replaces it. */
export function playStartChime(engine: AudioEngine): void;
```

`unlock()`: vytvoří `AudioContext` (fallback `webkitAudioContext` přes zúžený typ, ne `any`),
master gain připojí na `destination`, při `state === 'suspended'` zavolá `resume()` a přehraje
jednovzorkový tichý buffer (iOS bez toho zvuk nepustí). Vše v `try/catch`, návratová hodnota
`context?.state === 'running'`. Na `visibilitychange` (dokument viditelný a už odemčeno) zkusí
`resume()` znovu.

### `src/stage/orientation.ts`

```ts
export interface OrientationGuard {
  readonly portrait: boolean;
  destroy(): void;
}

/** Full-screen overlay with a rotating phone; shown while the viewport is portrait. */
export function createOrientationGuard(host: HTMLElement): OrientationGuard;
```

`host` je `#app`, tedy sourozenec `.viewport`, a překryv má `position: fixed; inset: 0;
z-index: 10` – zakryje i letterbox pruhy, ne jen scénu. Stav `portrait` se čte z
`window.matchMedia('(orientation: portrait)')` a aktualizuje jeho událostí `change`
(ne z `stage.size`: scéna je vždy na šířku, i když je zařízení otočené).
`isPortrait()` z `layout.ts` slouží jen testům a dev nástrojům.

### `src/scenes/title/index.ts`

```ts
/** Tap screen: wordmark + pulsing cake. The first tap unlocks audio (CLAUDE.md rule 6). */
export const titleScene: Scene;
```

DOM (uvnitř `.scene`): jediný `<button type="button" class="title-tap">` přes celou scénu
(klepnout jde kamkoli, cíl = celá plocha ≫ 88 px, a zároveň funguje klávesnice), v něm
`<h1 class="title-wordmark">Mlsná abeceda</h1>` a inline SVG dortíku `.title-cake`
s CSS animací `pulse` (scale 1 → 1,06, 1,6 s, `ease-in-out`, nekonečně).

Obsluha klepnutí – přesné pořadí (`click`, ne `pointerdown`; posluchač se přidá při mountu
a odebere v `destroy()`, navíc pojistka `started`, aby dvojklik neproběhl dvakrát):

```ts
async function onClick(): Promise<void> {
  if (started) return;
  started = true;
  requestFullscreenOnTouch(); // jen když matchMedia('(pointer: coarse)').matches; chyby spolkne
  const unlocked = await Promise.race([ctx.audio.unlock(), delay(300).then(() => false)]);
  if (unlocked) playStartChime(ctx.audio);
  ctx.go('kitchen'); // proběhne vždy, i když se zvuk neodemkl (pravidlo 2)
}
```

Když `unlock()` doběhne až po vypršení limitu, `AudioContext` tím nezaniká ani se neruší –
zůstane platný a použitelný (`audio.unlocked` se prostě přepne o chvíli později), jen se
přeskočí cinknutí. Další `unlock()` (návrat na úvod dočasnou dlaždicí) je idempotentní.

### CSS kontrakt pro další kroky

```css
/* Letterbox: the bars are body's background, .viewport is the safe measured area. */
body {
  background: #3b2a1a;
}
.viewport {
  position: fixed;
  top: env(safe-area-inset-top, 0px);
  right: env(safe-area-inset-right, 0px);
  bottom: env(safe-area-inset-bottom, 0px);
  left: env(safe-area-inset-left, 0px);
  overflow: hidden; /* the element ResizeObserver measures */
}
.stage {
  width: var(--stage-w);
  height: 768px;
  transform: translate(-50%, -50%) scale(var(--stage-scale));
}
.stage .anchor-left {
  position: absolute;
  left: 0;
}
.stage .anchor-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
.stage .anchor-right {
  position: absolute;
  right: 0;
}
```

## Akceptační kritéria

**Velikost scény**

- KDYŽ má `.viewport` 1024 × 768, PAK `computeStage` vrátí `width 1024`, `height 768`,
  `scale 1` a kolem scény nejsou žádné pruhy.
- KDYŽ má 1366 × 768, PAK `width 1366`, `scale 1`.
- KDYŽ má 844 × 390, PAK `width 1366`, `scale` ≈ 0,5078, scéna se vykreslí ≈ 693,7 × 390
  a po stranách jsou pruhy ≈ 75 px; stránka nikde neroluje.
- KDYŽ má 1280 × 1024, PAK `width 1024`, `scale 1,25` a pruhy jsou nahoře a dole po 32 px.
- KDYŽ je poměr ≥ 3:1 (2304 × 768), PAK se šířka ořízne na 1366 a `scale` je 1.
- KDYŽ se okno zvětší nebo zmenší, PAK se nová velikost projeví do jednoho snímku a platí
  `renderedWidth ≤ viewport.width + 0,5` a `renderedHeight ≤ viewport.height + 0,5`.
- KDYŽ je viewport nesmyslný (0, záporný, `NaN`), PAK je `scale` konečné a > 0, `width`
  v rozmezí 1024–1366 a hra nespadne.

**Přepínání scén**

- KDYŽ se hra načte, PAK je aktivní scéna `title` a `stage.root` obsahuje právě jeden `.scene`.
- KDYŽ se zavolá `go('kitchen')`, PAK je do 400 ms v `stage.root` opět právě jeden `.scene`,
  odcházející scéna má zavolané `destroy()` a už nedostává `resize`.
- KDYŽ se zavolá `go()` s aktuální scénou, PAK se nic nestane (žádný remount).
- KDYŽ se zavolá `go()` během probíhajícího prolnutí, PAK se požadavek ignoruje a v DOM
  nezůstanou dvě scény.
- KDYŽ je zapnuté `prefers-reduced-motion: reduce`, PAK se scény vymění bez animace.
- KDYŽ se změní velikost okna, PAK aktivní scéna dostane `resize(size)` se stejnými hodnotami,
  jaké má `stage.size`.

**Audio**

- KDYŽ hráčka poprvé klepne na úvodní obrazovku, PAK je `audio.context.state === 'running'`,
  ozve se cinknutí a hra přejde do kuchyně.
- KDYŽ se `unlock()` zavolá vícekrát, PAK existuje jediný `AudioContext` a nevyhodí se výjimka.
- KDYŽ prohlížeč Web Audio nemá nebo `resume()` do 300 ms nedoběhne, PAK hra pokračuje do
  kuchyně tiše, bez chyby v konzoli, kterou by hráčka poznala.
- KDYŽ se hra přepne na pozadí a zpět, PAK je kontext znovu `running`.
- KDYŽ je vstup dotykový (`pointer: coarse`) a hráčka klepne na úvod, PAK se zavolá
  `requestFullscreen()`; když ho prohlížeč odmítne, hra pokračuje beze změny chování.

**Orientace**

- KDYŽ je viewport na výšku, PAK je vidět překryv s otáčejícím se telefonem přes celou plochu
  a klepnutí se nedostane do scény pod ním.
- KDYŽ se zařízení otočí zpět na šířku, PAK překryv zmizí a pokračuje **táž** instance scény
  (`destroy()` se nezavolal).
- V překryvu není žádný text.

**Pravidla `CLAUDE.md`**

- KDYŽ je hra spuštěná, PAK je jediný text v herním UI název hry na úvodní obrazovce; každý
  pokyn nese obrázek (na úvodu pulzující dortík). Výjimka je zapsaná v `CLAUDE.md`,
  pravidlo 1 – bez té úpravy krok neprojde. (pravidlo 1)
- Nikde není chyba, prohra ani časomíra; jediný časový limit v kroku je 300ms pojistka
  odemčení audia, která hru pouští dál, ne zpět. (pravidlo 2)
- Každý klepací cíl je ≥ 88 logických px: úvod = celá scéna, dočasná dlaždice v kuchyni
  96 × 96. Nic se netáhne, nic neroluje, dvojité klepnutí nezvětší stránku. (pravidlo 3)
- KDYŽ se hra načte, PAK v panelu Network nejsou žádné požadavky mimo vlastní origin.
  (pravidlo 5)
- Zvuk zazní až po prvním klepnutí, nikdy dřív. (pravidlo 6)
- Žádná hláska se negeneruje ani nepřehrává mimo manifest; cinknutí je syntetické, ne řeč.
  (pravidlo 7)

## Testy

- **Unit (Vitest), `src/stage/layout.test.ts`:**
  - přesné poměry: 1024 × 768 a 1366 × 768 → `scale === 1`, `width` 1024 resp. 1366;
  - ořez dolů: 1280 × 1024 → `width === 1024`, `scale === 1.25`;
  - ořez nahoru: 844 × 390 a 2304 × 768 → `width === 1366`;
  - drobný viewport 320 × 240 → `width === 1024`, `scale === 0.3125`;
  - invariant nad seznamem ~10 rozměrů (telefony, tablety, notebooky, na výšku):
    `renderedWidth ≤ width + 0.5`, `renderedHeight ≤ height + 0.5`,
    `1024 ≤ width ≤ 1366`, `Number.isInteger(width)`, `scale > 0`, `height === 768`;
  - odolnost: `0 × 0`, `-5 × 10`, `NaN × 768` → konečné hodnoty v mezích;
  - `isPortrait`: 390 × 844 → `true`, 844 × 390 → `false`, čtverec 500 × 500 → `false`.
- **Netestuje se automaticky:** `stage.ts`, `scenes.ts`, `orientation.ts`, `audio/*` – potřebují
  DOM a Web Audio, které v `environment: 'node'` nejsou; jsdom je nová závislost bez
  dostatečného užitku. Pokrývá je ruční ověření níže.
- Spuštění: `docker compose run --rm test` (dále `check` a `build`).

## Ruční ověření

Spustit `docker compose --profile dev up` a otevřít `http://localhost:5173/mlsna-abeceda/`.
V dev režimu jsou v konzoli k dispozici `__stage`, `__audio` a `__scenes`.

- [ ] **iPad na šířku (1024 × 768, DevTools):** scéna vyplní okno beze zbytku,
      `__stage.size` → `{ width: 1024, scale: 1 }`.
- [ ] **Mobil na šířku (844 × 390):** `__stage.size.width === 1366`, `scale ≈ 0.5078`,
      po stranách tmavě hnědé pruhy, žádný posuvník, nic se neschovalo.
- [ ] **Poměr 1,25 (1280 × 1024):** pruhy nahoře a dole, scéna vystředěná.
- [ ] **Desktop:** tažením za roh okna měnit velikost – scéna škáluje plynule, nikdy nepřeteče.
- [ ] **Na výšku:** překryv s otáčejícím se telefonem přes celou plochu, klepnutí do scény
      pod ním nic neudělá; po otočení zpět je vidět stejná scéna, ve které jsem skončil.
- [ ] **První klepnutí:** slyšet cinknutí, `__audio.context.state` → `'running'`, přechod do
      kuchyně je plynulý a trvá do půl vteřiny.
- [ ] **Kuchyně:** tři placeholder bloky sedí vlevo / uprostřed / vpravo i při šířce 1366
      (dev vodítko ukazuje střed 1024 px), dočasná dlaždice vrací na úvod a zpět do kuchyně
      to jde znovu (zvuk zůstává odemčený).
- [ ] **Správce scén z konzole:** `__scenes.go('kitchen')` v kuchyni → nic se nestane
      (`__scenes.current` zůstane `'kitchen'`, v DOM je pořád jediný `.scene`);
      `__scenes.go('title'); __scenes.go('kitchen')` hned po sobě → druhé volání se ignoruje,
      prolnutí doběhne a v `stage.root` zůstane jediný `.scene`; totéž rychlým dvojklikem na
      dočasnou dlaždici. `__scenes.go('neexistuje')` → varování v konzoli, hra běží dál.
- [ ] **Hlasitost:** `__audio.setMasterVolume(0)` → další cinknutí není slyšet,
      `__audio.setMasterVolume(1)` → je slyšet znovu (příprava pro STEP-16).
- [ ] **Network:** po načtení žádný požadavek mimo `localhost` (a v produkčním buildu mimo
      `krajicj.github.io`).
- [ ] **Reduced motion** (DevTools → Rendering → Emulate `prefers-reduced-motion`): scény se
      přepnou bez prolnutí.
- [ ] **Dotyk** (DevTools emulace dotyku): dvojité klepnutí nezvětší stránku, dlouhý stisk
      neukáže systémové menu, tažením se nic neposune.
- [ ] Totéž alespoň jednou v produkčním buildu po nasazení na Pages.

## DoD

- [ ] Všechna akceptační kritéria splněna
- [ ] Testy a build zelené (`docker compose run --rm test`, `check`, `build`)
- [ ] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [ ] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

Hotovo 24. 8. 2026. `test` (9 testů), `check` i `build` zelené.

**Soubory**

- Nové: `src/stage/layout.ts`, `src/stage/layout.test.ts`, `src/stage/stage.ts`,
  `src/stage/scenes.ts`, `src/stage/orientation.ts`, `src/audio/context.ts`,
  `src/audio/chime.ts`, `src/scenes/title/{index.ts,style.css}`,
  `src/scenes/kitchen/{index.ts,style.css}`.
- Změněné: `src/main.ts` (bootstrap + dev globály), `src/style.css` (reset, letterbox,
  `.viewport`, `.stage`, kotvy, překryv orientace), `index.html` (`theme-color`, zákaz zoomu),
  `CLAUDE.md` (pravidlo 1 + *Project status*).

**Odchylky od plánu**

1. **Prolnutí má navíc časovou pojistku** `setTimeout(done, 180 + 120 ms)`. Na skryté záložce
   Web Animations zamrznou a událost `finish` nedorazí – bez pojistky správce scén uvázl
   natrvalo v `transitioning` a ignoroval všechna další `go()` (v DOM zůstaly dvě scény).
   Objeveno při ručním ověření, kdy byla záložka na pozadí. Kontrakt se nemění.
2. **Nápis je `<span class="title-wordmark">`, ne `<h1>`.** Nadpis není platný obsah uvnitř
   `<button>` (phrasing content); třída, vzhled i přístupný název tlačítka zůstávají stejné.
3. **`setMasterVolume` nastavuje `master.gain.value` přímo** místo `setValueAtTime`. Po
   `setValueAtTime` se změna v Chrome neprojeví do čtení `gain.value`, takže by ruční kontrola
   z konzole neměla co ověřit; přímé přiřazení je pro nastavení hlasitosti dostatečné.
4. **CSS překryvu orientace je v `src/style.css`**, ne ve vlastním souboru – plán pro něj
   žádný soubor neuváděl a překryv není scéna. `style.css` je v seznamu změněných souborů.
5. **Navíc `.kitchen-dev-guide`** (svislé vodítko šířky 1024 px, jen v DEV) – vyžaduje ho
   checklist ručního ověření. Element se v produkci nevytvoří, jeho pravidlo v CSS
   (~150 B) v balíčku zůstává.
6. **Navíc dev globál `__orientation`** vedle `__stage`, `__audio`, `__scenes`.
7. **Dortík na úvodu má višničku** místo dvou jahod z artboardu – jednodušší SVG, stejná
   paleta a stejný obrys 4 px.

**Ověřeno** (Chrome, dev server; velikosti viewportu emulované změnou `.viewport`, tedy přesně
toho prvku, který sleduje `ResizeObserver` – okno prohlížeče bylo v režimu celé obrazovky):

- Tabulka rozměrů sedí přesně podle *Kontraktu*: 1024×768 → 1024/1; 1366×768 → 1366/1;
  844×390 → 1366/0,507813 s bočními pruhy 75,2 px; 1280×1024 → 1024/1,25 s pruhy 32 px;
  2304×768 → 1366/1; 1440×900 → 1229/1,171684 (vykresleno 1440 × 899,9); 390×844 → 1024/0,380859;
  320×240 → 1024/0,3125. Nikde nic nepřeteče, stránka neroluje.
- Skutečná změna velikosti okna projde stejnou cestou (`ResizeObserver` → nové `stage.size`);
  `stage.subscribe` dostane tytéž hodnoty jako `stage.size` a po odhlášení už nic nedostane.
- Přepínání scén: start = `title` a jediný `.scene`; `go()` na aktuální scénu i `go()` během
  prolnutí se ignorují; po prolnutí zůstane jediný `.scene`; neznámé jméno = varování v konzoli
  a hra běží dál; při `prefers-reduced-motion` se scény vymění okamžitě.
- Audio: před prvním klepnutím `context === null`; po klepnutí `state === 'running'`, přechod do
  kuchyně; `setMasterVolume(0/1/2)` → `gain.value` 0/1/1 (ořez).
- Kuchyně: tři kotvené bloky vlevo/uprostřed/vpravo, dlaždice 96 × 96 logických px vrací na
  úvod a zvuk zůstává odemčený; klepací cíl úvodu je celá scéna (1329 × 768 logických px).
- Překryv orientace: kryje celé okno nad letterboxem (`z-index: 10`), je nejvýš v `elementFromPoint`
  (klepnutí se pod něj nedostane), neobsahuje žádný text, telefon se otáčí.
- Síť: po načtení 15 požadavků, všechny na `localhost:5173`; v produkčním balíčku není žádná
  externí URL a dev globály ani vodítko se do JS nedostanou.

**Neověřeno**

- Skutečné otočení zařízení (překryv byl ověřen zobrazením, ne přepnutím media query) a chování
  safe-area na iPhonu – okno prohlížeče nešlo přepnout na výšku ani zmenšit.
- Slyšitelnost cinknutí (ověřen jen stav `AudioContext` a `gain`), `requestFullscreen` na dotyku,
  dvojité klepnutí / dlouhý stisk na tabletu – potřebují skutečné zařízení.
- Produkční build na Pages (nasazuje se až commitem).

**Návrhy mimo rozsah**

- `manifest.webmanifest` s `orientation: landscape` (STEP-19) překryv na většině zařízení
  vůbec nevyvolá – stojí za to je udělat spolu.
- Až bude hlas (STEP-07), přidat k překryvu hlášku „Otoč mě!“ (`TODO STEP-07` je v kódu).
