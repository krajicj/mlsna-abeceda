# STEP-07 · Hlas: manifest hlášek, generátor z ElevenLabs, casting

Status: done
Milník: M1 · Po: STEP-03 · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. 5.5, 5.6, 8

## Shrnutí

Hra je zatím němá: kuchyně umí počítání ([STEP-05](./STEP-05-counting-item.md)) i výběr z police
([STEP-06](./STEP-06-letter-and-digit-items.md)), ale všechny pokyny nahrazují pípavé tóny
z `src/audio/tones.ts`. Tenhle krok vyrobí **zvuk jako obsah**: manifest všech českých hlášek
pro M1 (`src/data/lines.cs.ts`, 246 klipů ≈ 4 600 znaků), skript, který je vygeneruje přes
ElevenLabs (`scripts/generate-voice.mjs`), a casting, ve kterém dcera vybere hlas vypravěče.
Generuje se **jednou a lokálně**, MP3 se commitují – v běžící hře ani v CI není žádný klíč
a žádný požadavek ven (pravidlo 5 a 9). Skript pozná podle otisku, co se změnilo, takže druhý
běh nestojí ani znak. Krok **nesahá na herní kód** – hra zůstane po něm pořád tichá; přehrávání
a napojení kuchyně dělá STEP-08 (plán zatím není).

## Rozsah

**V rozsahu**

- `src/data/lines.cs.ts` – manifest hlášek M1 (objednávky, počítání, pochvaly, opravy, nápovědy)
  a helpery, které z herních dat spočítají id hlášky.
- `scripts/generate-voice.mjs` – generátor: inkrementální podle otisků, `--dry-run`, `--force`,
  `--only`, `--limit`, hlášení osiřelých souborů.
- `--casting` – 5 vzorových vět několika kandidátními hlasy do gitignorované složky `casting/`
  včetně `index.html` s přehrávači; výsledek: `ELEVENLABS_VOICE_ID` v env souboru.
- `src/data/voices.ts` – tabulka vypravěčů (slug = složka, český název, id u ElevenLabs).
- `public/audio/voice/<slug>/*.mp3` + `index.json` – vygenerovaná a **commitnutá** audia.
- Služba `voice` v `compose.yaml` (jediná kromě `install`/`add`/`fonts`, která smí na internet).
- Testy manifestu (Vitest) a poznámky v `README.md` / `LICENSE-ASSETS.md`.

**Mimo rozsah**

- Přehrávání ve hře: `src/audio/voice.ts`, fronta, přerušení dotykem, napojení kuchyně,
  odstranění `tones.ts` → STEP-08.
- Zvukové efekty (ElevenLabs Sound Effects: zvoneček, „mňam“, cvak foťáku) → STEP-10 se zákazníky;
  generátor se ale navrhne tak, aby druhý manifest šel přidat bez přepisu.
- Klipy se jmény (`personal.json`, `--names`) → STEP-18. V repozitáři nesmí být žádné jméno.
- Nastavení rodu v rodičovském koutku (STEP-17) – manifest jen připraví tři sady pochval.
- Hlášky pro stupně Č2+/P2+ nad rámec číslic 1–10 a 22 základních písmen (diakritika = STEP-25).

## Implementace

**Soubory**

```
src/data/voices.ts               (nový)  tabulka vypravěčů (slug, český název, ElevenLabs id)
src/data/lines.cs.ts             (nový)  manifest hlášek + helpery na id
src/data/lines.cs.test.ts        (nový)  validace manifestu, křížová kontrola s kurikulem
scripts/generate-voice.mjs       (nový)  generátor (plain fetch, žádná knihovna)
compose.yaml                     (změna) služba `voice` s env_file a přístupem na internet
tsconfig.json                    (změna) allowImportingTsExtensions: true
.gitignore                       (změna) casting/
README.md                        (změna) příkaz `voice` + kredit ElevenLabs
LICENSE-ASSETS.md                (změna) attribution podle tarifu
public/audio/voice/<slug>/<id>.mp3  (nové, commit) 246 klipů na každý hlas
public/audio/voice/index.json    (nový, commit) otisky, oddíl na každý hlas
docs/navrh-hry.md                (hotovo při plánování) rod dítěte (kap. 3, 9), tři sady pochval
                                 a oprava jako dvě věty (kap. 8), ovoce v hlášce o přepočítání (kap. 5.5)
```

**Knihovny** – žádné. `node:crypto`, `node:fs`, `fetch` z Node 22 (v obrazu je v22.23.2);
ElevenLabs SDK se nepřidává (pravidlo minimálních závislostí, potřebujeme dva endpointy).

**Kroky**

1. `tsconfig.json`: `allowImportingTsExtensions: true` (jde s `noEmit`), aby manifest směl
   importovat `./curriculum.ts` **s příponou** – jen tak ho umí načíst i holý Node.
2. `src/data/lines.cs.ts`: tabulky tvarů (ovoce, číslovky, názvy číslic, hláskování písmen),
   z nich se odvodí `LINES`. Kromě `./curriculum.ts` **žádný import** – viz Klíčová rozhodnutí.
3. `src/data/lines.cs.test.ts`: formát id, unikátnost, tvar textů, pokrytí celého kurikula.
4. `scripts/generate-voice.mjs` ve stylu `scripts/fetch-fonts.mjs`: vlastní chybová třída,
   stažení do paměti, zápis přes dočasný soubor, žádná závislost.
5. `compose.yaml`: služba `voice`; `.gitignore`: `casting/`.
6. Casting: autor si ve webu ElevenLabs přidá 4–6 kandidátů do své knihovny → `--casting` →
   `casting/index.html` → poslech s dcerou → vybraný hlas jako řádek do `src/data/voices.ts`.
7. `--dry-run` (kolik znaků to bude stát) → ostrý běh → poslech vzorku → commit audia.
8. README a LICENSE-ASSETS: příkaz a attribution.

**Klíčová rozhodnutí**

- **Manifest je TypeScript, ale musí ho přečíst i Node.** Node 22.23 umí `.ts` stripovat sám,
  ale neumí bezpříponové importy (to je vlastnost bundleru). Proto `lines.cs.ts` importuje
  hodnoty **jen** z `./curriculum.ts` (s příponou) a všechno ostatní přes `import type`
  (typy se mažou, cesta se neřeší). Do obou souborů přijde komentář, že hodnotový import bez
  přípony generátor rozbije. Alternativa – tabulky v manifestu duplikovat – by znamenala, že
  kurikulum a hlášky můžou tiše utéct od sebe.
- **Texty se skládají z tabulek, ne ručně po jedné.** 246 vět psaných v ruce = 246 příležitostí
  k překlepu ve skloňování. Tabulka `{ one, few, many }` na každé ovoce a smyčka přes číslice
  dají „Prosím jednu jahodu / dvě jahody / pět jahod“ konzistentně.
- **Písmena se do textu píšou tak, jak se čtou** („Ká jako kočka.“, „To je bé.“). Samotné „K“
  je pro TTS hádanka (kilo? ká?), české názvy písmen jsou jednoznačné. Písmeno zůstává v id.
- **Číslice v textu nikdy nejsou číslicí** („Prosím svíčku s číslem tři.“). Test to hlídá
  regulárem – arabská číslice v textu je chyba manifestu.
- **Oprava = dvě samostatné věty** („To je bé.“ + „Hledáme ká.“). Kombinací je 22 × 22, celé věty
  by nešly. Není to lepení fragmentů (pravidlo 7): každý klip je celá věta, fronta je jen řekne
  po sobě. Zapsáno i v návrhu hry kap. 8.
- **Pochvaly ve třech sadách** (neutrální 10, ženská 6, mužská 6). Rod dítěte přibyl do návrhu
  (kap. 3 a 9), nastavení ho dostane v STEP-17; do té doby hra použije neutrální sadu.
- **Otisk hlídá i model, formát a nastavení hlasu**, ne jen text – ElevenLabs negarantuje
  bitově shodný výstup a jiný formát je jiný soubor. Když se jedna věta ze skupiny přegeneruje
  a „zní jinak“, `--force --only 'order.count.*'` přegeneruje celou skupinu.
- **Nic se nemaže automaticky.** Osiřelé soubory se jen vypíšou; smazání je autorovo rozhodnutí.
- **`speed` do nastavení hlasu nedáváme.** Podpora se liší podle modelu a odmítnutí API by nás
  stálo běh; pomalejší tempo se řeší výběrem hlasu při castingu. Kdyby se to později přidalo,
  změní se otisk všech hlášek → jeden vědomý `--force`.
- **Formát `mp3_44100_64`**: ~250 klipů × ~2 s ≈ 3–4 MB v repozitáři, na tabletu se to nepozná.
  Kdyby ho tarif odmítl, `--format mp3_22050_32` funguje všude (a je to vidět v indexu).

**Pseudokód generátoru**

```
config = { voiceId: env.ELEVENLABS_VOICE_ID, model: 'eleven_multilingual_v2',
           format: args.format ?? 'mp3_44100_64', settings: VOICE_SETTINGS }
index  = readIndex() // {} když soubor není
plan   = []
for (line of LINES.filter(matches(args.only))) {
  want = fingerprint(line, config)
  have = index.lines[line.id]
  if (args.force || !have || have.hash !== want || !exists(mp3(line.id))) plan.push({ line, want })
}
orphans = [...Object.keys(index.lines), ...mp3FilesOnDisk] not in LINES
report(plan, orphans, totalCharacters(plan))
if (args.dryRun) exit(0)
requireApiKey()
for (item of plan.slice(0, args.limit ?? Infinity)) {
  bytes = withRetry(3, () => tts(item.line.text, config))   // 429/5xx → 1 s, 4 s, 9 s
  writeAtomic(mp3(item.line.id), bytes)                     // <id>.mp3.part → rename
  index.lines[item.line.id] = { hash: item.want, text: item.line.text,
                                voice: config.voiceId, bytes: bytes.length }
  writeAtomic(indexPath, json(index))                       // po každém klipu → Ctrl+C nevadí
}
```

## Kontrakt

**Manifest** `src/data/lines.cs.ts`

```ts
import { BASE_LETTERS, FRUITS, LETTER_WORDS, ROLE_WORDS, type FruitKind, type Letter }
  from './curriculum.ts'; // POZOR: přípona je nutná, manifest čte i holý Node (viz STEP-07)

/** Kdo hlášku říká. STEP-10 přidá 'animal'. */
export type VoiceRole = 'narrator';

export interface Line {
  /** Stabilní id = i název souboru: public/audio/voice/<slug>/<id>.mp3. `^[a-z0-9]+([.-][a-z0-9]+)*$` */
  readonly id: string;
  /** Celá česká věta. Nikdy se neskládá z kusů za běhu (pravidlo 7). */
  readonly text: string;
  /** Výchozí 'narrator'. */
  readonly voice?: VoiceRole;
}

export const LINES: readonly Line[] = [...];
/**
 * 5 vět pro casting – negenerují se s LINES, jen v režimu --casting (návrh kap. 8):
 *   casting.1 „Prosím tři jahody a perníček s písmenkem ká!“   (objednávka)
 *   casting.2 „Výborně, přesně tak!“                            (pochvala)
 *   casting.3 „To je bé. Hledáme ká.“                           (oprava, dvě věty za sebou)
 *   casting.4 „Už máme tři jahody, to stačí!“                   (zastavení počítání)
 *   casting.5 „Kuchyně dneska zavírá, dobrou noc!“              (konec sezení, kap. 4)
 */
export const CASTING_LINES: readonly Line[] = [...];

export type PraiseGender = 'neutral' | 'female' | 'male';

export function orderCountLine(amount: number, fruit: FruitKind): string;   // 'order.count.3.strawberry'
export function orderDigitLine(value: number): string;                      // 'order.digit.3'
export function orderLetterLine(letter: Letter): string;                    // 'order.letter.k'
export function letterWordLine(letter: Letter, word: string): string;       // 'letter.word.k.kocka'
// Vět „X jako Y“ je 26 = 22 slov z LETTER_WORDS + ty položky ROLE_WORDS, jejichž slovo se od
// výchozího liší (brácha, ségra, babička, děda); maminka a táta už ve výchozí tabulce jsou.
// Sjednocení se dělá přes id, takže dvojice písmeno+slovo vznikne vždy jen jednou.
export function countAloudLine(step: number): string;                       // 'count.3'
export function countEnoughLine(amount: number, fruit: FruitKind): string;  // 'count.enough.3.strawberry'
/**
 * `target` je prvek dráhy přesně v tom tvaru, v jakém ho drží `ChoiceState.target` a `TrackState`:
 * písmeno velkým písmenem ('K'), číslice jako řetězec ('3', '10'). Větev vybírá `isLetter(target)`
 * z `./curriculum.ts`; co není základní písmeno, jde do větve `digit`. Když to není ani číslice
 * 1–10, `hasLine` to id nezná a hra prostě mlčí (pravidlo 2 – chyba nikdy nezastaví hru).
 */
export function wrongLine(target: string): string;  // 'K' → 'wrong.letter.k', '3' → 'wrong.digit.3'
export function seekLine(target: string): string;   // 'K' → 'seek.letter.k',  '10' → 'seek.digit.10'
export function hintLine(target: string): string;   // 'K' → 'hint.letter.k',  '3' → 'hint.digit.3'
export function praiseLines(gender: PraiseGender): readonly string[];       // ['praise.neutral.1', …]
export function hasLine(id: string): boolean;
```

Helpery vracejí id **vždy**, i pro vstup mimo rozsah (např. `orderDigitLine(42)` → `'order.digit.42'`);
existenci ověřuje `hasLine`. Volající tak nemusí nic chytat a chybějící klip je jen ticho, ne pád.

**Skupiny hlášek** (246 klipů, ≈ 4 600 znaků)

| Skupina | Id | Text | Ks |
|---|---|---|---|
| Objednávka počítání | `order.count.<1–10>.<strawberry\|blueberry\|cherry>` | „Prosím tři jahody.“ | 30 |
| Objednávka číslice | `order.digit.<1–10>` | „Prosím svíčku s číslem tři.“ | 10 |
| Objednávka písmenko | `order.letter.<a–z>` | „Prosím perníček s písmenkem ká.“ | 22 |
| Slovo k písmenku | `letter.word.<a–z>.<slug>` | „Ká jako kočka.“ | 26 |
| Počítání nahlas | `count.<1–10>` | „Tři.“ | 10 |
| Už toho stačí | `count.enough.<1–10>.<fruit>` | „Už máme tři jahody, to stačí!“ | 30 |
| Pochvaly | `praise.<neutral\|female\|male>.<n>` | „Výborně!“ / „Šikovná!“ / „Šikovný!“ | 22 |
| Špatný kus | `wrong.letter.<a–z>` / `wrong.digit.<1–10>` | „To je bé.“ / „To je pětka.“ | 32 |
| Co hledáme | `seek.letter.<a–z>` / `seek.digit.<1–10>` | „Hledáme ká.“ / „Hledáme trojku.“ | 32 |
| Nápověda | `hint.letter.<a–z>` / `hint.digit.<1–10>` | „Ká je tady!“ / „Trojka je tady!“ | 32 |

Tvary: ovoce `{ one: 'jednu jahodu', few: '<č> jahody', many: '<č> jahod' }` (borůvka: borůvku /
borůvky / borůvek; třešeň: třešeň / třešně / třešní), číslovky v akuzativu `jednu, dvě, tři,
čtyři, pět, šest, sedm, osm, devět, deset`, počítání nahlas generickou řadou `jedna, dva, tři…`
(návrh 5.6), názvy číslic `jednička…desítka` (akuzativ `jedničku…desítku`), hláskování písmen
`á, bé, cé, dé, é, ef, gé, há, í, jé, ká, el, em, en, ó, pé, er, es, té, ú, vé, zet`.
Názvy číslic: `jednička, dvojka, trojka, čtyřka, pětka, šestka, sedmička, osmička, devítka,
desítka`, v akuzativu `jedničku, dvojku, trojku, čtyřku, pětku, šestku, sedmičku, osmičku,
devítku, desítku`. `slug` = `word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()`
(`kočka` → `kocka`, `brácha` → `bracha`); tabulka `DIACRITICS` se na to nehodí – mapuje
jednotlivá písmena kurikula, ne celá slova.

**Tabulka hlasů** `src/data/voices.ts`

```ts
export interface VoiceOption {
  /** Název složky a id v uloženém postupu: `^[a-z][a-z0-9-]*$` */
  readonly slug: string;
  /** České jméno pro dítě (herní obsah, proto česky). */
  readonly label: string;
  /** Hlas u ElevenLabs. Není to tajemství – použít ho jde jen s autorovým placeným klíčem. */
  readonly elevenLabsId: string;
}
export const VOICES: readonly VoiceOption[]; // první je výchozí, dokud si dítě nevybere
export const DEFAULT_VOICE: string;
export function voiceBySlug(slug: string): VoiceOption | null;
export function clipPath(slug: string, lineId: string): string; // 'audio/voice/cook/count.3.mp3'
```

**Index** `public/audio/voice/index.json` (commituje se)

```json
{
  "version": 2,
  "model": "eleven_multilingual_v2",
  "format": "mp3_44100_64",
  "settings": {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0,
    "use_speaker_boost": true
  },
  "voices": {
    "cook": {
      "elevenLabsId": "…",
      "lines": {
        "count.3": { "hash": "9f2c41ab77e05d18", "text": "Tři.", "bytes": 7104 }
      }
    }
  }
}
```

`hash` = prvních 16 hex znaků ze `sha256(JSON.stringify({ text, voice, model, format, settings }))`
v tomhle pořadí klíčů, kde `voice` je `elevenLabsId` (ne slug – o zvuku rozhoduje hlas, ne složka).
Zápis `JSON.stringify(index, null, 2) + '\n'`, klíče `voices` i `lines` seřazené abecedně.

**CLI**

```
docker compose run --rm voice [--dry-run] [--force] [--voice <slug>[,<slug>]]
                              [--only <glob>[,<glob>]] [--limit <n>] [--format <fmt>]
docker compose run --rm voice --casting [--candidates <elevenlabs-id>[,<id>]]
docker compose run --rm voice --list-voices
```

- `--dry-run` – nic nestahuje a **nepotřebuje klíč**; vypíše, co by se generovalo, a celkový
  počet znaků.
- `--voice` – jen vyjmenovaní vypravěči z tabulky; bez něj všichni.
- `--only` – glob přes id, `*` = libovolný úsek (`order.count.*`, `*.letter.*`).
- `--limit` – pojistka pro první běh (vygeneruje jen prvních n).
- `--casting` – vzorky do `casting/`; s `--candidates` jen vyjmenované hlasy ElevenLabs, jinak
  všechny z `GET /v1/voices`. Casting pracuje se syrovými id, ne se slugy – kandidát v tabulce
  ještě není.
- `--list-voices` – vypíše, co klíč smí (id, kategorie, jméno); potřebuje oprávnění `voices_read`.
- Návratový kód 0 = hotovo (i s osiřelými soubory, jen se vypíšou), 1 = chyba.

Výstup ostrého běhu končí souhrnem:
`246 lines · 12 new · 3 changed · 231 up to date · 1 orphan · 480 characters`.

**API** (`https://api.elevenlabs.io`, hlavička `xi-api-key`)

- `POST /v1/text-to-speech/{voice_id}?output_format=<format>`,
  tělo `{ text, model_id, voice_settings }` → `audio/mpeg`.
- `GET /v1/voices` → `{ voices: [{ voice_id, name, labels }] }` (jen pro casting).

**Služba v compose.yaml**

```yaml
  voice: # internet (ElevenLabs); klíč přichází zvenčí repozitáře, viz CLAUDE.md pravidlo 9
    <<: *toolchain
    profiles: [cli]
    env_file:
      - path: elevenlabs.env # gitignorovaný symlink na ~/.config/mlsna-abeceda/elevenlabs.env
        # Bez souboru služba přesto naběhne, takže `--dry-run` jde pustit i tam, kde klíč není.
        # (Ostatních služeb se to netýká – ověřeno: chybějící env_file je chyba jen té služby,
        # která ho deklaruje; `docker compose config` i `run --rm check` projdou.)
        required: false
    entrypoint: ['node', '--disable-warning=ExperimentalWarning', 'scripts/generate-voice.mjs']
```

## Akceptační kritéria

- KDYŽ `docker compose run --rm voice --dry-run` na repu bez `public/audio/voice/`, PAK vypíše
  246 hlášek na každý hlas z tabulky a jejich celkový počet znaků a **neodešle jediný požadavek**
  (ověřitelné tím, že běh projde i bez `ELEVENLABS_API_KEY`).
- KDYŽ proběhne ostrý běh, PAK je v `public/audio/voice/<slug>/` 246 souborů `<id>.mp3`, každý
  > 1 kB, a `index.json` má v oddílu toho hlasu záznam s otiskem pro každou hlášku z `LINES`.
- KDYŽ se skript pustí podruhé beze změny, PAK ohlásí `0 new · 0 changed` a neodešle požadavek.
- KDYŽ se v manifestu změní text jedné hlášky, PAK se přegeneruje **právě jedna** a v indexu se
  změní jen její `hash`, `text` a `bytes`.
- KDYŽ se hláška z manifestu smaže, PAK ji skript nahlásí jako `orphan`, MP3 **nesmaže** a skončí
  s kódem 0.
- KDYŽ `--force --only 'order.count.*'`, PAK se přegeneruje právě 30 klipů na hlas a zbytek se
  nedotkne.
- KDYŽ se z `src/data/voices.ts` odstraní hlas, PAK se celá jeho složka nahlásí jako `orphan`
  a **nesmaže se**.
- KDYŽ API odpoví 401, PAK skript hned skončí s hláškou o neplatném klíči / chybějícím oprávnění
  Text to Speech a nezapíše žádný soubor.
- KDYŽ API odpoví 429 nebo 5xx, PAK se pokus třikrát zopakuje s prodlevou; když ani pak neuspěje,
  skript skončí s kódem 1 a všechny dosud stažené klipy i index zůstanou platné.
- KDYŽ se běh přeruší (Ctrl+C), PAK v repozitáři nezůstane žádný soubor `.part` a index popisuje
  přesně ty klipy, které na disku jsou.
- KDYŽ chybí `elevenlabs.env`, PAK `docker compose run --rm test|check|build` funguje dál
  a `run --rm voice` skončí srozumitelnou hláškou, který údaj chybí.
- KDYŽ `--casting`, PAK vznikne `casting/<elevenlabs-id>/1.mp3 … 5.mp3` pro každého kandidáta,
  `casting/index.html` je přehraje a `git status` složku vůbec nevidí.
- KDYŽ `docker compose run --rm check`, PAK je zelený i s vygenerovaným `index.json`
  (jinak se `public/audio/voice/index.json` přidá do `.prettierignore` – zapsat jako odchylku).
- KDYŽ `docker compose run --rm test`, PAK testy manifestu prokážou, že pro každé písmeno
  z `BASE_LETTERS`, každou číslici 1–10 a každé ovoce z `FRUITS` existují všechny jejich hlášky
  a že každé slovo z `LETTER_WORDS` i `ROLE_WORDS` má svou větu „X jako Y“.
- KDYŽ se pustí hra, PAK se nezměnilo **nic** – žádný soubor v `src/scenes/`, `src/audio/`
  ani `src/game/`, hra je pořád tichá.

## Testy

Unit (Vitest, `src/data/lines.cs.test.ts`):

- id jsou unikátní a odpovídají `^[a-z0-9]+([.-][a-z0-9]+)*$`; text je neprázdný, oříznutý,
  ≤ 140 znaků, končí `.`, `!` nebo `?`, neobsahuje newline, uvozovky **ani arabskou číslici**.
- Pokrytí: pro každé písmeno `order.letter`, `wrong.letter`, `seek.letter`, `hint.letter`
  a aspoň jedna `letter.word.<x>.*`; pro číslice 1–10 `order.digit`, `wrong.digit`, `seek.digit`,
  `hint.digit`, `count.<n>`; pro každé ovoce × 1–10 `order.count` a `count.enough`.
- Kurikulum: každé slovo z `LETTER_WORDS` a `ROLE_WORDS` má větu, jejíž text to slovo obsahuje
  a začíná hláskováním svého písmene („Ká jako kočka.“).
- Pochvaly: ≥ 8 neutrálních, ≥ 4 ženské, ≥ 4 mužské; `praiseLines()` vrací jen existující id.
- Helpery: `orderCountLine(3, 'strawberry') === 'order.count.3.strawberry'`,
  `letterWordLine('K', 'kočka') === 'letter.word.k.kocka'`, každý helper na platném vstupu
  vrací id, které `hasLine` zná.
- Obě větve `wrongLine`/`seekLine`/`hintLine` mají vlastní případ: `wrongLine('K')` →
  `'wrong.letter.k'`, `wrongLine('3')` → `'wrong.digit.3'`, `seekLine('10')` →
  `'seek.digit.10'`, a pro každé písmeno z `BASE_LETTERS` i každou číslici 1–10 platí
  `hasLine(hintLine(x))`. Naopak `hasLine(wrongLine('Ž'))` je `false` – neznámý prvek
  znamená ticho, ne pád.
- `CASTING_LINES` má 5 vět s id `casting.1`…`casting.5`.
- Tabulka hlasů: slugy jsou unikátní a odpovídají `^[a-z][a-z0-9-]*$`, každý má neprázdný
  `label` i `elevenLabsId`, `DEFAULT_VOICE` se dá najít, `clipPath` skládá cestu podle složky.
- Když `public/audio/voice/index.json` existuje (po vygenerování, tedy i v CI): každý hlas
  z tabulky má oddíl se správným `elevenLabsId`, každá hláška z `LINES` má v něm záznam i soubor
  na disku a index nemá záznam navíc. Bez indexu se tenhle blok přeskočí (`describe.skipIf`),
  aby šel krok stavět po částech.

Spuštění: `docker compose run --rm test`

## Ruční ověření

- [ ] `docker compose run --rm voice --dry-run` **bez** klíče v env souboru → vypíše 246 hlášek,
      celkový počet znaků a skončí bez chyby (ověřuje, že dry-run nikam nevolá).
- [ ] Na webu ElevenLabs přidat 4–6 kandidátních hlasů z Voice Library (filtr čeština /
      vyprávění pro děti) do své knihovny; klíč potřebuje jen Voices: Read a Text to Speech.
- [ ] `docker compose run --rm voice --casting --candidates <id>,…` → otevřít
      `casting/index.html` v prohlížeči, poslechnout s dcerou, vybrat hlas a přidat ho jako řádek
      do `src/data/voices.ts` (slug anglicky, `label` česky).
- [ ] `docker compose run --rm voice --dry-run` → zkontrolovat počet znaků proti zůstatku
      na účtu ElevenLabs; teprve pak `docker compose run --rm voice`.
- [ ] Poslechnout aspoň 12 klipů napříč skupinami; hlídat: „dvě jahody“ × „pět jahod“,
      „Ká jako kočka“ (ne „kilo“), „Trojka je tady!“, tempo a přátelský tón.
- [ ] Zopakovat `docker compose run --rm voice` → `0 new · 0 changed`.
- [ ] Změnit jednu větu v manifestu → běh přegeneruje právě ji; vrátit zpět a přegenerovat.
- [ ] `git status`: v gitu přibyla jen `public/audio/voice/<slug>/`, složka `casting/` v něm není,
      nikde žádný `.part`; `du -sh public/audio/voice` je v jednotkách MB.
- [ ] `docker compose run --rm test`, `check`, `build` zelené.
- [ ] Prohlížeč (tablet i mobil na šířku) – **není co ověřovat**, hra se v tomhle kroku nemění;
      uvést to takhle výslovně do výsledku implementace.

## DoD

- [ ] Všechna akceptační kritéria splněna
- [ ] Testy a build zelené
- [ ] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [ ] Vygenerovaná audia a `index.json` commitnuté
- [ ] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

**Vzniklo**

- `src/data/lines.cs.ts` – manifest, **246 hlášek, 4 254 znaků** (plán odhadoval ~4 600 nahoru).
  Texty se skládají z tabulek (`SPELLED`, `NUMERALS`, `CARDINALS`, `DIGIT_NAMES`,
  `DIGIT_NAMES_ACC`, `FRUIT_FORMS`, `PRAISE`), helpery podle kontraktu.
- `src/data/voices.ts` – tabulka vypravěčů; zatím jeden řádek: slug `cook`, česky „Kuchařka".
- `src/data/lines.cs.test.ts` – 17 testů (manifest, helpery, tabulka hlasů, soulad s audiem).
- `scripts/generate-voice.mjs` – generátor bez závislostí; `--dry-run`, `--force`, `--voice`,
  `--only`, `--limit`, `--format`, `--casting`, `--candidates`, `--list-voices`, `--help`.
- `public/audio/voice/cook/*.mp3` (246 klipů, **3,7 MB**) + `index.json` (18 kB).
- `compose.yaml` – služba `voice`; `tsconfig.json` – `allowImportingTsExtensions`;
  `.gitignore` – `casting/`; `README.md` – příkazy a kapitola „Voice";
  `src/node-builtins.d.ts` – minimální deklarace `node:fs` pro test.

**Změna zadání během implementace (autor)**

Po castingu autor požádal, aby **každý hlas měl svou složku**, aby šlo později přidat další
vypravěče a dítě si vybralo. To mění kontrakt, takže se přepsal: `public/audio/voice/<slug>/<id>.mp3`,
index verze 2 s oddílem na hlas, tabulka `src/data/voices.ts` (anglický slug = složka, český
`label` pro dítě, `elevenLabsId`), přepínač `--voice` na slugy a `--candidates` na syrová id
při castingu. `ELEVENLABS_VOICE_ID` tím zmizel – zdrojem pravdy je tabulka, env drží jen klíč.
Nová mechanika je zapsaná v `navrh-hry.md` kap. 3, 8 a 9; **samotný výběr hlasu dítětem je
mimo rozsah** tohohle kroku (chce portréty a ukázky, tedy vlastní krok).

**Odchylky od plánu** (kromě té změny zadání; žádná nemění rozsah)

1. **`src/node-builtins.d.ts` navíc.** Test indexu potřebuje `node:fs`, projekt nemá
   `@types/node` a kvůli třem funkcím ho přidávat odporuje pravidlu minimálních závislostí.
2. **Testy čtou soubory až ve svém těle.** `describe.skipIf` přeskočí běh, ne sběr.
3. **Souhrn běhu je po hlasech + celkem** a `characters` počítá to, co se po `--limit` opravdu
   vygeneruje – aby to číslo byla cena běhu, ne cena plánu.
4. **Test fixuje počet hlášek na 246**, aby přidání hlášky bylo vědomé rozhodnutí o ceně.
5. **Index hlídá i změnu hlavičky** (model, formát, nastavení hlasu), nejen otisky.
6. **`--list-voices` navíc** – přibyl při ladění tarifu, vypíše, co klíč smí.

**Ověřeno**

- `test` 315 zelených (17 v novém souboru, nic přeskočeného), `check` a `build` zelené;
  Prettier bere vygenerovaný `index.json` bez úprav.
- `--dry-run` bez klíče: 246 hlášek, 4 254 znaků, `nothing was sent and nothing was written`.
- Casting: 5 kandidátů × 5 vět (740 znaků) do `casting/`, `git status` složku nevidí.
- Ostrý běh: 246 klipů, 3,7 MB, žádný `.part`, nejmenší klip 5,7 kB.
- **Druhý běh: `0 new · 0 changed · 246 up to date`, 0 znaků, žádný požadavek.**
- **Změna jedné věty → `0 new · 1 changed · 245 up to date`, 20 znaků**; po vrácení textu zase 0.
- Osiřelé soubory: podstrčený cizí `.mp3` se nahlásil jako `orphan` a nesmazal (kód 0).
- Chybové cesty: neznámý přepínač → nápověda a kód 1; běh bez klíče → srozumitelná hláška;
  **HTTP 402 na Free tarifu** (hlasy z Voice Library) skončil dřív, než se zapsal jediný soubor.
- Hra se nezměnila: v `src/scenes/`, `src/audio/` ani `src/game/` není dotčený soubor,
  `vite build` má stejné moduly i stejnou velikost bundlu jako před krokem.

**Neověřeno**

- **Poslech klipů.** Kvalitu češtiny musí posoudit autor; hlídat „ká" (ne „kilo"), „perníček",
  „třešně", tempo. Oprava je levná: změnit větu v manifestu a pustit generátor – přegeneruje se
  právě ta jedna za pár znaků.
- Chybové cesty 429 a 5xx včetně tří opakování – nenastaly, jen přečtené.
- **Prohlížeč: není co ověřovat**, hra se v tomhle kroku nemění a zůstává tichá.

**Návrhy mimo rozsah**

- **Výběr hlasu dítětem** (portréty, ukázka na klepnutí, uložení do `save`) – vlastní krok,
  až budou v tabulce aspoň dva hlasy. Do té doby hra mluví `DEFAULT_VOICE`.
- Klíči chybí oprávnění `voices_read`, takže `--list-voices` zatím nefunguje; na generování
  to nevadí.
- STEP-08: `src/audio/voice.ts`, fronta, přerušení dotykem, napojení kuchyně a odstranění
  `src/audio/tones.ts`.
