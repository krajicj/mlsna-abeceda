# STEP-05 · Položka „počítání“: miska → výrobek, kolečka, přepočítání, nečinnost

Status: done
Milník: M1 · Po: [STEP-03](./STEP-03-game-logic-and-save.md), [STEP-04](./STEP-04-kitchen-scene-and-font.md) ·
Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 4, 5.1, 5.5, 5.6, 7

## Shrnutí

Kuchyně ze [STEP-04](./STEP-04-kitchen-scene-and-font.md) je zatím obrázek – nic se neklepá.
Tenhle krok z ní udělá první **hratelnou položku**: zákazník chce N kusů ovoce (počet 1–5 vezme
scéna z generátoru objednávek ze [STEP-03](./STEP-03-game-logic-and-save.md)), dítě klepe na ovoce
v misce, každý kus přiletí na dort a nad dortem se plní kolečka s číslicemi. Po dosažení počtu se
miska přiklopí víčkem a kolečka zacinkají; další klepnutí už jen zahoupe víčkem (návrh 5.5).
Nečinnost 15 s rozbliká kolečka, 40 s přidá čárkovaný kroužek nad ovocem v misce – nápověda nikdy
nic neudělá za dítě. Hlas přijde až ve [STEP-07](../plan.md), zatím zní jen krátké syntetické
efekty. Zároveň se dokreslí zbylé dva druhy ovoce ze startovní sady (borůvka, třešeň, návrh 5.6),
takže generátor může nabídnout kterýkoli z nich. Krok tím připraví
[STEP-06](../plan.md) (písmenko a číslice z police sdílí kolečka, chybu i nečinnost)
a [STEP-08](../plan.md) (celá smyčka objednávky).

## Rozsah

**V rozsahu**

- Čistá logika bez DOM v `src/game/`: `counting.ts` (stav položky počítání), `idle.ts`
  (dvoustupňový hlídač nečinnosti s injektovanými timery), `session.ts` (přečte save
  a vygeneruje objednávku pro aktuální pozici) – vše s testy.
- Interakce ve scéně: terče 96×96 nad ovocem v misce, let kusu ovoce na dort, doplnění kolečka,
  přiklopení misky víčkem, zahoupání víčka při přepočítání, blikání koleček (15 s) a čárkovaný
  kroužek (40 s).
- Nové art moduly `pill.ts` (kolečko 40×40 s číslicí), `lid.ts` (víčko misky 320×80),
  `hint.ts` (čárkovaný kroužek); rozšíření `fruit.ts` o **borůvku a třešeň** a `bowl.ts`
  o volbu druhu ovoce.
- Rozšíření `art/layout.ts`: `cakeFruitSlots` (místa ovoce na dortu, max 5), `pillSlots`
  (řada koleček nad dortem), `lidRect` + příslušné konstanty; testy geometrie.
- Placeholder zvuky `src/audio/tones.ts` (Web Audio, bez souborů a bez závislostí): svist při
  letu, cink při doplnění kolečka, závěrečné zacinkání, měkké „ne“ při přepočítání.
- `SceneContext` dostane `session`, `main.ts` ji vytvoří a předá (kuchyně se tak dostane
  k uloženému postupu, aniž by sahala na `localStorage`).
- Doplněná věta v `docs/navrh-hry.md` kap. 5.5 o pořadí „víčko × jahoda skočí zpátky“
  (**už provedeno při psaní plánu**, viz Klíčová rozhodnutí).

**Mimo rozsah**

- Bublina s objednávkou a odškrtávání položek, zvoneček, příchod a odchod zákazníka,
  hvězdička, album, konec sezení (STEP-08 a dál).
- Hlas a zvukové efekty ze souborů, manifest hlášek (STEP-07); `tones.ts` je dočasná náhrada.
- Položky „písmenko“ a „číslice“ – police zůstávají se statickou ukázkou `1 2 3 4` / `K A M O`
  ze STEP-04 (STEP-06).
- **Zápis do save**: skóre zvládnutí (`recordSuccess` / `recordMistake`), `ordersCompleted`,
  hvězdičky. STEP-05 save jen čte; zapisuje se až s dokončením objednávky ve STEP-08.
- Delší objednávky (2–3 položky), stupně Č2+ (počty nad 5, dva druhy ovoce v jedné položce),
  ovoce z obchůdku (banán, jablko, hruška, malina, hrozny).
- Změny animací a stavů medvídka (dál jen dýchá) a rozvržení scény ze STEP-04.

## Implementace

**Soubory**

```
src/game/counting.ts             (nový)  stav položky počítání (cíl, položeno, přepočítání)
src/game/counting.test.ts        (nový)
src/game/idle.ts                 (nový)  hlídač nečinnosti 15 s / 40 s, timery injektované
src/game/idle.test.ts            (nový)
src/game/session.ts              (nový)  save + objednávka pro aktuální pozici
src/game/session.test.ts         (nový)
src/audio/tones.ts               (nový)  placeholder efekty přes Web Audio
src/audio/tones.test.ts          (nový)  falešný AudioContext: hraje jen po odemčení
src/art/fruit.ts                 (změna) tři druhy ovoce místo samotné jahody
src/art/bowl.ts                  (změna) fruitBowl({ kind, slots }), rim z layoutu
src/art/pill.ts                  (nový)  countPill({ digit, done })
src/art/lid.ts                   (nový)  bowlLid()
src/art/hint.ts                  (nový)  hintRing(diameter)
src/art/svg.ts                   (změna) nové barvy v PALETTE (ovoce, kolečka)
src/art/layout.ts                (změna) cakeFruitSlots, pillSlots, lidRect + konstanty
src/art/layout.test.ts           (změna) testy nové geometrie
src/art/art.test.ts              (změna) testy nových a změněných art modulů
src/scenes/kitchen/count-item.ts (nový)  DOM ovladač položky počítání
src/scenes/kitchen/index.ts      (změna) složí položku do scény, DEV __kitchen.count()
src/scenes/kitchen/style.css     (změna) terče, kolečka, víčko, kroužek, animace
src/stage/scenes.ts              (změna) SceneContext.session
src/main.ts                      (změna) createSession(storage) a předání do scén
docs/navrh-hry.md                (změna) upřesnění kap. 5.5 (hotovo v rámci plánu)
```

**Knihovny** – žádné nové. Animace přes Web Animations API (`Element.animate`), zvuk přes
Web Audio API, obojí nativní. Runtime závislostí zůstává nula.

**Kroky**

1. **Logika.** `src/game/counting.ts` a `src/game/idle.ts` podle Kontraktu + testy. `idle.ts`
   dostane timery injekcí, aby se dal testovat `vi.useFakeTimers()`.
2. **Session.** `src/game/session.ts`: `createSession(storage, rng?)` přečte save
   (`readSave`) a jednou vygeneruje objednávku pro pozici `progress.ordersCompleted + 1`
   (`generateOrder`). Nic nezapisuje.
3. **Předání do scén.** `SceneContext` dostane `readonly session: Session`,
   `createSceneManager(stage, audio, session, scenes)`; `main.ts` session vytvoří z existujícího
   `browserStorage()`. Titulní scéna ji ignoruje.
4. **Ovoce.** `src/art/fruit.ts` se zobecní na tři druhy (`fruit(kind, height)`,
   `fruitGroup(kind, …)`, `fruitWidth`); tvary borůvky a třešně jsou přesně v Kontraktu.
   `bowl.ts` dostane `kind` a barvy si bere podle druhu; `strawberry*` funkce zanikají
   (jediní volající jsou `bowl.ts` a testy).
5. **Nové art moduly.** `pill.ts`, `lid.ts`, `hint.ts` podle Kontraktu; nové barvy do `PALETTE`.
6. **Geometrie.** `layout.ts`: `cakeFruitSlots`, `pillSlots`, `lidRect` + konstanty; testy.
7. **Zvuk.** `src/audio/tones.ts` s `playCue(engine, cue, { step })`; při zamčeném audiu no-op
   (stejný obrys jako `audio/chime.ts`).
8. **Ovladač položky.** `src/scenes/kitchen/count-item.ts` (viz pseudokód níže): drží terče,
   kolečka, víčko, kroužek nápovědy, letící ovoce a hlídač nečinnosti; `layout()` se volá
   při každé změně velikosti scény, `destroy()` uklidí timery a animace.
9. **Scéna.** `kitchen/index.ts` ovladač složí, po prvním `resize` mu předá layout a spustí
   položku z `ctx.session.order`. Když v objednávce žádná položka typu `count` není (může nastat
   až od STEP-08, kdy se `ordersCompleted` začne zvyšovat), kuchyně zůstane statická jako ve
   STEP-04 a v DEV se vypíše `console.warn`. DEV `__kitchen` se rozšíří o `count(amount, kind?)`,
   `clear()` (položku zruší – tím se dá vyzkoušet objednávka bez počítání) a `state()`.
10. `docker compose run --rm test`, `check`, `build`; ruční ověření v prohlížeči (tablet
    i mobil na šířku), vyplnit Výsledek implementace, přepnout řádek v `docs/plan.md`.

**Klíčová rozhodnutí**

- **Počet z generátoru, jedna položka** (rozhodnutí autora). Scéna se ptá `session.order`, což je
  při `ordersCompleted = 0` vždy položka počítání (návrh 5.3: lichá objednávka = číselná, uvnitř
  dráhy začíná počítáním). Po dosažení počtu zůstane dort hotový a **nic dalšího se neděje** –
  další objednávka patří do smyčky ve STEP-08. Jinou hodnotu si vývojář vyzkouší přes
  `__kitchen.count(n)`.
- **Tři druhy ovoce hned** (rozhodnutí autora). Generátor ze STEP-03 vybírá ze `FRUITS`
  (jahoda, borůvka, třešeň) a scéna teď umí nakreslit všechny tři – odpadá tím rozpor, kdy by
  hlas ve STEP-07 mluvil o borůvkách a na dort by letěla jahoda. Ovoce z obchůdku (banán,
  jablko, …) zůstává mimo rozsah.
- **Přepočítání = zahoupání víčka** (rozhodnutí autora). Věta v návrhu 5.5 svádí k pořadí
  „jahoda vyletí a vrátí se“, ale víčko se přiklápí hned po dosažení počtu, takže ovoce už
  z misky ven nejde. Kap. 5.5 je proto upřesněná: víčko + poskočení koleček + hláska
  „Už máme tři, to stačí!“. Hra ani tak nikdy nezablokuje postup (pravidlo 2).
- **Kolečka s číslicemi**, jak je má artboard (`countPill` v `docs/design/build-artboards.mjs`):
  prázdné bílé kolečko s šedou číslicí, hotové růžové s bílou. Číslice na obrazovce je učební
  obsah, ne UI text (pravidlo 1) – dítě u počítání zároveň vidí, jak číslice vypadá.
- **Kolečka mají 40 px, ne 44 jako v artboardu.** Na nejužší scéně (1024) je mezi medvídkem
  (končí na x = 320) a policí s perníčky (začíná na x = 562) jen 242 px; pět koleček po 44 px
  s mezerou 12 px by měřilo 268 px. Kolečka jsou jen ukazatel, neklepá se na ně, takže pravidlo
  „terč ≥ 88 px“ se jich netýká; 5 × 40 px s mezerou 6 px = 224 px a od medvídka i police
  zbývá ≥ 8 px.
- **Placeholder zvuky v `audio/tones.ts`, ne v `audio/sfx.ts`.** `sfx.ts` je podle `CLAUDE.md`
  vyhrazený pro přehrávání MP3 podle id (STEP-07); dočasná syntéza si nezabírá jeho jméno
  a ve STEP-07 se `tones.ts` bez šrámů smaže.
- **Ovoce v misce se nespotřebovává.** Miska má tři přední kusy, ale objednávka může chtít pět –
  klepnutí proto vytvoří *letící kopii*, kus v misce jen krátce poskočí. Miska tak nikdy
  nedojde a dítě nemusí řešit, kde ovoce došlo.
- **Přistálé ovoce jsou samostatné prvky scény**, ne součást SVG dortu: musí přiletět, zůstat
  ležet a při změně šířky scény se přepočítat podle `cakeFruitSlots`. Zadní řada dostane
  `z-index: 0`, přední `z-index: 1`, aby se překrývaly jako skutečné ovoce na dortu.
- **Kroužek nápovědy patří k misce, ne k dortu.** V artboardu je čárkované kolečko na dortu –
  ukazuje, kam ovoce přiletí. Nápověda po 40 s ale musí ukázat, **kam klepnout** (návrh 5.5:
  „cíl se rozsvítí“, a cílem klepnutí je ovoce v misce), takže kroužek se kreslí nad prvním
  terčem v misce. Na dortu by dítě jen zkoušelo klepat na místo, kde se nic nestane.
- **`prefers-reduced-motion: reduce`**: žádný let, žádné blikání ani houpání – ovoce se na dortu
  a víčko na misce objeví rovnou, kolečko se rovnou přebarví. Zvuky zůstávají.

Pseudokód ovladače (`src/scenes/kitchen/count-item.ts`, logické px):

```
start(amount, kind):
  state = createCounting(amount)
  vykresli misku daného druhu, `amount` prázdných koleček, žádné ovoce na dortu, víčko skryté
  idle.poke()

onTargetTap(slotIndex):
  if state.done:
    { state } = addFruit(state)          // jen počítadlo extraTaps
    zahoupej víčkem, poskoč kolečky, playCue('nope'); idle.poke(); return
  { state, result } = addFruit(state)
  slot = cakeFruitSlots(layout.cake, state.target)[state.placed - 1]
  playCue('whoosh'); leť z fruitSlots(layout.bowl)[slotIndex] do slot (~420 ms)
  po dopadu: přidej ležící ovoce, kolečko[state.placed - 1] → hotovo, playCue('pling', step)
  if result === 'completed':
    idle.stop(); po 250 ms nasaď víčko, playCue('done'), kolečka jednou poskočí
  else idle.poke()

onIdleRemind():  kolečka 3× bliknou                      // hlas doplní STEP-07
onIdleHint():    kroužek nad prvním terčem v misce + playCue('pling', 0)
```

## Kontrakt

```ts
// src/game/counting.ts
/** Č1 počítá do 5; Č2 (do 10) si vyžádá druhou řadu na dortu – STEP-20. */
export const MAX_COUNT = 5;

export interface CountingState {
  /** 1…MAX_COUNT. */
  readonly target: number;
  readonly placed: number;
  /** Klepnutí navíc po dosažení počtu (přepočítání); STEP-08 z toho udělá skóre. */
  readonly extraTaps: number;
  readonly done: boolean;
}

export type CountingResult = 'placed' | 'completed' | 'too-many';

/**
 * Cíl se zaokrouhlí (`Math.round`, tedy 2.6 → 3) a ořízne do 1…MAX_COUNT;
 * co po zaokrouhlení není konečné číslo ≥ 1 (0, −3, `NaN`), končí na 1.
 */
export function createCounting(target: number): CountingState;

/** Jedno klepnutí na ovoce v misce. Nikdy nemutuje vstup. */
export function addFruit(state: CountingState): {
  readonly state: CountingState;
  readonly result: CountingResult;
};

/**
 * První položka typu `count` v objednávce, nebo `null`. Od STEP-08, kdy začne růst
 * `ordersCompleted`, může objednávka obsahovat jen písmenko nebo číslici – scéna pak zůstane
 * statická. Čistá funkce, aby se ta větev dala otestovat bez DOM.
 */
export function countItemOf(order: Order): Extract<OrderItem, { readonly type: 'count' }> | null;

// src/game/idle.ts
export const IDLE_REMIND_MS = 15_000;
export const IDLE_HINT_MS = 40_000;

/** Kvůli testům: v prohlížeči se dosadí window.setTimeout/clearTimeout. */
export interface IdleTimers {
  setTimeout(handler: () => void, ms: number): number;
  clearTimeout(id: number): void;
}

export interface IdleWatcher {
  /** Aktivita dítěte: cyklus začíná znovu od nuly. */
  poke(): void;
  /** Zruší naplánované připomenutí; další poke() ho zase nastartuje. */
  pause(): void;
  /** Konec (položka hotová, scéna zaniká); poke() už nic nedělá. */
  stop(): void;
}

/**
 * Po `poke()` naplánuje `onRemind` za `remindAfterMs` a `onHint` za `hintAfterMs` (obojí od
 * posledního `poke()`). Po `onHint` se cyklus rozjede znovu, takže dítě nezůstane bez pobídky.
 * Hlídač je po vytvoření nečinný – běžet začne až prvním `poke()`.
 */
export function createIdleWatcher(options: {
  readonly onRemind: () => void;
  readonly onHint: () => void;
  readonly remindAfterMs?: number;
  readonly hintAfterMs?: number;
  readonly timers?: IdleTimers;
}): IdleWatcher;

// src/game/session.ts
export interface Session {
  /** Přečtený save; STEP-05 do něj nezapisuje. */
  readonly save: SaveData;
  /** Objednávka pro pozici `save.progress.ordersCompleted + 1`, po celou scénu stejná. */
  readonly order: Order;
}

export function createSession(storage: StorageLike, rng?: Rng): Session;

// src/audio/tones.ts
export type Cue = 'whoosh' | 'pling' | 'done' | 'nope';

/**
 * Dočasné syntetické efekty (STEP-07 je nahradí soubory). Při zamčeném audiu no-op.
 * `step` u 'pling' vybírá tón z řady C5–D5–E5–G5–A5 (0…4, dál se cyklí).
 */
export function playCue(engine: AudioEngine, cue: Cue, options?: { readonly step?: number }): void;

// Přesné tóny (obrys i obálka podle `src/audio/chime.ts`, špička nikdy nad 0,25):
//   whoosh – triangle 320 → 900 Hz, 180 ms, špička 0,10
//   pling  – sine, řada C5 523.25, D5 587.33, E5 659.25, G5 783.99, A5 880.00 Hz,
//            220 ms, špička 0,18 (`step` mimo 0…4 se cyklí přes modulo)
//   done   – sine 783.99 Hz a o 0,12 s později 1046.50 Hz, po 260 ms, špička 0,18
//   nope   – sine 220 → 165 Hz, 200 ms, špička 0,14

// src/art/fruit.ts – nahrazuje strawberry() / strawberryGroup() / strawberryWidth() ze STEP-04
import type { FruitKind } from '../data/curriculum'; // 'strawberry' | 'blueberry' | 'cherry'

/** Společná kreslicí krabice všech tří druhů: x 0…40, y −6…46. */
export const FRUIT_VIEW_BOX = '0 -6 40 52';

export function fruitWidth(height: number): number;
export function fruit(kind: FruitKind, height: number): string;
export function fruitGroup(
  kind: FruitKind,
  options: {
    readonly cx: number;
    readonly cy: number;
    readonly height: number;
    readonly marker?: string;
  },
): string;

// src/art/bowl.ts
export function fruitBowl(options?: {
  readonly kind?: FruitKind; // výchozí 'strawberry'
  readonly slots?: number;   // výchozí MAX_FRUIT_SLOTS (3)
}): string;

// src/art/pill.ts
/** Kolečko počítadla 40×40: prázdné (bílé, šedá číslice) nebo hotové (růžové, bílá číslice). */
export function countPill(options: { readonly digit: string; readonly done: boolean }): string;

// src/art/lid.ts
/** Víčko misky 320×80; okraj kupole leží na lokálním y = 76 (viz LID_RIM_Y). */
export function bowlLid(): string;

// src/art/hint.ts
/** Čárkovaný kroužek nápovědy (artboard: dasharray 7 6) o daném průměru. */
export function hintRing(diameter: number): string;

// src/art/layout.ts – nové konstanty a funkce
export const PILL_SIZE = 40;
export const PILL_GAP = 6;
export const MAX_PILLS = 5;
/** Kolečka leží nad dortem: y = cake.y − PILL_OFFSET_Y. */
export const PILL_OFFSET_Y = 84;

export const MAX_CAKE_FRUIT = 5;
export const CAKE_FRUIT_HEIGHT = 44;
export const CAKE_FRUIT_PITCH = 40;
/** Střed horní plochy dortu v boxu 220×146 (odečteno z cake.ts). */
export const CAKE_TOP_CENTER_X = 110;

export const BOWL_RIM_Y = 56;
export const LID_HEIGHT = 80;
export const LID_RIM_Y = 76;

/** Šířka slotu je vždy `fruitWidth(CAKE_FRUIT_HEIGHT)`, tj. 34 px – ovoce se nikdy nedeformuje. */
export interface CakeSlot extends Rect {
  /** Zadní řada – kreslí se pod přední (z-index 0 × 1). */
  readonly back: boolean;
}

/**
 * Místa ovoce na dortu v pořadí, v jakém přilétá: prvních až 3 do přední řady, zbytek (max 2)
 * do zadní. Rozteč CAKE_FRUIT_PITCH, obě řady vystředěné na střed horní plochy dortu.
 */
export function cakeFruitSlots(cake: Rect, count: number): CakeSlot[];

/** Vystředěná řada koleček nad dortem; count se ořízne do 0…MAX_PILLS. */
export function pillSlots(cake: Rect, count: number): Rect[];

/** Box víčka nad miskou (okraj kupole sedne přesně na okraj misky). */
export function lidRect(bowl: Rect): Rect;
```

**Tvary nového ovoce** (v `FRUIT_VIEW_BOX`, obrys `INK`, zaoblené spoje; artboard je nemá,
proto je předepisuje plán):

| Modul | Tvary |
| --- | --- |
| `blueberry` | tělo `circle cx=20 cy=25 r=16` výplň `blueberry`, obrys 4; korunka `circle cx=20 cy=13 r=6` výplň `blueberryDark`, obrys 3; hvězdička `path "M20 8 V18 M15.5 10.5 L24.5 15.5 M24.5 10.5 L15.5 15.5"` bez výplně, obrys 2; odlesk `ellipse cx=13 cy=20 rx=4.5 ry=3 rotate(−25)` výplň `blueberryLight` bez obrysu |
| `cherry` | stopka `path "M20 12 Q27 0 35 -3"` bez výplně, tah `stem` 3,5 se zaoblenými konci; lístek `ellipse cx=30 cy=2 rx=7.5 ry=3.5 rotate(−22)` výplň `leaf`, obrys 2,5; tělo `circle cx=20 cy=27 r=16` výplň `cherry`, obrys 4; odlesk `ellipse cx=13.5 cy=22 rx=4.5 ry=3 rotate(−25)` výplň `cherryLight` bez obrysu |

Pořadí kreslení je pořadí v tabulce; se započtenou šířkou tahu drží obě kresby uvnitř
`x 0…40`, `y −6…46`, takže se ve slotu nic neořízne.

**Tvary víčka a kroužku** (v artboardu také nejsou; víčko sdílí siluetu s miskou z `bowl.ts`):

| Modul | Tvary |
| --- | --- |
| `bowlLid()` | `viewBox '0 0 320 80'`, kreslí se v pořadí: kupole `path "M6 76 A154 66 0 0 1 314 76 Z"` výplň `mintLight`, obrys `INK` 4 (vrchol kupole leží na y = 10, okraj na `LID_RIM_Y`); odlesk `path "M58 48 Q92 20 132 15"` bez výplně, tah `white` 6 se zaoblenými konci, `opacity="0.55"`; knoflík `rect x=146 y=2 width=28 height=14 rx=7` výplň `mint`, obrys `INK` 4 |
| `hintRing(d)` | `viewBox '0 0 d d'`, jeden `circle cx=d/2 cy=d/2 r=d/2−6` s `fill="#FFFFFF" fill-opacity="0.6" stroke="#3B2A1A" stroke-width="3" stroke-dasharray="7 6" opacity="0.6"` – stejné hodnoty jako čárkované kolečko v `docs/design/build-artboards.mjs` |

**Nové barvy v `PALETTE`** (borůvka a třešeň v artboardu nejsou, kolečka ano – `countPill`):

```ts
blueberry: '#5C6BC0',
blueberryDark: '#3F4A9C',
blueberryLight: '#B7C0EC',
cherry: '#B3261E',
cherryLight: '#E2726B',
pillDone: '#FF8FAB',
pillMuted: '#B9A697',
```

**Příklad geometrie** (scéna 1024 px, `cake = { x: 332, y: 384, width: 220, height: 146 }`,
`bowl = { x: 580, y: 400, width: 320, height: 140 }`):

```
pillSlots(cake, 5)      → [{x:330,y:300,w:40,h:40}, {x:376,…}, {x:422,…}, {x:468,…}, {x:514,…}]
                          (řada 224 px vystředěná na x = 442; od medvídka 10 px, od police 8 px)
cakeFruitSlots(cake, 5) → přední: {x:385,y:362,w:34,h:44,back:false}, {x:425,…}, {x:465,…}
                          zadní:  {x:405,y:350,w:34,h:44,back:true},  {x:445,…}
lidRect(bowl)           → {x:580, y:380, width:320, height:80}
```

## Akceptační kritéria

- KDYŽ se hra spustí a klepne se na úvodní obrazovku, PAK je v kuchyni nad dortem `N` prázdných
  koleček s číslicemi 1…N (N = počet z objednávky, 1–5) a v misce ovoce toho druhu, který
  objednávka žádá.
- KDYŽ dítě klepne na ovoce v misce, PAK jeden kus přiletí na dort, zůstane tam ležet, další
  kolečko zrůžoví a zazní cink; v misce ovoce **neubude**.
- KDYŽ je položeno N kusů, PAK se miska přiklopí víčkem, kolečka zacinkají a všechna jsou plná.
- KDYŽ dítě klepne na přiklopenou misku, PAK se víčko zahoupe, kolečka poskočí, zazní měkké „ne“
  a na dort **nepřiletí nic dalšího** (`placed` zůstává N, `extraTaps` roste).
- KDYŽ dítě 15 s nic neudělá, PAK kolečka třikrát bliknou; KDYŽ nic neudělá ani po 40 s, PAK se
  nad prvním kusem ovoce v misce objeví čárkovaný kroužek. Hra nikdy nepoloží kus za dítě
  a nikdy nic nezablokuje.
- KDYŽ dítě klepne kdykoli během blikání nebo se zobrazenou nápovědou, PAK kroužek zmizí, cyklus
  nečinnosti se počítá znovu od nuly a klepnutí se normálně započítá.
- KDYŽ je položka hotová, PAK hlídač nečinnosti mlčí (žádné blikání ani kroužek po dokončení).
- KDYŽ platí `prefers-reduced-motion: reduce`, PAK se ovoce objeví na dortu bez letu, víčko bez
  posunu, kolečka bez blikání a poskakování – a všechny stavy odpovídají stejné logice.
- KDYŽ je scéna 1024, 1200 nebo 1366 px široká, PAK se řada koleček nepřekrývá s medvídkem ani
  s policí (≥ 8 px), místa ovoce na dortu leží nad korpusem a víčko sedí přesně na misce.
- KDYŽ se šířka scény změní během hry, PAK zůstane už položené ovoce na dortu, kolečka i víčko
  na správných místech (přepočítá se z `kitchenLayout`).
- KDYŽ se měří terč v misce, PAK je jím **celá miska** (320×140 px, ≥ 88, pravidlo 3), klepnutí
  kamkoli na ni pošle na dort nejbližší kus ovoce a reaguje na jedno klepnutí (žádné tažení ani
  dvojklep). *(Upraveno po revizi autora – původně tři terče 96×96 nad předním ovocem.)*
- KDYŽ `createCounting` dostane 0, −3, 9, 2.6 nebo `NaN`, PAK je cíl 1, 1, 5, 3, resp. 1
  a nic nespadne.
- KDYŽ objednávka neobsahuje položku typu `count` (nastane až od STEP-08), PAK `countItemOf`
  vrátí `null`, kuchyně vypadá jako ve STEP-04, v konzoli není chyba a klepání nic nedělá;
  v DEV se ten stav vyvolá příkazem `__kitchen.clear()`.
- KDYŽ je audio zamčené (před prvním klepnutím) nebo prohlížeč Web Audio nemá, PAK `playCue`
  mlčí, nic nevyhodí a hra běží dál (pravidlo 2 a 6).
- KDYŽ se hraje celá položka, PAK se do `localStorage` nic nezapíše (klíč `kk.save.v1` se
  nezmění) a nejde ven žádný síťový požadavek (pravidlo 5).
- KDYŽ se scéna přepne pryč a zpět (`__scenes.go('title')` → `go('kitchen')`), PAK položka
  začne znovu od nuly, žádný timer ani animace nepřežije a v konzoli není chyba.
- KDYŽ proběhne `docker compose run --rm build`, PAK v bundlu není řetězec `__kitchen` a build
  je bez varování.

## Testy

- Unit (Vitest), `src/game/counting.test.ts`: zaokrouhlení a ořezání cíle (0 → 1, −3 → 1,
  2.6 → 3, 9 → 5, `NaN` → 1); `countItemOf` vrátí položku počítání z objednávky ze STEP-03
  a `null` pro objednávku, kde je jen písmenko; sekvence
  klepnutí 1…N dá `placed` 1…N a poslední `result: 'completed'`; klepnutí po dokončení vrací
  `'too-many'`, zvyšuje `extraTaps` a nemění `placed`; vstupní stav se nemutuje.
- Unit, `src/game/idle.test.ts` (`vi.useFakeTimers()`): po `poke()` přijde `onRemind` přesně
  v 15 s a `onHint` ve 40 s; `poke()` ve 14 s odloží obojí; `pause()` je zruší a další `poke()`
  je nastartuje; `stop()` je konečný (ani `poke()` už nic nespustí); po `onHint` se cyklus
  opakuje; hlídač bez `poke()` nikdy nic nezavolá.
- Unit, `src/game/session.test.ts`: prázdné úložiště → objednávka s indexem 1 a jednou položkou
  typu `count` s `amount` 1–5; uložený postup s `ordersCompleted: 2` → index 3; se seedovaným
  `rng` je výsledek reprodukovatelný; `createSession` do úložiště nic nezapíše (falešné
  `StorageLike` počítá `setItem`).
- Unit, `src/audio/tones.test.ts` (falešný `AudioContext` podle obrysu `src/audio/chime.ts`:
  `createOscillator`, `createGain`, `connect`, `start`, `stop` a zaznamenané hodnoty gainu):
  engine se `state: 'running'` → každý cue
  vytvoří aspoň jeden oscilátor, spustí ho a zase zastaví, špičková hlasitost ≤ 0,25;
  engine bez kontextu nebo ve stavu `suspended` → žádné volání a žádná výjimka.
- Unit, `src/art/layout.test.ts` (rozšíření): `pillSlots` pro 1–5 na šířkách 1024/1200/1366 –
  vystředěno na dort, mezery `PILL_GAP`, ≥ 8 px od `bear` i `shelfLetters`, `y = cake.y − 84`,
  count 0 → `[]`, count 9 → 5 slotů; `cakeFruitSlots` – pořadí (přední trojice, pak zadní),
  `back` příznaky, žádné dva sloty ve stejné řadě se nepřekrývají, celá skupina leží vodorovně
  uvnitř `cake.x … cake.x + cake.width` a nepřekrývá se ani s `bowl`, ani s řadou koleček,
  ořezání 0/9/`NaN`; `lidRect` – shodná šířka s miskou a okraj kupole na `bowl.y + BOWL_RIM_Y`.
- Unit, `src/art/art.test.ts` (rozšíření): `fruit(kind, 88)` pro všechny tři druhy vrací jedno
  `<svg>` se správným `viewBox` a rozměry a obsahuje barvu daného druhu; `fruitBowl({ kind })`
  kreslí tři přední kusy zvoleného druhu; `countPill` 40×40 obsahuje číslici a liší se výplní
  podle `done`; `bowlLid()` 320×80; `hintRing(96)` 96×96 s `stroke-dasharray`; markup je
  well-formed a neobsahuje `<script`, `http://` ani `https://`.
- Spuštění: `docker compose run --rm test`, dále `check` a `build`.

## Ruční ověření

- [ ] `docker compose --profile dev up`, otevřít <http://localhost:5173/mlsna-abeceda/> v Chrome,
      emulace iPad na šířku (1024×768). Klepnout na úvodní obrazovku → nad dortem jsou prázdná
      kolečka a v misce ovoce.
- [ ] Klepat na ovoce v misce: každý kus doletí na dort, zůstane ležet, kolečko zrůžoví, zazní
      cink (po prvním klepnutí je audio odemčené). Po posledním kusu se miska přiklopí víčkem.
- [ ] Klepnout na přiklopenou misku: víčko se zahoupe, kolečka poskočí, na dort nic nepřiletí.
- [ ] Nechat scénu 15 s bez dotyku → kolečka bliknou; nechat ji dál až do 40 s → nad prvním
      kusem ovoce v misce se objeví čárkovaný kroužek. Klepnout → kroužek zmizí a hraje se dál.
- [ ] Po dokončení položky nechat scénu 45 s v klidu: kolečka **neblikají** a kroužek se
      neobjeví (hlídač nečinnosti po dokončení mlčí).
- [ ] V konzoli `__kitchen.clear()` → kuchyně vypadá jako ve STEP-04 (žádná kolečka, klepání
      nic nedělá, konzole čistá); `__kitchen.count(3)` ji zase rozehraje.
- [ ] V konzoli `__kitchen.count(5)` → pět koleček a pět kusů ovoce na dortu ve dvou řadách,
      nic se nepřekrývá s medvídkem ani s policí; `__kitchen.count(3, 'blueberry')`
      a `__kitchen.count(2, 'cherry')` → miska i ovoce na dortu jsou správného druhu.
- [ ] Šířka 1366×768 a 1200×768: kolečka zůstávají nad dortem, víčko sedí na misce, nic není
      useknuté; změna šířky uprostřed rozehrané položky nic neposune „vedle“.
- [ ] Rozměr mobilu na šířku 844×390: celá scéna je vidět, terče se trefují prstem
      (emulace dotyku), let i cink fungují.
- [ ] DevTools → „Emulate prefers-reduced-motion: reduce“: ovoce se objeví bez letu, víčko bez
      posunu, kolečka neblikají; položka se pořád dá dohrát.
- [ ] DevTools → Network: během hraní žádný požadavek mimo origin. Application → Local Storage:
      klíč `kk.save.v1` se během hraní nemění.
- [ ] `__scenes.go('title')` a zpět `__scenes.go('kitchen')`: položka začíná znovu, konzole
      je čistá.
- [ ] `docker compose run --rm build` a `grep -c __kitchen dist/assets/*.js` vrátí 0.

## DoD

- [x] Všechna akceptační kritéria splněna
- [x] Testy a build zelené
- [x] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [x] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

**Hotovo.** Kuchyně je poprvé hratelná: dítě klepe na ovoce v misce, kusy létají na dort,
kolečka se plní, po dosažení počtu se miska přiklopí a další klepnutí už jen zahoupe víčkem.

**Nové soubory**

- `src/game/counting.ts` + `counting.test.ts` – stav položky (`createCounting`, `addFruit`,
  `countItemOf`), 18 testů.
- `src/game/idle.ts` + `idle.test.ts` – hlídač nečinnosti 15 s / 40 s s injektovanými timery, 7 testů.
- `src/game/session.ts` + `session.test.ts` – `createSession(storage, rng?)`, jen čte, 5 testů.
- `src/audio/tones.ts` + `tones.test.ts` – placeholder cues `whoosh` / `pling` / `done` / `nope`
  přes Web Audio, 14 testů proti falešnému `AudioContext`.
- `src/art/pill.ts`, `src/art/lid.ts`, `src/art/hint.ts` – kolečko počítadla, víčko misky,
  čárkovaný kroužek.
- `src/scenes/kitchen/count-item.ts` – DOM ovladač položky (terče, let, kolečka, víčko, nápověda).

**Změněné soubory**

- `src/art/fruit.ts` – tři druhy ovoce (`fruit`, `fruitGroup`, `fruitWidth`, `FRUIT_VIEW_BOX`)
  místo samotné jahody; `src/art/bowl.ts` – `fruitBowl({ kind, slots })`.
- `src/art/layout.ts` – `cakeFruitSlots`, `pillSlots`, `lidRect` a konstanty; `src/art/svg.ts` –
  barvy borůvky, třešně a koleček.
- `src/scenes/kitchen/index.ts` a `style.css` – složení položky, DEV `__kitchen.count/clear/state`.
- `src/stage/scenes.ts` a `src/main.ts` – `SceneContext.session`, `createSession` v bootstrapu.
- Testy `src/art/art.test.ts` a `src/art/layout.test.ts` rozšířeny. Celkem **247 testů**.

**Odchylky od plánu** (žádná nemění Kontrakt ani Rozsah)

1. **Zadní řada ovoce na dortu není vystředěná jako řada**, ale sedí v mezerách přední řady.
   Při pěti kusech vyjde přesně příklad z Kontraktu; při čtyřech by ale vystředěná zadní řada
   dala kus přesně za prostřední přední, byl by skoro neviditelný a nešel by spočítat.
2. **`fruitGroup` vrací navíc vnitřní `<g class="art-fruit-body">`.** Poskočení klepnutého kusu
   v misce potřebuje CSS/WAAPI transform, a ten by na vnějším `<g>` přepsal `transform` atribut,
   kterým je kus umístěný. Vnitřní skupina žádný vlastní transform nemá.
3. **Let ovoce má záložní timeout** (`FLIGHT_MS + 120`). Ukázalo se při ověřování v prohlížeči:
   ve skryté záložce Web Animations zamrznou, událost `finish` nepřijde a kus by zůstal viset
   ve vzduchu s nedoplněným kolečkem. Stejné pojistce se drží už `stage/scenes.ts`.
4. **Hlídač nečinnosti se zakládá znovu pro každou položku.** `stop()` je z definice konečný,
   takže po dokončené položce už `poke()` nic nespustil a další rozehrání (a od STEP-08 další
   objednávka) by běželo bez pobídek. Klepnutí navíc po dokončení proto hlídač ani nebudí –
   kritérium „po dokončení hlídač mlčí" tím platí samo od sebe.
5. Drobnosti: `bowl.ts` exportuje `FRONT_FRUIT_HEIGHT` (let začíná ve velikosti ovoce v misce)
   a rim si bere z `BOWL_RIM_Y` v layoutu; `pill.ts` a `lid.ts` exportují své rozměry;
   `main.ts` dává v DEV k dispozici `__session`.

**Jak to bylo ověřeno**

- `docker compose run --rm test` (247 testů, 14 souborů), `check` (tsc + prettier) i `build`
  bez chyb a varování; `grep -c __kitchen dist/assets/*.js` = 0.
- Prohlížeč (Chrome, dev server v Dockeru na loopbacku): celá položka prohraná na šířkách
  1366, 1200 i 1024 a na mobilu na šířku 844×390 (terč naměřen 48,8 CSS px, klepnutí trefuje);
  let, dopad, plnění koleček, víčko; klepnutí navíc → `extraTaps` roste, `placed` ne, na dort
  nic nepřiletí; nečinnost → kolečka bliknou v 15,8 s, kroužek nad prvním kusem v misce ve
  40,8 s, cyklus se zopakoval v 55,8 s (zpoždění je throttling časovačů ve skryté záložce);
  klepnutí kroužek schová a normálně se započítá; po dokončení 65 s ticha; `__kitchen.clear()`
  → statická kuchyně, klepání nic nedělá; `count(3,'blueberry')`, `count(2,'cherry')`,
  `count(5)` → správný druh i dvě řady na dortu; změna šířky uprostřed položky vše přepočítá;
  `__scenes.go('title')` a zpět nenechá běžet žádný timer ani animaci a položka začne znovu;
  `kk.save.v1` zůstal po celou dobu `null`; žádný požadavek mimo origin; konzole čistá.

**Co ověřené není**

- **Skutečný přepínač DevTools „Emulate prefers-reduced-motion: reduce"** – prohlížeč jel přes
  rozšíření, takže větev v JS je ověřená podvrženým `window.matchMedia` (ovoce se objeví bez
  letu, víčko bez animace, nezůstane žádná WAAPI animace), ale CSS blok `@media` (blikání
  koleček, dýchání medvídka) se v prohlížeči nespustil.
- **Skutečný dotyk** – kontrola na mobilní velikosti byla klepnutí myší přes pointer events,
  ne emulace prstu.
- **Zvuk** – cues jsou otestované proti falešnému `AudioContext`, ale nikdo je neslyšel;
  automatizovaný prohlížeč nemá výstup. Stojí za minutu na tabletu.

**Doděláno po revizi autora** (25. 8. 2026)

1. **Ovoce vypadalo, že je za miskou.** Zadní hrana misky se kreslila *přes* ovoce, takže přes
   kusy vedla čára. Nově se kreslí pořadí „zadní hrana → ovoce → přední stěna misky", takže ovoce
   sedí v misce a řeže ho jen přední okraj. Test v `art.test.ts` to pořadí hlídá.
2. **Klepat šlo jen na kusy 1, 3 a 5.** Terče 96×96 stály nad předním ovocem, mezi nimi byly
   mezery a menší kusy v zadní řadě nereagovaly. Terčem je teď **celá miska** (320×140) a klepnutí
   si najde nejbližší kus – ten poskočí a z něj vyletí kopie. Odpovídá to i návrhu (kap. 4
   „klepnutí na věc", kap. 5.5 „klepne na misku"), kam jsem tu větu doplnil.
   Nové `bowlFruitSpots` v `art/layout.ts` je jediný zdroj pozic ovoce v misce – miska z něj
   kreslí, scéna z něj trefuje, takže se to nemůže rozejít; každý kus má `data-spot`.
3. **Pod zavřeným víčkem se ovoce schová** (`.kitchen-bowl.is-covered`). Kupole víčka se ke krajům
   sklání, takže přes ni vykukovala stopka.

**Náměty mimo rozsah**

- Kroužek nápovědy má z artboardu bílou výplň s 60% krytím; nad ovocem ho tím trochu „zašedne".
  V artboardu ležel na dortu, kde pod ním nic není. Ke zvážení `fill="none"` ve STEP-06, kde
  stejný kroužek označí perníček.
- Při jednom nebo dvou kusech ovoce sedí kusy vlevo na dortu (sloty se plní zleva, aby počet
  zůstal čitelný). Vypadá to dobře, ale kdyby autor chtěl mít i malý počet vystředěný, dá se
  `cakeFruitSlots` vystředit podle skutečného počtu.
- `extraTaps` už se počítá; STEP-08 z něj udělá skóre přes `recordMistake`.
- Na nejširší scéně (1366) se knoflík víčka potká s konzolou police nad miskou. Je to jen
  kosmetika zavřené misky; kdyby to vadilo, stačí posunout polici nebo knoflík.
