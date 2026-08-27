# STEP-12 · Delší objednávka: dvě položky, souběžné plnění, jeden hlas a jeden hlídač nečinnosti

Status: done
Milník: M2 · Po: [STEP-11](./STEP-11-adaptive-selection-and-levels.md) · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 4, 5.3, 5.5

## Shrnutí

Každá objednávka dneska nese jednu položku a kuchyně to má zadrátované: `startOrder()` spustí buď
počítání, **nebo** výběr z police, nikdy obojí. Návrh (kap. 5.3) přitom slibuje, že **od 11.
objednávky přijdou dvě položky** – jedna z číselné a jedna z písmenkové dráhy – a že **pořadí
plnění je volné**; bublina jen odškrtává hotové. Tenhle krok to dodá.

Nejde ale jen o generátor. Dnes si každá položka říká zadání sama a `voice.say()` každou předchozí
větu utne, každá si drží vlastní hlídač nečinnosti a po dokončení sama spustí finále. Při dvou
položkách by se přeřvaly, dvakrát popoháněly a finále by naskočilo nad nesplněnou druhou položkou.
**Vypravěč a hlídač nečinnosti se proto stěhují do scény** – ta je jediná, kdo mluví o objednávce
jako celku, a jediná, kdo měří nečinnost. Položkám zůstává jen to, co patří k jednomu klepnutí
dítěte (počítání nahlas, „to stačí“, „To je bé. Hledáme ká.“).

Druhá položka navíc dostane **vlastní sadu vět** – „Prosím tři jahody. A ještě perníček s písmenkem
ká.“ – aby objednávka zněla jako jedna prosba, ne jako dvě. Je to 62 nových celých vět v manifestu
(nic se nelepí, pravidlo 7) a jeden běh generátoru hlasu.

Po kroku zbývá do M2 už jen STEP-13 (konec sezení, obnova po reloadu, slučitelný formát save).

## Rozsah

**V rozsahu**

- `src/data/lines.cs.ts` – **62 nových hlášek** pro druhou pozici v objednávce („A ještě…“):
  30 počítacích (10 počtů × 3 druhy ovoce), 10 číslicových, 22 písmenkových. Manifest roste
  z 254 na 316 hlášek.
- Běh `docker compose run --rm voice` a **commit vygenerovaných MP3** (generátor je přírůstkový,
  vyrobí jen nových 62).
- `src/game/orders.ts` – délka objednávky (1 do desáté, pak 2), skladba „jedna položka z každé
  dráhy“, pokračující střídání počítání/číslice, náhodné pořadí položek ze seedu.
- `src/game/speech.ts` – promluva přes víc položek a pozice položky ve větě: `itemSpeech(item,
  position)`, `orderSpeech(items)`, `repeatSpeech(items)`, `askAgainSpeech(items)`,
  `itemHintSpeech(item)`.
- `src/scenes/kitchen/index.ts` – jeden hlas a jeden hlídač nečinnosti pro celou objednávku, obě
  položky aktivní zároveň, odškrtnutí bubliny po jedné položce, pochvala ze scény, zopakování
  zbývající položky, finále až po poslední.
- `src/scenes/kitchen/count-item.ts` a `choice-item.ts` – přestávají mluvit o zadání a přestávají
  měřit nečinnost; nově `nudge()`, `hint()` a `onActivity`.
- Dev handle `__kitchen.play(order)` – přehraje libovolnou objednávku, tedy i dvoupoložkovou, bez
  odehrání deseti.
- Zápis rozhodnutí do `docs/navrh-hry.md` kap. 5.3 a 5.5 (viz **Změny návrhu**).
- Srovnání komentářů, které slibují něco jiného, než po kroku platí (`counting.ts`, `art/layout.ts`,
  `session.ts`).

**Mimo rozsah**

- **Tři položky** (návrh 5.3 „od Č3 nebo P3 až 3“) – přijdou se stupni Č3/P3, tedy STEP-22
  a STEP-25. Teprve s nimi bude potřeba řešit kolizi perníčku a svíčky na dortu. Věty pro **třetí**
  pozici se teď negenerují: tvar „A ještě…“ na ní zopakovaně nesedí a rozhodne se to, až bude
  jasné, jak trojice zní.
- **Vyšší váha dráhy, která je pozadu** (návrh 5.3) – dává smysl až u tří položek, kde se vybírá,
  čí je ta třetí. U dvou je skladba pevná (jedna z každé dráhy), takže by pravidlo nemělo co dělat.
- Konec sezení po 10 objednávkách, obnova po reloadu, migrace a slučitelný formát save – STEP-13.
- Dva druhy ovoce v jedné položce a „kolik je“ (Č2 druhá půlka, Č3) – STEP-22.
- Změna rozvržení dortu, bubliny nebo polic; současné boxy dvěma položkám stačí (viz Klíčová
  rozhodnutí, bod 6).
- Uložení rozehrané objednávky do save; `SAVE_VERSION` zůstává 1 a formát se nemění.
- Nové zvukové efekty; `src/data/sfx.ts` a `public/audio/sfx/` se nemění.

## Implementace

**Soubory**

```
src/data/lines.cs.ts               (změna)  62 hlášek druhé pozice + tři helpery na id
public/audio/voice/<slug>/*.mp3    (nové)   62 klipů z ElevenLabs, committnuté
public/audio/voice/index.json     (změna)  fingerprint index generátoru (jeden pro všechny hlasy)
src/game/orders.ts                 (změna)  délka objednávky, skladba dvou položek, tah číselné dráhy
src/game/orders.test.ts            (změna)  + testy délky, skladby, střídání a determinismu
src/game/speech.ts                 (změna)  pozice položky, promluva přes víc položek, nápověda
src/game/speech.test.ts            (změna)  + testy nových funkcí a nových id v manifestu
src/game/session.ts                (změna)  jen komentáře – chování beze změny
src/game/counting.ts               (změna)  jen komentář u countItemOf
src/art/layout.ts                  (změna)  jen komentář u BUBBLE_MAX_ITEMS
src/scenes/kitchen/index.ts        (změna)  jeden hlas, jeden hlídač, dvě položky, __kitchen.play()
src/scenes/kitchen/count-item.ts   (změna)  bez zadání a bez hlídače; nudge(), hint(), onActivity
src/scenes/kitchen/choice-item.ts  (změna)  bez zadání a bez hlídače; nudge(), hint(), onActivity
docs/navrh-hry.md                  (změna)  kap. 5.3 a 5.5 – viz Změny návrhu
docs/plan.md                       (změna)  stav kroku, poznámka
```

**Knihovny** – žádné nové. Runtime závislostí zůstává nula.

**Kroky**

Krok je velký (manifest + hlas, dva refaktory scény, generátor), takže jde po **čtyřech
zastávkách**. Po každé je hra funkční a nasaditelná, každá je vlastní commit a autor ji mezitím
ověří.

### Zastávka 1/4 – manifest a nové klipy

1. **`lines.cs.ts`.** Tři nové helpery na id (`orderNextCountLine`, `orderNextDigitLine`,
   `orderNextLetterLine`) a tři řádky do existujících smyček, které stavějí `LINES`:

   ```ts
   add(orderNextCountLine(amount, fruit), `A ještě ${countedFruit(amount, fruit)}.`);
   add(orderNextDigitLine(digit), `A ještě svíčku s číslem ${CARDINALS[digit]}.`);
   add(orderNextLetterLine(letter), `A ještě perníček s písmenkem ${spelled}.`);
   ```

   Texty jsou první pozice s „Prosím “ → „A ještě “; skloňování se bere ze stejných tabulek
   (`countedFruit`, `CARDINALS`, `SPELLED`), takže nemůže rozejít. Věta se slovem
   (`letter.word.*`) je pro obě pozice tatáž a nepřibývá.
2. **`speech.test.ts`.** Test „every id the game can ask for is in the manifest“ rozšířit o nové
   id: všech 22 písmen, 10 číslic a 10 počtů × 3 druhy ovoce v tvaru druhé pozice; a test, že
   `LINES` nemá duplicitu.
3. **Generování.** `docker compose run --rm voice --dry-run` musí ohlásit **právě 62** hlášek
   k vyrobení (fingerprint index nechá 254 stávajících být), pak `docker compose run --rm voice`.
   Klíč zůstává v `~/.config/mlsna-abeceda/elevenlabs.env`, v repu ani v CI nemá co dělat.
4. Poslechnout namátkou pár nových klipů (viz Ruční ověření).

→ **Commit 1/4.** Hra nové klipy ještě nepoužívá, jen leží v `public/audio/voice/`.

### Zastávka 2/4 – jeden hlas a jeden hlídač nečinnosti (viditelně se nic nemění)

5. **`speech.ts`.** Dnešní `orderSpeech(item)` se přejmenuje na `itemSpeech(item, position)`
   a dostane druhý parametr (`'first'` výchozí). U `'next'` sáhne po `order.next.*` id, jinak beze
   změny. Nové `orderSpeech(items)`, `repeatSpeech(items)` a `askAgainSpeech(items)` berou **pole
   položek**, první položku pole říkají v tvaru `'first'` a každou další v tvaru `'next'`. Nové
   `itemHintSpeech(item)`: u počítání zopakuje zadání (kroužek nad miskou žádnou vlastní větu nemá),
   u perníčku a svíčky vrátí `hintSpeech(cíl)` – ta zůstává jako stavební kámen a nestane se
   mrtvým kódem. `orderPreload()` natáhne pro každou položku tvar `'first'` a pro položky od druhé
   navíc tvar `'next'` (položka může zaznít i sama, až ta druhá skončí).
6. **`count-item.ts`.** Pryč `createIdleWatcher`, `watcher()`, `speakOrder()`, `repeatOrder()`,
   `repeat()` a volba `praise`. `armPraise()` → `armDone()`: čeká přesně jako dosud (`DONE_DELAY_MS`
   = dnešních 900 ms, pacer vyčká doznění „to stačí“), ale jen zavolá `onDone()`. Nově `nudge()`
   (bliknutí koleček), `hint()` (kroužek nad miskou + `pling` + `hinted = true`) a volba
   `onActivity`. **`onActivity()` se volá na každém klepnutí do misky**, tedy i na tom, které
   položku dokončí, i na klepnutí do přiklopené misky (větev `too-many`) – dnes tam `idle.poke()`
   není, protože položka po dokončení svůj hlídač zastavila; teď hlídač patří objednávce a druhá
   položka může být pořád rozehraná.
7. **`choice-item.ts`.** Totéž: pryč watcher, `speakOrder()`, `repeat()` a `praise`. `nudge()`
   zhoupne police (dnešní `bobOffer()`), `hint()` rozsvítí správný kus bez poskočení (dnešní
   `reveal(false)`) – obojí **beze slova**, větu říká scéna. `onActivity()` na každém klepnutí do
   nabídky, ať je správné nebo ne.
8. **`index.ts`.** Scéna dostane celý mechanismus koordinace, hned v obecné podobě – s jednou
   položkou se chová přesně jako dnešek:
   - `const done = new Set<number>()` – indexy hotových položek v poli `order.items`;
   - `openItems()` – položky, které v `done` nejsou, v pořadí objednávky;
   - `itemDone(item)` – `done.add(order.items.indexOf(item))`, `bubble.tick(index)`; když je hotové
     všechno → `idle.stop()` a `pacer.after(FINALE_DELAY_MS, finale.run)`; jinak
     `pacer.after(REMAINING_DELAY_MS, () => voice.say(repeatSpeech(openItems())))` a `idle.poke()`;
   - `startFinale()` už bubliny neodškrtává (dělá to `itemDone`), `startOrder()` dělá `done.clear()`;
   - nový `createIdleWatcher` na každou objednávku (`stop()` je definitivní);
   - start objednávky: `pacer.after(SPEAK_DELAY_MS, () => voice.say(orderSpeech(order.items)))`
     a `idle.poke()`;
   - `onRemind` (15 s): `nudge()` na všech nesplněných položkách + `voice.say(repeatSpeech(open))`;
   - `onHint` (40 s): `hint()` na **první** nesplněné + `voice.say(itemHintSpeech(první))`;
   - klepnutí do bubliny: `pacer.cancel()`, `voice.say(askAgainSpeech(openItems()))` a `idle.poke()`.
     **Zrušení je podstatné:** kdyby dítě kleplo do bubliny do `REMAINING_DELAY_MS` od splnění první
     položky, čekající kratší připomenutí by mu za chvíli utnulo delší větu, o kterou si samo
     řeklo. `pacer.after()` ruší jen předchozí *pacerovou* práci, ne přímé `voice.say()`;
   - `onActivity` z položky: `idle.poke()`;
   - `onDone` položky: `voice.say(praise.next())`, pak `itemDone(item)`.
9. Testy `speech.test.ts` a `docker compose run --rm test`, `check`, `build`.

→ **Commit 2/4.** Jednopoložková objednávka musí znít a chovat se přesně jako dřív.

### Zastávka 3/4 – dvě položky ve scéně

10. **`index.ts`.** `startOrder()` spustí **obě** položky místo dnešního `if/else`:
    `countOrder ? countItem.start(…) : countItem.clear()` a
    `choiceOrder ? choiceItem.start(…) : choiceItem.clear()`. Dosavadní větev „objednávka nemá nic
    hratelného“ (bublina pryč + `console.warn` v DEV) zůstává.
11. **Dev handle** `__kitchen.play(order: Order)` – nastaví `order`, `countOrder`, `choiceOrder`
    a projde stejnou cestou jako `startOrder()`. Dosavadní `letter/digit/count` z něj budou volat
    jednopoložkovou objednávku, takže `devShow()` zmizí.

→ **Commit 3/4.** Ověřit z konzole (viz Ruční ověření); generátor pořád dělá jednopoložkové
objednávky, takže se běžná hra nemění.

### Zastávka 4/4 – generátor

12. **`orders.ts`.** `SINGLE_ITEM_ORDERS = 10`, `MAX_ORDER_ITEMS = 2`, `orderLength(index)`
    a `numbersTurn(index)`. `generateOrder()`:

    ```ts
    const items =
      orderLength(input.index) === 1
        ? [input.index % 2 !== 0 ? numbersItem(rng, input, avoid) : letterItem(rng, input, avoid)]
        : shuffle(rng, [numbersItem(rng, input, avoid), letterItem(rng, input, avoid)]);
    ```

    `numbersItem()` je dnešní volba počítání × číslice, jen podle `numbersTurn(index)`.
13. Komentáře: `counting.ts` (`countItemOf` – objednávka může nést počítání i výběr zároveň),
    `art/layout.ts` (`BUBBLE_MAX_ITEMS` – tři položky přijdou s STEP-22/25), `session.ts`
    (`last` – dvě položky jsou tady, tři přijdou později).
14. Testy `orders.test.ts`, `session.test.ts`; `docs/navrh-hry.md` podle **Změn návrhu**.

→ **Commit 4/4.** Od 11. objednávky hraje kuchyně doopravdy dvě položky.

**Klíčová rozhodnutí**

1. **Co říká scéna a co položka.** Scéna říká všechno, co patří objednávce jako celku: zadání,
   připomenutí po 15 s, nápovědu po 40 s, zopakování po klepnutí do bubliny, pochvalu a věty finále.
   Položka říká jen to, co je odpověď na jedno konkrétní klepnutí: počítání nahlas („Tři.“), „Už máme
   tři jahody, to stačí!“, „To je bé. Hledáme ká.“ Tyhle věty spolu kolidovat nemůžou – dítě klepe
   jedním prstem a každá visí na jeho vlastním klepnutí. Kolidovat můžou právě věty o objednávce,
   a ty mají nově jednoho vlastníka.
2. **Pochvala patří scéně, protože otevírá finále.** Dnes ji říká položka a hned volá `onDone()`.
   Při dvou položkách musí po první pochvale přijít „a tohle ještě zbývá“ a po druhé finále –
   rozhodnutí, které položka nemá z čeho udělat.
3. **Pozice se počítá v promluvě, ne v objednávce.** Tvar „A ještě…“ dostane každá položka kromě
   první **v tom, co se právě říká**. Když zbývá jediná nesplněná položka, mluví se o ní sama, je
   tedy první v promluvě a zazní jako „Prosím…“ – i když v objednávce byla druhá. Díky tomu
   nepotřebuje krok žádné další tvary a nikdy nezazní osamocené „A ještě…“.
4. **Střídání počítání a číslice se počítá z indexu, ne z uloženého stavu.** Do desáté objednávky má
   číselnou položku každá lichá (`ceil(index/2)`), od jedenácté každá (`index − 5`). Devátá je tah 5
   (počítání), jedenáctá tah 6 (číslice), dvanáctá tah 7 (počítání) – žádné dvě stejné za sebou
   (návrh 5.3) a nic se nemusí ukládat. **Save se v tomhle kroku nemění, `SAVE_VERSION` zůstává 1**;
   migrace pořád neexistuje a bump verze by se rovnal smazání pokroku (viz STEP-13).
5. **Pořadí položek se losuje ze `rng`.** `shuffle(rng, [číselná, písmenková])` – pole se vyhodnotí
   zleva doprava, takže číselná položka spotřebuje `rng` vždycky první a seedované sezení se přehraje
   pořád stejně. Rozhodl autor (srpen 2026): pevné pořadí by po čase znělo mechanicky.
6. **Nápověda míří na první nesplněnou položku v pořadí bubliny.** Hlídač se po nápovědě rozjede
   znovu (`idle.ts` po `onHint` plánuje další kolo), takže jakmile dítě první položku splní, další
   nápověda ukáže druhou – cyklení nemusí nikdo psát.
7. **Kolize na dortu nehrozí.** Dvoupoložková objednávka je vždy jedna číselná + jedna písmenková,
   takže se nikdy nepotká ovoce se svíčkou (obojí je číselná dráha). Zbývají dvě kombinace a obě
   sedí: ovoce leží nad horní plochou dortu (`cakeFruitSlots` končí na `cake.y + 22`), svíčka na ní
   stojí (`cakeCandleSlot` končí na `cake.y + 24`) a perníček je opřený zepředu se středem na
   `cake.y + 92`, tedy 44–140 px pod horní hranou boxu. Boxy se nepřekrývají. Třetí položka to
   změní, ta je ale mimo rozsah.
8. **Prázdná promluva je ticho, ne chyba.** `orderSpeech([])` vrátí prázdné pole a `voice.say([])`
   nic nepřehraje – žádná větev nemusí hlídat, jestli ještě něco zbývá. Pozor na přesnost: prázdné
   `say()` **utne, co zrovna běží** (vyprázdní frontu jako každé jiné `say()`), takže se nesmí volat
   ve chvíli, kdy má něco doznít. Ve všech větvích tohohle kroku je to v pořádku – prázdné pole
   vznikne jedině tam, kde je hotová celá objednávka nebo kde objednávka nemá hratelnou položku.
9. **Bublina i preload jsou na dvě položky připravené.** `bubbleSlots()` umí až `BUBBLE_MAX_ITEMS`
   = 3 a dvě obrázková pole (2 × 116 + 12 px) se do 380 px vejdou; `orderPreload()` už dnes prochází
   `order.items` cyklem. Rozvržení se nemění.

**Změny návrhu** (`docs/navrh-hry.md`, aplikovat doslova)

- Kap. **5.3**, za odrážku „**Mix:** …“ přidat odrážku:

  > - **Pořadí položek v objednávce se losuje** – jednou zazní nejdřív ovoce, jindy perníček; plnit
  >   je jde stejně v libovolném pořadí. Druhá položka má **vlastní sadu vět** („Prosím tři jahody.
  >   A ještě perníček s písmenkem ká.“), aby objednávka zněla jako jedna prosba a ne jako dvě
  >   nezávislé. Nic se ani tak nelepí (pravidlo 7): druhá pozice je 62 celých vět v manifestu.
  >   Když položka zazní **sama** – zbývá jediná, nebo se opakuje po splnění té první – použije se
  >   vždycky tvar s „Prosím“, takže osamocené „A ještě…“ nikdy nezazní.

- Kap. **5.5**, za odrážku „**Nečinnost 40 s:** …“ přidat odrážku:

  > - **Když zbývají dvě položky:** připomenutí po 15 s zopakuje zadání obou, nápověda po 40 s
  >   rozsvítí **první nesplněnou** v pořadí bubliny. Hlídač se pak rozjede znovu, takže na druhou
  >   dojde, jakmile je první hotová. Po splnění první z dvou položek přijde normální pochvala
  >   a hned za ní zopakování té zbývající – dítě tak ví, že objednávka ještě neskončila.

## Kontrakt

```ts
// src/data/lines.cs.ts – druhá a další položka objednávky („A ještě…“)
export function orderNextCountLine(amount: number, fruit: FruitKind): string; // order.next.count.3.strawberry
export function orderNextDigitLine(value: number): string; //                    order.next.digit.4
export function orderNextLetterLine(letter: Letter): string; //                  order.next.letter.k
```

```ts
// src/game/orders.ts
/** Návrh 5.3: prvních deset objednávek nese jednu položku, pak dvě. Tři přijdou s Č3/P3. */
export const SINGLE_ITEM_ORDERS = 10;
export const MAX_ORDER_ITEMS = 2;

/** Kolik položek nese objednávka na pozici `index` (1-based). */
export function orderLength(index: number): number;

/**
 * Kolikátý tah číselné dráhy tahle objednávka je: lichý tah = počítání, sudý = číslice.
 * `index <= SINGLE_ITEM_ORDERS ? Math.ceil(index / 2) : index - SINGLE_ITEM_ORDERS / 2`
 * Do desáté má číselnou položku každá lichá objednávka, od jedenácté každá.
 * Příklady: 1→1, 3→2, 9→5, 11→6, 12→7, 13→8.
 */
export function numbersTurn(index: number): number;

/** Beze změny signatury; nově může vrátit dvě položky. */
export function generateOrder(input: OrderInput): Order;
```

```ts
// src/game/speech.ts
/** Kde ve vyslovené promluvě položka stojí – ne kde stojí v objednávce (viz Klíčová rozhodnutí 3). */
export type ItemPosition = 'first' | 'next';

/** Věty jedné položky: písmeno má dvě (zadání a slovo), zbytek jednu. Dřívější orderSpeech(). */
export function itemSpeech(item: OrderItem, position?: ItemPosition): readonly string[];

/** Celé zadání jako jedna promluva: první položka „Prosím…“, každá další „A ještě…“. */
export function orderSpeech(items: readonly OrderItem[]): readonly string[];

/** Připomenutí po 15 s: první věta každé předané položky, bez „Ká jako kočka.“ */
export function repeatSpeech(items: readonly OrderItem[]): readonly string[];

/** Klepnutí do bubliny: celé věty každé předané položky, i se slovem. */
export function askAgainSpeech(items: readonly OrderItem[]): readonly string[];

/** Nápověda po 40 s k jedné položce: u výběru „Ká je tady.“, u počítání zopakování zadání. */
export function itemHintSpeech(item: OrderItem): readonly string[];
```

```ts
// src/scenes/kitchen/count-item.ts
export interface CountItemHandle {
  start(amount: number, kind: FruitKind): void; // už neříká zadání
  clear(): void;
  layout(layout: KitchenLayout): void;
  state(): CountingState | null;
  outcome(): ItemOutcome | null;
  plate(): readonly HTMLElement[];
  /** 15 s: kolečka nad dortem bliknou. Beze slova – větu říká scéna. */
  nudge(): void;
  /** 40 s: kroužek nad miskou a `pling`; položka si to zapamatuje jako 'hinted'. */
  hint(): void;
  destroy(): void;
}

export function createCountItem(options: {
  readonly root: HTMLElement;
  readonly bowl: HTMLElement;
  readonly sfx: SfxPlayer;
  readonly voice: VoicePlayer;
  /** Každé klepnutí do misky – i to poslední a i to do přiklopené. Scéna vynuluje hlídač. */
  readonly onActivity: () => void;
  /** Dort je hotový a „to stačí“ doznělo; pochvalu i finále řídí scéna. */
  readonly onDone: () => void;
}): CountItemHandle;
```

> **Pozor:** tenhle blok je stav před implementací. Skutečná signatura je jiná – jedna police na
> instanci (`kind` + `shelf`) a dvě instance ve scéně. Důvod je v **Výsledku implementace**,
> odchylka 1.

```ts
// src/scenes/kitchen/choice-item.ts
export interface ChoiceItemHandle {
  start(item: ChoiceItem): void; // už neříká zadání
  clear(): void;
  layout(layout: KitchenLayout): void;
  state(): ChoiceState | null;
  outcome(): ItemOutcome | null;
  plate(): readonly HTMLElement[];
  /** 15 s: nabídka na polici se zhoupne. Beze slova. */
  nudge(): void;
  /** 40 s: správný kus se rozsvítí (bez poskočení). Beze slova. */
  hint(): void;
  destroy(): void;
}

export function createChoiceItem(options: {
  readonly root: HTMLElement;
  readonly shelves: { readonly digits: HTMLElement; readonly letters: HTMLElement };
  readonly decoration: () => { readonly digits: readonly string[]; readonly letters: readonly string[] };
  readonly sfx: SfxPlayer;
  readonly voice: VoicePlayer;
  /** Každé klepnutí do nabídky, správné i špatné. */
  readonly onActivity: () => void;
  readonly onDone: () => void;
}): ChoiceItemHandle;
```

```ts
// src/scenes/kitchen/index.ts – konstanty a DEV handle
/** Prodleva před zadáním, aby věta nezačala přes prolnutí scény (dnešní hodnota z položek). */
const SPEAK_DELAY_MS = 350;
/**
 * Od pochvaly za splněnou položku k zopakování té zbývající. Pacer navíc vyčká doznění pochvaly,
 * takže na přesném čísle nezáleží funkčně – jen zvukově: o něco delší nádech než u finále, aby
 * pochvala a nová prosba nesplynuly v jednu větu. Finále si vystačí se 400 ms, protože po něm
 * následuje obrázek, ne další pokyn.
 */
const REMAINING_DELAY_MS = 500;
/** Od pochvaly za poslední položku ke startu finále (beze změny). */
const FINALE_DELAY_MS = 400;

interface KitchenDevHandle {
  /** Přehraje libovolnou objednávku, i dvoupoložkovou, ať save říká cokoli. */
  play(order: Order): void;
  // …letter, digit, count, clear, ring, customer, finish, stars, state, choice, layout beze změny
}
```

**Příklad.** Objednávka na pozici 11 pro save s `numbers.active = ['1'…'5']`
a `letters.active = ['O','S','T','A']`:

```ts
generateOrder({ settings: EMPTY_SETTINGS, tracks, index: 11, rng: createRng(7) });
// →
{
  index: 11,
  items: [
    { type: 'letter', letter: 'S', word: 'slon', choices: ['O', 'S', 'T'] },
    { type: 'digit', value: 4, choices: [4, 2, 5, 1] },
  ],
}

orderSpeech(order.items);
// → ['order.letter.s', 'letter.word.s.slon', 'order.next.digit.4']
//   „Prosím perníček s písmenkem es.“ „Es jako slon.“ „A ještě svíčku s číslem čtyři.“

repeatSpeech([order.items[1]]);
// → ['order.digit.4']        zbývá už jen svíčka, mluví se o ní sama → tvar „Prosím…“

itemHintSpeech(order.items[0]);
// → ['hint.letter.s']        „Es je tady!“
```

Konkrétní písmeno, číslice i pořadí položek závisí na seedu – testy kontrolují **tvar** (délka,
po jedné položce z každé dráhy, střídání typů), ne přesné hodnoty.

## Akceptační kritéria

**Manifest a hlas**

- KDYŽ se manifest sestaví, PAK má 316 hlášek: 254 dosavadních beze změny plus 62 nových
  `order.next.*` (30 počítacích, 10 číslicových, 22 písmenkových), žádné id dvakrát.
- KDYŽ hra požádá o kterékoli `order.next.*` id, které umí složit, PAK existuje v manifestu
  i jako soubor v `public/audio/voice/<slug>/` (test manifestu + `--dry-run` generátoru hlásí
  nulu k dogenerování).
- KDYŽ se spustí `docker compose run --rm voice`, PAK se vyrobí jen nové hlášky; klíč zůstává
  mimo repozitář a v `git status` po commitu nefiguruje.

**Generátor**

- KDYŽ `index` ≤ 10, PAK má objednávka právě jednu položku a dráhy se střídají jako dosud (lichá
  číselná, sudá písmenková) – dnešní testy STEP-03/11 zůstávají zelené beze změny.
- KDYŽ `index` ≥ 11, PAK má objednávka právě dvě položky, z toho **právě jednu** z číselné dráhy
  (`count` nebo `digit`) a **právě jednu** písmenkovou.
- KDYŽ jdou objednávky 9, 11, 12, 13 za sebou, PAK jsou jejich číselné položky `count`, `digit`,
  `count`, `digit` – nikdy dvě stejné za sebou.
- KDYŽ se generuje se stejným seedem a stejným vstupem, PAK vyjde dvakrát tatáž objednávka včetně
  pořadí položek; KDYŽ se seed mění, PAK se napříč seedy vyskytnou obě pořadí (číselná první
  i písmenková první).
- KDYŽ má písmenková dráha jediný aktivní prvek, PAK objednávka pořád vznikne (kratší nabídka na
  polici, žádná výjimka) – pravidlo 2.
- KDYŽ je čerstvě zavedený prvek osmička a číselná položka objednávky je počítání, PAK se osmička
  nepoužije a čeká na objednávku se svíčkou (chování z STEP-11 zůstává).

**Promluva**

- KDYŽ má objednávka dvě položky, PAK je vypravěč řekne jako **jedno** `voice.say()`: první ve tvaru
  „Prosím…“, druhá ve tvaru „A ještě…“, žádná se neutne.
- KDYŽ zbývá jediná nesplněná položka, PAK zazní ve tvaru „Prosím…“ – i když byla v objednávce
  druhá; osamocené „A ještě…“ nezazní nikdy.
- KDYŽ dítě klepne do bubliny a jedna položka je hotová, PAK zazní celé věty **jen** té nesplněné
  (u písmenka i „Ká jako kočka.“).
- KDYŽ dítě klepne do bubliny hned po splnění první položky (dřív než doběhne `REMAINING_DELAY_MS`),
  PAK zazní celá věta, o kterou si řeklo, a čekající kratší připomenutí ji **neutne**.
- KDYŽ uplyne 15 s nečinnosti a nesplněné jsou obě položky, PAK zazní první věta obou a obě položky
  dají vizuální signál (kolečka bliknou, police se zhoupne).
- KDYŽ uplyne 40 s nečinnosti a nesplněné jsou obě, PAK se rozsvítí cíl **první** nesplněné položky
  v pořadí bubliny a zazní jen její nápověda.
- KDYŽ nezbývá žádná nesplněná položka, PAK je promluva prázdná a nic se nepřehraje (žádná výjimka).

**Scéna**

- KDYŽ objednávka nese počítání i výběr, PAK je miska i police aktivní **zároveň** a dítě je může
  splnit v libovolném pořadí.
- KDYŽ dítě splní jednu ze dvou položek, PAK se odškrtne **jen její** políčko v bublině, zazní
  pochvala a hned za ní zopakování zbývající položky; finále nenaskočí.
- KDYŽ dítě splní obě položky, PAK naskočí finále, dortík odejde se vším, co na něm leží (ovoce
  i perníčkem), a přiletí jedna hvězdička.
- KDYŽ je objednávka hotová, PAK se zapíše skóre **oběma** prvkům (číselnému i písmenkovému) podle
  toho, jak která položka dopadla – i když jedna byla na první pokus a druhá s chybou.
- KDYŽ dítě po dosažení počtu klepne na přiklopenou misku, zatímco druhá položka ještě běží, PAK se
  víčko zahoupá, zazní „Už máme tři jahody, to stačí!“, hlídač nečinnosti se vynuluje (klepnutí je
  aktivita) a přepočítání se započítá jako chyba číselného prvku.
- KDYŽ scéna odchází (`destroy`) nebo se objednávka ruší z konzole (`__kitchen.clear()`), PAK se
  zastaví hlídač nečinnosti i pacer a žádná věta nedomluví přes další scénu.
- KDYŽ objednávka nenese ani jednu hratelnou položku (jen z konzole), PAK se bublina schová, kuchyně
  zůstane statická a v DEV se objeví dosavadní `console.warn` – nic nespadne.

**Pravidla**

- KDYŽ se cokoli z kroku nasadí, PAK v UI nepřibyl žádný text (pravidlo 1), žádný cíl není menší než
  88 px (pravidlo 3), `SAVE_VERSION` je pořád 1 (pravidlo 4), nepřibyl žádný běhový požadavek na síť
  (pravidlo 5) a každá nová věta je celá věta s id v manifestu, nic se neskládá z kousků (pravidlo 7).

## Testy

- **Unit (Vitest), `src/game/orders.test.ts`:** délka objednávky na indexech 1, 2, 10, 11, 12;
  skladba „právě jedna z každé dráhy“ pro indexy 11–20; `numbersTurn` na 1, 3, 9, 11, 12, 13
  a pokračující střídání počítání/číslice přes hranici desáté objednávky; obě pořadí položek napříč
  seedy a shodný výsledek pro stejný seed; dvoupoložková objednávka s jednoprvkovou písmenkovou
  dráhou; čekající zavedený prvek se v dvojici chová stejně jako dřív.
- **Unit, `src/game/speech.test.ts`:** `itemSpeech(item, 'next')` sáhne po `order.next.*` a věta se
  slovem zůstává stejná; `orderSpeech([a, b])` = `itemSpeech(a, 'first')` + `itemSpeech(b, 'next')`;
  jednoprvkové pole vždycky mluví v tvaru `'first'`; `repeatSpeech` dá právě jednu větu na položku;
  `askAgainSpeech` vrátí i větu se slovem; prázdné pole → prázdný výsledek; `itemHintSpeech`
  u počítání zopakuje zadání a u výběru vrátí `hint.*`; `orderPreload()` dvoupoložkové objednávky
  obsahuje oba tvary druhé položky a nic dvakrát; **každé** `order.next.*` id, které jde složit,
  je v manifestu (22 písmen, 10 číslic, 10 počtů × 3 druhy ovoce).
- **Unit, `src/game/session.test.ts`:** od 11. objednávky dostane `avoid` prvky obou drah a další
  objednávka je nezopakuje; seedované sezení přehraje deset objednávek stejně; v uloženém JSON
  nepřibylo žádné pole.
- Scéna se neunit-testuje (DOM) – kryje ji ruční ověření.
- Spuštění: `docker compose run --rm test`, dál `docker compose run --rm check` a `build`.

## Ruční ověření

Dev server běží na `http://localhost:5173/mlsna-abeceda/`. Všechno projít **na tabletu na šířku**
(např. 1180×900) **a v rozměru mobilu na šířku** (844×390).

**Po zastávce 1/4 (klipy)**

- [ ] `docker compose run --rm voice --dry-run` po vygenerování hlásí **0** hlášek k vyrobení.
- [ ] Poslechnout aspoň šest nových klipů, po dvou od každého typu (např.
      `order.next.count.1.strawberry`, `order.next.count.5.cherry`, `order.next.digit.4`,
      `order.next.digit.10`, `order.next.letter.k`, `order.next.letter.s`) – česky správně
      skloňované, stejný hlas a stejná hlasitost jako stávající zadání.
- [ ] `git status` po commitu: žádný `elevenlabs.env`, žádný klíč v diffu.

**Po zastávce 2/4 (nic se nemá změnit)**

- [ ] Zazvonit, přijde zákazník: zadání zazní jednou, celé, se stejnou prodlevou jako dřív, ve
      tvaru „Prosím…“.
- [ ] Klepnout do bubliny: zazní celé zadání i s „Ká jako kočka.“, hlídač se vynuluje.
- [ ] Nechat 15 s bez klepnutí: kolečka bliknou (počítání) / police se zhoupne (perníček)
      a zazní první věta zadání.
- [ ] Nechat dalších 25 s (celkem 40 s): rozsvítí se cíl a zazní nápověda; hra nic neudělá za dítě.
- [ ] Splnit položku: pochvala zazní **jednou**, pak finále, hvězdička, zvoneček.
- [ ] Dvakrát klepnout vedle na polici: „To je bé.“ → „Hledáme ká.“, po druhé chybě se cíl rozsvítí
      a zazní „Ká je tady!“ – žádná věta se neutne.
- [ ] Klepnout na přiklopenou misku: víčko se zahoupá a zazní „to stačí“; pochvala přijde až po ní.

**Po zastávce 3/4 (dvoupoložková objednávka z konzole)**

- [ ] V konzoli: `__kitchen.play({ index: 11, items: [__game.order(1).items[0], __game.order(2).items[0]] })`
      – v bublině jsou **dva** obrázky (ovoce a prázdný perníček) a zazní „Prosím … A ještě …“.
- [ ] Splnit **napřed perníček**: odškrtne se jen jeho políčko, zazní pochvala a hned zopakování
      počítání ve tvaru „Prosím…“; finále nenaskočí.
- [ ] Dopočítat ovoce: odškrtne se druhé políčko, pochvala, finále, dortík odchází **s ovocem
      i perníčkem**, přiletí jedna hvězdička.
- [ ] Totéž v opačném pořadí (napřed ovoce, pak perníček).
- [ ] Zopakovat s číslicí místo perníčku (`__game.order(3).items[0]`): svíčka stojí na dortu, ovoce
      leží nad ním, nic se nepřekrývá.
- [ ] **Přepočítání při rozehrané druhé položce:** dopočítat ovoce, perníček nechat, klepnout znovu
      na přiklopenou misku – zazní „to stačí“, druhá položka běží dál a hlídač nečinnosti se
      vynuluje (dalších 15 s se počítá od tohohle klepnutí). Po dokončení objednávky má číselný
      prvek v `__save.read().tracks.numbers.scores` o bod míň.
- [ ] **Odchod uprostřed:** rozehrát dvoupoložkovou objednávku, jednu položku splnit a hned
      `__kitchen.clear()` (nebo `__scenes.go('title')`) – nic nedomluví, žádná pochvala ani
      zopakování nepřijde se zpožděním do další scény.
- [ ] Nechat u dvoupoložkové objednávky 15 s: zazní obě věty („Prosím…“ + „A ještě…“), blikne
      i zhoupne se.
- [ ] Nechat 40 s: rozsvítí se cíl **jen první** nesplněné položky. Splnit ji a počkat dalších 40 s:
      nápověda ukáže druhou.
- [ ] Klepnout do bubliny, když je jedna položka hotová: zazní jen ta zbývající, ve tvaru „Prosím…“.
- [ ] Splnit první položku a klepnout do bubliny **okamžitě** (během pochvaly): věta doběhne celá,
      nic ji po půl vteřině neutne.

**Po zastávce 4/4 (opravdová hra)**

- [ ] V konzoli přeskočit na jedenáctou objednávku a **obnovit stránku** (session čte save při
      startu):
      `const s = __save.read(); __save.write({ ...s, progress: { ...s.progress, ordersCompleted: 10 } })`
- [ ] Zazvonit: objednávka má dvě položky, po jedné z každé dráhy.
- [ ] Odehrát tři objednávky za sebou: číselná položka se střídá (číslice → počítání → číslice),
      pořadí položek v bublině není pořád stejné, nic se neopakuje dvakrát za sebou.
- [ ] `__save.read().tracks` po objednávce: skóre přibylo **oběma** prvkům.
- [ ] Zkontrolovat `__save.raw()`: `version` je pořád `1` a nepřibylo žádné pole.
- [ ] Na mobilu (844×390): dvě obrázková pole se do bubliny vejdou, nic nepřetéká, miska i police
      jsou na dotek pohodlné.

## DoD

- [x] Všechna akceptační kritéria splněna
- [x] Testy a build zelené
- [x] Nové klipy vygenerované, znormalizované a committnuté; klíč nikde v repu
- [x] Ruční ověření projito – co ověřené není, je vypsané ve **Výsledku implementace**
- [x] `docs/navrh-hry.md` doplněn podle **Změn návrhu**
- [x] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

Hotovo v jednom průchodu bez zastávek (pokyn autora, 27. 8. 2026): čtyři zastávky z plánu se
udělaly najednou a půjdou do **jednoho commitu**.

### Co vzniklo

| Soubor                                | Co se stalo                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/data/lines.cs.ts`                | 3 helpery `orderNext*Line()` + 62 nových vět „A ještě…“; manifest 254 → **316**    |
| `public/audio/voice/cook/*.mp3`       | 62 nových klipů (1 594 znaků); `public/audio/voice/index.json` doplněn             |
| `src/game/speech.ts`                  | `ItemPosition`, `itemSpeech()`, `orderSpeech/repeatSpeech/askAgainSpeech` nad polem, `itemHintSpeech()`, `orderPreload()` natahuje oba tvary |
| `src/game/orders.ts`                  | `SINGLE_ITEM_ORDERS`, `MAX_ORDER_ITEMS`, `orderLength()`, `numbersTurn()`, dvě položky od 11. objednávky |
| `src/game/choice.ts`                  | `choiceItemOf(order, type?)` – volitelný filtr na druh police                       |
| `src/scenes/kitchen/count-item.ts`    | bez vypravěče a bez hlídače; `nudge()`, `hint()`, `onActivity`, `armDone()`         |
| `src/scenes/kitchen/choice-item.ts`   | přepsán: **jedna police na instanci** (`kind`, `shelf`), bez vypravěče a hlídače    |
| `src/scenes/kitchen/index.ts`         | jeden hlas a jeden hlídač pro objednávku, tři handly položek, `done`/`openItems()`/`itemDone()`, `__kitchen.play()` |
| `src/game/{session,counting}.ts`, `src/art/layout.ts` | jen komentáře                                              |
| testy                                 | `orders`, `speech`, `session`, `choice`, `lines.cs` – **532 → 555** testů           |
| `docs/navrh-hry.md`                   | kap. 5.3 a 5.5 podle **Změn návrhu**                                               |

### Odchylky od plánu

1. **`createChoiceItem` dostává jednu polici, ne obě – a kuchyně staví dvě instance.** Plán
   (a obě revize) počítal s tím, že scéna má jeden `choiceItem` a vezme `choiceItemOf(order)`.
   Jenže dvoupoložková objednávka je od 11. často **číslice + písmeno** – hned ta první, index 11,
   vyšla při ověřování jako `letter S` + `digit 2`. Obě jsou „výběr z police“, takže
   `choiceItemOf(order)` by vrátil jen tu první a **druhá položka by nešla splnit** – objednávka
   by se nedala dokončit a finále by nikdy nenaskočilo. Modul proto dostává `kind: 'digit' |
   'letter'`, `shelf: HTMLElement` a `decoration: () => readonly string[]` **jen pro tu svou
   polici** (jinak by si `clear()` jedné instance přepsal nabídku té druhé); scéna drží
   `countItem`, `digitItem` a `letterItem` a mapuje položku na handle přes `handleOf()`.
   Mění to Kontrakt, takže by se podle `/implement-step` mělo napřed zeptat; autor zadal „udělej
   to celé najednou bez zastávek“ a jiné rozumné řešení není (pevné pořadí „vždycky počítání +
   písmeno“ by rozbilo střídání počítání/číslic z akceptačních kritérií). **Hlásím to jako
   rozhodnutí k revizi.**
2. **`choiceItemOf(order, type?)`** – nový volitelný parametr místo hledání v scéně, aby zůstala
   logika bez DOM a šla otestovat. Kryto testem v `choice.test.ts`.
3. **`__kitchen.finish()` si bublinu odškrtává sám.** Plán říká, že `startFinale()` už neodškrtává
   (dělá to `itemDone`); aby se DEV handle choval navenek jako dřív, ťukne políčka před voláním.
4. **`startOrder()` navíc dělá `pacer.cancel()`** (plán zmiňoval jen nový hlídač) – jinak by
   zbytek předchozí objednávky mohl promluvit do nové.
5. **`__kitchen.choice()`** vrací stav perníčku, a když žádný neběží, svíčky – dřív byl jen jeden.

### Jak to bylo ověřeno

`docker compose run --rm test` (**555 testů**, +23), `check` (tsc + prettier) a `build` – zelené.

V prohlížeči (dev server, tablet na šířku ~1348×768 logických, DEV konzole) – ověřeno **odposlechem
id hlášek**: do `voice.say()` se na dobu ověřování dočasně přidal `console.info('[say] …')`
a po ověření se **zase odstranil** (v repu po něm nic nezůstalo):

- **Objednávka 11 (`letter S` + `digit 2`):** v bublině dva obrázky, **obě police aktivní zároveň**,
  zadání jako **jedna** promluva `order.letter.s | letter.word.s.slon | order.next.digit.2`.
- **Připomenutí po 15 s** u dvou nesplněných: `order.letter.s | order.next.digit.2` (bez slova).
- **Nápověda po 40 s** u dvou nesplněných: rozsvítila se **jen svíčka „2“** (první nesplněná
  v pořadí bubliny) a zaznělo jen `hint.digit.2`; po dalších 20 s hlídač znovu připomněl obě.
- **Po splnění první položky:** odškrtlo se jen její políčko, `praise…` a hned `order.letter.s`
  – tedy tvar **„Prosím…“**, ne „A ještě…“. Osamocené „A ještě…“ nezaznělo ani jednou.
- **Klepnutí do bubliny se zbývající položkou:** `order.letter.s | letter.word.s.slon`.
- **Časovací závod:** klepnutí do bubliny 700 ms po splnění první položky – zazněla celá věta
  a čekající kratší připomenutí ji **neutlo** (v logu po ní už nic nepřišlo).
- **Obě položky hotové:** finále, dortík odešel se svíčkou i perníčkem, jedna hvězdička; svíčka
  stojí nahoře, perníček zepředu – **nepřekrývají se**.
- **Skóre:** po objednávce 11 přibyl bod číslici `2` (na první pokus) a písmenko `S` zůstalo na
  svém (chyba) – zapsalo se **oběma** drahám.
- **Objednávka 12 (`count 1` + `letter O`):** `order.count.1.strawberry | order.next.letter.o |
  letter.word.o.oko`; miska i police aktivní zároveň.
- **Přepočítání při rozehrané druhé položce:** klepnutí do přiklopené misky → „to stačí“, druhá
  položka běžela dál a **hlídač se vynuloval** (další připomenutí přišlo přesně 15 s od toho
  klepnutí, ne dřív) – to je nové `onActivity`. Číslo `1` za objednávku bod nedostalo.
- **Odchod uprostřed:** po splnění první položky `__kitchen.clear()` – dalších 6 s **naprosté
  ticho**, `__voice.speaking === false`.
- **Objednávka bez hratelné položky** (`__kitchen.play({ items: [] })`): bublina schovaná,
  `console.warn` z DEV, nic nespadlo.
- **Jednopoložková objednávka se nezměnila** (zastávka 2 měla být neviditelná): nová hra,
  `order.count.5.blueberry` → klepnutí do bubliny tatáž věta → `count.1…count.5` → `praise` →
  `finish` → klepnutí do přiklopené misky `count.enough.5.blueberry` → `star`; skóre `5` zůstalo
  na nule kvůli přepočítání. Přesně jako před krokem.
- **DEV handly** `__kitchen.letter/digit/count` po přepisu fungují (police se přepnou na výzdobu,
  bublina odpovídá) a `resize` se dvěma živými položkami nic nerozbil. Žádná chyba v konzoli.
- **Generátor:** `voice --dry-run` po vygenerování hlásí `0 new · 0 changed · 316 up to date ·
  0 orphan`; `public/audio/voice/cook/` má 316 souborů. Klíč zůstal v
  `~/.config/mlsna-abeceda/elevenlabs.env`, v repu ani v diffu není.

### Co ověřené NENÍ

- **Poslech klipů.** Nová sada se nedá ověřit sluchem z téhle relace; ověřilo se jen to, že
  všechna id existují v manifestu i jako soubory, že text v `index.json` sedí na manifest a že se
  přehrávají bez `[voice] missing clip`. **Skloňování a intonaci 62 nových vět je potřeba
  poslechnout ručně** – hlavně `order.next.count.1.*` („A ještě jednu jahodu.“) a hraniční počty.
- **Mobil 844×390 jako opravdový viewport.** Okno prohlížeče se v téhle relaci nepodařilo na tu
  velikost zmenšit. Ověřeno místo toho výpočtem: `bubbleSlots(bubble, 2)` vrací pro **jakoukoli**
  šířku scény (1024 i 1366) tytéž dvě políčka `x = 208` a `x = 336` (116 px široká) v bublině
  `x = 60, šířka 480` – dvě položky se vejdou vždycky. Vizuálně zkontrolováno na scéně široké
  ~1348 logických px, což je 18 px od mobilního maxima.
- **Deset objednávek za sebou v opravdové hře.** Odehrály se objednávky 11–15 (a jednopoložková
  na nové hře); zbytek kryjí testy sezení.

### Náměty mimo rozsah

- `bubble.tick(index)` se nedá vzít zpět; až bude potřeba položku „rozdělat“ (návrat do
  rozehrané objednávky po reloadu, STEP-13), bude se hodit `untick`.
- `KitchenDevHandle.choice()` teď vrací jen jednu ze dvou nabídek. Až budou tři položky, bude
  čitelnější `choices()` vracející pole.
- Perníček a svíčka se na dortu nepotkají jen proto, že dvoupoložková objednávka je vždycky jedna
  položka z každé dráhy. U **tří** položek (STEP-22/25) to přestane platit a rozvržení dortu se
  bude muset změnit – je to už zapsané v poznámkách `docs/plan.md`.
