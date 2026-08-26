# STEP-10 · Zvoneček, tři zákazníci a zvukové efekty

Status: done
Milník: M2 · Po: STEP-09 · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 4, 6, 7, 8

## Shrnutí

Po STEP-09 se smyčka zavřela, ale běží sama: dopočítá se hvězdička a za 400 ms naskočí další
objednávka, ať dítě chce nebo ne. Tenhle krok vrací dceři tempo (**zvoneček** na pultu je jediná
cesta k další objednávce), dává kuchyni **tři zákazníky** místo jednoho věčného medvídka
(medvídek, zajíček, kočička – přijdou zleva, sní dortík, odejdou) a vyměňuje syntetické
placeholder tóny za **MP3 efekty** vygenerované z ElevenLabs Sound Effects.

Zvířátka podle rozhodnutí autora (srpen 2026) **nemluví, jen vydávají zvuky** – mručení, pípnutí,
mňouknutí. Návrh kap. 6 obě varianty připouštěl; tahle nepotřebuje druhý hlas, role v generátoru
ani další casting, takže „repliky zákazníků“ z roadmapy jsou prostě položky zvukového manifestu.
Vypravěč zůstává jediný, kdo mluví, a je poznat, kdo je kdo.

Krok je velký (tři fáze, ~30 souborů) – autor rozhodl nedělit ho. Fáze jdou po sobě: **A** zvukový
kanál, **B** zákazníci, **C** zvoneček, protože B i C už chtějí zvuky z A. Po kroku je M2 z poloviny
hotové a chybí do něj STEP-11 (rozložení písmen a čísel) a STEP-12 (konec sezení, obnova).

## Rozsah

**V rozsahu**

- `src/data/sfx.ts` – manifest zvukových efektů (id, anglický prompt, délka), 14 položek.
- `scripts/generate-sfx.mjs` + `scripts/lib/audio.mjs` – generování přes ElevenLabs
  `POST /v1/sound-generation`, fingerprint index, loudness pass; sdílené kusy vytažené
  z `generate-voice.mjs` do knihovny (bez změny chování generátoru hlasu).
- `compose.yaml` – služby `sfx` (internet + klíč) a `normalize-sfx` (bez sítě).
- `src/audio/sfx.ts` – přehrávání efektů podle id, překrývají se, `rate` pro výškovou řadu počítadla.
- Náhrada `playCue()` ve všech voláních; **`src/audio/tones.ts` a jeho test se mažou**.
- Tři zákazníci: `src/art/rabbit.ts`, `src/art/cat.ts`, `src/art/customers.ts`,
  `src/data/customers.ts`, `src/game/customers.ts` (+ test), střídání přes `Session`.
- `src/scenes/kitchen/customer.ts` – příchod zleva, odchod, žvýkání; `finale.ts` přestává znát medvěda.
- Zvoneček: `src/art/bell.ts`, `src/scenes/kitchen/bell.ts`, box `bell` v `kitchenLayout()`,
  nečinnost 15 s / 40 s podle kap. 5.5, dvě nové hlášky vypravěče.
- Přejmenování `KitchenLayout.bear` → `customer` (s ním `.kitchen-bear` → `.kitchen-customer`).
- Zápis rozhodnutí do `docs/navrh-hry.md` kap. 6 a 8.

**Mimo rozsah**

- Druhý hlas, `VoiceRole: 'animal'`, role v generátoru, casting zvířecích hlasů.
- Hláška vypravěče při příchodu („Přišel medvídek!“) – zvuk zvířátka je signál sám o sobě;
  gendrované tvary za 3 klipy nestojí, dokud není jasné, jestli to dcera potřebuje.
- Zákazníci z obchůdku (žabka, liška, ježek, sova, prasátko) a VIP (král, dráček) – kap. 6, M3.
- Vracející se zákazník s osobní hláškou („Minule to bylo výborné!“) – kap. 6, M3.
- Uložení zákazníka do save a obnova po reloadu – STEP-12.
- Delší objednávky, rozložení písmen a čísel, distraktory – STEP-11.
- Foťák a fotka do alba (kap. 7 bod 2) – STEP-14; `camera` se teď negeneruje.
- Mixér, kroky po schodech, hudba – další výrobky (M5) a hudba (mimo v1).
- `src/audio/chime.ts` **zůstává** – viz Klíčová rozhodnutí.

## Implementace

**Soubory**

```
scripts/lib/audio.mjs              (nový)  sdílené: ffmpeg, loudness, atomic write, fingerprint, backoff
scripts/generate-sfx.mjs           (nový)  POST /v1/sound-generation → public/audio/sfx/
scripts/generate-voice.mjs         (změna) importuje scripts/lib/audio.mjs místo vlastních kopií
compose.yaml                       (změna) služby `sfx`, `normalize-sfx`
public/audio/sfx/<id>.mp3          (nový, commituje se)
public/audio/sfx/index.json        (nový, commituje se)

src/data/sfx.ts                    (nový)  manifest efektů + helpery na id
src/data/sfx.test.ts               (nový)
src/data/lines.cs.ts               (změna) BELL: 2 hlášky vypravěče (252 → 254)
src/data/lines.cs.test.ts          (změna) počet hlášek 252 → 254, `bellLines()`
src/data/customers.ts              (nový)  CustomerId, jména, kotva pusy
src/audio/sfx.ts                   (nový)  SfxPlayer
src/audio/sfx.test.ts              (nový)
src/audio/tones.ts                 (SMAZAT)
src/audio/tones.test.ts            (SMAZAT)
src/audio/chime.ts                 (změna) jen komentář: zůstává natrvalo
src/audio/context.ts               (změna) jen komentář u `master`

src/art/bell.ts                    (nový)
src/art/rabbit.ts                  (nový)
src/art/cat.ts                     (nový)
src/art/customers.ts               (nový)  customerArt(id) → SVG
src/art/bear.ts                    (změna) jen docblock (už není jediný zákazník)
src/art/layout.ts                  (změna) bear → customer, + bell
src/art/layout.test.ts             (změna)
src/art/art.test.ts                (změna)

src/game/customers.ts              (nový)  nextCustomer()
src/game/customers.test.ts         (nový)
src/game/session.ts                (změna) + readonly customer
src/game/session.test.ts           (změna)
src/game/speech.ts                 (změna) + createBellPicker()
src/game/speech.test.ts            (změna)

src/stage/scenes.ts                (změna) SceneDeps + sfx
src/main.ts                        (změna) createSfxPlayer, preload, DEV handle
src/scenes/title/index.ts          (beze změny – chime zůstává)
src/scenes/kitchen/bell.ts         (nový)
src/scenes/kitchen/customer.ts     (nový)
src/scenes/kitchen/index.ts        (změna) smyčka přes zvoneček
src/scenes/kitchen/finale.ts       (změna) customer místo bear, sfx místo playCue
src/scenes/kitchen/count-item.ts   (změna) sfx místo playCue
src/scenes/kitchen/choice-item.ts  (změna) sfx místo playCue
src/scenes/kitchen/style.css       (změna)

CLAUDE.md                          (změna) tabulka Commands + strom (sfx)
docs/navrh-hry.md                  (změna) kap. 6 a 8
docs/plan.md                       (změna) STEP-10 done + poznámky
```

**Knihovny** – žádné nové. Runtime dependencies zůstávají na nule; generátor jede na `fetch`
a `ffmpeg` z `media` stage obrazu, přesně jako `generate-voice.mjs`.

**Kroky**

*Fáze A – zvukový kanál*

1. `scripts/lib/audio.mjs`: přesunout z `generate-voice.mjs` beze změny chování `fail` a chybovou
   třídu, která se přitom **přejmenuje** `VoiceError` → `AudioGenError` (sdílí ji hlas i efekty),
   `list`, `globToRegExp`, `scopeFilter`, `writeAtomic`/`dropPending`/`sweepPartials`, `ffmpeg`,
   `mp3Format`, `measureLoudness`, `normalizeClip`, `readError`, `backoff`, `signed`, `fingerprint`.
   `normalizeClip(bytes, { format, lufs, truePeak })` dostane cíl parametrem místo modulové konstanty.
   `fingerprint(payload)` bere rovnou objekt (hlas si složí svůj, efekty svůj).
2. `generate-voice.mjs` importuje knihovnu a své kopie smaže – včetně `catch` v `main()`
   (dnes `error instanceof VoiceError`, `generate-voice.mjs:766`), který bude číst `AudioGenError`
   z knihovny. **Kontrola, že refaktor nic nezměnil:** `docker compose run --rm voice --dry-run`
   musí na řádku hlasu `cook` hlásit `0 new · 0 changed · 252 up to date`.
3. `src/data/sfx.ts` – tabulka 14 efektů (viz Kontrakt). Prompty **anglicky**: nejsou to texty pro
   dítě, ale technický vstup modelu, a ten je na angličtině natrénovaný (jazyková politika mluví
   o herním UI, ne o parametrech generátoru).
4. `scripts/generate-sfx.mjs` – stejná kostra jako generátor hlasu: index s fingerprintem, atomický
   zápis, přeskakování hotových, `--dry-run`, `--force`, `--only`, `--limit`, `--format`,
   `--normalize`, hlášení orphanů. Cílová hlasitost **−22 LUFS** (o 4 dB pod vypravěčem, ať efekty
   nepřekřikují pokyn), strop −1.5 dBTP. **Pozor:** brána EBU R128 u krátkého cvaknutí vrátí
   `-inf`/nesmysl – když naměřená hodnota není konečná nebo je pod −70 LUFS, spadne se na
   normalizaci podle špičky na −3 dBTP a do indexu se zapíše `loudness: 'peak'`.
5. `compose.yaml`: `sfx` (kopie služby `voice`, jiný entrypoint) a `normalize-sfx`
   (`network_mode: none`, entrypoint `… generate-sfx.mjs --normalize`).
6. Vygenerovat, poslechnout, špatné prompty přepsat a znovu pustit (jen změněné se přegenerují).
   Hotové MP3 se **commitují** (CI ani hra nikdy nepotřebují klíč – pravidlo 9).
7. `src/audio/sfx.ts` – `SfxPlayer` (viz Kontrakt). Vlastní `GainNode` na `engine.master`.
   Na rozdíl od hlasu **žádná fronta**: efekty se překrývají a nový nikdy neuřízne běžící.
8. Nahradit všech 12 volání `playCue()` (5× `count-item`, 4× `choice-item`, 3× `finale`) za `sfx.play()`,
   smazat `tones.ts` a `tones.test.ts`. Řada počítadla: jeden klip `pling` přehraný s
   `rate = 2 ** (semitone / 12)` pro půltóny `[0, 2, 4, 7, 9]` (C5 D5 E5 G5 A5) – stejná řada, co
   dnes syntetizují oscilátory, ale z jednoho souboru.
9. `SceneDeps.sfx`, vytvoření v `main.ts` vedle vypravěče, `sfx.preload()` tamtéž (stáhne bajty) a
   znovu v `kitchenScene` při mountu (tam už je kontext odemčený, takže se dekóduje).

*Fáze B – zákazníci*

10. `src/data/customers.ts` – `CustomerId`, `CUSTOMERS`, `STARTER_CUSTOMERS`, `isCustomerId()`.
    Bez importů (stejné pravidlo jako `curriculum.ts`).
11. `src/art/rabbit.ts` a `src/art/cat.ts` – **stejná konstrukce jako `bear.ts`**: viewBox 260×320,
    tělo v `<clipPath>` do y = 300 (linka pultu), tlapky pod clipem, obrys `#3B2A1A`, barvy jen
    z `PALETTE`. Zajíček: delší uši (dvě zaoblené elipsy nahoru), světlejší srst – přidat do palety
    `furRabbit: '#E8DCCB'`, `furCat: '#F0A868'`. Kočička: špičaté uši (trojúhelníky), fousky, ocas
    vykukující zpoza pultu se nekreslí (je pod clipem).
12. `src/art/customers.ts` – `customerArt(id)` a `CUSTOMER_WIDTH/HEIGHT`; jediné místo, kde se
    z id stane SVG.
13. `src/game/customers.ts` + test – `nextCustomer()` (viz Kontrakt). Nikdy nespadne: prázdná
    nabídka → `STARTER_CUSTOMERS`, jediný zbylý → vrátí ho, i když je to `avoid`.
14. `session.ts`: `readonly customer: CustomerId`; první se losuje v `createSession()`,
    `complete()` ho otočí s `avoid` na toho současného. Do save se **neukládá** (STEP-12).
15. `layout.ts`: `bear` → `customer` (rect beze změny), propsat do `finale.ts`, `index.ts`,
    `layout.test.ts`, CSS třídy `.kitchen-bear` → `.kitchen-customer`.
16. `src/scenes/kitchen/customer.ts` – drží prvek zákazníka, `show/arrive/leave/munch`. Příchod:
    `translateX(-CUSTOMER_ARRIVE_X)` → 0 za 600 ms `ease-out`, k tomu `sfx.play('steps')` a na konci
    `hello`. Odchod zrcadlově, 600 ms `ease-in`, se stejným `sfx.play('steps')` a na konci
    `hidden` (bez `hello`). Při `prefers-reduced-motion`
    (`motion.animate()` vrátí `null`) se zákazník **prostě objeví / zmizí**, zvuky hrají dál.
17. `finale.ts`: `bear: HTMLElement` → `customer: CustomerHandle`; `mouth()` čte kotvu z
    `CUSTOMERS[id].mouth` (zlomek boxu 260×320) místo natvrdo napsaných 130/150. Zvuky jídla mají
    dvě fáze: v `EAT_AT` (dortík dolétl k puse) `customer.munch()` + `sfx.play('munch')`, po
    dožvýkání (`MUNCH`) `sfx.play(customerYumSfx(id))` – kousnutí je pro všechny stejné, „mňam“
    je zvířete. V `STAR_AT` (hvězdička vyletí s konfetami) `sfx.play('sparkle')`; tím má každá
    položka manifestu své volající místo a nic se negeneruje nazapřenou.

*Fáze C – zvoneček*

18. `src/art/bell.ts` – mosazný pultový zvonek (kopule, knoflík, podstavec), 96×96, `PALETTE.wax`
    není mosaz → přidat `brass: '#E0A83C'`, `brassDark: '#B4801F'`.
19. `layout.ts`: `bell` do `KitchenLayout`, `bell.x = bowl.x + bowl.width + 16`,
    `bell.y = bowl.y + bowl.height − BELL_SIZE` (stojí na stejné lince pultu jako miska).
    Při 1024 to je `{ x: 916, y: 444, 96, 96 }` – 16 px od misky, 12 px od pravého okraje;
    invariant „8 px mezi libovolnými dvěma boxy“ tím drží.
20. `lines.cs.ts`: `BELL = ['Zazvoň na zvoneček!', 'Klepni na zvoneček!']`, `bellLines()`;
    `speech.ts`: `createBellPicker()`.
21. `src/scenes/kitchen/bell.ts` – terč 96×96 (≥ 88), `show()/hide()`, cinknutí a poskočení při
    klepnutí, `createIdleWatcher`: 15 s poskočí + vypravěč, 40 s prsten `hintRing(96)` + vypravěč.
    Skrytý zvoneček nemá `pointer-events` – během objednávky ani finále na něj nejde klepnout.
22. `index.ts` – smyčka: `finishOrder()` už nespouští další objednávku, ale
    `customer.leave(() => bell.show())`; `bell.onRing` → `bell.hide()` →
    `customer.arrive(ctx.session.customer, () => startOrder(order))`. Kdo právě odchází, ví
    `customer.current` – scéna si **nedrží vlastní kopii**. Důležité: `session.complete()`
    proběhne už při přistání hvězdičky, takže `session.customer` je v tu chvíli **už ten další**;
    `session.customer` se čte jedině při zazvonění, nikdy při odchodu.
23. Start scény: kuchyně začíná **prázdná se zvonečkem** (návrh kap. 4: „zvoneček → přijde
    zákazník“), ne s hotovou objednávkou.
24. DEV handle: `__kitchen.ring()`, `__kitchen.customer(id)`; `__sfx.play(id, rate)`.
    Stávající `__kitchen.clear()` navíc srovná i nové části: `bell.hide()`, zákazník zůstane stát.

**Klíčová rozhodnutí**

- **`chime.ts` zůstává, `tones.ts` mizí.** Úvodní cinknutí zní v okamžiku odemčení audia – dřív,
  než může být cokoli dekódované, takže MP3 by tam bylo ticho. Syntéza je tam jediná, co zazní
  spolehlivě. Tóny počítadla naopak MP3 nahradí, protože se dají dekódovat dopředu.
- **Řada počítadla z jednoho klipu.** Text-to-sound-effects neumí zadat výšku tónu; pět stoupajících
  cinknutí by z pěti promptů vyšlo pokaždé jinak. Jeden `pling` + `playbackRate` dá čistou řadu
  a ušetří čtyři soubory.
- **Zvířátka jen zvukem** (rozhodnutí autora). Vedlejší efekt: `VoiceRole` zůstává `'narrator'`
  a generátor hlasu se nemusí učit role – komentář v `lines.cs.ts`, který slibuje `'animal'`
  ve STEP-10, se opraví.
- **Losování zákazníka patří do `Session`.** Je to jediné místo s injektovaným `rng`, takže je to
  testovatelné a scéna nemá vlastní zdroj náhody.
- **Kotva pusy je zlomek, ne pixely.** Každé zvíře má tlamu jinde; `finale.ts` nesmí znát medvěda.
- **Refaktor generátoru hlasu je čistě mechanický** a dokládá se `--dry-run` (0 changed). Kdyby se
  fingerprint pohnul, přegenerovalo by se 252 klipů a stálo by to peníze.

Pseudokód smyčky:

```
startOrder(order)                        // bublina, položka, vypravěč
  → dítě splní → finale.run()
      STAR_AT  → onStar()  → session.complete(results)   // session.customer už je DALŠÍ
      DONE_AT  → onDone()  → finishOrder()
finishOrder()
  finale.reset(); items.clear(); bubble.show(null)
  customer.leave(() => bell.show())      // 600 ms + steps, pak idle watcher
bell.onRing()
  sfx.play('bell'); bell.hide()
  customer.arrive(ctx.session.customer,  // 600 ms + steps + hello
                  () => startOrder(ctx.session.order))
```

## Kontrakt

```ts
// src/data/customers.ts
export type CustomerId = 'bear' | 'rabbit' | 'cat';

export interface Customer {
  readonly id: CustomerId;
  /** České jméno pro dítě (album a obchůdek v M3); herní obsah, proto česky. */
  readonly label: string;
  /** Kam mizí dortík: zlomek boxu 260×320 daného zvířete. */
  readonly mouth: { readonly x: number; readonly y: number };
}

export const CUSTOMERS: Readonly<Record<CustomerId, Customer>>;
export const STARTER_CUSTOMERS: readonly CustomerId[]; // ['bear', 'rabbit', 'cat']
export function isCustomerId(value: string): value is CustomerId;
```

Příklad: `CUSTOMERS.bear` = `{ id: 'bear', label: 'medvídek', mouth: { x: 0.5, y: 0.469 } }`
(130/260 a 150/320 – stejné místo, které dnes `finale.ts` počítá natvrdo).

```ts
// src/game/customers.ts
export function nextCustomer(input: {
  readonly available: readonly CustomerId[];
  /** Kdo právě odešel – toho nechceme hned znovu. */
  readonly avoid?: CustomerId | null;
  readonly rng?: Rng;
}): CustomerId;
```

Příklad: `nextCustomer({ available: ['bear','rabbit','cat'], avoid: 'bear', rng: createRng(1) })`
→ `'rabbit'` nebo `'cat'`, nikdy `'bear'`. `nextCustomer({ available: ['cat'], avoid: 'cat' })`
→ `'cat'` (jeden zbylý má přednost před pádem – pravidlo 2).

```ts
// src/game/session.ts (rozšíření)
export interface Session {
  readonly save: SaveData;
  readonly order: Order;
  /** Kdo nese současnou objednávku (návrh kap. 6). Do save se neukládá. */
  readonly customer: CustomerId;
  complete(results: readonly ItemResult[]): Order;
}
```

```ts
// src/data/sfx.ts
export interface SoundEffect {
  /** Id i název souboru: `^[a-z0-9]+([.-][a-z0-9]+)*$` → public/audio/sfx/<id>.mp3 */
  readonly id: string;
  /** Anglický prompt pro ElevenLabs Sound Effects. */
  readonly prompt: string;
  /** 0.5–30 s; kratší efekt = levnější a ostřejší náběh. */
  readonly durationSeconds: number;
  /** 0–1, výchozí 0.3 (default API). Vyšší = drží se promptu víc. */
  readonly promptInfluence?: number;
}

export const SFX: readonly SoundEffect[];
export function hasSfx(id: string): boolean;
export function sfxPath(id: string): string;             // `audio/sfx/${id}.mp3`
export function customerHelloSfx(id: string): string;    // `customer.${id}.hello`
export function customerYumSfx(id: string): string;      // `customer.${id}.yum`
/** Půltóny řady počítadla → playbackRate; index mimo rozsah cykluje. */
export const PLING_SEMITONES: readonly number[];         // [0, 2, 4, 7, 9]
export function plingRate(step: number): number;         // 2 ** (semitone / 12)
```

Manifest (14 položek, `durationSeconds` v závorce):

| id | prompt | s |
|---|---|---|
| `whoosh` | soft quick whoosh of a small object flying through the air, cartoon, clean, no music | 0.6 |
| `pling` | short bright glockenspiel ding, single clean note, no reverb tail | 0.8 |
| `done` | warm friendly two-note kitchen oven timer ping, cheerful, clean | 1.2 |
| `nope` | soft low wooden bump, gentle and encouraging, cartoon, not harsh | 0.6 |
| `bell` | small brass shop counter desk bell rung once, bright ding | 1.5 |
| `sparkle` | short magical sparkle twinkle, bright, cartoon reward | 1.0 |
| `steps` | soft padding footsteps of a small animal on a wooden floor, four light steps | 1.5 |
| `munch` | cute cartoon character taking a bite and chewing happily, soft | 1.5 |
| `customer.bear.hello` | friendly low cartoon bear grunt, warm and short, no words | 1.0 |
| `customer.bear.yum` | happy cartoon bear contented low hum, no words | 1.0 |
| `customer.rabbit.hello` | cute high cartoon rabbit squeak, friendly and short, no words | 1.0 |
| `customer.rabbit.yum` | happy cartoon rabbit nibble squeak, cheerful, no words | 1.0 |
| `customer.cat.hello` | soft friendly cartoon cat meow, short, no words | 1.0 |
| `customer.cat.yum` | contented cartoon cat purr with a small mrrp, short | 1.0 |

```ts
// src/audio/sfx.ts
export interface SfxPlayer {
  /** Efekty se překrývají; nový nikdy neuřízne běžící. Neznámé id = ticho (+ DEV warn). */
  play(id: string, options?: { readonly rate?: number }): void;
  /** Bez argumentu celý manifest. Stáhne bajty; dekóduje, jakmile je kontext odemčený. */
  preload(ids?: readonly string[]): void;
  setVolume(volume: number): void;
  /** Pro ruční ověření: je všechno předdekódované? */
  readonly ready: boolean;
  destroy(): void;
}

export function createSfxPlayer(options: {
  readonly engine: AudioEngine;
  readonly baseUrl?: string;                 // default import.meta.env.BASE_URL
  readonly fetch?: FetchLike;                // jen testy; typ se sdílí z ./voice
}): SfxPlayer;
```

`rate` se ořízne do `[0.25, 4]`; `NaN`/`Infinity` → 1. Zamčené audio, 404, nedekódovatelný soubor
i id mimo manifest znamenají **ticho, nikdy výjimku** – stejné pravidlo jako u hlasu.

Index generátoru `public/audio/sfx/index.json`:

```json
{
  "version": 1,
  "model": "eleven_text_to_sound_v2",
  "format": "mp3_44100_64",
  "effects": {
    "bell": {
      "hash": "7f3c1a90b2d4e5f6",
      "prompt": "small brass shop counter desk bell rung once, bright ding",
      "durationSeconds": 1.5,
      "promptInfluence": 0.3,
      "bytes": 13284,
      "loudness": -22
    }
  }
}
```

`hash` = prvních 16 znaků sha256 z `{prompt, durationSeconds, promptInfluence, model, format}`
v pevném pořadí klíčů. `loudness` je `-22`, nebo `"peak"`, když brána R128 na krátkém klipu selhala.

HTTP volání (ověřeno v dokumentaci ElevenLabs, srpen 2026):
`POST https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_64`,
hlavičky `xi-api-key` a `content-type: application/json`,
tělo `{ "text": <prompt>, "duration_seconds": <0.5–30>, "prompt_influence": 0.3,
"model_id": "eleven_text_to_sound_v2" }`, odpověď `audio/mpeg`.

```ts
// src/scenes/kitchen/customer.ts
export interface CustomerHandle {
  /** Postaví zvíře na místo bez animace. **Jen DEV** (a rezerva pro obnovu po reloadu ve
   *  STEP-12); při normálním mountu se nevolá – kuchyně startuje prázdná se zvonečkem. */
  show(id: CustomerId): void;
  /** Přijde zleva; `onDone` po dojití. */
  arrive(id: CustomerId, onDone: () => void): void;
  /** Odejde doleva a schová se; `onDone` po odchodu. */
  leave(onDone: () => void): void;
  /** Žvýkání při jídle (dnes v finale.ts). */
  munch(): void;
  /** Kam letí dortík – absolutní bod ve scéně podle kotvy současného zvířete.
   *  Když `current` je `null`, vrátí střed `layout.customer` (finále bez zákazníka neběží,
   *  ale handle nesmí spadnout). */
  mouth(): { readonly x: number; readonly y: number };
  readonly current: CustomerId | null;
  layout(layout: KitchenLayout): void;
  destroy(): void;
}

// src/scenes/kitchen/bell.ts
export interface BellHandle {
  /** Objeví se a začne hlídat nečinnost. */
  show(): void;
  /** Schová se a přestane hlídat; klepnutí pak nic nedělá. */
  hide(): void;
  layout(layout: KitchenLayout): void;
  destroy(): void;
}

export function createBellHandle(options: {
  readonly root: HTMLElement;
  readonly sfx: SfxPlayer;
  readonly voice: VoicePlayer;
  readonly line: LinePicker;
  readonly onRing: () => void;
}): BellHandle;
```

```ts
// src/art/layout.ts (změna)
export const BELL_SIZE = 96;               // ≥ 88 (CLAUDE.md pravidlo 3)
export const BELL_MARGIN = 16;             // mezera od misky
export interface KitchenLayout {
  readonly customer: Rect;                 // dřív `bear`
  readonly cake: Rect;
  readonly bowl: Rect;
  readonly shelfDigits: Rect;
  readonly shelfLetters: Rect;
  readonly bubble: Rect;
  readonly stars: Rect;
  readonly bell: Rect;                     // nový
}
```

Příklad: `kitchenLayout(1024).bell` = `{ x: 916, y: 444, width: 96, height: 96 }`;
`kitchenLayout(1366).bell` = `{ x: 1087, y: 444, width: 96, height: 96 }`.

## Akceptační kritéria

**Zvoneček a smyčka**

- KDYŽ se scéna kuchyně otevře poprvé, PAK je pult prázdný, žádná bublina, a vpravo od misky
  stojí zvoneček; žádná objednávka nezačne, dokud na něj dítě neklepne.
- KDYŽ dítě klepne na zvoneček, PAK cinkne, poskočí, zmizí, zleva přijde zvířátko, vydá svůj zvuk
  a teprve pak vypravěč řekne objednávku.
- KDYŽ hvězdička doletí do počítadla a doběhne finále, PAK zákazník odejde doleva a **až potom**
  se objeví zvoneček; další objednávka sama nenaskočí.
- KDYŽ objednávka běží nebo běží finále, PAK je zvoneček skrytý a klepnutí do jeho místa
  nic nespustí (žádná objednávka navíc, žádná hvězdička navíc).
- KDYŽ zvoneček svítí a dítě 15 s nic neudělá, PAK poskočí a vypravěč řekne jednu z hlášek `bell.*`;
  po dalších 25 s se kolem něj ukáže prsten nápovědy a hláška zazní znovu. Cyklus se opakuje,
  hra se nikdy nezasekne.
- KDYŽ dítě klepne na zvoneček dvakrát rychle po sobě, PAK přijde **jeden** zákazník
  a vygeneruje se **jedna** objednávka.

**Zákazníci**

- KDYŽ přijde zákazník, PAK je to jedno ze tří zvířátek a **nikdy to není ten, kdo právě odešel**.
- KDYŽ zákazník sní dortík, PAK dortík zmizí u jeho vlastní tlamy (ne u medvědovy) a zazní jeho
  `yum`, ne cizí.
- KDYŽ je zapnuté `prefers-reduced-motion`, PAK se zákazník objeví a zmizí bez posunu, zvuky hrají
  a smyčka doběhne stejně dlouho jako s animací.
- KDYŽ se okno zvětší nebo zmenší uprostřed příchodu, PAK zákazník skončí na svém místě
  (`layout.customer`) a nezůstane viset mimo scénu.
- KDYŽ se scéna zničí uprostřed příchodu nebo odchodu, PAK nezůstane běžet žádný časovač ani zvuk.

**Zvuk**

- KDYŽ dítě klepne na první ovoce v objednávce, PAK zazní `pling` v základní výšce; každý další kus
  je o půltón výš podle `PLING_SEMITONES`, pátý zní o velkou sextu výš.
- KDYŽ chybí soubor efektu (404), je id mimo manifest nebo je audio zamčené, PAK je ticho,
  hra běží dál a v DEV se objeví jedno varování.
- KDYŽ zákazník kousne do dortíku, PAK zazní `munch`, po dožvýkání jeho vlastní `yum`
  a při výletu hvězdičky `sparkle`; každý z 14 efektů manifestu má tím ve hře své místo.
- KDYŽ zazní efekt během věty vypravěče, PAK věta pokračuje – efekty a hlas jsou dvě samostatné
  větve a efekt nikdy neuřízne pokyn.
- KDYŽ se pustí `docker compose run --rm voice --dry-run` po refaktoru, PAK **na řádku hlasu
  `cook`** (ne na souhrnném `total:`) hlásí `0 new · 0 changed · 252 up to date` – a po přidání
  hlášek zvonečku `2 new · 0 changed · 252 up to date`.
- KDYŽ se pustí `docker compose run --rm sfx --dry-run` na hotové sadě, PAK hlásí 0 nových
  a 0 změněných a nepošle nic.
- KDYŽ generátor u krátkého klipu naměří `-inf` LUFS, PAK klip normalizuje podle špičky
  na −3 dBTP a do indexu zapíše `loudness: "peak"` – nikdy nespadne a nikdy nezesílí do klipu.

**Obecné**

- KDYŽ se hra postaví (`build`), PAK v `dist/` není `tones.ts` ani žádné volání `playCue`.
- KDYŽ hra běží, PAK nesahá na síť mimo vlastní origin (efekty jsou statické soubory z `public/`).

## Testy

Unit (Vitest, `environment: 'node'`):

- `src/game/customers.test.ts` – `nextCustomer()`: nikdy nevrátí `avoid`, když jsou aspoň dva;
  vrátí jediného zbylého, i když je to `avoid`; prázdná nabídka spadne zpět na `STARTER_CUSTOMERS`;
  se seedovaným `createRng` je výsledek opakovatelný; přes 600 losování padne každé zvíře.
- `src/game/session.test.ts` – `session.customer` je platné id; `complete()` ho otočí a nikdy
  nevrátí toho samého dvakrát po sobě; se stejným seedem je celá řada zákazníků opakovatelná.
- `src/data/sfx.test.ts` – id jsou unikátní a odpovídají `^[a-z0-9]+([.-][a-z0-9]+)*$`;
  `durationSeconds` je v 0.5–30; `promptInfluence` (pokud je) v 0–1; každé zvíře ze
  `STARTER_CUSTOMERS` má v manifestu `hello` i `yum`; `hasSfx()` sedí s manifestem;
  `plingRate()` vrací 1 pro krok 0, ~1.4983 pro krok 3 a cykluje mimo rozsah.
- `src/audio/sfx.test.ts` – se stubovaným `fetch` a fake AudioContextem (vzor
  `src/audio/voice.test.ts`): přehraje známé id; neznámé id nic nezahraje a nespadne;
  zamčený engine = ticho; dva `play()` za sebou vytvoří dva zdroje (překrývají se);
  `rate` se propíše do `playbackRate` a ořízne se; 404 se nezkouší podruhé.
- `src/art/layout.test.ts` – `bell` má ≥ 88 px, drží 8 px od misky i od okraje scény
  při 1024 i 1366, a stará jistota `kitchenLayout(1024).customer` = `{60,200,260,320}`.
- `src/art/art.test.ts` – `rabbit()`, `cat()`, `bell()` projdou stejnými invarianty jako ostatní
  moduly (jeden `<svg>`, viewBox, barvy jen z palety, obrys `#3B2A1A`).
- `src/data/lines.cs.test.ts` – manifest má 254 hlášek a `bellLines()` vrací existující id.

Spuštění: `docker compose run --rm test` (podmnožina: `docker compose run --rm test pnpm test customers`).

## Ruční ověření

Dev server: `docker compose --profile dev up -d`, `http://localhost:5173/mlsna-abeceda/`,
Chrome DevTools, iPad na šířku (1024×768).

- [ ] Po klepnutí na úvodní obrazovku je kuchyně **prázdná** a na pultu vpravo stojí zvoneček.
- [ ] Klepnutí na zvoneček: cinkne, poskočí, zmizí; zleva přijde zvířátko s kroky, vydá svůj zvuk,
      pak přijde bublina a vypravěč.
- [ ] Splnit objednávku: cinkání počítadla **stoupá** (1.–5. kus), svist při letu, „hotovo“ u finále.
- [ ] Zákazník sní dortík u své vlastní pusy, ozve se jeho „mňam“, hvězdička doletí do počítadla,
      zákazník odejde doleva a **teprve pak** se objeví zvoneček.
- [ ] Tři objednávky za sebou: zvířátka se střídají a stejné nepřijde dvakrát po sobě.
- [ ] Nechat zvoneček svítit 15 s: poskočí a vypravěč pobídne. Po dalších 25 s prsten nápovědy.
- [ ] Během objednávky klepnout do místa, kde zvoneček bývá – nic se nestane.
- [ ] Dvojklep na zvoneček → jeden zákazník, jedna objednávka, jedna hvězdička.
- [ ] DevTools › Rendering › Emulate `prefers-reduced-motion: reduce`: příchod i odchod bez posunu,
      zvuky hrají, smyčka doběhne.
- [ ] Zvuk: poslechnout všech 14 efektů (`__sfx.play('<id>')`) – žádný nesmí být hlasitější než
      vypravěč, žádný nesmí lupat ani syčet. Co zní špatně, dostane nový prompt a přegeneruje se.
- [ ] Efekt během věty vypravěče větu neuřízne (klepat na ovoce, zatímco mluví).
- [ ] Rozměr mobilu na šířku **844×390**: zvoneček je celý vidět, terč se dá trefit palcem,
      zákazník se vejde do scény, nic se nepřekrývá.
- [ ] Dotykem (DevTools touch emulace) projít celou smyčku dvakrát – žádné zaseknutí.
- [ ] Síť: v záložce Network po startu nejsou žádné requesty mimo vlastní origin.

## DoD

- [ ] Všechna akceptační kritéria splněna
- [ ] Testy a build zelené (`test`, `check`, `build`)
- [ ] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [ ] Efekty vygenerované, poslechnuté a commitnuté; `public/audio/sfx/index.json` sedí
- [ ] `docs/navrh-hry.md` kap. 6 a 8 doplněné, `CLAUDE.md` má nové příkazy
- [ ] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

Postaveno v sedmi zastávkách (autor validoval každou zvlášť, každá má vlastní commit).

**Fáze A – zvukový kanál**

- `scripts/lib/audio.mjs` (nový, 190 řádků) – společné části obou generátorů. `generate-voice.mjs`
  se zkrátil z 768 na 635 řádků.
- `scripts/generate-sfx.mjs` (nový, 437 řádků) – `POST /v1/sound-generation`, index s fingerprintem.
- `src/data/sfx.ts` + test – manifest 14 efektů, `plingRate()`.
- `src/audio/sfx.ts` + test – `SfxPlayer` bez fronty (efekty se překrývají).
- `compose.yaml` – služby `sfx` a `normalize-sfx`; `CLAUDE.md` – příkazy a strom.
- `public/audio/sfx/` – 14 MP3 + `index.json`, 172 kB, commitnuté.
- `src/audio/tones.ts` a `tones.test.ts` **smazané**, všech 12 volání `playCue()` nahrazeno.

**Fáze B – zákazníci**

- `src/data/customers.ts`, `src/game/customers.ts` + test (`nextCustomer()`).
- `src/art/rabbit.ts`, `src/art/cat.ts`, `src/art/customers.ts`; paleta o `furRabbit`, `furCat`,
  `furCatDark`, `brass`, `brassDark`.
- `src/scenes/kitchen/customer.ts` – `CustomerHandle` (příchod, odchod, žvýkání, kotva pusy).
- `session.ts` + test – `readonly customer`, losuje se injektovaným `rng`, do save se neukládá.
- `KitchenLayout.bear` → `customer`, CSS `.kitchen-bear` → `.kitchen-customer`.

**Fáze C – zvoneček**

- `src/art/bell.ts`, `KitchenLayout.bell` (odvozený z misky), `src/scenes/kitchen/bell.ts`.
- `lines.cs.ts` – `BELL`, manifest **252 → 254**; `speech.ts` – `createBellPicker()`.
- `index.ts` – smyčka `finishOrder → customer.leave → bell.show → onRing → customer.arrive →
  startOrder`; kuchyně startuje **prázdná**. DEV: `__kitchen.ring()`, `__kitchen.customer(id)`,
  `__sfx.play(id, rate)`.

### Odchylky od plánu

1. **Fallback na `-inf` z brány R128 je ve sdílené knihovně, ne jen v generátoru efektů.**
   `measureLoudness()` na řetězec `-inf` vůbec nematchoval regexem, takže by běh spadl na
   matoucí „ffmpeg printed no loudness summary“. Teď `-inf` vrací `-Infinity` a `normalizeClip`
   má volitelný `peakCeiling`. Kontrakt ani rozsah se nemění. (Nakonec ho žádný klip nepotřeboval.)
2. **`sparkle` a `munch` dostaly volající místo** (nález revize): `munch` při kousnutí, `yum` až po
   dožvýkání, `sparkle` při výletu hvězdičky. Bez toho by se dva placené klipy generovaly nadarmo.
3. **Scéna si nedrží vlastní `currentCustomer`**, čte `customer.current` (návrh revize) – jeden
   zdroj pravdy. `session.customer` se čte jedině při zazvonění.
4. **`bubble.show(null)` při mountu** – bez toho zůstala na prázdném pultu viset prázdná bublina.
   Našlo se až v prohlížeči.
5. **`art.test.ts` dostal invariant „barvy jen z palety“** pro *všechny* moduly, ne jen nové.
   Starší art jím prošel beze změny.

### Jak se to ověřovalo

Vitest: **490 testů** (z 421 před krokem), `check` i `build` čisté, bundle 54,10 → 65,55 kB.
`sfx --dry-run` i `voice --dry-run` hlásí 0 new · 0 changed (14 efektů, 254 hlášek).

V běžícím prohlížeči (napíchnutý `createBufferSource`, efekty identifikované otiskem vzorků):

- **Řada počítadla** stoupá 1,0000 → 1,1225 → 1,2599 → 1,4983 → 1,6818 z jednoho klipu.
- **Sled jednoho kola:** `done` 402 ms · `whoosh` 1227 · `munch` 1789 · `sparkle` 2105 ·
  `customer.cat.yum` 2431 · `pling`@1,682 2805 · `steps` 3208 · zvoneček zpět 3933.
- **Kotva pusy:** dortík dolétl na `dx −423, dy −95` (zajíček) a `dy −101` (kočička) – přesně
  vlastní kotva každého zvířete.
- **Pořadí `session.complete()`:** v 2823 ms se `session.customer` přepnul na dalšího, ale u pultu
  pořád stála ta, co jedla.
- **Zazvonění:** `bell` 0 ms · `steps` 1 ms · `hello` 603 ms · vypravěč 969 ms. **Tři `pointerdown`
  za sebou = jeden zvoneček, jeden zákazník, jedna objednávka.**
- **Během objednávky** klepnutí do místa zvonečku nic nespustí (žádný zvuk, žádná hvězdička).
- **Nečinnost:** pobídka → prsten nápovědy ve stejné milisekundě jako druhá hláška → cyklus se
  restartuje přesně o `IDLE_REMIND_MS` později.
- **Reduced motion:** všechny zvuky na stejných milisekundách, smyčka doběhne stejně dlouho.
- **Zničení scény uprostřed chůze:** žádný zbylý element, žádný zvuk, dev handle uklizený.
- **Síť:** jediný origin, 14 souborů z `audio/sfx/` (129 kB).

### Co ověřené není

- **Mobil na šířku 844×390 jen výpočtem**, ne okem: okno prohlížeče nešlo na tu velikost zmenšit.
  Produkční `computeStage(844, 390)` a `kitchenLayout()` dávají scale 0,5078, zvoneček
  **48,8 × 48,8 CSS px** (nad 44 px pravidla 3) a 168 px od pravého okraje – vejde se celý.
- **Dotyk na skutečném tabletu.**
- **Jak to zní při hraní** – efekty autor poslechl jednotlivě, ne v běhu hry.

### Změna po kroku (srpen 2026)

Autor chtěl zvoneček **vlevo vedle dortu**, ne vpravo od misky. Vlevo se ale vejde jen na širokých
scénách: mezi zákazníkem a dortem je při 1024 px **12 px** (terč potřebuje 112) a posunout skupinu
dort + miska doprava nejde, protože řada koleček počítadla už u 1024 stojí přesně 8 px od police
s písmenky. `bellRect()` proto zvoneček staví vlevo od dortu, kde je aspoň `BELL_LEFT_CLEARANCE`
(24 px) volného pultu — od ~1272 px scény — a jinak spadne zpět vpravo od misky:

| šířka scény | zvoneček |
|---|---|
| 1024 (4:3) | `x = 916` (vpravo od misky) |
| 1200 | `x = 1004` (vpravo od misky) |
| 1280 | `x = 348` (vlevo od dortu) |
| 1366 (telefon na šířku, autorovo zařízení) | `x = 391` (vlevo od dortu, 71 px od zákazníka) |

Autor rozhodl s vědomím, že se tím zvoneček mezi zařízeními stěhuje.

Autor si po nasazení všiml, že **medvěd skoro nechodí**. Naměřeno: `nextCustomer()` s pravidlem
„jen ne ten, co právě odešel“ je sice v průměru férové (968/1008/1024 ze 3000), ale ze tří zvířátek
nechává dvě na minci, takže **25 % sezení o čtyřech objednávkách** vidí jen dvě zvířata a nejdelší
řada bez medvěda byla 12 objednávek. Nahrazeno `createCustomerQueue()` – **míchaný pytlík**
(kolo = všichni právě jednou, pořadí uvnitř kola losované, na švu se nikdo neopakuje). Po opravě:
0 % sezení jen se dvěma zvířaty, 1000/1000/1000 ze 3000, nejdelší řada bez medvěda 4. Pravidlo je
zapsané v `navrh-hry.md` kap. 6.

### Návrhy mimo rozsah

- Police si drží ozdobu i s prázdným pultem. Není to lež (je to inertní obsah), ale prázdná
  kuchyně by možná měla být prázdná úplně – na zvážení, až to uvidí dcera.
- `customer.ts` a `bell.ts` nemají vlastní Vitest – jsou to DOM moduly a projekt je testuje
  v prohlížeči. Až přibude `environment: 'jsdom'`, stálo by za to pokrýt aspoň `nextCustomer`
  → `arrive` → `startOrder` jako celek.
- Zajíčkova krémová srst (`#F0E4D2`) je blízko barvě stěny (`#FFE9D1`); obrys ji drží, ale
  na slabším displeji by mohla splývat.
