# STEP-15 · Obchůdek: katalog, nákup a odemykání (logika)

Status: done
Milník: M3 · Po: [STEP-13](./STEP-13-mergeable-save-format.md) · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 7 (bod 3), 5.6, 6, 9.1

## Shrnutí

Hvězdičky jsou zatím jenom počítadlo: `completeOrder()` je přičítá do `stars.earned` a utratit se
nedají. Tenhle krok z nich udělá měnu. Dodá **katalog zboží** (co se prodává a za kolik), **čistou
logiku nákupu** nad `StarsState` ze STEP-13 (`earned` + `purchases` se zaplacenou cenou, zůstatek
se dopočítává) a hlavně **brány, kterými se koupené věci propíšou do hry**: generátor objednávek se
napříště ptá na odemčené ovoce a fronta zákazníků na odemčená zvířátka. Do kroku patří i obsah,
který katalog nabízí a který kuchyně už umí nakreslit sama – **malina** jako čtvrté ovoce
a **žabka** jako čtvrtý zákazník, včetně hlášek a zvuků, aby se generátory pouštěly jednou.

Ve hře po tomhle kroku **není vidět nic nového**: koupit se dá jedině z konzole, protože regál,
košík a potvrzení ✓/✗ jsou scéna, a ta je STEP-16. Zato je hotová celá nekreslená polovina
obchůdku: co se prodává, co se stane, když hvězdičky nestačí, co koupě odemkne, jak to přežije
reload a jak se to sloučí se záznamem z druhého zařízení (`purchases` se slučují už od STEP-13).

Krok je vědomě rozdělený (rozhodnutí autora, srpen 2026): STEP-15 je logika a data, STEP-16 scéna
obchůdku, košík vedle hvězdiček a výzdoba kuchyně. Z odemykání pak žije i STEP-19 (zmrzlinka jako
další řádek katalogu).

## Rozsah

**V rozsahu**

- `src/data/shop.ts` (nový) – katalog šesti věcí: id, druh, cena, český název, co odemyká.
- `src/game/shop.ts` (nový) – čistá logika: nabídka a její stavy, kolik hvězdiček chybí, koupě,
  a čtecí funkce `unlockedFruits()`, `unlockedCustomers()`, `ownedDecorations()`.
- `src/game/orders.ts` – `OrderInput.fruits`: generátor bere druhy ovoce od volajícího, výchozí
  je startovní trojice.
- `src/game/session.ts` – generátor dostává odemčené ovoce, fronta zákazníků odemčená zvířátka;
  nové `buy(id)` jako **jediné místo, kde se koupě zapisuje**.
- `src/data/curriculum.ts` – `FruitKind` o `'raspberry'`, nová konstanta `STARTER_FRUITS`.
- `src/data/customers.ts` – `CustomerId` o `'frog'`, řádek v `CUSTOMERS`, `isCustomerId`.
- `src/art/fruit.ts`, `src/art/frog.ts` (nový), `src/art/customers.ts`, `src/art/svg.ts` (barvy
  do palety) – malina a žabka; kuchyně je pak kreslí bez jediné změny ve scéně.
- `src/data/lines.cs.ts` – **49 nových hlášek** (30 malinových + 19 obchůdkových), manifest roste
  z 321 na **370**; běh `docker compose run --rm voice` a commit klipů.
- `src/data/sfx.ts` – **4 nové efekty** (`customer.frog.hello`, `customer.frog.yum`, `shop.buy`,
  `shop.rattle`), 15 → **19**; běh `docker compose run --rm sfx` a commit klipů.
- `src/game/speech.ts` – `shopAskSpeech()`, `shopBoughtSpeech()`, `shopShortSpeech()`,
  `createShopHelloPicker()`, `shopPreload()`.
- `src/main.ts` – DEV handle `__shop` (nabídka, koupě, přidání hvězdiček pro ruční ověření).
- Přečíslování roadmapy: nový řádek STEP-16 (scéna obchůdku), zbytek se posune o jedno číslo,
  a odkazy `STEP-NN` v komentářích kódu se srovnají (seznam níž).
- Testy: nový `src/game/shop.test.ts` a doplnění stávajících.

**Mimo rozsah**

- **Scéna obchůdku** – regál, ceny v prázdných hvězdičkách, poskočení věci, otázka a velké ✓/✗,
  zachrastění při nedostatku, košík vedle počítadla hvězdiček, návrat do kuchyně (STEP-16).
- **Výzdoba v kuchyni** – kresby kytky, záclon, kočičky a rádia a jejich místa v kuchyni jsou taky
  STEP-16; katalog je zatím jen nabízí a `ownedDecorations()` vrací jejich id.
- Album (STEP-17), překvapení (STEP-18), zmrzlinka (STEP-19), rodičovský koutek (STEP-20).
- VIP zákazníci (král, dráček) a polevy/barvy z návrhu kap. 7 – přijdou, až bude regál stát.
- Prodej zpět, slevy, změna cen v rodičovském koutku, druhá měna.
- Nakupování za zavřenou mříží: **nebude** (rozhodnutí autora) – zavřeno je zavřeno, obchůdek se
  za mříží neotevře. Hlídá to scéna v STEP-16, tady se jen zapisuje do plánu.
- Přenos postupu mezi zařízeními (otevřená otázka návrhu kap. 13) – formát ze STEP-13 stačí.

## Implementace

**Soubory**

```
src/data/shop.ts          (nový)   katalog zboží; jen `import type`, aby ho přečetl i holý Node
src/game/shop.ts          (nový)   nabídka, dostupnost, koupě, odemčené sady
src/game/shop.test.ts     (nový)   testy logiky
src/art/frog.ts           (nový)   žabka v rozměru 260×320 jako ostatní zvířátka
src/data/curriculum.ts    (změna)  FruitKind + 'raspberry', STARTER_FRUITS
src/data/customers.ts     (změna)  CustomerId + 'frog', CUSTOMERS.frog, isCustomerId
src/data/lines.cs.ts      (změna)  malinové tvary, texty obchůdku, helpery a registrace (→ 370)
src/data/sfx.ts           (změna)  4 nové efekty (→ 19)
src/art/fruit.ts          (změna)  tvar maliny ve sdíleném boxu
src/art/customers.ts      (změna)  case 'frog'
src/art/svg.ts            (změna)  barvy maliny a žabky do PALETTE
src/game/orders.ts        (změna)  OrderInput.fruits
src/game/session.ts       (změna)  odemčené ovoce a zákazníci, buy(id)
src/game/speech.ts        (změna)  helpery hlášek obchůdku
src/main.ts               (změna)  DEV handle __shop
src/…                     (změna)  přečíslování odkazů STEP-NN v komentářích (14 míst, seznam níž)
public/audio/voice/cook/  (nové)   49 klipů (generováno, commitnuto)
public/audio/sfx/         (nové)   4 klipy (generováno, commitnuto)
```

**Knihovny** – žádné nové. Runtime závislosti zůstávají nulové (CLAUDE.md, Dodavatelský řetězec).

**Kroky**

1. **Katalog** `src/data/shop.ts`. Šest položek v pořadí, v jakém je regál nabídne (od nejlevnější).
   Soubor smí mít jen `import type` – čte ho `lines.cs.ts`, a ten načítá i holý Node v generátoru
   hlasu (typy se strippují, hodnotové importy se musí psát s příponou `.ts`). V hlavičce
   `lines.cs.ts` se proto rozšíří poznámka „hodnotové importy jen z `./curriculum.ts`“ o `./shop.ts`.
2. **Obsah, který katalog nabízí.** Malina: `FruitKind` + `'raspberry'`, `FRUITS` na čtyři druhy,
   nová `STARTER_FRUITS` (tři startovní), řádek ve `FRUIT_FORMS`
   (`{ one: 'jednu malinu', few: 'maliny', many: 'malin' }`) a tvar v `art/fruit.ts` ve sdíleném
   boxu `0 -6 40 52`. Žabka: `CustomerId` + `'frog'`, řádek v `CUSTOMERS` (label `žabka`, `mouth`),
   `isCustomerId` přes `hasOwnProperty` nad `CUSTOMERS` (aby další zvíře znamenalo jeden řádek),
   kresba `art/frog.ts` a `case 'frog'` v `customerArt()`.
3. **Logika** `src/game/shop.ts` – viz Kontrakt. Koupě jde přes `withPurchase()` ze `stars.ts`,
   nic tu nepočítá zůstatek po svém.
4. **Brány.** `orders.ts`: `OrderInput.fruits?: readonly FruitKind[]`, v `countItem()` se z něj
   (nebo z `STARTER_FRUITS`) odfiltruje `avoidFruit` jako dosud. `session.ts`: generátoru se předá
   `fruits: unlockedFruits(save.stars)`, fronta zákazníků se staví z `unlockedCustomers(save.stars)`
   a přibude `buy(id)`.
5. **Hlášky.** Do `lines.cs.ts` tabulka `SHOP_TEXTS` (id věci → věta „chceš koupit“ a věta „koupeno“),
   pět vět „chybí ti N hvězdiček“, dvě uvítací, helpery `shopAskLine()`, `shopBoughtLine()`,
   `shopShortLine()`, `shopHelloLines()`; registrace ve smyčce před `add(TURN_LINE, …)`.
   Pak `docker compose run --rm voice` (přírůstkový, vyrobí jen nových 49) a commit klipů.
6. **Zvuky.** Do `sfx.ts` čtyři položky s anglickými prompty; `docker compose run --rm sfx`
   a commit. `shop.buy` a `shop.rattle` použije až scéna v STEP-16 – generují se teď, aby autor
   nepouštěl generátor s klíčem dvakrát.
7. **Řeč** `speech.ts`: `shopAskSpeech(id)`, `shopBoughtSpeech(id)`, `shopShortSpeech(missing)`,
   `createShopHelloPicker()`, `shopPreload()` (uvítání + všechny otázky a potvrzení – regál je
   malý, celá sada je pár desítek kilobajtů).
8. **DEV handle** `__shop` v `main.ts` (v buildu se stripuje): `offer()`, `buy(id)`, `grant(n)`,
   `unlocked()`. `grant()` zapisuje rovnou do úložiště, takže platí stejná poznámka jako
   u `__save.merge()`: běžící sezení má svou kopii, na utracení hvězdiček je potřeba reload.
9. **Přečíslování.** Roadmapa dostane nový řádek STEP-16 (scéna obchůdku) a všechno od bývalého
   16 dál se posune o jedno. **Přečísluj sestupně** (28 → 29, 27 → 28, 26 → 27, 23 → 24, 20 → 21,
   19 → 20), jinak se STEP-19 → 20 potká s původním STEP-20 a posune ho podruhé. Všech 22 odkazů
   v kódu (ověřeno grepem, testy včetně):
   - STEP-19 → 20 (10×): `main.ts`, `scenes/kitchen/index.ts`, `scenes/kitchen/closing.ts`,
     `art/lock.ts`, `game/session.ts`, `game/closing.ts` ×2, `audio/context.ts`, `audio/voice.ts`,
     `data/lines.cs.ts`
   - STEP-20 → 21 (1×): `game/curriculum.test.ts`
   - STEP-23 → 24 (5×): `game/orders.ts` ×2, `game/counting.ts`, `game/curriculum.ts`,
     `game/curriculum.test.ts`
   - STEP-26 → 27 (3×): `game/orders.ts`, `game/curriculum.ts`, `game/curriculum.test.ts`
   - STEP-27 → 28 (3×): `game/curriculum.ts`, `data/curriculum.ts`, `game/curriculum.test.ts`

   V `navrh-hry.md` se srovnají tři odkazy (STEP-19 v kap. 9, STEP-23 v kap. 5.2 a STEP-23/26
   v kap. 5.4). **Hotové plány v `docs/steps/` se nepřečíslovávají** – jsou zápisem o tom, co
   platilo tehdy.
10. **Testy** podle sekce Testy.

**Klíčová rozhodnutí**

- **Id věcí jsou jmenné prostory a jsou navždy** (`fruit.raspberry`, `customer.frog`, `decor.flower`).
  Klíč v `stars.purchases` se nikdy nepřejmenovává ani nepoužije podruhé – přejmenování by dceři
  sebralo koupenou věc (pravidlo 4). Prefix drží pořádek, až se katalog rozroste o výrobky a polevy.
- **Katalog neví nic o kreslení.** Řádek nese jen `unlocks` (druh ovoce, id zvířete, id výzdoby);
  co se kde nakreslí, rozhoduje scéna. Proto je katalog čitelný i pro holý Node a generátor hlasu.
- **Malina a žabka mají kresbu už teď, výzdoba ne.** Kuchyně obojí umí nakreslit bez jediné změny
  (`count-item` kreslí ovoce podle druhu, `customer` zvíře podle id), takže je hloupé je psát do
  katalogu a kresbu odkládat – navíc `FruitKind` a `CustomerId` jsou uzavřené typy a `tsc` by
  neúplný `switch` neprošel. Výzdoba naproti tomu potřebuje **nová místa v kuchyni**, a to je
  scéna: patří do STEP-16.
- **Výchozí ovoce generátoru je startovní trojice, ne celá `FRUITS`.** `FRUITS` se rozroste na
  čtyři druhy kvůli hláškám (manifest musí malinu znát), takže kdyby generátor bral výchozí sadu
  z ní, nekoupená malina by se objevila v objednávce. Volající předává, co je odemčené; výchozí
  hodnota drží starý stav a nechává staré testy beze změny.
- **Koupě zapisuje jedině `session.buy()`.** `session.ts` je od STEP-14 jediné místo, které sahá na
  úložiště; scéna obchůdku dostane `buy(id): boolean` a nic víc. Odemčení zákazníka navíc přestaví
  frontu, takže žabka může přijít hned – bez reloadu. Objednávka, která už leží na pultu, se
  nepřegeneruje: nová malina se objeví až v další.
- **Přestavení fronty zákazníků stojí za jednu větu navíc.** `createCustomerQueue()` se dnes volá
  jednou při vzniku sezení a drží se v `const`; `buy()` z něj udělá `let` a po odemčení zvířátka
  frontu postaví znovu. Tím se vynuluje i její férovost (rozdaný pytlík a „kdo šel naposled“), což
  je u jednoho odemčení za sezení v pořádku – horší varianta je, že by dcera koupila žabku a ta by
  přišla až po reloadu.
- **`'cat'` je náhodou dvakrát.** `DecorationId` má `'cat'` (kočička na polici, `decor.cat`)
  a `CustomerId` taky (`cat`, kočička jako zákazník ze STEP-10). Rozlišená unie a jmenný prostor
  v id je od sebe spolehlivě oddělí; **STEP-16 to nesmí splést** – jedno je figurka na polici,
  druhé zvíře, které chodí k pultu.
- **Beze změny `SAVE_VERSION`.** `purchases` je pole záznamu od STEP-13 (verze 2), tenhle krok do
  formátu nesahá – jen do něj poprvé něco doopravdy zapíše. Slučování `purchases` (vyšší zaplacená
  cena vyhrává) už `merge.ts` umí a testy to hlídají.
- **„Chybí ti N hvězdiček“ je pět hotových vět, ne skládačka.** Čeština skloňuje (jedna hvězdička ×
  dvě hvězdičky × pět hvězdiček) a pravidlo 7 zakazuje lepit věty za běhu. Nejdražší věc stojí
  5 ★, takže víc než pět chybět nemůže; test hlídá, že žádná cena v katalogu nepřeleze 5.
- **Cena je v katalogu i ve větě.** Text „Chceš koupit maliny za tři hvězdičky?“ nese číslovku
  slovem, takže změna ceny bez změny hlášky by lhala. Test proto porovná, že věta obsahuje
  číslovku odpovídající ceně.

**Pseudokód** (`src/game/shop.ts`)

```
shopOffer(stars):
  for item in SHOP_ITEMS:
    owned    -> { item, state: 'owned', missing: 0 }
    balance >= price -> { item, state: 'affordable', missing: 0 }
    else     -> { item, state: 'short', missing: price - balance }

buyShopItem(stars, id):
  item = shopItem(id); if !item -> null
  return withPurchase(stars, item.id, item.price)   // null = koupeno / nedost. hvězdiček

unlockedFruits(stars):
  [...STARTER_FRUITS, ...koupené položky druhu 'fruit' v pořadí katalogu]  // bez duplicit,
                                                                          // neznámá id ignoruj
unlockedCustomers(stars):
  [...STARTER_CUSTOMERS, ...koupené položky druhu 'customer']   // STARTER_CUSTOMERS už existuje
                                                                // v data/customers.ts, nová není
ownedDecorations(stars):
  [...koupené položky druhu 'decoration']                       // žádná startovní sada
```

## Kontrakt

```ts
// src/data/shop.ts
export type ShopItemKind = 'fruit' | 'customer' | 'decoration';
export type DecorationId = 'flower' | 'curtains' | 'cat' | 'radio';

/** Společná část každého řádku katalogu. */
interface ShopItemBase {
  /** Stabilní klíč v `stars.purchases`; nikdy se nepřejmenovává ani nepoužije podruhé. */
  readonly id: string;
  /** Cena v hvězdičkách. Zaplacená cena se ukládá s koupí, takže pozdější změna nic nepřepíše. */
  readonly price: number;
  /** Český název (herní obsah) – pro album a rodičovský koutek; ve hře se nikdy nepíše. */
  readonly label: string;
}

/**
 * Rozlišená unie stejně jako `OrderItem` v `orders.ts`: `kind` rozhoduje, co smí stát v `unlocks`.
 * Plochá unie tří typů by neuhlídala řádek `kind: 'fruit'` s `unlocks: 'flower'` – a `'cat'` je
 * dokonce legální hodnota dvou různých druhů (kočička na polici × kočička jako zákazník).
 */
export type ShopItem =
  | (ShopItemBase & { readonly kind: 'fruit'; readonly unlocks: FruitKind })
  | (ShopItemBase & { readonly kind: 'customer'; readonly unlocks: CustomerId })
  | (ShopItemBase & { readonly kind: 'decoration'; readonly unlocks: DecorationId });

export const SHOP_ITEMS: readonly ShopItem[];
export function shopItem(id: string): ShopItem | null;

// src/game/shop.ts
export type ShopItemState = 'owned' | 'affordable' | 'short';

export interface ShopEntry {
  readonly item: ShopItem;
  readonly state: ShopItemState;
  /** Kolik hvězdiček chybí; 0 u koupených i dostupných. */
  readonly missing: number;
}

export function shopOffer(stars: StarsState): readonly ShopEntry[];
export function shopEntryOf(stars: StarsState, id: string): ShopEntry | null;
/** null = neznámé id, už koupeno, nebo nestačí hvězdičky – volající nic nezapisuje. */
export function buyShopItem(stars: StarsState, id: string): StarsState | null;
export function unlockedFruits(stars: StarsState): readonly FruitKind[];
export function unlockedCustomers(stars: StarsState): readonly CustomerId[];
export function ownedDecorations(stars: StarsState): readonly DecorationId[];

// src/game/orders.ts – přírůstek v OrderInput
export interface OrderInput {
  /** Odemčené druhy ovoce; prázdné nebo chybějící = startovní trojice. */
  readonly fruits?: readonly FruitKind[];
}

// src/game/session.ts – přírůstek v Session
export interface Session {
  /**
   * Koupí věc z katalogu a zapíše záznam. Odemčený zákazník rovnou přestaví frontu, takže může
   * přijít bez reloadu. false = neznámé id, už koupeno nebo málo hvězdiček; pak se nezapisuje nic.
   */
  buy(id: string): boolean;
}

// src/game/speech.ts
export function shopAskSpeech(id: string): readonly string[];
export function shopBoughtSpeech(id: string): readonly string[];
/** 1..5; mimo rozsah prázdné pole (hra mlčí, nic se nezasekne – pravidlo 2). */
export function shopShortSpeech(missing: number): readonly string[];
export function createShopHelloPicker(options?: { readonly rng?: Rng }): LinePicker;
export function shopPreload(): readonly string[];

// src/data/lines.cs.ts
export function shopAskLine(id: string): string;      // 'shop.ask.fruit.raspberry'
export function shopBoughtLine(id: string): string;   // 'shop.bought.fruit.raspberry'
export function shopShortLine(missing: number): string; // 'shop.short.3'
export function shopHelloLines(): readonly string[];
```

**Katalog (přesné hodnoty)**

| id | druh | cena | label | odemyká |
|---|---|---|---|---|
| `fruit.raspberry` | fruit | 3 | maliny | `raspberry` |
| `decor.flower` | decoration | 3 | kytka | `flower` |
| `decor.curtains` | decoration | 4 | záclony | `curtains` |
| `customer.frog` | customer | 5 | žabka | `frog` |
| `decor.cat` | decoration | 5 | kočička na polici | `cat` |
| `decor.radio` | decoration | 5 | rádio | `radio` |

**Hlášky (19 nových vět obchůdku)**

| id | text |
|---|---|
| `shop.ask.fruit.raspberry` | Chceš koupit maliny za tři hvězdičky? |
| `shop.ask.decor.flower` | Chceš koupit kytku za tři hvězdičky? |
| `shop.ask.decor.curtains` | Chceš koupit záclony za čtyři hvězdičky? |
| `shop.ask.customer.frog` | Chceš pozvat žabku za pět hvězdiček? |
| `shop.ask.decor.cat` | Chceš koupit kočičku na polici za pět hvězdiček? |
| `shop.ask.decor.radio` | Chceš koupit rádio za pět hvězdiček? |
| `shop.bought.fruit.raspberry` | Maliny jsou tvoje! |
| `shop.bought.decor.flower` | Kytka je tvoje! |
| `shop.bought.decor.curtains` | Záclony jsou tvoje! |
| `shop.bought.customer.frog` | Žabka přijde na návštěvu! |
| `shop.bought.decor.cat` | Kočička je tvoje! |
| `shop.bought.decor.radio` | Rádio je tvoje! |
| `shop.short.1` | Chybí ti jedna hvězdička. |
| `shop.short.2` | Chybí ti dvě hvězdičky. |
| `shop.short.3` | Chybí ti tři hvězdičky. |
| `shop.short.4` | Chybí ti čtyři hvězdičky. |
| `shop.short.5` | Chybí ti pět hvězdiček. |
| `shop.hello.1` | Vítej v obchůdku! |
| `shop.hello.2` | Co si dneska koupíme? |

K tomu 30 malinových vět ze stávajících smyček (`order.count.N.raspberry`,
`order.next.count.N.raspberry`, `count.enough.N.raspberry` pro N = 1…10). Manifest: 321 → **370**.

**Zvuky (4 nové, anglické prompty jako zbytek `sfx.ts`)**

| id | prompt | délka |
|---|---|---|
| `customer.frog.hello` | short friendly cartoon frog croak, single ribbit, clean, no music | 0,8 s |
| `customer.frog.yum` | happy cartoon frog gulp and short croak, satisfied, clean, no music | 1,0 s |
| `shop.buy` | bright cash register ding with a short sparkle, cartoon shop, clean, no music | 1,2 s |
| `shop.rattle` | small wooden shelf rattle, gentle shake, cartoon, clean, no music | 0,8 s |

Efekty: 15 → **19**.

**Příklad**

```ts
const stars = { earned: 7, purchases: { 'decor.flower': 3 } };

starBalance(stars);                       // 4
shopEntryOf(stars, 'decor.flower');       // { item: …, state: 'owned', missing: 0 }
shopEntryOf(stars, 'fruit.raspberry');    // { item: …, state: 'affordable', missing: 0 }
shopEntryOf(stars, 'customer.frog');      // { item: …, state: 'short', missing: 1 }
shopShortSpeech(1);                       // ['shop.short.1']

const after = buyShopItem(stars, 'fruit.raspberry');
// { earned: 7, purchases: { 'decor.flower': 3, 'fruit.raspberry': 3 } }  → zůstatek 1
unlockedFruits(after);                    // ['strawberry', 'blueberry', 'cherry', 'raspberry']
unlockedCustomers(after);                 // ['bear', 'rabbit', 'cat']
ownedDecorations(after);                  // ['flower']
buyShopItem(after, 'customer.frog');      // null (chybí 4 hvězdičky)
buyShopItem(after, 'fruit.banana');       // null (není v katalogu)
```

## Akceptační kritéria

- KDYŽ je záznam nový (0 hvězdiček), PAK `shopOffer()` vrátí všech šest věcí ve stavu `short`
  s `missing` rovným ceně a `buyShopItem()` vrátí u každé z nich `null`.
- KDYŽ má dítě přesně cenu věci, PAK je věc `affordable`, koupě projde, `purchases` obsahuje
  zaplacenou cenu a zůstatek klesne přesně o ni (`earned` se nemění).
- KDYŽ je věc už koupená, PAK je ve stavu `owned` s `missing = 0` a druhá koupě vrátí `null`,
  takže se za ni nezaplatí podruhé.
- KDYŽ hvězdičky nestačí, PAK `missing` = cena − zůstatek, `buyShopItem()` vrátí `null`
  a `shopShortSpeech(missing)` vrátí existující id klipu pro 1…5.
- KDYŽ je id mimo katalog (překlep, věc z novějšího buildu), PAK `shopItem()`/`shopEntryOf()`
  vrátí `null`, `buyShopItem()` vrátí `null` a nic se nezapíše.
- KDYŽ záznam obsahuje neznámé klíče v `purchases` (z jiného zařízení), PAK je odemykací funkce
  ignorují, nespadnou a vrátí aspoň startovní sady.
- KDYŽ není koupené žádné ovoce, PAK `unlockedFruits()` vrátí přesně startovní trojici a generátor
  ve stovce objednávek nikdy nezadá malinu.
- KDYŽ je koupená malina, PAK ji generátor se seedovaným rng v sérii objednávek zadá a věta
  `orderCountLine(n, 'raspberry')` má klip v manifestu.
- KDYŽ je koupená žabka, PAK ji `session.customer` nabídne během několika objednávek **bez
  reloadu**, a dokud koupená není, nepřijde nikdy.
- KDYŽ koupě proběhne, PAK je zapsaná v úložišti a po novém `readSave()` (tedy i po reloadu)
  platí i s odemčenými sadami.
- KDYŽ se sloučí dva záznamy, ve kterých je stejná věc koupená za jinou cenu, PAK zůstane ta vyšší
  a věc zůstane koupená (chování `mergeStars` ze STEP-13, tady jen ověřené nad reálnými id).
- KDYŽ se pustí `test`, `check` i `build`, PAK jsou zelené, manifest má 370 hlášek, efektů je 19
  a každý klip existuje na disku (hlídají stávající testy manifestu).

## Testy

- **Unit (Vitest), nový `src/game/shop.test.ts`:** stavy nabídky (nula hvězdiček, přesná cena,
  o jednu míň, koupeno), `missing` na hraně, koupě a `null` ve všech třech důvodech (neznámé id,
  koupeno, málo hvězdiček), neměnnost vstupu (funkce nic nemutují), odemykací funkce (startovní
  sady, po koupi, s neznámými klíči, pořadí podle katalogu), invariant „žádná cena v katalogu
  není větší než 5 a menší než 1“, „každé id je unikátní a má prefix podle druhu“ a „`unlocks`
  každého řádku je opravdu z množiny svého druhu“ (ovoce ve `FRUITS`, zákazník v `CUSTOMERS`,
  výzdoba v seznamu `DecorationId`) – rozlišená unie hlídá typ, tenhle test hodnotu.
- `src/game/orders.test.ts` – výchozí sada je startovní trojice; předaná sada se respektuje;
  `avoidFruit` z jednoprvkové sady nesmí generátor zaseknout.
- `src/game/session.test.ts` – `buy()` zapisuje a vrací `false` bez zápisu, když nejde koupit;
  po koupi maliny se objeví v objednávkách; po koupi žabky přijde bez reloadu; koupě nepřegeneruje
  objednávku, která už leží na pultu.
- `src/game/speech.test.ts` – helpery vrací existující id (`hasLine`), `shopShortSpeech(0)`
  a `shopShortSpeech(9)` vrací prázdné pole, `shopPreload()` obsahuje uvítání i všechny otázky.
- `src/data/lines.cs.test.ts` – 370 hlášek, každé id sedí na vzor, každá věc z katalogu má otázku
  i potvrzení, a otázka obsahuje číslovku odpovídající ceně.
- `src/data/sfx.test.ts` – 19 efektů, id sedí na vzor, každý má klip.
- `src/art/art.test.ts` – zvířecí testy dnes chodí přes `STARTER_CUSTOMERS`, takže by žabku
  minuly: přepnout je na všechna id z `CUSTOMERS`. Malina se veze automaticky, protože ovocné
  testy chodí přes `FRUITS`. Navíc: žabka má vlastní barvu (nesmí obsahovat `PALETTE.fur`
  ani `furRabbit`) a malina vlastní (nesmí být barva jahody ani třešně).
- `src/game/merge.test.ts` – sloučení `purchases` nad reálnými id katalogu.
- Spuštění: `docker compose run --rm test`, dál `check` a `build`.

## Ruční ověření

Dev server `docker compose --profile dev up -d`, `http://localhost:5173/mlsna-abeceda/`,
Chrome DevTools, tablet na šířku (iPad 1024×768) a pak mobil na šířku (844×390).

- [ ] `__shop.offer()` v konzoli vypíše šest věcí, u nového záznamu všechny `short` se správným
      `missing`.
- [ ] `__shop.grant(25)` a reload; `__shop.offer()` teď hlásí všechny `affordable`.
- [ ] `__shop.buy('fruit.raspberry')` vrátí `true`; po pár zazvoněních přijde objednávka na maliny –
      **v misce, na dortu i v bublině** je malina a vypravěč řekne „Prosím tři maliny.“
- [ ] `__shop.buy('customer.frog')` vrátí `true`; bez reloadu během několika objednávek přijde
      žabka, zakváká při příchodu i při jídle a dort jí zmizí u pusy (ne vedle).
- [ ] `__shop.buy('customer.frog')` podruhé vrátí `false` a zůstatek se nezmění.
- [ ] `__shop.buy('decor.flower')` vrátí `true` a v kuchyni se **nic nezmění** (výzdoba je STEP-16);
      `__shop.unlocked()` ji přesto hlásí.
- [ ] Reload: `__save.read().stars.purchases` drží všechny koupě i zaplacené ceny, počítadlo
      hvězdiček ukazuje zůstatek, malina i žabka pořád chodí.
- [ ] Bez koupí (`__save.reset()` a reload) malina ani žabka nepřijdou ani po dvaceti
      objednávkách (`__kitchen.finish()` a zvoneček dokola).
- [ ] Poslech: `__voice.say('shop.ask.customer.frog')`, `'shop.short.3'`, `'order.count.3.raspberry'`
      a `__sfx.play('customer.frog.hello')`, `__sfx.play('shop.buy')`, `__sfx.play('shop.rattle')`.
- [ ] Totéž v rozměru mobilu na šířku (844×390): malina v misce i na dortu je celá a nepřekrývá se,
      žabka se vejde k pultu.

## DoD

- [x] Všechna akceptační kritéria splněna
- [x] Testy a build zelené
- [x] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [x] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

**Hotovo podle plánu, jeden commit (zatím necommitnuto – čeká na pokyn autora).**

**Nové soubory.** `src/data/shop.ts` (katalog šesti věcí, rozlišená unie, jen `import type`),
`src/game/shop.ts` (nabídka a její stavy, koupě přes `withPurchase()`, `unlockedFruits()`,
`unlockedCustomers()`, `ownedDecorations()`), `src/game/shop.test.ts` (25 testů),
`src/art/frog.ts` (žabka ve sdíleném boxu 260×320).

**Změněné soubory.** `data/curriculum.ts` (`FruitKind` + `'raspberry'`, `FRUITS` na čtyři,
nová `STARTER_FRUITS`), `data/customers.ts` (`'frog'`, řádek v `CUSTOMERS`, `isCustomerId` čte
tabulku), `data/lines.cs.ts` (malinové tvary, `SHOP_TEXTS`, „chybí ti N“, uvítání, čtyři helpery,
registrace řízená katalogem), `data/sfx.ts` (4 efekty), `art/svg.ts` (5 barev: `raspberry`,
`raspberryLight`, `frog`, `frogDark`, `frogBelly`), `art/fruit.ts` (malina jako trs peckoviček),
`art/customers.ts` (`case 'frog'`), `game/orders.ts` (`OrderInput.fruits`, výchozí
`STARTER_FRUITS`), `game/session.ts` (odemčené ovoce do generátoru, odemčení zákazníci do fronty,
`buy(id)`), `game/speech.ts` (5 helperů obchůdku), `main.ts` (DEV `__shop`), plus testy
(`orders`, `session`, `speech`, `merge`, `customers`, `art`, `lines.cs`, `sfx`).

**Odchylky od plánu (žádná nemění Kontrakt ani Rozsah).**

1. **`ShopItemId` je uzavřená unie**, ne `string`. Kontrakt psal `id: string`; tohle je zúžení,
   které nic nerozbíjí (`shopItem(id: string)` a `buy(id: string)` zůstávají). Důvod: tabulka
   `SHOP_TEXTS` v `lines.cs.ts` je pak `Record<ShopItemId, …>`, takže **nová věc v katalogu bez
   hlášky se nezkompiluje** – jistota, kterou by test odhalil až za běhu.
2. **`unlockedFruits/Customers/Decorations` stojí na třech malých funkcích**, ne na jedné
   generické. Porovnání `item.kind === 'fruit'` s literálem zúží `unlocks` na správný typ, takže
   kód nepotřebuje jediné přetypování; generická varianta by `as T` potřebovala.
3. **`shopPreload()` si hranici „chybí ti N“ počítá z nejdražší ceny v katalogu** a ověřuje
   `hasLine()`, místo napevno zapsané pětky. Sama se srovná, když cena někdy povyroste.
4. **Přečíslování: 21 odkazů ve 14 souborech, ne 22 ve 12.** Plán počítal `STEP-26` i v
   `game/orders.ts`, kde není (grep). Přečíslováno sestupně podle plánu, plus tři odkazy
   v `navrh-hry.md`; hotové plány v `docs/steps/` zůstaly, jak byly.
5. **`art.test.ts` chodí přes všechna id z `CUSTOMERS`** (dřív `STARTER_CUSTOMERS`) a
   `customers.test.ts` rozlišuje `EVERY` (data) od `ALL` (fronta), aby testy fronty dál mluvily
   o třech startovních zvířatech.

**Ověření.** `docker compose run --rm test` → **27 souborů, 737 testů zelených** (před krokem 685),
`check` (tsc + prettier) i `build` bez chyby. Manifest: **370 hlášek**, **19 efektů**; vygenerováno
49 nových klipů (1171 znaků) a 4 efekty, obojí commitnuto do `public/audio/`.

Ruční ověření v Chrome na dev serveru (tablet 1024×768 i mobil 844×390 – ten přes iframe té
velikosti, protože okno prohlížeče šlo přes celou obrazovku a `resize_window` se neprojevil;
logický stage je v obou případech 1366×768, liší se jen měřítko):

- `__shop.offer()` na novém záznamu: šest věcí, všechny `short` se správným `missing`.
- `__shop.grant(25)` + reload: všech šest `affordable`.
- `__shop.buy('fruit.raspberry')`, `('customer.frog')`, `('decor.flower')` → `true`; druhá koupě
  maliny → `false`; `('fruit.banana')` → `false`; `purchases` = `{raspberry:3, frog:5, flower:3}`,
  počítadlo ukazuje zůstatek 14 z 25.
- **Bez reloadu** přišla žabka v objednávce 5 a 7 (2× z 10 objednávek) a generátor zadal maliny
  v objednávce 9. V bublině, v míse i na dortu je malina; žabce zmizel dort u pusy.
- Po koupi kytky se v kuchyni nezměnilo nic (výzdoba je STEP-16), `__shop.unlocked()` ji hlásí.
- Reload: `purchases` i zaplacené ceny drží, odemčené sady sedí.
- `__save.reset()` + reload: v devíti objednávkách nepřišla ani žabka, ani malina (delší horizont
  – 20 objednávek – hlídá test v `session.test.ts`).
- Přehrání `shop.ask.customer.frog`, `shop.short.3`, `order.count.3.raspberry` (`__voice.speaking`
  = true u všech tří) a `customer.frog.hello`, `customer.frog.yum`, `shop.buy`, `shop.rattle`
  (`__sfx.ready` = true, konzole bez chyby).

**Neověřeno.** (1) **Jak klipy zní** – spuštěny byly, ale poslech je na tobě:
`__voice.say('shop.ask.customer.frog')`, `'shop.short.3'`, `'order.count.3.raspberry'`,
`__sfx.play('customer.frog.hello')`, `('shop.buy')`, `('shop.rattle')`. (2) **Skutečný mobil** –
ověřeno v rozměru 844×390 v prohlížeči, ne na telefonu v ruce (velikost cílů palcem).

**Návrhy mimo rozsah (do STEP-16 nebo dál).**

- Žabka má vlastní `mouth` (0,5 / 0,472) odhadem podle kresby; až bude na scéně vidět jíst na
  velkém plátně, stojí za to hodnotu doladit stejně, jako se ladila u kočičky.
- `session.buy()` přestaví frontu zákazníků a tím vynuluje její férovost (rozdaný pytlík). Při
  jedné koupi za sezení je to v pořádku; kdyby se v STEP-16 ukázalo, že dcera nakupuje po každé
  objednávce, chtělo by to `CustomerQueue.setAvailable()` místo nové fronty.
- Počítadlo hvězdiček ukazuje zůstatek; jakmile bude v STEP-16 vidět košík, hodilo by se u něj
  jednou za čas ukázat i „vyděláno celkem“ (album, kap. 7).
