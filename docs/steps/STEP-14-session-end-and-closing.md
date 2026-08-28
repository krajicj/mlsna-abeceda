# STEP-14 · Konec sezení: zavírací mříž, minutka a rodičovský zámek

Status: done
Milník: M2 · Po: [STEP-13](./STEP-13-mergeable-save-format.md) · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 4, 9, 9.1

## Shrnutí

Kuchyně dneska nikdy nekončí: po každé objednávce se vrátí zvoneček a dá se hrát donekonečna.
Návrh (kap. 4) přitom slibuje, že **po deseti objednávkách kuchyně sama zavře** – „účel: hra sama
říká dost". Tenhle krok to dodá, a to dvěma nezávislými půlkami. **Logika sezení** je čistá funkce
nad novým polem `session` v uloženém záznamu (kolik objednávek má sezení za sebou, kdy byla poslední,
od kdy a do kdy je zavřeno), takže reload zavíračku neobejde a po dvouhodinové pauze se sezení počítá znovu
od jedné. **Zavírací scéna** je mříž, která sjede ze shora přes kuchyni (kuchyně za ní zůstane
vidět), na ní visí kuchyňská **minutka** s ubývající výsečí a v pravém dolním rohu **ikona zámku**
s číselnou klávesnicí; kód `1234` sezení vynuluje a mříž vyjede hned.

Zámek je vědomě dočasný – rodičovský koutek (STEP-19) ho nahradí držením hvězdiček a příkladem
4 × 3 – ale bez něj by zavřená kuchyně byla na dvě hodiny slepá ulička, a to i pro autora při
testování. Cedule „Zavřeno" z návrhu **odpadá**: text v herním UI zakazuje pravidlo 1, mříž
a hodiny řeknou totéž obrázkem.

Po tomhle kroku je M2 hotový: smyčka má začátek (zvoneček) i konec (mříž) a sezení se dá bezpečně
přerušit kdykoliv. Dál pak jde M3 (obchůdek, album, překvapení), který si z tohoto kroku nebere nic
než jistotu, že `save` unese další pole bez migrace.

## Rozsah

**V rozsahu**

- `src/game/closing.ts` (nový) – čistá logika sezení: limit 10 objednávek, dvouhodinové zavření,
  kdy sezení začíná znovu, kolik času zbývá, obrana proti přeskočeným hodinám zařízení.
- `src/game/save.ts` – nové pole `session` v `SaveData`, jeho oprava (`repairSession`) a výchozí
  hodnota v `createSave()`. **Bez bumpu `SAVE_VERSION`** – zdůvodnění v Klíčových rozhodnutích.
- `src/game/merge.ts` – `session` zůstává lokální (jako `settings`), tedy se neslučuje.
- `src/game/session.ts` – `complete()` posune stav sezení jedním zápisem; nové `close(ms?)`
  a `reopen()`.
- `src/data/lines.cs.ts` – **5 nových hlášek** (dvě zavírací, dvě „máme zavřeno", jedna otevírací),
  manifest roste z 316 na **321**; běh `docker compose run --rm voice` a commit klipů.
- `src/data/sfx.ts` – **1 nový efekt** `shutter` (rachot mříže), 14 → **15**; běh
  `docker compose run --rm sfx` a commit klipu.
- `src/game/speech.ts` – pickery `createClosingPicker()`, `createClosedPicker()` a `closingPreload()`.
- `src/art/shutter.ts` (nový) – mříž přes celou šířku scény.
- `src/art/clock.ts` (nový) – minutka: ciferník, ubývající výseč, jedna ručička.
- `src/art/lock.ts` (nový) – visací zámek, klávesa s číslicí, tečky zadaného kódu.
- `src/art/layout.ts` – `closedLayout(stageWidth)` a `keypadKeys(panel)`: boxy zavřené kuchyně
  (minutka, zámek, klávesnice) **mimo** `kitchenLayout`, protože platí jen tehdy, když je všechno
  ostatní schované za mříží.
- `src/scenes/kitchen/closing.ts` (nový) – celá zavřená kuchyně: ztmavení, mříž, minutka, zámek,
  klávesnice, samovolné otevření po vypršení.
- `src/scenes/kitchen/index.ts` – napojení (zavřít po poslední objednávce, otevřít kuchyni zavřenou
  hned při startu, zvoneček až po otevření) a dev handly `__kitchen.close(minutes?)` / `.open()`.
- `src/scenes/kitchen/style.css` – vrstvy zavřené kuchyně.
- `docs/navrh-hry.md` kap. 4 a 9 – viz **Změny návrhu**.

**Mimo rozsah**

- **Rodičovský koutek** (STEP-19): nastavitelný limit objednávek nebo minut, zámek přes držení
  hvězdiček, příklad 4 × 3, vypnutí limitu. Teď je limit konstanta a kód `1234` konstanta vedle ní.
- **Mávající zvířátka** z návrhu kap. 4 (rozhodnutí autora, srpen 2026): zákazník odejde jako po
  každé objednávce a teprve pak sjede mříž. Návrh se upraví.
- **Obnova rozehrané objednávky** po reloadu. Reloadem se nic neztrácí (save se zapisuje až
  s dokončenou objednávkou) a kuchyně se otevírá prázdná se zvonečkem – jiné by to bylo proti
  kap. 4. „Obnova sezení po reloadu" z roadmapy znamená právě jen stav sezení a zavřenost.
- **Minutový limit sezení** (návrh kap. 9). `session.close(ms)` je na něj připravené, ale nic ho
  zatím neměří.
- Zvuk tikání minutky, hudba, zhasínající světlo jako animace svítidla; ztmavení je jedna vrstva.
- Změna `SAVE_VERSION`, migrace, `kk.save.backup` – formát se nemění (viz Klíčová rozhodnutí).
- Album, obchůdek, překvapení a cokoliv, co by se dalo dělat „za zavřeno".

## Implementace

**Soubory**

```
src/game/closing.ts                (nový)   limit sezení, zavření na 2 h, zbývající čas
src/game/closing.test.ts           (nový)   limit, nové sezení, přeskočené hodiny, zbytek
src/game/save.ts                   (změna)  SaveData.session, repairSession, createSave
src/game/save.test.ts              (změna)  + oprava chybějícího a rozbitého session
src/game/merge.ts                  (změna)  session zůstává lokální
src/game/merge.test.ts             (změna)  + test lokálnosti a idempotence
src/game/session.ts                (změna)  afterOrder v complete(), close(ms?), reopen()
src/game/session.test.ts           (změna)  + zavření po 10., jeden zápis, close/reopen
src/data/lines.cs.ts               (změna)  5 hlášek + helpery closingLines/closedLines/OPEN_LINE
src/data/lines.cs.test.ts          (změna)  počet hlášek 316 → 321
src/data/sfx.ts                    (změna)  efekt shutter
src/data/sfx.test.ts               (změna)  počet efektů 14 → 15
src/game/speech.ts                 (změna)  pickery zavírání a closingPreload()
src/game/speech.test.ts            (změna)  + nová id jsou v manifestu
public/audio/voice/<slug>/*.mp3    (nové)   5 klipů z ElevenLabs, committnuté
public/audio/voice/index.json      (změna)  fingerprint index generátoru
public/audio/sfx/shutter.mp3       (nový)   efekt, committnutý
public/audio/sfx/index.json        (změna)  fingerprint index generátoru
src/art/shutter.ts                 (nový)   mříž na šířku scény
src/art/clock.ts                   (nový)   minutka s ubývající výsečí
src/art/lock.ts                    (nový)   zámek, klávesa, tečky kódu
src/art/layout.ts                  (změna)  closedLayout(), keypadKeys(), konstanty
src/art/layout.test.ts             (změna)  + boxy zavřené kuchyně
src/scenes/kitchen/closing.ts      (nový)   ztmavení, mříž, minutka, zámek, klávesnice
src/scenes/kitchen/index.ts        (změna)  napojení + dev handly
src/scenes/kitchen/style.css       (změna)  vrstvy zavřené kuchyně
docs/navrh-hry.md                  (změna)  kap. 4 a 9 – viz Změny návrhu
docs/plan.md                       (změna)  stav kroku, poznámka
```

**Knihovny** – žádné nové. Runtime závislostí zůstává nula.

**Kroky**

Krok má tři různě rizikové části (čistá logika, generování audia, scéna), takže jde po **třech
zastávkách**. Po každé je hra funkční a nasaditelná, každá je vlastní commit a autor ji mezitím
ověří.

### Zastávka 1/3 – logika sezení (viditelně se nic nemění)

1. **`src/game/closing.ts`** – nový modul, bez DOM, bez `Date.now()` uvnitř (čas vždycky parametrem):

   ```ts
   export const SESSION_ORDER_LIMIT = 10;
   export const CLOSED_MS = 2 * 60 * 60 * 1000;
   export const MAX_CLOSED_MS = 12 * 60 * 60 * 1000;

   function continues(state: SessionState, now: number): boolean {
     // Kuchyně mezitím otevřela → minulé sezení skončilo.
     if (state.closedUntil > 0 && now >= state.closedUntil) return false;
     if (state.lastOrderAt <= 0) return false;
     const gap = now - state.lastOrderAt;
     // Záporná pauza = hodiny zařízení skočily zpátky; delší než zavíračka = nové sezení.
     return gap >= 0 && gap <= CLOSED_MS;
   }

   /** Zavře od `now` na `ms` (ořízne do [0, MAX_CLOSED_MS]); `orders` a `lastOrderAt` nechá být. */
   export function closeUntil(state: SessionState, now: number, ms = CLOSED_MS): SessionState {
     const span = Math.min(Math.max(Number.isFinite(ms) ? ms : CLOSED_MS, 0), MAX_CLOSED_MS);
     return { ...state, closedFrom: now, closedUntil: now + span };
   }

   export function afterOrder(state: SessionState, now: number): SessionState {
     const orders = continues(state, now) ? state.orders + 1 : 1;
     const next = { ...state, orders, lastOrderAt: now, closedFrom: 0, closedUntil: 0 };
     return orders >= SESSION_ORDER_LIMIT ? closeUntil(next, now) : next;
   }

   export function isClosed(state: SessionState, now: number): boolean {
     const left = state.closedUntil - now;
     // Horní mez je pojistka proti přenastaveným hodinám, ne délka zavíračky – proto MAX_CLOSED_MS.
     return left > 0 && left <= MAX_CLOSED_MS;
   }
   ```

   `remainingMs()` vrací `isClosed ? closedUntil - now : 0`. `closedProgress()` je zbytek dělený
   **délkou právě probíhající zavíračky** (`closedUntil - closedFrom`, minimálně 1), oříznutý do
   [0, 1] – tedy 1 → plná výseč, 0 → otevřeno. Kdyby se dělilo napevno `CLOSED_MS`, minutka
   u kratšího zavření (`close(60_000)`, minutový limit v STEP-19) by začínala skoro prázdná.
2. **`save.ts`.** Do `SaveData` přibude `readonly session: SessionState`, do `createSave()`
   `session: NEW_SESSION` a do `parseSave()` `session: repairSession(migrated['session'])`.
   `repairSession` je čtyři `repairCount` (nezáporné celé číslo, nesmysl → 0), **každé pole zvlášť**
   – žádná další kontrola, `isClosed()` si s nesmyslným `closedUntil` poradí sama.
3. **`merge.ts`.** `mergeSave()` doplní `session: local.session` s komentářem: sezení je vlastnost
   zařízení, ne postupu. Sloučit dvě sezení by buď limit sebralo (nižší počet vyhrává), nebo cizí
   zavíračkou zamklo kuchyni, u které dcera zrovna sedí.
4. **`session.ts`.** V `complete()` se do jednoho zápisu přidá `session: afterOrder(save.session,
   stamp.getTime())`, kde `stamp` je ten samý `now()`, ze kterého už teď vzniká `todayStamp`
   (jeden dotaz na čas, ať se den a čas nerozejdou). Nové `close(ms?)` (delegát na `closeUntil()`)
   a `reopen()` (`NEW_SESSION`); obojí zapisuje.
5. **Testy** – viz sekce Testy.

→ **Commit 1/3.** Hra se chová úplně stejně jako dneska: `session` se ukládá, ale nikdo se ho neptá.

### Zastávka 2/3 – hlášky a zvuk

6. **`lines.cs.ts`.** Tři pole textů vedle `FINISH`/`STAR`/`BELL` a k nim helpery:

   ```
   closing.1  Kuchyně dneska zavírá, dobrou noc!
   closing.2  Kuchyně zavírá. Ahoj a přijď zas!
   closed.1   Kuchyně má zavřeno. Přijď zase za chvilku!
   closed.2   Teď je zavřeno. Až doběhnou hodiny, otevřeme!
   open.1     Kuchyně je zase otevřená!
   ```

   `closingLines()`, `closedLines()` po vzoru `bellLines()`, `OPEN_LINE = 'open.1'` po vzoru
   `TURN_LINE`. Texty jsou celé věty (pravidlo 7), nic se neskládá.
7. **`speech.ts`.** `createClosingPicker()`, `createClosedPicker()` (obojí `createLinePicker`)
   a `closingPreload()`, což je `[...closingLines(), ...closedLines(), OPEN_LINE]` – pět klipů,
   které kuchyně natáhne jednou při připojení scény.
8. **`sfx.ts`.** Jeden efekt: `{ id: 'shutter', prompt: 'metal roller shop shutter closing with a
   short rattle, cartoon, clean, no music', durationSeconds: 1.5 }`.
9. **Generování.** `docker compose run --rm voice --dry-run` musí ohlásit **právě 5** hlášek,
   pak `docker compose run --rm voice`; `docker compose run --rm sfx --dry-run` právě **1** efekt,
   pak `docker compose run --rm sfx`. Klíč zůstává v `~/.config/mlsna-abeceda/elevenlabs.env`.
   Namátkou poslechnout (viz Ruční ověření).

→ **Commit 2/3.** Klipy leží v `public/audio/`, hra je zatím nepřehrává.

### Zastávka 3/3 – zavírací scéna

10. **`art/layout.ts`.** Konstanty a `closedLayout()`:

    ```ts
    export const CLOCK_SIZE = 260;
    export const LOCK_SIZE = 96;   // ≥ 88 (pravidlo 3)
    export const LOCK_MARGIN = 16;
    export const KEY_SIZE = 96;    // ≥ 88
    export const KEY_GAP = 12;
    export const KEYPAD_PADDING = 24;
    export const CODE_LENGTH = 4;
    ```

    Panel klávesnice je `3 * KEY_SIZE + 2 * KEY_GAP + 2 * KEYPAD_PADDING` = 360 široký a
    `KEYPAD_PADDING + 48 (tečky) + 12 + 4 * KEY_SIZE + 3 * KEY_GAP + KEYPAD_PADDING` = 528 vysoký,
    vystředěný na scéně. Minutka je vystředěná vodorovně, `y = 150`. Zámek sedí v pravém dolním
    rohu (`x = width − LOCK_MARGIN − LOCK_SIZE`, `y = 768 − LOCK_MARGIN − LOCK_SIZE`).
    `keypadKeys(panel)` vrátí 10 boxů: 1–9 ve třech řadách, 0 uprostřed čtvrté.
11. **`art/shutter.ts`.** `shutter(width, height)` kreslí mříž: svislé pruty (rounded rect 14 px,
    `PALETTE.brass`, `stroke(4)`) po ~56 px, čtyři vodorovné příčle, dole plná lišta s dvěma úchyty.
    Pozadí zůstává průhledné – kuchyně je za mříží vidět, jen ztmavená vrstvou `.kitchen-dim`.
12. **`art/clock.ts`.** `kitchenTimer({ size, progress })`: bílý ciferník `stroke(4)`, natahovací
    knoflík nahoře, 12 rysek, **ubývající výseč** (`PALETTE.frosting`) od dvanáctky po směru
    hodinových ručiček o `progress * 360°` a jedna ručička (`INK`, 6 px) na konci výseče, plus
    středový čep. Bez číslic – ciferník nic nepíše (pravidlo 1). Výseč jako cesta:

    ```
    angle = progress * 360;  large = angle > 180 ? 1 : 0
    M cx cy L cx (cy - r) A r r 0 large 1 (cx + r*sin) (cy - r*cos) Z
    ```

    Při `progress >= 0.999` se místo cesty kreslí plný kruh (SVG oblouk o 360° je degenerovaný).
13. **`art/lock.ts`.** `padlock(size)` (tělo + třmen, `PALETTE.brass` a `stroke(4)`),
    `keyCap(label, size)` (bílá zaoblená klávesa + `centeredText`) a `codeDots(filled, total)`
    (kolečka, plná = zadaná číslice).
14. **`scenes/kitchen/closing.ts`.** Handle podle vzoru `bell.ts` (vlastní `createMotion`, vlastní
    prvky, `layout()`, `destroy()`):
    - `close({ animate })` – vrstva se odkryje, mříž sjede (`translateY(-100%) → 0`, 900 ms), zazní
      `sfx.play('shutter')` a `closing.*`; při `animate: false` (kuchyně otevřená už zavřená) je
      mříž rovnou dole, zvuk mlčí a řekne se `closed.*`.
    - Klepnutí na mříž → `closed.*`, ale jen když `!voice.speaking` (dítě bušící do mříže nesmí
      vyrobit frontu deseti vět).
    - Zámek → panel klávesnice; klepnutí mimo panel ho zavře. Po čtvrté číslici: shoda s `PARENT_CODE`
      → `onCode()` a `open()`, jinak zatřesení panelu (400 ms) a tečky se vyprázdní.
    - Minutka: `setInterval` po 15 s (a hned při `close()`) překreslí ciferník z
      `closedProgress(state(), Date.now())`; jakmile `!isClosed(...)`, zavolá `open()`.
    - `open({ animate })` – **nejdřív zavře panel klávesnice** (odpočet může doběhnout, zrovna když
      rodič ťuká kód), pak mříž vyjede, `shutter` zvuk, `OPEN_LINE`, interval se zastaví, vrstva
      se schová a zavolá se `onOpen()`.
    - Pohyb jde přes `createMotion()`, takže při `prefers-reduced-motion` se prvky rovnou postaví
      na místo; viditelnost drží třídy a `hidden`, ne opacity animace (stejné pravidlo jako
      u zvonečku – zamrzlá animace nesmí nechat mříž neviditelnou).
15. **`scenes/kitchen/index.ts`.**
    - `const closing = createClosing({ root: el, voice, sfx, state: () => ctx.session.save.session,
      onCode: () => ctx.session.reopen(), onOpen: () => bell.show() })`.
    - Při stavbě scény: `ctx.voice.preload(closingPreload())` a místo bezpodmínečného `bell.show()`
      → `if (isClosed(ctx.session.save.session, Date.now())) closing.close({ animate: false });
      else bell.show();`
    - `finishOrder()`: `customer.leave(() => { if (isClosed(...)) closing.close(); else bell.show(); })`.
    - `resize()` a `destroy()` doplnit o `closing`.
    - Dev handly: `close(minutes?)` → `ctx.session.close(minutes === undefined ? undefined :
      minutes * 60_000)` a hned `closing.close()`; `open()` → `ctx.session.reopen()` a
      `closing.open()`.
16. **`style.css`.** `.kitchen-closing` (celá scéna, `hidden` když otevřeno, `z-index: 5` – nad
    finále, které má 3), `.kitchen-dim` (`background: rgb(59 42 26 / 0.45)`), `.kitchen-shutter`,
    `.kitchen-clock`, `.kitchen-lock` (`pointer-events: auto`, kurzor), `.kitchen-keypad`
    (`z-index: 6`, tedy nad minutkou – panel ji vědomě překryje, je to modální vrstva),
    `.kitchen-key`, `@keyframes keypad-shake` a blok `prefers-reduced-motion`.
17. **Návrh a roadmapa** – viz Změny návrhu a bod v `docs/plan.md`.

→ **Commit 3/3.**

**Klíčová rozhodnutí**

1. **Bez bumpu `SAVE_VERSION`.** Pole `session` je čistě přírůstkové: starý záznam ho nemá,
   `repairSession()` z chybějící hodnoty udělá `{0,0,0}` a hra běží dál; starší build nové pole
   ignoruje. Bump na 3 by naopak znamenal, že build s `SAVE_VERSION = 2` (nacachovaná stránka na
   tabletu) potká `version: 3`, `migrateRecord()` vrátí null a dcera začne novou hru – přesně to,
   před čím pravidlo 4 chrání. Pravidlo „změna formátu = migrace s bumpem" míří na změny, které
   **přeznačují existující data** (jako v1 → v2 u hvězdiček); přírůstkové pole s bezpečnou
   výchozí hodnotou je kompatibilní oběma směry. Přesně s tímhle záměrem šel formát (STEP-13) před
   sezením – viz poznámka v [plan.md](../plan.md).
2. **Sezení se neslučuje.** Je to vlastnost zařízení a okamžiku, ne postupu: `session` zůstane
   z `local`, stejně jako `settings`. Kdyby se bralo maximum `orders`, sebral by import limit;
   kdyby se bralo maximum `closedUntil`, zamkla by cizí zavíračka kuchyni, u které dcera sedí.
3. **Jedna konstanta na dvě věci.** `CLOSED_MS` je zároveň doba zavření i pauza, po které se sezení
   počítá znovu od jedné. Dcera, která si dá hodinu pauzu, dohraje své sezení; ta, co přijde
   odpoledne, začíná znovu. Dvě různá čísla by musela mít dvě různá zdůvodnění a v návrhu žádné
   není.
4. **Hodiny zařízení: dvě různé konstanty.** `isClosed()` má horní mez, protože když se hodinám na
   tabletu přehodí časové pásmo nebo ručně skočí zpátky, kuchyně by jinak zůstala zamčená klidně
   roky – a dítě to nemá jak obejít. Ta mez ale **není délka zavíračky**: `MAX_CLOSED_MS` = 12 h je
   „tohle už nemůže být zavíračka, to jsou rozbité hodiny", kdežto `CLOSED_MS` = 2 h je, na jak
   dlouho se doopravdy zavírá. Kdyby to bylo jedno číslo, pozdější limit z rodičovského koutku
   („zavři na tři hodiny") by se tvářil jako otevřeno hned v ten samý okamžik. `closeUntil()` proto
   délku ořízne do `[0, MAX_CLOSED_MS]` – co si člověk vyžádá, to dostane, nebo se to viditelně
   ořízne, nikdy se to tiše nerozbije.
5. **Boxy zavřené kuchyně mimo `kitchenLayout`.** Invariant v `layout.test.ts` hlídá 8 px mezi
   **každými dvěma** boxy `kitchenLayout()`; minutka uprostřed scény by ho porušila s dortem
   a miskou. Zavřená kuchyně je jiný obrázek, tak má jinou funkci: `closedLayout()` s vlastními
   testy.
6. **Kód `1234` je konstanta v kódu, ne tajemství.** Repozitář je veřejný; zámek nemá bránit
   internetu, ale čtyřleté. STEP-19 ho nahradí příkladem 4 × 3 (návrh kap. 9) a tenhle kód zmizí.
   Klávesnice je jediné místo hry, kde smí být text (číslice na klávesách) – rodičovský koutek je
   výjimka pravidla 1.
7. **Zavírá se až po odchodu zákazníka.** Mříž sjede v tom okamžiku, kdy by se jindy vrátil
   zvoneček. Zavírat přes stojícího zákazníka nebo přes finále by znamenalo řešit kolize animací
   a dítě by přišlo o hvězdičku na pultu.
8. **Klepnutí na mříž mluví jen do ticha.** Podmínka `!voice.speaking` je levnější než další
   hlídač a dělá přesně to, co je potřeba: první klepnutí odpoví, dalších deset během věty ne.

## Kontrakt

```ts
// src/game/closing.ts
export const SESSION_ORDER_LIMIT = 10;
export const CLOSED_MS: number; // 2 * 60 * 60 * 1000 – na jak dlouho se zavírá
export const MAX_CLOSED_MS: number; // 12 * 60 * 60 * 1000 – nad tím jsou to rozbité hodiny
/**
 * Dočasný rodičovský kód, dokud nebude koutek (STEP-19). Není to tajemství (repozitář je veřejný),
 * jen brána pro čtyřletou. Porovnává se jako řetězec: `typed.join('') === PARENT_CODE`.
 */
export const PARENT_CODE = '1234';

export interface SessionState {
  /** Kolik objednávek má za sebou probíhající sezení; 0 = zatím nic. */
  readonly orders: number;
  /** Epoch ms poslední dokončené objednávky; 0 = nikdy. */
  readonly lastOrderAt: number;
  /** Epoch ms, kdy se zavřelo; 0 = otevřeno. Dělí se jím výseč minutky. */
  readonly closedFrom: number;
  /** Epoch ms, kdy kuchyně zase otevře; 0 = otevřeno. */
  readonly closedUntil: number;
}

export const NEW_SESSION: SessionState; // { orders: 0, lastOrderAt: 0, closedFrom: 0, closedUntil: 0 }

export function afterOrder(state: SessionState, now: number): SessionState;
/** Zavře od `now` na `ms` (výchozí `CLOSED_MS`, ořízne do [0, MAX_CLOSED_MS]). */
export function closeUntil(state: SessionState, now: number, ms?: number): SessionState;
export function isClosed(state: SessionState, now: number): boolean;
export function remainingMs(state: SessionState, now: number): number;
/** Podíl **probíhající** zavíračky, který ještě zbývá: 1 → plná výseč, 0 → otevřeno. */
export function closedProgress(state: SessionState, now: number): number;

// src/game/save.ts
export interface SaveData {
  readonly version: typeof SAVE_VERSION; // zůstává 2
  readonly settings: Settings;
  readonly tracks: { readonly numbers: TrackState; readonly letters: TrackState };
  readonly progress: SaveProgress;
  readonly stars: StarsState;
  readonly pending: PendingElements;
  readonly session: SessionState; // nové
}

// src/game/session.ts
export interface Session {
  readonly save: SaveData;
  readonly order: Order;
  readonly customer: CustomerId;
  complete(results: readonly ItemResult[]): Order;
  /**
   * Zavře kuchyni na `ms` (výchozí `CLOSED_MS`, ořízne se do `[0, MAX_CLOSED_MS]`) a zapíše save.
   * Minutový limit z rodičovského koutku (STEP-19) sáhne sem.
   */
  close(ms?: number): void;
  /** Nové sezení, kuchyně otevřená; zapíše save. Naučeného se to nedotkne. */
  reopen(): void;
}

// src/art/layout.ts
export interface ClosedLayout {
  readonly clock: Rect;
  readonly lock: Rect;
  readonly keypad: Rect;
}
export function closedLayout(stageWidth: number): ClosedLayout;
/** Deset kláves panelu: 1–9 ve třech řadách, 0 uprostřed čtvrté. */
export function keypadKeys(panel: Rect): Rect[];

// src/art/shutter.ts
export function shutter(width: number, height: number): string;
// src/art/clock.ts
export function kitchenTimer(options: { readonly size: number; readonly progress: number }): string;
// src/art/lock.ts
export function padlock(size: number): string;
export function keyCap(label: string, size: number): string;
export function codeDots(filled: number, total: number): string;

// src/data/lines.cs.ts – pět celých vět (pravidlo 7), manifest 316 → 321
const CLOSING = ['Kuchyně dneska zavírá, dobrou noc!', 'Kuchyně zavírá. Ahoj a přijď zas!'];
const CLOSED = ['Kuchyně má zavřeno. Přijď zase za chvilku!',
                'Teď je zavřeno. Až doběhnou hodiny, otevřeme!'];
const OPEN_TEXT = 'Kuchyně je zase otevřená!';
export function closingLines(): readonly string[]; // ['closing.1', 'closing.2']
export function closedLines(): readonly string[];  // ['closed.1', 'closed.2']
export const OPEN_LINE = 'open.1';

// src/data/sfx.ts – jeden efekt, 14 → 15
{
  id: 'shutter',
  prompt: 'metal roller shop shutter closing with a short rattle, cartoon, clean, no music',
  durationSeconds: 1.5,
}

// src/game/speech.ts
export function createClosingPicker(options?: { readonly rng?: Rng }): LinePicker;
export function createClosedPicker(options?: { readonly rng?: Rng }): LinePicker;
/** Pět klipů zavřené kuchyně; scéna je natáhne jednou při připojení. */
export function closingPreload(): readonly string[];

// src/scenes/kitchen/closing.ts
export interface ClosingHandle {
  close(options?: { readonly animate?: boolean }): void;
  open(options?: { readonly animate?: boolean }): void;
  readonly closed: boolean;
  layout(stageWidth: number): void;
  destroy(): void;
}
export function createClosing(options: {
  readonly root: HTMLElement;
  readonly voice: VoicePlayer;
  readonly sfx: SfxPlayer;
  /** Uložené sezení, čtené vždycky čerstvě – minutka i samovolné otevření běží z něj. */
  readonly state: () => SessionState;
  /** Kód sedí: vynulovat sezení (zapisuje save). Mříž vyjede sama. */
  readonly onCode: () => void;
  /** Mříž je nahoře (kódem nebo doběhlým odpočtem): kuchyně může vrátit zvoneček. */
  readonly onOpen: () => void;
}): ClosingHandle;
```

**Příklad.** Sezení dojede na desátou objednávku v pondělí ve 14:00 (`now = 1_756_296_000_000`):

```jsonc
// save.session před
{ "orders": 9, "lastOrderAt": 1756295800000, "closedFrom": 0, "closedUntil": 0 }
// afterOrder(state, 1756296000000)
{ "orders": 10, "lastOrderAt": 1756296000000, "closedFrom": 1756296000000,
  "closedUntil": 1756303200000 }
// isClosed(..., 1756296000000)       → true
// remainingMs(..., 1756299600000)    → 3600000  (hodina zbývá)
// closedProgress(..., 1756299600000) → 0.5      (poloviční výseč)
// isClosed(..., 1756303200000)       → false    (kuchyně otevřela sama)
// afterOrder(..., 1756310000000)     → { orders: 1, closedFrom: 0, closedUntil: 0 }
```

## Akceptační kritéria

**Logika**

- KDYŽ sezení dokončí desátou objednávku, PAK `afterOrder()` vrátí `closedUntil = now + CLOSED_MS`
  a `isClosed()` je `true`; u deváté je `closedUntil` 0.
- KDYŽ je mezi dvěma objednávkami pauza delší než `CLOSED_MS`, PAK je nová objednávka první
  v novém sezení (`orders === 1`), i kdyby předtím bylo devět.
- KDYŽ kuchyně mezitím otevřela (`now >= closedUntil > 0`), PAK je další objednávka první v novém
  sezení a `closedUntil` se vynuluje.
- KDYŽ hodiny zařízení skočí tak, že `closedUntil − now > MAX_CLOSED_MS` (nebo je pauza záporná),
  PAK `isClosed()` vrátí `false` a sezení začíná znovu – kuchyně se nedá zamknout na dny.
- KDYŽ `closeUntil(state, now, ms)` dostane `ms` mezi `CLOSED_MS` a `MAX_CLOSED_MS` (třeba tři
  hodiny), PAK je `isClosed()` po celou tu dobu `true`; KDYŽ dostane víc než `MAX_CLOSED_MS`,
  zápor nebo `NaN`, PAK se ořízne do `[0, MAX_CLOSED_MS]` a kuchyně se nezasekne.
- KDYŽ zavíračka běží, PAK `closedProgress()` klesá z 1 na 0 podle **její vlastní** délky
  (`closedUntil − closedFrom`), ne podle `CLOSED_MS`: minutová zavíračka začíná plnou výsečí.
- KDYŽ v uloženém záznamu `session` chybí, je `null` nebo řetězec, PAK se opraví na `NEW_SESSION`,
  zbytek záznamu se nezahodí a `SAVE_VERSION` zůstává 2.
- KDYŽ je v `session` rozbité **jen jedno** pole (třeba `lastOrderAt: -5` nebo `orders: "x"`), PAK
  se opraví na 0 jenom to jedno a ostatní tři si ponesou svou hodnotu.
- KDYŽ se slučují dva záznamy, PAK `session` je z `local`, `mergeSave(a, a)` vrátí `a` a všechny
  ostatní části se slučují jako dosud.
- KDYŽ `session.complete()` dokončí objednávku, PAK se `save.session` posune a do úložiště jde
  **právě jeden** zápis (jako dnes).
- KDYŽ `session.reopen()`, PAK je `save.session` roven `NEW_SESSION`, je to zapsané a `tracks`,
  `stars`, `progress` ani `settings` se nezměnily.
- KDYŽ `session.close(60_000)`, PAK `isClosed(save.session, now)` je `true` a za minutu `false`.

**Scéna**

- KDYŽ dcera dokončí desátou objednávku sezení, PAK zákazník odejde jako vždycky, kuchyně ztmavne,
  ze shora sjede mříž, zazní rachot a hláška `closing.*` a na mříži visí minutka s plnou výsečí.
- KDYŽ je kuchyně zavřená, PAK není vidět zvoneček, klepnutí do kuchyně nic nespustí a jediné živé
  cíle jsou mříž a zámek.
- KDYŽ dcera klepne na mříž a vypravěč mlčí, PAK zazní `closed.*`; KDYŽ zrovna mluví, PAK klepnutí
  nic nepřidá (nefronťuje se).
- KDYŽ se stránka načte znovu se zavřenou kuchyní, PAK je mříž dole bez animace a bez zvuku,
  minutka ukazuje zbývající výseč a zazní `closed.*`.
- KDYŽ odpočet doběhne při zapnuté hře, PAK mříž sama vyjede, zazní `open.1` a objeví se zvoneček
  (nejpozději 15 s po vypršení, jak tiká překreslování).
- KDYŽ odpočet doběhne zrovna v okamžiku, kdy je otevřená klávesnice, PAK se panel zavře a mříž
  vyjede – zadávání se nemá o co opřít, ale nic se nezasekne.
- KDYŽ rodič klepne na zámek, PAK se objeví klávesnice s deseti klávesami ≥ 88 px a čtyřmi
  prázdnými tečkami; klepnutí mimo panel ji zavře a mříž zůstane dole.
- KDYŽ zadá `1234`, PAK se klávesnice zavře, mříž vyjede, `save.session.orders` je 0 a `tracks`,
  `stars` ani `progress` se nezměnily.
- KDYŽ zadá jakýkoliv jiný čtyřciferný kód, PAK se panel zatřese, tečky se vyprázdní a kuchyně
  zůstane zavřená (žádné počítání pokusů, žádné blokování – pravidlo 2).
- KDYŽ je zapnuté `prefers-reduced-motion`, PAK mříž, klávesnice i minutka skočí do své polohy bez
  animace a scéna se nezasekne.
- KDYŽ se změní velikost okna, PAK mříž vyplní novou šířku a minutka i zámek sedí na svých místech.
- KDYŽ se scéna opustí (přepnutí scény), PAK se zastaví interval minutky i všechny animace zavírání.

## Testy

- Unit (Vitest) `src/game/closing.test.ts`: `afterOrder` (devátá × desátá objednávka, pauza delší
  než `CLOSED_MS`, otevření po zavíračce, záporná pauza, prázdný `NEW_SESSION`), `closeUntil`
  (výchozí délka, tři hodiny, oříznutí nad `MAX_CLOSED_MS`, zápor i `NaN`, `orders`/`lastOrderAt`
  beze změny), `isClosed` (před/po, přeskočené hodiny), `remainingMs` a `closedProgress`
  (1 → 0, otevřeno = 0, minutová zavíračka začíná na 1).
- `src/game/save.test.ts`: `createSave().session` je `NEW_SESSION`; záznam bez `session`, se
  `session: null` a `"x"` se opraví na `NEW_SESSION`; **částečně** rozbité `session` (jedno pole
  záporné, jedno řetězec) si zdravá pole ponese; `session` přežije `parseSave` → `JSON.stringify`
  → `parseSave`; verze zůstává 2 a migrace v1 → v2 dá záznam s výchozím sezením.
- `src/game/merge.test.ts`: `session` je vždycky z `local`; `mergeSave(a, a) === a` (hluboká
  rovnost) i se zavřeným sezením.
- `src/game/session.test.ts`: po desátém `complete()` je `isClosed(save.session, now)` true (čas
  z injektovaného `now`); devátý ještě ne; `complete()` zapisuje jednou; `close()` a `reopen()`
  zapisují a nesahají na `tracks`/`stars`; po `reopen()` je další objednávka první v sezení.
- `src/art/layout.test.ts`: `closedLayout()` se na 1024/1200/1366 vejde do scény, zámek i klávesy
  mají ≥ 88 px, `keypadKeys()` vrátí deset boxů uvnitř panelu, které se nepřekrývají, a nula je
  uprostřed poslední řady.
- `src/game/speech.test.ts`: každé id z `closingPreload()`, `createClosingPicker()`
  a `createClosedPicker()` je v manifestu (`hasLine`).
- `src/data/lines.cs.test.ts`: počet hlášek **316 → 321** (řádek 51), pořád bez duplicit.
- `src/data/sfx.test.ts`: počet efektů **14 → 15** (řádek 20), `shutter` má platné id.
- Spuštění: `docker compose run --rm test`, `docker compose run --rm check`,
  `docker compose run --rm build`.

## Ruční ověření

Dev server běží ručně (`docker compose --profile dev up -d`), Chrome DevTools, iPad landscape.

- [ ] **Zavření naostro:** nová hra, pak desetkrát `__kitchen.finish()` (dokončí objednávku bez
      hraní). Po desáté musí zákazník odejít, kuchyně ztmavnout, sjet mříž s rachotem, zaznít
      „Kuchyně dneska zavírá, dobrou noc!" a viset minutka s plnou výsečí. Zvoneček nesmí být vidět.
- [ ] `__save.read().session` ukáže `orders: 10` a `closedUntil` dvě hodiny dopředu.
- [ ] **Klepnutí na mříž** řekne „Kuchyně má zavřeno…"; druhé klepnutí během věty už nic nepřidá.
- [ ] **Reload** (F5, znovu přes úvodní obrazovku): mříž je dole hned a bez zvuku, minutka ukazuje
      skoro plnou výseč, zazní „…máme zavřeno".
- [ ] **Zámek:** klepnout na zámek vpravo dole → klávesnice; zadat `1119` → panel se zatřese,
      tečky zmizí; klepnout vedle panelu → zavře se, mříž zůstane; znovu zámek a `1234` → mříž
      vyjede, zazní „Kuchyně je zase otevřená!", vrátí se zvoneček.
- [ ] `__save.read().session.orders` je po kódu 0, `stars` a `tracks` beze změny; jedna odehraná
      objednávka pak dá `orders: 1`.
- [ ] **Samovolné otevření:** `__kitchen.close(1)` (minuta), počkat – nejpozději do 15 s po
      vypršení mříž sama vyjede a objeví se zvoneček.
- [ ] **Minutka ubývá:** `__kitchen.close(1)` – výseč začíná **plná** (dělí se délkou právě
      probíhající zavíračky, ne dvěma hodinami), viditelně se zmenšuje a ručička couvá k dvanáctce.
- [ ] **Klávesnice vs. odpočet:** `__kitchen.close(1)`, otevřít klávesnici a nechat odpočet
      doběhnout – panel se zavře, mříž vyjede, nic se nezasekne.
- [ ] **Reduced motion:** zapnout v DevTools (Rendering → Emulate CSS prefers-reduced-motion),
      `__kitchen.close(2)` – mříž je rovnou dole, klávesnice se otevírá bez animace, nic se nezasekne.
- [ ] **Zvuk:** namátkou přehrát nové klipy (`__voice.say('closing.1')`, `'closed.2'`, `'open.1'`)
      a `__sfx.play('shutter')` – hlasitost sedí ke zbytku, rachot netrhá.
- [ ] **Mobil na šířku (844×390):** mříž vyplní celou šířku, minutka je celá vidět, zámek se
      nekříží s ničím a klávesnice se vejde do výšky.
- [ ] **Změna velikosti okna** se zavřenou kuchyní: mříž se překreslí na novou šířku, minutka
      a zámek sedí.

## Změny návrhu

`docs/navrh-hry.md`, kap. 4 „Konec sezení" – přepsat na to, co se opravdu staví:

- cedule „Zavřeno" **odpadá** (text v UI zakazuje pravidlo 1); místo ní **sjede mříž** a na ní visí
  **kuchyňská minutka**, která odpočítává dvě hodiny do otevření;
- **zvířátka nemávají** (rozhodnutí autora, srpen 2026) – zákazník odejde jako po každé objednávce
  a teprve pak se zavírá;
- doplnit, že se **stav sezení ukládá**, takže ho reload neobejde, a že se sezení počítá znovu od
  jedné po pauze delší než dvě hodiny.

Kap. 9 „Rodičovský koutek" – doplnit větu, že do STEP-19 zastupuje zámek **dočasná číselná
klávesnice s kódem `1234`** na zavřené kuchyni, která jenom vynuluje sezení a otevře.

## DoD

- [x] Všechna akceptační kritéria splněna
- [x] Testy a build zelené
- [x] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [x] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

**Hotovo ve třech zastávkách podle plánu** (každá je vlastní commit, zatím necommitnuto – čeká na
pokyn autora).

**Zastávka 1/3 – logika sezení.** Nový `src/game/closing.ts` (`SESSION_ORDER_LIMIT`, `CLOSED_MS`,
`MAX_CLOSED_MS`, `PARENT_CODE`, `SessionState`, `NEW_SESSION`, `afterOrder`, `closeUntil`,
`isClosed`, `remainingMs`, `closedProgress`) + `closing.test.ts` (21 testů). `save.ts` má páté pole
`session` s `repairSession` (čtyři nezávislé `repairCount`) a výchozí hodnotou v `createSave()`;
`SAVE_VERSION` zůstává 2. `merge.ts` nechává `session` z `local`. `session.ts` posouvá sezení
jedním zápisem v `complete()` (čas z jednoho dotazu na hodiny, sdílený s `todayStamp`) a přidává
`close(ms?)` a `reopen()`. Testy doplněny v `save.test.ts`, `merge.test.ts`, `session.test.ts`.

**Zastávka 2/3 – hlas a zvuk.** Pět celých vět v `lines.cs.ts` (`closing.1/2`, `closed.1/2`,
`open.1`) s helpery `closingLines()`, `closedLines()`, `OPEN_LINE`; manifest **316 → 321**. Efekt
`shutter` v `sfx.ts`, **14 → 15**. `speech.ts`: `createClosingPicker()`, `createClosedPicker()`,
`closingPreload()`. `docker compose run --rm voice` vygeneroval přesně 5 klipů (179 znaků, cook),
`sfx` jeden efekt; obojí normalizované a committnuté v `public/audio/`.

**Zastávka 3/3 – zavírací scéna.** Nové `art/shutter.ts` (mříž na šířku scény), `art/clock.ts`
(minutka s ubývající výsečí), `art/lock.ts` (`padlock`, `keyCap`, `codeDots`); `art/layout.ts`
dostal `closedLayout()`, `keypadKeys()` a konstanty. `scenes/kitchen/closing.ts` je celý handle
(ztmavení, mříž, minutka, zámek, klávesnice, interval po 15 s, samovolné otevření);
`scenes/kitchen/index.ts` ho napojuje (zavření po odchodu zákazníka, otevření kuchyně už zavřené,
dev handly `__kitchen.close(minutes?)` a `.open()`), `style.css` má vrstvy. Testy v
`art/layout.test.ts` a `art/art.test.ts`.

**Odchylky od plánu** (žádná nemění Kontrakt ani Rozsah):

1. **`codeSlot(panel)` v `layout.ts` navíc** – řádek teček potřeboval vlastní box; s ním přibyly
   jako exporty i konstanty, které plán uváděl jen v próze (`KEYPAD_WIDTH` = 360,
   `KEYPAD_HEIGHT` = 528, `CODE_HEIGHT`, `CLOCK_TOP`), aby je testy počítaly z jednoho místa.
2. **Minutka visí uvnitř prvku mříže**, ne vedle něj – sjíždí a vyjíždí s ní jako hodiny na mříži,
   ne jako samostatná vrstva.
3. **Zvoneček schovává CSS** (`.scene-kitchen.is-closed .kitchen-bell { display: none }`), třídu
   přepíná handle na kořeni scény. `bell.hide()` ho jen ztlumí, a akceptační kritérium říká „není
   vidět“.
4. **Klepnutí mimo panel** řeší vlastní podkladový prvek uvnitř skupiny klávesnice, ne posluchač
   na celé scéně – klávesy tak zůstávají nad ním a nepotřebují kontrolu cíle.
5. **`open()` animuje s `fill: 'forwards'` a fill hned po schování vrstvy ruší.** Bez `forwards`
   mříž na jeden snímek spadla zpátky dolů; s ním ale doběhlá animace držela mříž nad scénou dál
   a **další `close()` nevykreslil nic** – chyba nalezená při ručním ověření, opravená a ověřená
   cyklem zavřít → otevřít → zavřít. `close()` pro jistotu ruší i cizí animace mříže.

**Ověření.** `docker compose run --rm test` (26 souborů, **685 testů**), `check` (tsc + prettier)
i `build` zelené. V prohlížeči (dev server autora, Chrome, 1100×757 a telefon na šířku 844×357)
projito celé Ruční ověření:

- desátá objednávka zavře kuchyni: zákazník odejde, ztmavnutí, mříž, rachot, „Kuchyně dneska
  zavírá, dobrou noc!“, plná výseč minutky, zvoneček zmizí (`display: none`);
- `session` v záznamu: `orders: 10`, `closedUntil` +1,993 h (pár vteřin po zavření);
- klepnutí na mříž řekne „Kuchyně má zavřeno…“, další dvě klepnutí během věty nic nepřidají
  (po 5 s je ticho – fronta by hrála dál);
- reload: mříž je dole **bez animace** (`getAnimations().length === 0`, `transform: none`)
  a zazní „…máme zavřeno“;
- zámek → klávesnice; `1119` zatřese panelem (ověřeno běžící animací) a vyprázdní tečky, kuchyně
  zůstane zavřená; klepnutí vedle panelu ho zavře; `1234` vytáhne mříž, vrátí zvoneček,
  `session.orders` je 0 a `stars`, `tracks` i `progress` jsou beze změny (porovnáno JSONem);
  další odehraná objednávka dá `orders: 1`;
- `__kitchen.close(1)`: výseč začíná **plná** a po ~32 s je poloviční (ručička na šestce);
- klávesnice otevřená v okamžiku vypršení: panel se sám zavřel, mříž vyjela, zvoneček je zpět;
- telefon na šířku (844×357, scéna 1366×768): mříž přes celou šířku, minutka celá vidět, zámek
  volně v rohu (96 logických px = 45 fyzických, přesně jak pravidlo 3 počítá), klávesnice se
  vejde do výšky (klávesy 95–290 px z 357);
- změna šířky scény: mříž se překreslí (`svg width` 1366 → 1116), zámek i minutka se přepočítají;
- pět nových klipů i `shutter.mp3` se stahují (200, 12–30 kB) a přehrají; konzole bez chyb.

**Neověřeno / ověřeno jinak:**

- **`prefers-reduced-motion` naostro** (emulace v DevTools) přes nástroje k dispozici nešla.
  Nahrazeno vypnutím Web Animations API, což je **tatáž větev** – `createMotion().animate()` v ní
  vrací `null`. V tom režimu je mříž rovnou dole, klávesnice se otevře i zavře a `open()` schová
  vrstvu okamžitě; nic se nezasekne. CSS blok `@media (prefers-reduced-motion)` tím ověřený není.
- **Hlasitost nových klipů uchem** – generátor je normalizoval (hlas −18 LUFS, efekt −22 LUFS,
  `shutter` dostal −9,8 dB), ale jestli rachot sedí ke zbytku, ať posoudí autor.
- Ruční ověření proběhlo na dev serveru, kde jsem na začátku **vymazal `localStorage`** (testovací
  záznam vývojáře, ne zařízení dcery); v prohlížeči teď leží rozehraná hra s 11 hvězdičkami.

**Návrhy mimo rozsah** (nedělal jsem je):

- Mříž je hodně hustá (prut po 56 px). Až ji autor uvidí naživo, může chtít řidší rastr nebo
  tenčí pruty – je to jedna konstanta v `art/shutter.ts`.
- Samovolné otevření **nepřepisuje záznam** (nechá v něm doběhlou zavíračku). Nikomu to nevadí –
  `isClosed()` ji vyhodnotí jako otevřeno a další objednávka začne nové sezení – ale kdyby se
  jednou hodilo mít v záznamu čistý stav, patřilo by sem `session.reopen()`.
- Tikání minutky a zhasínání světla jako animace svítidla (plán je vědomě vynechal).
