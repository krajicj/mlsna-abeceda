# STEP-04 · Kuchyně – statická scéna ze SVG + self-host fontu Fredoka

Status: done
Milník: M1 · Po: [STEP-02](./STEP-02-stage-scenes-and-audio-unlock.md) · Plán: [plan.md](../plan.md) ·
Návrh: [navrh-hry.md](../navrh-hry.md) kap. 4, 5.1, 10

## Shrnutí

Kuchyňská scéna je zatím jen pult, podlaha a tři čárkované obdélníky ze [STEP-02](./STEP-02-stage-scenes-and-audio-unlock.md).
Tento krok je nahradí skutečnou grafikou ve stylu `docs/design/Kitchen.dc.html`: medvídek za pultem,
korpus dortu na pultu, miska s jahodami vedle něj, horní police se svíčkami (číslice) a dolní
s perníčky (písmena). Scéna zůstává **statická** – nic se neklepá, nic se nehýbe kromě jemného
dýchání medvídka. Zároveň se do `public/fonts/` stáhne font Fredoka (OFL) a hra ho začne používat
lokálně, takže je konečně vidět, jak písmenka a číslice ve hře doopravdy vypadají.

Grafika vzniká jako TS moduly v `src/art/` (řetězce s inline SVG) a **geometrie scény je čistá,
otestovaná funkce** `kitchenLayout(stageWidth)` – STEP-05 z ní vezme souřadnice, odkud jahoda letí
na dort, a STEP-06 pozice perníčků na polici. Tím krok připraví obojí, aniž by sám cokoli oživil.

## Rozsah

**V rozsahu**

- Nová složka `src/art/`: `svg.ts` (paleta + pomocníci), `layout.ts` (geometrie scény, čistá logika),
  `kitchen.ts` (pozadí: pult, podlaha, police), `bear.ts`, `cake.ts`, `bowl.ts`, `fruit.ts`,
  `cookie.ts`, `candle.ts`.
- Přepsaná scéna `src/scenes/kitchen/` – skládá art moduly na pozice z `kitchenLayout`, překresluje
  pozadí při změně šířky scény, odstraňuje dočasné tlačítko „zpět“ ze STEP-02.
- Statický obsah polic: svíčky `1 2 3 4` a perníčky `K A M O` (STEP-06 je nahradí nabídkou
  z objednávky). V DEV konzoli `__kitchen.letters([...])` / `.digits([...])` pro vizuální kontrolu.
- Jemná idle animace medvídka (dýchání), vypnutá při `prefers-reduced-motion: reduce`.
- Self-host fontu Fredoka: `scripts/fetch-fonts.mjs`, služba `fonts` v `compose.yaml`,
  `public/fonts/Fredoka-latin.woff2`, `Fredoka-latin-ext.woff2`, `OFL.txt`, generovaný `src/fonts.css`.
- Testy geometrie (`src/art/layout.test.ts`) a smoke testy art modulů (`src/art/art.test.ts`).
- Řádek `fonts` v tabulce Commands v `CLAUDE.md`.

**Mimo rozsah**

- Jakákoli interakce: klepání na jahody, perníčky a svíčky (STEP-05, STEP-06).
- Bublina s objednávkou, kolečka nad dortem, hlas, zvoneček, hvězdičky a počítadlo, album.
- Další zákazníci a výrobky, stavy postav (raduje se, jí) – medvídek má jen stav „čeká“.
- Borůvky a třešně (obchůdek, STEP-12), ozdoby na dortu (STEP-05).
- Předělání dortíku na úvodní obrazovce na sdílený art modul – titulní dort je logo, ne herní
  výrobek; zůstává, jak je.
- Precache fontů v service workeru (STEP-19).

## Implementace

**Soubory**

```
src/art/svg.ts                 (nový) paleta, INK, Rect, helper na <svg>, obrys, vystředěný <text>
src/art/layout.ts              (nový) konstanty scény + kitchenLayout/shelfSlots/fruitSlots/…
src/art/layout.test.ts         (nový) geometrie: překryvy, hranice, velikost terčů
src/art/kitchen.ts             (nový) kitchenBackdrop(width): pult, hrana, čelo s dvířky, podlaha, police
src/art/bear.ts                (nový) bear(): medvídek 260×320 včetně tlapek na pultu
src/art/cake.ts                (nový) cakeBase(): korpus dortu 220×146 bez ozdob
src/art/fruit.ts               (nový) strawberry(size): jahoda (sdílí ji miska i pozdější dort)
src/art/bowl.ts                (nový) fruitBowl({ slots }): miska 320×140 s jahodami
src/art/cookie.ts              (nový) cookie(letter): perníček 96×96
src/art/candle.ts              (nový) candle(digit): svíčka 96×112
src/art/art.test.ts            (nový) smoke testy: rozměry, obsah, well-formed SVG
src/scenes/kitchen/index.ts    (změna) skládá scénu z art modulů, DEV __kitchen, bez tlačítka zpět
src/scenes/kitchen/style.css   (změna) jen barvy, dýchání, DEV vodítko – pozice jdou z layoutu
src/style.css                  (změna) třída .art-text pro SVG texty
src/main.ts                    (změna) import './fonts.css'
src/fonts.css                  (nový, generovaný) dvě @font-face pravidla s unicode-range
public/fonts/*.woff2, OFL.txt  (nové, stažené a commitnuté)
scripts/fetch-fonts.mjs        (nový) stažení fontu z Google Fonts + kontroly
compose.yaml                   (změna) služba `fonts` (jediná nová služba s internetem)
CLAUDE.md                      (změna) řádek `docker compose run --rm fonts` v Commands
```

**Knihovny** – žádné nové. Skript používá jen `node:fs`, `node:path` a vestavěný `fetch`
(Node 22). Font Fredoka (SIL OFL 1.1) se **stahuje jako datový soubor**, ne jako npm balíček –
nic se neinstaluje ani nespouští.

**Kroky**

1. **Font.** `scripts/fetch-fonts.mjs`: stáhne `https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&display=block`
   s hlavičkou `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML,
   like Gecko) Chrome/140.0.0.0 Safari/537.36` (jinak Google vrátí TTF), z odpovědi vytáhne bloky
   `/* latin */` a `/* latin-ext */` (URL na `fonts.gstatic.com` + `unicode-range`), stáhne obě
   `.woff2`, ověří je a uloží jako `public/fonts/Fredoka-latin.woff2` a `Fredoka-latin-ext.woff2`.
   Pak stáhne `https://raw.githubusercontent.com/google/fonts/main/ofl/fredoka/OFL.txt` do
   `public/fonts/OFL.txt` a vygeneruje `src/fonts.css`. Spouští se jednou:
   `docker compose run --rm fonts`; výsledek se commituje, CI ani build ho nikdy nespouští.
2. `compose.yaml`: služba `fonts` na kotvě `*toolchain`, `profiles: [cli]`, `command: node scripts/fetch-fonts.mjs`
   (dědí výchozí síť = jediná další služba s internetem, vedle `install`, `add` a `voice`).
   Do `CLAUDE.md` přibude odpovídající řádek v Commands.
3. `src/main.ts`: `import './fonts.css';` jako první import (před `./style.css`).
4. **Geometrie.** `src/art/layout.ts` s konstantami níže a čistými funkcemi; k tomu testy.
5. **Art moduly.** Každý vrací řetězec s jedním `<svg>` s pevným `viewBox`, obrysem `#3B2A1A`
   4 px, zaoblenými tvary a paletou z artboardu. Většina tvarů se přebírá z
   `docs/design/build-artboards.mjs` (medvídek, dort, jahoda, perníček, police, pult, dlaždice) –
   buď 1:1, nebo **rovnoměrně** zmenšené; miska se kvůli jinému poměru stran překresluje a svíčka
   se kreslí nově. Přesné zadání každého modulu je v tabulce Tvary v Kontraktu.
6. **Scéna.** `kitchenScene` postaví `<svg class="kitchen-backdrop">` + absolutně pozicované boxy
   (medvídek, dort, miska, dvě police po čtyřech slotech). `resize(size)` přepočítá `kitchenLayout`,
   nastaví `left/top/width/height` boxů a překreslí pozadí (`innerHTML` řetězce z `kitchenBackdrop`).
7. **DEV.** V DEV režimu scéna zaregistruje `window.__kitchen` a v `destroy()` ho zase odebere.
8. Odstranit `back-tile` (tlačítko zpět) a placeholder styly; do titulní scény nesahat.
9. `docker compose run --rm test|check|build`, ruční ověření v prohlížeči, vyplnit výsledek.

**Klíčová rozhodnutí**

- **Proč se rozvržení liší od artboardu.** V artboardu má perníček 84 px a jahody v misce ~40 px;
  pravidlo 3 v `CLAUDE.md` žádá terče ≥ 88 px. Perníček má proto 96 px, svíčka 96×112 a každá
  jahoda hit box 96×96. Na horní polici je v artboardu na misku jen ~89 px místa, takže **miska
  s jahodami stojí na pultu** vpravo od dortu (rozhodnutí autora) a police nesou svíčky (horní)
  a perníčky (dolní) – obojí je pořád vidět.
- **Pozadí je jedno SVG překreslované při resize**, ne dlaždicované CSS: šířka scény se mění
  (1024–1366) a `viewBox="0 0 W 768"` v měřítku 1:1 zaručí, že tahy zůstanou přesně 4 px.
  Postavy a rekvizity jsou samostatné boxy, aby s nimi STEP-05/06 mohly animovat.
- **Geometrie v TS, ne v CSS.** STEP-05 potřebuje souřadnice („jahoda letí z misky na dort“)
  v JS; jeden zdroj pravdy je `layout.ts`, CSS drží jen barvy a animace.
- **Font přes woff2 subsety z Google Fonts**, ne přes npm balíček (`@fontsource/*` by přinesl
  závislost) a ne přes TTF z GitHubu (3–5× větší, museli bychom konvertovat). Skript si bere
  `unicode-range` přímo z odpovědi Google a zapisuje je do `src/fonts.css`, takže se nic
  neopisuje ručně; čeština potřebuje oba subsety (`ě š č ř ž ů ď ť ň` jsou v latin-ext).
- **`font-display: block`** – soubory jsou lokální a načtou se v jednotkách ms; `swap` by na
  pomalejším tabletu problikl náhradním fontem přesně na písmenkách, což je zrovna to, co se
  dítě učí.
- **Svíčka se kreslí od nuly.** V artboardu ani v návrhu není – artboard ukazuje jen stav
  „písmenko“. Tvar i barvy (`wax`, `flame`, `flameCore`) proto určuje tenhle plán (tabulka Tvary),
  aby si je implementace nevymýšlela. Do `docs/design/build-artboards.mjs` se svíčka nedoplňuje:
  design canvas je vstup pro rozhodnutí o vzhledu, ne kopie hry, a jeho regenerace a znovu­publikování
  artefaktu není součástí tohoto kroku.
- **Ověřeno předem:** Vite doplňuje `base` do CSS `url(/fonts/…)` – v `dist/assets/*.css` vyjde
  `/mlsna-abeceda/fonts/Fredoka-latin.woff2` a `public/` se kopíruje do `dist/`.

Pseudokód geometrie (logické px, výška scény vždy 768, šířka `W` ∈ [1024, 1366]):

```
COUNTER_TOP 500 · COUNTER_EDGE_TOP 546 · COUNTER_FRONT_TOP 560 · FLOOR_TOP 692
bear         = { x: 60,             y: 200, w: 260, h: 320 }
cake         = { x: round(W/2) - 180, y: 384, w: 220, h: 146 }
bowl         = { x: cake.x + 248,   y: 400, w: 320, h: 140 }
shelfDigits  = { x: W - 462,        y: 84,  w: 448, h: 128 }   // sloty 96×112 + prkno 16
shelfLetters = { x: W - 462,        y: 252, w: 448, h: 112 }   // sloty 96×96  + prkno 16
// prkno = spodních 16 px police, konzoly (trojúhelníky) visí 26 px pod ním
// sloty: řada `count` položek (max 4) se šířkou 96 a mezerou 16, vystředěná nad prknem
```

## Kontrakt

```ts
// src/art/svg.ts
export const INK = '#3B2A1A';
/**
 * Paleta odečtená z artboardu (`docs/design/build-artboards.mjs`) – jediný zdroj barev pro
 * všechny art moduly. `wax`, `flame` a `flameCore` v artboardu nejsou (svíčka tam chybí),
 * doplňují ho ve stejném teplém ladění.
 */
export const PALETTE = {
  wall: '#FFE9D1',
  wallDot: '#F7D6B3',
  wood: '#D9A066',
  woodDark: '#B07A3F',
  woodLight: '#EBC08A',
  mint: '#BFE6D6',
  mintLight: '#D6F1E6',
  floorA: '#FBEBD6',
  floorB: '#F1D4B4',
  strawberry: '#E5484D',
  stem: '#3F8F3A',
  leaf: '#4CAF50',
  seed: '#FFE08A',
  fur: '#A0643A',
  earInner: '#E8A98A',
  muzzle: '#E9C9A3',
  blush: '#F48FB1',
  bib: '#E5484D',
  plate: '#FFFFFF',
  plateShade: '#DCD3C8',
  frosting: '#F7B7C8',
  frostingLight: '#FBD1DC',
  sponge: '#FDE6B5',
  spongeLight: '#FFF3D6',
  dough: '#C98A4B',
  doughLight: '#E0AC74',
  wax: '#FFF1DC',
  flame: '#FFC53D',
  flameCore: '#FFB703',
  white: '#FFFFFF',
} as const;

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Jeden <svg> s daným viewBoxem; `children` je hotové SVG markup. */
export function svg(options: {
  readonly viewBox: string;
  readonly width: number;
  readonly height: number;
  readonly className?: string;
  readonly children: string;
}): string;

/** Atributy obrysu: stroke=INK, zaoblené spoje; `width` výchozí 4. */
export function stroke(width?: number): string;

/**
 * Text vystředěný na (`cx`, `cy`): `text-anchor="middle"`, baseline `cy + size * 0.35`
 * (nespoléhá na `dominant-baseline`, ten se mezi prohlížeči liší). Vždy `class="art-text"`,
 * která v `src/style.css` nastavuje rodinu Fredoka. Výchozí `fill` je `INK`, výchozí `weight` 700.
 */
export function centeredText(options: {
  readonly cx: number;
  readonly cy: number;
  readonly size: number;
  readonly content: string;
  readonly fill?: string;
  readonly weight?: 500 | 600 | 700;
}): string;

// src/art/layout.ts
export const SHELF_ITEM_WIDTH = 96;   // ≥ 88 (CLAUDE.md, pravidlo 3)
export const SHELF_GAP = 16;
export const SHELF_BOARD = 16;
export const MAX_CHOICES = 4;
export const FRUIT_SLOT = 96;         // hit box jahody, ≥ 88
export const FRUIT_GAP = 16;
export const MAX_FRUIT_SLOTS = 3;     // víc se do misky 320 px nevejde bez překryvu
export const COUNTER_TOP = 500;
export const COUNTER_EDGE_TOP = 546;
export const COUNTER_FRONT_TOP = 560;
export const FLOOR_TOP = 692;

export interface KitchenLayout {
  readonly bear: Rect;
  readonly cake: Rect;
  readonly bowl: Rect;
  /** Celá police včetně prkna; sloty jsou nad prknem. */
  readonly shelfDigits: Rect;
  readonly shelfLetters: Rect;
}

/** Čisté: šířka scény → boxy scény. Šířku ořezává na [1024, 1366]. */
export function kitchenLayout(stageWidth: number): KitchenLayout;

/** Vystředěná řada `count` (0–4) slotů nad prknem police; prázdné pole pro count ≤ 0. */
export function shelfSlots(shelf: Rect, count: number): Rect[];

/**
 * Hit boxy jahod v misce: `count` (výchozí i maximum `MAX_FRUIT_SLOTS` = 3) čtverců
 * `FRUIT_SLOT`×`FRUIT_SLOT` v jedné řadě s mezerou `FRUIT_GAP`, `y = bowl.y`. Řada je
 * **vystředěná uvnitř `bowl.width`** – stejné pravidlo jako `shelfSlots` nad prknem police
 * (pro 3 sloty vyjde řada přesně 320 px, tedy celá šířka misky, a boční mezera je nulová).
 * `count ≤ 0` → `[]`, `count > 3` → 3.
 */
export function fruitSlots(bowl: Rect, count?: number): Rect[];

/**
 * Dvířka v čele pultu: 300×104, mezera 24, vystředěná, `y = COUNTER_FRONT_TOP + 14`.
 * Počet = `Math.floor(stageWidth / 324)` ořezaný na [3, 4] – tedy 3 kusy do šířky 1295
 * (včetně 1024 i 1200) a 4 od 1296 výš (včetně 1366).
 */
export function counterPanels(stageWidth: number): Rect[];

/** Počet sloupců dlaždic na podlaze (dlaždice 64×36, dvě řady). */
export function floorColumns(stageWidth: number): number;

// src/art/*.ts – každá funkce vrací kompletní <svg> jako řetězec
export function kitchenBackdrop(stageWidth: number): string; // pult, hrana, dvířka, podlaha, police
export function bear(): string;            // viewBox '0 0 260 320' – tvary z artboardu 1:1, tlapky dole
export function cakeBase(): string;        // viewBox '0 52 260 172' vykreslený jako 220×146
export function fruitBowl(options?: { readonly slots?: number }): string; // 320×140, překreslená
export function strawberry(height: number): string; // viewBox '0 -6 40 52', šířka = round(height * 40/52)
export function cookie(letter: string): string;     // 96×96
export function candle(digit: string): string;      // 96×112

// src/scenes/kitchen/index.ts – DEV only, mizí s odmountováním scény
interface KitchenDevHandle {
  letters(list: readonly string[]): void; // překreslí dolní polici (max 4)
  digits(list: readonly string[]): void;  // překreslí horní polici (max 4)
  layout(): KitchenLayout;
}
```

Příklad (`W = 1024`):

```ts
kitchenLayout(1024).cake;         // { x: 332, y: 384, width: 220, height: 146 }
kitchenLayout(1024).shelfLetters; // { x: 562, y: 252, width: 448, height: 112 }
shelfSlots(kitchenLayout(1024).shelfLetters, 4)[0];
// { x: 570, y: 252, width: 96, height: 96 }   – čtyři sloty: 570, 682, 794, 906
fruitSlots(kitchenLayout(1024).bowl);
// [{ x: 580, y: 400, … }, { x: 692, … }, { x: 804, … }] – tři sloty 96×96, mezera 16
counterPanels(1024).length;       // 3   (1200 → 3, 1296 → 4, 1366 → 4)
counterPanels(1024)[0];           // { x: 38, y: 574, width: 300, height: 104 }
cookie('K');                      // '<svg viewBox="0 0 96 96" width="96" height="96" …>…K…</svg>'
```

**Tvary.** Medvídek, miska, dort, jahoda, perníček, police, pult a dlaždice se přebírají
z `docs/design/build-artboards.mjs`; **svíčka v artboardu není**, proto je popsaná přesně tady:

| Modul | Jak vzniká z artboardu |
| --- | --- |
| `bear()` | tvary skupin `bear` + `paws` beze změny měřítka, `viewBox '0 0 260 320'`; tlapky se posunou na `y ≈ 296` (v artboardu leží na pultu v absolutních souřadnicích) |
| `cakeBase()` | skupina `cake` bez jahod a bez čárkovaného kolečka; ořízne se na `viewBox '0 52 260 172'` a vykreslí jako 220×146 – zmenšení 0,846, obě strany zaokrouhlené na celé px (odchylka poměru 0,3 %, tj. pod 1 px), rozhodně ne roztažení do jiného tvaru |
| `cookie(letter)` | kruh `r = 44` na (48, 48), výplň `dough`, vnitřní kruh `r = 37` bez výplně s tahem `doughLight` 6 px, obrys `INK` 4 px, `centeredText({ cx: 48, cy: 48, size: 52, weight: 700, fill: white })` |
| `strawberry(height)` | skupina `strawberry` beze změny tvaru, jen jednotné měřítko na zadanou výšku |
| `fruitBowl()` | **překreslená**, ne roztažená: miska 320×140 má jiný poměr stran než ta v artboardu (130×96). Tělo misky je stejná silueta (spodní oblouk + elipsa okraje) přes celou šířku, `y = 50…140`, výplň `mint`, obrys 4 px; v ní `slots` (výchozí 3) jahod `strawberry(88)` vystředěných na sloty z `fruitSlots({ x: 0, y: 0, width: 320, height: 140 }, slots)` (vlastní lokální rect modulu, ne `bowl` ze scény), plus zadní řada dvou jahod `strawberry(72)` mezi nimi, částečně schovaná za okrajem (jen dekorace, neklepá se na ni) |
| `candle(digit)` | **nová kresba**, `viewBox '0 0 96 112'`: plamínek `ellipse cx=48 cy=18 rx=10 ry=14` výplň `flame`, obrys `INK` 4 px, uvnitř `ellipse cx=48 cy=22 rx=5 ry=8` výplň `flameCore` bez obrysu; knot `line 48,32 → 48,38` tahem `INK` 4 px; tělo `rect x=26 y=36 width=44 height=72 rx=12` výplň `wax`, obrys `INK` 4 px; číslice `centeredText({ cx: 48, cy: 74, size: 40 })`. Tahy jsou centrované, proto se všude počítá 2 px navíc: kresba drží uvnitř `0…112` (plamínek shora od 2, tělo zdola do 110) a nic se neořízne |

Generovaný `src/fonts.css` (zkráceno, `unicode-range` doplní skript z odpovědi Google):

```css
/* Generated by scripts/fetch-fonts.mjs – do not edit by hand. Fredoka, SIL OFL 1.1. */
@font-face {
  font-family: Fredoka;
  font-style: normal;
  font-weight: 300 700;
  font-display: block;
  src: url('/fonts/Fredoka-latin-ext.woff2') format('woff2');
  unicode-range: U+0100-02BA, …;
}
```

## Akceptační kritéria

- KDYŽ se hra spustí a klepne se na úvodní obrazovku, PAK je v kuchyni vidět medvídek za pultem
  vlevo, korpus dortu na pultu, miska s jahodami vpravo od dortu, horní police se čtyřmi svíčkami
  (1, 2, 3, 4) a dolní se čtyřmi perníčky (K, A, M, O). Jediný text na obrazovce jsou tyhle
  číslice a písmena (učební obsah, ne UI – `CLAUDE.md`, pravidlo 1).
- KDYŽ je šířka scény 1024, 1200 nebo 1366 px, PAK se žádné dva boxy z `kitchenLayout`
  nepřekrývají, mají mezi sebou ≥ 8 px a všechny leží uvnitř `0…W × 0…768`.
- KDYŽ se změří slot police nebo hit box jahody, PAK má obě strany ≥ 88 px.
- KDYŽ se stránka načte, PAK se stáhnou právě dva soubory `.woff2` ze stejného originu,
  `document.fonts.check('700 48px Fredoka')` vrátí `true` a v Network není žádný požadavek mimo
  origin (pravidlo 5).
- KDYŽ se v DEV konzoli zavolá `__kitchen.letters(['Š', 'Č', 'Ř', 'Ž'])`, PAK se všechna čtyři
  písmena vykreslí Fredokou (subset latin-ext), ne náhradním systémovým fontem.
- KDYŽ dostane `shelfSlots` count 0, 1 nebo větší než `MAX_CHOICES`, PAK vrátí prázdné pole,
  jeden vystředěný slot, resp. nejvýše `MAX_CHOICES` slotů (nikdy se nevyleze mimo polici);
  totéž `fruitSlots` s `MAX_FRUIT_SLOTS`.
- KDYŽ je scéna široká 1024 nebo 1200 px, PAK jsou v čele pultu troje dvířka; KDYŽ je široká
  1296 px a víc (tedy i 1366), PAK jsou čtvery – a řada je v obou případech vystředěná.
- KDYŽ `kitchenLayout` dostane 800, 4000, `NaN` nebo zápor, PAK vrátí layout pro ořezanou šířku
  (1024, resp. 1366) a nikdy nespadne.
- KDYŽ se okno zmenší nebo změní poměr stran, PAK se pozadí překreslí na novou šířku, obrysy
  zůstanou 4 px silné a pult i podlaha jdou od kraje ke kraji bez mezery.
- KDYŽ platí `prefers-reduced-motion: reduce`, PAK medvídek nedýchá a scéna je úplně statická.
- KDYŽ se scéna přepne pryč a zpět (`__scenes.go('title')`, `__scenes.go('kitchen')`), PAK
  se překreslí správně, `window.__kitchen` patří nové instanci a v konzoli není žádná chyba.
- KDYŽ proběhne `docker compose run --rm build`, PAK jsou v `dist/fonts/` oba `.woff2` i `OFL.txt`,
  v `dist/assets/*.css` je `url(/mlsna-abeceda/fonts/…)` a v bundlu není řetězec `__kitchen`.
- KDYŽ `scripts/fetch-fonts.mjs` nemá internet nebo dostane soubor bez hlavičky `wOF2`, mimo
  rozsah 5–500 kB, nebo OFL bez věty „SIL OPEN FONT LICENSE“, PAK skončí nenulovým kódem, vypíše
  důvod a nechá `public/fonts/` i `src/fonts.css` beze změny (zapisuje přes dočasný soubor).

## Testy

- Unit (Vitest), `src/art/layout.test.ts`:
  - `kitchenLayout` pro 1024, 1200, 1366: žádný pár boxů se nepřekrývá, mezera ≥ 8 px, vše uvnitř
    scény; dort je vodorovně zhruba uprostřed (±20 px od `W/2 − 70`); miska stojí na pultu
    (`bowl.y + bowl.height` mezi `COUNTER_TOP` a `COUNTER_EDGE_TOP`).
  - `kitchenLayout` ořezává vstup: 800 → jako 1024, 4000 → jako 1366, `NaN` → 1024.
  - `shelfSlots`: count 0 → `[]`; count 1–4 → vystředěno, stejné mezery, sloty uvnitř police,
    šířka i výška ≥ 88; count 5 → nejvýš `MAX_CHOICES`.
  - `fruitSlots`: výchozí 3 sloty 96×96, mezera 16, nepřekrývají se, leží uvnitř misky;
    count 1 a 2 → řada vystředěná uvnitř misky (levý okraj `bowl.x + (320 − šířka řady) / 2`);
    count 0 → `[]`, count 9 → 3 sloty.
  - `counterPanels`: 3 kusy na 1024 a 1200, 4 na 1296 a 1366, symetricky vystředěné, uvnitř
    scény, `y = COUNTER_FRONT_TOP + 14`.
  - `floorColumns`: pokryje celou šířku (≥ `W / 64`).
- Unit, `src/art/art.test.ts`: každý art modul vrací jeden `<svg>` se správným `viewBox`
  a rozměry (perníček 96×96, svíčka 96×112, medvídek 260×320, dort 220×146, miska 320×140);
  `cookie('K')` obsahuje `K`, `candle('3')` obsahuje `3`, `fruitBowl({ slots: 2 })` vykreslí
  dvě přední jahody a `fruitBowl()` tři; markup je well-formed (pomocný test
  hlídá párování tagů) a neobsahuje `<script`, `http://` ani `https://` (pravidlo 5).
- Spuštění: `docker compose run --rm test`, dále `check` a `build`.

## Ruční ověření

- [ ] `docker compose run --rm fonts` – vypíše dva soubory se smysluplnou velikostí (< 100 kB
      každý) a vytvoří `public/fonts/OFL.txt` + `src/fonts.css`.
- [ ] `docker compose --profile dev up`, otevřít <http://localhost:5173/mlsna-abeceda/> v Chrome,
      emulace iPad na šířku (1024×768): klepnout na úvodní obrazovku → kuchyně vypadá jako
      artboard (medvídek, pult, police, miska, perníčky K A M O, svíčky 1 2 3 4, korpus dortu),
      nic se nepřekrývá, nic není useknuté.
- [ ] Nápisy jsou Fredoka: v DevTools → Network jsou dva `woff2` ze `localhost`, žádný požadavek
      na `fonts.googleapis.com` ani jinam; v konzoli `document.fonts.check('700 48px Fredoka')` → `true`.
- [ ] V konzoli `__kitchen.letters(['Š','Č','Ř','Ž'])` a `__kitchen.digits(['5','6','7','8'])` –
      diakritika i číslice se vykreslí správně a zůstanou vystředěné.
- [ ] Šířka 1366×768: pult a podlaha jdou od kraje ke kraji, v čele pultu jsou čtvery dvířka,
      police zůstanou vpravo, mezery se roztáhnou, obrysy nejsou deformované. Mezikrok ~1200×768:
      totéž, ale dvířka jsou troje (přepnutí nastává na 1296).
- [ ] Rozměr mobilu na šířku 844×390: celá scéna je vidět (zmenšená), nic nevyčnívá,
      police ani miska nejsou useknuté.
- [ ] Medvídek jemně dýchá; po zapnutí „Emulate prefers-reduced-motion: reduce“ stojí.
- [ ] Tlačítko „zpět“ v rohu je pryč; `__scenes.go('title')` a zpět `__scenes.go('kitchen')`
      funguje bez chyb v konzoli.
- [ ] `docker compose run --rm build` a `npx`-free kontrola: `dist/fonts/` obsahuje oba fonty,
      `grep -o "url([^)]*)" dist/assets/*.css` ukáže `/mlsna-abeceda/fonts/…`,
      `grep -c __kitchen dist/assets/*.js` vrátí 0.

## DoD

- [ ] Všechna akceptační kritéria splněna
- [ ] Testy a build zelené
- [ ] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [ ] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

**Hotovo.** Kuchyně je postavená ze SVG a font Fredoka se hostuje lokálně.

**Nové soubory**

- `scripts/fetch-fonts.mjs` – stáhne woff2 subsety z Google Fonts, ověří je (magic `wOF2`,
  velikost, věta „SIL OPEN FONT LICENSE“) a teprve pak přes dočasný soubor zapíše
  `public/fonts/Fredoka-latin.woff2` (29,0 kB), `Fredoka-latin-ext.woff2` (4,5 kB),
  `public/fonts/OFL.txt` a generovaný `src/fonts.css`.
- `src/art/`: `svg.ts` (INK, `PALETTE`, `svg`, `stroke`, `centeredText`), `layout.ts`
  (`kitchenLayout`, `shelfSlots`, `fruitSlots`, `counterPanels`, `floorColumns`,
  `clampStageWidth`), `kitchen.ts`, `bear.ts`, `cake.ts`, `fruit.ts`, `bowl.ts`, `cookie.ts`,
  `candle.ts` + testy `layout.test.ts` a `art.test.ts`.

**Změněné soubory:** `src/scenes/kitchen/index.ts` a `style.css` (celá scéna znovu, bez
tlačítka „zpět“, s DEV `__kitchen`), `src/main.ts` (import `./fonts.css`), `src/style.css`
(`--wall-dot`, `.art-text`), `compose.yaml` (služba `fonts`), `CLAUDE.md` (řádek v Commands),
`.prettierignore` (generovaný `src/fonts.css`), `docs/navrh-hry.md` (viz níže).

**Odchylky od plánu**

1. `cakeBase()` má viewBox `-7 44 274 182` místo `0 52 260 172`. Plánovaný ořez sekal horní
   elipsu korpusu (její okraj i s tahem je na `y = 45`) a jeho poměr stran neodpovídal boxu
   220×146. Nový ořez je přesně kolem kresby, poměr sedí (odchylka 0,09 %), vykreslená
   velikost 220×146 i rovnoměrné měřítko zůstávají – volající ani layout se nemění.
2. Dolní hranice kontroly velikosti fontu je 2 kB, ne 5 kB: subset latin-ext má 4,6 kB, takže
   by plánovaná kontrola shodila i správné stažení. Formát hlídá hlavně kontrola `wOF2`.
3. Zadní řada jahod v misce je „jedna jahoda mezi každými dvěma předními“ – pro výchozí tři
   sloty vyjdou dvě, jak plán chtěl, ale pro dva sloty se jahody nepřekryjí.
4. Přibyly pomocné exporty, které kontrakt nemění: `strawberryWidth`, `strawberryGroup`
   (skládání jahod v misce bez vnořeného `<svg>`), `clampStageWidth`, `FLOOR_TILE_*` a
   atribut `data-fruit` na jahodách (podle něj je počítá test).
5. Tlapky medvídka jsou na `cy = 302` (plán říkal „≈ 296“); tělo je oříznuté clipPath na
   `y = 300`, takže břicho mizí za pultem a tlapky leží na desce.
6. `src/fonts.css` je v `.prettierignore`: prettier přeformátuje `unicode-range`, takže by
   `check` spadl po každém novém `docker compose run --rm fonts`.
7. `docs/navrh-hry.md` kap. 4: věta „položky přilétají z polic“ teď rozlišuje police
   (písmenka, číslice) a misku na pultu (ovoce) – důsledek rozvržení schváleného v plánu.

**Ověření**

- `docker compose run --rm test` – 159 testů zeleně (z toho 65 nových: 40 geometrie, 25 art).
- `docker compose run --rm check` (tsc + prettier) a `build` – bez chyb a varování.
- Build: `dist/fonts/` obsahuje oba woff2 i OFL.txt, v `dist/assets/*.css` je
  `url(/mlsna-abeceda/fonts/…)`, `grep -c __kitchen dist/assets/*.js` = 0.
- Prohlížeč (Chrome, dev server): scéna sedí na artboard při šířkách 1024, 1200, 1349 i 1366
  (troje dvířka do 1295, čtvery od 1296; pozadí se překresluje, pult i podlaha jdou od kraje
  ke kraji), na mobilu 844×390 je celá scéna vidět a nic není useknuté.
- Fonty: `document.fonts.check('700 48px Fredoka')` → `true`, žádný požadavek mimo origin
  (`performance.getEntriesByType('resource')` mimo origin = prázdné), `__kitchen.letters(['Š','Č','Ř','Ž'])`
  a `.digits(['5','6','7','8'])` se vykreslí Fredokou a zůstanou vystředěné.
- Přepínání scén `title → kitchen → title → kitchen`: bez chyb v konzoli, `window.__kitchen`
  patří nové instanci (po odchodu na title je `undefined`), tlačítko „zpět“ je pryč.
- Medvídek dýchá (`bear-breathe: running`).

**Neověřeno**

- `prefers-reduced-motion: reduce` se přes dostupné nástroje prohlížeče nedá přepnout; ověřeno
  jen to, že pravidlo v CSS existuje a animaci ruší (`animation: none`). Vizuálně to zbývá
  potvrdit ručně v DevTools.
- Kritérium „stáhnou se právě dva woff2“ platí jinak, než bylo napsané: prohlížeč stahuje
  subsety podle `unicode-range` líně. Při načtení jde jen `Fredoka-latin.woff2`, latin-ext se
  dotáhne, jakmile se objeví písmeno s háčkem (ověřeno). Oba jsou ze stejného originu,
  nic externího se nestahuje – smysl pravidla 5 platí.
- Pravidlo `.kitchen-dev-guide` zůstává v produkčním CSS (CSS se netřese); element se v DEV
  buildu nevytváří a `__kitchen` v bundlu není.

**Návrhy mimo rozsah**

- STEP-05 si vezme hit boxy z `fruitSlots` a pro letící jahodu `strawberryGroup`.
- Knot svíčky se schová mezi obrys plamínku a těla; kdyby ho autor chtěl vidět, stačí posunout
  plamínek o ~4 px nahoru.
- Design canvas svíčku pořád nemá; až bude výtvarná sada hotová, stálo by za to artboardy
  přegenerovat a znovu publikovat.
