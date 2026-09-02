# STEP-20 · Slabikář a mluvící police

Status: proposed
Milník: M3 · Po: [STEP-11](./STEP-11-adaptive-selection-and-levels.md), [STEP-16](./STEP-16-shop-scene-and-decorations.md) · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 5.7 (nová), 12

## Shrnutí

**Požadavek dcery** (2. 9. 2026, zapsaný sem doslova, ať se nezmění překladem): _„Někde v rohu bude
tlačítko na slabikář případně seznam čísel. Tam když na jednotlivá písmena klikne, tak jí to řekne,
co je to za písmeno. Například T jako táta. Zároveň když není v kuchyni žádný zákazník a na polici
jsou písmenka a čísla, tak kliknutím na ně by bylo taky super, aby se řeklo, co to je.“_

Krok tedy přidá **dvě věci ze stejného nápadu**: novou scénu **slabikář** (deska se všemi 22 písmeny
a deseti číslicemi, klepnutí řekne, co to je) a **mluvící police v kuchyni** (mezi objednávkami už
teď na policích stojí skutečná písmena a číslice z aktivní sady, jen jsou hluché).

Je to poprvé, co hra nabídne **volné prohlížení bez úkolu** – nikdo nic nechce, nedá se udělat chyba
a nedá se nic získat. Zapadá to do pravidla 2 („nedá se prohrát“) tak dokonale, že to působí, jako
by tam ta scéna měla být od začátku.

**Hlas nestojí nic.** Věty „Ká jako kočka.“ (`letter.word.k.kocka`) i „To je pětka.“
(`wrong.digit.5`) jsou v manifestu od STEP-07 a klipy jsou vygenerované a commitnuté. **Krok nepřidá
ani jednu hlášku a generátor se nepouští** – manifest zůstává přesně tak velký, jak ho krok zastihne
(dnes 433; STEP-18 a STEP-19 ho zvednou, tenhle krok ne).

Slabikář navíc **ukazuje postup**: dlaždice má tři stavy podle skóre zvládnutí, takže dcera vidí
na jednom obrázku, co už umí a co ji ještě čeká.

## Rozsah

**V rozsahu**

- Nová scéna `primer` (`SceneName` o jednu delší): deska s 22 písmeny a 10 číslicemi, klepnutí
  přehraje větu, dveře zpátky do kuchyně.
- Tři stavy dlaždice podle `mastery.ts`: **nezavedené** (bledé), **učí se** (plná barva),
  **umí** (mátová). Nezavedená dlaždice je klepatelná úplně stejně jako ostatní (rozhodnutí autora).
- Tlačítko v **levém dolním rohu kuchyně**, dostupné i **za zavřenou mříží** (rozhodnutí autora),
  spící během objednávky.
- **Mluvící police**: klepnutí na hluchý perníček nebo svíčku, když u pultu nikdo není, řekne,
  co to je.
- Čistá logika desky v `src/game/primer.ts` (bez DOM) a její testy.
- Kapitola 5.7 v `docs/navrh-hry.md`, řádek v tabulce milníků (kap. 12) **a odstavec v kap. 4,
  „Konec sezení“**: slabikář je první věc, která za mříží zůstává živá, a kapitola dnes tvrdí opak.

**Mimo rozsah**

- **Nové hlášky ani zvuky.** Recykluje se, co je vygenerované; `docker compose run --rm voice` se
  nepouští.
- **Skládání slov a čtení** (P3–P5, STEP-27 až STEP-29). Slabikář je prohlížečka, ne stupeň dráhy –
  klepnutí do skóre zvládnutí **nezapisuje nic**.
- **Diakritika.** Deska ukazuje 22 základních písmen; Š, Č a spol. přijdou s P4 (STEP-28), a až
  budou, přibudou sem samy – deska čte `BASE_LETTERS`.
- Malá písmena, výslovnost hlásky zvlášť („kuh“ × „ká“), procvičovací režim.
- Jakákoli změna generátoru objednávek, ukládání nebo formátu save.

## Implementace

**Soubory**

```
src/game/primer.ts             (nový)  model desky: prvek + jeho stav; bez DOM
src/game/primer.test.ts        (nový)
src/art/primer.ts              (nový)  dlaždice ve třech stavech, deska, ikona slabikáře, dveře zpět
src/scenes/primer/index.ts     (nový)  scéna
src/scenes/primer/style.css    (nový)
src/art/layout.ts              (změna) primerLayout(), `primer` v KitchenLayout
src/stage/scenes.ts            (změna) SceneName += 'primer'
src/main.ts                    (změna) registrace scény, __scenes už funguje sám
src/game/speech.ts             (změna) primerLetterSpeech(), primerDigitSpeech()
src/scenes/kitchen/index.ts    (změna) tlačítko slabikáře, uspávání s košíkem, browse na policích
src/scenes/kitchen/choice-item.ts (změna) režim prohlížení nad hluchou výzdobou police
src/scenes/kitchen/style.css   (změna) tlačítko nad mříží (z-index 7)
src/style.css                  (změna) nic, jen kdyby scéna potřebovala vlastní pozadí
docs/navrh-hry.md              (změna) nová kap. 5.7, řádek M3 v kap. 12
docs/plan.md                   (změna) stav kroku
```

**Knihovny** – žádné.

**Kroky**

1. **`src/game/primer.ts`** – čistý model (Kontrakt níž). Čte `BASE_LETTERS` z `data/curriculum.ts`
   a obě `TrackState` ze save; nic nezapisuje. **Číslice si vyrábí sám jako pevných `'1'`…`'10'`,
   `numberPool()` se tu použít NESMÍ**: ta funkce vrací na stupni Č1 jen pětku prvků
   (`src/game/curriculum.ts:89`), takže by nová hra dostala desku s pěti číslicemi místo deseti –
   přímo proti kritériu „vždycky 32 dlaždic“.
2. **`src/game/speech.ts`** – dvě funkce, které vracejí **existující** id (přesný tvar v Kontraktu).
   Komentář u nich musí říct, proč se u číslice sáhne po `wrong.digit.N`: text té hlášky je „To je
   pětka.“, což je čisté pojmenování bez výtky, a nové id by znamenalo nový klip za totéž.
3. **`src/art/primer.ts`** – dlaždice (96 × 96, ≥ 88, pravidlo 3) ve třech barevných stavech,
   ikona slabikáře do rohu kuchyně a dveře zpět (stejný `shopDoor()` vzor, vlastní kresba není
   potřeba – dveře se dají použít znovu). **Ikona je otevřená knížka s ⟨A B C⟩ na stránce** – ne
   nápis a ne instrukce: hra už dneska kreslí písmena na perníčky a číslice na svíčky, protože
   písmeno je učivo, ne UI (pravidlo 1). Znaky na ikoně jsou obrázek knížky, ne pojmenování
   konkrétního písmene, a nic se z nich nemá číst.
4. **`src/art/layout.ts`** – `primerLayout(stageWidth)` a `primer: Rect` v `KitchenLayout`.
   Pozor: přibude do `Object.values(kitchenLayout(width))`, takže se na něj vztahuje invariant
   „aspoň 8 px mezi libovolnými dvěma krabicemi“ – levý dolní roh je volný (nejbližší je zákazník,
   který končí na `y = 520`).
5. **`src/scenes/primer/index.ts`** – scéna: vykreslí desku z `primerLayout()` a `primerBoard()`,
   klepnutí přehraje `pling` a větu, dveře volají `ctx.go('kitchen')`.
6. **`src/stage/scenes.ts` + `src/main.ts`** – zaregistrovat.
7. **Tlačítko v kuchyni** – `z-index: 7` v `kitchen/style.css`, tedy **nad mříží** (5) i nad
   klávesnicí zámku (6); během otevřené klávesnice se schová (`hidden`), jinak by přes ni leželo.
   Uspává se na týchž osmi místech, kde se uspává košík – `stars.shop(ready)` (metoda se jmenuje
   `shop`, ne `ready`; `src/scenes/kitchen/stars.ts:25`, volání v `scenes/kitchen/index.ts` na
   řádcích 244, 376, 379, 387, 447, 450, 494 a 512). **Jediná odchylka je řádek 376**
   (`stars.shop(false); // behind the shutter nothing is bought either`): tam košík usíná, kdežto
   slabikář **zůstává vzhůru** – za mříží žádná objednávka neběží a učení se nezavírá.
8. **Mluvící police** – `createChoiceItem` dostane `browse(on: boolean)` a `onBrowse(element)`.
   Kuchyně zapíná prohlížení **jen s prázdným pultem**, ne podle toho, že je police hluchá: `clear()`
   se volá i na polici, kterou běžící objednávka nepoužívá (objednávka na písmenko vyčistí polici
   s číslicemi), a mluvící police během objednávky by byla nápověda zadarmo.
9. Testy, `check`, `build`, ruční ověření, zápis do návrhu a do `plan.md`.

**Klíčová rozhodnutí**

1. **Nula nových klipů.** Písmeno řekne `letter.word.<x>.<slovo bez diakritiky>` („Ká jako kočka.“,
   u rodinných rolí „Em jako maminka“ podle nastavení – `letterWord()` to už řeší), číslice
   `wrong.digit.<n>` („To je pětka.“). Id `wrong.*` je historické jméno pro „To je ká.“ / „To je
   pětka.“, což je čisté pojmenování bez výtky; vlastní sada by byla 32 klipů za totéž. V `speech.ts`
   proto vzniknou dvě pojmenované funkce, ať v kuchyni ani ve slabikáři nestojí `wrongLine()` –
   ale **id si nesmí skládat samy**, volají `letterWordLine()` a `wrongLine()`.
2. **Deska je abecední, ne podle pořadí učení.** `letterOrder()` závisí na jméně dítěte a na rodině,
   takže by se deska každému přerovnala a po změně nastavení by se písmenka stěhovala. Slabikář má
   smysl právě tím, že „její“ písmeno je pořád na stejném místě. Postup je vidět na barvách, ne na
   pořadí.
3. **Deska ukazuje všechno, i to, co hra ještě nezavedla** (rozhodnutí autora). Nezavedená dlaždice
   je **bledá, ale plně klepatelná** a řekne totéž co ostatní. Není to spoiler: dráha se řídí skóre
   zvládnutí, a to se tady nezapisuje. Zároveň je to ta „vidí svůj progress“ část požadavku – tři
   odstíny na jedné desce řeknou beze slov, kam se dcera dostala.
4. **Tři stavy, ne pět.** Skóre je 0–5, ale zobrazit pět odstínů by znamenalo pět barev, které
   dcera nemá jak odlišit. Hranice jsou ty, které už hra používá: mimo `active` = nezavedené,
   v `active` se skóre < `MASTERY_KNOWN` = učí se, jinak umí.
5. **Slabikář nemá hvězdičku ani fajfku.** Hvězdička je v téhle hře měna (obchůdek) a fajfka znamená
   „koupeno“; použít je pro „umí“ by mátlo. Stav nese jen barva dlaždice.
6. **Slabikář je dostupný i za mříží** (rozhodnutí autora). Cena je známá a zapisuje se sem: konec
   sezení tím přestává být úplná stopka. Argument pro: slabikář nemá odměnu, nepřičítá hvězdičky
   a nepohne s postupem – je to knížka, a knížka se nezavírá s kuchyní.
7. **Klepnutí do skóre nezapisuje nic.** Ani plus, ani minus, ani na desce, ani na polici. Jinak by
   šlo skóre nafouknout ťukáním a adaptivní výběr by přestal odpovídat tomu, co dcera opravdu umí.
8. **Prohlížení na polici se zapíná ze scény, ne z police.** Viz krok 8 – je to jediné místo, kde
   se dá udělat chyba, která by pomohla podvádět.
9. **Největší riziko kroku je tlačítko nad mříží, a je to nová půda.** Dneska přes mříž neprojde
   **nic**: `.kitchen-closing` je celoobrazovková vrstva (`inset: 0`, `z-index: 5`), která si bere
   všechna klepnutí sama, a zámek, který za ní funguje, leží **uvnitř** ní, ne vedle ní. Tlačítko
   slabikáře bude první prvek, který mříž prostřelí zvenčí. Podle pravidel skládání vrstev to
   `z-index: 7` na sourozenci vyřeší, ale **ověřit se to musí jako první věc**, ne až na konci –
   a když to nevyjde, záložní řešení je stejné jako u zámku: druhé tlačítko uvnitř `.kitchen-closing`.

## Kontrakt

**`src/game/primer.ts`**

```ts
import { BASE_LETTERS } from '../data/curriculum';   // 22 základních písmen, abecedně
import { MASTERY_KNOWN, scoreOf, type TrackState } from './mastery';
import type { Settings } from './settings';         // jen pro speech.ts níž

/** Kde na cestě k prvku dcera je. Hranice jsou tytéž, jaké používá adaptivní výběr. */
export type PrimerState = 'new' | 'learning' | 'known';

export interface PrimerTile {
  /** 'K' nebo '5' – stejný tvar jako prvky v TrackState.active. */
  readonly element: string;
  readonly state: PrimerState;
}

export interface PrimerBoard {
  /** Vždycky všech 22 základních písmen, v abecedním pořadí (BASE_LETTERS). */
  readonly letters: readonly PrimerTile[];
  /** Vždycky '1'…'10', ať je dráha na jakémkoli stupni. */
  readonly digits: readonly PrimerTile[];
}

export function primerBoard(tracks: {
  readonly numbers: TrackState;
  readonly letters: TrackState;
}): PrimerBoard;

/** Kolik prvků z celé desky je zvládnutých – to, co dcera na desce „vidí“. */
export function primerProgress(board: PrimerBoard): { readonly known: number; readonly total: number };
```

Pravidlo stavu, jediné a společné pro obě dráhy:

```
mimo track.active                        → 'new'
v track.active a scoreOf < MASTERY_KNOWN → 'learning'
jinak                                    → 'known'
```

Dvě věci, které kontrakt vyžaduje výslovně, protože se na ně nedá spolehnout jinde:

- **Číslice jsou pevných `'1'`…`'10'`**, ne `numberPool(level)` (viz krok 1).
- **`track.scores` může chybět celé** – záznam z cizího nebo staršího buildu. `scoreOf()`
  (`src/game/mastery.ts:41`) dělá `track.scores[element] ?? 0` a na `undefined` by spadl, takže
  `primerBoard()` si musí `scores` ošetřit samo (`track.scores ?? {}`) a chybějící `active`
  považovat za prázdné. Rozbitý save nesmí zabít desku (pravidlo 2).

**Příklad**

```ts
primerBoard({
  letters: { level: 1, active: ['A', 'N'], scores: { A: 4, N: 1 } },
  numbers: { level: 1, active: ['1', '2', '3'], scores: { '1': 5, '2': 3, '3': 0 } },
});
// letters: [{A,'known'}, {B,'new'}, {C,'new'}, …, {N,'learning'}, …]  (22 dlaždic)
// digits:  [{'1','known'}, {'2','known'}, {'3','learning'}, {'4','new'}, … {'10','new'}]
// primerProgress(board) → { known: 3, total: 32 }
```

**`src/game/speech.ts`** – dvě nové funkce. **Žádnou novou konvenci id si nevymýšlejí**: obě jen
zavolají generátory, které v `src/data/lines.cs.ts` už jsou, a výsledek proženou `hasLine()`.

```ts
/** „Ká jako kočka.“ = letterWordLine(letter, letterWord(letter, settings)). */
export function primerLetterSpeech(letter: Letter, settings: Settings): readonly string[];
/** „To je pětka.“ = wrongLine(value); recykluje `wrong.digit.N`, viz rozhodnutí 1. */
export function primerDigitSpeech(value: string): readonly string[];
```

Skutečný tvar id (ověřeno v `lines.cs.ts`, ne odhadnuto):

| volání | id | text |
|---|---|---|
| `letterWordLine('K', 'kočka')` | `letter.word.k.kocka` | Ká jako kočka. |
| `letterWordLine('M', 'maminka')` | `letter.word.m.maminka` | Em jako maminka. |
| `letterWordLine('B', 'brácha')` | `letter.word.b.bracha` | Bé jako brácha. |
| `wrongLine('5')` | `wrong.digit.5` | To je pětka. |
| `wrongLine('10')` | `wrong.digit.10` | To je desítka. |

Pozor na dvě pasti, na kterých se dá tenhle krok celý utopit do ticha: `letterWordLine()` **zahazuje
diakritiku** ve slově (`slug()`, `lines.cs.ts:294` – „kočka“ → `kocka`), a `wrongLine()` má v id
**druh prvku** (`wrong.digit.5`, ne `wrong.5`). Proto se id nikdy nepíše ručně.

Slovo k písmenu dodá `letterWord(letter, settings)` z `src/game/curriculum.ts:95`, takže rodinné
role fungují samy: `primerLetterSpeech('B', settings)` → `['letter.word.b.bracha']`, když je v rodině
brácha, jinak `['letter.word.b.balon']`. Prvek, ke kterému klip není (`hasLine()` řekne ne), vrátí
**prázdné pole** – scéna pak mlčí a nic nespadne (pravidlo 2).

**`src/art/layout.ts`**

```ts
export const PRIMER_TILE = 96;            // ≥ 88 (pravidlo 3)
export const PRIMER_GAP = 16;
export const PRIMER_LETTER_COLUMNS = 8;   // 22 písmen = 8 + 8 + 6
export const PRIMER_DIGIT_COLUMNS = 5;    // 10 číslic = 5 + 5; deset v řadě se do 1024 nevejde

export interface PrimerLayout {
  /** 22 dlaždic v pořadí BASE_LETTERS, po řádcích. */
  readonly letters: readonly Rect[];
  /** 10 dlaždic '1'…'10', po řádcích. */
  readonly digits: readonly Rect[];
  /** Dveře zpátky do kuchyně, levý dolní roh – stejné místo jako v obchůdku. */
  readonly back: Rect;
}

export function primerLayout(stageWidth: number): PrimerLayout;

// v KitchenLayout přibude:
/** Tlačítko slabikáře, levý dolní roh; jediná věc v kuchyni, která přežije i mříž. */
readonly primer: Rect;
```

Geometrie (jeviště 1024 × 768, širší se jen vycentruje): řádky písmen na `y = 96, 208, 320`
(rozteč 112), řada je `8 × 96 + 7 × 16 = 880` široká a centrovaná; poslední řádek má šest dlaždic
a centruje se sám. Číslice na `y = 456` a `568`, řada `5 × 96 + 4 × 16 = 544`. Mezi sekcemi je
40 px. Dveře zpět `{ x: 16, y: 656, width: 96, height: 96 }`. Tlačítko v kuchyni
`{ x: 16, y: 656, width: 96, height: 96 }` – tedy na tomtéž místě, takže cesta tam i zpátky vede
přes stejný roh.

**`src/scenes/kitchen/choice-item.ts`** – dvě přibylá pole v `options` a jedna metoda:

```ts
/** Klepnutí na hluchou výzdobu police; volá se JEN když je prohlížení zapnuté. */
readonly onBrowse?: (element: string) => void;

// v ChoiceItemHandle:
/** Zapne/vypne prohlížení hluché police. Vypnuté je výchozí; objednávka ho nikdy nezapíná. */
browse(on: boolean): void;
```

## Akceptační kritéria

- KDYŽ dcera klepne na tlačítko v levém dolním rohu kuchyně, PAK se otevře slabikář.
- KDYŽ je na desce klepnuto na písmeno K, PAK zazní „Ká jako kočka.“ (a „B“ řekne „bé jako brácha“,
  pokud je brácha v nastavení).
- KDYŽ je na desce klepnuto na číslici 5, PAK zazní „To je pětka.“
- KDYŽ je klepnuto na **bledou** (nezavedenou) dlaždici, PAK zazní totéž co u ostatních – bledá
  dlaždice není hluchá.
- KDYŽ dcera klepne na druhou dlaždici dřív, než dozní první věta, PAK se první utne a začne druhá
  (žádná fronta, žádné překrývání hlasů).
- KDYŽ deska stojí, PAK má **32 dlaždic**: 22 písmen abecedně a 10 číslic, ať je dráha na jakémkoli
  stupni a ať je v save cokoli.
- KDYŽ má prvek skóre ≥ 3, PAK je jeho dlaždice ve stavu `known`; KDYŽ je v `active` se skóre < 3,
  PAK `learning`; KDYŽ v `active` není, PAK `new`.
- KDYŽ dcera klepne na cokoli ve slabikáři, PAK se **save nezmění** – ani skóre, ani hvězdičky,
  ani stav sezení.
- KDYŽ je kuchyně **zavřená mříží**, PAK je tlačítko slabikáře pořád vidět a funguje; ostatní
  kuchyně zůstává za mříží hluchá.
- KDYŽ je otevřená klávesnice rodičovského kódu, PAK je tlačítko slabikáře schované (nesmí ležet
  přes ni).
- KDYŽ **běží objednávka**, PAK je tlačítko slabikáře ztlumené a hluché (stejně jako košík) a
  **klepnutí na police mlčí** – i na tu polici, kterou objednávka nepoužívá.
- KDYŽ u pultu **nikdo není** a na policích stojí výzdoba, PAK klepnutí na perníček řekne, které je
  to písmeno, a na svíčku, která je to číslice; nic nikam neletí a nic se nezapisuje.
- KDYŽ (okraj) prvek nemá klip (`hasLine()` je `false`), PAK scéna mlčí a nespadne.
- KDYŽ (okraj) je save prázdný (nová hra, dvě aktivní písmena), PAK má deska pořád 32 dlaždic
  a 30 z nich je bledých.
- KDYŽ (okraj) přijde `primerLayout()` s nesmyslnou šířkou (`NaN`, 200, 4000), PAK se chová jako
  `shopLayout()` – ořízne se na 1024–1366.
- KDYŽ (okraj) se ze slabikáře jde zpátky do zavřené kuchyně, PAK je kuchyně pořád zavřená
  a minutka ukazuje správný zbytek (běží podle času v save, ne podle toho, kde dcera byla).

## Testy

- **`src/game/primer.test.ts`** – hranice tří stavů (skóre 2 × 3, prvek mimo `active`); deska má
  vždy 22 + 10 prvků; pořadí písmen je `BASE_LETTERS`; `primerProgress()` počítá jen `known`;
  prázdný/rozbitý `TrackState` (chybějící `scores`) nespadne a dá samá `new`.
- **`src/game/speech.test.ts`** – `primerLetterSpeech()` vrací id, které `hasLine()` zná, pro
  **všech 22 písmen** a pro obě varianty rodinných slov; `primerDigitSpeech()` totéž pro '1'…'10';
  neznámý prvek dá `[]`.
- **`src/art/layout.test.ts`** – `primerLayout()`: 22 + 10 obdélníků, žádné dva se nepřekrývají,
  všechny uvnitř jeviště, dlaždice ≥ 88; ořez šířky jako u `shopLayout()`; `kitchenLayout().primer`
  drží invariant 8 px vůči všem ostatním krabicím na 1024 i 1366.
- **`src/art/art.test.ts`** – dlaždice ve třech stavech se od sebe liší (jiná výplň), všechny nesou
  svůj znak; ikona slabikáře je platné SVG a **neobsahuje `<text>` se slovem** (pravidlo 1 – ikona
  je obrázek, ne nápis).
- Spuštění: `docker compose run --rm test`, pak `check` a `build`.

## Ruční ověření

- [ ] `docker compose --profile dev up`, iPad na šířku (1180 × 820). V kuchyni je vlevo dole
      ikona slabikáře; klepnout, deska najede.
- [ ] Klepnout na K, na M, na B – zazní „Ká jako kočka.“, „Em jako maminka.“, „Bé jako balón.“
      (nebo „brácha“, když je v nastavení).
- [ ] Klepnout na 3 a na 10 – „To je trojka.“, „To je desítka.“
- [ ] Rychle poklepat na tři dlaždice za sebou – hlas se utíná, nepřekrývá se, nic nezamrzne.
- [ ] Bledé dlaždice: v nové hře jsou skoro všechny bledé a **všechny mluví**. Po pár objednávkách
      musí být vidět, že některé zesílily.
- [ ] Dveře vlevo dole vrátí do kuchyně, kuchyně pokračuje, kde byla.
- [ ] **Během objednávky**: tlačítko slabikáře je ztlumené a nereaguje; klepnutí na perníčky na
      polici pořád normálně plní objednávku a **nekomentuje** je; klepnutí na druhou polici (tu,
      kterou objednávka nepoužívá) **mlčí**.
- [ ] **S prázdným pultem** (po dokončení objednávky, před zazvoněním): klepnutí na perníček
      na polici řekne písmeno, na svíčku číslici, nic neletí, zvoneček pořád funguje.
- [ ] **Za mříží** (bez konzolového zkratu na zavírání: buď deset objednávek, nebo
      `__save.write({ ...__save.read(), session: { orders: 10, lastOrderAt: Date.now(),
      closedFrom: Date.now(), closedUntil: Date.now() + 600000 } })` a reload): tlačítko slabikáře je vidět nad
      mříží a funguje; zbytek kuchyně je hluchý; po návratu je mříž pořád dole a minutka sedí.
- [ ] Otevřít klávesnici zámku – tlačítko slabikáře zmizí; po zavření je zpátky.
- [ ] `__save.read()` před a po deseti klepnutích ve slabikáři: **beze změny**.
- [ ] Totéž v rozměru mobilu na šířku (844 × 390): deska se vejde, dlaždice jsou pořád nad 88
      logických px.

## DoD

- [ ] Všechna akceptační kritéria splněna
- [ ] Testy a build zelené
- [ ] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [ ] `navrh-hry.md` má kap. 5.7 a slabikář v tabulce milníků, `docs/plan.md` aktualizovaný
- [ ] Výsledek implementace vyplněn

## Výsledek implementace

_(vyplní /implement-step)_
