# STEP-08 · Hlas ve hře: fronta přehrávání, napojení kuchyně

Status: done
Milník: M1 · Po: [STEP-05](./STEP-05-counting-item.md), [STEP-06](./STEP-06-letter-and-digit-items.md), [STEP-07](./STEP-07-voice-manifest-and-generator.md) · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 5.5, 5.6, 8

## Shrnutí

STEP-07 vygeneroval 246 českých klipů do `public/audio/voice/cook/`, ale hra je zatím nepřehrává –
kuchyně mlčí a jediná zpětná vazba jsou syntetické tóny z `audio/tones.ts`. Tenhle krok přidá
`src/audio/voice.ts`: tenkou vrstvu nad Web Audio, která umí přehrát klip podle id, seřadit několik
vět za sebou a utnout tu běžící, když přijde novější (nikdy nemluví dva najednou, návrh kap. 8).
Mapu „herní data → id hlášky" drží čistý modul `src/game/speech.ts` bez DOM, takže je testovatelná
v Node. Kuchyně pak konečně mluví: zadá objednávku, počítá nahlas, opraví chybu dvěma celými
větami, napoví, pochválí a po 15 s nečinnosti objednávku zopakuje. Po tomhle kroku je položka
kompletní zážitek; STEP-09 na ni navěsí dokončení objednávky (bublina, zákazník jí, hvězdička).

## Rozsah

**V rozsahu**

- `src/audio/voice.ts` – přehrávač a fronta: `say()`, `stop()`, `preload()`, `setVolume()`,
  vlastní gain uzel pod master busem, líné stažení a dekódování klipu, cache v paměti.
- `src/game/speech.ts` – čisté mapování položky objednávky a herních událostí na id hlášek
  (objednávka, zopakování, počítání nahlas, „to stačí", oprava, nápověda) + výběr pochvaly
  bez bezprostředního opakování + seznam klipů k předstažení.
- `src/stage/scenes.ts` – `voice` ve `SceneContext` (scény si přehrávač nevyrábějí samy).
- `src/main.ts` – vytvoření přehrávače, předstažení klipů aktuální objednávky, DEV handle.
- `src/scenes/kitchen/{index,count-item,choice-item}.ts` – napojení všech míst, kde se mluví.
- Testy: `src/audio/voice.test.ts`, `src/game/speech.test.ts`.
- Oprava zastaralých komentářů v `audio/tones.ts` a `audio/chime.ts` (odkazují na STEP-07).

**Mimo rozsah**

- **Odstranění `tones.ts` a `chime.ts`** – autor rozhodl (srpen 2026), že placeholder tóny
  i úvodní cinknutí zůstanou jako okamžitá odezva na dotyk; nahradí je až MP3 efekty v STEP-10.
  Výsledek [STEP-07](./STEP-07-voice-manifest-and-generator.md) tohle od STEP-08 čekal –
  dostane datovaný dodatek; do `docs/plan.md` jde poznámka (roadmapa sama o tónech nic neříká).
- `src/audio/sfx.ts` a zvukové efekty z ElevenLabs Sound Effects → STEP-10.
- Dokončení objednávky (bublina s objednávkou, zákazník jí, hvězdička, zápis pokroku) → STEP-09.
- Výběr vypravěče dítětem – hra mluví `DEFAULT_VOICE` z `src/data/voices.ts`; do `save` se nic
  neukládá (znamenalo by to migraci formátu) → vlastní krok, až budou hlasy aspoň dva.
- Rod pochval z nastavení → STEP-17; do té doby vždy `'neutral'`.
- Hlasitost v rodičovském koutku → STEP-17; `setVolume()` je jen připravené API.
- **Žádná nová hláška do manifestu** – generátor se v tomhle kroku nepouští, hra vystačí
  s 246 klipy. U počítání proto nápověda po 40 s zopakuje objednávku (klip „klepni na misku"
  neexistuje a stál by generovací běh).

## Implementace

**Soubory**

```
src/audio/voice.ts                      (nový)  přehrávač hlasu: fronta, cache, barge-in
src/audio/voice.test.ts                 (nový)  fake engine + fake fetch
src/game/speech.ts                      (nový)  herní data → id hlášek, výběr pochvaly
src/game/speech.test.ts                 (nový)  všechna id existují v manifestu
src/stage/scenes.ts                     (změna) SceneDeps { stage, audio, voice, session }
src/main.ts                             (změna) createVoicePlayer, preload, __voice
src/scenes/kitchen/index.ts             (změna) praise picker, předání voice oběma položkám
src/scenes/kitchen/count-item.ts        (změna) objednávka, počítání nahlas, „to stačí", pochvala
src/scenes/kitchen/choice-item.ts       (změna) objednávka, oprava, nápověda, pochvala
src/audio/tones.ts                      (změna) komentář: nahradí STEP-10, ne STEP-07
src/audio/chime.ts                      (změna) komentář: nahradí STEP-10, ne STEP-07
src/game/choice.ts                      (změna) komentář u isFirstTry: bod zvládnutí až STEP-09
src/game/counting.ts                    (změna) komentář u extraTaps: zpracuje až STEP-09
src/game/session.ts                     (změna) komentář: save se zapíše až ve STEP-09
docs/steps/STEP-07-voice-manifest-and-generator.md (změna) dodatek: tóny zůstávají do STEP-10
docs/plan.md                            (změna) stav kroku na done (řádek i poznámka už tam jsou)
```

**Knihovny** – žádná nová. Přehrávání jde přes Web Audio API a `fetch`, obojí je v prohlížeči
(CLAUDE.md: nula runtime závislostí, vlastní ~100řádkový wrapper).

**Kroky**

1. **`src/audio/voice.ts`.** `createVoicePlayer({ engine, voice?, baseUrl?, fetch? })`.
   Uvnitř: `bytes: Map<string, Promise<ArrayBuffer | null>>` (stažené soubory),
   `buffers: Map<string, AudioBuffer>` (dekódované), `queue: string[]`, `token: number`
   (generace – každé `say()`/`stop()`/`destroy()` ho zvýší a rozběhnutý řetěz se podle něj pozná
   jako zastaralý), `gain: GainNode | null` (vyrobí se líně při prvním přehrání a připojí na
   `engine.master`). URL klipu: `${baseUrl}${clipPath(slug, id)}`, tedy
   `/mlsna-abeceda/audio/voice/cook/count.3.mp3`.
2. **Testy přehrávače** proti fake enginu (tvar jako v `src/audio/tones.test.ts`, navíc
   `decodeAudioData` a `createBufferSource`) a fake `fetch`.
3. **`src/game/speech.ts`** – jen volání helperů z `src/data/lines.cs.ts`, žádný vlastní text.
4. **Testy mapování** – křížová kontrola s `hasLine()` přes celý rozsah M1.
5. **`src/stage/scenes.ts`** – `SceneDeps` jako objekt; `SceneContext extends SceneDeps` a přidává
   `go()`. `createSceneManager(deps, scenes)`; jediné volající místo je `main.ts`.
6. **`src/main.ts`** – přehrávač hned po `createAudioEngine()`, `voice.preload(orderPreload(...))`
   ještě před `scenes.go('title')` (stahují se bajty, dekóduje se až po odemčení), v DEV
   `__voice = { say, stop, preload }`.
7. **`src/scenes/kitchen/index.ts`** – `const praise = createPraisePicker();` a předání
   `voice` i `praise` do obou položek. **`destroy()` scény zavolá `ctx.voice.stop()`** (scéna
   přehrávač nevlastní, ale její hlášky nesmí přežít přepnutí); položky `stop()` nevolají.
   Dev handle `clear()` taky zavolá `ctx.voice.stop()`.
8. **`count-item.ts` a `choice-item.ts`** – místa, kde se mluví (viz tabulka níž). Obě položky si
   svoje věty spočítají samy ve `start()`, takže i DEV přehrání (`__kitchen.letter('K')`) mluví.
9. **Zastaralé odkazy v komentářích.** `tones.ts` a `chime.ts` slibují náhradu ve STEP-07 (je to
   STEP-10). `game/choice.ts` (`isFirstTry`), `game/counting.ts` (`extraTaps`) a `game/session.ts`
   slibují zápis pokroku ve STEP-08 – ten je až ve STEP-09 a tenhle plán ho má mimo rozsah;
   přepsat na STEP-09, ať implementující agent nečte protichůdné zadání. Do výsledku STEP-07
   datovaný dodatek o ponechání tónů.

**Kdy co zazní**

| Událost | Hlas | Kde |
|---|---|---|
| Start položky (i DEV přehrání) | objednávka, po `SPEAK_DELAY_MS` = 350 ms | obě položky |
| Ovoce dosedne na dort | `count.<placed>` – „Jedna." | count-item |
| Počet doplněn | pochvala, `PRAISE_DELAY_MS` = 900 ms po posledním dosednutí | count-item |
| Klepnutí na přiklopenou misku | „Už máme tři jahody, to stačí!" + odklad čekající pochvaly | count-item |
| Špatný kus (1. chyba) | „To je bé." + „Hledáme ká." | choice-item |
| Špatný kus (2. chyba = rozsvícení) | „To je bé." + „Ká je tady!" | choice-item |
| Nápověda po 40 s | `hintSpeech(target)`; u počítání `repeatSpeech(item)` | obě položky |
| Nečinnost 15 s | jen objednávková věta | obě položky |
| Správný kus dosedne na dort | pochvala | choice-item |

**Klíčová rozhodnutí**

- **Každé `say()` utne to, co běží.** Návrh kap. 8 chce „nikdy nemluví dva najednou" a „pokyn lze
  přerušit dotykem". Protože každé klepnutí dítěte stejně vyvolá novou hlášku, přerušení dotykem
  vyjde zadarmo a není potřeba žádný zvláštní posluchač na scéně. Fronta uvnitř jednoho `say()`
  slouží jen na věty, které patří k sobě („To je bé." + „Hledáme ká.").
- **Rychlé klepání = slyším poslední číslo.** Když dítě klepe rychleji, než stihne dojít „Dva.",
  věta se utne a začne „Tři." To je správně: hlas jde za dítětem, ne naopak.
- **Pochvala se odkládá, ne ruší.** Přebytečné klepnutí do přiklopené misky přearmuje časovač
  pochvaly (znovu `PRAISE_DELAY_MS`), takže „to stačí" doběhne celé a pochvala přijde po něm.
  Dítě o pochvalu nikdy nepřijde (pravidlo 2).
- **Druhá chyba nahradí „Hledáme…" nápovědou.** Jinak by dítě slyšelo tři věty a poslední dvě
  by si odporovaly tempem; návrh 5.5 u druhé chyby uvádí přímo „K je tady!".
- **Slovo k písmenku („Ká jako kočka.") zazní jen při zadání objednávky**, ne při každém
  pobídnutí – rozhodnutí autora.
- **Bajty se stahují dřív než se dekóduje.** `fetch` nepotřebuje `AudioContext`, takže předstažení
  běží už na tapovací obrazovce a první věta v kuchyni začne prakticky hned. Dekódování
  (`decodeAudioData`) až po odemčení audia.
- **`decodeAudioData` dostane kopii** (`bytes.slice(0)`): některé implementace vstupní buffer
  odpojí a druhé přehrání téhož klipu by pak selhalo.
- **Podpora starší Safari:** `decodeAudioData` se zkusí jako Promise, a když vrátí `undefined`,
  použije se callback varianta.
- **Pojistka na konec klipu:** kromě události `ended` se plánuje `buffer.duration * 1000 + 250 ms`
  jako fallback – zmrazený kontext (skrytá záložka) by jinak frontu zasekl navždy.
- **Ticho nikdy neblokuje.** Zamčené audio, chybějící soubor, 404, neúspěšné dekódování i id, které
  není v manifestu, znamenají ticho (v DEV `console.warn`), nikdy výjimku a nikdy zastavení hry.

**Pseudokód odkládané pochvaly (count-item)**

`Motion.after()` umí zrušit jen všechny časovače naráz, takže pochvala má vlastní handle
(stejný vzor jako `game/idle.ts`):

```
let praiseTimer: number | null = null;

function schedulePraise():                       // volá se při dokončení i při každém
  if praiseTimer !== null: clearTimeout(praiseTimer)   // přebytečném klepnutí (odklad)
  praiseTimer = setTimeout(() => { praiseTimer = null; voice.say(praise.next()) },
                           PRAISE_DELAY_MS)

reset() a destroy():  if praiseTimer !== null: clearTimeout(praiseTimer); praiseTimer = null
```

**Pseudokód fronty**

```
say(lines):
  ids = [lines].flat().filter(hasLine)            // neznámé id = žádný požadavek
  token++; queue = ids; stopSource(); step(token)

step(myToken):
  if myToken !== token or queue empty: speaking = false; return
  id = queue.shift()
  buffer = await ensureBuffer(id)                 // fetch → decode → cache
  if myToken !== token: return                    // mezitím přišlo novější say()/stop()
  if !buffer: step(myToken); return               // klip chybí: přeskočit, mluvit dál
  source = context.createBufferSource(); source.buffer = buffer
  source.connect(voiceGain); source.start()
  onEnded or after(buffer.duration + 0.25 s): if myToken === token: step(myToken)
```

## Kontrakt

```ts
// src/audio/voice.ts
export type FetchLike = (url: string) => Promise<{
  readonly ok: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
}>;

export interface VoicePlayer {
  /** Utne běžící hlášku a řekne tyhle id v pořadí. Id mimo manifest se tiše přeskočí. */
  say(lines: string | readonly string[]): void;
  /** Okamžité ticho a prázdná fronta. */
  stop(): void;
  /** Stáhne klipy dopředu (jen bajty). Bezpečné i před odemčením audia; chyby ignoruje. */
  preload(lines: readonly string[]): void;
  /** Právě něco hraje nebo se načítá. */
  readonly speaking: boolean;
  /** 0..1, hlasitost hlasového busu (rodičovský koutek, STEP-17). */
  setVolume(volume: number): void;
  destroy(): void;
}

export function createVoicePlayer(options: {
  readonly engine: AudioEngine;
  /** Slug z `src/data/voices.ts`; výchozí `DEFAULT_VOICE`. */
  readonly voice?: string;
  /** Výchozí `import.meta.env.BASE_URL` (končí lomítkem). */
  readonly baseUrl?: string;
  /** Jen pro testy; výchozí globální `fetch`. */
  readonly fetch?: FetchLike;
}): VoicePlayer;
```

```ts
// src/game/speech.ts
import type { PraiseGender } from '../data/lines.cs';

/** Zadání objednávky: u písmenka dvě věty (objednávka + slovo), jinak jedna. */
export function orderSpeech(item: OrderItem): readonly string[];
/** Pobídnutí po 15 s: jen první věta zadání. */
export function repeatSpeech(item: OrderItem): readonly string[];
/** Počítání nahlas po dosednutí `placed`-tého kusu. */
export function countSpeech(placed: number): readonly string[];
/** Klepnutí do přiklopené misky. */
export function enoughSpeech(amount: number, fruit: FruitKind): readonly string[];
/** Chyba: „To je bé." + („Hledáme ká." | „Ká je tady!" když se cíl rozsvítil). */
export function correctionSpeech(
  target: string,
  wrong: string,
  revealed: boolean,
): readonly string[];
/** Nápověda po 40 s / rozsvícení bez klepnutí. */
export function hintSpeech(target: string): readonly string[];
/** Vše, co může být během téhle objednávky potřeba – pro `voice.preload()`. */
export function orderPreload(order: Order, gender?: PraiseGender): readonly string[];

export interface PraisePicker {
  /** Nikdy dvakrát po sobě totéž (pokud pochvala není jen jedna). */
  next(): readonly string[];
}
export function createPraisePicker(options?: {
  readonly gender?: PraiseGender; // výchozí 'neutral'
  readonly rng?: Rng; // výchozí systemRng
}): PraisePicker;
```

**Příklad**

```ts
const item = { type: 'letter', letter: 'K', word: 'kočka', choices: ['K', 'A', 'M'] } as const;
orderSpeech(item);            // ['order.letter.k', 'letter.word.k.kocka']
repeatSpeech(item);           // ['order.letter.k']
correctionSpeech('K', 'A', false); // ['wrong.letter.a', 'seek.letter.k']
correctionSpeech('K', 'A', true);  // ['wrong.letter.a', 'hint.letter.k']
countSpeech(3);               // ['count.3']
enoughSpeech(3, 'strawberry');// ['count.enough.3.strawberry']

voice.say(orderSpeech(item));
// GET /mlsna-abeceda/audio/voice/cook/order.letter.k.mp3   → „Prosím perníček s písmenkem ká."
// GET /mlsna-abeceda/audio/voice/cook/letter.word.k.kocka.mp3 → „Ká jako kočka."
```

Změna ve `src/stage/scenes.ts`:

```ts
export interface SceneDeps {
  readonly stage: Stage;
  readonly audio: AudioEngine;
  readonly voice: VoicePlayer;
  readonly session: Session;
}
export interface SceneContext extends SceneDeps {
  go(name: SceneName): void;
}
export function createSceneManager(
  deps: SceneDeps,
  scenes: Readonly<Record<SceneName, Scene>>,
): SceneManager;
```

Rozšířené options položek (zbytek beze změny):

```ts
createCountItem({ root, bowl, audio, voice, praise });
createChoiceItem({ root, shelves, decoration, audio, voice, praise });
```

## Akceptační kritéria

- KDYŽ dítě klepne na úvodní obrazovku a kuchyně má počítací položku, PAK do ~0,5 s od přechodu
  zazní „Prosím tři jahody." a nic jiného přes ni nemluví.
- KDYŽ má objednávka písmenko, PAK zazní „Prosím perníček s písmenkem ká." a hned po ní
  „Ká jako kočka." – dvě celé věty za sebou, nikdy přes sebe.
- KDYŽ dítě klepne na misku, PAK se běžící hláška utne a po dosednutí kousku zazní „Jedna.",
  při dalších „Dva.", „Tři."
- KDYŽ dítě doplní požadovaný počet, PAK se miska přiklopí a přibližně 0,9 s po posledním
  dosednutí zazní pochvala; dvě po sobě jdoucí pochvaly nejsou stejné.
- KDYŽ dítě klepne na už přiklopenou misku, PAK zazní „Už máme tři jahody, to stačí!" celá
  a teprve po ní čekající pochvala (pochvala se odloží, nepřehraje se přes ni ani nezmizí).
- KDYŽ dítě klepne na špatný perníček poprvé, PAK zazní „To je bé." a po ní „Hledáme ká."
- KDYŽ dítě klepne na špatný perníček podruhé, PAK zazní „To je bé." a po ní „Ká je tady!",
  správný kus se rozsvítí a poskočí; věta „Hledáme ká." už nezazní.
- KDYŽ dítě 15 s nic neudělá, PAK zazní jen objednávková věta (u písmenka bez „Ká jako kočka.").
- KDYŽ dítě 40 s nic neudělá, PAK se u písmenka/číslice rozsvítí cíl a zazní „Ká je tady!";
  u počítání se rozsvítí kroužek na první jahodě a zopakuje se objednávka.
- KDYŽ dítě vybere správný kus, PAK po jeho dosednutí na dort zazní pochvala.
- KDYŽ přijde nová hláška během běžící, PAK běžící okamžitě zmlkne – nikdy nehrají dvě naráz.
- KDYŽ se odemčení audia nepovede (zamčený engine, chybějící Web Audio), PAK hra běží dál
  beze zvuku, nic nespadne a v konzoli není chyba (jen případné DEV varování).
- KDYŽ soubor klipu chybí (404) nebo se nepodaří dekódovat, PAK se přeskočí, další věta z fronty
  zazní a hra pokračuje.
- KDYŽ se volá `say()` s id, které není v manifestu, PAK se nepošle žádný požadavek.
- KDYŽ se scéna přepne nebo zničí, PAK hlas okamžitě zmlkne a nezůstane běžet žádný časovač.
- KDYŽ hra běží, PAK jediné požadavky jsou na vlastní origin (`audio/voice/<slug>/*.mp3`),
  každý klip nejvýš jednou za sezení (pravidlo 5).

## Testy

- **Unit `src/game/speech.test.ts`:**
  - `orderSpeech` / `repeatSpeech` pro všechny tři typy položky; u písmenka dvě id, u ostatních jedno.
  - `correctionSpeech` s `revealed` i bez; `hintSpeech`, `countSpeech`, `enoughSpeech`.
  - **Křížová kontrola s manifestem:** pro všech 22 základních písmen (včetně `letterWord`
    z rodinných rolí), číslice 1–10 a všechny tři druhy ovoce v rozsahu 1–5 platí `hasLine(id)`
    pro každé vrácené id – žádná hláška, kterou hra umí vyžádat, nesmí chybět.
  - `createPraisePicker` se seedovaným `rng`: 100 tahů nikdy nevrátí totéž dvakrát po sobě
    a projde všech 10 neutrálních pochval; s rodem `female`/`male` vrací jejich sady.
  - `orderPreload` obsahuje objednávku, počítání 1..N, „to stačí" i pochvaly a samá známá id.
- **Unit `src/audio/voice.test.ts`** (fake engine + fake `fetch`):
  - `say('count.3')` stáhne `/<base>/audio/voice/cook/count.3.mp3` a spustí jeden zdroj.
  - Dvě id: druhé se spustí teprve po `ended` prvního.
  - Nové `say()` během běžícího utne zdroj (`stop()` zavoláno) a starý řetěz už nepokračuje.
  - `stop()` vyprázdní frontu; `destroy()` zastaví zdroj a `speaking` je `false`.
  - Neznámé id → žádný `fetch`, žádná výjimka.
  - `fetch` selže / vrátí `ok: false` → id se přeskočí a další v pořadí se přehraje.
  - Zamčený engine (`context === null` i `state === 'suspended'`) → ticho, žádná výjimka.
  - `preload()` a následné `say()` téhož id → právě jeden `fetch`.
  - `setVolume(2)` a `setVolume(-1)` se ořežou do 0..1.
- Spuštění: `docker compose run --rm test` (a `check`, `build`).

## Ruční ověření

Dev server: `docker compose --profile dev up` → `http://localhost:5173/mlsna-abeceda/`,
Chrome DevTools, iPad landscape (1024×768) se zapnutým dotykem. Zvuk nahlas.

- [ ] Klepnout na úvodní obrazovku → cinknutí, přechod do kuchyně a do půl vteřiny zadání
      objednávky; v Network jen požadavky na `audio/voice/cook/*.mp3` z vlastního originu.
- [ ] Počítací objednávka: klepat na misku → „Jedna.", „Dva.", „Tři.", pak přiklopení a pochvala.
- [ ] Klepnout na přiklopenou misku → „Už máme tři jahody, to stačí!" doběhne celá, pochvala až po ní.
- [ ] Rychle poklepat pětkrát za sebou → hlas jde za dotykem (slyšet poslední číslo), nikdy dva naráz.
- [ ] `__kitchen.letter('K')` v konzoli → „Prosím perníček s písmenkem ká. Ká jako kočka."
- [ ] Klepnout na špatný perníček → „To je bé. Hledáme ká."; podruhé → „To je bé. Ká je tady!"
      a správný se rozsvítí.
- [ ] Klepnout na správný → přiletí na dort a zazní pochvala; třikrát po sobě jiná.
- [ ] Nechat 15 s ležet → zopakuje se jen objednávková věta; nechat 40 s → nápověda.
- [ ] `__voice.stop()` během věty → okamžité ticho, hra jede dál.
- [ ] Reload s kartou na pozadí (přepnout záložku uprostřed věty a zpět) → fronta se nezasekne.
- [ ] Simulovat chybějící klip: `__voice.say('count.7')` u dosud nestaženého klipu s vypnutou sítí
      (DevTools Offline) → ticho, žádná chyba v konzoli, hra dál reaguje.
- [ ] Totéž základní kolo (objednávka, počítání nahlas, pochvala) v rozměru mobilu na šířku
      844×390.

## DoD

- [x] Všechna akceptační kritéria splněna
- [x] Testy a build zelené
- [x] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [x] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

Schválení: autor spustil `/implement-step` na tenhle plán (25. 8. 2026), stav se překlopil
z `proposed` rovnou při implementaci.

**Nové soubory**

- `src/audio/voice.ts` (269 řádků) – přehrávač podle kontraktu: `say()` / `stop()` / `preload()` /
  `speaking` / `setVolume()` / `destroy()`, líný gain uzel pod `engine.master`, cache stažených
  bajtů i dekódovaných bufferů, generace (`token`) proti zastaralým řetězům, pojistka
  `buffer.duration + 250 ms` vedle události `ended`, `decodeAudioData` s kopií bajtů a callback
  variantou pro starší Safari.
- `src/audio/voice.test.ts` – 12 testů proti fake enginu a fake `fetch`.
- `src/game/speech.ts` – `orderSpeech`, `repeatSpeech`, `countSpeech`, `enoughSpeech`,
  `correctionSpeech`, `hintSpeech`, `orderPreload`, `createPraisePicker`.
- `src/game/speech.test.ts` – 15 testů včetně křížové kontroly všech id proti `hasLine()`.

**Změněné soubory** – `src/stage/scenes.ts` (`SceneDeps`, `SceneContext extends SceneDeps`,
`createSceneManager(deps, scenes)`), `src/main.ts` (přehrávač, předstažení objednávky, `__voice`),
`src/scenes/kitchen/index.ts` (jeden `createPraisePicker()` pro obě položky, `ctx.voice.stop()`
v `destroy()` i v dev `clear()`), `src/scenes/kitchen/count-item.ts` a `choice-item.ts` (všechna
místa, kde se mluví), komentáře v `src/audio/tones.ts`, `src/audio/chime.ts`, `src/audio/context.ts`,
`src/game/choice.ts`, `src/game/counting.ts`, `src/game/session.ts`, `src/game/curriculum.ts`,
`src/data/curriculum.ts`, `src/stage/orientation.ts`.

**Odchylky od plánu**

1. **Pochvala počká, až domluví běžící věta.** Plán počítal jen s přearmováním časovače na
   `PRAISE_DELAY_MS`. To nestačí: „Už máme tři jahody, to stačí!" trvá 2,4 s, takže pochvala
   naplánovaná na +900 ms by ji uťala – přesně to, co akceptační kritérium zakazuje. Přibyl proto
   dotaz na `voice.speaking`: dokud hlas mluví, pochvala se odloží o `PRAISE_RETRY_MS` = 250 ms,
   nejvýš 16× (pak zazní tak jako tak – o pochvalu dítě nikdy nepřijde). Kontrakt ani rozsah se
   nemění. Ověřeno v prohlížeči: pochvala začala 234 ms po dozvučení věty „to stačí".
2. **Odkládá se jen čekající pochvala.** `armPraise()` se z přebytečného klepnutí volá pouze když
   časovač ještě běží (`praiseTimer !== null`); klepnutí do přiklopené misky dlouho po pochvale
   tak nevyrobí pochvalu druhou.
3. **`orderPreload` u výběrových položek předstáhne i opravy a nápovědu** (`seek`, `hint` a `wrong`
   pro každý kus na polici). Kontrakt to popisuje jako „vše, co může být během téhle objednávky
   potřeba"; plán jmenoval jen počítací část. Objednávka tak stáhne 15–18 klipů (~250 kB).
4. **Úklid zastaralých odkazů je širší, než plán uváděl.** Kromě `tones.ts`, `chime.ts`,
   `choice.ts`, `counting.ts` a `session.ts` jsem opravil i posun čísel po přečíslování ze STEP-07:
   `main.ts` a `audio/context.ts` (STEP-16 → 17), `counting.ts` (STEP-20 → 21), `game/curriculum.ts`
   a `data/curriculum.ts` (STEP-24 → 25), `kitchen/index.ts` a `count-item.ts` („STEP-08 onwards"
   → STEP-09). `stage/orientation.ts` sliboval hlášku „Otoč mě!" ve STEP-07 – ta v manifestu není,
   komentář teď říká, že čeká na další generovací běh (nejdřív STEP-10).
5. Drobnost: obě položky si hlídač nečinnosti vyrábějí funkcí `watcher()` (callbacky teď dělají
   dvě věci), místo dvou inline `createIdleWatcher` volání.

**Ověření**

- `docker compose run --rm test` – 342 testů (18 souborů) zelených, z toho 27 nových.
- `docker compose run --rm check` (tsc + prettier) a `build` – bez chyb a varování.
- Prohlížeč (Chrome, dev server, iPad na šířku 1024×768, `scale 1`; časy z instrumentace
  `AudioBufferSourceNode.start/stop`, takže je vidět i to, co se utnulo):
  - start kuchyně → objednávka za **368 ms** (`SPEAK_DELAY_MS` = 350), nic jiného přes ni nemluví;
  - písmenko: „Prosím perníček s písmenkem ká." (3,16 s) a hned po ní „Ká jako kočka." – druhá
    věta začala 27 ms po dozvučení první, nikdy se nepřekrývají;
  - počítání: „Jedna." / „Dva." / „Tři." vždy ~450 ms po klepnutí (dosednutí), pochvala **909 ms**
    po posledním dosednutí, dvě pochvaly po sobě pokaždé jiné;
  - klepnutí do přiklopené misky: běžící „Tři." se utne, „Už máme tři jahody, to stačí!" (2,4 s)
    dojede celá a pochvala přijde 234 ms po ní;
  - pět rychlých klepnutí po 160 ms: hlas jde za dotykem (každá novější věta utne starší), nikdy
    nehrají dvě naráz, pochvala nakonec zazní;
  - chyba: „To je á." + „Hledáme ká."; druhá chyba: „To je em." + „Ká je tady!", správný perníček
    se rozsvítí (`is-revealed`) a naskočí kroužek; správný kus → pochvala 453 ms po klepnutí;
  - nečinnost: v **15,00 s** se zopakuje jen objednávková věta (u písmenka bez „Ká jako kočka."),
    ve **40,00 s** nápověda – u písmenka „Ká je tady!" + rozsvícení, u počítání kroužek na první
    jahodě a zopakovaná objednávka;
  - `__voice.stop()` utne větu okamžitě (0 ms), `__scenes.go('title')` ji utne 187 ms po přepnutí
    (po crossfade v `destroy()` scény) a nic dalšího už nezazní;
  - karta na pozadí: fronta se nezasekla (druhá věta i patnáctivteřinová připomínka doběhly);
  - simulovaný výpadek sítě (`fetch` reject) a 404: obě hlášky se přeskočily, další ve frontě
    zazněla, hra reagovala dál; v konzoli jen dvě DEV varování `[voice] missing clip`, žádná chyba;
  - síť za celé sezení: 25 požadavků na klipy, 25 různých (žádný dvakrát), nula cizích originů;
  - mobil na šířku (844×390, stage 1366×768, scale 0,51): objednávka, počítání nahlas i pochvala
    (907 ms po dosednutí) fungují stejně, dotyková plocha misky 320×140 logických px.
- **Neověřeno:** že klipy je opravdu slyšet – ověřoval jsem, že se správný buffer spustí na běžícím
  `AudioContext` ve správný čas, ne zvuk z reproduktoru; poslech je na autorovi. Neověřoval jsem
  ani chování při `prefers-reduced-motion` a při úplně zamčeném audiu (obojí pokrývají testy).

**Náměty mimo rozsah**

- Když dítě klepe rychleji, než trvá let ovoce, může větu „to stačí" utnout hláška počítání kusu,
  který byl ještě ve vzduchu. Je to důsledek pravidla „hlas jde za dítětem"; kdyby to vadilo, dá se
  ve STEP-09 „to stačí" potlačit, dokud něco letí.
- Nápověda u počítání zopakuje objednávku, protože hláška „klepni na misku" v manifestu není –
  přidat ji, až poběží generátor (STEP-10).
- `setVolume()` zatím nikdo nevolá (rodičovský koutek je STEP-17), stejně jako rod pochval.
- Overlay „otoč zařízení" pořád mlčí – potřebuje novou hlášku v manifestu.
