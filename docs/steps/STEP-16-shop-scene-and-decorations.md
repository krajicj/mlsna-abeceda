# STEP-16 · Obchůdek: scéna, košík a výzdoba kuchyně

Status: done
Milník: M3 · Po: [STEP-15](./STEP-15-shop-catalogue-and-unlocks.md) · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 7 (bod 3), 4, 5.6

## Shrnutí

[STEP-15](./STEP-15-shop-catalogue-and-unlocks.md) dodal katalog, nákup a brány, kterými se koupené
věci propíšou do hry — jenže koupit se dá jedině z konzole. Tenhle krok dodá **druhou půlku
obchůdku: to, co je vidět.** Přibude třetí scéna `shop` s regálem šesti věcí, cenou v prázdných
a plných hvězdičkách, otázkou a velkým ✓ / ✗; do kuchyně přibude **košík v pilulce s hvězdičkami**
(cesta do obchůdku) a **výzdoba** — okno se záclonami, kytka na parapetu, kočička a rádio na
poličce — kreslená podle `ownedDecorations()`.

Nové hlášky ani zvuky krok nepotřebuje: `shop.ask.*`, `shop.bought.*`, `shop.short.1–5`,
`shop.hello.*` i efekty `shop.buy` a `shop.rattle` vygeneroval STEP-15. **Generátor hlasu se
nepouští.**

Po tomhle kroku je smyčka odměn celá: dcera plní objednávky → dostává hvězdičky → utrácí je →
kuchyně se mění a chodí do ní nový zákazník. Z toho pak žije [STEP-19](../plan.md) (zmrzlinka jako
další řádek katalogu) i album ([STEP-17](../plan.md)).

## Rozsah

**V rozsahu**

- Scéna `shop`: pozadí, regál se dvěma prkny, šest věcí v katalogovém pořadí, cena pod věcí,
  počítadlo zůstatku, dveře zpátky do kuchyně.
- Nákup ve scéně: klepnutí → věc poskočí → karta s otázkou a ✓ / ✗ → `session.buy()`.
  Málo hvězdiček → věc zachrastí + „Chybí ti N hvězdiček“. Koupená věc → fajfka + „…je tvoje!“.
- Košík v pilulce s hvězdičkami: kresba, terč, probouzení a usínání spolu se zvonečkem.
- **Změna zadání autorem (srpen 2026, během implementace):** okno, záclony a kytka se ruší úplně,
  i z katalogu. Katalog má nově čtyři řádky (maliny, žabka, kočička, rádio) a regál si nechává
  šest míst — postupně se zaplní, jak budou věci přibývat (návrh 7.3).
- Dvě věci do kuchyně, obě **klepatelné** (návrh 7.3a): **kočička** leží vpravo dole na podlaze
  a na klepnutí se protáhne a zamňouká (zvuk `customer.cat.hello` už existuje z STEP-10);
  **rádio** je vestavěné do linky místo posledních dvířek a na klepnutí zahraje pár tónů
  (nový efekt `decor.radio.tune`).
- Čistá funkce `shopPriceStars()` v `src/game/shop.ts` + testy layoutu obchůdku a výzdoby.

**Mimo rozsah**

- Album, překvapení, zmrzlinka a další výrobky, rodičovský koutek (vlastní kroky).
- Prodavač v obchůdku (zvířátko za pultem) — obchůdek mluví vypravěčem, jako celá hra.
- Nové hlášky, nové zvukové efekty, běh generátorů.
- Hudba v obchůdku, i když se koupí rádio (v1 je bez hudby, `CLAUDE.md`).
- Prodej zpátky, dárkové balení, sleva, druhý regál pro víc zboží (katalog má šest řádků).
- Změna geometrie kuchyně (police, pult, miska, dort, zvoneček se **nehnou o pixel**).
- Hudba na pozadí — rádio hraje jen krátký efekt na klepnutí, v1 je bez hudby (`CLAUDE.md`).

## Implementace

**Soubory**

```
src/art/basket.ts             (nový)  ikona košíku
src/art/shop.ts               (nový)  pozadí obchůdku, prkna regálu, cenová hvězdička, fajfka,
                                      karta s otázkou, tlačítka ✓ / ✗, dveře, obrázek zboží
src/art/decor.ts              (nový)  záclony, kytka, spící kočička, rádio (zastavení A – prodává
                                      je regál); okno a polička (zastavení B – jen kuchyně)
src/art/svg.ts                (změna) fitted() – táž kresba menší, beze změny poměru stran
src/art/layout.ts             (změna) shopLayout(), decorLayout(), starsHitSlot(), KITCHEN_WINDOW
src/art/star.ts               (změna) starsPill(count, { shop }) – košík v pilulce
src/art/kitchen.ts            (změna) okno se kreslí do pozadí
src/art/layout.test.ts        (změna) invarianty obchůdku a výzdoby
src/art/art.test.ts           (změna) nové art moduly v tabulce
src/game/shop.ts              (změna) shopPriceStars()
src/game/shop.test.ts         (změna) testy shopPriceStars()
src/scenes/shop/index.ts      (nový)  scéna obchůdku
src/scenes/shop/style.css     (nový)
src/scenes/kitchen/stars.ts   (změna) pilulka je tlačítko; košík spí a probouzí se se zvonečkem
src/scenes/kitchen/decor.ts   (nový)  vrstva výzdoby
src/scenes/kitchen/index.ts   (změna) zapojení výzdoby a košíku, preload hlášek obchůdku
src/scenes/kitchen/style.css  (změna) .kitchen-stars je klikatelná, .kitchen-decor
src/stage/scenes.ts           (změna) SceneName + 'shop'
src/main.ts                   (změna) registrace shopScene
```

**Knihovny** – žádné nové. Runtime závislosti zůstávají na nule.

**Kroky**

Krok je rozdělený na **dva zastavovací body**; každý se zvlášť ověří v prohlížeči a zvlášť
commitne, mezi nimi se čeká na autora.

_Zastavení A — obchůdek a košík_

1. `src/game/shop.ts`: `shopPriceStars(entry)` + testy (plné = kolik na to má, prázdné = kolik
   chybí; koupená věc nemá cenu vůbec).
2. `src/art/svg.ts`: `fitted()` — obecný způsob, jak nakreslit hotový obrázek jeho přirozené
   velikosti menší, beze změny poměru stran (potřebuje ho regál pro žabku i pro výzdobu).
3. `src/art/layout.ts`: `shopLayout(stageWidth)`, `shopGoodPicture()`, `shopPriceSlots()`,
   `starsHitSlot()`. Testy invariantů na 1024, 1200 i 1366.
4. `src/art/basket.ts` a `starsPill(count, { basket })`: košík do pilulky, `starSlot()` srovnat na
   novou pozici hvězdičky uvnitř pilulky (letí do ní hvězdička z finále).
5. `src/art/decor.ts`: **čtyři kresby výzdoby** — záclony, kytka, spící kočička, rádio, každá ve
   své přirozené velikosti vyvezené jako konstanta (úmluva `candle.ts` / `cookie.ts`). Patří sem,
   a ne až do zastavení B: regál je prodává, takže je musí umět nakreslit už obchůdek. Okno
   a polička, které jsou jen věc kuchyně, přibudou do téhož modulu v zastavení B.
6. `src/art/shop.ts`: pozadí, prkna, cenová hvězdička (plná / prázdná), fajfka, karta, ✓ / ✗,
   dveře, `shopGoodArt(item, box)`.
7. `src/scenes/shop/index.ts` + `style.css`: sestavení scény, tři stavy klepnutí (dost / málo /
   koupeno), karta s otázkou, cesta zpátky.
8. `src/stage/scenes.ts` a `main.ts`: `SceneName + 'shop'`, registrace scény.
9. `src/scenes/kitchen/stars.ts` + `index.ts`: pilulka je tlačítko, košík se probouzí a usíná
   přesně tam, kde `bell.show()` / `bell.hide()`; `voice.preload(shopPreload())` při stavbě scény.
10. Testy, `check`, `build`, ruční ověření (tablet i mobil na šířku), commit.

_Zastavení B — výzdoba v kuchyni_

11. `src/art/decor.ts`: okno a polička (zbytek kreseb je hotový ze zastavení A).
12. `src/art/kitchen.ts`: okno do pozadí (kreslí se vždycky).
13. `src/art/layout.ts`: `KITCHEN_WINDOW` a `decorLayout(stageWidth)` + testy odstupů od kuchyně.
14. `src/scenes/kitchen/decor.ts` a zapojení do scény.
15. Testy, `check`, `build`, ruční ověření, commit.

**Klíčová rozhodnutí**

- **Obchůdek je samostatná scéna, ne panel přes kuchyni.** Návrh mluví o „obchůdku“ jako o místě
  a regál se šesti věcmi a cenami se přes kuchyni nevejde. Vedlejší zisk: návrat do kuchyně scénu
  postaví znovu, takže **koupená výzdoba i nové ovoce naskočí samy** — žádná logika „překresli
  kuchyni po nákupu“. Rozehraná objednávka se ztratit nemůže: do obchůdku se dá odejít jedině
  s prázdným pultem.
- **Celá pilulka s hvězdičkami je tlačítko** (rozhodnutí autora, srpen 2026). Kresba zůstane
  160×64 na svém místě, jen přibude ikona košíku vedle čísla; **kuchyně se nemění**. Terč se
  neviditelně roztáhne na 160×84, tedy na celý pruh mezi horní hranou jeviště a policí na číslice.
  → **Vědomá odchylka od pravidla 3** (88 logických px): 84 px je na mobilu 42 fyzických px místo
  44. Cena za alternativu (pilulka 88 vysoká) je posun horní police o 16 px níž, což autor
  odmítl. Zapsáno v `docs/plan.md` i tady, ať to není tichý ústupek.
- **Vnitřek pilulky je napevno daný**, protože do 160 px se tři věci vejdou jen jednou:
  hvězdička 36 na `x = 12` (střed `y = 32`), číslo se středem na `cx = 78` velikostí 30 (u tří
  a víc číslic 24, aby se vešel i tříciferný zůstatek) a košík 36 na `x = 112`. `starSlot()` se
  srovná na nový box hvězdičky (`{ x: stars.x + 12, y: stars.y + 14, 36×36 }`) — letí do ní
  hvězdička z finále, takže rozejít se to nesmí.
- **`fitted()` v `art/svg.ts` je jediný způsob, jak nakreslit hotový obrázek menší.** Regál
  potřebuje žabku (přirozeně 260×320) v buňce 180×140 a výzdobu v témž formátu, jenže
  `customerArt()` ani nové kresby výzdoby velikost neberou — jsou psané na pevný box jako
  `candle.ts` a `cookie.ts`, a `place()` staví element vždycky na přirozenou velikost. `fitted()`
  obalí hotové markup vnějším `<svg>` s `viewBox` přirozené velikosti, `preserveAspectRatio
  ="xMidYMid meet"` a rozměry cílového boxu: obrázek se zmenší, vystředí a **poměr stran se
  nezmění**. Vnořené `<svg>` je platné SVG a nemusí se kvůli tomu sáhnout do žádné existující
  kresby. Ovoce se tímhle nezmenšuje — `fruit(kind, height)` velikost bere odjakživa.
- **Košík spí a probouzí se přesně se zvonečkem.** Dokud běží objednávka, je vybledlý a hluchý,
  s prázdným pultem se rozsvítí — stejná mluva obrázkem jako u zvonečku (kap. 4: „barevný zvoneček
  znamená zazvoň“). Za zavřenou mříží spí taky, protože mříž zvoneček nikdy neukáže. Kresba se
  **nepřeskládá**: číslo i hvězdička zůstávají na svém, mění se jen sytost košíku, takže při
  odchodu zákazníka nic neposkočí. Míst, která se tím musí ohlídat, je v `scenes/kitchen/index.ts`
  pět a tady jsou vypsaná, ať se na žádné nezapomene:
  `stars.shop(true)` ke každému `bell.show()` — (1) stavba scény (otevřená kuchyně),
  (2) `finishOrder()` v callbacku `customer.leave()`, (3) `closing`/`onOpen`;
  `stars.shop(false)` ke každému `bell.hide()` — (4) `ringBell()`, (5) `devHandle.clear()`.
  Do zavřené kuchyně se `bell.show()` nedostane, takže se o mříž nemusí starat nic navíc.
- **V obchůdku samotném pilulka žádný košík nemá.** Ukazuje jen zůstatek a na klepnutí neodpoví —
  proto má `starsPill()` tři stavy (`'none'` v obchůdku, `'asleep'` a `'ready'` v kuchyni), ne
  dva. Košík v obchůdku by sliboval cestu do obchůdku, ve kterém dcera stojí.
- **Cena = N hvězdiček, plné podle zůstatku** (rozhodnutí autora): cena 5 a zůstatek 3 → ★★★☆☆.
  Kolik chybí, jde spočítat očima přímo na regálu a sedí to na větu „Chybí ti dvě hvězdičky“
  (návrh kap. 7: „prázdné hvězdičky – zase počítání“). Rozdělení je čistá funkce v `src/game/`,
  ne detail kresby.
- **Koupená věc zůstane v regálu** (rozhodnutí autora): místo ceny má zelenou fajfku a klepnutí
  zopakuje „Maliny jsou tvoje!“ — hláška z manifestu, negeneruje se nic nového. Regál se nemění
  pod rukama a dcera vidí, co všechno už má.
- **Okno je natrvalo součástí pozadí** (rozhodnutí autora), i než si dcera cokoli koupí. Záclony
  se pak věší do něj a kytka stojí na parapetu. Alternativa „volán přes celou zeď bez okna“
  odpadla.
- **Kočička musí stát na poličce**, protože nahraná věta zní „Chceš koupit **kočičku na polici**
  za pět hvězdiček?“ (`lines.cs.ts`). Na police s perníčky a svíčkami nesmí — při čtyřech nabídkách
  jsou plné na milimetr — takže dostane **vlastní malou poličku pod oknem**, na které stojí
  i rádio. Polička se kreslí, jakmile na ní něco stojí; prázdná se neukazuje.
- **Výzdoba není součástí `kitchenLayout()`**, ale vlastní `decorLayout()` — přesně z důvodu, ze
  kterého je mimo i `closedLayout()`: 8px invariant hlídá boxy, se kterými hra pracuje, kdežto
  výzdoba je kresba a její místa se řídí volnou zdí. Testy jí měří odstupy zvlášť.
- **Terč `starsHitSlot()` taky není v `kitchenLayout()`**: dotýká se police na číslice (končí přesně
  tam, kde police začíná), takže by 8px invariant neprošel. Žádné klepnutí to nekrade — police má
  svoje vlastní terče od `y = shelfDigits.y` dolů.
- **`session.buy()` zůstává jediným zapisovatelem.** Scéna obchůdku sama neukládá nic; když
  `buy()` vrátí `false` (nemělo by, nabídka se ptá předem), karta se zavře a zazní „chybí ti…“.

**Pseudokód — tři odpovědi na klepnutí do regálu**

```
onTapGood(id):
  entry = shopEntryOf(session.save.stars, id)
  if entry == null: return                         // není v katalogu – nesmí se stát, ale nespadne
  hop(id)                                          // věc vždycky poskočí, i když se nekupuje
  if entry.state == 'owned':  voice.say(shopBoughtSpeech(id));  return
  if entry.state == 'short':  sfx.play('shop.rattle'); rattle(id)
                              voice.say(shopShortSpeech(entry.missing)); return
  openCard(entry)                                  // 'affordable'
  voice.say(shopAskSpeech(id))

onYes(id):
  if !session.buy(id):                             // nemělo by nastat, nabídka se ptá předem
    closeCard()
    // `missing` se čte ZNOVU ze záznamu; to z okamžiku otevření karty už může být zastaralé
    voice.say(shopShortSpeech(shopEntryOf(session.save.stars, id)?.missing ?? 0))
    return                                         // shopShortSpeech(0) je ticho (hasLine)
  closeCard(); sfx.play('shop.buy')
  voice.say(shopBoughtSpeech(id))
  redrawShelf()                                    // fajfka místo ceny, ceny ostatních se přepočítají
  stars.set(starBalance(session.save.stars), { pop: true })

onNo(): closeCard()                                // ticho, nic se nestalo
```

## Kontrakt

```ts
// src/game/shop.ts (nové)
export interface ShopPrice {
  /** Kolik hvězdiček ceny dcera pokryje zůstatkem – kreslí se plné. */
  readonly filled: number;
  /** Kolik jich chybí – kreslí se prázdné. Rovná se `ShopEntry.missing`. */
  readonly empty: number;
}
/** Koupená věc nemá cenu: { filled: 0, empty: 0 } – místo pruhu s cenou je fajfka. */
export function shopPriceStars(entry: ShopEntry): ShopPrice;

// src/art/svg.ts (nové)
/**
 * Hotová kresba své přirozené velikosti nakreslená do `box`: vnější `<svg>` s viewBoxem přirozené
 * velikosti a `preserveAspectRatio="xMidYMid meet"`, takže se obrázek zmenší, vystředí a poměr
 * stran zůstane. Jediný způsob, jak v téhle hře kreslit hotové markup menší.
 */
export function fitted(
  art: string,
  natural: { readonly width: number; readonly height: number },
  box: Rect,
): string;

// src/art/layout.ts (nové)
export const GOOD_WIDTH = 180;
export const GOOD_PICTURE_HEIGHT = 140;
export const GOOD_PRICE_HEIGHT = 32;
export const GOOD_GAP = 36;
export const GOOD_COLUMNS = 3; // 3 sloupce × 2 řady = šest řádků katalogu
export const PRICE_STAR = 26;
export const PRICE_STAR_GAP = 6;
export const SHOP_DOOR: Rect; // { x: 32, y: 412, width: 140, height: 280 }
export const CARD_WIDTH = 440;
export const CARD_HEIGHT = 420;
export const ANSWER_SIZE = 120; // ✓ a ✗, ≥ 88 (pravidlo 3)

export interface ShopLayout {
  /** Počítadlo zůstatku, stejný roh jako v kuchyni; v obchůdku se na něj neklepe. */
  readonly stars: Rect;
  /** Dveře zpátky do kuchyně, stojí na podlaze vlevo (spodní hrana = `FLOOR_TOP`). */
  readonly door: Rect;
  /** Dvě prkna regálu, horní první; každé je 24 px přesahující pod svou řadou. */
  readonly boards: readonly Rect[];
  /**
   * Šest buněk (obrázek + pruh s cenou pod ním); buňka je celý terč. Pořadí je `SHOP_ITEMS`
   * čtené po řádcích: 0–2 horní řada zleva doprava, 3–5 dolní. Řada je vystředěná na jevišti,
   * horní obrázky začínají na y = 150, dolní na y = 400.
   */
  readonly goods: readonly Rect[];
  /** Karta s otázkou uprostřed jeviště (`CARD_WIDTH × CARD_HEIGHT`). */
  readonly card: Rect;
  readonly yes: Rect;
  readonly no: Rect;
}
export function shopLayout(stageWidth: number): ShopLayout;
/** Horní část buňky, kam se kreslí zboží (`GOOD_PICTURE_HEIGHT` vysoká). */
export function shopGoodPicture(cell: Rect): Rect;
/** Vystředěná řada `count` (0–5) hvězdiček v pruhu s cenou pod obrázkem. */
export function shopPriceSlots(cell: Rect, count: number): Rect[];

/** Okno ve zdi kuchyně; kreslí se vždycky, `art/kitchen.ts` ho má v pozadí. */
export const KITCHEN_WINDOW: Rect; // { x: 348, y: 160, width: 192, height: 112 }

export interface DecorLayout {
  readonly window: Rect;
  /** Záclony visí v okně – stejný box. */
  readonly curtains: Rect;
  /** Kytka stojí na parapetu, tj. na spodní hraně okna. */
  readonly flower: Rect;
  /** Prkno poličky pod oknem; kreslí se, jen když na něm něco stojí. */
  readonly shelf: Rect;
  readonly cat: Rect;
  readonly radio: Rect;
}
export function decorLayout(stageWidth: number): DecorLayout;

/** Terč pilulky s hvězdičkami: celý pruh mezi horní hranou jeviště a policí na číslice. */
export function starsHitSlot(stars: Rect): Rect;

// src/art/star.ts (změna)
/**
 * `'none'` (výchozí) = jen hvězdička a číslo, jako dosud – takhle kreslí pilulku obchůdek.
 * `'asleep'` = vybledlý košík (běží objednávka), `'ready'` = plnobarevný (klepni a jdeme nakupovat).
 * Kresba je ve všech třech stavech stejně veliká a číslo je pořád na `cx = 78`, takže se přepnutím
 * stavu nic neposune.
 */
export function starsPill(
  count: number,
  options?: { readonly basket?: 'none' | 'asleep' | 'ready' },
): string;

// src/art/basket.ts (nový)
export const BASKET_SIZE = 36; // přirozená velikost ikony v pilulce
export function basket(size?: number, options?: { readonly dim?: boolean }): string;

// src/art/shop.ts (nový)
export function shopBackdrop(stageWidth: number): string;
export function shopBoard(board: Rect): string;
export function priceStar(size: number, filled: boolean): string;
export function boughtTick(size: number): string;
export function confirmCard(rect: Rect): string;
export function yesButton(size?: number): string; // výchozí ANSWER_SIZE
export function noButton(size?: number): string;
export function shopDoor(rect: Rect): string;
/**
 * Obrázek zboží už ve velikosti `box`, ať jde o cokoli:
 *  - `kind: 'fruit'`     → `fruit(item.unlocks, box.height)` (ovoce velikost bere odjakživa)
 *  - `kind: 'customer'`  → `fitted(customerArt(item.unlocks), { width: CUSTOMER_WIDTH,
 *                           height: CUSTOMER_HEIGHT }, box)` – žabka 260×320 zmenšená do buňky
 *  - `kind: 'decoration'`→ `fitted(<kresba z decor.ts>, <její přirozená velikost>, box)`
 * Přepínač je nad `item.kind`, takže nový řádek katalogu bez obrázku se nezkompiluje.
 */
export function shopGoodArt(item: ShopItem, box: Rect): string;

// src/art/decor.ts (nový) – po změně zadání zbyly dvě věci, obě klepatelné
export const DECOR_CAT_WIDTH = 112;
export const DECOR_CAT_HEIGHT = 68;
export const RADIO_WIDTH = 76;
export const RADIO_HEIGHT = 56;
export function sleepingCat(): string; // spí na podlaze; tohle prodává regál
export function radioSet(): string; // samotné rádio; tohle prodává regál
export function radioGroup(x: number, y: number, scale?: number): string;
/** Koupené rádio v kuchyni: dvířka linky pryč, v otvoru stojí rádio. Terč = celá dvířka. */
export function radioNiche(panel: Rect): string;

// src/art/layout.ts (změna) – výzdoba už není na zdi
export interface DecorLayout {
  /** Kde se kreslí kočička: vpravo dole na podlaze. */
  readonly cat: Rect;
  /** Její terč: týž box natažený nahoru na 88 px (pravidlo 3). */
  readonly catTarget: Rect;
  /** Poslední dvířka linky; rádio stojí v otvoru a dvířka jsou terč. */
  readonly radio: Rect;
}
export function decorLayout(stageWidth: number): DecorLayout;

// src/scenes/kitchen/decor.ts (nový)
export interface DecorHandle {
  layout(stageWidth: number): void;
  destroy(): void;
}
export function createDecor(options: {
  readonly root: HTMLElement;
  /** Kočička mňouká, rádio hraje – hlas se nepoužívá, objednávku to nepřeruší. */
  readonly sfx: SfxPlayer;
  /** Čte se při stavbě scény a při každém `layout()`; nákup přijde vždycky s novou scénou. */
  readonly owned: () => readonly DecorationId[];
}): DecorHandle;

// src/scenes/kitchen/stars.ts (změna)
export interface StarsHandle {
  set(count: number, options?: { readonly pop?: boolean }): void;
  /** Probudí nebo uspí košík – nakupovat jde jen s prázdným pultem. */
  shop(ready: boolean): void;
  layout(layout: KitchenLayout): void;
  destroy(): void;
}
export function createStars(options: {
  readonly root: HTMLElement;
  /** Klepnutí na probuzenou pilulku; spící neodpoví. */
  readonly onShop: () => void;
}): StarsHandle;

// src/scenes/shop/index.ts (nový)
export const shopScene: Scene;

// src/stage/scenes.ts (změna)
export type SceneName = 'title' | 'kitchen' | 'shop';
```

**Příklad.** Záznam `{ earned: 7, purchases: { 'decor.flower': 3 } }` → zůstatek 4.

| věc | cena | stav | `shopPriceStars` | v regálu |
| --- | --- | --- | --- | --- |
| `fruit.raspberry` | 3 | affordable | `{ filled: 3, empty: 0 }` | ★★★ |
| `decor.flower` | 3 | owned | `{ filled: 0, empty: 0 }` | fajfka |
| `decor.curtains` | 4 | affordable | `{ filled: 4, empty: 0 }` | ★★★★ |
| `customer.frog` | 5 | short (1) | `{ filled: 4, empty: 1 }` | ★★★★☆ |

Klepnutí na žabku → poskočí, zachrastí, „Chybí ti jedna hvězdička.“
Klepnutí na maliny → poskočí, karta, „Chceš koupit maliny za tři hvězdičky?“ → ✓ → `shop.buy`,
„Maliny jsou tvoje!“, počítadlo 4 → 1, u malin fajfka a u žabky se cena přepočítá na ★☆☆☆☆.

## Akceptační kritéria

**Obchůdek (zastavení A)**

- KDYŽ je pult prázdný (svítí zvoneček) a klepnu na pilulku s hvězdičkami, PAK se scéna přepne do
  obchůdku a vypravěč řekne „Vítej v obchůdku!“ nebo „Co si dneska koupíme?“.
- KDYŽ běží objednávka nebo je dole mříž, PAK je košík vybledlý a klepnutí na pilulku neudělá nic
  (scéna se nepřepne, nic nezazní).
- KDYŽ je obchůdek otevřený, PAK je vidět šest věcí ve třech sloupcích a dvou řadách v pořadí
  `SHOP_ITEMS` (0–2 nahoře zleva, 3–5 dole), u každé cena v N hvězdičkách, z nich plných tolik,
  kolik na ni dcera má, a vpravo nahoře zůstatek — v obchůdku **bez ikony košíku**.
- KDYŽ se v regálu kreslí žabka (přirozeně 260×320) v buňce 180×140, PAK je celá vidět, není
  oříznutá ani roztažená a stojí uprostřed buňky.
- KDYŽ klepnu na věc, na kterou hvězdičky stačí, PAK věc poskočí, otevře se karta s obrázkem věci,
  cenou a ✓ / ✗ a vypravěč řekne „Chceš koupit …?“.
- KDYŽ na kartě klepnu na ✓, PAK zazní `shop.buy` a „…je tvoje!“, karta zmizí, u věci je fajfka
  místo ceny, počítadlo klesne o cenu a ceny ostatních věcí se přepočítají.
- KDYŽ na kartě klepnu na ✗ (nebo vedle karty), PAK se karta zavře a **nic se nekoupí** — počítadlo
  ani `purchases` se nezmění.
- KDYŽ klepnu na věc, na kterou hvězdičky nestačí, PAK věc zachrastí (`shop.rattle`), vypravěč
  řekne „Chybí ti N hvězdiček“ a karta se **neotevře**.
- KDYŽ klepnu na věc, kterou už mám, PAK vypravěč zopakuje „…je tvoje!“ a nic dalšího se nestane.
- KDYŽ klepnu na dveře, PAK se vrátím do kuchyně s prázdným pultem a rozsvíceným zvonečkem.
- KDYŽ koupím žabku a vrátím se do kuchyně, PAK může přijít k pultu **bez reloadu**; KDYŽ koupím
  maliny, PAK je generátor smí zadat od příští objednávky.
- KDYŽ obchůdek zavřu a znovu otevřu (i po reloadu), PAK koupené věci mají pořád fajfku a zůstatek
  sedí — `purchases` drží.
- KDYŽ mám zůstatek 0, PAK jsou všechny ceny prázdné a nic se nedá koupit; hra se nezasekne
  a z obchůdku vede cesta ven (pravidlo 2).
- KDYŽ mám koupené všechno, PAK regál ukazuje šest fajfek a obchůdek se pořád dá otevřít i zavřít.
- KDYŽ je jeviště 1024 i 1366 px široké, PAK je celý regál, dveře i karta uvnitř jeviště a každý
  terč má aspoň 88 px.

**Kuchyně a věci z obchůdku (zastavení B)**

- KDYŽ otevřu kuchyni na novém záznamu, PAK je zeď prázdná: žádná kočička na podlaze, dvířka linky
  jsou všechna zavřená.
- KDYŽ mám koupenou kočičku, PAK leží vpravo dole na podlaze; klepnutí na ni → protáhne se
  a **zamňouká** (`customer.cat.hello`), objednávka ani zákazník se tím nepřeruší.
- KDYŽ mám koupené rádio, PAK je v **posledních dvířkách linky** místo dvířek; klepnutí → rádio se
  zakolébá a zahraje `decor.radio.tune`; druhé klepnutí během hraní nespustí druhou melodii.
- KDYŽ na kočičku nebo rádio klepnu uprostřed objednávky, PAK se nic ve hře nezmění — žádný hlas,
  žádná hvězdička, žádné pokažené počítání.
- KDYŽ se kreslí kočička nebo rádio, PAK **nepřekrývají** nic ze hry — ani pilulky nad dortem
  a svíčku na dortu, které se počítají zvlášť (nejsou v `kitchenLayout()`), na 1024 i 1366 px.
- KDYŽ je dole mříž, PAK jsou obě věci za ní a klepnutí neprojde.
- KDYŽ je záznam z novějšího buildu s neznámou věcí (`decor.lampa`), PAK se kuchyně nakreslí bez ní
  a nic nespadne (`ownedDecorations()` neznámé klíče ignoruje už od STEP-15).

## Testy

- **Unit (Vitest), `src/game/shop.test.ts`:** `shopPriceStars()` — koupená věc `{0,0}`, dostupná
  `{price,0}`, chybějící `{price−missing, missing}`; `filled + empty === price` pro každý řádek
  katalogu a pro zůstatky 0, 1, cena−1, cena, cena+1.
- **Unit, `src/art/layout.test.ts`:**
  - `shopLayout()` na 1024, 1200 a 1366: všechny boxy uvnitř jeviště, šest buněk, buňka i tlačítka
    ✓ / ✗ i dveře mají min. rozměr ≥ 88, buňky se navzájem nepřekrývají a mají ≥ 8 px mezi sebou,
    obě prkna jsou pod svou řadou, karta je vystředěná a nevyleze z jeviště, `shopPriceSlots()`
    se pro 1–5 hvězdiček vejde do pruhu s cenou a je vystředěný.
  - `decorLayout()` na 1024, 1200 a 1366: každý box uvnitř jeviště a **≥ 8 px od každého boxu
    `kitchenLayout()`** (to je ten test, který uhlídá, že výzdoba nespadne na dort ani na police);
    kytka stojí na parapetu (spodní hrana = spodní hrana okna), kočička i rádio stojí na poličce
    (spodní hrany = horní hrana prkna) a vejdou se na ni vedle sebe.
  - `starsHitSlot()`: začíná na `y = 0`, končí přesně na `shelfDigits.y`, má stejné `x` a šířku
    jako pilulka, a je **vyšší než kresba pilulky** (jinak by roztažení terče nic nedělalo).
- **Unit, `src/art/art.test.ts`:** nové moduly (`basket`, `priceStar` plná i prázdná, `boughtTick`,
  `yesButton`, `noButton`, `shopDoor`, `confirmCard`, `shopBoard`, `shopBackdrop`,
  `kitchenWindow`, `curtains`, `flowerPot`, `decorShelf`, `sleepingCat`, `radioSet`,
  `starsPill(3, { basket: 'ready' })`) projdou stávajícími pravidly: jeden `<svg>`, obrys
  `#3B2A1A`, barvy jen z palety, žádné emoji. Kresby výzdoby navíc přibudou do **tabulky
  velikostí** (jako svíčka a perníček): nakreslená velikost se musí rovnat vyvezené konstantě.
- **Unit, `fitted()` a `shopGoodArt()` (v `art.test.ts`):**
  - `fitted()` vrátí `<svg>` přesně velikosti cílového boxu, s viewBoxem přirozené velikosti
    a `preserveAspectRatio="xMidYMid meet"`, a původní markup nechá beze změny.
  - `shopGoodArt()` vrátí obrázek pro **každý** řádek katalogu (uhlídá, že nová věc v katalogu
    nezůstane v regálu prázdná) a ten obrázek má rozměry buňky, ne své přirozené — tenhle test je
    tu kvůli žabce: 260×320 v buňce 180×140 se musí zmenšit, ne oříznout ani roztáhnout.
- Spuštění: `docker compose run --rm test`, `docker compose run --rm check`,
  `docker compose run --rm build`.
- **Netestuje se automaticky:** samotná scéna (DOM, animace, hlas) — na to je ruční ověření.

## Ruční ověření

Dev server (`docker compose --profile dev up -d`, `http://localhost:5173/mlsna-abeceda/`),
Chrome, emulace iPadu na šířku. Konzole: `__shop.grant(n)` (+ reload), `__save.reset()`,
`__kitchen.ring()`, `__kitchen.finish()`, `__kitchen.close()`.

_Zastavení A_

- [ ] Nová hra: pilulka vpravo nahoře má vedle čísla **vybledlý** košík; klepnutí neudělá nic.
- [ ] `__kitchen.finish()` → zákazník odejde, svítí zvoneček → košík se rozsvítí ve stejný okamžik
      jako zvoneček; číslo ani hvězdička se nikam neposunuly.
- [ ] Klepnutí na pilulku → obchůdek, uvítací věta, šest věcí (3 × 2), vpravo nahoře stejný
      zůstatek a **bez košíku**; žabka v regálu je celá a nezdeformovaná.
- [ ] `__kitchen.clear()` v konzoli (prázdný pult bez zvonečku) → košík je vybledlý a hluchý.
- [ ] `__shop.grant(4)` + reload: u věcí za 3 jsou tři plné hvězdičky, u věcí za 5 čtyři plné
      a jedna prázdná.
- [ ] Klepnutí na věc za 5 → poskočí, zachrastí, „Chybí ti jedna hvězdička.“, karta se neotevře.
- [ ] Klepnutí na maliny → poskočí, karta, otázka; ✗ → zavře se, počítadlo se nezmění.
- [ ] Znovu maliny → ✓ → cinknutí, „Maliny jsou tvoje!“, fajfka, počítadlo 4 → 1, u ostatních věcí
      se ceny přepočítaly.
- [ ] Klepnutí na koupené maliny → jen „Maliny jsou tvoje!“.
- [ ] Dveře → kuchyně, prázdný pult, svítí zvoneček. Reload → maliny mají pořád fajfku.
- [ ] `__shop.grant(5)` + reload, koupit žabku → zpátky do kuchyně, zvonit dokola: žabka přijde
      **bez reloadu**; v některé z dalších objednávek zazní maliny.
- [ ] `__kitchen.close()` → mříž dole, košík vybledlý, klepnutí na pilulku neudělá nic.
- [ ] Klepnutí do prázdna v obchůdku (mimo zboží, mimo kartu) nic nerozbije; dvojklepnutí na ✓
      nekoupí dvakrát.
- [ ] Totéž v rozměru mobilu na šířku (844×390): celý regál, dveře i karta jsou vidět, do košíku
      i do ✓ / ✗ se dá trefit palcem.

_Zastavení B_

- [ ] `__save.reset()` + reload: zeď i podlaha prázdné, dvířka linky všechna zavřená.
- [ ] Koupit kočičku → leží vpravo dole na podlaze; klepnutí → zamňouká a protáhne se.
- [ ] Koupit rádio → je v posledních dvířkách linky; klepnutí → zahraje tóny a zakolébá se;
      rychlé druhé klepnutí nespustí druhou melodii.
- [ ] S celou objednávkou na pultu (dvě položky, bublina, dort, miska, pilulky) se ani jedna věc
      s ničím nepere a klepnutí na ně objednávku nijak neovlivní.
- [ ] `__kitchen.close()` → mříž překryje kočičku i rádio.
- [ ] Totéž v rozměru mobilu na šířku (844×390).

Co ověřit **nejde** v prohlížeči a musí to zaznít v zápisu: jak zní hlášky obchůdku na reproduktoru
tabletu a jestli se do košíku i ✓ / ✗ trefí čtyřletý prst na skutečném telefonu.

## DoD

- [ ] Všechna akceptační kritéria splněna
- [ ] Testy a build zelené
- [ ] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [ ] Odchylka od pravidla 3 (terč 84 px) zapsaná ve výsledku implementace i v `docs/plan.md`
- [ ] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

### Zastavení A — obchůdek a košík (hotovo, čeká na commit)

**Nové soubory:** `src/art/basket.ts`, `src/art/decor.ts` (záclony, kytka, spící kočička, rádio),
`src/art/shop.ts`, `src/scenes/shop/index.ts`, `src/scenes/shop/style.css`.
**Změněné:** `src/art/svg.ts` (`fitted()`), `src/art/layout.ts` (konstanty pilulky, `SHELF_DIGITS_TOP`,
`starsHitSlot()`, `starSlot()` na novou hvězdičku, `shopLayout()`, `shopGoodPicture()`,
`shopPriceSlots()`), `src/art/star.ts` (`starsPill(count, { basket })`, vyvezená `STAR_PATH`),
`src/game/shop.ts` (`shopPriceStars()`), `src/scenes/kitchen/stars.ts` (pilulka je tlačítko),
`src/scenes/kitchen/index.ts` (`onShop`, košík se zvonečkem), `src/scenes/kitchen/finale.ts`,
`src/scenes/kitchen/style.css`, `src/stage/scenes.ts`, `src/main.ts`, testy (`shop.test.ts`,
`layout.test.ts`, `art.test.ts`).

**Odchylky od plánu** (žádná nemění kontrakt ani rozsah):

1. `basketGroup()` v `art/basket.ts` a vyvezená `STAR_PATH` v `art/star.ts` — kresba se do pilulky
   a do ceny skládá jako skupina, ne jako vnořené `<svg>`; art test hlídá právě jedno `<svg>` na
   modul. Táž úmluva jako `fruitGroup()` / `starGroup()`.
2. `starGroup(x, y, size)` umí velikost (pilulka kreslí hvězdičku 36, ne 40).
3. Vnitřek pilulky, který plán fixuje v textu, je v `layout.ts` jako konstanty
   (`STARS_PILL_STAR`, `_STAR_X`, `_STAR_Y`, `_NUMBER_CX`, `_BASKET_X`) — kresba i `starSlot()`
   čtou jedno místo. Přibyly `SHELF_DIGITS_TOP` a `GOOD_HEIGHT` ze stejného důvodu.
4. `finale.ts` pouští letící hvězdičku ve velikosti `STARS_PILL_STAR` (36), aby dosedla přesně na
   hvězdičku v pilulce — `starSlot()` se zmenšil ze 40 na 36.
5. `boughtTick()` volá `orderCheck()` z `art/bubble.ts`: jedna fajfka pro celou hru, ne druhá kresba
   téhož.
6. Scéna obchůdku si bere `place()`, `layer()` a `createMotion()` z `scenes/kitchen/dom.ts` — jsou
   obecné. Přesun do sdíleného `scenes/dom.ts` by sáhl do všech modulů kuchyně; návrh na potom.
7. `stars.shop(false)` je i u všech tří spuštění mříže (`closing.close()`), nejen u pěti míst
   zvonečku: dev cesta `__kitchen.close()` jinak nechala košík svítit za mříží, což akceptační
   kritérium zakazuje.
8. **Chyba v ručním ověření plánu:** bod „Nová hra: pilulka má **vybledlý** košík“ si odporuje
   s pravidlem „košík zrcadlí zvoneček“ — nová hra začíná s prázdným pultem a rozsvíceným
   zvonečkem, takže i košík svítí. Implementováno podle pravidla a akceptačních kritérií.

**Ověřeno v prohlížeči** (Chrome, jeviště 1366 i ~1024): nová hra → košík svítí; `ring()` → zhasne,
`finish()` → po odchodu zákazníka se zase rozsvítí, číslo ani hvězdička se nehnou; klepnutí na
spící pilulku nedělá nic; klepnutí na svítící → obchůdek s uvítáním. Regál 3 × 2 v pořadí katalogu,
ceny plné/prázdné podle zůstatku (zůstatek 4: maliny ★★★, žabka ★★★★☆), pilulka v obchůdku bez
košíku, žabka zmenšená a nezdeformovaná. Klepnutí na drahou věc → zachrastí, hláška, karta se
neotevře; na dostupnou → karta s obrázkem, cenou a ✓/✗; ✗ → nic se nekoupí; ✓ → cinknutí, hláška,
fajfka, zůstatek 4 → 1, ceny ostatních přepočítané, dvojí klepnutí na ✓ koupí jen jednou; koupená
věc jen zopakuje hlášku. Dveře → kuchyně s rozsvíceným zvonečkem, nákup drží i po reloadu, koupená
žabka je ve frontě zákazníků **bez reloadu**. Mříž → košík vybledlý a pilulku překrývá clona.
Konzole bez chyb a bez chybějících klipů.

**Opraveno při ověřování:** ceny se kreslily o výšku obrázku níž (spany v pruhu s cenou se počítaly
od buňky, ne od pruhu) — top se teď odečítá i o `GOOD_PICTURE_HEIGHT`.

**Neověřeno:** skutečný telefon (jak se trefí čtyřletý prst do košíku a do ✓/✗) a jak hlášky
obchůdku zní na reproduktoru tabletu — okno prohlížeče nešlo zmenšit na 844×390, ověřeny obě krajní
šířky jeviště (1024 i 1366) přes velikost viewportu.

### Zastavení B — kočička a rádio (hotovo, čeká na commit)

**Změna zadání během implementace.** Autor zrušil okno, záclony i kytku a místo nich chce dvě věci,
na které se dá klepnout: kočičku na podlaze (zamňouká) a rádio vestavěné do linky místo dvířek
(zahraje pár tónů). Regál v obchůdku si nechává šest míst, i když je katalog kratší — postupně se
zaplní. Zapsáno do `docs/navrh-hry.md` (nový bod 7.3a) a do Rozsahu a Kontraktu tohoto plánu.

**Nové soubory:** `src/scenes/kitchen/decor.ts` (vrstva s kočičkou a rádiem, obě klepatelné).
**Změněné:** `src/data/shop.ts` (katalog na čtyři řádky, `DecorationId = 'cat' | 'radio'`),
`src/data/lines.cs.ts` (hlášky pro kytku a záclony pryč, kočička už není „na polici“),
`src/data/sfx.ts` + `sfx.test.ts` (nový efekt `decor.radio.tune`), `src/art/decor.ts` (zbyly
`sleepingCat()`, `radioSet()`, `radioGroup()`, `radioNiche()`), `src/art/layout.ts` (`decorLayout()`
= kočička na podlaze + její terč 112×88 + poslední dvířka linky), `src/art/kitchen.ts` (okno
z pozadí pryč), `src/art/shop.ts`, `src/scenes/kitchen/index.ts`, `style.css` a testy
(`layout.test.ts`, `art.test.ts`, `shop.test.ts`, `merge.test.ts`, `lines.cs.test.ts`).

**Vygenerováno** (autor odsouhlasil spuštění generátorů): `shop.ask.decor.cat` znovu
(„Chceš koupit kočičku za pět hvězdiček?“, 38 znaků) a nový efekt `decor.radio.tune` (2 s).
Čtyři osiřelé klipy po kytce a záclonách jsem smazal i s jejich záznamy v `index.json`
(generátor orphany jen hlásí, mazání nechává na autorovi).

**Chyba, kterou změna odhalila (a je opravená):** původní polička s kočičkou pod oknem seděla přesně
v pruhu, kde se při počítání objevují **pilulky nad dortem**, a částečně i v dráze **svíčky na
dortu**. Test odstupů měřil výzdobu jen proti `kitchenLayout()`, jenže pilulky ani svíčka tam
nejsou — počítají se per objednávka. Přibyl test, který měří každou koupenou věc i proti
`pillSlots()` (1–5 pilulek) a `cakeCandleSlot()` / `cakeCookieSlot()` na všech šířkách.

**Odchylky od plánu:** kromě samotné změny zadání jen `radioGroup()` v `art/decor.ts` (skupina, aby
šlo rádio nakreslit do otvoru v lince bez vnořeného `<svg>`; úmluva jako `basketGroup()`).

**Ověřeno v prohlížeči:** nový záznam → prázdná zeď, dvířka linky zavřená. Koupení kočičky a rádia
v obchůdku (regál ukazuje čtyři věci v šesti místech) → po návratu leží kočička vpravo dole na
podlaze a rádio je v posledních dvířkách. Klepnutí na kočičku → protáhne se a zamňouká, klepnutí na
rádio → zakolébá se a zahraje; druhé klepnutí během melodie nespustí druhou. Klepnutí na obě věci
uprostřed objednávky nechá stav počítání beze změny. S mříží dole se pod kočičkou i rádiem trefíš
jen do mříže (resp. do visacího zámku), ne do nich. Konzole bez chyb a bez chybějících klipů.

**Neověřeno:** skutečný telefon (844×390 na reálném zařízení) a jak mňouknutí, melodie rádia a nová
věta o kočičce zní na reproduktoru tabletu — okno prohlížeče se nedalo zmenšit, ověřeny obě krajní
šířky jeviště (1024 i 1366).

**Návrhy mimo rozsah:** (1) `place()`, `layer()` a `createMotion()` ze `scenes/kitchen/dom.ts` už
používá i obchůdek — jednou by se hodilo přesunout je do `src/scenes/dom.ts`; (2) v katalogu je po
změně jedna věc za 3 ★ a tři za 5 ★, škála by snesla něco za 4 ★, až budou přibývat další věci;
(3) rádio by mohlo mít víc melodií, aby se neomrzelo (další efekty = další generování).
