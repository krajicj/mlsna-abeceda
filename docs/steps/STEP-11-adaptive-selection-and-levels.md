# STEP-11 · Adaptivní výběr, zavádění prvků a postup stupňů

Status: done
Milník: M2 · Po: STEP-09 · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 5.2, 5.4

## Shrnutí

Hra dnes umí zapsat skóre zvládnutí, ale nic z něj nevyvozuje: `maybeIntroduce`,
`canAdvanceLevel` a `advanceLevel` v `mastery.ts` existují od STEP-03 a **nikdo je nevolá**.
Dcera tak může umět všechna čtyři písmena P1 na pět bodů a hra jí je bude nabízet dokola.
Krok tuhle smyčku zavírá: po dokončené objednávce se dráha buď rozroste o jeden nový prvek,
nebo (když je celý pytlík zvládnutý) postoupí o stupeň výš. Výběr cíle přestává být rovnoměrný —
prvky se skóre pod 3 mají trojnásobnou váhu a **čerstvě zavedený prvek přijde hned v další
objednávce své dráhy**. Všechno je čistá logika v `src/game/`, scéna se nemění ani o pixel.
Otevírá to STEP-12 (dvoupoložková objednávka), který už do scény sáhne.

## Rozsah

**V rozsahu**

- Vážený výběr cíle (`pickWeighted` v `rng.ts`, `weightOf` v `mastery.ts`) podle návrhu 5.4.
- Zavádění nových prvků a postup stupňů po dokončené objednávce (`progress.ts`).
- Strop stupňů: dráhy se automaticky nedostanou dál, než co kuchyně opravdu umí zahrát
  (číslice Č2, písmena P2). Zvedne ho STEP-22 („kolik je“) a STEP-25 (slovo se vzorem).
- Č1 → Č2: na polici se objeví číslice 6–10. **Počítání ovoce zůstává do pěti**
  (`MAX_CAKE_FRUIT = 5` — na dort se šestý kousek nevejde); generátor proto vybírá počet
  jen z prvků ≤ `MAX_COUNT`.
- P1 → P2: aktivní sada roste ze dvou písmen na čtyři, pak stupeň výš na osm.
- Nová hra startuje se **dvěma** aktivními písmeny místo čtyř (`LEVEL1_INITIAL_LETTERS`).
- Čtyři upřesnění v `docs/navrh-hry.md` kap. 5.2 a 5.4 — přesné znění je níž v „Změny návrhu“.
- Srovnání zastaralých odkazů na čísla kroků v komentářích po přečíslování roadmapy —
  úplný seznam je níž v „Přečíslování odkazů“.

**Mimo rozsah**

- **Délka objednávky** (2 položky) a míchání drah v jedné objednávce — to je STEP-12.
- Počítání nad pět, „kolik je“, dva druhy ovoce (Č2 v plném rozsahu) — STEP-22.
- Slovo se vzorem, P3 a dál — STEP-25.
- Jakákoli změna scény, artu, hlášek nebo zvuků. Manifest hlášek zůstává na 254 položkách:
  číslice 1–10 i všech 22 písmen v něm už jsou.
- Změna formátu save (`SAVE_VERSION` zůstává 1). Nová hra vypadá jinak, rozehraná se
  nedotkneme — `repairTrack` menší i větší aktivní sadu zachová.
- Oslava při zavedení nového prvku nebo postupu stupně (zvuk, konfety). Zavedení je tiché;
  jestli si zaslouží pointu, ukáže se až u dcery.

## Implementace

**Soubory**

```
src/game/rng.ts            (změna) + pickWeighted()
src/game/rng.test.ts       (změna) testy vážené volby
src/game/mastery.ts        (změna) + WEAK_WEIGHT, weightOf()
src/game/mastery.test.ts   (změna)
src/game/curriculum.ts     (změna) + LEVEL1_INITIAL_LETTERS, MAX_NUMBER_LEVEL, MAX_LETTER_LEVEL
src/game/curriculum.test.ts(změna)
src/game/orders.ts         (změna) vážený pickTarget, introduced, strop počítání
src/game/orders.test.ts    (změna)
src/game/progress.ts       (změna) růst drah v completeOrder(), + introducedElement()
src/game/progress.test.ts  (změna) — dnešní test „nechává stupně na pokoji“ se přepíše
src/game/save.ts           (změna) createSave: dvě aktivní písmena
src/game/save.test.ts      (změna)
src/game/session.ts        (změna) drží `pending` prvek do objednávky jeho dráhy
src/game/session.test.ts   (změna)
docs/navrh-hry.md          (změna) kap. 5.2 a 5.4
docs/plan.md               (změna) přečíslování od starého STEP-12 dál
```

**Knihovny** – žádné nové. Runtime závislostí je nula a zůstane nula.

**Kroky**

1. `rng.ts`: `pickWeighted()`. Váhy, které nejsou konečné nebo jsou ≤ 0, se počítají jako 0;
   když jsou všechny nulové, spadne to na rovnoměrné `pick()`. Prázdné pole hází `RangeError`
   stejně jako `pick()` — je to chyba volajícího, ne herní stav.
2. `mastery.ts`: `WEAK_WEIGHT = 3` a `weightOf(track, element)` → 1 pro zvládnutý prvek
   (skóre ≥ `MASTERY_KNOWN`), jinak `WEAK_WEIGHT`.
3. `curriculum.ts`: `LEVEL1_INITIAL_LETTERS = 2`, `MAX_NUMBER_LEVEL = 2`, `MAX_LETTER_LEVEL = 2`
   (obojí typu `Level`, s komentářem, který krok je zvedne).
4. `save.ts`: `createTrack(1, letterPool(settings, 1), LEVEL1_INITIAL_LETTERS)`. Číselná dráha
   zůstává celá (1–5 dcera umí, není co dávkovat).
5. `orders.ts`:
   - `pickTarget()` dostane `allow?: (element: string) => boolean` a `introduced: string | null`;
     vybírá váženě přes `pickWeighted`.
   - `countItem()` předá `allow: (e) => Number(e) <= MAX_COUNT`.
   - `OrderInput` dostane volitelné `introduced`.
6. `progress.ts`: po zápisu skóre nechá obě dráhy vyrůst (`growTrack`) a přidá
   `introducedElement(before, after)`.
7. `session.ts`: po `completeOrder()` si zapamatuje zavedený prvek na dráhu; do `generateOrder()`
   ho pošle a **vyhodí ho, teprve až ho objednávka opravdu použije** (číslice 8 se do počítací
   objednávky nevejde, tak počká na tu s číslicí).
8. Testy, `docs/navrh-hry.md`, `docs/plan.md`, srovnání odkazů na čísla kroků v komentářích.

**Klíčová rozhodnutí**

- **Zavedený prvek se nese v paměti session, ne v save.** Návrh 5.4 chce, aby se nový prvek
  ukázal nejpozději do dvou objednávek. Samotná trojnásobná váha to negarantuje (při čtyřech
  zvládnutých a jednom novém je šance 3/7, takže v ~32 % případů to trvá déle). Držet „pending“
  v save by ale znamenalo změnu formátu, a `parseSave()` cizí verzi **zahodí** — dnes žádná
  migrace neexistuje, takže bump `SAVE_VERSION` = smazaný pokrok. Session ho drží v paměti;
  po reloadu se ztratí a platí jen vážený výběr, což je přijatelné (prvků je pár).
- **Růst dráhy patří do `completeOrder()`**, ne do session: je to čistá funkce „hotová
  objednávka → nový save“ a přesně tohle je součást té transformace. Session zůstává jediným
  místem, které sahá na úložiště.
- **Nejdřív stupeň, pak zavádění.** `canAdvanceLevel` je splnitelné jen s celým pytlíkem
  aktivním a zvládnutým; když projde, `advanceLevel` si sám přidá první nový prvek z nového
  pytlíku, takže se `maybeIntroduce` už nevolá (jinak by přiskočily dva najednou).
- **Strop stupňů.** Bez něj by dráha po zvládnutí Č2 postoupila na Č3 („dva druhy ovoce“)
  a generátor by dál dělal totéž — save by tvrdil stupeň, který hra neumí zahrát.
- **`orders.ts` si `MAX_COUNT` bere z `counting.ts`.** Opačný import (`counting.ts` → `orders.ts`)
  je `import type`, a `isolatedModules` ho úplně smaže, takže žádný běhový cyklus nevzniká.
- **Nabídka na polici smí být kratší.** S dvěma aktivními písmeny má `buildChoices` jen jeden
  distraktor a police ponese dva perníčky místo tří. Návrh 5.4 to výslovně dovoluje („radši
  kratší nabídka než žádná objednávka“) a pro dítě, které písmena teprve potkává, je to snazší.
  Distraktory se nikdy neberou mimo aktivní sadu — na polici stojí jen to, co se dcera učí.

```
growTrack(track, poolFor, maxLevel):
    pool = poolFor(track.level)
    if canAdvanceLevel(track, pool):
        if track.level >= maxLevel: return track     # kuchyně další stupeň neumí zahrát
        return advanceLevel(track, poolFor(track.level + 1))
    return maybeIntroduce(track, pool)

pickTarget(rng, track, avoid, allow, introduced):
    candidates = track.active.filter(allow)
    fresh = candidates.filter(e => e not in avoid)   # nic dvakrát za sebou
    pool = fresh nonempty ? fresh : (candidates nonempty ? candidates : track.active)
    if introduced in pool: return introduced          # návrh 5.4, nový prvek jde hned
    return pickWeighted(rng, pool, e => weightOf(track, e))
```

**Změny návrhu** (`docs/navrh-hry.md`) — čtyři úpravy, přesné znění. Zapíše je `/implement-step`
až po schválení kroku: návrh je zdroj pravdy pro mechaniky a nemá tvrdit rozhodnutí, které autor
ještě neodkýval.

1. **Kap. 5.2, pod tabulku „Čísla“** — nový odstavec:
   > **Č2 přijde nadvakrát.** Číslice 6–10 otevře STEP-11, ale **počítání zůstane do pěti**
   > a „kolik je“ počká na STEP-22: na horní plochu dortu se vejde pět kousků ovoce
   > (`MAX_CAKE_FRUIT`) a šestý by neměl kam. Druhá řada na dortu je práce s artem, ne
   > s generátorem, tak jde do vlastního kroku.
2. **Kap. 5.2, pod tabulku „Písmena“** — nový odstavec:
   > „2 distraktory“ u P1 platí pro **plnou** sadu stupně. Nová hra ale startuje jen se dvěma
   > písmeny (STEP-11), takže první nabídky nesou dva perníčky a na tři vyrostou, až se aktivní
   > sada rozroste. Kratší nabídku návrh dovoluje i jinde (kap. 5.4) a pro dítě, které písmena
   > teprve potkává, je snazší.
3. **Kap. 5.4** — odrážku „Nové prvky se zavádějí…“ doplnit o větu:
   > Zavedený prvek je cílem **první další objednávky své dráhy, která ho umí použít** (zavedená
   > osmička počká na objednávku se svíčkou, do počítací se nevejde). Je to přísnější než
   > „nejpozději do dvou objednávek“ a nepotřebuje to nic ukládat — samotná trojnásobná váha
   > garanci nedá (při čtyřech zvládnutých a jednom novém je šance 3/7, tedy ~32 % případů
   > trvá déle než dvě objednávky).
4. **Kap. 5.4** — k odrážce „Postup na další stupeň“ přidat větu:
   > Dráha nikdy nevyleze výš, než co kuchyně opravdu umí zahrát: dnes Č2 a P2. Strop zvedne
   > STEP-22 (čísla) a STEP-25 (písmena). Bez něj by save tvrdil stupeň, jehož obsah generátor
   > neumí složit.

**Přečíslování odkazů.** Rozdělení starého STEP-11 na dva kroky posunulo roadmapu o jedno číslo
od starého STEP-12 dál. Mapování: *delší objednávka* 11 → **12**; *konec sezení / obnova session*
12 → **13**; *obchůdek* 13 → **14**; *rodičovský koutek* 17 → **18**; *hlasový balíček jmen*
18 → **19**; *PWA* 20 → **21**; *„kolik je“ a druhá řada na dortu* 21 → **22**; *slovo bez vzoru
a diakritika* 25 → **26**. Komentáře v kódu, které je potřeba srovnat (ověřeno grepem při
plánování; **pozor, `STEP-11` se v některých z nich mění na `STEP-12`**, protože mířil na delší
objednávku, ne na tenhle krok):

| Soubor a řádek | Dnes | Má být | Proč |
|---|---|---|---|
| `src/main.ts:71` | STEP-17 | STEP-18 | nastavení / rodičovský koutek |
| `src/audio/context.ts:24` | STEP-17 | STEP-18 | hlasitost v rodičovském koutku |
| `src/audio/voice.ts:29` | STEP-17 | STEP-18 | totéž |
| `src/data/lines.cs.ts:35` | STEP-17 | STEP-18 | přepínač rodu |
| `src/scenes/kitchen/index.ts:104` | STEP-17 | STEP-18 | rod z nastavení |
| `src/scenes/kitchen/index.ts:179` | STEP-11 | STEP-12 | delší objednávka |
| `src/art/layout.ts:43` | STEP-11 | STEP-12 | tři obrázky v bublině |
| `src/data/sfx.ts:127` | STEP-11 | STEP-12 | objednávka delší než pět kusů |
| `src/game/session.ts:46` | STEP-11 | STEP-12 | delší objednávky změní `avoid` |
| `src/game/session.ts:28` | STEP-12 | STEP-13 | obnova session po reloadu |
| `src/scenes/kitchen/customer.ts:27` | STEP-12 | STEP-13 | totéž |
| `src/game/counting.ts:8` | STEP-21 | STEP-22 | druhá řada ovoce na dortu |
| `src/game/curriculum.ts:75` | STEP-25 | STEP-26 | diakritika P4 |
| `src/data/curriculum.ts:7` | STEP-25 | STEP-26 | totéž |
| `src/game/curriculum.test.ts:94` | STEP-24 | STEP-26 | **byla to chyba už dřív** – diakritiku P4 dělal starý STEP-25, ne 24 |
| `src/game/curriculum.test.ts:154` | STEP-17 | STEP-19 | **byla to chyba už dřív** – klip se jménem je hlasový balíček (starý STEP-18) |
| `src/game/progress.test.ts:148` | STEP-11 | — | ten test tenhle krok stejně přepisuje |

Odkazy v `docs/steps/STEP-01`…`STEP-10` se **nemění**: jsou to hotové záznamy toho, co se kdy
rozhodlo, ne živé ukazatele.

## Kontrakt

```ts
// src/game/rng.ts
/**
 * One item, chance proportional to `weight`. Weights that are not finite or ≤ 0 count as zero;
 * when every weight is zero it falls back to a uniform `pick`. Empty array throws, like `pick`.
 */
export function pickWeighted<T>(rng: Rng, items: readonly T[], weight: (item: T) => number): T;

// src/game/mastery.ts
/** An element below MASTERY_KNOWN is asked for this many times more often (návrh 5.4). */
export const WEAK_WEIGHT = 3;
/**
 * 1 for a mastered element, WEAK_WEIGHT for everything else. An element outside the active set
 * scores 0 through `scoreOf` and therefore weighs WEAK_WEIGHT – the generator never asks about
 * one, so the value only has to be defined, not meaningful.
 */
export function weightOf(track: TrackState, element: string): number;

// src/game/curriculum.ts
/** A brand new game starts with two letters, not the whole P1 pool (návrh 5.4). */
export const LEVEL1_INITIAL_LETTERS = 2;
/** The highest stage the kitchen can actually play today; STEP-22 raises it. */
export const MAX_NUMBER_LEVEL: Level = 2;
/** The highest stage the kitchen can actually play today; STEP-25 raises it. */
export const MAX_LETTER_LEVEL: Level = 2;

// src/game/progress.ts
/**
 * The single element `after` has and `before` had not – what `completeOrder` just introduced.
 * `null` when nothing was added or when more than one appeared (a repaired save; never guess).
 */
export function introducedElement(before: TrackState, after: TrackState): string | null;

// src/game/orders.ts – OrderInput gains one optional field, everything else stays
export interface OrderInput {
  readonly settings: Settings;
  readonly tracks: { readonly numbers: TrackState; readonly letters: TrackState };
  readonly index: number;
  readonly avoid?: readonly string[];
  readonly avoidFruit?: FruitKind | null;
  /**
   * The element each track has just introduced. It becomes the target of that track's next order
   * (návrh 5.4); an element the item cannot use (an eight for counting) is simply not taken.
   */
  readonly introduced?: {
    readonly numbers?: string | null;
    readonly letters?: string | null;
  };
  readonly rng?: Rng;
}
```

`completeOrder(save, results, today)` si signaturu nechává; mění se jen to, co vrací.

Příklad — poslední neznámé písmeno P1 padne na první pokus:

```ts
const before = {
  version: 1,
  settings: EMPTY_SETTINGS,
  tracks: {
    numbers: createTrack(1, ['1', '2', '3', '4', '5']),
    // O, S, T zvládnutá, A na dvou bodech
    letters: { level: 1, active: ['O', 'S', 'T', 'A'], scores: { O: 5, S: 4, T: 3, A: 2 } },
  },
  progress: { ordersCompleted: 12, stars: 12, lastPlayed: '2026-08-26' },
};

const after = completeOrder(
  before,
  [{ element: 'A', track: 'letters', outcome: 'first-try' }],
  '2026-08-27',
);

after.tracks.letters;
// === { level: 2, active: ['O','S','T','A','M'], scores: { O: 5, S: 4, T: 3, A: 3, M: 0 } }

introducedElement(before.tracks.letters, after.tracks.letters); // 'M'
```

Uvnitř `completeOrder` to proběhne ve dvou fázích, ale ven vypadne jen ta druhá: zápis skóre
posune A z 2 na 3, čímž je **celý pytlík P1** (O, S, T, A) aktivní i zvládnutý — proto se
nezavádí nový prvek do P1, ale rovnou postupuje stupeň. `advanceLevel` si nechá všechna čtyři
písmena i s jejich skóre a přidá první nezavedené z pytlíku P2, tedy M s nulou.

(Pořadí písmen bez vyplněných jmen je `FREQUENT_LETTERS`: O, S, T, A, M, U, D, N…)

## Akceptační kritéria

- KDYŽ dítě dokončí objednávku a v aktivní sadě dráhy zbývá prvek se skóre < `MASTERY_KNOWN`,
  PAK se sada nezvětší ani stupeň nezmění (`maybeIntroduce` nemá zelenou).
- KDYŽ po dokončené objednávce má ≥ 80 % aktivní sady skóre ≥ 3 a v pytlíku stupně zbývá
  nezavedený prvek, PAK se přidá **právě jeden** a jeho skóre je 0.
- KDYŽ je celý pytlík stupně aktivní a zvládnutý a stupeň je pod stropem, PAK dráha postoupí
  o jeden stupeň, zvládnuté prvky si nesou svoje skóre a přibude právě jeden nový prvek s nulou.
- KDYŽ je celý pytlík zvládnutý a dráha už je na stropu (`MAX_NUMBER_LEVEL` / `MAX_LETTER_LEVEL`),
  PAK se dráha nezmění vůbec — žádný postup, žádná výjimka, hra běží dál.
- KDYŽ `completeOrder` zavede nový prvek, PAK ho `introducedElement()` vrátí; KDYŽ nezavede nic
  nebo se (u opraveného save) objeví víc než jeden, PAK vrátí `null`.
- KDYŽ session dostane od `completeOrder` zavedený prvek, PAK je cílem **první další objednávky
  té dráhy**, která ho umí použít; do té doby se drží.
- KDYŽ je zavedená číslice > `MAX_COUNT` a další číselná objednávka je počítací, PAK se počet
  vybere z prvků ≤ `MAX_COUNT` a zavedená číslice čeká na objednávku se svíčkou.
- KDYŽ generátor vybírá cíl a v aktivní sadě jsou zvládnuté i nezvládnuté prvky, PAK nezvládnutý
  vychází v dlouhé sérii přibližně `WEAK_WEIGHT`× častěji než zvládnutý.
- KDYŽ má dráha jediný použitelný prvek a ten je zároveň v `avoid`, PAK ho generátor vybere
  přesto — pravidlo „nic dvakrát za sebou“ ustupuje, hra se nikdy nezasekne (návrh 5.4).
- KDYŽ začne úplně nová hra, PAK jsou v písmenkové dráze aktivní **dvě** písmena a police nese
  dvě možnosti; číselná dráha má aktivních všech pět čísel.
- KDYŽ se načte rozehraný save se čtyřmi aktivními písmeny, PAK zůstanou čtyři — `createSave`
  se na něj nesahá a `SAVE_VERSION` je pořád 1.
- KDYŽ číselná dráha postoupí na Č2, PAK do aktivní sady přibude **jediná** nová číslice
  (šestka); sedmička až desítka se přidávají po jedné dalšími `maybeIntroduce`. Počítání ovoce
  přitom dál nikdy nežádá víc než `MAX_COUNT` kousků.
- KDYŽ je `pickWeighted` zavolán se samými nulovými (nebo `NaN`) vahami, PAK vybere rovnoměrně
  a nikdy nevrátí `undefined`.
- KDYŽ dráha vyroste jakoukoli cestou, PAK její aktivní sada nikdy není prázdná.
- KDYŽ je krok hotový, PAK `docs/navrh-hry.md` obsahuje všechny čtyři úpravy ze „Změn návrhu“
  a v `src/` nezůstane žádný odkaz na číslo kroku z tabulky „Přečíslování odkazů“ ve starém tvaru
  (kontrola: `grep -rn "STEP-1[1-9]\|STEP-2[0-9]" src/`).

## Testy

- Unit (Vitest), všechno bez DOM:
  - `rng.test.ts` — `pickWeighted`: rozdělení na zasetém `createRng`, jednoprvkové pole,
    nulové a `NaN` váhy, prázdné pole hází.
  - `mastery.test.ts` — `weightOf` na obou stranách `MASTERY_KNOWN` a pro prvek mimo sadu.
  - `curriculum.test.ts` — stropy jsou platné `Level` a nejsou vyšší než 5.
  - `progress.test.ts` — zavedení právě jednoho prvku, postup stupně, zastavení na stropu,
    přenos skóre přes stupeň, `introducedElement` ve všech třech větvích. Dnešní test
    „leaves the settings and the levels alone (STEP-11 does the introducing)“ se přepíše.
  - `orders.test.ts` — vážený výběr (dlouhá série na zasetém rng, poměr v pásmu),
    zavedený prvek jako cíl, počítání nikdy nad `MAX_COUNT` při Č2, kratší nabídka
    při dvou aktivních písmenech, `avoid` u jediného prvku.
  - `session.test.ts` — zavedený prvek přežije objednávku druhé dráhy, po použití zmizí,
    počítací objednávka nespotřebuje čekající osmičku, zasetá session je pořád reprodukovatelná.
  - `save.test.ts` — nová hra má dvě aktivní písmena, oprava zachová čtyři.
  - `mastery.test.ts` / `progress.test.ts` — po jakémkoli růstu (zavedení, postup stupně,
    postup zablokovaný stropem) není `active` prázdné.
- Spuštění: `docker compose run --rm test` (podmnožina: `docker compose run --rm test pnpm test orders`).

## Ruční ověření

Krok nemění ani pixel scény — ověřuje se, **co se na polici a v míse objevuje**.
Dev server: `docker compose --profile dev up -d`, `http://localhost:5173/mlsna-abeceda/`.

- [ ] Vymazat save (`localStorage.removeItem('kk.save.v1')`, reload). Zazvonit, splnit objednávku
      s písmenkem: na police stojí **dva** perníčky, ne tři. Nic se netváří rozbitě.
- [ ] Vyhrát v konzoli písmenkovou dráhu a reloadnout:
      ```js
      const s = JSON.parse(localStorage.getItem('kk.save.v1'));
      for (const k of Object.keys(s.tracks.letters.scores)) s.tracks.letters.scores[k] = 5;
      localStorage.setItem('kk.save.v1', JSON.stringify(s)); location.reload();
      ```
      Po **jedné** dokončené písmenkové objednávce musí v `__kitchen.choice().choices`
      (nebo na polici) přibýt nové písmeno a hned na něj přijít řada.
- [ ] Totéž pro čísla (`s.tracks.numbers.scores`): po dokončené objednávce dráha přeskočí na Č2
      a mezi svíčkami se objeví **šestka**. Miska dál nikdy nechce víc než pět kousků ovoce.
- [ ] Nechat čísla dojet na strop:
      ```js
      const s = JSON.parse(localStorage.getItem('kk.save.v1'));
      s.tracks.numbers = { level: 2, active: ['1','2','3','4','5','6','7','8','9','10'],
        scores: Object.fromEntries(['1','2','3','4','5','6','7','8','9','10'].map(k => [k, 5])) };
      localStorage.setItem('kk.save.v1', JSON.stringify(s)); location.reload();
      ```
      Po další dokončené číselné objednávce se `level` **zastaví na 2**, aktivní sada se nezmění
      a v konzoli není žádná chyba.
- [ ] Zkontrolovat, že rozehraný save nespadl: `JSON.parse(localStorage.getItem('kk.save.v1')).version === 1`.
- [ ] Totéž v rozměru mobilu na šířku (844×390) — jen kontrola, že kratší nabídka na polici
      sedí na střed a terče drží ≥ 88 px.

## DoD

- [x] Všechna akceptační kritéria splněna
- [x] Testy a build zelené (`test`, `check`, `build`)
- [x] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [x] `docs/navrh-hry.md` kap. 5.2 a 5.4 upraveny podle „Změn návrhu“ (všechny čtyři)
- [x] Odkazy na čísla kroků v `src/` srovnány podle tabulky „Přečíslování odkazů“
- [x] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

### Co vzniklo

Žádný nový soubor — krok jen dopojil logiku, která už v `src/game/` ležela nepoužitá.

| Soubor | Změna |
| --- | --- |
| `src/game/rng.ts` | `pickWeighted()` — váha ≤ 0 nebo nekonečná se počítá jako nula, samé nuly padnou na rovnoměrné `pick()`, prázdné pole hází `RangeError` |
| `src/game/mastery.ts` | `WEAK_WEIGHT = 3`, `weightOf()` |
| `src/game/curriculum.ts` | `LEVEL1_INITIAL_LETTERS = 2`, `MAX_NUMBER_LEVEL = 2`, `MAX_LETTER_LEVEL = 2` |
| `src/game/save.ts` | `createSave()` zakládá písmenkovou dráhu na dvou písmenech |
| `src/game/orders.ts` | `introducedOf()`, vážený `pickTarget(rng, track, avoid, allow, introduced)`, `OrderInput.introduced`, počítání filtruje na `≤ MAX_COUNT` |
| `src/game/progress.ts` | `growTrack()` (privátní) volaný z `completeOrder()` pro obě dráhy, `introducedElement()` |
| `src/game/session.ts` | `pending` prvek na dráhu; nastaví se po `completeOrder()`, zahodí se, až ho objednávka opravdu použije |
| testy | `rng` +7, `mastery` +3, `curriculum` +2, `progress` +10, `orders` +10, `session` +5, `save` +1 — celkem **494 → 532** |
| `docs/navrh-hry.md` | čtyři úpravy kap. 5.2 a 5.4 přesně podle „Změn návrhu“ |
| `src/**` | 12 zastaralých odkazů na čísla kroků srovnáno podle tabulky „Přečíslování odkazů“ |

### Odchylky od plánu

- **Pořadí parametrů `pickTarget`** je `(rng, track, avoid, allow, introduced)` a `allow` je
  `null`, když se nefiltruje. Pseudokód v plánu měl stejné pořadí, jen bez `null`; jde
  o privátní funkci mimo Kontrakt, takže se nic nezveřejněného nemění.
- **Testovací pomocníky vracejí funkci, ne `Record`.** `noUncheckedIndexedAccess` dělá
  z `seen['A']` typ `number | undefined`; místo desítek `!` vrací pomocník `(key) => number`.
- Jinak nic — signatury z Kontraktu sedí, `SAVE_VERSION` zůstal 1, žádná nová závislost.

### Jak se to ověřilo

`docker compose run --rm test` → **532 testů zelených** (před krokem 494), `check`
(tsc + prettier) i `build` bez chyby a bez varování.

Ruční ověření v prohlížeči (dev server, tablet 1180×900 i mobil na šířku 844×390):

- **Nová hra nese dvě písmena.** `__save.reset()` → dráha `['O','S']`, na polici stojí
  **dva** perníčky (S, O), vystředěné nad policí. Objednávka č. 1 je počítací, zvonek funguje.
- **Zavedení písmena.** O i S na 5 bodů → po jedné dokončené objednávce přibylo `T` se skóre 0
  a **hned další písmenková objednávka na `T` mířila** (`{letter:'T', word:'táta', choices:['O','S','T']}`).
- **Postup na Č2.** Čísla 1–5 na 5 bodů → dráha skočila na `level 2`, přibyla **jediná** nová
  číslice `6` a nejbližší objednávka se svíčkou chtěla přesně šestku (police se rozrostla na
  čtyři svíčky). Počítací objednávky mezitím nikdy nechtěly víc než pět kousků ovoce.
- **Strop.** Čísla nastavená na `level 2` s aktivní sadou 1–10, všechno na 5 → po osmi
  dokončených objednávkách je `level` pořád **2**, aktivní sada nezměněná, číslice šly až po 9,
  počítání pořád max 5. V konzoli žádná chyba ani varování.
- **Save.** `version === 1` po celou dobu; v uloženém JSONu není `introduced` ani `pending`.
- **Mobil na šířku (844×390).** Dva perníčky sedí na střed police, fyzicky 95 × 95 px
  (logicky ~187 px, tedy hluboko nad limitem 88).

**Neověřeno:** zvuk (ověřovalo se přes konzoli, ne klepáním, takže hlas u zavedení nového
prvku nikdo neposlouchal — krok ale žádnou hlášku nepřidává ani nemění) a skutečný dotyk na
tabletu; ověřovalo se myší v emulované velikosti.

### Poznámky a náměty mimo rozsah

- **Zavedení není tiché úplně náhodou:** dcera nedostane žádný signál, že přibylo nové
  písmenko. Plán to vědomě odložil; až se to u ní zkusí, stálo by za zvážení krátká hláška
  nebo zvuk (vlastní krok, dotkl by se scény i manifestu hlášek).
- **Prvky se můžou zavést rychleji, než je hra stihne ukázat.** Při `READY_RATIO = 0.8` má
  šestiprvková sada s pěti zvládnutými poměr 0,83, takže se hned zavede sedmý prvek — `pending`
  se přepíše a šestý přijde na řadu až váženým výběrem. Není to chyba (návrh říká „jeden nový,
  když ≥ 80 %“), ale u větších sad to znamená, že „hned v další objednávce“ platí pro poslední
  zavedený, ne pro každý.
- **Živá změna velikosti okna rozhodí popisky.** Když se okno zvětší, zatímco kuchyně stojí,
  písmena na perníčcích i číslice na svíčkách zůstanou v původním měřítku vedle vyrostlé
  grafiky; po reloadu je to v pořádku. Týká se to i svíček, kterých se tenhle krok vůbec
  nedotkl, takže jde o starší chování `resize()` ve scéně — vlastní krok, nebo aspoň řádek
  v roadmapě.
- **Ruční ověření smazalo rozehraný save** na `localhost:5173` (plán to tak předepisuje).
  Dráhy jsou teď čerstvá nová hra.
