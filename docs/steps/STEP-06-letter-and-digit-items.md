# STEP-06 · Položky „písmenko“ a „číslice“: výběr z police, chyba, nápověda

Status: done
Milník: M1 · Po: [STEP-05](./STEP-05-counting-item.md) ·
Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 4, 5.1, 5.4, 5.5, 5.6

## Shrnutí

Po [STEP-05](./STEP-05-counting-item.md) umí kuchyně jedinou položku – počítání ovoce. Tenhle krok
dodá **druhý a třetí typ položky**: „perníček s písmenkem K“ a „svíčku s číslem 3“. Nabídku vezme
scéna z objednávky ze [STEP-03](./STEP-03-game-logic-and-save.md) (`item.choices`, při stupni Č1/P1
tři kusy) a rozloží ji na police ze [STEP-04](./STEP-04-kitchen-scene-and-font.md): svíčky nahoru,
perníčky dolů. Správný kus vyletí na dortík, špatný se jen zatřese a zůstane; po druhé chybě se
správný rozsvítí a poskočí, aby dítě nikdy neuvízlo (návrh 5.5). Nečinnost hlídá stejný
`game/idle.ts` jako u počítání: v 15 s se nabídka pohoupe, ve 40 s se nad správným kusem objeví
čárkovaný kroužek. Hlas („K jako kočka“, „To je A. Hledáme K.“) přijde ve [STEP-07](../plan.md),
zatím zní jen syntetické cues z `audio/tones.ts`. Tím jsou hotové všechny tři typy položek stupňů
Č1/P1 a [STEP-08](../plan.md) už jen obalí objednávku bublinou, zákazníkem a hvězdičkou.

## Rozsah

**V rozsahu**

- Čistá logika bez DOM: `src/game/choice.ts` – stav položky s výběrem (cíl, nabídka, chyby,
  odhalení, hotovo), `choiceItemOf` pro vytažení položky z objednávky, `shelfDecoration`
  pro ozdobnou nabídku na neaktivní polici; s testy.
- DOM ovladač `src/scenes/kitchen/choice-item.ts`: naplnění obou polic, terče nad kusy,
  let vybraného kusu na dortík, zatřesení při chybě, rozsvícení a poskočení správného kusu
  po druhé chybě, pohoupání nabídky v 15 s, kroužek ve 40 s.
- Rozšíření `src/art/layout.ts`: `shelfHitSlots` (terče rozšířené o mezeru), `cakeCandleSlot`
  a `cakeCookieSlot` (kam vybraná věc na dortíku dosedne) + konstanty; testy geometrie.
- `src/scenes/kitchen/index.ts` podle typu položky přepne mezi počítáním a výběrem; obě police
  se plní z uloženého postupu (`session.save.tracks`) místo dosavadních ukázkových konstant.
  DEV `__kitchen` dostane `letter()`, `digit()` a `choice()`.
- Sdílené DOM pomůcky `src/scenes/kitchen/dom.ts` (`place`, `layer`, `prefersReducedMotion`,
  `createMotion` = registr timeoutů a animací) – mechanicky vytažené z `count-item.ts`,
  který se na ně přepíše beze změny chování.
- Drobná úprava `src/art/hint.ts`: kroužek bez bílé výplně (námět ze STEP-05 – nad perníčkem
  by bílý závoj přebil písmenko).
- CSS pro nové stavy v `src/scenes/kitchen/style.css`.

**Mimo rozsah**

- Bublina s objednávkou a odškrtávání položek, zvoneček, příchod/odchod zákazníka, hvězdička,
  konfety, konec sezení (STEP-08 a dál).
- Hlas a hlášky ze souborů, manifest `data/lines.cs.ts` (STEP-07); zvuk zůstává u `tones.ts`.
- **Zápis do save**: `recordSuccess` / `recordMistake`, `ordersCompleted`, hvězdičky. Krok save
  jen čte; `isFirstTry` je připravené pro STEP-08.
- Delší objednávky (2–3 položky) a s nimi souběh svíčky s kolečky počítadla nad dortem,
  stupně Č2+/P2+ (4 kusy v nabídce, číslice 6–10, více písmen), adaptivní výběr a distraktory
  nad rámec toho, co už generátor ze STEP-03 umí (STEP-10).
- Malá písmena, diakritika, slova (P3+), „kolik je“ a sčítání (M5/M6).
- Nové výrobky (zmrzlinka, palačinky) a jejich varianty písmenka/číslice.
- Změny rozvržení scény, medvídka a misky ze STEP-04/05.

## Implementace

**Soubory**

```
src/game/choice.ts                (nový)  stav položky s výběrem + výběr z objednávky
src/game/choice.test.ts           (nový)
src/scenes/kitchen/choice-item.ts (nový)  DOM ovladač položky „písmenko“ a „číslice“
src/scenes/kitchen/dom.ts         (nový)  sdílené place/layer/prefersReducedMotion/createMotion
src/scenes/kitchen/count-item.ts  (změna) přepis na sdílené pomůcky, jinak beze změny chování
src/scenes/kitchen/index.ts       (změna) přepínání položek, police z tracků, DEV handle
src/scenes/kitchen/style.css      (změna) terče police, zatřesení, rozsvícení, pohoupání
src/art/layout.ts                 (změna) shelfHitSlots, cakeCandleSlot, cakeCookieSlot + konstanty
src/art/layout.test.ts            (změna) testy nové geometrie
src/art/hint.ts                   (změna) kroužek bez bílé výplně
src/art/art.test.ts               (změna) test kroužku
```

**Knihovny** – žádné nové. Animace přes Web Animations API, zvuk přes stávající
`src/audio/tones.ts`. Runtime závislostí zůstává nula.

**Kroky**

1. **Logika.** `src/game/choice.ts` podle Kontraktu + `choice.test.ts`. Normalizace nabídky
   (duplicity, chybějící cíl, víc než `MAX_SHOWN_CHOICES`) je součástí `createChoice`, aby
   položka nikdy nešla „prohrát“ tím, že správná odpověď na polici není (pravidlo 2).
2. **Geometrie.** `art/layout.ts`: `shelfHitSlots` (rozteč `SHELF_ITEM_WIDTH + SHELF_GAP`,
   stejné středy jako `shelfSlots`, žádné mezery), `cakeCandleSlot` (svíčka stojí na horní ploše
   dortu) a `cakeCookieSlot` (perníček opřený zepředu o dort); testy.
3. **Kroužek.** `art/hint.ts` – `fill="none"`, jinak beze změny; upravit test v `art.test.ts`.
4. **Sdílené pomůcky.** `src/scenes/kitchen/dom.ts`: `place`, `layer`, `prefersReducedMotion`,
   `createMotion()` → `{ animate, after, cancelAll }` (registr `setTimeout` a `Animation`,
   `animate` vrací `null` při reduced motion nebo bez WAAPI). `count-item.ts` na ně přepsat –
   čistě mechanicky, žádná změna chování ani signatur.
5. **Ovladač.** `src/scenes/kitchen/choice-item.ts` podle pseudokódu níže.
6. **Scéna.** `kitchen/index.ts`: vytvoří oba ovladače, ozdobnou nabídku spočítá přes
   `shelfDecoration` z `ctx.session.save.tracks` a podle typu první položky objednávky spustí
   ten správný (druhý dostane `clear()`, takže jeho terče zmizí a jeho rekvizita zůstane
   ozdobou). Když objednávka nemá ani jednu známou položku, kuchyně zůstane statická
   a v DEV se vypíše `console.warn` (stejně jako ve STEP-05).
7. **CSS.** Terče police, `@keyframes item-shake`, `item-hop`, `item-bob`, třída
   `.is-revealed` (záře `drop-shadow` v barvě `--star`), vše s větví `prefers-reduced-motion`.
8. **DEV handle.** `__kitchen.letter('K', ['A','K','M'])`, `__kitchen.digit(3, [1,3,4])`
   (bez druhého argumentu: nabídka z aktuální objednávky, když je stejného typu, jinak
   `createChoice(target, shelfDecoration(track))` – normalizace cíl stejně doplní),
   `__kitchen.choice()` vrátí stav; `letters()`/`digits()` ze STEP-04 zanikají – police se
   teď plní z objednávky a ze save.
9. `docker compose run --rm test`, `check`, `build`; ruční ověření v prohlížeči (tablet
   i mobil na šířku), vyplnit Výsledek implementace, přepnout řádek v `docs/plan.md`.

**Klíčová rozhodnutí**

- **Neaktivní police zůstane plná, ale netečná** (rozhodnutí autora). Ozdobná nabídka se bere
  z aktivní sady tracku v save (`shelfDecoration`), ne z vymyšlených konstant – dítě tak vidí
  jen znaky, které se opravdu učí, a v repozitáři nejsou žádná falešná data. Netečná police
  nemá **žádný terč** (`pointer-events` jen nad aktivní policí), takže klepnutí na ni nic
  nespustí a hlavně se nepočítá jako chyba. Stejně je na tom miska při položce s výběrem:
  `countItem.clear()` schová její terč a nechá ji jako obrázek.
- **Svíčka stojí nahoře na dortu, perníček je opřený zepředu** (rozhodnutí autora). Svíčka má
  dosednout tam, kam patří (`CAKE_TOP_ITEM_BOTTOM`), perníček je vystředěný na polevu
  (`CAKE_COOKIE_CENTER_Y`), takže je písmenko velké a čitelné. Souběh svíčky s kolečky
  počítadla nad dortem v M1 nenastane (objednávka má jednu položku); až budou objednávky
  delší (STEP-10), bude potřeba jedno z toho posunout – poznamenáno v Náměty.
- **Terče na polici jsou rozšířené na rozteč** (112 px místo 96), takže mezi kusy nejsou hluché
  mezery – poučení z revize STEP-05. Terčem ale **není celá police** jako u misky: v misce je
  každý kus stejný, kdežto tady má klepnutí význam, a klepnutí u kraje police by se nesmí
  proměnit v chybu, kterou dítě nemyslelo.
- **Každé chybné klepnutí se počítá**, i opakované na tentýž kus. Odhalení správné odpovědi je
  pomoc, ne trest (pravidlo 2), takže radši dřív než později.
- **Rozsvícení je jeden vizuál pro obě situace** (nečinnost 40 s i druhá chyba, návrh 5.5
  „cíl se rozsvítí“ × „správný se rozsvítí a poskočí“): kroužek + záře, po chybě navíc poskočení.
  Obojí nastaví `revealed`, takže se položka nezapočítá jako „na první pokus“ (`isFirstTry`)
  – přesně jak to čeká `mastery.recordSuccess(track, element, firstTry)` ve STEP-08.
- **Připomenutí v 15 s = pohoupání nabídky** (rozhodnutí autora); položka v bublině, kterou
  chce návrh 5.5, existuje až od STEP-08.
- **Sdílené `dom.ts` místo kopie.** Registr timeoutů a animací a záložní timeout u letu jsou
  přesně to, co se při kopírování rozejde (viz odchylka 3 ve STEP-05). DOM testy v repozitáři
  nejsou, takže přepis `count-item.ts` musí projít ručním ověřením – je proto v checklistu.

**Pseudokód ovladače** (`choice-item.ts`)

```
start(item):
  reset()                                  # timery, animace, terče, kroužek, záře
  state = createChoice(choiceTarget(item), choiceValues(item))
  active = item.type === 'letter' ? 'letters' : 'digits'
  drawShelf(active, state.choices)         # perníčky / svíčky, data-choice, data-index
  drawShelf(other(active), decoration[other(active)])
  placeAll(); idle = createIdleWatcher({ onRemind: bobChoices, onHint: reveal(hop=false) })
  idle.poke()

onTap(event, index):                       # jen terče nad aktivní policí
  if (event.isPrimary === false) return    # klepnutí, ne druhý prst a ne tažení (pravidlo 3)
  if (!state || state.done) return
  hideHint()
  value = state.choices[index]
  { state, result } = pickChoice(state, value)
  if (result === 'wrong'):
      shake(items[index]); playCue('nope'); idle.poke()
      if (state.revealed) reveal(hop=true)     # druhá chyba
      return
  if (result === 'correct'):
      idle.stop(); hideTargets(); playCue('whoosh')
      fly(items[index] → cakeSlot(item.type), onLanded: land(); playCue('done'))

reveal(hop):                               # 40 s nebo druhá chyba
  if (!state || state.done) return
  state = revealChoice(state)
  index = state.choices.indexOf(state.target)
  items[index].classList.add('is-revealed'); hintEl over hit slot; playCue('pling')
  if (hop) animate(items[index], y: 0 → -14 → 0)
```

## Kontrakt

```ts
// src/game/choice.ts
import type { Order, OrderItem } from './orders';
import type { TrackState } from './mastery';

/** Položka, kde se vybírá z nabídky – písmenko nebo číslice. */
export type ChoiceItem = Exclude<OrderItem, { readonly type: 'count' }>;

/** Po druhé chybě se správná odpověď rozsvítí (návrh 5.5). */
export const REVEAL_AFTER_MISTAKES = 2;
/** Kolik kusů se vejde na polici; musí sedět s MAX_CHOICES v art/layout.ts (hlídá test). */
export const MAX_SHOWN_CHOICES = 4;

export interface ChoiceState {
  /** 'K' nebo '3' – obě dráhy pracují s řetězci, stejně jako mastery.ts. */
  readonly target: string;
  /** Nabídka tak, jak leží na polici zleva doprava. Vždy obsahuje `target`. */
  readonly choices: readonly string[];
  readonly mistakes: number;
  /** Každé chybné klepnutí v pořadí, jak přišlo (hodnota se může opakovat). */
  readonly wrong: readonly string[];
  /** Správná odpověď je ukázaná (druhá chyba nebo nápověda po 40 s). */
  readonly revealed: boolean;
  readonly done: boolean;
}

export type ChoiceResult =
  | 'correct'   // trefa; stav přechází na done
  | 'wrong'     // kus z nabídky, ale ne ten správný
  | 'unknown'   // hodnota není v nabídce – stav se nemění
  | 'finished'; // klepnutí po dokončení – stav se nemění

export function createChoice(target: string, choices: readonly string[]): ChoiceState;
export function pickChoice(
  state: ChoiceState,
  value: string,
): { readonly state: ChoiceState; readonly result: ChoiceResult };
/**
 * Nápověda po 40 s: označí položku za odhalenou, aniž by za dítě klepla. Nad dokončenou
 * položkou (`done`) vrací stav beze změny – stejně jako `pickChoice` s `'finished'`.
 */
export function revealChoice(state: ChoiceState): ChoiceState;
/** Bez chyby a bez nápovědy → STEP-08 přičte bod zvládnutí. */
export function isFirstTry(state: ChoiceState): boolean;

export function choiceItemOf(order: Order): ChoiceItem | null;
export function choiceTarget(item: ChoiceItem): string;
export function choiceValues(item: ChoiceItem): string[];
/** Ozdobná nabídka na neaktivní polici: prvních `count` prvků aktivní sady tracku. */
export function shelfDecoration(track: TrackState, count?: number): string[];
```

`createChoice` nabídku normalizuje, aby položka vždy šla splnit: vyhodí prázdné řetězce
a duplicity (zůstane první výskyt), ořízne na `MAX_SHOWN_CHOICES` a když by v oříznuté nabídce
`target` chyběl, nahradí jím poslední prvek (prázdná nabídka → `[target]`). Pořadí jinak
nemění – míchá se už v generátoru (`orders.ts`).

Příklad:

```ts
let s = createChoice('K', ['A', 'K', 'M']);
// { target: 'K', choices: ['A','K','M'], mistakes: 0, wrong: [], revealed: false, done: false }
({ state: s } = pickChoice(s, 'A')); // result 'wrong',  mistakes 1, revealed false
({ state: s } = pickChoice(s, 'M')); // result 'wrong',  mistakes 2, revealed true
({ state: s } = pickChoice(s, 'K')); // result 'correct', done true
isFirstTry(s); // false  → STEP-08 skóre nepřičte

createChoice('K', ['K', 'K', 'A']).choices;            // ['K', 'A']
createChoice('K', ['A', 'M', 'O', 'S', 'T']).choices;  // ['A', 'M', 'O', 'K']
choiceValues({ type: 'digit', value: 3, choices: [1, 3, 4] }); // ['1', '3', '4']
shelfDecoration({ level: 1, active: ['1','2','3','4','5'], scores: {} }); // ['1','2','3','4']
```

```ts
// src/art/layout.ts (přírůstek)
/** Rozteč terčů na polici: kus + mezera, takže mezi terči není hluché místo. */
export const SHELF_HIT_WIDTH = SHELF_ITEM_WIDTH + SHELF_GAP; // 112
/** Lokální y v boxu dortu, kde stojící ozdoba dosedne na horní plochu. */
export const CAKE_TOP_ITEM_BOTTOM = 24;
/** Lokální y středu perníčku opřeného zepředu o dort (střed polevy). */
export const CAKE_COOKIE_CENTER_Y = 92;

/**
 * Rozměry si oba sloty berou z art modulů (`CANDLE_WIDTH`/`CANDLE_HEIGHT` z `./candle`,
 * `COOKIE_SIZE` z `./cookie`) – ne z vlastních čísel. Kus na polici i kus na dortíku jsou pak
 * stejně velké, takže let mezi nimi nic nezvětšuje ani nezmenšuje. Cyklus nehrozí:
 * `candle.ts` ani `cookie.ts` `layout.ts` neimportují (stejně jako `fruit.ts` dnes).
 */
export function shelfHitSlots(shelf: Rect, count: number): Rect[];
export function cakeCandleSlot(cake: Rect): Rect;
export function cakeCookieSlot(cake: Rect): Rect;
```

Příklad pro šířku scény 1024 (`cake = { x: 332, y: 384, width: 220, height: 146 }`,
`shelfDigits = { x: 562, y: 84, width: 448, height: 128 }`):

```ts
shelfSlots(shelfDigits, 3).map((s) => s.x);     // [626, 738, 850]  (96 px kusy)
shelfHitSlots(shelfDigits, 3).map((s) => s.x);  // [618, 730, 842]  (112 px terče, stejné středy)
cakeCandleSlot(cake); // { x: 394, y: 296, width: 96, height: 112 }
cakeCookieSlot(cake); // { x: 394, y: 428, width: 96, height: 96 }
```

```ts
// src/scenes/kitchen/choice-item.ts
export interface ChoiceItemHandle {
  /** Rozehraje položku: nabídka na svou polici, ta druhá zůstane ozdobná. */
  start(item: ChoiceItem): void;
  /** Objednávka bez výběru (např. počítání): obě police jsou jen ozdoba, žádné terče. */
  clear(): void;
  layout(layout: KitchenLayout): void;
  state(): ChoiceState | null;
  destroy(): void;
}

export function createChoiceItem(options: {
  readonly root: HTMLElement;
  readonly shelves: { readonly digits: HTMLElement; readonly letters: HTMLElement };
  readonly decoration: { readonly digits: readonly string[]; readonly letters: readonly string[] };
  readonly audio: AudioEngine;
}): ChoiceItemHandle;
```

```ts
// src/scenes/kitchen/dom.ts
export function place(el: HTMLElement, rect: Rect): void;
export function layer(className: string): HTMLDivElement;
export function prefersReducedMotion(): boolean;
export interface Motion {
  /** null = reduced motion nebo prohlížeč bez WAAPI; volající pak dojede bez animace. */
  animate(el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions): Animation | null;
  after(ms: number, run: () => void): void;
  cancelAll(): void;
}
export function createMotion(): Motion;
```

## Akceptační kritéria

- KDYŽ objednávka obsahuje položku `letter` s `letter: 'K'` a `choices: ['A','K','M']`, PAK jsou
  na dolní polici tři perníčky A, K, M v tomhle pořadí, na horní polici stojí ozdobné svíčky
  z číselného tracku a klepatelné jsou jen ty perníčky.
- KDYŽ je položka typu `digit`, PAK je nabídka svíček na **horní** polici a ozdobné perníčky
  na dolní; jinak platí totéž.
- KDYŽ dítě klepne na správný kus, PAK kus zmizí z police, přiletí na dortík (svíčka nahoru,
  perníček zepředu) a zůstane tam, zazní „hotovo“, `state().done` je `true` a další klepnutí
  na polici už nic nedělá (`result: 'finished'`, žádná animace, žádný zvuk).
- KDYŽ dítě klepne na špatný kus, PAK se ten kus zatřese, zazní měkké „ne“, zůstane na polici,
  na dortík nic nepřiletí, `mistakes` je 1 a hra pokračuje.
- KDYŽ dítě klepne špatně podruhé (i na tentýž kus), PAK se správný kus rozsvítí, poskočí,
  objeví se nad ním kroužek a `revealed` je `true`; klepnutí na něj pak proběhne normálně
  a se stejnou odezvou jako napoprvé.
- KDYŽ položka skončila po chybě nebo po nápovědě, PAK `isFirstTry(state)` vrátí `false`;
  KDYŽ ji dítě trefilo napoprvé bez nápovědy, PAK vrátí `true`.
- KDYŽ se scéna 15 s nedotkne nikdo, PAK se nabídka na aktivní polici pohoupe; KDYŽ ticho trvá
  40 s, PAK se nad správným kusem objeví kroužek a rozsvítí se; KDYŽ dítě potom klepne,
  PAK kroužek zmizí a klepnutí se normálně vyhodnotí.
- KDYŽ je položka dokončená, PAK hlídač nečinnosti mlčí (žádné pohoupání ani kroužek).
- KDYŽ dítě klepne na neaktivní polici nebo na misku, PAK se nestane vůbec nic – žádná chyba,
  žádný zvuk, `mistakes` se nezmění.
- KDYŽ objednávka obsahuje položku `count`, PAK běží počítání ze STEP-05 beze změny a obě police
  jsou jen ozdobné.
- KDYŽ se scéna uprostřed rozehrané položky změní na jinou šířku (1024/1200/1366), PAK police,
  terče, kroužek i kus na dortíku sedí na nových pozicích a stav položky se nezmění.
- KDYŽ se přepne scéna nebo se položka rozehraje znovu, PAK nezůstane běžet žádný timer ani
  animace a nový začátek je čistý.
- KDYŽ prohlížeč hlásí `prefers-reduced-motion: reduce`, PAK se kus na dortíku objeví bez letu,
  nic se netřese, nehoupe ani neposkakuje, ale položka se pořád dá dohrát a zvuky hrají.
- KDYŽ nabídka dorazí poškozená (duplicity, chybějící cíl, víc než čtyři kusy), PAK je na polici
  nejvýš čtveřice bez duplicit a správná odpověď je mezi nimi (položka jde vždy splnit).
- KDYŽ dítě hraje celou položku, PAK se v `localStorage` nic nezmění (klíč `kk.save.v1`) a scéna
  neudělá žádný požadavek mimo origin.
- KDYŽ se podíváme na obrazovku, PAK na ní není žádný text kromě písmen a číslic na perníčcích,
  svíčkách a kolečkách (učební obsah, ne UI – pravidlo 1), a každý terč má aspoň 88×88 px.

## Testy

- Unit (Vitest), `src/game/choice.test.ts`:
  - `createChoice` – nabídka beze změny pořadí; duplicity pryč; chybějící cíl nahradí poslední
    prvek; pět kusů se ořízne na čtyři a cíl v nich zůstane; prázdná nabídka → `[target]`;
    výchozí stav (`mistakes` 0, `wrong` `[]`, `revealed` a `done` `false`).
  - `pickChoice` – správná hodnota → `'correct'` + `done`; špatná → `'wrong'`, roste `mistakes`
    i `wrong`; hodnota mimo nabídku → `'unknown'` a **stejná** instance stavu; klepnutí po
    dokončení → `'finished'` beze změny; druhá chyba nastaví `revealed`; opakovaná chyba na
    tentýž kus se počítá; vstupní stav se nikdy nemutuje.
  - `revealChoice` – nastaví `revealed`, jinak stav nemění; nad dokončenou položkou vrátí
    **stejnou instanci** stavu; `isFirstTry` je `true` jen bez chyb a bez odhalení.
  - `choiceItemOf` – vrátí písmenko i číslici z objednávky ze STEP-03, `null` pro objednávku
    jen s počítáním a pro objednávku bez položek; `choiceTarget` / `choiceValues` převedou
    číslice na řetězce.
  - `shelfDecoration` – prvních `count` prvků `track.active`, kratší track vrátí, co má,
    prázdný `[]`; výchozí `count` je `MAX_SHOWN_CHOICES`.
  - Pojistka proti rozejití: `MAX_SHOWN_CHOICES === MAX_CHOICES` z `art/layout.ts`.
- Unit, `src/art/layout.test.ts` (rozšíření): `shelfHitSlots` pro 0–4 kusy na šířkách
  1024/1200/1366 – šířka `SHELF_HIT_WIDTH`, sousední terče na sebe navazují bez mezery
  a nepřekrývají se, středy jsou totožné se středy `shelfSlots`, celá řada leží uvnitř police,
  každý terč ≥ 88×88, count 9 → 4 terče, `NaN` → `[]`; `cakeCandleSlot` a `cakeCookieSlot` –
  vystředěné na `CAKE_TOP_CENTER_X`, svíčka dosedá na `cake.y + CAKE_TOP_ITEM_BOTTOM`,
  perníček je vystředěný na `cake.y + CAKE_COOKIE_CENTER_Y`, oba leží vodorovně uvnitř dortu
  a nepřekrývají se s miskou; **rozměry jsou přišpendlené ke konstantám art modulů**
  (`cakeCandleSlot` má `CANDLE_WIDTH` × `CANDLE_HEIGHT`, `cakeCookieSlot` `COOKIE_SIZE`
  na obě strany) a shodují se s rozměrem slotu na příslušné polici, aby let neměnil velikost.
- Unit, `src/art/art.test.ts` (úprava): `hintRing(96)` má `fill="none"` a pořád `stroke-dasharray`.
- Spuštění: `docker compose run --rm test`, dále `check` a `build`.

## Ruční ověření

- [x] `docker compose --profile dev up`, otevřít <http://localhost:5173/mlsna-abeceda/> v Chrome,
      emulace iPad na šířku (1024×768). V konzoli `__kitchen.letter('K', ['A','K','M'])`.
      (Okno 1024×757, tj. stage 1039; emulaci zařízení se přes MCP zapnout nepodařilo.)
- [x] Na dolní polici jsou tři perníčky A, K, M, na horní čtyři ozdobné svíčky. Klepnout na
      ozdobnou svíčku a na misku → nestane se nic, `__kitchen.choice().mistakes` je 0.
- [x] Klepnout na perníček A → zatřese se, zůstane na polici, ozve se měkké „ne“, na dort nic
      nepřiletí. Klepnout na M → zatřese se a **správné K se rozsvítí, poskočí a dostane
      kroužek**. Klepnout na K → doletí na dortík, opře se zepředu, zazní „hotovo“; další
      klepání na polici nic nedělá.
- [x] `__kitchen.digit(3, [1, 3, 4])` → nabídka svíček je na horní polici, dolní je ozdobná;
      správná svíčka po klepnutí stojí uprostřed nahoře na dortu a nic nepřečnívá přes okraj scény.
- [x] Klepnutí do mezery mezi dvěma kusy nabídky se počítá tomu bližšímu; klepnutí vedle řady
      (u kraje police) nedělá nic.
- [x] `__kitchen.letter('K')` a nechat scénu být: v 15 s se nabídka pohoupe, ve 40 s se K
      rozsvítí a dostane kroužek. Klepnout na K → kroužek zmizí, položka je hotová a
      `__kitchen.choice()` má `revealed: true`.
- [x] Po dokončené položce nechat scénu 45 s v klidu → nic se nehoupe, kroužek se neobjeví.
- [x] Objednávka s počítáním: `__kitchen.count(3)` → počítání ze STEP-05 funguje beze změny
      (let, kolečka, víčko, přepočítání) a obě police jsou ozdobné a netečné.
- [x] Šířky 1366×768 a 1200×768: nabídka i terče sedí na polici, kus na dortíku je na svém místě;
      změna šířky uprostřed rozehrané položky nic neposune „vedle“ a stav zůstane.
      (1366 a změna uprostřed položky ověřeny; 1200 jen unit testy – okno nešlo zmenšit.)
- [x] Rozměr mobilu na šířku 844×390: celá scéna je vidět, terče na polici se trefují prstem
      (emulace dotyku), let i zvuky fungují. (Vykresleno v rámu 844×390; dotyk ani zvuk ověřit nešlo.)
- [x] DevTools → „Emulate prefers-reduced-motion: reduce“: kus se objeví na dortíku bez letu,
      nic se netřese ani nehoupe, položka se dá dohrát. (Ověřeno podvržením `matchMedia`.)
- [x] DevTools → Network: během hraní žádný požadavek mimo origin. Application → Local Storage:
      klíč `kk.save.v1` se nemění.
- [x] `__scenes.go('title')` a zpět `__scenes.go('kitchen')`: položka začíná znovu, nikde
      nezůstal viset kroužek ani záře, konzole čistá.
- [x] `docker compose run --rm build` a `grep -c __kitchen dist/assets/*.js` vrátí 0.

## DoD

- [x] Všechna akceptační kritéria splněna
- [x] Testy a build zelené
- [x] Ruční ověření projito (co ne, je uvedené ve Výsledku implementace)
- [x] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

**Hotovo** (298 testů zelených, `check` i `build` bez chyb, `grep -c __kitchen dist/assets/*.js` = 0).

**Nové soubory**

- `src/game/choice.ts` – stav položky s výběrem přesně podle Kontraktu (`createChoice`,
  `pickChoice`, `revealChoice`, `isFirstTry`, `choiceItemOf`, `choiceTarget`, `choiceValues`,
  `shelfDecoration`, `REVEAL_AFTER_MISTAKES`, `MAX_SHOWN_CHOICES`), bez DOM.
- `src/game/choice.test.ts` – 25 testů včetně pojistky `MAX_SHOWN_CHOICES === MAX_CHOICES`.
- `src/scenes/kitchen/choice-item.ts` – ovladač obou typů položky.
- `src/scenes/kitchen/dom.ts` – sdílené `place`, `layer`, `prefersReducedMotion`, `createMotion`.

**Změněné soubory**

- `src/art/layout.ts` – `SHELF_HIT_WIDTH`, `CAKE_TOP_ITEM_BOTTOM`, `CAKE_COOKIE_CENTER_Y`,
  `shelfHitSlots`, `cakeCandleSlot`, `cakeCookieSlot` (rozměry z `candle.ts` a `cookie.ts`).
- `src/art/layout.test.ts` – 19 nových testů geometrie (rozteč terčů, shodné středy, přišpendlení
  rozměrů ke konstantám art modulů, oba příklady z Kontraktu).
- `src/art/hint.ts` + `src/art/art.test.ts` – kroužek bez bílé výplně.
- `src/scenes/kitchen/count-item.ts` – přepis na `dom.ts` (mechanický, beze změny chování).
- `src/scenes/kitchen/index.ts` – přepínání položek podle objednávky, police z `session.save.tracks`,
  DEV `letter()` / `digit()` / `choice()`; `letters()` a `digits()` ze STEP-04 zanikly.
- `src/scenes/kitchen/style.css` – terče police, záře, pohoupání nabídky.

**Odchylky od plánu**

1. **Kroužek nápovědy na polici je větší než kus** (`SHELF_ITEM_WIDTH + 24` = 120 px, vystředěný
   na kus). Při rozměru kusu (96) dosedl přesně na vlastní obrys perníčku a v prohlížeči vypadal
   jako ozdoba, ne jako nápověda – ověřeno na screenshotu. Kontrakt velikost kroužku neurčoval,
   takže se nemění nic z Rozsahu ani z Kontraktu.
2. **Police dostaly třídu `kitchen-shelf`** – potřebná záchytka pro CSS pohoupání nabídky.
3. **`index.ts` používá `layer()` a `place()` ze sdíleného `dom.ts`** místo vlastních kopií
   (plán počítal s vytažením jen pro položky).
4. **DEV `__kitchen.letter(target)`** bere cíl tak, jak ho konzole napíše (přetypování na `Letter`),
   a slovo (`word`) dopočítá jen u skutečného písmene; plán tenhle detail neurčoval.

**Jak to bylo ověřeno** (Chrome, dev server na `127.0.0.1:5173`)

- Ověřeno: obsah obou polic z objednávky a ze save; netečná police i miska (klepnutí nemění
  `mistakes` ani nespustí počítání); chyba → zatřesení a `mistakes` 1; druhá chyba → `revealed`,
  záře, poskočení a kroužek; správný kus → let, perníček opřený zepředu i svíčka stojící nahoře
  na dortu, `done`; klepání po dokončení nedělá nic (terče schované, stav beze změny); klepnutí do
  mezery se počítá bližšímu kusu, klepnutí vedle řady nedělá nic; nečinnost 15 s → pohoupání (16 s
  na hodinách), 40 s → kroužek a záře (41 s), klepnutí pak kroužek schová a položku dokončí
  s `revealed: true`; po dokončení 76 s ticha se nestalo nic; `__kitchen.count(3)` hraje počítání
  ze STEP-05 beze změny (let, kolečka, víčko, přepočítání) a police jsou netečné; normalizace
  poškozené nabídky v prohlížeči (`['K','K','A']` → `['K','A']`, pět kusů → čtyři s cílem);
  přepnutí scény tam a zpět (žádný viset zůstalý kroužek ani záře, konzole čistá – jen HMR Vite);
  `localStorage` zůstal po celou dobu prázdný a `performance.getEntriesByType('resource')`
  neobsahuje jediný požadavek mimo origin.
- Šířky: ověřeno na stage 1039 (okno 1024×757) a 1366 (okno 1500×757) včetně změny šířky
  **uprostřed rozehrané položky** – terče i kusy sedí (terč je o půl mezery širší z každé strany)
  a stav položky se nezměnil.
- Mobil na šířku: scéna vykreslená v rámu 844×390 – celá je vidět, terče mají 57×49 CSS px, což
  na telefonu odpovídá ≥ 44 fyzickým px podle pravidla 3.
- **Neověřeno:** zvuk (v automatizovaném prohlížeči ho nelze poslechnout – cues jsou stejné jako
  ve STEP-05); dotyk v emulaci iPadu / telefonu v DevTools (přes MCP se emulace zařízení nedá
  zapnout, klikalo se myší, `pointerdown` je ale společná cesta); šířka 1200 v DOM (okno prohlížeče
  se nepodařilo zmenšit; geometrie pro 1200 je pokrytá unit testy); `prefers-reduced-motion` bylo
  ověřeno podvržením `matchMedia` v rámu (kus se objeví bez letu, žádná WAAPI animace neběží),
  ne přepínačem v DevTools.

**Náměty mimo rozsah**

- Až budou objednávky delší (STEP-10), potká se box svíčky (y 296–408) s řadou koleček počítadla
  (`cake.y − 84` = 300) – jedno z toho bude potřeba posunout; je to i v poznámkách `docs/plan.md`.
- Spodní část kroužku nápovědy na dolní polici lehce zasahuje do desky police; kosmetika, dá se
  vyřešit posunutím kroužku o pár pixelů nahoru, až bude jasné, jak vypadá s hlasem (STEP-07).
- `tones.ts` cue `nope` je zatím jediná zpětná vazba na chybu; STEP-07 ji nahradí hláškou
  („To je A. Hledáme K.“).
