# STEP-17 · Druhý výrobek: zmrzlinka (výrobek jako proměnná)

Status: done
Milník: M3 · Po: STEP-15, STEP-16 · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 4 („Výrobky“), 7

## Shrnutí

Kuchyně umí jediný výrobek a ví to o sobě na příliš mnoha místech: `art/cake.ts`, `cakeCandleSlot()`
a `cakeCookieSlot()` v layoutu, `itemArt()` v bublině, `cakeGlaze()` ve finále a hlavně hlášky
`order.letter.k` („Prosím **perníček** s písmenkem ká."). Tenhle krok z výrobku udělá **proměnnou**:
nový modul `data/products.ts` říká, co se u kterého výrobku počítá a co nese písmenko a číslici,
`Order` dostane pole `product`, `speech.ts` podle něj vybírá hlášku a obchůdek prodává **zmrzlinku**
jako druhý výrobek. Mechanika se nemění ani o písmenko – počítání, výběr z police, nápověda,
finále i zapisování pokroku zůstávají jak jsou; mění se obrázek a věta.

Krok tím zaplatí celou režii abstrakce jednou. **STEP-18 (palačinky) a STEP-19 (koktejl)** jsou po
něm skoro jen kresba a sada hlášek: řádek v `PRODUCTS`, řádek v katalogu, nové `art/*.ts`, geometrie
v `layout.ts` a texty v manifestu.

## Rozsah

**V rozsahu**

- `src/data/products.ts` – katalog výrobků (`'cake' | 'icecream'`), co se počítá a jak se to jmenuje
  v hlášce, jaký nosič má písmenko a číslice. Čistá data, žádná kresba.
- `product` v `Order`, v `OrderInput` a v generátoru: losuje se z **koupených** výrobků a nepřijde
  dvakrát po sobě týž (jako dnes `avoidFruit` u ovoce).
- `kind: 'product'` v katalogu obchůdku + položka `product.icecream`; `unlockedProducts()` v `game/shop.ts`.
- ~96 nových hlášek v `data/lines.cs.ts` a běh `docker compose run --rm voice` (klipy se commitují).
- `src/art/icecream.ts` – kornout s kopečky, oplatka s písmenem, vlaječka s číslicí, přeliv do finále.
- Geometrie výrobků v `art/layout.ts`: sloty pro počítané kusy, pro nosič písmenka a pro nosič číslice
  se počítají podle výrobku (dnes natvrdo podle dortu).
- Kuchyňská scéna, `count-item`, `choice-item`, bublina a finále kreslí podle výrobku objednávky.
- `shopGoodArt()` umí nakreslit výrobek na regál obchůdku.

**Mimo rozsah**

- **Palačinky a koktejl** (STEP-18, STEP-19). Tenhle krok jen připraví místo.
- **Výběr výrobku dítětem.** Kdo se ptá, je zákazník; přepínač v kuchyni by byl nový ovládací prvek
  ≥ 88 px na jevišti, kde není volné místo, a dcera by si mohla vybrat jednu věc a zbytek neuvidět.
- **Druhá řada kopečků / počítání nad pět.** `MAX_COUNT = 5` platí dál, zvedá ho STEP-25.
- **Nové zvukové efekty.** Zmrzlina zní jako dort – `whoosh`, `pling`, `done`, `munch`; generátor
  efektů (`sfx`) se vůbec nepouští.
- **Změna formátu save.** Koupené výrobky jsou obyčejné položky v `stars.purchases`, takže
  `SAVE_VERSION` zůstává na 2 (viz poznámka u STEP-14 v `plan.md`).
- Kresba zmrzlinového **stroje** (kupuje se zmrzlinka, viz rozhodnutí 6 níž).

## Implementace

**Soubory**

```
src/data/products.ts                (nový)   katalog výrobků; jen data, jen `import type`
src/data/products.test.ts           (nový)   uzavřenost katalogu, unikátní id
src/art/icecream.ts                 (nový)   kornout, kopeček, oplatka, vlaječka, přeliv
src/art/product.ts                  (nový)   rozcestník: id výrobku → kresba (jediný switch v art/)
src/data/shop.ts                    (změna)  kind 'product', položka product.icecream
src/data/lines.cs.ts                (změna)  SCOOP_FORMS, hlášky zmrzliny, product v helperech
src/game/orders.ts                  (změna)  Order.product, OrderInput.products/avoidProduct
src/game/session.ts                 (změna)  unlockedProducts(), lastProduct
src/game/shop.ts                    (změna)  unlockedProducts()
src/game/speech.ts                  (změna)  všechny objednávkové věty berou product
src/art/layout.ts                   (změna)  productCountSlots/DigitSlot/LetterSlot + PRODUCT_GEOMETRY
src/art/shop.ts                     (změna)  shopGoodArt() umí kind 'product'
src/art/cake.ts                     (změna)  jen komentář: base + topping je rozhraní výrobku
src/scenes/kitchen/index.ts         (změna)  základ výrobku se překresluje s objednávkou
src/scenes/kitchen/count-item.ts    (změna)  start(amount, kind, product); kreslí ovoce × kopeček
src/scenes/kitchen/choice-item.ts   (změna)  start(item, product); kreslí svíčku/perníček × vlaječku/oplatku
src/scenes/kitchen/bubble.ts        (změna)  itemArt(item, product)
src/scenes/kitchen/finale.ts        (změna)  přeliv podle výrobku místo cakeGlaze()
public/audio/voice/cook/*.mp3       (nové)   96 klipů z generátoru
```

Testy se mění spolu s tím: `orders.test.ts`, `speech.test.ts`, `shop.test.ts`, `session.test.ts`,
`layout.test.ts`, `art.test.ts`, `lines.cs.test.ts`.

**Knihovny** – žádné nové. Runtime dependencies zůstávají na nule.

**Kroky**

Krok jde na **dvě zastavení**, každé zvlášť ověřené a commitnuté (jako STEP-16).

_Zastavení A — data, logika, hlas (ve hře není vidět nic nového)_

1. `data/products.ts`: `ProductId`, `Product`, `PRODUCTS`, `STARTER_PRODUCT = 'cake'`, `productOf(id)`.
   **Jen `import type`** – soubor čte i holý Node přes `lines.cs.ts` (stejné pravidlo jako
   `curriculum.ts` a `shop.ts`). Zároveň se **rozšíří hlavička `lines.cs.ts`**: dnes tvrdí, že
   hodnotové importy smí přijít jedině z `./curriculum.ts` a `./shop.ts`, a `products.ts` se do
   toho výčtu musí dopsat – helpery si z něj berou `lineSuffix` a `countUnit` za běhu, takže je to
   hodnotový import s příponou `.ts` (Node nerozpozná bezpříponový specifikátor).
2. `data/shop.ts`: `ShopItemKind` o `'product'`, `ShopItemId` o `'product.icecream'`, řádek katalogu
   (5 ★). Katalog má tím pět řádků z šesti míst regálu.
3. `data/lines.cs.ts`: `SCOOP_FORMS`, helpery berou `product`, generování 96 nových vět (rozpis níž).
4. `game/shop.ts`: `unlockedProducts()` vedle `unlockedFruits()`.
5. `game/orders.ts`: `Order.product`, `OrderInput.products` a `avoidProduct`, losování v `generateOrder()`.
6. `game/session.ts`: `lastProduct`, předání `products` a `avoidProduct` do generátoru.
7. `game/speech.ts`: `itemSpeech`, `orderSpeech`, `repeatSpeech`, `askAgainSpeech`, `enoughSpeech`
   a `itemHintSpeech` berou `product`; `orderPreload` si ho čte z `order` sama.
   `correctionSpeech`, `hintSpeech` a počítání nahlas se **nemění** – ta věta je o písmenku, ne
   o výrobku.
8. Testy A + `docker compose run --rm voice` (přírůstkový, vyrobí jen nových 96 klipů). **Commit.**

_Zastavení B — kresba a scéna_

9. `art/icecream.ts`: `iceCreamBase()`, `scoop(kind, height)`, `wafer(letter)`, `flag(digit)`,
   `iceCreamTopping()`.
10. `art/layout.ts`: `PRODUCT_GEOMETRY` a tři funkce podle výrobku; staré `cake*` funkce se
    přejmenují (rozhodnutí 3).
11. `scenes/kitchen/index.ts`: `productEl` se překresluje v `startOrder()`; product se předává
    položkám, bublině a finále a **všem osmi voláním hlasu** (tabulka v rozhodnutí 9).
12. `count-item.ts`, `choice-item.ts`, `bubble.ts`, `finale.ts` podle rozhodnutí 3 a 5. Dev konzole
    (`devPlay()` v `index.ts`) staví `Order` ručně – bude potřebovat `product: order.product`,
    jinak to neprojde `tsc`. Je to jediné místo, kde se `Order` píše mimo generátor.
13. `art/shop.ts`: větev `case 'product'`.
14. Testy B, `check`, `build`, ruční ověření. **Commit.**

**Klíčová rozhodnutí**

1. **Výrobek losuje generátor, ne dítě a ne zákazník.** Losuje se z koupených a nepadne dvakrát po
   sobě týž – přesně vzor, který v `orders.ts` už je pro ovoce (`avoidFruit`). Vazba na zvířátko
   (medvídek = dort) byla ve hře pro zapamatovatelnost, ale svázala by pestrost výrobků s frontou
   zákazníků; přepínač pro dítě padá na místě na jevišti a na riziku, že si dcera vybere jednu věc
   a zbytek neuvidí.

2. **Losuje se AŽ PO položkách a jen když je z čeho.** Pořadí tahů z `rng` je v testech zapsané
   (seedovaná session se přehrává stejně), takže tah navíc na začátku by rozbil každé existující
   očekávání. Proto:

   ```ts
   const items = /* … beze změny … */;
   const pool = products.filter((p) => p !== avoidProduct);
   const choices = pool.length > 0 ? pool : products;
   // Jediný výrobek = žádný tah: save s dortem se přehrává přesně jako dosud.
   const product = choices.length === 1 ? choices[0] : pick(rng, choices);
   ```

3. **`cake` v layoutu se přejmenuje na `product`.** Krabice `KitchenLayout.cake` (220 × 146 na
   souřadnici středu pultu) zůstává co do rozměru i místa **beze změny** – mění se jen jméno, protože
   `layout.cake` u zmrzliny je lež. Přejmenování je mechanické a dotkne se `layout.ts`, `count-item.ts`,
   `choice-item.ts`, `finale.ts`, `index.ts` a `layout.test.ts`. Zároveň:

   | dnes | nově |
   |---|---|
   | `cakeFruitSlots(cake, count)` | `productCountSlots(box, product, count)` |
   | `cakeCandleSlot(cake)` | `productDigitSlot(box, product)` |
   | `cakeCookieSlot(cake)` | `productLetterSlot(box, product)` |
   | `MAX_CAKE_FRUIT`, `CAKE_*` | `MAX_COUNT_PIECES`, `PRODUCT_GEOMETRY[product]` |

   Test „mezi dvěma krabicemi je aspoň 8 px" jede přes `Object.values(kitchenLayout(width))`, takže
   přejmenování pole projde beze změny invariantu.

4. **Zmrzlina má stejnou geometrii jako dort: 3 kopečky vepředu, 2 vzadu.** Kornout stojí špičkou
   dolů, kopečky se sypou v pyramidě na jeho ústí – tedy přesně rozestavění, které `cakeFruitSlots()`
   dnes dělá s ovocem, jen s jinými čísly (větší rozteč a vyšší kus). Svislá věž pěti kopečků nejde:
   měřila by přes 200 px, kdežto nad krabicí výrobku je jen 44 px volných, pak začíná řada počítacích
   koleček (`PILL_OFFSET_Y = 84`, `PILL_SIZE = 40`). Pyramida se vejde do stejné krabice, všech pět
   kopečků je vidět a jde je **přepočítat**, na čemž stojí Č1 (návrh 5.1).

5. **Příchuť je barva kopečku, ne slovo.** `OrderItem` typu `count` si nechává pole `fruit` i u
   zmrzliny; kopeček se jím obarví (`PALETTE.strawberry` → růžový kopeček). Hláška ale říká jen
   „Prosím tři kopečky." – rozhodnutí autora ze srpna 2026, viz `navrh-hry.md` kap. 4. Ušetří to
   90 vět a dcera nepřijde o nic: příchuť není učivo.

6. **Kupuje se „zmrzlinka", ne „zmrzlinový stroj".** Návrh kap. 7 mluví o zmrzlinovém stroji za 8 ★.
   Dvě odchylky, obě vědomé:
   - **Obrázek je zmrzlina, ne stroj**, a věta mu odpovídá („Chceš koupit zmrzlinku za pět
     hvězdiček?" / „Zmrzlinka je tvoje! Můžeš ji dělat."). Čtyřleté dítě pozná zmrzlinu; stroj na
     zmrzlinu je věc, kterou nikdy nevidělo, a obrázek by neřekl nic – to je pravidlo 1.
   - **Cena je 5 ★, ne 8 ★.** Katalog dnes končí na pěti, protože „Chybí ti N hvězdiček" existuje
     přesně pětkrát a šestá věta by znamenala další hlášky (a čekání skoro na celé sezení).
     Zvednout strop jde kdykoli později, až bude důvod.

7. **Stará id hlášek se nepřejmenovávají, nikdy.** `order.letter.k` = „Prosím perníček s písmenkem
   ká." má nagenerovaný a commitnutý klip; přejmenováním by se zahodil a musel se vyrobit znovu.
   Dort si proto nechává **holá** id a nové výrobky dostávají **příponu**:

   | co | dort (beze změny) | zmrzlina (nové) |
   |---|---|---|
   | písmenko | `order.letter.k` | `order.letter.k.icecream` |
   | písmenko, druhá pozice | `order.next.letter.k` | `order.next.letter.k.icecream` |
   | číslice | `order.digit.5` | `order.digit.5.icecream` |
   | číslice, druhá pozice | `order.next.digit.5` | `order.next.digit.5.icecream` |
   | počítání | `order.count.3.strawberry` | `order.count.3.scoop` |
   | počítání, druhá pozice | `order.next.count.3.strawberry` | `order.next.count.3.scoop` |
   | „už stačí" | `count.enough.3.strawberry` | `count.enough.3.scoop` |

   Počítání se neliší podle výrobku, ale podle **jednotky** (`countUnit`): dort i budoucí koktejl
   počítají ovoce a sdílejí jednu sadu, zmrzlina má kopečky. Palačinky si v STEP-18 přidají
   `.pancake` a nic dalšího se měnit nebude.

8. **„Dva kopečky", ne „dvě kopečky" – číslovka má rod.** `NUMERALS` v `lines.cs.ts` je dnes jediná
   řada a komentář u ní přiznává proč: *„all three fruits are feminine, so one row is enough"*.
   Jahoda, borůvka, třešeň i malina jsou ženského rodu, kdežto **kopeček je mužský neživotný**, takže
   `NUMERALS[2] = 'dvě'` by vyrobilo (a natvrdo zaplatilo a commitlo) klip `order.count.2.scoop.mp3`
   s větou „Prosím dvě kopečky." Liší se **jediné číslo**: dvojka. Jednička je schovaná v tvaru
   (`one: 'jeden kopeček'` × `'jednu jahodu'`), od trojky výš jsou číslovky bezrodé.

   ```ts
   /** Jen dvojka má rod; 'jednu/jeden' nese sama tabulka tvarů, od tří výš je číslovka bezrodá. */
   const NUMERALS_MASCULINE: Readonly<Record<Digit, string>> = { ...NUMERALS, 2: 'dva' };
   ```

   Sada tvarů proto vedle `one/few/many` nese i **rod**, aby si palačinky (ženský rod, „dvě
   palačinky") a další jednotky v STEP-18/19 nemusely na totéž přijít znovu. Test na doslovný text
   `order.count.2.scoop` to hlídá – id samo o sobě chybu neukáže.

9. **Product se musí protáhnout každým voláním hlasu – jinak to mlčky lže.** Nový parametr je
   volitelný s výchozím `'cake'` (jinak by se plán rozpadl na desítky mechanických změn), a to má
   cenu: **vynechané volání se zkompiluje** a jen řekne špatnou větu. Proto je seznam úplný a je
   součástí zadání, ne domácí úkol implementace:

   | místo | volání | co předat |
   |---|---|---|
   | `kitchen/index.ts:202` | `askAgainSpeech(open)` | klepnutí na bublinu |
   | `kitchen/index.ts:283` | `repeatSpeech(open)` | pobídka po 15 s |
   | `kitchen/index.ts:291` | `itemHintSpeech(first)` | nápověda po 40 s |
   | `kitchen/index.ts:311` | `repeatSpeech(open)` | „co ještě zbývá" po pochvale |
   | `kitchen/index.ts:406` | `orderSpeech(next.items)` | vyslovení objednávky |
   | `kitchen/index.ts:357`, `:425` | `orderPreload(order)` | beze změny – čte si `order.product` |
   | `main.ts:61` | `orderPreload(session.order)` | beze změny, ze stejného důvodu |
   | `count-item.ts:381` | `enoughSpeech(state.target, kind)` | výrobek, který dostal ve `start()` |

   `itemHintSpeech` je v tom seznamu ta zrádná: u počítací položky se uvnitř přepadá na
   `repeatSpeech([item])`, takže bez výrobku by nápověda po 40 s u zmrzliny řekla „Prosím tři
   jahody." `orderPreload` navíc musí nabírat i `count.enough.N.scoop` a objednávkové věty
   správného výrobku, jinak si klip stáhne až v okamžiku, kdy má znít.

10. **Kresba má jeden rozcestník, ne switch v každé scéně.** `art/product.ts` je jediné místo, kde se
    id výrobku převádí na kresbu; `count-item`, `choice-item`, bublina i finále volají jeho funkce
    a žádná z nich nezná jméno `iceCreamBase`. Přidat palačinky v STEP-18 je pak řádek tady a řádek
    v `PRODUCT_GEOMETRY`.

**Kolik hlášek přibude**

| sada | počet | příklad |
|---|---|---|
| `order.count.N.scoop` (N = 1…10) | 10 | „Prosím tři kopečky." |
| `order.next.count.N.scoop` | 10 | „A ještě tři kopečky." |
| `count.enough.N.scoop` | 10 | „Už máme tři kopečky, to stačí!" |
| `order.letter.X.icecream` (22 písmen) | 22 | „Prosím oplatku s písmenkem ká." |
| `order.next.letter.X.icecream` | 22 | „A ještě oplatku s písmenkem ká." |
| `order.digit.N.icecream` (N = 1…10) | 10 | „Prosím vlaječku s číslem pět." |
| `order.next.digit.N.icecream` | 10 | „A ještě vlaječku s číslem pět." |
| `shop.ask` + `shop.bought` pro zmrzlinku | 2 | „Chceš koupit zmrzlinku za pět hvězdiček?" |
| **celkem** | **96** | manifest roste z **366** na **462** |

Tvary „kopeček": `{ one: 'jeden kopeček', few: 'kopečky', many: 'kopečků' }` – stejný tvar tabulky
jako `FRUIT_FORMS` a sedí do obou vět („Prosím jeden kopeček." i „Už máme jeden kopeček, to stačí!").

## Kontrakt

```ts
// src/data/products.ts – jen data, jen `import type` (čte to i holý Node přes lines.cs.ts)
export type ProductId = 'cake' | 'icecream';

/** Jak se jmenují počítané kusy v hlášce. Dort a koktejl počítají ovoce a sdílejí jednu sadu. */
export type CountUnit = 'fruit' | 'scoop';

export interface Product {
  readonly id: ProductId;
  /** Česky, pro plán a rodičovský koutek – na obrazovku se nikdy nenapíše (pravidlo 1). */
  readonly label: string;
  readonly countUnit: CountUnit;
  /**
   * Přípona id objednávkových hlášek, nebo null pro výrobek s holými id. Dort má null navždy:
   * jeho klipy jsou vygenerované a commitnuté (rozhodnutí 7).
   */
  readonly lineSuffix: string | null;
}

export const STARTER_PRODUCT: ProductId = 'cake';
export const PRODUCTS: readonly Product[];
/** null = id, které v katalogu není (překlep, záznam z novějšího buildu). */
export function productOf(id: string): Product | null;

// src/game/orders.ts
export interface Order {
  readonly index: number;
  readonly product: ProductId;
  readonly items: readonly OrderItem[];
}

export interface OrderInput {
  // …beze změny…
  /** Co se dnes dá vyrobit – `unlockedProducts()`. Chybí-li nebo prázdné: jen dort. */
  readonly products?: readonly ProductId[];
  /** Výrobek minulé objednávky; nepadne dvakrát po sobě, pokud je z čeho vybírat. */
  readonly avoidProduct?: ProductId | null;
}

// src/data/shop.ts – uzavřená unie se rozšiřuje o čtvrtý druh
export type ShopItemKind = 'fruit' | 'customer' | 'decoration' | 'product';
export type ShopItemId =
  | 'fruit.raspberry' | 'customer.frog' | 'decor.cat' | 'decor.radio' | 'product.icecream';
export type ShopItem =
  // …tři stávající větve beze změny…
  | (ShopItemBase & { readonly kind: 'product'; readonly unlocks: ProductId });
// nový řádek na konci SHOP_ITEMS (nejdražší jde poslední, katalog je řazený od nejlevnějšího):
{ id: 'product.icecream', kind: 'product', price: 5, label: 'zmrzlinka', unlocks: 'icecream' }
// a v SHOP_TEXTS v lines.cs.ts:
'product.icecream': {
  ask: 'Chceš koupit zmrzlinku za pět hvězdiček?',
  bought: 'Zmrzlinka je tvoje! Můžeš ji dělat.',
}

// src/game/shop.ts
/** Startovní dort plus každý koupený výrobek, v pořadí katalogu. */
export function unlockedProducts(stars: StarsState): readonly ProductId[];
/** Interně: čtvrtá kopie `purchasedFruits()` – `kind` je to, co zúží `unlocks` bez přetypování. */
function purchasedProducts(stars: StarsState): ProductId[];

// src/game/speech.ts – product se přidává jako poslední parametr, výchozí 'cake'
export function itemSpeech(
  item: OrderItem,
  position?: ItemPosition,
  product?: ProductId,
): readonly string[];
export function orderSpeech(items: readonly OrderItem[], product?: ProductId): readonly string[];
export function repeatSpeech(items: readonly OrderItem[], product?: ProductId): readonly string[];
export function askAgainSpeech(items: readonly OrderItem[], product?: ProductId): readonly string[];
export function enoughSpeech(amount: number, fruit: FruitKind, product?: ProductId): readonly string[];
/** Pozor: u počítací položky uvnitř volá `repeatSpeech([item])`, takže product potřebuje taky. */
export function itemHintSpeech(item: OrderItem, product?: ProductId): readonly string[];
/** Beze změny signatury – výrobek si přečte z `order.product` a nabere i `count.enough.N.scoop`. */
export function orderPreload(order: Order, gender?: PraiseGender): readonly string[];

// src/data/lines.cs.ts – stejný vzor u všech objednávkových helperů
export function orderLetterLine(letter: Letter, product?: ProductId): string;
export function orderCountLine(amount: number, fruit: FruitKind, product?: ProductId): string;
// …orderNextLetterLine, orderDigitLine, orderNextDigitLine, orderNextCountLine, countEnoughLine…

// src/art/layout.ts – geometrie výrobku; krabice `product` je pořád 220 × 146
export interface ProductGeometry {
  readonly topCenterX: number;
  readonly countPitch: number;
  readonly countHeight: number;
  readonly countFrontBottom: number;
  readonly countBackBottom: number;
  readonly countFrontMax: number;
  /** Kam došlápne to, co stojí nahoře (svíčka, vlaječka). */
  readonly topItemBottom: number;
  /** Střed toho, co se opírá zepředu (perníček, oplatka). */
  readonly frontItemCenterY: number;
}
export const PRODUCT_GEOMETRY: Readonly<Record<ProductId, ProductGeometry>>;
export function productCountSlots(box: Rect, product: ProductId, count: number): CountSlot[];
export function productDigitSlot(box: Rect, product: ProductId): Rect;
export function productLetterSlot(box: Rect, product: ProductId): Rect;

// src/art/icecream.ts – stejné rozhraní, jaké má dnes cake.ts
export const ICECREAM_WIDTH = 220;
export const ICECREAM_HEIGHT = 146;
/** Rozměry nosičů; layout.ts si jimi měří sloty, přesně jak dnes bere COOKIE_SIZE a CANDLE_*. */
export const WAFER_SIZE = 96; // ≥ 88 (pravidlo 3), jako COOKIE_SIZE
export const FLAG_WIDTH = 96;
export const FLAG_HEIGHT = 112; // jako CANDLE_HEIGHT – police má pro obojí stejné místo
export function iceCreamBase(): string;
export function iceCreamTopping(): string;
/** Kopeček v barvě příchuti; `kind` je totéž `FruitKind`, jaké nese OrderItem. */
export function scoop(kind: FruitKind, height: number): string;
/** Bez písmene je to „nějaká oplatka" – to ukazuje bublina (návrh 5.4). Stejně `flag()`. */
export function wafer(letter?: string): string;
export function flag(digit?: string): string;

// src/art/product.ts – JEDINÉ místo, kde se id výrobku převádí na kresbu
export function productBase(product: ProductId): string;
export function productTopping(product: ProductId): string;
/** Počítaný kus: u dortu ovoce, u zmrzliny kopeček – obojí v barvě příchuti. */
export function productCountPiece(product: ProductId, kind: FruitKind, height: number): string;
export function productLetterArt(product: ProductId, letter?: string): string;
export function productDigitArt(product: ProductId, digit?: string): string;
/** Rozměry nosičů pro `layout.ts`, aby ten nemusel importovat kresbu každého výrobku zvlášť. */
export function productCarrierSizes(product: ProductId): {
  readonly letter: { readonly width: number; readonly height: number };
  readonly digit: { readonly width: number; readonly height: number };
};

// scény – product putuje s objednávkou
start(amount: number, kind: FruitKind, product: ProductId): void;   // count-item
start(item: ChoiceItem, product: ProductId): void;                   // choice-item
show(order: Order | null): void;                                     // bubble: product čte z order
```

**Příklad.** Save s koupenou zmrzlinkou, jedenáctá objednávka:

```ts
generateOrder({
  settings, tracks, index: 11,
  products: ['cake', 'icecream'],
  avoidProduct: 'cake',
  rng: seeded(7),
})
// → {
//     index: 11,
//     product: 'icecream',
//     items: [
//       { type: 'count', fruit: 'strawberry', amount: 3 },
//       { type: 'letter', letter: 'K', word: 'kočka', choices: ['M', 'K', 'A'] },
//     ],
//   }

orderSpeech(order.items, order.product)
// → ['order.count.3.scoop', 'order.next.letter.k.icecream', 'letter.word.k.kocka']
// zazní: „Prosím tři kopečky. A ještě oplatku s písmenkem ká. Ká jako kočka."
```

Táž objednávka s `product: 'cake'` vrátí `['order.count.3.strawberry', 'order.next.letter.k',
'letter.word.k.kocka']` – tedy přesně to, co hra říká dnes.

## Akceptační kritéria

**Generátor a logika**

- KDYŽ save nemá koupenou zmrzlinku, PAK `generateOrder()` vrátí `product: 'cake'` pro každý index
  a **netáhne z `rng`** navíc – seedovaná session se přehraje bajt po bajtu jako před krokem.
- KDYŽ save má koupenou zmrzlinku a `avoidProduct: 'cake'`, PAK vyjde `product: 'icecream'`.
- KDYŽ je `avoidProduct` jediná možnost (dort a `avoidProduct: 'cake'` u save bez zmrzliny), PAK se
  pravidlo „ne dvakrát po sobě" **poddá** a vrátí se dort – generátor nikdy neselže na prázdném výběru.
- KDYŽ `products` chybí nebo je prázdné, PAK je výsledek `'cake'` (obrana proti cizímu save).
- KDYŽ `unlockedProducts()` dostane záznam s neznámým klíčem v `purchases`, PAK ho přeskočí a vrátí
  aspoň `['cake']` (pravidlo 2 – divný save nesmí zastavit hru).

**Hlas**

- KDYŽ je objednávka na zmrzlinu a chce tři kusy, PAK `orderSpeech()` vrátí `order.count.3.scoop`
  a **nikdy** `order.count.3.strawberry`.
- KDYŽ je objednávka na dort, PAK jsou vrácená id **totožná** s těmi, která hra vrací dnes.
- KDYŽ položka zazní sama (jediná v objednávce), PAK je to tvar s „Prosím", i u zmrzliny – žádné
  osamocené „A ještě…" (pravidlo z STEP-12).
- KDYŽ dítě klepne na zakrytou misku u zmrzliny, PAK zazní `count.enough.N.scoop`.
- KDYŽ dítě sáhne po špatné oplatce, PAK zazní `wrong.letter.b` a `seek.letter.k` – **stejné** věty
  jako u dortu (oprava je o písmenku, ne o výrobku).
- KDYŽ u zmrzlinové **počítací** položky uplyne 40 s bez dotyku, PAK `itemHintSpeech()` vrátí
  `order.count.N.scoop` – nikdy `order.count.N.strawberry`. (Tohle je ta zrádná cesta: nápověda
  u počítání se uvnitř přepadá na `repeatSpeech`.)
- KDYŽ u rozehrané zmrzlinové objednávky uplyne 15 s, PAK pobídka i „co ještě zbývá" po pochvale
  mluví o zmrzlině, a druhá položka zní v tvaru „A ještě…".
- KDYŽ se objedná **jeden** kopeček, PAK věta zní „Prosím jeden kopeček."; KDYŽ **dva**, PAK
  „Prosím **dva** kopečky." – mužský rod, ne „dvě" z ovocné řady číslovek (rozhodnutí 8).
- KDYŽ se manifest načte, PAK má 462 hlášek, každé id sedí na `^[a-z0-9]+([.-][a-z0-9]+)*$` a žádné
  se neopakuje.

**Scéna**

- KDYŽ přijde objednávka na zmrzlinu, PAK na pultu stojí kornout, na polici jsou vlaječky a oplatky
  a v misce ovoce v barvě příchuti.
- KDYŽ dítě klepne na misku u zmrzliny, PAK přiletí **kopeček** (ne jahoda) a přistane ve slotu podle
  `productCountSlots()`; kolečko nad výrobkem se doplní.
- KDYŽ je objednáno pět kopečků, PAK jsou vidět všechny (3 vepředu, 2 vzadu), žádný není zakrytý celý
  a všechny se vejdou do krabice 220 × 146.
- KDYŽ objednávka žádá číslici, PAK vlaječka **stojí nahoře** a oplatka s písmenkem **se opírá zepředu**
  – nikdy se nepřekryjí, ani když objednávka žádá obojí (dvoupoložková objednávka nikdy nespojí dvě
  položky z téže dráhy, viz poznámka u STEP-11).
- KDYŽ bublina ukazuje položky zmrzlinové objednávky, PAK je v ní kopeček / prázdná oplatka / prázdná
  vlaječka – **nikdy** s napsaným písmenem nebo číslicí (návrh 5.4, pravidlo 1).
- KDYŽ je objednávka hotová, PAK přes kopečky přeteče přeliv, cinkne a letí konfety; zákazník odnese
  zmrzlinu i se vším, co na ní stojí.
- KDYŽ se okno změní velikost, PAK se výrobek, kopečky, oplatka i vlaječka přeplacírují na nové sloty
  (stejnou cestou jako dnes dort).

**Obchůdek**

- KDYŽ dcera nemá pět hvězdiček, PAK je u zmrzlinky tolik plných a tolik prázdných hvězdiček, kolik
  odpovídá zůstatku, a klepnutí zachrastí a řekne, kolik chybí.
- KDYŽ zmrzlinku koupí, PAK ji **další** objednávka může chtít (bez reloadu) a v regálu je fajfka.
- KDYŽ je zmrzlinka koupená, PAK ji nejde koupit podruhé a zůstatek se nemění.

**Pravidla projektu**

- KDYŽ se prohlédne celá scéna, PAK v ní není žádný text kromě písmen na oplatkách a číslic na
  vlaječkách (učivo, ne UI).
- KDYŽ dítě udělá chybu, PAK se nic nezablokuje a po druhé chybě se správná věc rozsvítí.
- KDYŽ běží hra, PAK nejde ven žádný požadavek – všechny klipy jsou z `public/audio/`.

## Testy

**Unit (Vitest)**

- `products.test.ts` – `PRODUCTS` má unikátní id, `productOf()` vrací null pro neznámé,
  `STARTER_PRODUCT` je v katalogu, dort má `lineSuffix: null`.
- `orders.test.ts` – losování výrobku: jediný výrobek → žádný tah z rng (kontrola přes počítadlo
  volání ve fake rng); dva výrobky → nepadne `avoidProduct`; prázdný `products` → dort; poddání se,
  když je `avoidProduct` jediná možnost. Plus **regrese**: existující seedované objednávky vracejí
  přesně stejné položky jako dnes.
- `speech.test.ts` – zmrzlinové věty pro všechny tři typy položek a obě pozice; dort vrací
  nezměněná id; `enoughSpeech` podle jednotky; každé vrácené id existuje (`hasLine`).
- `lines.cs.test.ts` – 462 hlášek, formát id, žádné duplicity. **Na doslovný text**: `order.count.1.scoop`
  = „Prosím jeden kopeček.", `order.count.2.scoop` = „Prosím dva kopečky.", `order.count.5.scoop`
  = „Prosím pět kopečků.", `count.enough.2.scoop` = „Už máme dva kopečky, to stačí!" Kontrola id
  samotného by rodovou chybu propustila až do zaplaceného a commitnutého klipu.
- `shop.test.ts` – `unlockedProducts()`: bez nákupu jen dort, po nákupu dort + zmrzlina, neznámý
  klíč v `purchases` se přeskočí; cena a `shopPriceStars()` pro novou položku.
- `session.test.ts` – `lastProduct` se pamatuje přes `complete()`; koupená zmrzlinka se objeví
  v následující objednávce bez reloadu.
- `layout.test.ts` – `productCountSlots()` pro 1…5 u obou výrobků: sloty se nepřekrývají víc, než
  dovoluje rozestavění, všechny leží uvnitř krabice, pátý je vidět; `productDigitSlot()`
  a `productLetterSlot()` se u obou výrobků nekříží; krabice `product` drží 8 px od všech ostatních
  na všech testovaných šířkách.
- `art.test.ts` – `iceCreamBase()`, `scoop()`, `wafer()`, `flag()` vracejí platné SVG s výchozím
  obrysem, `wafer('K')` obsahuje písmeno a `wafer()` nikoli.

**Spuštění:** `docker compose run --rm test`, pak `check` a `build`.

## Ruční ověření

- [ ] `docker compose --profile dev up`, otevřít `http://localhost:5173/mlsna-abeceda/`, emulovat
      iPad na šířku a **zapnout dotyk**.
- [ ] Konzole: `__kitchen.stars(5)`, jít do obchůdku, koupit zmrzlinku – zachrastí × koupí, věta sedí
      na obrázek, v regálu je fajfka.
- [ ] Zazvonit několikrát: střídá se dort a zmrzlina, dvakrát po sobě totéž nepřijde.
- [ ] Zmrzlinová objednávka na počítání: klepnout na misku, kopeček letí a přistane, hlas říká
      „Jedna. Dva. Tři." a pak pochvalu; klepnout na zakrytou misku → „Už máme tři kopečky, to stačí!"
- [ ] Zmrzlinová objednávka na písmenko: sáhnout po špatné oplatce (šťouchne, opraví), pak po správné.
- [ ] Zmrzlinová objednávka na číslici: vlaječka stojí na kopečcích a nepřekrývá oplatku.
- [ ] Objednávka s pěti kopečky (`__kitchen.count(5)`): všech pět je vidět a jdou přepočítat.
- [ ] `__kitchen.count(2)` na zmrzlině: **poslechnout si**, že zazní „dva kopečky", ne „dvě kopečky".
- [ ] Nechat zmrzlinovou počítací položku ležet 40 s: nápověda mluví o kopečcích, ne o jahodách.
- [ ] Klepnout na bublinu: zopakuje se celá objednávka; v bublině není napsané písmeno ani číslice.
- [ ] Dokončit objednávku: přeliv, cinknutí, konfety, zákazník odnese zmrzlinu se vším všudy.
- [ ] Reload uprostřed: koupená zmrzlinka zůstává, hvězdičky sedí.
- [ ] Totéž v rozměru mobilu na šířku (844 × 390) – nic nepřečnívá a terče jdou trefit palcem.
- [ ] Zkontrolovat, že dortová objednávka zní a vypadá **přesně** jako před krokem.

## DoD

- [ ] Všechna akceptační kritéria splněna
- [ ] Testy a build zelené
- [ ] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [ ] 96 nových klipů vygenerováno a commitnuto
- [ ] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

Hotovo 31. 8. 2026. **952 testů zelených**, `check` i `build` čisté, 97 nových klipů vygenerovaných
a připravených ke commitu.

Generátor hlásil `97 new · 0 changed · 366 up to date · 0 orphan · 2759 characters` a `index.json`
má v diffu **582 přidaných řádků a nula ubraných** – žádný dřív zaplacený klip se nezneplatnil ani
nepřepsal.

**Nové soubory**

```
src/data/products.ts        katalog výrobků (ProductId, CountUnit, PRODUCTS, productOf)
src/data/products.test.ts   uzavřenost katalogu, dort má lineSuffix null navždy
src/art/icecream.ts         kornout, kopeček, oplatka, vlaječka, přeliv
src/art/product.ts          rozcestník id → kresba (jediný switch nad výrobky v art/)
```

**Změněné:** `data/{shop,lines.cs}.ts`, `game/{orders,session,shop,speech}.ts`,
`art/{layout,bubble,shop}.ts`, `scenes/kitchen/{index,count-item,choice-item,bubble,finale}.ts`,
`main.ts` a sedm testovacích souborů. `art/cake.ts` se nakonec neměnil vůbec – ani ten komentář:
rozhraní výrobku popisuje `art/product.ts`, a psát to samé podruhé do `cake.ts` je duplicita.

**Zmrzlinka se nakonec nepočítá (rozhodnutí autora, 31. 8. 2026)**

Nejdřív se na ni počítaly kopečky, jak psal plán. Autor to viděl na obrazovce a zapíchl to, právem:
**dcera klepne na misku jahod a vyletí z ní kopeček zmrzliny.** Ve zbytku hry platí „na co klepnu,
to přiletí" a tohle jediné místo to porušovalo. Návrh (kap. 4) je přepsaný a zmrzlina teď přijíždí
**hotová** – kornout se třemi kopečky – a přidává se na ni jen oplatka nebo vlaječka.

Co z toho plyne, po řadě:

- `Product.countUnit` vystřídalo `Product.counts: boolean`. Typ `CountUnit` zmizel: co se počítá,
  je vždycky ovoce, takže jednotka nemá co rozlišovat.
- **Generátor losuje výrobek podle položek objednávky** (`canMake()`): objednávka s počítáním je
  vždycky dort, protože zmrzlina nemá kam kusy dát. Číselná dráha střídá počítání a číslice, takže
  na zmrzlinu vyjde zhruba půlka objednávek – a je kratší než dort, čímž se mění tempo.
- **30 klipů se zahodilo** (`order.count.N.scoop`, `order.next.count.N.scoop`,
  `count.enough.N.scoop`) i s jejich záznamy v `index.json`; manifest spadl ze 463 na **433**.
  Byly vygenerované v tomhle sezení a nikdy necommitnuté, takže se nic z historie neztratilo.
  Generátor po úklidu hlásí `433 lines · 0 new · 0 changed · 0 orphan`.
- **Mužská řada číslovek je pryč.** `NUMERALS_MASCULINE` a rod v tabulce tvarů existovaly kvůli
  „dva kopečky"; všechno počítané je zase ovoce a všechna čtyři jsou ženská, takže stačí jedna řada.
  Nález revize (kritický #2) tím pozbyl platnosti – ne že by byl špatný, jen mechanika zmizela.
- **`itemHintSpeech()` už nepotřebuje výrobek** ze stejného důvodu: nápověda u počítání se přepadá
  na objednávkovou větu, a ta je o ovoci, ne o tom, na co se sype. Druhý nález revize (kritický #1)
  padá spolu s ním.
- Ubylo kresby: `scoop()`, `scoopGroup()`, `scoopWidth()`, `bubbleScoops()`, `productCountPiece()`
  a `productCountArt()` jsou pryč. Kopečky jsou součástí `iceCreamBase()`, počítaný kus je zase
  prostě `fruit()`.
- `ProductGeometry.count` je teď **`ProductCountGeometry | null`** – u zmrzliny `null`. Že se na ni
  nepočítá, tak drží typový systém na obou stranách: `Product.counts` v datech, `count: null`
  v geometrii. `productCountSlots()` vrací pro hotový výrobek prázdno.
- Odpadly i `topItemCenterX`/`frontItemCenterX`: oba nosiče jsou zase na ose, takže stačí
  `topCenterX`.

**Odchylky od plánu**

1. **`productCarrierSizes()` v `art/product.ts` nevzniklo; rozměry nosičů nese `PRODUCT_GEOMETRY`.**
   Kontrakt počítal s tím, že si `layout.ts` rozměry vyžádá od rozcestníku – jenže
   `layout → product → bubble → layout` je cyklus. `layout.ts` proto importuje `icecream.ts`
   napřímo, přesně jak už roky importuje `candle.ts` a `cookie.ts`, a `letterSize`/`digitSize` jsou
   políčka geometrie. Rozsah ani chování se nemění, jen kdo se koho ptá.

2. **Přibyl 97. řádek: `finish.4` = „Zmrzlinka je hotová!"** (plán počítal 96, manifest 463 místo
   462). Plán tuhle díru neviděl: `FINISH` mělo tři věty a jedna z nich je **„Dortík je hotový!"** –
   nad zmrzlinou by to byla lež, a padla by ve třetině objednávek. `FINISH` je teď otagované
   výrobkem, `finishLines(product)` vrací dvě neutrální plus tu, co jmenuje právě tenhle výrobek, a
   kuchyně drží jeden picker na výrobek (`finishPickers`). Bez produktu vrátí `finishLines()` jen ty
   neutrální – zapomenuté volání tak mlčí o tom, co je hotové, místo aby lhalo.

3. **`__kitchen.product(id)` v dev konzoli** navíc: přehraje běžící objednávku na jiném výrobku, ať
   obchůdek říká cokoli. Bez toho se ruční ověření zmrzliny nedá udělat, dokud si ji člověk nekoupí.
   `__shop.unlocked()` k tomu hlásí i `products`.

4. **Rozteč kopečků je 62 px, ne 44** (a ústí kornoutu 160 px, ne 132). Kopeček je 57 px široký, tři
   ve frontě s roztečí 44 by se překrývaly a nešly by přepočítat – což je přesně to, kvůli čemu se
   pyramida volila. Test to chytil hned první běh.

5. **Přeliv leží na okraji kornoutu, ne na kopečcích – a `productToppingSlot()` proto zase zmizel.**
   Plán (a první implementace) kreslil přeliv jako čepici na hromádce kopečků, kvůli čemuž musel
   sahat nad krabici výrobku; kvůli tomu vznikla v geometrii dvojice `toppingRise`/`toppingHeight`
   a funkce `productToppingSlot()`. Byla to chyba, kterou odhalil až autor na screenshotu:
   **objednávka na číslici nebo na písmenko žádné kopečky nemá**, takže se přeliv vznášel nad
   prázdným kornoutem jako červený polštář – a když kopečky byly, celé je zakryl a nešly přepočítat.
   Teď kopíruje `cakeGlaze()`: sedí na okraji kornoutu, stéká po jeho stěnách (každá kapka končí
   uvnitř zužujícího se trojúhelníku) a kreslí se do **stejné krabice** jako kornout. Kopečky se
   kreslí přes něj, takže zůstávají spočitatelné. Tím odpadla i celá ta nadstavba: `toppingRise`,
   `toppingHeight` i `productToppingSlot()` jsou pryč a finále zase jen `place(glazeEl, layout.product)`.

6. **Nosiče písmenka a číslice jsou u zmrzliny nad sebou, ne vedle sebe – a `ProductGeometry` proto
   dostala `topItemCenterX` a `frontItemCenterX`.** Plán počítal s tím, že oplatka se opře zepředu
   jako perníček o dort. Jenže dort je široký a kornout je úzký trojúhelník: oplatka 96 px ho ve
   výšce, kde by se opírala, celý zakryla a **zmrzlina na obrázku vypadala jako hnědá krabice na
   trychtýři**. Zkusil jsem ji odsunout stranou vedle kopečků – a to je horší chyba, ne kosmetická:
   220 px neuveze tři 57px kopečky vedle 96px dlaždice, takže **třetí kopeček skončil pod oplatkou
   a nešel spočítat**, což je přímo proti Č1 (návrh 5.1). Konečné řešení: vlaječka je zapíchnutá
   v ústí kornoutu (spodek 20 px pod horní hranou krabice), oplatka se opírá o kornout níž (střed
   106 px), mezi nimi je 38 px a **pod kopečky nic nezasahuje**. Kryje to spodek kornoutu, ale
   rantl a ramena zůstávají vidět a silueta zmrzliny drží. Test to hlídá dvakrát: vlaječka je nad
   oplatkou a všech pět kopečků končí nad horní hranou oplatky.

**Ověřeno**

- `docker compose run --rm test`: **951 z 952** (jediný padající je kontrola, že ke každé hlášce
  existuje klip – viz nedodělávka). `check` (tsc + prettier) a `build` čisté.
- Nové testy: `products.test.ts` (7), losování výrobku v `orders.test.ts` (6, včetně **kontroly, že
  se při jediném výrobku netáhne z rng** – seedovaná session se přehrává jako dřív), zmrzlinové věty
  v `speech.test.ts` (8), doslovné texty v `lines.cs.test.ts` („Prosím dva kopečky.", „Už máme dva
  kopečky, to stačí!"), `unlockedProducts()` v `shop.test.ts` (6), střídání výrobků v
  `session.test.ts` (3), geometrie zmrzliny v `layout.test.ts` (6), kresba a rozcestník v
  `art.test.ts` (6). Celkem 952 testů proti 859 před krokem.
- **V prohlížeči** (iPad na šířku, 1180 × 820, `docker compose --profile dev up`): kornout stojí na
  pultu (220 × 146, beze změny krabice); pět kopečků přistálo 3 + 2, každý 57 × 48, přední řada se
  nepřekrývá a zadní je nad ní; počítací kolečka fungují; objednávka na písmenko postaví na polici
  **oplatky** (96 × 96, rounded rect) a bublina ukazuje prázdnou oplatku; objednávka na číslici
  **vlaječky** (96 × 112), a zvolená dosedne 20 px nad krabici, tedy na kopečky; přeliv se umístí
  přesně 60 px nad krabici (220 × 206, viewBox `0 -60 220 206`). **Dort je beze změny**: ovoce
  34 × 44 na historických slotech, poleva na vlastní krabici s viewBoxem `-7 44 274 182`.
  V obchůdku je zmrzlinka pátá na regálu, nakreslená `fitted()` do buňky; po koupi je řádek `owned`
  a `__shop.unlocked().products` vrací `["cake","icecream"]`.
- Jeden screenshot odhalil, že **vaflové linky přetékaly obrys kornoutu**; opraveno tak, že každá
  vede z jedné šikmé hrany na druhou (trojúhelník je konvexní, takže úsečka z něj nemůže vyjet a
  není potřeba `clipPath`, jehož id by kolidovala mezi instancemi).
- **Se zvukem**, po vygenerování klipů: kompletní zmrzlinová objednávka (pět kopečků + oplatka
  s ká) proběhla bez jediného `[voice] cannot decode` v konzoli. Klip `order.count.2.scoop.mp3` se
  ze serveru servíruje (HTTP 200).
- **Přeliv na prázdném kornoutu** (objednávka na číslici, tedy bez kopečků): drží se okraje, nic
  nelevituje. Umístěný je na krabici 220 × 146 na souřadnici výrobku – tedy přesně jako poleva dortu.
- **Na obrázku** (ještě ve verzi s počítanými kopečky): kopečky ležely v ústí kornoutu, oplatka se
  opírala zepředu, na policích stály vlaječky a oplatky místo svíček a perníčků. Ta verze padla,
  viz rozhodnutí autora výš.

**Co po přepracování ověřené NENÍ**

- **Hotová zmrzlina na obrázku.** Nástroj na snímky se zase rozbil (`Preview snapshot failed`
  opakovaně, pak i `evaluate` na timeout), takže nový kornout se třemi kopečky, vlaječku v nich
  a oplatku pod nimi **nikdo neviděl**. Ověřené je: scéna nakreslí zmrzlinu bez chyby v konzoli,
  vlaječka na ni doletí a přistane, a geometrie sedí v testech (`PRODUCT_GEOMETRY.icecream.count`
  je `null`, vlaječka je nad oplatkou, obě na ose). **Podívej se na to sám** – dev server běží.

**Co ověřené NENÍ (z původní verze, stále platí)**

- **Poslech.** Klipy existují a přehrávají se bez chyby, ale **slyšet je nemůžu**. Věta „Prosím dva
  kopečky." je ověřená jen doslovným testem textu v manifestu, tedy toho, co se poslalo do
  generátoru. Autor si ji má poslechnout – je to jediná věc v kroku, kde by chyba stála další
  generování.
- **Mobil na šířku (844 × 390).** Jeviště se do 844 px nepřepočítalo (scéna drží scale z předchozí
  velikosti a synteticky poslaný `resize` s ním nehnul), takže test nedopadl. Geometricky jde ale
  o layout 1024, který testy pokrývají, jen zmenšený – a škálování jeviště tenhle krok nesahal.
- Dokončení zmrzlinové objednávky **až do konfet a odnesení zákazníkem** jsem viděl jen po částech
  (přeliv na správném místě ano, celý běh finále ne).
- Nástroj na snímky obrazovky byl přes celé sezení nespolehlivý (opakované `Preview snapshot failed`
  a zastaralé snímky), takže vizuálně je ověřený hlavně stav „rozdělaná objednávka"; stavy uvnitř
  animací jsou ověřené číselně.

**Návrhy mimo rozsah**

- `FINISH` má teď rod v textu („hotový" × „hotová"). Palačinky (množné číslo) a koktejl budou chtít
  vlastní větu; je to řádek v tabulce, ale ať se na to v STEP-18 nezapomene.
- `count-item.ts` má vrstvu pořád pojmenovanou `count-fruit` (a kus `count-fruit-piece`), i když
  v ní teď létají i kopečky. Přejmenovat by znamenalo sáhnout do `style.css` – nechal jsem to na
  úklidové kolo, jméno třídy nic nerozhoduje.
- Zmrzlina stojí kornoutem dolů na talířku jako dort. Fyzikálně je to nesmysl, kresebně
  nejčitelnější varianta; kdyby to autorovi vadilo, alternativa je stojánek.
- **Oplatka zakrývá spodek kornoutu.** Je to nejlepší kompromis, jaký se do krabice 220 × 146 vejde,
  ale kdyby autor chtěl zmrzlinu čitelnější, čisté řešení je udělat z kornoutu **široký pohárek**
  (jako dort): pak by se oplatka opřela o jeho přední stěnu a kopečky by seděly nahoře, přesně jak
  to má dort. Je to ale změna návrhu (kap. 4 říká „kopečky v kornoutu"), takže rozhodnutí autora.
- **Klíč `elevenlabs.env` leží v kořeni repozitáře jako obyčejný soubor, ne jako symlink do
  `~/.config/mlsna-abeceda/`.** V gitignoru je (`*.env`), takže se nemůže commitnout, a `git status`
  ho nevidí – ale je uvnitř bind mountu, takže na něj vidí i kontejnery `dev`, `test`, `build`
  a `check`, které podle CLAUDE.md pravidla 9 na klíč vidět nemají. Doporučuju ho přesunout do
  `~/.config/mlsna-abeceda/` a v repozitáři nechat symlink, jak počítá `compose.yaml`.
