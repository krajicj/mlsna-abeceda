# STEP-13 · Slučitelný formát save (v2): migrace, `earned`/`purchases`, slučování

Status: done
<!-- Čísla kroků v tomhle plánu jsou už podle PŘEČÍSLOVANÉ roadmapy: konec sezení = STEP-14,
     obchůdek = STEP-15, rodičovský koutek = STEP-19, export/import = STEP-21, PWA = STEP-22. -->
Milník: M2 · Po: STEP-11 · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 9.1 (a kap. 7)

## Shrnutí

Uložený postup dnes nesnese ani změnu formátu, ani druhé zařízení. `parseSave()` u záznamu s jinou
verzí udělá `return null`, což znamená **založí novou hru** – zvýšení `SAVE_VERSION` se tím rovná
smazání pokroku, a `CLAUDE.md` přitom žádá „změna formátu = migrace s bumpem verze". Hvězdičky jsou
zůstatek (`progress.stars: number`) a zůstatek se sloučit nedá: sečíst dvě zařízení znamená vyrobit
hvězdičky z ničeho, vzít vyšší znamená sebrat dceři, co si koupila (návrh 9.1). Krok proto dodá
**formát v2**: řetěz migrací, který záznam zvedne místo aby ho zahodil, hvězdičky jako `earned` +
`purchases` s dopočítaným zůstatkem, a `mergeSave()` – funkci, která ze dvou záznamů udělá jeden
podle tabulky z kap. 9.1, nezávisle na pořadí. Je to čistá logika v `src/game/`, ve hře se nic
nezmění (kromě tří řádků, kde kuchyně čte počet hvězdiček). Umožní tím obchůdek (hvězdičky se
stanou měnou), export/import a konec sezení, který si do save uloží svůj stav bez dalšího bumpu.

## Rozsah

**V rozsahu**

- `SAVE_VERSION = 2` a **řetěz migrací** `migrateRecord()`: záznam verze 1 se povýší na 2, nic se
  neztratí. Neznámá nebo novější verze → nová hra, ale původní text se **odloží do zálohy**
  (`kk.save.backup`), ne přepíše.
- Hvězdičky jako `StarsState = { earned: number, purchases: Record<string, number> }` (id věci →
  zaplacená cena) + `starBalance()` = `earned − zaplaceno`. `progress.stars` mizí.
- `pending` (čerstvě zavedený prvek, návrh 5.4) **do save** – dnes ho `session.ts` drží jen v paměti
  právě proto, že se formát nesměl měnit; po reloadu se ztrácel.
- `mergeSave(local, incoming)` podle tabulky z kap. 9.1: vyšší skóre, vyšší stupeň, sjednocení sady,
  vyšší `earned`, sjednocení `purchases`, vyšší počet objednávek, pozdější `lastPlayed`.
- `withPurchase()` jako jediný zapisovatel `purchases` (obchůdek, STEP-15, pak staví jen UI).
- Kuchyně: tři místa, kde se čte `save.progress.stars`, přejdou na `starBalance(save.stars)`;
  DEV konzole dostane `__save.merge()`, aby šlo sloučení vyzkoušet v prohlížeči.
- Srovnat odkazy `STEP-NN` v kódu a v živých dokumentech po přečíslování roadmapy (konec sezení je
  nově STEP-14, takže se všechno od starého STEP-14 dál posunulo o jedno). **Přesný seznam míst je
  níž v tabulce**, hádat se nemá nic.

**Mimo rozsah**

- **Konec sezení, zavírací scéna, obnova sezení po reloadu** – to je STEP-14 (a přidá si do save
  vlastní blok, formát v2 už na to bude připravený).
- Export/import souboru a mazání dat (STEP-21), obchůdek a ceník věcí (STEP-15).
- Čím se postup mezi zařízeními přenáší (ruční soubor × vlastní endpoint) – otevřená otázka
  návrhu kap. 13. Krok dodá jen formát a slučovací funkci; nic se nikam neposílá.
- `navigator.storage.persist()` a zrcadlo v IndexedDB (kap. 9.1 „levná vyztužení") – patří k PWA
  (STEP-22), kde se řeší trvanlivost úložiště.
- Jakákoli změna vzhledu, hlasu nebo herní mechaniky. Žádné nové hlášky, generátor hlasu neběží.

## Implementace

**Soubory**

```
src/game/version.ts      (změna) SAVE_VERSION = 2, nový SAVE_BACKUP_KEY
src/game/stars.ts        (nový)  StarsState, starBalance, starsSpent, withStar, withPurchase
src/game/migrate.ts      (nový)  řetěz migrací v1 → v2
src/game/merge.ts        (nový)  mergeSave, mergeTrack, mergeStars, mergePending
src/game/save.ts         (změna) SaveData v2, repairStars/repairPending, parseSave migruje, readSave zálohuje
src/game/progress.ts     (změna) completeOrder píše do stars.earned, progress bez stars
src/game/session.ts      (změna) pending se čte ze save a při complete() se do save zapisuje
src/scenes/kitchen/index.ts (změna) 3× starBalance(...) místo save.progress.stars
src/main.ts              (změna) DEV: __save.merge()
src/game/stars.test.ts   (nový)
src/game/migrate.test.ts (nový)
src/game/merge.test.ts   (nový)
src/game/save.test.ts    (změna) v2 tvar, migrace přes readSave, záloha
src/game/progress.test.ts, src/game/session.test.ts (změna)
```

**Knihovny** – žádné nové (běhové závislosti zůstávají nulové).

**Kroky**

1. `stars.ts`: `StarsState`, `NO_STARS`, `starsSpent`, `starBalance`, `withStar`, `withPurchase`.
   Čistá logika nad `StarsState`, nic neví o `SaveData` (žádný cyklus importů).
2. `version.ts`: `SAVE_VERSION = 2`, `SAVE_BACKUP_KEY = 'kk.save.backup'`. `SAVE_KEY` **zůstává**
   `kk.save.v1` – viz Klíčová rozhodnutí.
3. `save.ts`: nový tvar `SaveData` (bez `progress.stars`, s `stars` a `pending`), `createSave()`
   je zakládá prázdné; `repairStars()` a `repairPending()` ve stylu `repairTrack()`; `parseSave()`
   pustí záznam nejdřív přes `migrateRecord()` a teprve pak opravuje; `readSave()` u nečitelného
   nebo nemigrovatelného textu **nejdřív uloží syrový text do zálohy** a pak založí novou hru.
4. `migrate.ts`: `MIGRATIONS = { 1: v1ToV2 }` a `migrateRecord()`, který v cyklu zvedá verzi,
   dokud nedojde na `SAVE_VERSION`; chybějící krok, nečíselná nebo vyšší verze → `null`.
5. `progress.ts`: `completeOrder()` píše `stars: withStar(save.stars, STARS_PER_ORDER)` a `progress`
   bez hvězdiček; `pending` propouští beze změny.
6. `merge.ts`: `mergeSave()` + tři dílčí funkce, každá s pravidlem z tabulky 9.1.
7. `session.ts`: `pending` se inicializuje z `save.pending`; `complete()` postaví nový záznam
   **včetně** `pending` po vygenerování další objednávky a zapíše ho jedním `writeSave()`.
8. Kuchyně a `main.ts`: `starBalance(...)`, DEV `__save.merge()`.
9. Testy (viz Testy), pak `docker compose run --rm test`, `check`, `build`.
10. Úklid odkazů `STEP-NN` v komentářích po přečíslování roadmapy.

**Klíčová rozhodnutí**

- **`earned` je jedno číslo, ne mapa per zařízení** (rozhodnutí autora, srpen 2026). Návrh 9.1
  nabízel `{ tablet: 10, notebook: 8 }`, protože „vyšší vyhrává" podhodnotí součet, když se hraje
  na obou zařízeních mezi dvěma sloučeními. Autor to zamítl: přenos půjde nejspíš přes server, kde
  se stav slučuje průběžně, a jedno číslo je jednodušší formát. Podhodnocení se bere jako přijatelná
  cena a je popsané v návrhu i v komentáři u `mergeStars`.
- **`purchases` nese zaplacenou cenu, ne jen id.** Zůstatek se pak dopočítá bez ceníku, který
  vznikne až s obchůdkem (STEP-15), a pozdější změna ceny nepřepíše historii. Sloučení bere u
  stejného id **vyšší** cenu: dvě zařízení mohla koupit tutéž věc, vlastní se jednou, a nižší cena
  by dceři vyrobila hvězdičky z ničeho.
- **Klíč v localStorage zůstává `kk.save.v1`.** Klíč je přihrádka, verzi nese pole `version`
  v záznamu; přejmenovat ho na `kk.save.v2` by znamenalo číst při každém startu dva klíče a s každým
  dalším bumpem nechávat v úložišti další mrtvý záznam. `CLAUDE.md` mluví o „versioned key" – ta
  podmínka platí dál, jen se verze čte z obsahu.
- **Záloha místo tichého přepisu.** Rozbitý text, cizí formát nebo záznam z novější verze hry
  (dcera hraje na dvou zařízeních, na jednom je starší build) se dnes zahodí a hra ho během první
  objednávky přepíše. Nově se syrový text nejdřív uloží do `kk.save.backup`, takže z něj jde postup
  ručně zachránit. Souvisí to přímo s pravidlem 4 („progres je posvátný") a stojí to deset řádků.
  Záloha je **jedna** a drží poslední nečitelný text: druhý rozbitý start přepíše první zálohu.
  Víc jich mít nemá smysl – scénář je „hra jednou nerozuměla záznamu a rodič ho chce zachránit",
  ne archiv verzí. Ať je to vidět v kódu i tady, ne aby to někdo objevil až v nouzi.
- **Slučování je nesymetrické v jedné jediné věci: `settings`.** Jména a nastavení nejsou postup
  a slučovat se nedají; zůstávají z `local`, tedy ze zařízení, u kterého rodič zrovna sedí a kde je
  vidí. Všechno ostatní dává stejný výsledek nezávisle na pořadí a `mergeSave(a, a) === a`.
- **`pending` se při sloučení řeší „neshoda = nic".** Když každý záznam čeká na jiný prvek, výsledek
  je `null`: prvek je stejně v aktivní sadě a přijde na řadu sám. Cena je jedno nevynucené zavedení,
  zisk je pravidlo nezávislé na pořadí.
- **`createSession()` pořád nezapisuje.** Vyčištění `pending` (objednávka si prvek vzala) se do
  úložiště propíše až při nejbližším `complete()`. Když dcera reloadne dřív, dostane týž prvek
  znovu – což je přesně to, co se po nedohrané objednávce hodí.

Pseudokód migrace:

```
migrateRecord(record):
  version = record.version
  if typeof version !== 'number' or version > SAVE_VERSION: return null
  while version < SAVE_VERSION:
    step = MIGRATIONS[version]
    if !step: return null
    record = step(record); version = record.version
  return record
```

Pseudokód sloučení jedné dráhy:

```
mergeTrack(a, b):
  level  = max(a.level, b.level)
  active = pořadí z dráhy s vyšším stupněm, pak prvky navíc z té druhé (bez duplicit)
  scores = pro každý prvek active: max(a.scores[e] ?? 0, b.scores[e] ?? 0)
```

**Přečíslování roadmapy**

Rozdělení řádku STEP-13 na dva kroky posouvá celý zbytek roadmapy o jedno (starý STEP-14 „Obchůdek"
je nově STEP-15 atd.). Pravidlo je mechanické – **`STEP-N` pro `N >= 14` → `STEP-(N+1)`** – a platí
na těchto 20 místech:

| soubor | výskyty | z | na |
|---|---|---|---|
| `src/audio/context.ts:24`, `src/audio/voice.ts:29`, `src/data/lines.cs.ts:35`, `src/main.ts:71`, `src/scenes/kitchen/index.ts:127` | 5× | STEP-18 | STEP-19 |
| `src/game/curriculum.test.ts:158` | 1× | STEP-19 | STEP-20 |
| `src/game/counting.ts:8`, `src/game/curriculum.ts:22`, `src/game/orders.ts:35`, `src/game/orders.ts:131`, `src/game/curriculum.test.ts:174` | 5× | STEP-22 | STEP-23 |
| `src/game/curriculum.ts:24`, `src/game/curriculum.test.ts:174` | 2× | STEP-25 | STEP-26 |
| `src/data/curriculum.ts:7`, `src/game/curriculum.ts:81`, `src/game/curriculum.test.ts:98` | 3× | STEP-26 | STEP-27 |
| `docs/navrh-hry.md:141`, `docs/navrh-hry.md:200` | 2× | STEP-22 | STEP-23 |
| `docs/navrh-hry.md:200` | 1× | STEP-25 | STEP-26 |

Jedno místo pravidlo obejde zkratkou: `src/game/orders.ts:35` píše `(STEP-22/25)`, kde druhé číslo
není celý token – celá závorka se mění na **`(STEP-23/26)`**. (Proto 20 výskytů, a ne 19: prosté
hledání `STEP-2[0-9]` tohle nenajde.)

Navíc **dvě místa se posouvají významem, ne pravidlem**: `src/game/session.ts:29` a
`src/scenes/kitchen/customer.ts:27` říkají, že obnova sezení po reloadu je práce STEP-13 – ta je
nově **STEP-14** (tenhle krok ukládá jen `pending`, zákazníka a stav sezení řeší až ten další).

`docs/plan.md` je přečíslovaný už teď (dělá to `/plan-step`, ne implementace). **Hotové plány
v `docs/steps/` se nepřepisují** – jsou to zápisy o tom, co platilo tehdy, ne živá dokumentace.

## Kontrakt

```ts
// src/game/version.ts
export const SAVE_VERSION = 2 as const;
export const SAVE_KEY = 'kk.save.v1' as const;
/** Sem se odloží syrový text záznamu, kterému hra nerozumí – nikdy se nepřepisuje potichu. */
export const SAVE_BACKUP_KEY = 'kk.save.backup' as const;

// src/game/stars.ts (nový)
export interface StarsState {
  /** Kolik hvězdiček dcera celkem dostala. Jen roste; nikdy se neodečítá. */
  readonly earned: number;
  /** Co je koupené: id věci → cena zaplacená v hvězdičkách. */
  readonly purchases: Readonly<Record<string, number>>;
}
export const NO_STARS: StarsState; // { earned: 0, purchases: {} }
export function starsSpent(stars: StarsState): number;
/** Zůstatek k utracení; nikdy záporný (poškozený záznam nesmí dceři dlužit). */
export function starBalance(stars: StarsState): number;
/** `count` chybí → 1. `completeOrder()` předává `STARS_PER_ORDER` výslovně (konstanta zůstává
 *  v progress.ts, aby stars.ts nemusel importovat nic z herního postupu). */
export function withStar(stars: StarsState, count?: number): StarsState;
/**
 * null = už koupené, cena mimo rozsah (záporná, nekonečná, NaN), nebo nestačí hvězdičky; co s tím,
 * říká obchůdek (STEP-15). Cena 0 projde – věc zadarmo je legitimní, jen zůstatek nezmění.
 */
export function withPurchase(stars: StarsState, id: string, cost: number): StarsState | null;

// src/game/save.ts (změna)
export interface SaveProgress {
  readonly ordersCompleted: number;
  readonly lastPlayed: string | null; // 'YYYY-MM-DD' v místním čase
}
/** Prvek, který se čerstvě zavedl a čeká na objednávku své dráhy (návrh 5.4). */
export interface PendingElements {
  readonly numbers: string | null;
  readonly letters: string | null;
}
export interface SaveData {
  readonly version: typeof SAVE_VERSION;
  readonly settings: Settings;
  readonly tracks: { readonly numbers: TrackState; readonly letters: TrackState };
  readonly progress: SaveProgress;
  readonly stars: StarsState;
  readonly pending: PendingElements;
}
/** Signatura beze změny; nově nejdřív migruje a teprve pak opravuje. */
export function parseSave(raw: string | null): SaveData | null;
/** Nově: nečitelný nebo nemigrovatelný text odloží do SAVE_BACKUP_KEY, pak založí novou hru. */
export function readSave(storage: StorageLike): SaveData;

// src/game/migrate.ts (nový)
export type Migration = (record: Record<string, unknown>) => Record<string, unknown>;
/** Klíč = verze, ze které krok zvedá. Nový bump = jeden řádek sem a jeden test. */
export const MIGRATIONS: Readonly<Record<number, Migration>>;
export function migrateRecord(record: Record<string, unknown>): Record<string, unknown> | null;

// src/game/progress.ts (změna)
/**
 * Signatura beze změny. `pending` jen **propouští beze změny** (`{ ...save }`) – kdo ho přepisuje,
 * je výhradně `session.ts` po vygenerování další objednávky.
 */
export function completeOrder(save: SaveData, results: readonly ItemResult[], today: string): SaveData;

// src/game/merge.ts (nový)
export function mergeStars(local: StarsState, incoming: StarsState): StarsState;
export function mergeTrack(local: TrackState, incoming: TrackState): TrackState;
/** Zvlášť pro `numbers` a `letters`: shodné → ten prvek; jedna strana `null` → ta druhá;
 *  každá jiný prvek → `null`. */
export function mergePending(local: PendingElements, incoming: PendingElements): PendingElements;
/** Postup se slučuje podle návrhu 9.1; `settings` nejsou postup a zůstávají z `local`. */
export function mergeSave(local: SaveData, incoming: SaveData): SaveData;

// src/main.ts – DEV konzole (v buildu se strhne, jako celý blok kolem)
__save.merge: (incoming: unknown) => SaveData | null;
// Text i objekt: objekt se nejdřív serializuje (`JSON.stringify`), teprve string jde do
// `parseSave()` (tedy i přes migraci), výsledek se sloučí s uloženým záznamem jako
// `mergeSave(local, incoming)`, zapíše se a vrátí. Nečitelný vstup → null, nic se nezapisuje.
```

**Příklad migrace v1 → v2** (`settings` a `tracks` se nesou beze změny):

```jsonc
// před (verze 1)
{ "version": 1, "settings": { "child": null, "family": [] },
  "tracks": { "numbers": { "level": 1, "active": ["1","2","3"], "scores": { "1": 5, "2": 2, "3": 0 } },
              "letters": { "level": 1, "active": ["M","A"],     "scores": { "M": 3, "A": 1 } } },
  "progress": { "ordersCompleted": 7, "stars": 7, "lastPlayed": "2026-08-20" } }

// po (verze 2)
{ "version": 2, "settings": { "child": null, "family": [] },
  "tracks": { "...": "beze změny" },
  "progress": { "ordersCompleted": 7, "lastPlayed": "2026-08-20" },
  "stars": { "earned": 7, "purchases": {} },
  "pending": { "numbers": null, "letters": null } }
```

`starBalance({ earned: 7, purchases: { "fruit.banana": 3 } })` → `4`.

**Příklad sloučení** (tablet × notebook):

```jsonc
// local (tablet)                              incoming (notebook)
// tracks.letters: level 1, active ["M","A"],  // tracks.letters: level 1, active ["M","A","L"],
//   scores { M: 4, A: 1 }                     //   scores { M: 2, A: 3, L: 1 }
// stars { earned: 7, purchases: {} }          // stars { earned: 5, purchases: { "fruit.banana": 3 } }
// progress { ordersCompleted: 7, lastPlayed: "2026-08-20" }  // { 5, "2026-08-22" }

// výsledek
// tracks.letters: level 1, active ["M","A","L"], scores { M: 4, A: 3, L: 1 }
// stars { earned: 7, purchases: { "fruit.banana": 3 } }   → zůstatek 4
// progress { ordersCompleted: 7, lastPlayed: "2026-08-22" }
```

## Změny návrhu

Do `docs/navrh-hry.md` kap. 9.1 se při implementaci zapíše (rozhodnutí autora, srpen 2026):

1. Poznámka pod tabulkou („Poctivější je počítat `earned` per zařízení…") se nahradí rozhodnutím:
   **`earned` je jedno číslo**, sloučení bere vyšší hodnotu. Podhodnocení součtu (10 + 8 → 10),
   když se mezi dvěma sloučeními hraje na obou zařízeních, se bere jako přijatelná cena – přenos
   půjde nejspíš přes server, kde se stav slučuje průběžně.
2. Do řádku o hvězdičkách se doplní, že **`purchases` nese i zaplacenou cenu** (id → hvězdičky),
   takže zůstatek jde dopočítat bez ceníku a sloučení bere u stejného id vyšší cenu.
3. Doplní se věta, že hra si drží **zálohu posledního nečitelného záznamu**, takže ani cizí nebo
   novější formát pokrok nesmaže potichu.

Otevřená otázka „čím se postup přenáší" (kap. 13) zůstává otevřená – formát na ní nezávisí.

## Akceptační kritéria

- KDYŽ je v úložišti záznam verze 1 se sedmi hvězdičkami a nějakými skóre, PAK ho `readSave()`
  vrátí jako verzi 2 se stejnými skóre, stejným `ordersCompleted`, `stars.earned === 7`,
  prázdnými `purchases` a `pending` `null`/`null`; NIC se neztratí a nová hra se nezakládá.
- KDYŽ hra po migraci znovu uloží, PAK je v úložišti záznam verze 2 a `kk.save.v1` je pořád ten
  jediný živý klíč.
- KDYŽ je v úložišti nečitelný text („{{{"), cizí JSON nebo záznam s verzí 99, PAK hra začne novou
  hru **a** syrový text je v `kk.save.backup`; hra nespadne.
- KDYŽ je záznam verze 2 poškozený jen částečně (chybí `stars`, `purchases` je pole místo objektu,
  `earned` je `-5` nebo `"x"`), PAK se opraví na `{ earned: 0, purchases: {} }` a zbytek záznamu
  (skóre, stupně) přežije – oprava nikdy nezahazuje celý záznam.
- KDYŽ `pending.numbers` odkazuje na prvek, který v aktivní sadě dráhy není, PAK se opraví na
  `null` (nevynucuje se prvek, který hra neumí nabídnout).
- KDYŽ dcera dokončí objednávku, PAK `stars.earned` vzroste o 1, `ordersCompleted` o 1,
  `lastPlayed` je dnešek a počítadlo v kuchyni ukazuje `starBalance()`.
- KDYŽ se sloučí dva záznamy, PAK má výsledek vyšší skóre každého prvku, vyšší stupeň, sjednocenou
  aktivní sadu, vyšší `earned`, sjednocené `purchases`, vyšší `ordersCompleted` a pozdější
  `lastPlayed`.
- KDYŽ se táž dvojice sloučí v opačném pořadí, PAK je výsledek (kromě `settings`) shodný;
  a KDYŽ se záznam sloučí sám se sebou, PAK vyjde nezměněný.
- KDYŽ obě strany koupily tutéž věc za různou cenu, PAK má výsledek vyšší cenu a zůstatek nikdy
  nevyroste sloučením.
- KDYŽ obě strany čekají na týž prvek, PAK ho čeká i výsledek; KDYŽ čeká jen jedna, PAK vyhraje ta
  nenulová; KDYŽ každá čeká na jiný, PAK je výsledek `null` (nevynutí se ani jeden).
- KDYŽ je v úložišti záznam verze 1 s rozbitým vnitřkem (`progress` chybí, je to `"x"` nebo pole,
  `tracks` chybí), PAK migrace **nevyhodí výjimku**, projde, a opraváři z ní udělají použitelnou
  novou-starou hru: `earned` 0, zbytek podle toho, co se dalo přečíst. Migrační krok nikdy
  nevaliduje obsah – od toho jsou `repair*` funkce, které běží hned po něm.
- KDYŽ `withPurchase()` dostane id, které je už koupené, cenu vyšší než zůstatek, nebo cenu mimo
  rozsah (záporná, `NaN`, nekonečná), PAK vrátí `null` a záznam se nemění. KDYŽ je cena 0, PAK věc
  přibude mezi `purchases` a zůstatek zůstane stejný.
- KDYŽ se prvek čerstvě zavede a dcera hru reloadne, PAK na něj další objednávka té dráhy pořád
  čeká (`pending` je v uloženém záznamu).
- KDYŽ `localStorage` zápis odmítne (privátní režim, plná kvóta), PAK hra běží dál z paměti,
  stejně jako dnes – ani migrace, ani záloha na tom nic nemění.

## Testy

Unit (Vitest, `src/game/`, bez DOM):

- `stars.test.ts` – `starBalance` (běžně, s koupí, nikdy záporný), `starsSpent` prázdné/více
  položek, `withStar` (bez argumentu +1, s argumentem +N), `withPurchase` (koupí, už koupené →
  `null`, nestačí → `null`, cena 0 projde, záporná / `NaN` / `Infinity` → `null`, nemutuje vstup).
- `migrate.test.ts` – v1 → v2 přesně podle příkladu v Kontraktu; záznam už verze 2 projde beze
  změny; verze 99, `"1"`, chybějící `version` → `null`; migrace nemutuje vstupní objekt;
  **v1 s rozbitým vnitřkem** (`progress` chybí / `"x"` / pole) migrací projde bez výjimky a
  `parseSave()` z něj udělá platný záznam v2.
- `merge.test.ts` – každý řádek tabulky 9.1 zvlášť; komutativita (kromě `settings`);
  idempotence `mergeSave(a, a)`; stejné id koupené za různou cenu; `pending` shodné / jedno `null` /
  neshodné; sloučení dvou nedotčených nových her; **žádná ze slučovacích funkcí nemutuje vstupy**
  (obě strany jsou po volání stejné jako před ním).
- `save.test.ts` (rozšíření) – `createSave()` má v2 tvar; `parseSave` migruje; oprava `stars`
  a `pending`; `readSave` zakládá zálohu u nečitelného, cizího i novějšího záznamu a **nezakládá**
  ji u záznamu, který se povedlo přečíst; `writeSave` po migraci uloží verzi 2.
- `progress.test.ts` (rozšíření) – `completeOrder` zvyšuje `earned`, ne zůstatek; `purchases`
  ani `pending` se nedotkne (obojí propustí beze změny).
- `session.test.ts` (rozšíření) – `pending` přežije „reload" (druhá `createSession` nad týmž
  úložištěm); `createSession` sama nezapisuje; po `complete()` je v úložišti `pending` odpovídající
  právě vygenerované objednávce.

Spuštění: `docker compose run --rm test` · `docker compose run --rm check` · `docker compose run --rm build`

## Ruční ověření

Dev server `docker compose --profile dev up -d`, `http://localhost:5173/mlsna-abeceda/`,
Chrome DevTools, emulace tabletu na šířku. Hra musí jít odemknout klepnutím (audio, pravidlo 6).

- [x] V konzoli vložit do `localStorage` ručně **záznam verze 1** (JSON z Kontraktu, klíč
      `kk.save.v1`), reloadnout, zazvonit: počítadlo hvězdiček ukazuje 7, `__save.raw()` vrací
      záznam **verze 2** se `stars.earned: 7`, dráhy a skóre sedí.
- [x] Dohrát jednu objednávku: hvězdička přiletí, počítadlo je 8, v `__save.raw()` je
      `earned: 8`, `ordersCompleted` o jedna vyšší a `lastPlayed` dnešní datum.
- [x] `localStorage.setItem('kk.save.v1', '{{{')` a reload: hra naběhne jako nová (počítadlo 0,
      nespadne), `localStorage.getItem('kk.save.backup')` obsahuje `{{{`.
- [x] Totéž se záznamem `{"version":99}`: nová hra, záloha obsahuje původní text.
- [x] `__save.merge(<záznam z Kontraktu, sekce sloučení>)`: `__save.raw()` má sjednocenou sadu
      písmen, vyšší skóre, `earned: 7`, koupenou banánovou položku a pozdější `lastPlayed`.
      Po reloadu počítadlo ukazuje **zůstatek 4**, ne 7.
- [x] `__save.reset()` + reload: nová hra, prázdné `stars`, hra se chová jako první spuštění.
- [x] Totéž v rozměru mobilu na šířku (844×390): počítadlo hvězdiček je celé vidět a nic
      nepřetéká – jediné, čeho se krok vizuálně dotkne.

## DoD

- [x] Všechna akceptační kritéria splněna
- [x] Testy a build zelené (`test`, `check`, `build`)
- [x] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [x] `docs/navrh-hry.md` kap. 9.1 upravena podle sekce „Změny návrhu"
- [x] Odkazy `STEP-NN` v komentářích srovnané po přečíslování roadmapy
- [x] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

**Hotovo** (srpen 2026). Formát save je na verzi 2, migrovatelný a slučitelný; ve hře se nezměnilo
nic než to, že počítadlo ukazuje **zůstatek**, ne součet vydělaných hvězdiček.

**Nové soubory**

- `src/game/stars.ts` – `StarsState`, `NO_STARS`, `starsSpent`, `starBalance`, `withStar`,
  `withPurchase`. Bez závislosti na `SaveData`, takže `save.ts` si ho může naimportovat.
- `src/game/migrate.ts` – `MIGRATIONS = { 1: v1ToV2 }`, `migrateRecord()` a sdílený `asRecord()`.
- `src/game/merge.ts` – `mergeStars`, `mergeTrack`, `mergePending`, `mergeSave`.
- Testy `stars.test.ts` (17), `migrate.test.ts` (7), `merge.test.ts` (17).

**Změněné soubory**

- `src/game/version.ts` – `SAVE_VERSION = 2`, nový `SAVE_BACKUP_KEY`; `SAVE_KEY` zůstal `kk.save.v1`.
- `src/game/save.ts` – `SaveData` v2 (`stars`, `pending`, `progress` bez hvězdiček), `repairStars()`,
  `repairPending()`, `parseSave()` nejdřív migruje, `readSave()` odkládá nečitelný text do zálohy.
- `src/game/progress.ts` – `completeOrder()` píše `withStar(save.stars, STARS_PER_ORDER)`.
- `src/game/session.ts` – `pending` se čte ze save a po vygenerování další objednávky se jedním
  `writeSave()` zapisuje zpátky.
- `src/scenes/kitchen/index.ts` – 3× `starBalance(ctx.session.save.stars)`.
- `src/main.ts` – DEV `__save.merge()` a `__save.backup()`.
- Odkazy `STEP-NN` po přečíslování roadmapy: 20 míst v 11 souborech podle tabulky výš, plus dvě
  významová (`session.ts`, `customer.ts` – obnova sezení je STEP-14).
- `docs/navrh-hry.md` kap. 9.1 podle sekce „Změny návrhu" (tři úpravy).

**Odchylky od plánu** (žádná nemění Kontrakt ani Rozsah)

1. **`asRecord()` bydlí v `migrate.ts` a je exportovaný**, ne privátní v `save.ts`. `save.ts` už na
   `migrate.ts` závisí, takže je to jedna definice bez cyklu – jinak by musela existovat dvakrát.
2. **`src/game/version.test.ts` se musel přepsat** (plán ho v seznamu neměl): tvrdil
   `SAVE_VERSION === 1` a že klíč verzi nese v názvu. Nově testuje, že klíč `kk.save.v1` zůstává
   schválně, a že záloha má klíč vlastní.
3. **`withSettings()` navíc zahazuje čekající písmeno**, které v nové sadě není. Je to důsledek
   nového pole: bez toho by save čekal na prvek, na který se generátor nemůže zeptat.
4. **Poškozená cena u koupené věci se opraví na 0, věc se nezahazuje.** Akceptační kritéria řešila
   jen celý rozbitý `stars`; sebrat dceři hračku je horší oprava než hračka zadarmo. Otestováno.
5. **`resetSave()` zálohu maže schválně ne** – patří k záznamu, který tenhle reset nikdy neviděl
   (pravidlo 4). Mazání dat přijde s rodičovským koutkem (STEP-19).
6. **Test ze STEP-12 „nic nového se neukládá" nahradily dva testy.** Tvrdil, že `pending` v save
   není – což je přesně to, co tenhle krok mění.
7. **`mergeTrack` má u shodného stupně pravidlo „vede delší sada"** (v plánu jen „pořadí z dráhy
   s vyšším stupněm"). Sady jsou v praxi prefixy téhož poolu, takže výsledek nezávisí na pořadí;
   zbývá jediný umělý případ – dvě stejně dlouhé sady v jiném pořadí drží pořadí z `local`
   (stejná množina, jiné pořadí).

**Ověření**

- `docker compose run --rm test` – **609 testů zelených** (před krokem 555), `check` i `build` čisté.
- Ruční ověření v prohlížeči (dev server, tablet na šířku, Chrome): migrace záznamu v1 → počítadlo
  ukázalo 7 a `__save.read()` vrátil v2 se `stars.earned: 7`; dohraná objednávka → počítadlo 8,
  v úložišti v2, `ordersCompleted: 8`, `lastPlayed` dnešní datum, skóre O 3 → 4; `{{{` i
  `{"version":99}` → nová hra bez pádu a syrový text v `kk.save.backup`; `__save.merge()` s objektem
  i s **textem verze 1** dal přesně výsledek z Kontraktu a po reloadu počítadlo ukázalo **zůstatek 4**,
  ne 7; nečitelný vstup vrátil `null` a nic nepřepsal; `__save.reset()` → nová hra, prázdné hvězdičky.
- **Upřesnění k prvnímu bodu checklistu:** hned po reloadu je v `__save.raw()` pořád **text verze 1**.
  Není to chyba – `createSession()` schválně nezapisuje, takže migrovaný záznam se do úložiště
  propíše až první dohranou objednávkou (druhý bod checklistu). Migrace je vidět přes `__save.read()`.
- **Rozměr mobilu na šířku (844×390) ověřen jinak, než plán čekal:** okno prohlížeče šlo přes
  maximalizované okno zmenšit jen naoko (`innerWidth` se nezměnil), takže se nastavil rozměr přímo
  `.viewport` elementu – a to je přesně to, co stage měří (`ResizeObserver` v `stage.ts`). Kuchyně
  se zmenšila celá, počítadlo je celé vidět a nic nepřetéká.
- Dev server běžel na `127.0.0.1:5173` (autorův, spuštěný dřív); `localStorage` na `localhost:5173`
  jsem po ověření **vymazal** – testovací záznamy z něj nezůstaly, ale co v něm bylo předtím, to
  ověřování přepsalo.

**Návrhy mimo rozsah**

- `withPurchase()` zatím nikdo nevolá – čeká na obchůdek (STEP-15); do té doby ho drží jen testy.
- Záloha nemá v rodičovském koutku obsluhu: rodič se k ní dostane jen konzolí. Až bude koutek
  (STEP-19), stálo by za to nabídnout „obnovit ze zálohy" jedním klepnutím.
- `mergeSave()` je hotová funkce bez cesty, kudy záznam přenést – otevřená otázka návrhu kap. 13.

