# STEP-18 · Třetí výrobek: palačinky

Status: done
Milník: M3 · Po: [STEP-17](./STEP-17-icecream-second-product.md) · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 4 („Výrobky“), 7

## Shrnutí

STEP-17 udělal z výrobku proměnnou a zaplatil tím celou režii abstrakce dopředu. Palačinky jsou
proto **řádek v pěti tabulkách plus jedna kresba**: `PRODUCTS`, `PRODUCT_GEOMETRY`, `PRODUCT_TEXTS`,
`FINISH` a `SHOP_ITEMS` (+ `SHOP_TEXTS`), k tomu nový `src/art/pancakes.ts`. Generátor objednávek,
kuchyňská scéna, bublina, police, počítání ani finále se **nesahají vůbec** – každé místo, kde se
dnes rozhoduje podle výrobku, čte data.

Krok tím dodá **třetí věc, kterou kuchyně umí**, a poprvé i **druhý výrobek, na který se počítá**:
zmrzlina přijíždí hotová, takže dnes jde každá počítací objednávka na dort. Po palačinkách se
i počítání střídá mezi dvěma obrázky, což je přesně ta pestrost, kvůli které se M3 přeskládalo.

Manifest vyroste ze **433 na 500 hlášek** (10 číslic × 2 + 22 písmen × 2 + 2 obchodní věty + 1
„hotovo“) a krok si vyžádá jeden běh `docker compose run --rm voice`. Zbývá pak už jen
[STEP-19](../plan.md) (koktejl), který mechaniku poprvé skutečně mění – ovoce se rozmixuje až po
dokončení objednávky.

## Rozsah

**V rozsahu**

- `src/art/pancakes.ts` – stoh pěti palačinek na talíři, poleva do finále, **čokoládová placička**
  s písmenkem a **cedulka** s číslicí.
- Řádek `pancakes` v `PRODUCTS` (`counts: true`, `lineSuffix: 'pancakes'`) a v `PRODUCT_GEOMETRY`
  (sloty počítaného ovoce na horní palačince, místo cedulky a placičky).
- Řádek `product.pancakes` v `SHOP_ITEMS` za 5 ★ + jeho dvě věty v `SHOP_TEXTS`.
- `PRODUCT_TEXTS.pancakes` a nová věta `FINISH` („Palačinky jsou hotové!“).
- 67 nových hlášek a běh `docker compose run --rm voice`; klipy se commitují.
- Barvy palačinky a čokolády do `PALETTE`.
- Testy: katalog, geometrie, kresba, doslovné texty, losování výrobku, obchůdek – **včetně nové
  pojistky, že se katalog obchůdku vejde do regálu** (viz „Klíčová rozhodnutí“, bod 5).
- Úprava `docs/navrh-hry.md` kap. 4 (řádek palačinek) a `docs/plan.md`.

**Mimo rozsah**

- **Nová počítací sada hlášek.** Počítá se ovoce, ať se staví cokoli (návrh kap. 4, rozhodnutí ze
  srpna 2026), takže `order.count.3.strawberry` platí pro palačinky beze změny.
- **Koktejl** (STEP-19) a jeho mixování až po dokončení objednávky.
- **Kapacita regálu v obchůdku.** Po tomhle kroku má katalog šest položek a regál má přesně šest
  míst – plný, ale funkční. Sedmou položku (koktejl) regál neuveze a rozšíření je práce pro
  STEP-19; rozhodnutí autora, 2. 9. 2026. Nový test tu hranici hlídá, aby na ni STEP-19 narazil
  v testech a ne až na obrazovce.
- Jakákoli změna mechaniky: počítání, výběr z police, nápověda, chyby, finále i zapisování pokroku
  zůstávají do puntíku jak jsou.

## Implementace

**Soubory**

```
src/art/pancakes.ts          (nový)  stoh, poleva, čokoládová placička, cedulka + jejich rozměry
src/art/svg.ts               (změna) PALETTE: pancake, pancakeDark, chocolate, chocolateLight
src/art/product.ts           (změna) čtyři switche o jednu větev delší
src/art/layout.ts            (změna) import z pancakes.ts, řádek v PRODUCT_GEOMETRY
src/data/products.ts         (změna) 'pancakes' v ProductId a řádek v PRODUCTS
src/data/shop.ts             (změna) 'product.pancakes' v ShopItemId a řádek v SHOP_ITEMS
src/data/lines.cs.ts         (změna) PRODUCT_TEXTS.pancakes, SHOP_TEXTS['product.pancakes'], FINISH
public/audio/voice/cook/     (nové)  67 klipů + záznamy v index.json
src/{art,data,game}/*.test.ts (změna) viz „Testy“
docs/navrh-hry.md            (změna) kap. 4, řádek palačinek
docs/plan.md                 (změna) stav kroku, poznámky
```

**Knihovny** – žádné. Runtime závislosti zůstávají na nule.

**Kroky**

1. **Barvy.** Do `PALETTE` v `art/svg.ts` přidat `pancake: '#E8B771'`, `pancakeDark: '#C08A45'`,
   `chocolate: '#5A3520'`, `chocolateLight: '#7C4A2D'`. Palačinka je zlatější než `dough`
   (perníček, `#C98A4B`), čokoláda je o dvě třídy tmavší – to je hlavní věc, která placičku odliší
   od perníčku (viz rozhodnutí 2).
2. **`src/art/pancakes.ts`.** Krabice 220 × 146 jako oba stávající výrobky, `viewBox "0 0 220 146"`,
   importuje jen paletu (jinak by `layout.ts` nemohl číst rozměry bez cyklu – přesně jak to má
   `icecream.ts`). Exportuje `PANCAKES_WIDTH/HEIGHT/VIEW_BOX`, `CHOCOLATE_SIZE = 96`,
   `SIGN_WIDTH = 96`, `SIGN_HEIGHT = 112`, `pancakesBase()`, `pancakesTopping()`,
   `chocolateLetter(letter?)`, `sign(digit?)`.
3. **`art/product.ts`.** Do každého ze čtyř switchů větev `case 'pancakes'`. Žádný `default`, takže
   zapomenutá větev se neukáže jako díra na pultu, ale jako chyba překladu.
4. **`art/layout.ts`.** Import rozměrů z `pancakes.ts` a řádek `pancakes` v `PRODUCT_GEOMETRY`
   (čísla v Kontraktu).
5. **`data/products.ts`.** `ProductId` o `'pancakes'` delší, řádek
   `{ id: 'pancakes', label: 'palačinky', counts: true, lineSuffix: 'pancakes' }`.
6. **`data/shop.ts`.** `ShopItemId` o `'product.pancakes'` delší, řádek na konec `SHOP_ITEMS`
   (cena 5, `kind: 'product'`, `unlocks: 'pancakes'`).
7. **`data/lines.cs.ts`.** `PRODUCT_TEXTS.pancakes = { letter: 'čokoládu', digit: 'cedulku' }`,
   `SHOP_TEXTS['product.pancakes']` a pátý řádek `FINISH`
   (`{ text: 'Palačinky jsou hotové!', product: 'pancakes' }`). Generovací smyčka na konci souboru
   se nemění – jede přes `PRODUCTS` a `SHOP_ITEMS`.
8. **Testy** (viz „Testy“), pak `docker compose run --rm test`, `check`, `build`.
9. **Hlas.** `docker compose run --rm voice`. Generátor je přírůstkový: musí ohlásit
   `67 new · 0 changed · 433 up to date · 0 orphan`. Kdyby hlásil jediné `changed`, něco se
   přejmenovalo a je to chyba – dortí ani zmrzlinové klipy se v tomhle kroku sáhnout nesmí.
10. **Ruční ověření** v prohlížeči (checklist níž), pak `navrh-hry.md`, `plan.md` a „Výsledek
    implementace“.

**Klíčová rozhodnutí**

1. **Písmenko nese čokoládová placička, ne šlehačka** (rozhodnutí autora, 2. 9. 2026). Návrh kap. 4
   sliboval „písmenko ze šlehačky“, jenže bublina ukazuje nosič **prázdný** (návrh 5.4 – s písmenem
   nakresleným v bublině by úloha byla „najdi stejný obrázek“), a prázdné písmenko ze šlehačky není
   nic. Doslovná varianta by navíc potřebovala vlastní šablonu věty jen pro palačinky; dnes je
   šablona jedna pro všechny výrobky (`Prosím ${nosič} s písmenkem ${X}.`). Placička do ní zapadne
   beze změny kódu: „Prosím **čokoládu** s písmenkem ká.“
2. **Placička musí být na první pohled jiná než perníček.** Je to riziko, které tahle volba nese –
   perníček je taky kolečko 96 px s písmenem uprostřed. Odliší se třemi věcmi naráz: **tmavá
   čokoládová barva** místo světle hnědého těsta, **vlnitý (vroubkovaný) okraj** místo hladkého
   kruhu s kroužkem uvnitř, a **lesklý odlesk** vlevo nahoře. V jedné objednávce se stejně nikdy
   nepotkají (police ukazuje nosič toho výrobku, který se právě staví), takže jde o rozlišitelnost
   napříč objednávkami, ne o záměnu uvnitř jedné.
3. **Číslici nese cedulka**, jak psal návrh. Nesmí ale vypadat jako vlaječka od zmrzliny (obojí je
   „nápis na tyčce“), takže **stojí na dvou nožičkách** na horní palačince jako jmenovka u zákusku
   v cukrárně, kdežto vlaječka je trojúhelníkový praporek na jedné svislé tyčce. Věta: „Prosím
   **cedulku** s číslem pět.“
4. **Stoh je vysoký (pět palačinek), a je to nutnost, ne ozdoba.** Nosič písmenka se **opírá
   zepředu** (jako perníček o dort) a počítané ovoce leží **nahoře**. Objednávka „počítání
   + písmenko“ je legální dvojice (jedna položka z každé dráhy, návrh 5.3), takže se ty dvě věci
   nesmí překrývat. Placka tří nízkých palačinek nemá dost vysoké přední čelo a placička by
   do ovoce zajela; pět palačinek posadí horní plochu na `y = 22` a přední čelo nechá volné až
   k talíři. Ovoce tak končí na `y = 26` a placička začíná na `y = 48` – 22 px vzduchu mezi nimi.
   Test to hlídá.
5. **Katalog obchůdku dorovná kapacitu regálu a další položka se tam nevejde.** `shopLayout()` dává
   `GOOD_COLUMNS = 3` × dvě řady = šest buněk, `SHOP_ITEMS` bude mít po tomhle kroku šest řádků.
   Sedmá položka by se nenakreslila: `drawShelf()` dělá `const cell = layout.goods[index]` a při
   `undefined` řádek přeskočí, takže by koktejl byl **neviditelný a nekupitelný, a nic by nespadlo**.
   Krok proto přidá test `SHOP_ITEMS.length <= shopLayout(1024).goods.length`; STEP-19 na něj narazí
   při prvním běhu testů, což je přesně to místo, kde na to má narazit.
6. **Generátor se nemění a nemusí.** `pickProduct()` losuje z `unlockedProducts()` až po položkách
   a jen když je z čeho vybírat, `canMake()` se ptá `productOf(product)?.counts`. Palačinky tedy
   samy od sebe začnou chodit i na počítací objednávky, a `avoidProduct` zabrání dvěma stejným za
   sebou. Seedované testy zůstávají v platnosti: se **třemi** koupenými výrobky se z `rng` táhne
   stejně jako se dvěma (jedno `pick`), a save s jediným výrobkem netáhne pořád nic.
7. **Cena je 5 ★, a není o čem rozhodovat.** „Chybí ti N hvězdiček“ existuje přesně pětkrát
   (`SHOP_SHORT`) a šestá věta by porušila pravidlo 7 (nic se nelepí ze zlomků).
8. **Poleva kopíruje `cakeGlaze()`.** Sirup teče přes okraj **horní** palačinky a stéká po bocích
   stohu; střed horní plochy zůstává volný, jinak by zakryl ovoce, placičku i cedulku a spočítané
   kusy by nešly přepočítat. Kreslí se do **stejné krabice** jako stoh, takže finále zůstane
   `place(glazeEl, layout.product)` – přesně ta chyba, kterou STEP-17 udělal a musel vracet zpět.

## Kontrakt

**`src/art/pancakes.ts`**

```ts
export const PANCAKES_WIDTH = 220;
export const PANCAKES_HEIGHT = 146;
export const PANCAKES_VIEW_BOX = '0 0 220 146';
/** Čokoládová placička s písmenkem: stejná buňka jako perníček a oplatka, ≥ 88 (pravidlo 3). */
export const CHOCOLATE_SIZE = 96;
/** Cedulka s číslicí: stejná krabice jako svíčka a vlaječka, aby police držela jednu sadu slotů. */
export const SIGN_WIDTH = 96;
export const SIGN_HEIGHT = 112;

/** Talíř a stoh pěti palačinek. Horní plocha je na y = 22, spodní palačinka končí na y = 118. */
export function pancakesBase(): string;
/** Sirup přes okraj horní palačinky, stéká po bocích; střed horní plochy zůstává volný. */
export function pancakesTopping(): string;
/** Bez písmene je to „čokoláda“ – to ukazuje bublina (návrh 5.4). */
export function chocolateLetter(letter?: string): string;
/** Bez číslice je to „cedulka“. */
export function sign(digit?: string): string;
```

Kresba stohu (závazná geometrie, zbytek je na výtvarné ruce): talíř `ellipse cx=110 cy=130 rx=76
ry=13`; pět palačinek s roztečí 20 px, horní má `ellipse cx=110 cy=22 rx=62 ry=11` a pod ní tělo
`16 px`, další čtyři na `cy = 42, 62, 82, 102`. Spodní tělo končí na `y = 118`, tedy 12 px nad
středem talíře.

**`src/data/products.ts`**

```ts
export type ProductId = 'cake' | 'icecream' | 'pancakes';

// v PRODUCTS, za zmrzlinu:
{ id: 'pancakes', label: 'palačinky', counts: true, lineSuffix: 'pancakes' }
```

**`src/art/layout.ts` – řádek v `PRODUCT_GEOMETRY`**

```ts
pancakes: {
  topCenterX: 110,
  count: {
    pitch: 40,
    height: 44,
    width: fruitWidth(44),
    frontBottom: 26,   // ovoce leží na horní palačince (její plocha je na y = 22)
    backBottom: 14,
    frontMax: 3,
  },
  topItemBottom: 26,   // nožičky cedulky stojí na horní palačince
  frontItemCenterY: 96, // placička se opírá o přední čelo stohu; horní hrana y = 48
  letterSize: { width: CHOCOLATE_SIZE, height: CHOCOLATE_SIZE },
  digitSize: { width: SIGN_WIDTH, height: SIGN_HEIGHT },
},
```

**`src/data/shop.ts`**

```ts
export type ShopItemId =
  | 'fruit.raspberry' | 'customer.frog' | 'decor.cat' | 'decor.radio'
  | 'product.icecream' | 'product.pancakes';

// na konec SHOP_ITEMS:
{ id: 'product.pancakes', kind: 'product', price: 5, label: 'palačinky', unlocks: 'pancakes' }
```

**`src/data/lines.cs.ts`**

```ts
PRODUCT_TEXTS.pancakes = { letter: 'čokoládu', digit: 'cedulku' };

SHOP_TEXTS['product.pancakes'] = {
  ask: 'Chceš koupit palačinky za pět hvězdiček?',
  bought: 'Palačinky jsou tvoje! Můžeš je dělat.',
};

// pátý řádek FINISH (id se nikdy nepřečíslovává – přidává se na konec):
{ text: 'Palačinky jsou hotové!', product: 'pancakes' }
```

**Příklad – co z toho vypadne v manifestu**

| id | text |
|---|---|
| `order.letter.k.pancakes` | Prosím čokoládu s písmenkem ká. |
| `order.next.letter.k.pancakes` | A ještě čokoládu s písmenkem ká. |
| `order.digit.5.pancakes` | Prosím cedulku s číslem pět. |
| `order.next.digit.5.pancakes` | A ještě cedulku s číslem pět. |
| `finish.5` | Palačinky jsou hotové! |
| `shop.ask.product.pancakes` | Chceš koupit palačinky za pět hvězdiček? |
| `shop.bought.product.pancakes` | Palačinky jsou tvoje! Můžeš je dělat. |

Počítací věta zůstává **sdílená**: objednávka „tři jahody na palačinky“ zní `order.count.3.strawberry`
= „Prosím tři jahody.“, stejný klip jako u dortu.

**Příklad objednávky**

```ts
generateOrder({ index: 12, products: ['cake', 'icecream', 'pancakes'], … })
// → { index: 12, product: 'pancakes', items: [
//      { type: 'count', fruit: 'strawberry', amount: 3 },
//      { type: 'letter', letter: 'K', word: 'kočka', choices: [...] } ] }
// orderSpeech(items, 'pancakes')
//   → ['order.count.3.strawberry', 'order.next.letter.k.pancakes', 'letter.k.kočka']
```

## Akceptační kritéria

- KDYŽ je `product.pancakes` koupené, PAK `unlockedProducts()` vrátí `['cake', 'icecream', 'pancakes']`
  (v pořadí katalogu) a generátor je smí losovat.
- KDYŽ objednávka obsahuje položku `count`, PAK její výrobek je `cake` nebo `pancakes`, **nikdy**
  `icecream` – i když jsou koupené všechny tři a `avoidProduct` ukazuje na dort.
- KDYŽ `avoidProduct: 'pancakes'` a koupené jsou všechny tři, PAK vylosovaný výrobek není `pancakes`
  (u počítací objednávky vyjde `cake`, jinak `cake` nebo `icecream`).
- KDYŽ se staví palačinky a objednávka žádá písmenko, PAK police nese **čokoládové placičky**
  a bublina ukazuje placičku **bez písmene**.
- KDYŽ se staví palačinky a objednávka žádá číslici, PAK police nese **cedulky** a bublina cedulku
  **bez číslice**.
- KDYŽ na palačinky přiletí pět kusů ovoce, PAK leží ve dvou řadách (3 + 2), žádné dva sloty se
  nepřekrývají a **všech pět končí nad horní hranou placičky** (`frontBottom − height` < horní hrana
  slotu písmenka), takže jdou přepočítat (Č1, návrh 5.1).
- KDYŽ je objednávka na palačinky hotová, PAK vypravěč řekne „Hotovo!“, „A je to!“ nebo
  „Palačinky jsou hotové!“ – **nikdy** „Dortík je hotový!“ ani „Zmrzlinka je hotová!“.
- KDYŽ se ptám na hlášky dortu, PAK dostanu pořád holá id (`order.letter.k`, `finish.3`) – žádný
  dřív vygenerovaný klip se nezneplatní.
- KDYŽ se `docker compose run --rm voice` pustí, PAK ohlásí
  `67 new · 0 changed · 433 up to date · 0 orphan` a `index.json` má v diffu jen přibylé řádky.
- KDYŽ se placička postaví vedle perníčku, PAK se liší **tvarem i barvou**: perníček je `<circle>`
  v `PALETTE.dough`, placička je `<path>` s vlnitým okrajem v `PALETTE.chocolate`, a ani jeden
  z těch dvou znaků není u obou stejný.
- KDYŽ (okraj) `productOf('pancake')` – tedy jednotné číslo, překlep – PAK vrátí `null` a nic
  nespadne.
- KDYŽ (okraj) má save `product.pancakes` v `purchases`, ale běží starší build, který palačinky
  nezná, PAK `unlockedProducts()` klíč přeskočí a hra jede dál na dortu a zmrzlině (pravidlo 2).
- KDYŽ (okraj) katalog obchůdku vyroste nad kapacitu regálu, PAK **spadne test**, ne hra.

## Testy

- **`src/data/products.test.ts`** – palačinky v katalogu, `counts: true`, `lineSuffix: 'pancakes'`;
  stávající testy na unikátnost id a unikátnost přípon platí beze změny a chytí kolizi samy.
- **`src/data/lines.cs.test.ts`** – `LINES` má **500** položek; doslovné texty čtyř vět z tabulky
  výš; `finishLines('pancakes')` = `['finish.1', 'finish.2', 'finish.5']`;
  `finishLines('cake')` = `['finish.1', 'finish.2', 'finish.3']` (nezměněno).
- **`src/game/orders.test.ts`** – se třemi výrobky: počítací objednávka nikdy nedostane zmrzlinu;
  přes všechny seedy padnou u dostatečně dlouhé série všechny tři; `avoidProduct` funguje;
  **počet tahů z `rng` se oproti dvěma výrobkům nezmění**.
- **`src/game/speech.test.ts`** – `orderSpeech`/`repeatSpeech`/`askAgainSpeech` s `'pancakes'`
  vracejí id s příponou `.pancakes`; počítací položka vrací sdílené `order.count.*`;
  `createFinishPicker({ product: 'pancakes' })` nikdy nevrátí `finish.3` ani `finish.4`.
- **`src/game/shop.test.ts`** – `unlockedProducts()` po koupi; cena 5; dvojí nákup vrací `null`;
  **`SHOP_ITEMS.length <= shopLayout(1024).goods.length`** (pojistka pro STEP-19).
- **`src/art/layout.test.ts`** – `PRODUCT_GEOMETRY.pancakes.count` není `null`; pět slotů, přední
  řada se nepřekrývá, zadní sedí v mezerách; **spodní hrana ovoce je nad horní hranou slotu
  písmenka**; cedulka i placička jsou na ose; slot cedulky nezasahuje do řady koleček
  (`PILL_OFFSET_Y`).
- **`src/art/art.test.ts`** – `pancakesBase()`, `pancakesTopping()`, `chocolateLetter('K')`,
  `sign('3')` vracejí platné SVG ve správné krabici; prázdné varianty neobsahují `<text>`;
  `productBase('pancakes') === pancakesBase()` a totéž pro zbylé tři rozcestníky.
- **`src/art/art.test.ts`, hlídač záměny** – ve stejném duchu jako stávající „keeps the wafer and
  the cookie apart at a glance“: `cookie()` obsahuje `<circle>` a `PALETTE.dough`,
  `chocolateLetter()` **neobsahuje `<circle>`** (vlnitý okraj je `<path>`) a obsahuje
  `PALETTE.chocolate`. Je to jediná automatická pojistka proti riziku, které rozhodnutí 2 pojmenovává;
  bez ní by ji držel jen ruční pohled.
- Spuštění: `docker compose run --rm test` (a `check`, `build` před commitem).

## Ruční ověření

- [ ] `docker compose --profile dev up`, iPad na šířku (1180 × 820). V konzoli `__shop.grant(5)`,
      reload (grant zapisuje do úložiště, běžící sezení má vlastní kopii), pak
      `__shop.buy('product.pancakes')` a `__shop.unlocked().products` musí vrátit
      `["cake","icecream","pancakes"]`.
- [ ] `__kitchen.product('pancakes')` – na pultu stojí stoh palačinek na talíři, celý uvnitř své
      krabice, nic nevisí přes okraj pultu.
- [ ] Objednávka na **písmenko**: police nese čokoládové placičky, bublina ukazuje placičku bez
      písmene, zvolená doletí a **opře se zepředu o stoh**, písmeno je čitelné.
- [ ] Objednávka na **číslici**: police nese cedulky, zvolená se postaví **na horní palačinku**
      a stojí (nevisí ve vzduchu, nezajíždí do stohu).
- [ ] Objednávka na **počítání**: pět kusů ovoce přistane ve dvou řadách na horní palačince,
      všech pět je vidět a jde je přepočítat; kolečka nad výrobkem sedí.
- [ ] Dvoupoložková objednávka **počítání + písmenko** na palačinkách: ovoce nahoře, placička
      vepředu, **nepřekrývají se**.
- [ ] Dokončení objednávky: sirup přeteče přes okraj horní palačinky, **nezakryje ovoce ani
      placičku**, zákazník si palačinky odnese, hvězdička doletí.
- [ ] **Poslech:** „Prosím čokoládu s písmenkem ká.“, „Prosím cedulku s číslem pět.“ a „Palačinky
      jsou hotové!“ – jestli některá zní špatně, je to jediné místo v kroku, kde chyba stojí další
      generování.
- [ ] V obchůdku jsou palačinky **šesté**, tedy vpravo dole; po koupi má řádek fajfku a klepnutí
      zopakuje „Palačinky jsou tvoje!“.
- [ ] Dort a zmrzlina beze změny: `__kitchen.product('cake')` i `('icecream')` vypadají i znějí
      přesně jako dřív.
- [ ] **Placička vedle perníčku**: přepnout `__kitchen.product('cake')` a `('pancakes')` na téže
      písmenkové objednávce a porovnat police – musí být poznat na první pohled, že je to jiná věc
      (rozhodnutí 2). Kdyby ne, je to důvod placičku překreslit, ne ji odbýt.
- [ ] Totéž v rozměru mobilu na šířku (844 × 390) – aspoň stoh, police a bublina.

## DoD

- [x] Všechna akceptační kritéria splněna
- [x] Testy a build zelené
- [x] Ruční ověření projito (kromě poslechu klipů – viz „Výsledek implementace“)
- [x] `navrh-hry.md` kap. 4 upravená (nosiče palačinek), `docs/plan.md` aktualizovaný
- [x] Výsledek implementace vyplněn

## Výsledek implementace

Hotovo 2. 9. 2026. Palačinky jsou třetí výrobek a **první důkaz, že abstrakce ze STEP-17 platí**:
generátor objednávek, kuchyňská scéna, bublina, police, počítání ani finále se nesáhly ani řádkem.

**Co vzniklo**

```
src/art/pancakes.ts          (nový)  stoh pěti palačinek, sirup, čokoládová placička, cedulka
src/art/svg.ts               PALETTE + pancake, pancakeDark, chocolate, chocolateLight
src/art/product.ts           čtyři switche o větev `pancakes` delší
src/art/layout.ts            import z pancakes.ts, řádek v PRODUCT_GEOMETRY
src/data/products.ts         'pancakes' v ProductId, řádek v PRODUCTS
src/data/shop.ts             'product.pancakes' v ShopItemId, šestý řádek SHOP_ITEMS
src/data/lines.cs.ts         PRODUCT_TEXTS.pancakes, SHOP_TEXTS, pátý řádek FINISH
public/audio/voice/cook/     67 nových klipů, index.json jen přibyl (402 řádků, 0 ubylo)
src/{art,data,game}/*.test.ts  +48 testů (976 celkem, dřív 928)
docs/navrh-hry.md            kap. 4: řádek palačinek, nové upřesnění, oprava „počítání = dort“
docs/plan.md                 stav kroku
```

Kresba: talíř, pět palačinek s roztečí 20 px (horní plocha `y = 22`, spodní končí na `y = 118`),
opečený kroužek nahoře. Placička je **vlnitý kotouč** – deset obloučků kolem kružnice `r = 36`,
generovaných v `chocolateRim()` – v tmavé čokoládě, s odleskem vlevo nahoře. Cedulka je mentolová
kartička na **dvou rozkročených nožičkách**. Sirup teče přes přední okraj horní palačinky, střed
zůstává volný.

**Odchylky od plánu**

1. **Rozhodnutí 6 nesedělo a test to odhalil.** Plán tvrdil, že se třemi výrobky se z `rng` táhne
   stejně jako se dvěma. Platí to jen pro objednávky **bez počítání**: u počítací objednávky měl
   dřív `pickProduct()` jediného kandidáta (dort) a netáhl vůbec, kdežto teď má dva a jedno `pick`
   udělá. Test proto tvrdí to, co je doopravdy pravda – „jedno tažení, když je z čeho vybírat, žádné
   jinak“ – a v komentáři stojí, proč to ničemu nevadí: výrobek se losuje **poslední**, takže
   nemůže přesunout položku na jinou dráhu, a záruka „save z doby před zmrzlinou se přehraje stejně“
   se týká sejvu, kde je koupený jen dort (ten test dál platí). Sejv, kde se něco koupilo, mění
   proud tak jako tak.
2. **Testovací bod „slot cedulky nezasahuje do řady koleček“ z plánu neplatí a nešel napsat.**
   Cedulka i svíčka jsou 112 px vysoké a stojí těsně nad výrobkem, takže sahají výš než kolečka
   (`PILL_OFFSET_Y = 84`) – u dortu to tak je od STEP-04. Nevadí to, protože **kolečka a číslice se
   nikdy nepotkají**: objednávka má z číselné dráhy buď počítání, nebo číslici (návrh 5.3). Test
   místo toho hlídá to, co smysl dává: cedulka a placička se nepřekrývají navzájem ani s miskou
   a obě zůstávají uvnitř jeviště.
3. **Sirup je čokoládový**, ne ovocný jako u zmrzliny; plán barvu neurčoval. Používá tím obě nové
   tmavé barvy a k palačinkám patří.

**Jak se to ověřilo**

- `docker compose run --rm test` → **976 testů zelených** (před krokem 928), `check` i `build` beze
  slova.
- `docker compose run --rm voice` ohlásil přesně `67 new · 0 changed · 433 up to date · 0 orphan`;
  `index.json` má v diffu **402 přidaných a 0 ubraných řádků**, takže se žádný dřív zaplacený klip
  nezneplatnil.
- Ruční průchod v prohlížeči (iPad na šířku 1180 × 820 i mobil na šířku 844 × 390): koupě v
  obchůdku → `["cake","icecream","pancakes"]`; palačinky na pultu celé uvnitř své krabice; police
  s placičkami i s cedulkami, bublina obojí **prázdné**; placička doletí a **opře se zepředu**
  (`y = product.y + 48`), cedulka se **postaví na horní palačinku** (spodní hrana přesně
  `product.y + 26`); pět kusů ovoce ve dvou řadách (3 + 2) na horní palačince; **dvoupoložková
  objednávka počítání + písmenko drží mezi ovocem a placičkou 23 px vzduchu** – to je to, kvůli
  čemu je stoh vysoký; sirup se ve finále klade **na tutéž krabici** jako výrobek. V obchůdku jsou
  palačinky **šesté, vpravo dole**, s fajfkou. Dort a zmrzlina kreslí přesně jako dřív. Žádná chyba
  v konzoli, všech šest nových klipů se ze hry natáhlo se stavem 200.
- **Placička vedle perníčku porovnána na obrázku** (oba 96 px vedle sebe): světle hnědé hladké
  kolečko s kroužkem × tmavý vlnitý kotouč. Splést se nedají. Totéž vlaječka × cedulka: růžový
  praporek na jedné tyčce × mentolová kartička na dvou nožičkách.

**Co ověřené není**

- **Zvuk.** Nové hlášky jsem si nemohl poslechnout – ověřeno je jen, že soubory existují, mají
  rozumnou velikost a hra si je stáhne. „Prosím čokoládu s písmenkem ká.“, „Prosím cedulku s číslem
  pět.“ a „Palačinky jsou hotové!“ patří poslechnout, než se to dá dceři; kdyby některá zněla
  špatně, je to jediné místo v kroku, kde oprava stojí další generování.
- Ruční ověření probíhalo přes konzoli (`__kitchen.play()`), ne odehráním sezení od zvonečku.

**Návrhy mimo rozsah**

- Regál obchůdku je **plný, 6/6**. Nový test `SHOP_ITEMS.length <= shopLayout(1024).goods.length`
  spadne, jakmile STEP-19 přidá koktejl – rozšíření regálu je první práce toho kroku.
- Sirup u palačinek je decentnější než poleva u dortu. Až se bude finále ladit, stojí za zvážení
  nechat ho stéct níž po bocích stohu.
