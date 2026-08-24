# STEP-03 · Herní logika: kurikulum, dvě dráhy, generátor objednávek (Č1/P1), ukládání

Status: done
Milník: M1 · Po: STEP-01 · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 3, 5.1–5.6

## Shrnutí

Krok dodá „mozek“ hry: čisté funkce bez DOM v `src/game/` a datové tabulky v `src/data/`.
Z nastavení (jméno dítěte + rodina) odvodí **pořadí písmen**, drží **dvě nezávislé dráhy**
(čísla × písmena) se skóre zvládnutí 0–5 a umí vygenerovat **objednávku o jedné položce**
pro stupně Č1/P1 – počítání ovoce, výběr číslice, výběr písmenka – včetně distraktorů na
polici. Všechno se ukládá do `localStorage` pod klíčem `kk.save.v1` (konstanty už existují
v `src/game/version.ts` ze STEP-01) a přežije reload.

Nic z toho nekreslí; scény STEP-05 a STEP-06 tuhle logiku jen obalí obrázky, STEP-08 z ní
poskládá celou smyčku. Adaptivní váhy, delší objednávky a hra na vyšších stupních zůstávají
STEP-10 – tenhle krok dělá to nejmenší, co uživí první hratelnou objednávku.

Rozhodnutí autora zapracovaná do návrhu (`docs/navrh-hry.md` 0.4): prvních deset objednávek
se dráhy přesně střídají (kap. 5.3), diakritika se ve jméně dítěte přeskakuje a u iniciál
rodiny skládá (kap. 5.4), písmeno E má slovo „jméno dítěte, jinak ementál“ (kap. 5.6),
tvarově podobné dvojice a slova podle rolí mají v návrhu konkrétní seznam (kap. 5.4, 5.6).

## Rozsah

**V rozsahu**

- `src/game/rng.ts` – seedovatelný generátor náhody + `pick`/`sample`/`shuffle`, aby šly
  náhodné výběry testovat deterministicky.
- `src/game/settings.ts` – tvar nastavení (dítě, rodina), prázdné výchozí nastavení,
  tolerantní `normalizeSettings` pro cokoli, co přijde z `localStorage` nebo z konzole.
- `src/data/curriculum.ts` – datové tabulky: základní sada písmen, slova k písmenům, slova
  podle rolí, skládání diakritiky, častá písmena, tvarově podobné dvojice, druhy ovoce.
- `src/game/curriculum.ts` – pořadí písmen z nastavení, sady (pool) **pro všech pět stupňů
  obou drah**, slovo k písmenu, počet věcí na polici.
- `src/game/mastery.ts` – stav jedné dráhy: skóre 0–5, zápis úspěchu a chyby, zavedení
  nového prvku při ≥ 80 % zvládnuté sady, podmínka a provedení postupu na další stupeň.
- `src/game/orders.ts` – generátor objednávky s jednou položkou (`count` | `digit` |
  `letter`), střídání drah, distraktory, pravidlo „nic dvakrát za sebou“.
- `src/game/save.ts` – záznam `SaveData` v1 nad `SAVE_KEY`/`SAVE_VERSION` z existujícího
  `src/game/version.ts`, čtení/zápis/reset přes vstříknuté úložiště, odolnost proti
  poškozeným datům, přepočet dráhy písmen po změně nastavení.
- `src/main.ts` – načtení uložené hry při startu a **DEV globály** `__save`, `__settings`,
  `__game` pro ruční ověření v konzoli.
- Vitest testy ke každému modulu.

**Mimo rozsah**

- Cokoli, co kreslí nebo sahá na DOM (scény, police, miska) – STEP-04 až STEP-06.
- Hlas, id hlášek a manifest `src/data/lines.cs.ts` – STEP-07. Generátor vrací **data**
  (číslo, druh ovoce, písmeno), ne text ani id klipu; mapování dat na hlášku dělá STEP-07.
- **Hra na vyšších stupních**: typy položek „kolik je“, „sčítání“, „slovo“, „lísteček“,
  délka objednávky 2–3 položky, adaptivní váhy „pytlíku“, pravidlo „nový prvek nejpozději
  do 2 objednávek“ – STEP-10 a dál. Sady prvků (`letterPool`, `numberPool`) jsou ale
  definované pro všechny stupně už teď, ať se v STEP-10 mění chování, ne data.
- Kdo a kdy volá `maybeIntroduce` / `advanceLevel` v běžící hře – STEP-08 a STEP-11. Tady
  vzniknou jen jako čisté funkce s testy.
- Zvoneček, konec sezení, počítadlo objednávek za sezení – STEP-11.
- Rodičovský koutek a jakékoli UI nastavení – STEP-16; export/import a mazání dat – STEP-18.
- Diakritická písmena v sadě (P4) – STEP-24.

## Implementace

**Soubory**

```
src/data/curriculum.ts        (nový)  datové tabulky kurikula
src/game/rng.ts               (nový)  seedovatelná náhoda
src/game/rng.test.ts          (nový)
src/game/settings.ts          (nový)  Settings + normalizace
src/game/settings.test.ts     (nový)
src/game/curriculum.ts        (nový)  pořadí písmen, sady stupňů, slova
src/game/curriculum.test.ts   (nový)
src/game/mastery.ts           (nový)  skóre a stav dráhy
src/game/mastery.test.ts      (nový)
src/game/orders.ts            (nový)  generátor objednávky
src/game/orders.test.ts       (nový)
src/game/save.ts              (nový)  SaveData v1, čtení a zápis
src/game/save.test.ts         (nový)
src/game/version.ts           (beze změny) SAVE_KEY a SAVE_VERSION se importují, nekopírují
src/main.ts                   (změna) načtení save + DEV globály
docs/navrh-hry.md             (hotovo při plánování) verze 0.4, kap. 5.3, 5.4, 5.6
```

**Knihovny** – žádné nové. Všechno jsou čisté funkce nad standardním JS; Vitest už je
v projektu (`vitest@4.1.10`, `environment: 'node'`), takže moduly nesmí sáhnout na
`window` ani `localStorage` – úložiště se vstřikuje parametrem.

**Kroky**

1. `src/game/rng.ts` – `createRng(seed)` (mulberry32, ~10 řádků), `systemRng` nad
   `Math.random`, pomocníci `pick`, `sample`, `shuffle` (Fisher–Yates).
2. `src/game/settings.ts` – typy `FamilyRole`, `FamilyMember`, `ChildProfile`, `Settings`,
   konstanta `EMPTY_SETTINGS` a `normalizeSettings(input: unknown)`, která z čehokoli udělá
   platné nastavení (ořezané mezery, zahozená prázdná jména a neznámé role, max 8 členů,
   `vocative` chybí → použije se `name`).
3. `src/data/curriculum.ts` – tabulky podle Kontraktu: `LETTER_WORDS` a `ROLE_WORDS`
   z návrhu kap. 5.6, `FREQUENT_LETTERS` z kap. 5.4 bodu 3, `CONFUSABLE_*` z kap. 5.4
   odrážky o distraktorech, `DIACRITICS` kompletní pro češtinu.
4. `src/game/curriculum.ts` – `foldLetters`, `letterOrder`, `letterPool`, `numberPool`,
   `letterWord`, `choiceCount`.
5. `src/game/mastery.ts` – `TrackState` a operace nad ním; všechny vracejí **nový** objekt,
   nic nemutují.
6. `src/game/orders.ts` – `generateOrder` podle pseudokódu níž.
7. `src/game/save.ts` – `createSave`, `parseSave`, `readSave`, `writeSave`, `resetSave`,
   `withSettings` nad `SAVE_KEY`/`SAVE_VERSION` z `./version`.
8. `src/main.ts` – při startu `const save = readSave(window.localStorage)`; v DEV navěsit
   globály `__save`, `__settings`, `__game` (viz Kontrakt). Scény se zatím nemění.
9. Testy a `docker compose run --rm test`, `check`, `build`.

**Klíčová rozhodnutí**

- **Prvky obou drah jsou řetězce.** `TrackState.active` i klíče `scores` jsou vždy
  `string` – písmeno `'K'`, číslo `'3'`. Dráhy tak sdílejí jeden typ a uložený JSON má
  jednotný tvar. Převod na číslo se děje **jen** na hranici generátoru, když se skládá
  `OrderItem` (`amount: Number(element)`), a zpátky přes `String(value)`. Nikde jinde se
  netypuje ani neparsuje. Alternativa (generický `TrackState<T>`) by prolezla do save i do
  všech testů a nic nepřinesla.
- **Pořadí písmen** (kap. 5.4, upřesněno v 0.4): 1) písmena jména dítěte v pořadí výskytu,
  diakritická **přeskočit**; 2) počáteční písmena členů rodiny, diakritická **složit**
  (Šimon → S); 3) `FREQUENT_LETTERS`; 4) zbytek základní sady abecedně. Duplicity se
  zahazují, výsledek vždy obsahuje všech 22 základních písmen právě jednou. Bez nastavení
  vyjde rovnou `FREQUENT_LETTERS` + zbytek – hra musí fungovat i bez jediného jména.
- **Sada stupně vs. aktivní prvky.** Stupeň určuje *pool* (co všechno smí přijít),
  `TrackState.active` je *aktuální sada* (co už přišlo). P1 a Č1 startují s celým poolem
  (4 písmena ze jména, čísla 1–5 – ta dcera zná); od P3 dál je pool větší a roste po jednom
  přes `maybeIntroduce`. Pooly jsou napevno:

  | Stupeň | Pool písmen | Pool čísel |
  |---|---|---|
  | 1 | první 4 z `letterOrder` | 1–5 |
  | 2 | písmena jména + iniciály rodiny, doplněné z pořadí na **minimálně 8** | 1–10 |
  | 3 | prvních **14** z `letterOrder` | 1–10 |
  | 4 | prvních 14 **+ diakritická písmena ze jména** (návrh 5.2; přidá je STEP-24, do té doby stejné jako stupeň 3) | 1–10 |
  | 5 | všech 22 (+ diakritika ze stupně 4) | 1–10 |

  Minimum 8 na P2 a číslo 14 na P3 návrh nechává otevřené („~14“); volím je tady, aby sada
  rostla i u krátkého jména a malé rodiny.
- **Střídání drah** (kap. 5.3): lichá objednávka číselná, sudá písmenková; v číselné dráze
  se střídá `count` a `digit`, začíná se počítáním. Je to čistá funkce `index`, takže se dá
  testovat bez náhody a dcera dostane mezi dvě nová písmena vždycky jistý úspěch.
- **Generátor vrací hotovou nabídku na polici** (`choices` = správná odpověď + distraktory,
  už zamíchané). Scéna pak jen kreslí pole – nemá vlastní logiku ani vlastní náhodu.
  `choiceCount(level)` platí pro obě dráhy a použije se stupeň **té dráhy**, ze které
  položka je: P1/Č1 → 3 věci na polici, od P2/Č2 → 4.
- **Distraktory** (kap. 5.4): přednostně ze zvládnutých prvků (skóre ≥ 3), s vyloučením
  tvarově podobných dvojic (`CONFUSABLE_LETTERS`, `CONFUSABLE_DIGITS`). Když kandidátů není
  dost, pravidlo se postupně uvolňuje (nezvládnuté prvky → i podobné tvary) a v krajním
  případě je nabídka kratší; **nikdy** se nezopakuje správná odpověď a nikdy to nespadne.
- **„Nic dvakrát za sebou“ dostane generátor zvenčí** jako `avoid: string[]` (a `avoidFruit`).
  Předchozí objednávka je při přesném střídání vždycky z druhé dráhy, takže odkaz na ni by
  byl k ničemu; volající (STEP-08) proto pošle prvky **poslední objednávky téže dráhy** –
  `orderElements(lastLetterOrder)`. Když by po vyloučení nezbyl žádný kandidát (sada o
  jednom prvku), pravidlo se vzdá a objednávka vznikne.
- **Náhoda se vstřikuje** (`rng?: Rng`). V produkci `systemRng`, v testech `createRng(seed)`.
  Bez toho by generátor nešlo testovat jinak než statisticky.
- **Úložiště se vstřikuje** (`StorageLike`), takže testy běží v Node bez `localStorage` a
  jde otestovat i úložiště, které vyhazuje výjimky (Safari v privátním režimu, plná kvóta).
- **Uložená data se opravují, ne zahazují.** `parseSave` vrátí `null` (→ čerstvá hra) jen
  když JSON nejde přečíst nebo nesedí `version`. Všechno ostatní se dorovná: chybějící
  pole doplní z `createSave`, skóre se ořeže na 0–5 a zahodí u prvků mimo sadu, stupeň na
  1–5, `ordersCompleted`/`stars` na nezáporná celá čísla, `lastPlayed` musí být
  `YYYY-MM-DD`, jinak `null`. Když `active` není pole řetězců, dráha se postaví znovu
  z poolu svého stupně (skóre se zachovají u prvků, které v ní zůstanou). Rukou upravený
  `localStorage` tak nesmaže pokrok.
- **Změna nastavení přepočítá dráhu písmen** (`withSettings`): nové pořadí → nový pool →
  `active` se ořízne na stejný počet prvků; skóre písmen, která v sadě zůstala, se zachová,
  ostatní se zahodí. Bez toho by hra po vyplnění jména dál zkoušela neutrální písmena.
- **Postup pokroku (`ordersCompleted`, `stars`, `lastPlayed`) se v tomhle kroku jen ukládá**,
  nikdo ho nezvyšuje – to dělá STEP-08/STEP-11 přes rozkopírování objektu (`{ ...save,
  progress: { ... } }`). Žádná pomocná funkce k tomu schválně nevzniká, dokud není známo,
  kdo ji volá.
- **Známé omezení:** `__settings` je jen v DEV buildu, na nasazené hře na Pages tedy skutečná
  jména nastavit nejdou. Do STEP-16 (rodičovský koutek) proto první testy s dcerou běží buď
  s neutrální sadou písmen, nebo na notebooku, kde je konzole. Alternativa (jméno v URL) je
  vyloučená – osobní data nepatří do adresního řádku.

**Pseudokód generátoru**

```
generateOrder({ settings, tracks, index, avoid = [], avoidFruit = null, rng = systemRng }):
  if index is odd:                            # číselná dráha
     turn = ceil(index / 2)
     item = (turn is odd) ? countItem() : digitItem()
  else:                                       # písmenková dráha
     item = letterItem()
  return { index, items: [item] }

countItem():
  element = pickTarget(tracks.numbers, avoid)           # '1'–'5' na Č1
  fruit   = pick(rng, FRUITS without avoidFruit)
  return { type: 'count', fruit, amount: Number(element) }

digitItem():
  element = pickTarget(tracks.numbers, avoid)
  size    = choiceCount(tracks.numbers.level)
  choices = buildChoices(element, tracks.numbers, size, CONFUSABLE_DIGITS)
  return { type: 'digit', value: Number(element), choices: choices.map(Number) }

letterItem():
  element = pickTarget(tracks.letters, avoid)
  size    = choiceCount(tracks.letters.level)
  return { type: 'letter', letter: element, word: letterWord(element, settings),
           choices: buildChoices(element, tracks.letters, size, CONFUSABLE_LETTERS) }

pickTarget(track, avoid):
  candidates = track.active without avoid
  if candidates is empty: candidates = track.active     # jednoprvková sada – pravidlo se vzdá
  return pick(rng, candidates)

buildChoices(target, track, size, confusable):
  others   = track.active without target
  mastered = others with score >= 3
  distinct = e => (target, e) not in confusable
  pool = mastered.filter(distinct)
  if pool.length < size - 1: pool += others.filter(distinct)
  if pool.length < size - 1: pool += mastered + others   # uvolnit i tvarovou podobnost
  return shuffle(rng, [target, ...sample(rng, unique(pool), size - 1)])
```

## Kontrakt

```ts
// src/game/rng.ts
export type Rng = () => number; // [0, 1)
export function createRng(seed: number): Rng;
export const systemRng: Rng;
export function pick<T>(rng: Rng, items: readonly T[]): T; // prázdné pole → RangeError
export function sample<T>(rng: Rng, items: readonly T[], count: number): T[]; // bez opakování, může vrátit méně
export function shuffle<T>(rng: Rng, items: readonly T[]): T[];

// src/game/settings.ts
export type FamilyRole = 'mother' | 'father' | 'brother' | 'sister' | 'grandmother' | 'grandfather';
export interface FamilyMember { readonly name: string; readonly role: FamilyRole }
export interface ChildProfile { readonly name: string; readonly vocative: string }
export interface Settings { readonly child: ChildProfile | null; readonly family: readonly FamilyMember[] }
export const EMPTY_SETTINGS: Settings; // { child: null, family: [] }
export function normalizeSettings(input: unknown): Settings; // max 8 členů, prázdná jména a neznámé role pryč
```

```ts
// src/data/curriculum.ts
export const BASE_LETTERS: readonly ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','R','S','T','U','V','Z'];
export type Letter = (typeof BASE_LETTERS)[number];

export const FREQUENT_LETTERS: readonly Letter[];
// ['O','S','T','A','M','U','D','N','R','J','B','V','Z','H','C','F','G']   (návrh 5.4 bod 3)

export const LETTER_WORDS: Readonly<Record<Letter, string>>;
// A auto · B balón · C cibule · D dům · E ementál · F fotbal · G guma · H houba · I iglú
// J jablko · K kočka · L lev · M maminka · N nos · O oko · P pes · R ryba · S slon
// T táta · U ucho · V vlak · Z zebra                                       (návrh 5.6)

export const ROLE_WORDS: readonly { readonly role: FamilyRole; readonly letter: Letter; readonly word: string }[];
// pořadí = priorita při kolizi písmene (návrh 5.6):
// mother→M maminka · father→T táta · brother→B brácha · sister→S ségra
// grandmother→B babička · grandfather→D děda

export const DIACRITICS: Readonly<Record<string, Letter | null>>;
// Á→A Č→C Ď→D É→E Ě→E Í→I Ň→N Ó→O Ř→R Š→S Ť→T Ú→U Ů→U Ž→Z · Ý→null (Y není v abecedě)

export const CONFUSABLE_LETTERS: readonly (readonly [Letter, Letter])[];
// ['O','C'] ['O','D'] ['C','G'] ['E','F'] ['M','N'] ['P','R'] ['U','V'] ['I','J']
// ['S','Z'] ['B','R'] ['H','N']                                          (návrh 5.4)

export const CONFUSABLE_DIGITS: readonly (readonly [string, string])[];
// ['1','7'] ['6','9'] ['3','8'] ['5','6']   – řetězce, protože dráha drží prvky jako řetězce
//                                                                        (návrh 5.4)

export type FruitKind = 'strawberry' | 'blueberry' | 'cherry';
export const FRUITS: readonly FruitKind[];
```

```ts
// src/game/curriculum.ts
export type Level = 1 | 2 | 3 | 4 | 5;
/** Velká písmena bez duplicit; 'fold' složí diakritiku na základní tvar, 'skip' ji vynechá. */
export function foldLetters(text: string, mode: 'fold' | 'skip'): Letter[];
export function letterOrder(settings: Settings): Letter[];   // vždy všech 22 písmen, každé právě jednou
export function letterPool(settings: Settings, level: Level): Letter[]; // tabulka v Klíčových rozhodnutích
export function numberPool(level: Level): string[];          // Č1 → ['1'..'5'], Č2+ → ['1'..'10']
export function letterWord(letter: Letter, settings: Settings): string;
export function choiceCount(level: Level): number;           // 1 → 3, 2+ → 4 (věcí na polici včetně správné)

// src/game/mastery.ts
export const MASTERY_MAX: 5;
export const MASTERY_KNOWN: 3;
export const READY_RATIO: 0.8;
export interface TrackState {
  readonly level: Level;
  readonly active: readonly string[];                  // 'K' nebo '3' – vždy řetězce
  readonly scores: Readonly<Record<string, number>>;   // 0–5, klíč = prvek z active
}
/** initialSize chybí → celý pool; jinak prvních N prvků poolu. Skóre všech prvků začíná na 0. */
export function createTrack(level: Level, pool: readonly string[], initialSize?: number): TrackState;
export function scoreOf(track: TrackState, element: string): number;          // neznámý prvek → 0
export function isMastered(track: TrackState, element: string): boolean;      // skóre >= 3
export function recordSuccess(track: TrackState, element: string, firstTry: boolean): TrackState;
export function recordMistake(track: TrackState, element: string): TrackState;
export function isReadyForNewElement(track: TrackState): boolean;             // >= 80 % active má >= 3
export function maybeIntroduce(track: TrackState, pool: readonly string[]): TrackState;
export function canAdvanceLevel(track: TrackState, pool: readonly string[]): boolean; // celý pool je v active a >= 3
/** level + 1; active = dosavadní active (jen prvky z nextPool) + první nový prvek z nextPool;
 *  scores se ořežou na prvky nového poolu. */
export function advanceLevel(track: TrackState, nextPool: readonly string[]): TrackState;

// src/game/orders.ts
export type OrderItem =
  | { readonly type: 'count'; readonly fruit: FruitKind; readonly amount: number }
  | { readonly type: 'digit'; readonly value: number; readonly choices: readonly number[] }
  | { readonly type: 'letter'; readonly letter: Letter; readonly word: string; readonly choices: readonly Letter[] };
export interface Order { readonly index: number; readonly items: readonly OrderItem[] }
export interface OrderInput {
  readonly settings: Settings;
  readonly tracks: { readonly numbers: TrackState; readonly letters: TrackState };
  readonly index: number;                     // 1-based pořadí objednávky, řídí střídání drah
  readonly avoid?: readonly string[];         // prvky, které nemají přijít znovu (poslední objednávka téže dráhy)
  readonly avoidFruit?: FruitKind | null;
  readonly rng?: Rng;                         // výchozí systemRng
}
export function generateOrder(input: OrderInput): Order;
/** Klíče prvků objednávky pro `avoid`: count/digit → String(číslo), letter → písmeno. */
export function orderElements(order: Order): string[];

// src/game/save.ts
import { SAVE_KEY, SAVE_VERSION } from './version'; // ze STEP-01, nekopírovat
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export interface SaveProgress {
  readonly ordersCompleted: number;   // celé nezáporné číslo
  readonly stars: number;             // celé nezáporné číslo
  readonly lastPlayed: string | null; // 'YYYY-MM-DD' v místním čase, jinak null
}
export interface SaveData {
  readonly version: typeof SAVE_VERSION;
  readonly settings: Settings;
  readonly tracks: { readonly numbers: TrackState; readonly letters: TrackState };
  readonly progress: SaveProgress;
}
export function createSave(settings?: Settings): SaveData;   // Č1 s celou sadou 1–5, P1 se 4 písmeny
export function parseSave(raw: string | null): SaveData | null; // nečitelné / jiná verze → null, jinak opraví
export function readSave(storage: StorageLike): SaveData;       // nikdy nevyhodí, nikdy nevrátí null
export function writeSave(storage: StorageLike, data: SaveData): void; // výjimku úložiště spolkne
export function resetSave(storage: StorageLike): SaveData;      // smaže klíč a vrátí čerstvý záznam
export function withSettings(data: SaveData, settings: Settings): SaveData;
```

```ts
// src/main.ts – jen v DEV buildu (import.meta.env.DEV), v produkci nic z toho neexistuje
interface DevSave {
  read(): SaveData;
  write(data: SaveData): void;
  reset(): SaveData;
  raw(): string | null;                       // syrový řetězec z localStorage
}
interface DevSettings {
  get(): Settings;
  set(input: unknown): { settings: Settings; order: Letter[] }; // normalizuje, uloží, vrátí i pořadí písmen
  clear(): Settings;
}
interface DevGame {
  /** Bez stavu: pokaždé přečte uloženou hru; se `seed` je výsledek deterministický. */
  order(index?: number, seed?: number): Order; // výchozí index = 1
}
```

**Příklad – pořadí písmen** (smyšlená rodina z návrhu; skutečná jména jsou jen v nastavení):

```ts
const settings = {
  child: { name: 'Anička', vocative: 'Aničko' },
  family: [{ name: 'Lenka', role: 'mother' }, { name: 'Tomík', role: 'brother' }],
};
letterOrder(settings);
// → ['A','N','I','K', 'L','T', 'O','S','M','U','D','R','J','B','V','Z','H','C','F','G', 'E','P']
//    jméno (Č přeskočeno) → iniciály rodiny → častá písmena → zbytek abecedně
letterPool(settings, 1); // → ['A','N','I','K']
letterPool(settings, 2); // → ['A','N','I','K','L','T','O','S']   (doplněno z pořadí na 8)
letterPool(settings, 3); // → prvních 14: ['A','N','I','K','L','T','O','S','M','U','D','R','J','B']
letterWord('B', settings); // → 'brácha'  (v rodině je brácha; jinak by to byl 'balón')
letterWord('E', settings); // → 'ementál' (jméno dítěte se použije až s klipem, STEP-17)
```

**Příklad – objednávka** (`createRng(42)`, Č1/P1, sada písmen A N I K, čísla 1–5):

```ts
generateOrder({ settings, tracks, index: 2, avoid: ['A'], rng: createRng(42) });
// → { index: 2, items: [{ type: 'letter', letter: 'K', word: 'kočka', choices: ['A','K','N'] }] }
orderElements(order); // → ['K']
```

**Příklad – uložený záznam** (`localStorage['kk.save.v1']`):

```json
{
  "version": 1,
  "settings": { "child": { "name": "Anička", "vocative": "Aničko" },
                "family": [{ "name": "Lenka", "role": "mother" }] },
  "tracks": {
    "numbers": { "level": 1, "active": ["1","2","3","4","5"],
                 "scores": { "1": 3, "2": 2, "3": 0, "4": 0, "5": 0 } },
    "letters": { "level": 1, "active": ["A","N","I","K"],
                 "scores": { "A": 1, "N": 0, "I": 0, "K": 0 } }
  },
  "progress": { "ordersCompleted": 3, "stars": 3, "lastPlayed": "2026-08-24" }
}
```

## Akceptační kritéria

**Kurikulum**

- KDYŽ je v nastavení dítě „Anička“ a rodina Lenka (maminka) a Tomík (brácha), PAK
  `letterOrder` vrátí přesně pořadí z příkladu výše a `letterPool(…, 1)` vrátí `A, N, I, K`.
- KDYŽ se ptám na sadu vyšších stupňů téhož nastavení, PAK `letterPool(…, 2)` vrátí
  `A, N, I, K, L, T, O, S` (doplněno na 8) a `letterPool(…, 3)` prvních 14 z pořadí.
- KDYŽ je nastavení prázdné (`EMPTY_SETTINGS`), PAK `letterOrder` začíná `O, S, T, A, M, …`
  a celá hra funguje dál – žádná funkce nevyhodí výjimku a `letterPool(…, 1)` má 4 písmena.
- KDYŽ jméno obsahuje diakritiku, PAK se to písmeno v P1–P3 nevyskytne (Anička → bez „C“ ze
  „Č“), ALE počáteční písmeno člena rodiny s diakritikou se složí (Šimon → `S`).
- KDYŽ `letterOrder` dostane jakékoli nastavení, PAK výsledek obsahuje všech 22 základních
  písmen právě jednou (žádné duplicity, žádné chybějící).
- KDYŽ je v rodině brácha, PAK `letterWord('B')` vrátí „brácha“; KDYŽ v rodině není, PAK
  vrátí „balón“; KDYŽ je v rodině brácha i babička, PAK `B` je „brácha“ (priorita) a
  babička slovo nemění.
- KDYŽ se zeptám na slovo pro `E` v jakémkoli nastavení, PAK vyjde „ementál“ (jméno dítěte
  se sem dostane až se STEP-17, kdy bude klip).
- KDYŽ je stupeň dráhy 1, PAK `choiceCount` vrátí 3; KDYŽ je 2 a víc, PAK 4.

**Dráhy a skóre**

- KDYŽ prvek dostane úspěch na první pokus, PAK skóre stoupne o 1 nejvýš na 5; KDYŽ přijde
  chyba, PAK klesne o 1 nejméně na 0; KDYŽ přijde úspěch až po chybě, PAK se skóre nemění.
- KDYŽ má aspoň 80 % aktivní sady skóre ≥ 3 a v poolu zbývá další prvek, PAK `maybeIntroduce`
  přidá právě jeden nový prvek se skóre 0; KDYŽ podmínka neplatí nebo je pool vyčerpaný,
  PAK vrátí nezměněný stav.
- KDYŽ mají všechny prvky poolu stupně skóre ≥ 3, PAK `canAdvanceLevel` je `true`, jinak `false`.
- KDYŽ se dráha posune `advanceLevel`, PAK má stupeň o 1 vyšší, v `active` zůstanou dosavadní
  prvky plus právě jeden nový z nového poolu a skóre dosavadních prvků se zachovají.

**Generátor**

- KDYŽ je pořadí objednávky liché, PAK je položka z číselné dráhy, a KDYŽ sudé, PAK
  z písmenkové; KDYŽ jsou pořadí 1, 3, 5, 7, PAK typy vyjdou `count`, `digit`, `count`, `digit`.
- KDYŽ generátor vytvoří položku `letter` na P1, PAK `choices` obsahuje 3 různá písmena,
  právě jednou správné, a všechna jsou z aktivní sady dráhy.
- KDYŽ generátor vytvoří položku `digit` na Č1, PAK `value` je číslo 1–5 a `choices` jsou
  čísla (ne řetězce) obsahující `value` právě jednou.
- KDYŽ je v sadě dost zvládnutých prvků, PAK distraktory pocházejí z nich a nikdy nejsou
  tvarově podobné cíli (K × O ano, M × N ne, 1 × 7 ne).
- KDYŽ má dráha jediný aktivní prvek, PAK generátor vrátí platnou objednávku s kratší
  nabídkou a nespadne.
- KDYŽ `avoid` obsahuje prvek X, PAK ho nová objednávka nepoužije jako cíl – ledaže by
  v sadě žádný jiný nebyl.
- KDYŽ je zadané `avoidFruit`, PAK položka `count` použije jiný druh ovoce – ledaže by
  žádný jiný nezbýval.
- KDYŽ se generátor spustí dvakrát se stejným seedem a stejným vstupem, PAK vrátí shodnou
  objednávku (deterministicky testovatelné).

**Ukládání**

- KDYŽ je `localStorage` prázdný, poškozený (nevalidní JSON, `null`) nebo má jinou verzi,
  PAK `readSave` vrátí čerstvý záznam a nic nespadne.
- KDYŽ má uložený JSON správnou verzi, ale rozbitý obsah (chybějící `progress`, skóre 99,
  stupeň 0, skóre u písmene mimo sadu, `lastPlayed: "včera"`), PAK se hodnoty opraví
  (ořezané skóre, stupeň 1–5, `lastPlayed: null`) a pokrok se **nezahodí**.
- KDYŽ zápis do úložiště vyhodí výjimku (plná kvóta, privátní režim), PAK `writeSave` ji
  spolkne a hra běží dál.
- KDYŽ se zapíše a znovu načte záznam, PAK je obsahově shodný (round trip) a uložil se pod
  klíčem `SAVE_KEY` z `src/game/version.ts`.
- KDYŽ se zavolá `resetSave`, PAK je klíč z úložiště pryč a vrácený záznam má prázdné
  nastavení i vynulovaný pokrok.
- KDYŽ se do uložené hry doplní nastavení se jménem, PAK `withSettings` přepočítá pool i
  aktivní sadu písmen (stejný počet prvků), zachová skóre těch písmen, která v sadě zůstala,
  a skóre zmizelých písmen zahodí.

## Testy

- Unit (Vitest, `environment: 'node'`, žádný DOM):
  - `rng.test.ts` – stejný seed = stejná posloupnost, jiný seed = jiná; `sample` neopakuje a
    vrátí nejvýš tolik prvků, kolik jich je; `shuffle` zachová multimnožinu; `pick`
    z prázdného pole vyhodí `RangeError`.
  - `settings.test.ts` – `normalizeSettings` pro `null`, řetězec, chybějící pole, neznámou
    roli, prázdné jméno, 20 členů rodiny; doplnění `vocative`.
  - `curriculum.test.ts` – `foldLetters` (velikost písmen, `fold` × `skip`, znaky mimo
    abecedu, duplicity); pořadí písmen pro příklad z návrhu; prázdné nastavení; invariant
    „všech 22 právě jednou“; `letterPool` pro stupně 1–3 (včetně krátkého jména bez rodiny,
    kde se P2 doplňuje na 8) plus kontrolní tvrzení, že stupeň 5 vrátí všech 22 písmen;
    `numberPool`; `letterWord` s rolí, bez role i při kolizi brácha × babička; `choiceCount`.
  - `mastery.test.ts` – ořez 0–5, úspěch po chybě, hranice 80 % (přesně 4 z 5), zavedení
    jednoho prvku, vyčerpaný pool, `canAdvanceLevel`, `advanceLevel` (stupeň, jeden nový
    prvek, zachovaná skóre).
  - `orders.test.ts` – střídání drah pro pořadí 1–8, tvar položek (čísla jsou čísla,
    písmena písmena), `choices` (počet, cíl právě jednou, původ z aktivní sady, tvarová
    odlišnost), `avoid` i `avoidFruit`, jednoprvková sada, determinismus se seedem,
    `orderElements`.
  - `save.test.ts` – prázdné a poškozené úložiště, jiná verze, JSON se správnou verzí a
    rozbitým obsahem, round trip pod `SAVE_KEY`, vyhazující úložiště, `resetSave`,
    `withSettings` (přepočet sady, zachovaná i zahozená skóre).
- Spuštění: `docker compose run --rm test` (kontrola typů a formátu `docker compose run --rm check`).

## Ruční ověření

Dev server `docker compose --profile dev up`, `http://localhost:5173/mlsna-abeceda/`,
konzole DevTools (velikost tabletu na šířku 1024×768; logika je stejná i na mobilu):

- [x] `__save.read()` vrátí čerstvý záznam: `version: 1`, prázdné nastavení, `tracks.letters.active`
      = `['O','S','T','A']`, `tracks.numbers.active` = `['1','2','3','4','5']`.
- [x] `__settings.set({ child: { name: 'Anička', vocative: 'Aničko' }, family: [{ name: 'Lenka', role: 'mother' }, { name: 'Tomík', role: 'brother' }] })`
      vrátí pořadí `A, N, I, K, L, T, O, S, …` a `__save.read().tracks.letters.active` je `['A','N','I','K']`.
- [x] `__game.order(1)`, `__game.order(2)`, `__game.order(3)` dají po řadě položku `count`,
      `letter` (se třemi perníčky v `choices`, mezi nimi právě jednou správné písmeno) a `digit`.
- [x] `__game.order(2, 42)` vrátí dvakrát po sobě tutéž objednávku (seed drží).
- [x] Reload stránky → `__save.read()` má pořád vyplněné nastavení a stejnou sadu písmen.
- [x] Ruční rozbití: `localStorage['kk.save.v1'] = '{"version":1,"tracks":{}}'` → reload →
      `__save.read()` vrátí opravený záznam, konzole bez chyby.
- [x] `__save.reset()` → nastavení pryč, sada zpátky na `O, S, T, A`.
- [x] Hra sama se nezměnila: úvodní klepnutí → kuchyně, v konzoli žádná chyba a v záložce
      Network jen požadavky na `localhost`.
- [ ] NEOVĚŘENO – Totéž v rozměru mobilu na šířku (844×390) – jen kontrola, že bootstrap nespadne.

## DoD

- [x] Všechna akceptační kritéria splněna
- [x] Testy a build zelené
- [x] Ruční ověření projito (mimo rozměr mobilu – viz níž)
- [x] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

**Hotovo** (13 nových souborů, 1 změněný):

```
src/data/curriculum.ts        tabulky: 22 písmen, slova, role, diakritika, podobné dvojice, ovoce
src/game/rng.ts               createRng (mulberry32), systemRng, pick/sample/shuffle
src/game/settings.ts          Settings, EMPTY_SETTINGS, normalizeSettings, FAMILY_ROLES
src/game/curriculum.ts        foldLetters, letterOrder, letterPool, numberPool, letterWord, choiceCount
src/game/mastery.ts           TrackState + skóre, maybeIntroduce, canAdvanceLevel, advanceLevel
src/game/orders.ts            generateOrder, orderElements
src/game/save.ts              SaveData v1, createSave/parseSave/readSave/writeSave/resetSave/withSettings
src/game/*.test.ts            6 testovacích souborů (rng, settings, curriculum, mastery, orders, save)
src/main.ts                   načtení uložené hry při startu + DEV globály __save, __settings, __game
```

Kontrakt sedí beze změny signatur; žádná nová závislost, `package.json` nedotčený.

**Odchylky od plánu** (žádná nemění Kontrakt ani Rozsah):

1. `main.ts` nemá `const save = readSave(window.localStorage)`, ale `readSave(storage)` nad
   pomocnou funkcí `browserStorage()`. Důvod: samotný přístup k `window.localStorage` umí
   v prohlížeči s blokovanými daty webu vyhodit výjimku ještě před vstupem do `save.ts`;
   fallback je úložiště v paměti, hra tedy naběhne i tam. Proměnná `save` zanikla, protože
   načtený záznam zatím nikdo nepoužívá (scény ho dostanou v STEP-05).
2. `parseSave` navíc **ořízne `active` na pool svého stupně**, nejen zahodí skóre mimo sadu.
   Důvod: písmenková dráha musí obsahovat opravdu jen písmena – jinak by ručně dopsaná `"7"`
   v `localStorage` protekla do `OrderItem.letter` a `letterWord` by vrátil `undefined`.
   Prázdný výsledek se stejně jako u rozbitého `active` postaví znovu z poolu.
3. `foldLetters` nejdřív normalizuje text na NFC, aby rozložené „č“ (c + háček) dopadlo stejně
   jako složené; jinak by se z „Anička“ v režimu `skip` vyklubalo písmeno C.
4. Doplněné drobnosti nad rámec výčtu v Kontraktu (nic neubírají): `isLetter` v datech,
   `FAMILY_ROLES`, `MAX_FAMILY_MEMBERS` a pojmenované konstanty velikostí poolů.
5. Chování v místech, která plán nepopisoval: zápis skóre prvku mimo `active` stav nemění;
   `isReadyForNewElement` je pro prázdnou sadu `true` (je kam přidávat); `advanceLevel` se
   zastaví na stupni 5.

**Ověření**

- `docker compose run --rm test` – **94 testů v 8 souborech zelených** (z toho 85 nových).
- `docker compose run --rm check` – `tsc --noEmit` i `prettier --check` čisté.
- `docker compose run --rm build` – bez chyb a varování, `dist/assets/index-*.js` 10,89 kB
  (gzip 4,40 kB); `grep` v `dist/` nenašel `__save`, `__settings`, `__game` ani `__stage`,
  DEV globály tedy do produkce nejdou.
- Ruční ověření na dev serveru (Chrome, okno 1024×768), body podle checklistu výše:
  - `__save.read()` na čisté hře: `version: 1`, prázdné nastavení, písmena `O, S, T, A`,
    čísla `1`–`5`, `raw()` je `null` (zatím se nic nezapsalo). ✔
  - `__settings.set({ child: 'Anička' … Lenka/maminka, Tomík/brácha })` vrátilo pořadí
    `A N I K L T O S M U D R J B V Z H C F G E P` a sada písmen je `A, N, I, K`. ✔
  - `__game.order(1|2|3)` → `count` (4 jahody), `letter` (`I`, „iglú“, tři perníčky
    `A, K, I`), `digit` (`1`, nabídka `5, 3, 1`). ✔
  - `__game.order(2, 42)` dvakrát po sobě vrátilo identickou objednávku. ✔
  - Reload → nastavení i sada písmen zůstaly. ✔
  - `localStorage['kk.save.v1'] = '{"version":1,"tracks":{}}'` → reload → opravený záznam
    (stupeň 1, `O, S, T, A`, čísla 1–5, pokrok vynulovaný), konzole bez chyby. ✔
  - `__save.reset()` → klíč zmizel, sada zpátky na `O, S, T, A`. ✔
  - Hra sama beze změny: úvodní klepnutí → kuchyně, konzole bez chyb, v Networku jen
    požadavky na `localhost`. ✔
- **Neověřeno:** rozměr mobilu na šířku (844×390). Okno prohlížeče na příkaz k změně velikosti
  nereagovalo (stránka dál hlásila stejný viewport), takže tvrzení „na mobilu nespadne“ nemám
  čím podložit. Krok nepřidává nic vizuálního ani nic závislého na rozměru okna a chování
  scény na malém displeji bylo ověřené v STEP-02; kontrolu je nejlepší zopakovat v STEP-04,
  až bude v kuchyni co ukazovat.

**Návrhy mimo rozsah** (k zapsání do dalších kroků, tady schválně neudělané):

- STEP-08 musí generátoru posílat `avoid` a `avoidFruit` z poslední objednávky **téže** dráhy
  (`orderElements(lastOrder)`), jinak pravidlo „nic dvakrát za sebou“ nebude fungovat.
- `progress.ordersCompleted`, `stars` a `lastPlayed` se ukládají, ale nikdo je nezvyšuje –
  patří do STEP-08/STEP-11 spolu s koncem sezení.
- U velmi dlouhého jména a velké rodiny může pool stupně 2 přerůst pool stupně 3 (min. 8 × 14
  z plánu). Na skutečných jménech to nenastane, ale STEP-10 by měl pravidlo dotáhnout.
- Skutečná jména jdou zatím nastavit jen konzolí v DEV buildu – rodičovský koutek je STEP-16.
