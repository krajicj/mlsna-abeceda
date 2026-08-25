# STEP-09 · Dokončení objednávky: bublina, zákazník jí, hvězdička, celá smyčka

Status: done
Milník: M1 · Po: [STEP-06](./STEP-06-letter-and-digit-items.md), [STEP-08](./STEP-08-voice-playback-and-kitchen.md) · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 4, 5.4, 7, 13 bod 2

## Shrnutí

Po STEP-08 umí kuchyně jednu položku od začátku do konce – zadá ji hlasem, počítá nahlas, opraví,
napoví, pochválí – a pak zůstane tiše stát. Chybí druhá polovina smyčky z kap. 4 návrhu: dítě
nevidí, co si zákazník objednal, hotový výrobek si nikdo nevezme, za práci není odměna a do
`localStorage` se nikdy nic nezapíše (`ordersCompleted`, `stars` i skóre zvládnutí stojí na nule
od STEP-03). Tenhle krok to uzavře: nad medvídkem visí **bublina s objednávkou** (jen obrázky,
žádný text – klepnutí = zopakuj objednávku), splněná položka se v ní odškrtne, přijde krátká
**dopékací pointa** (poleva přejede přes dortík, cinkne trouba, vylétnou konfety), medvídek si
dortík **vezme a sní**, **hvězdička** letí do počítadla vpravo nahoře, do save se zapíše pokrok
a rozjede se **další objednávka**. Po tomhle kroku je M1 hratelné dokola a dá se dát dcerce do
ruky; STEP-10 mezi objednávky vloží zvoneček a další zákazníky, STEP-11 delší objednávky
a adaptivní výběr, STEP-12 konec sezení po deseti objednávkách.

## Rozsah

**V rozsahu**

- `src/art/bubble.ts`, `src/art/star.ts`, `src/art/confetti.ts` (nové) – karta bubliny s ocáskem,
  ikona reproduktoru, fajfka, hvězdička, počítadlo hvězdiček, konfetový kousek.
- `src/art/cake.ts` – `cakeGlaze()`: poleva, která při dokončení přejede přes dortík.
- `src/art/layout.ts` – `bubble` a `stars` v `KitchenLayout`, `bubbleSlots()`, `bubbleSpeakerSlot()`,
  `starSlot()` (čistá geometrie, testovatelná bez DOM).
- `src/game/progress.ts` (nový) – čistý zápis dokončené objednávky do `SaveData`: skóre prvků
  podle výsledku položky, `ordersCompleted`, `stars`, `lastPlayed`.
- `src/game/session.ts` – `session.complete(results)`: zapíše pokrok přes `writeSave()` a vygeneruje
  další objednávku (s `avoid` a `avoidFruit` z té předchozí).
- `src/data/lines.cs.ts` + jeden běh `docker compose run --rm voice` – šest nových hlášek
  (3× „hotovo", 2× hvězdička, „Otoč mě!"), klipy se commitují.
- `src/game/speech.ts` – `createFinishPicker()`, `createStarPicker()`, sdílený `createLinePicker()`,
  nové hlášky v `orderPreload()`.
- `src/scenes/kitchen/bubble.ts`, `stars.ts`, `finale.ts`, `pacing.ts` (nové) a napojení
  v `index.ts`, `count-item.ts`, `choice-item.ts`, `style.css`.
- `src/stage/orientation.ts` – overlay orientace konečně řekne „Otoč mě!" (odstraní se TODO
  z STEP-08); hláška se generuje ve stejném běhu, takže by jinak ležela nevyužitá.
- `docs/navrh-hry.md` kap. 5.4 a 5.5 – doplnit, co dělá se skóre přepočítání a nápověda
  (dnes tam je jen obecné „na první pokus +1, po chybě −1"). Nová mechanika patří nejdřív do
  návrhu, teprve pak do kódu (CLAUDE.md, „How to work"); STEP-11 z toho pravidla bude vycházet.
- Testy: `src/game/progress.test.ts`, `src/scenes/kitchen/pacing.test.ts` (nové), rozšíření
  `session.test.ts`, `speech.test.ts`, `layout.test.ts`, `lines.cs.test.ts`.

**Mimo rozsah**

- **Zvoneček a další zákazníci** (žabka, liška…), repliky zvířátek („mňam", poděkování), odchod
  a příchod zákazníka, MP3 efekty z ElevenLabs Sound Effects → [STEP-10](../plan.md). Do té doby
  je zákazník pořád medvídek, zůstává na místě a další objednávka naskočí sama.
- **Fotka do alba** („cvak", blesk) → STEP-14; hvězdička se v tomhle kroku jen počítá.
- **Zavádění nových prvků** (`maybeIntroduce`), postup na další stupeň (`advanceLevel`),
  adaptivní váhy a distraktory → STEP-11. Skóre se v tomhle kroku **jen zapisuje**; sada písmen
  a čísel se sama nemění (viz „Klíčová rozhodnutí").
- **Konec sezení po 10 objednávkách**, „Kuchyně dneska zavírá" a limity z nastavení → STEP-12.
- **Delší objednávky (2–3 položky)** → STEP-11. Bublina, `ItemResult[]` i `bubbleSlots()` s víc
  položkami počítají (max 3), ale generátor v M1 dělá pořád jednu.
- **VIP zákazník za 3 ★**, překvapení a obchůdek → M3.
- Rod pochval z nastavení → STEP-17; pořád `'neutral'`.

## Implementace

**Soubory**

```
src/art/bubble.ts                 (nový)  karta bubliny, ocásek, reproduktor, fajfka
src/art/star.ts                   (nový)  hvězdička a počítadlo hvězdiček
src/art/confetti.ts               (nový)  jeden konfetový kousek (barva a tvar podle indexu)
src/art/cake.ts                   (změna) cakeGlaze() – poleva přes hotový dortík
src/art/layout.ts                 (změna) bubble + stars v KitchenLayout, bubbleSlots, starSlot
src/art/layout.test.ts            (změna) geometrie bubliny a počítadla
src/game/progress.ts              (nový)  ItemResult, completeOrder(), todayStamp()
src/game/progress.test.ts         (nový)
src/game/session.ts               (změna) complete(), avoid/avoidFruit, options { rng, now }
src/game/session.test.ts          (změna) zápis pokroku a navázání další objednávky
src/game/speech.ts                (změna) createLinePicker, finish/star picker, orderPreload
src/game/speech.test.ts           (změna)
src/data/lines.cs.ts              (změna) FINISH, STAR, guard.turn + helpery
src/data/lines.cs.test.ts         (změna) počet hlášek 246 → 252, texty nových
src/scenes/kitchen/pacing.ts      (nový)  Pacer: „udělej to za N ms, ale ne přes vypravěče"
src/scenes/kitchen/pacing.test.ts (nový)  čekání na vypravěče s podstrčenými časovači
src/scenes/kitchen/bubble.ts      (nový)  bublina jako scénická komponenta
src/scenes/kitchen/stars.ts       (nový)  počítadlo hvězdiček
src/scenes/kitchen/finale.ts      (nový)  poleva → konfety → medvídek jí → hvězdička
src/scenes/kitchen/count-item.ts  (změna) onDone, outcome(), plate(), repeat(), pacer
src/scenes/kitchen/choice-item.ts (změna) totéž + decoration jako funkce
src/scenes/kitchen/index.ts       (změna) startOrder(), spojení bubliny, finále a session
src/scenes/kitchen/style.css      (změna) vrstvy bubliny, počítadla, konfet, polevy
src/stage/orientation.ts          (změna) „Otoč mě!" přes VoicePlayer
src/main.ts                       (změna) createSession(storage), voice do orientation guardu
docs/navrh-hry.md                 (změna) kap. 5.4 a 5.5 – skóre za přepočítání a nápovědu
public/audio/voice/cook/*.mp3     (nové)  6 klipů + řádky v index.json (commitují se)
```

**Knihovny** – žádná nová. Runtime závislosti zůstávají na nule (CLAUDE.md).

**Kroky**

1. **Hlášky do manifestu** (`src/data/lines.cs.ts`): pole `FINISH` (`'Hotovo!'`, `'A je to!'`,
   `'Dortík je hotový!'`) a `STAR` (`'Máš hvězdičku!'`, `'Hvězdička je tvoje!'`), konstanta
   `TURN_LINE = 'guard.turn'` s textem `'Otoč mě!'`; helpery `finishLines()`, `starLines()`.
   Zaregistrovat je ve stejné smyčce `add()` jako pochvaly. Test `lines.cs.test.ts` opravit
   na 252 hlášek a přidat kontrolu textů.
2. **Vygenerovat klipy**: `docker compose run --rm voice` (generátor podle otisku v `index.json`
   sáhne jen na těch šest nových, ostatní přeskočí a nic nestojí). Klipy i `index.json` se
   commitují. Klíč je v `~/.config/mlsna-abeceda/elevenlabs.env`, nikdy v repu (CLAUDE.md 9).
3. **`src/game/progress.ts`**: `ItemOutcome`, `ItemResult`, `itemResult(item, outcome)`,
   `todayStamp(now)` a `completeOrder(save, results, today)` – čistá funkce, `SaveData` dovnitř,
   nový `SaveData` ven, nic se nemutuje a nic nezapisuje do storage.
4. **`src/game/session.ts`**: `Session` dostane `complete(results)`; `save` a `order` se změní na
   gettery nad vnitřním stavem. `complete()` zavolá `completeOrder()`, `writeSave()` a vygeneruje
   další objednávku s `avoid: orderElements(previous)` a `avoidFruit: countItemOf(previous)?.fruit`.
   Podpis `createSession(storage, options?: { rng, now })`; volání v `main.ts` a v testu s `rng`
   upravit.
5. **`src/game/speech.ts`**: vytáhnout výběr bez bezprostředního opakování do `createLinePicker()`,
   `createPraisePicker()` na něm postavit (chování beze změny), přidat `createFinishPicker()`
   a `createStarPicker()`; `orderPreload()` doplnit o `finishLines()` a `starLines()`.
6. **`src/art/*`**: `bubble.ts` (karta 480×124 s ocáskem, `speakerIcon`, `orderCheck`),
   `star.ts` (`star(size)`, `starsPill(count)` 160×64), `confetti.ts` (`confettiPiece(index)`,
   14 kousků, barvy z `PALETTE`), `cake.ts` → `cakeGlaze()` ve stejném `CAKE_VIEW_BOX`, takže
   se pokládá na stejný rect jako korpus. Poleva se kreslí **jen podél horní hrany a po bocích**,
   střed zůstává volný – jinak by zakryla ovoce, perníček i svíčku.
7. **`src/art/layout.ts`**: `bubble` a `stars` do `KitchenLayout` + `bubbleSlots()`,
   `bubbleSpeakerSlot()`, `starSlot()`. Konstanty a ověřené hodnoty viz Kontrakt.
8. **`src/scenes/kitchen/pacing.ts`**: `createPacer({ voice })` – `after(delayMs, run)` počká,
   pokud vypravěč zrovna mluví (opakuje po 250 ms, nejvýš 16×, pak to řekne stejně). Do něj se
   přesune `armPraise()` z `count-item.ts` (dnes tam žije jako vlastní `praiseTimer`) – finále
   potřebuje přesně totéž a třetí kopie by se rozešla.
9. **`bubble.ts` a `stars.ts`** jako scénické komponenty (stejný tvar jako `count-item.ts`:
   `layout()`, `destroy()`); bublina má jeden hit box přes celou kartu (480×124 ≫ 88).
10. **`count-item.ts` / `choice-item.ts`**: nové `onDone`, `outcome()`, `plate()`, `repeat()`;
    `choice-item.ts` bere `decoration` jako funkci (police se překresluje z aktuálního save po
    každé objednávce). Položka **nehlásí výsledek při dokončení**, jen že je hotovo – výsledek
    se čte až při zápisu, aby se do něj vešla i klepnutí navíc během finále.
11. **`finale.ts`**: sekvence řízená časovači (viz „Klíčová rozhodnutí"), na konci `onStar()`
    (kuchyně zapíše pokrok a vrátí nový počet hvězdiček) a `onDone()` (kuchyně uklidí a spustí
    další objednávku).
12. **`index.ts`**: `startOrder(order)` s celou dosavadní logikou výběru položky + `bubble.show()`
    + `stars.set()`; `onDone` položky spustí finále; DEV handle dostane `finish()` a `stars(n)`.
13. **`orientation.ts` + `main.ts`**: guard bere `voice` a při přechodu do portrétu řekne
    `TURN_LINE` (jen když je audio odemčené – před prvním klepnutím je zámek, rule 6).
14. **`docs/navrh-hry.md`**: do kap. 5.4 (nebo 5.5, kam to sedne líp) dvě věty – klepnutí navíc
    na přiklopenou misku se počítá jako chyba (−1), nápověda po 40 s bod bere, ale netrestá.
15. `docker compose run --rm test`, `check`, `build`; ruční ověření v prohlížeči.

**Klíčová rozhodnutí**

- **Časová osa finále je řízená `setTimeout`, ne událostmi animací.** `motion.animate()` vrací
  `null` při `prefers-reduced-motion` a v prohlížeči bez WAAPI; kdyby se sekvence věšela na
  `finish`, smyčka by se v takovém režimu zastavila a dítě by uvízlo (rule 2). Animace jsou
  jen dekorace, běh drží časovače. Skryté okno (zamrzlé WAAPI) je stejný případ.
- **Start finále čeká na vypravěče.** Pochvala z položky („Výborně!") doběhne dřív, než začne
  „Hotovo!" – proto `pacer.after(400, …)`. Tři věty na objednávku (pochvala → hotovo →
  hvězdička) je maximum, na kolik se dá jít, aniž by hra začala žvanit; při ručním ověření to
  posoudí autor a případně se „hotovo" ztlumí na jednu variantu.
- **Výsledek položky se čte až při zápisu pokroku.** Klepnutí na přiklopenou misku přijde
  *po* dokončení; kdyby se výsledek odesílal hned, přepočítání během finále by se ztratilo.
  Proto `outcome()` a ne `onDone(outcome)`.
- **Přepočítání = chyba (−1).** Rozhodnutí autora (srpen 2026): klepnutí navíc na přiklopenou
  misku znamená „nevím, kdy přestat", a číslo dostane −1 stejně jako špatný perníček. Samotná
  nápověda po 40 s je mírnější: nebere bod, ale ani netrestá (`'hinted'` → beze změny).
- **Sada prvků se v tomhle kroku nemění.** `maybeIntroduce()` a `advanceLevel()` zůstávají
  nezavolané (STEP-11). Skóre tedy může vyšplhat na 5 a nic nového nepřijde – vědomý mezistav,
  aby se dal zápis pokroku ověřit odděleně od změn v generátoru.
- **Další objednávka naskočí sama** (rozhodnutí autora): bez zvonečku by kuchyně po hvězdičce
  stála a smyčka by se nezavřela. STEP-10 mezi hvězdičku a další objednávku vloží zvoneček
  a princip „dítě řídí tempo" (kap. 4) se vrátí.
- **Bublina neukazuje text**, jen obrázky toho, co se objednává (rule 1). Artboard
  v `docs/design/build-artboards.mjs` má pod obrázky i větu; ta je jen pro dospělého při návrhu
  a do hry nejde. **Opraveno při revizi autorem (viz Výsledek implementace, bod 8): bublina ukazuje
  jen DRUH věci** – ovoce s počtem, ale perníček a svíčka prázdné.
- **Bublina je terč.** Klepnutí zopakuje objednávku a je to jediný způsob, jak si o zopakování
  říct dřív než po 15 s nečinnosti. Celá karta je hit box (480×124).
- **Šířka bubliny 480 px** (artboard má 500): při 1024 px scény začíná police s číslicemi na
  x = 562 a její první svíčka na 570. Bublina široká 500 px by končila na 560, tedy 2 px od police –
  a test `layout.test.ts` chce mezi boxy aspoň 8 px. Se 480 px zbývá 22 px.
- **Poleva místo pečení.** Mechanika pečení je odložená (kap. 13 bod 2); dokončení dostane jen
  krátkou pointu – poleva, cinknutí, konfety.

**Časová osa finále** (t = 0 je okamžik, kdy `pacer` pustí sekvenci, tj. po doznění pochvaly):

```
t = 0      poleva přejede přes dortík (380 ms), playCue('done'), 14 konfet (900 ms),
           voice.say(finish.next())
t = 820    dortík + všechno na něm (plate()) letí k medvídkovi a zmenší se na 0,55 (560 ms),
           medvídek se třikrát zahoupá (munch, 640 ms), playCue('whoosh')
t = 1700   od packy medvídka vylétne hvězdička a letí do počítadla (700 ms),
           voice.say(star.next())
t = 2400   hvězdička dolétla → onStar(): session.complete(results), počítadlo poskočí na nový
           počet, playCue('pling', { step: 4 })
t = 2800   onDone(): kuchyně uklidí položku i finále, dortík je zase prázdný, bublina zmizí,
           voice.preload(orderPreload(next))
t = 3200   startOrder(next) – položka si sama za 350 ms řekne novou objednávku
```

**Pseudokód zápisu pokroku** (kuchyně, uvnitř `onStar`):

```ts
function writeProgress(): number {
  const results: ItemResult[] = [];
  const count = countItem.outcome();
  if (countOrder && count) results.push(itemResult(countOrder, count));
  const choice = choiceItem.outcome();
  if (choiceOrder && choice) results.push(itemResult(choiceOrder, choice));
  next = ctx.session.complete(results); // zapíše save a vrátí další objednávku
  return ctx.session.save.progress.stars;
}
```

## Kontrakt

```ts
// src/game/progress.ts
export type TrackName = 'numbers' | 'letters';

/** Jak položka dopadla (návrh 5.4): na první pokus +1, po chybě −1, po nápovědě beze změny. */
export type ItemOutcome = 'first-try' | 'hinted' | 'mistaken';

export interface ItemResult {
  /** Prvek dráhy přesně jak ho drží mastery.ts: 'K' nebo '3'. */
  readonly element: string;
  readonly track: TrackName;
  readonly outcome: ItemOutcome;
}

/** Jedna objednávka = jedna hvězdička; VIP za 3 ★ přijde až s obchůdkem (návrh kap. 7). */
export const STARS_PER_ORDER = 1;

export function itemResult(item: OrderItem, outcome: ItemOutcome): ItemResult;

/** 'YYYY-MM-DD' v místním čase (ne UTC – hraje se večer). */
export function todayStamp(now?: Date): string;

/** Nemutuje vstup, nezapisuje do storage; neznámý prvek (mimo `active`) skóre nezmění. */
export function completeOrder(
  save: SaveData,
  results: readonly ItemResult[],
  today: string,
): SaveData;
```

```ts
// src/game/session.ts
export interface Session {
  /** Aktuální záznam – po každém complete() nový. */
  readonly save: SaveData;
  /** Objednávka, kterou kuchyně právě plní. */
  readonly order: Order;
  /** Zapíše dokončenou objednávku do save a vygeneruje další; vrací ji. */
  complete(results: readonly ItemResult[]): Order;
}

export function createSession(
  storage: StorageLike,
  options?: { readonly rng?: Rng; readonly now?: () => Date },
): Session;
```

```ts
// src/data/lines.cs.ts
export function finishLines(): readonly string[]; // ['finish.1', 'finish.2', 'finish.3']
export function starLines(): readonly string[]; // ['star.1', 'star.2']
export const TURN_LINE = 'guard.turn';
```

| id | text |
|---|---|
| `finish.1` | Hotovo! |
| `finish.2` | A je to! |
| `finish.3` | Dortík je hotový! |
| `star.1` | Máš hvězdičku! |
| `star.2` | Hvězdička je tvoje! |
| `guard.turn` | Otoč mě! |

```ts
// src/game/speech.ts
export interface LinePicker {
  /** Nikdy dvakrát za sebou totéž (pokud není jen jedna hláška). */
  next(): readonly string[];
}
export type PraisePicker = LinePicker; // ponecháno kvůli importům v položkách kuchyně

export function createLinePicker(ids: readonly string[], rng?: Rng): LinePicker;
export function createPraisePicker(options?: { gender?: PraiseGender; rng?: Rng }): LinePicker;
export function createFinishPicker(options?: { rng?: Rng }): LinePicker;
export function createStarPicker(options?: { rng?: Rng }): LinePicker;
// orderPreload() nově vrací i finishLines() a starLines()
```

```ts
// src/art/layout.ts
export const BUBBLE_WIDTH = 480;
export const BUBBLE_HEIGHT = 124;
export const BUBBLE_PADDING = 20;
export const BUBBLE_SPEAKER = 44;
/** Vodorovný začátek obrázků v bublině: padding + reproduktor + mezera. */
export const BUBBLE_CONTENT_X = 80;
export const BUBBLE_ITEM_WIDTH = 116;
export const BUBBLE_ITEM_HEIGHT = 88;
export const BUBBLE_ITEM_GAP = 12;
export const BUBBLE_MAX_ITEMS = 3;
/** Ocásek bubliny: od levého okraje karty, míří na hlavu medvídka. */
export const BUBBLE_TAIL_X = 110;
export const STARS_PILL_WIDTH = 160;
export const STARS_PILL_HEIGHT = 64;
export const STAR_SIZE = 40;

export interface KitchenLayout {
  readonly bear: Rect;
  readonly cake: Rect;
  readonly bowl: Rect;
  readonly shelfDigits: Rect;
  readonly shelfLetters: Rect;
  /** Karta s objednávkou nad medvídkem; nezávisí na šířce scény. */
  readonly bubble: Rect;
  /** Počítadlo hvězdiček vpravo nahoře, nad policí s číslicemi. */
  readonly stars: Rect;
}

/** Vystředěná řada `count` (0…BUBBLE_MAX_ITEMS) políček uvnitř bubliny. */
export function bubbleSlots(bubble: Rect, count: number): Rect[];
export function bubbleSpeakerSlot(bubble: Rect): Rect;
/** Kam doletí hvězdička – ikona uvnitř počítadla. */
export function starSlot(stars: Rect): Rect;
```

Bublina má pevnou polohu (`x = 60`, `y = 28`), počítadlo se drží pravého okraje scény
(`x = stageWidth − STARS_PILL_WIDTH − 16`, `y = 10`). Test `layout.test.ts` hlídá **aspoň 8 px
mezi libovolnými dvěma boxy** `KitchenLayout`; počítadlo končí na y = 74 a police s číslicemi
začíná na y = 84, takže mezera je 10 px – při jakékoli změně výšky nebo `y` je potřeba ji dodržet. Řada políček v bublině je vystředěná
v prostoru `[bubble.x + BUBBLE_CONTENT_X, bubble.x + bubble.width − BUBBLE_PADDING]` a políčka
jsou svisle vystředěná v kartě – stejné pravidlo jako `shelfSlots()` a `pillSlots()`.

Ověřený příklad (`kitchenLayout(1024)`):

```
bubble  { x: 60,  y: 28, width: 480, height: 124 }   // stejné i pro 1366
stars   { x: 848, y: 10, width: 160, height: 64 }    // pro 1366: x = 1190
bubbleSpeakerSlot(bubble)  { x: 80,  y: 68, width: 44,  height: 44 }
bubbleSlots(bubble, 1)     [{ x: 272, y: 46, width: 116, height: 88 }]
bubbleSlots(bubble, 2)     [{ x: 208, … }, { x: 336, … }]
bubbleSlots(bubble, 3)     [{ x: 144, … }, { x: 272, … }, { x: 400, … }]
starSlot(stars)            { x: 864, y: 22, width: 40, height: 40 }
```

```ts
// src/art/bubble.ts
/** Karta s ocáskem; obrázky položek jsou samostatné vrstvy nad ní. */
export function orderBubble(): string;
export function speakerIcon(size: number): string;
/** Fajfka přes splněnou položku. */
export function orderCheck(size: number): string;

// src/art/star.ts
export function star(size?: number): string; // výchozí STAR_SIZE
export function starsPill(count: number): string; // 160×64, hvězdička + číslo

// src/art/confetti.ts
export const CONFETTI_COUNT = 14;
export function confettiPiece(index: number): string;

// src/art/cake.ts
/** Poleva přes hotový dortík – stejný CAKE_VIEW_BOX, pokládá se na `layout.cake`. */
export function cakeGlaze(): string;
```

```ts
// src/scenes/kitchen/pacing.ts
export interface Pacer {
  /** Spustí `run` za `delayMs`, ale nikdy přes běžící větu vypravěče. */
  after(delayMs: number, run: () => void): void;
  cancel(): void;
}
export function createPacer(options: {
  readonly voice: VoicePlayer;
  readonly retryMs?: number; // výchozí 250
  readonly maxWaits?: number; // výchozí 16 (pak se to řekne stejně – nic se nezahodí)
  /** Kvůli testům v Node; prohlížeč nechá výchozí. Stejný tvar jako IdleTimers v game/idle.ts. */
  readonly timers?: IdleTimers;
}): Pacer;
```

```ts
// src/scenes/kitchen/bubble.ts
export interface BubbleHandle {
  /** Vykreslí objednávku; `null` bublinu schová (kuchyně bez hratelné položky). */
  show(order: Order | null): void;
  /** Odškrtne položku `index` (fajfka přes obrázek). */
  tick(index: number): void;
  layout(layout: KitchenLayout): void;
  destroy(): void;
}
export function createBubble(options: {
  readonly root: HTMLElement;
  /** Klepnutí na kartu – kuchyně z něj udělá zopakování objednávky. */
  readonly onTap: () => void;
}): BubbleHandle;

// src/scenes/kitchen/stars.ts
export interface StarsHandle {
  set(count: number, options?: { readonly pop?: boolean }): void;
  layout(layout: KitchenLayout): void;
  destroy(): void;
}
export function createStars(options: { readonly root: HTMLElement }): StarsHandle;

// src/scenes/kitchen/finale.ts
export interface FinaleHandle {
  /** Objednávka je hotová: poleva, konfety, medvídek jí, hvězdička. */
  run(): void;
  layout(layout: KitchenLayout): void;
  /** Zruší rozběhnutou sekvenci (odchod scény, DEV clear()). */
  reset(): void;
  destroy(): void;
}
export function createFinale(options: {
  readonly root: HTMLElement;
  readonly cake: HTMLElement;
  readonly bear: HTMLElement;
  readonly audio: AudioEngine;
  readonly voice: VoicePlayer;
  readonly finish: LinePicker;
  readonly star: LinePicker;
  readonly stars: StarsHandle;
  /** Co letí k medvídkovi spolu s dortíkem (ovoce, perníček, svíčka). */
  readonly plate: () => readonly HTMLElement[];
  /** Hvězdička dolétla: zapiš pokrok a vrať nový počet hvězdiček. */
  readonly onStar: () => number;
  /** Kuchyně může uklidit a spustit další objednávku. */
  readonly onDone: () => void;
}): FinaleHandle;
```

```ts
// src/scenes/kitchen/count-item.ts a choice-item.ts – přírůstek k handlu
export interface CountItemHandle {
  // …dosavadní start/clear/layout/state/destroy
  /** Jak položka dopadla; `null`, dokud žádná neběží nebo není hotová. */
  outcome(): ItemOutcome | null;
  /** Vrstvy, které při dokončení letí k medvídkovi s dortíkem. */
  plate(): readonly HTMLElement[];
  /** Zopakuje objednávku (klepnutí na bublinu) a probudí hlídač nečinnosti. */
  repeat(): void;
}
// options nově: readonly onDone: () => void
// choice-item: readonly decoration: () => { digits: readonly string[]; letters: readonly string[] }
```

`outcome()` mapuje stav položky takto. `CountingState` nemá pole pro nápovědu (a nedostane ho –
nápověda je událost scény, ne stavu počítání); `count-item.ts` si drží vlastní `let hinted = false`,
nastaví ho v `showHint()` a vynuluje v `start()`/`reset()` – stejně jako dnes `praiseWaits`.
U perníčku a svíčky se čte přímo `ChoiceState.mistakes` a `ChoiceState.revealed`.

| položka | `'mistaken'` | `'hinted'` | `'first-try'` |
|---|---|---|---|
| počítání | `state.extraTaps > 0` | ukázala se nápověda po 40 s (`hinted`) | jinak |
| perníček / svíčka | `state.mistakes > 0` | `state.revealed` bez chyby | jinak |

Příklad celého kola (objednávka č. 1, „Prosím tři jahody.", dítě klepne čtyřikrát):

```ts
countItem.outcome();            // 'mistaken' (čtvrté klepnutí = přepočítání)
itemResult(order.items[0], 'mistaken');
// → { element: '3', track: 'numbers', outcome: 'mistaken' }
session.complete([result]);
// save.tracks.numbers.scores['3']  3 → 2
// save.progress { ordersCompleted: 1, stars: 1, lastPlayed: '2026-08-25' }
// vrací Order { index: 2, items: [ { type: 'letter', … } ] }
```

## Akceptační kritéria

- KDYŽ dítě dokončí položku objednávky, PAK se v bublině přes její obrázek objeví fajfka
  a po doznění pochvaly začne finále (poleva, cinknutí, konfety, hláška „Hotovo!").
- KDYŽ finále doběhne k hvězdičce, PAK hvězdička doletí do počítadla vpravo nahoře, počítadlo
  ukáže o jedna vyšší číslo a vypravěč řekne „Máš hvězdičku!".
- KDYŽ hvězdička dolétne, PAK je v `localStorage` pod `kk.save.v1` `ordersCompleted` o 1 vyšší,
  `stars` o 1 vyšší, `lastPlayed` je dnešní datum a skóre prvku se změnilo podle výsledku
  (+1 na první pokus, −1 po chybě nebo přepočítání, beze změny po nápovědě).
- KDYŽ byla položka splněna na první pokus a prvek už měl skóre 5, PAK skóre zůstane 5
  (a naopak nikdy neklesne pod 0).
- KDYŽ finále skončí, PAK je na pultu prázdný korpus, bublina ukazuje novou objednávku a vypravěč
  ji řekne; index objednávky odpovídá `ordersCompleted + 1`.
- KDYŽ přijde další objednávka, PAK nežádá tentýž prvek jako ta předchozí (dokud má dráha z čeho
  vybírat) a u počítání ani stejný druh ovoce.
- KDYŽ dítě klepne na bublinu, PAK vypravěč zopakuje objednávku (bez „Ká jako kočka.") a hlídač
  nečinnosti začne počítat znovu.
- KDYŽ dítě klepne na bublinu během finále nebo když žádná položka neběží, PAK se nic nestane
  (žádná hláška, žádná chyba).
- KDYŽ dítě klepne na přiklopenou misku ještě během finále, PAK se to do skóre promítne jako
  přepočítání (prvek dostane −1) – výsledek se čte až při zápisu.
- KDYŽ `localStorage` odmítne zápis (privátní režim, plná kvóta), PAK smyčka pokračuje dál
  z paměti a hra nespadne; po reloadu se jen začne od posledního uloženého stavu.
- KDYŽ hra běží s `prefers-reduced-motion: reduce`, PAK se nic nehýbe (žádné konfety, žádný let),
  ale finále i tak doběhne a další objednávka naskočí.
- KDYŽ je scéna opuštěna (`destroy()`) uprostřed finále, PAK nezůstane běžet žádný časovač,
  vypravěč zmlkne a nic se nezapíše podruhé.
- KDYŽ je zařízení na výšku, PAK se přes hru položí overlay s telefonem a (je-li audio odemčené)
  vypravěč řekne „Otoč mě!".
- KDYŽ scéna běží na 1024 i 1366 px široké scéně, PAK bublina nezasahuje do police s číslicemi
  a počítadlo hvězdiček je celé uvnitř scény.

## Testy

- Unit (Vitest), `src/game/progress.test.ts`:
  - `itemResult()` mapuje všechny tři typy položek na správný prvek a dráhu (`count` → číslo,
    `digit` → číslo, `letter` → písmeno).
  - `completeOrder()`: `'first-try'` +1, `'mistaken'` −1, `'hinted'` beze změny; strop 5 a dno 0;
    prvek mimo `active` skóre nezmění; vstup se nemutuje.
  - `ordersCompleted`/`stars` rostou o 1 (i pro prázdný `results`), `lastPlayed` je předané datum.
  - Dvě položky z různých drah v jedné objednávce se zapíšou obě.
  - `todayStamp()` vrací místní datum ve tvaru `YYYY-MM-DD` (test s pevným `new Date(...)`,
    včetně měsíce a dne s nulou vepředu).
- Unit, `src/game/session.test.ts` (rozšíření):
  - `complete()` zapíše do storage přesně jednou a `session.save` vrátí nový záznam.
  - Další objednávka má `index === ordersCompleted + 1`.
  - Se seedovaným `rng` a dvouprvkovou dráhou další objednávka nezopakuje předchozí prvek
    (`avoid`) ani druh ovoce (`avoidFruit`).
  - Storage, který při `setItem` vyhodí výjimku, smyčku nezastaví (`complete()` vrátí objednávku).
  - `now` z options se propíše do `lastPlayed`.
- Unit, `src/game/speech.test.ts` (rozšíření): `createFinishPicker()` / `createStarPicker()`
  vrací jen existující id (`hasLine`), nikdy dvakrát totéž za sebou, a `orderPreload()` obsahuje
  všechny hlášky finále.
- Unit, `src/art/layout.test.ts` (rozšíření): ověřené hodnoty `bubble`, `stars`, `bubbleSlots()`
  (0 → prázdné, > 3 → tři, vystředěné, uvnitř karty), `bubbleSpeakerSlot()`, `starSlot()`;
  bublina nezasahuje do `shelfDigits` a počítadlo se vejde do scény pro 1024 i 1366.
- Unit, `src/data/lines.cs.test.ts` (rozšíření): 252 hlášek, texty a id nových šesti.
- Unit, `src/scenes/kitchen/pacing.test.ts`: s podstrčenými `timers` a falešným `VoicePlayer` –
  mlčící vypravěč → `run` se spustí přesně po `delayMs`; mluvící → odkládá se po `retryMs`;
  po `maxWaits` odkladech se spustí i tak; `cancel()` zruší naplánované.
- Spuštění: `docker compose run --rm test`, dále `check` a `build`.
- Bez testu zůstává (DOM, jen ruční ověření): časová osa finále, animace a odškrtávání v bublině.

## Ruční ověření

- [ ] `docker compose --profile dev up -d`, otevřít `http://localhost:5173/mlsna-abeceda/`
      v Chrome DevTools jako iPad na šířku (1024×768), klepnout na úvodní obrazovku.
- [ ] Nad medvídkem je bublina s obrázky objednávky (žádný text kromě písmenka/číslice),
      vpravo nahoře počítadlo hvězdiček s aktuálním počtem.
- [ ] Splnit položku: v bublině naskočí fajfka, přeleje se poleva, cinkne trouba, vylétnou
      konfety, ozve se „Hotovo!"; medvídek si dortík vezme a zahoupe se.
- [ ] Hvězdička doletí do počítadla, číslo se zvýší, vypravěč řekne „Máš hvězdičku!".
- [ ] V konzoli `__save.read()`: `ordersCompleted`, `stars` a `lastPlayed` sedí; skóre prvku
      se posunulo správně (a `__save.raw()` obsahuje totéž).
- [ ] Následuje nová objednávka – jiný prvek než minule, bublina i police se překreslí.
- [ ] Klepnout na bublinu uprostřed plnění: vypravěč zopakuje objednávku.
- [ ] Chybný perníček → po dokončení má písmeno v `__save.read()` skóre o 1 nižší; nápověda
      po 40 s (nebo `__kitchen` + čekání) skóre nezmění.
- [ ] Klepnout na přiklopenou misku po dokončení počítání: „Už máme tři jahody, to stačí!"
      a číslo má po zápisu skóre o 1 nižší.
- [ ] Projít tři objednávky za sebou bez reloadu – nic se nezasekne, hlas se nepřekrývá,
      posoudit, jestli tři věty na objednávku nejsou moc.
- [ ] Totéž v rozměru mobilu na šířku (844×390): bublina, počítadlo i konfety zůstávají uvnitř
      scény a nic se nepřekrývá.
- [ ] V DevTools zapnout „Emulate CSS prefers-reduced-motion: reduce": nic nelítá, ale finále
      doběhne a další objednávka přijde.
- [ ] Otočit emulaci na výšku: overlay s telefonem + „Otoč mě!" (po prvním klepnutí, tedy
      s odemčeným audiem).
- [ ] Reload uprostřed objednávky: hra pokračuje objednávkou s indexem `ordersCompleted + 1`.

## DoD

- [ ] Všechna akceptační kritéria splněna
- [ ] Testy a build zelené
- [ ] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [ ] Šest nových klipů vygenerováno a commitnuto (`index.json` aktualizován)
- [ ] `docs/navrh-hry.md` doplněn o pravidlo skóre za přepočítání a nápovědu
- [ ] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

**Hotovo** (srpen 2026). Smyčka se zavřela: dítě splní položku, v bublině naskočí fajfka, přeleje
se poleva, cinkne trouba, vylétnou konfety, medvídek si dortík vezme a sní, hvězdička doletí do
počítadla, do `kk.save.v1` se zapíše pokrok a naváže další objednávka. Ověřeno sedmi objednávkami
za sebou bez reloadu.

**Nové soubory**

- `src/game/progress.ts` + `progress.test.ts` – `ItemOutcome`, `ItemResult`, `itemResult()`,
  `trackOf()`, `elementOf()`, `todayStamp()`, `completeOrder()`; čistý zápis, nic nemutuje.
- `src/art/bubble.ts` (karta s ocáskem, reproduktor, fajfka, `bubbleFruit()`), `src/art/star.ts`
  (`star()`, `starsPill()`), `src/art/confetti.ts`.
- `src/scenes/kitchen/pacing.ts` + `pacing.test.ts`, `bubble.ts`, `stars.ts`, `finale.ts`.
- Šest klipů v `public/audio/voice/cook/` (`finish.1–3`, `star.1–2`, `guard.turn`), jeden běh
  generátoru, 73 znaků; `index.json` aktualizován.

**Změněné soubory** – `art/layout.ts` (+ `bubble`, `stars`, `bubbleSlots()`, `bubbleSpeakerSlot()`,
`starSlot()`), `art/cake.ts` (`cakeGlaze()`), `art/svg.ts` (barva `star`), `data/lines.cs.ts`,
`game/session.ts` (`complete()`), `game/speech.ts` (`createLinePicker()` a pickery finále),
`scenes/kitchen/{index,count-item,choice-item,style.css}`, `stage/orientation.ts`, `main.ts`,
`docs/navrh-hry.md` kap. 5.4 a 5.5. Testy: 342 → **415**, všechny zelené; `check` i `build` čisté.

**Odchylky od plánu** (žádná nemění Kontrakt ani Rozsah)

1. **`avoid` se pamatuje po dráhách, ne z minulé objednávky.** Plán říkal
   `avoid: orderElements(previous)`, jenže objednávky se v drahách střídají (počítání → písmenko →
   číslice → …), takže „ta předchozí“ je skoro vždy z **druhé** dráhy a pravidlo by nikdy nezabralo –
   akceptační kritérium „nežádá tentýž prvek jako minule“ by bylo nesplnitelné. `session.ts` si proto
   drží poslední prvek **každé dráhy** a poslední druh ovoce. Nedubluje to pravidlo střídání
   z `orders.ts` (které STEP-11 změní) a funguje i pro delší objednávky.
2. **`art/bubble.ts` má navíc `bubbleFruit(kind, amount)`** – bublina potřebuje obrázek „tři jahody“
   (až pět kusů ve dvou řadách jako na dortu) a žádný takový nebyl. `BUBBLE_ART_HEIGHT` je veřejné,
   protože kresba je o ocásek vyšší než box `bubble`.
3. **Konstanty bubliny a počítadla bydlí v `art/layout.ts`** (jak píše Kontrakt) a `art/bubble.ts`
   a `art/star.ts` si je odtud berou – opačně než `candle.ts`/`cookie.ts`, ale stejně jako
   `art/kitchen.ts`. Velikost karty je rozhodnutí scény, ne kresby.
4. **`finale.ts` si drží seznam letových animací.** `createMotion()` zapomene animaci ve chvíli, kdy
   doběhne, takže `cancelAll()` by nezrušil `fill: 'forwards'` – dortík by zůstal neviditelný
   v medvídkově tlamě i pro další objednávku. Chyba se ukázala až v prohlížeči (první průchod
   smyčkou), teď se animace ruší jmenovitě v `reset()`.
5. **Fajfka je v rohu obrázku** (44 px), ne uprostřed – uprostřed překryla prostřední třešeň a nešlo
   poznat, co se objednávalo.
6. **`__voice.speaking` přibylo do DEV handle** v `main.ts`. Bez sluchátek se jinak nedá ověřit,
   že klepnutí na bublinu opravdu mluví; z buildu se stripuje jako zbytek DEV handlů.
7. **Fajfka naskočí až s pochvalou**, ne v okamžiku, kdy poslední kus dosedne (položka hlásí
   `onDone()` až po pochvale, aby finále nemluvilo přes ni). Rozdíl je ~900 ms.
8. **Bublina u perníčku a svíčky je prázdná** – oprava po revizi autorem (srpen 2026). Plán říkal
   „perníček s písmenkem, svíčka s číslicí“, jenže tím se z úlohy „najdi ká, které slyšíš“ stane
   „najdi stejný obrázek“ a dítě splní celou dráhu písmen, aniž by poznalo jediné písmeno – přesný
   opak kap. 5.4. Bublina teď ukazuje **druh věci** (perníček × svíčka × ovoce); které písmenko nebo
   číslice se chce, nese jen hlas a police. U ovoce počet zůstává: kolečka nad výrobkem ho stejně
   ukazují. `cookie()` a `candle()` mají proto argument nepovinný (bez něj kreslí prázdný kus),
   pravidlo je zapsané v `navrh-hry.md` kap. 4. Výjimka `vzor v bublině` u skládání slov (P3,
   kap. 5.1) zůstává – tam se učí pořadí písmen, ne poznávání, a i ten vzor má později zmizet.
9. **DEV handle `letter()`/`digit()`/`count()` překresluje i bublinu.** Do té doby měnil jen
   hratelnou položku a bublina dál ukazovala skutečnou objednávku – při ručním ověřování to mate.

**Jak to bylo ověřeno**

- `docker compose run --rm test` (415 testů), `check`, `build` – zelené.
- Prohlížeč (Chrome, dev server, scéna 1024 i 1366 px, „telefon na šířku“ 844×390):
  - Bublina s obrázky (1 třešeň, 5 třešní ve dvou řadách, **prázdný** perníček, **prázdná** svíčka),
    reproduktor, fajfka; počítadlo hvězdiček vpravo nahoře. Při 1024 px sedí geometrie z Kontraktu
    (`bubble {60,28,480,124}`, `stars {848,10,160,64}`) a nic se nepřekrývá.
  - **Sedm objednávek za sebou** bez reloadu, pokaždé naskočila další sama; `ordersCompleted`,
    `stars` i `lastPlayed` v `localStorage` sedí, `raw()` obsahuje totéž.
  - Skóre: první pokus **+1** (`1` → 1, `4` → 1, `O` → 1). Po chybném perníčku a po přepočítání
    během finále (`extraTaps: 1`) skóre **nestouplo** – tedy výsledek dorazil jako `mistaken`.
    Po nápovědě po 40 s zůstalo skóre beze změny (`O` = 1). Vlastní odečet −1 z hodnoty > 0 je
    pokrytý jednotkovými testy (`progress.test.ts`), v prohlížeči na něj nedošlo: prvky byly na 0
    a `mastery.ts` má dno.
  - Klepnutí na bublinu uprostřed plnění: vypravěč začne mluvit (`__voice.speaking` false → true).
  - `prefers-reduced-motion: reduce` (podstrčené `matchMedia`): nic nelítá, finále doběhne, pokrok
    se zapíše a další objednávka naskočí; dortík je zase vidět.
  - Odchod ze scény uprostřed finále (`__scenes.go('title')`): nic se nezapsalo, žádný časovač
    nedoběhl, konzole bez chyb.
  - Reload uprostřed sezení: objednávka pokračuje indexem `ordersCompleted + 1`.
  - Všech šest nových klipů se stáhne (HTTP 200) a „Otoč mě!" se přes `VoicePlayer` opravdu přehraje.

**Co ověřeno není**

- **Zvuk na uši.** Nemám jak poslouchat: že tři věty na objednávku (pochvala → „Hotovo!" →
  „Máš hvězdičku!") nejsou moc ukecané, musí posoudit autor. Stejně tak hlasitost nových klipů –
  „Dortík je hotový!" dostalo při normalizaci **+7,2 dB**, což je hodně; stojí za poslech, jestli
  nešumí (to samé čeká na posouzení u oprav „To je jé." a „To je gé." ze STEP-08).
- **Overlay orientace na výšku.** Okno prohlížeče v tomhle prostředí nejde otočit ani zmenšit
  (`matchMedia('(orientation: portrait)')` se podstrčit nedá), takže spuštění hlášky při přechodu
  do portrétu je ověřené jen čtením kódu; samotný klip hraje.
- **Dotyk na skutečném tabletu.** Zkoušeno myší a syntetickými pointer eventy.
- **Jestli je prázdný perníček v bublině čitelný.** Dospělému dává smysl („chce se perníček“);
  jestli to tak přečte i dcera, ukáže až hraní. Kdyby ne, další stupeň by byl perníček s otazníkem
  nebo tři tečky – ale to je zase skoro text.

**Náměty mimo rozsah**

- Svíčka v bublině je proti perníčku malá (96×112 do slotu 116×88); až budou objednávky delší, možná
  dát slotům poměr na výšku.
- Časová osa finále je 3,2 s. Na desáté objednávce může být dlouhá – vidí se, až si dcera zahraje;
  zkrátit jde jedním číslem v `finale.ts`.
- `pacing.ts` a `game/idle.ts` mají teď oba vlastní `defaultTimers`; kdyby přibyl třetí, patří to
  do jednoho místa.
