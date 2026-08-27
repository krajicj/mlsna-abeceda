# Mlsná abeceda – plán kroků

Každý krok = jeden implementační plán v `docs/steps/STEP-NN-<slug>.md`, připravený přes
`/plan-step`, schválený autorem a postavený přes `/implement-step`. Milníky jsou
z [navrh-hry.md](navrh-hry.md) kap. 12. Kroky od M2 dál jsou **orientační** – upřesní se,
až bude M1 v ruce dcery; číslování za M1 se může měnit.

Status: `—` (bez plánu) · `proposed` · `approved` · `done`

## Pipeline

```
M0 kostra → M1 první objednávka → M2 smyčka  ──► hratelné minimum, test s dcerou
                                           └─► M3 odměny → M4 rodičovský koutek → M5 počítání → M6 čtení
```

## Kroky

| Krok | Název | Milník | Po | Stav |
|---|---|---|---|---|
| STEP-01 | [Projekt, izolovaný toolchain, repozitář a nasazení na Pages](steps/STEP-01-project-setup-and-deploy.md) | M0 | — | done |
| STEP-02 | [Responzivní scéna, přepínání scén, odemčení audia, orientace](steps/STEP-02-stage-scenes-and-audio-unlock.md) | M0 | 01 | done |
| STEP-03 | [Herní logika: kurikulum, dvě dráhy, generátor objednávek (Č1/P1), ukládání](steps/STEP-03-game-logic-and-save.md) | M1 | 01 | done |
| STEP-04 | [Kuchyně – statická scéna ze SVG (medvídek, pult, police, miska, perníčky, svíčky) + self-host fontu Fredoka](steps/STEP-04-kitchen-scene-and-font.md) | M1 | 02 | done |
| STEP-05 | [Položka „počítání“: miska → výrobek, kolečka, přepočítání, nečinnost (zatím bez hlasu)](steps/STEP-05-counting-item.md) | M1 | 03, 04 | done |
| STEP-06 | [Položky „písmenko“ a „číslice“: výběr z police, chyba, nápověda](steps/STEP-06-letter-and-digit-items.md) | M1 | 05 | done |
| STEP-07 | [Hlas: manifest hlášek, generátor z ElevenLabs, casting](steps/STEP-07-voice-manifest-and-generator.md) | M1 | 03 | done |
| STEP-08 | [Hlas ve hře: fronta přehrávání, napojení kuchyně (objednávka, počítání nahlas, pochvala, oprava, nápověda)](steps/STEP-08-voice-playback-and-kitchen.md) | M1 | 05, 06, 07 | done |
| STEP-09 | [Dokončení objednávky: bublina s objednávkou, zákazník jí, hvězdička, jedna celá smyčka](steps/STEP-09-order-completion-and-loop.md) | M1 | 06, 08 | done |
| STEP-10 | [Zvoneček, tři zákazníci a zvukové efekty](steps/STEP-10-bell-customers-and-sfx.md) | M2 | 09 | done |
| STEP-11 | [Adaptivní výběr, zavádění prvků a postup stupňů](steps/STEP-11-adaptive-selection-and-levels.md) | M2 | 09 | done |
| STEP-12 | Delší objednávka: dvě položky, souběžné plnění, jeden hlas a jeden hlídač nečinnosti | M2 | 11 | — |
| STEP-13 | Konec sezení (limit 10), obnova po reloadu, **slučitelný formát save** (migrace, `earned`/`purchases`) | M2 | 10, 11 | — |
| STEP-14 | Obchůdek | M3 | 13 | — |
| STEP-15 | Album | M3 | 13 | — |
| STEP-16 | Překvapení | M3 | 13 | — |
| STEP-17 | Druhý výrobek: zmrzlinka | M3 | 14 | — |
| STEP-18 | Rodičovský koutek: zámek, nastavení dítěte a rodiny (jméno, rod, členové), limity, zvuk | M4 | 13 | — |
| STEP-19 | Hlasový balíček jmen (`personal.json`, index, oslovení) | M4 | 07, 18 | — |
| STEP-20 | Pokrok, export/import, mazání dat | M4 | 18 | — |
| STEP-21 | PWA ručně (service worker, manifest), offline, ikona na ploše | M4 | 02 | — |
| STEP-22 | „Kolik je“ a dva druhy ovoce (Č2–Č3) | M5 | 11 | — |
| STEP-23 | Sčítání (Č4) | M5 | 22 | — |
| STEP-24 | Výrobky: palačinky, koktejl | M5 | 17 | — |
| STEP-25 | Slovo se vzorem (P3) | M6 | 11 | — |
| STEP-26 | Slovo bez vzoru, diakritika ze jména, jméno jako milník (P4) | M6 | 25, 19 | — |
| STEP-27 | Lísteček (P5) | M6 | 26 | — |

## Poznámky

- **STEP-11 se rozdělil na dva kroky (srpen 2026).** Původní řádek roadmapy sliboval
  „délku objednávky, stupně Č2/P2, adaptivní výběr a distraktory“ v jednom kroku. Při plánování
  se ukázalo, že jde o dvě různě rizikové práce: adaptivní výběr a postup stupňů je čistá logika
  v `src/game/`, kdežto **delší objednávka je zásah do scény** – `voice.say()` každou předchozí
  větu utne a obě položky si dnes objednávku říkají samy (`count-item.ts`, `choice-item.ts`),
  takže by se při dvou položkách přeřvaly; totéž platí pro hlídač nečinnosti. Hlas i nečinnost
  se proto musí vytáhnout do scény. STEP-11 dělá jen logiku, STEP-12 scénu; **zbytek roadmapy
  se posunul o jedno číslo** (starý STEP-12 je dnes STEP-13 atd.). Nové hlášky nebude potřeba
  generovat ani u jednoho z nich – manifest má číslice 1–10 i všech 22 písmen.
- **Číslování se od STEP-08 dál posunulo o jedno** (srpen 2026): hlas se rozdělil na STEP-07
  (manifest, generátor, casting – hra po něm zůstane tichá) a STEP-08 (fronta přehrávání
  a napojení kuchyně). Důvod: casting je lidská brána uprostřed – dokud dcera nevybere hlas,
  není co generovat, a dokud nejsou klipy, není co přehrávat.
- **Hlas:** vypravěč je „Kuchařka" (slug `cook`), vybraný castingem z pěti kandidátů.
  Vypravěčů může být víc – každý má složku `public/audio/voice/<slug>/` a řádek
  v `src/data/voices.ts`; **výběr hlasu dítětem je vlastní krok**, zatím nezařazený, dává smysl
  až budou hlasy aspoň dva. Sada M1 je 246 hlášek = 4 254 znaků na hlas (3,7 MB).
  **Free tarif nestačí** – hlasy z Voice Library přes API nepustí (HTTP 402); casting
  i generování potřebují Starter. Klíč zůstává v `~/.config/mlsna-abeceda/elevenlabs.env`
  (v repu na něj vede gitignorovaný symlink `elevenlabs.env`).
- **Placeholder tóny zůstávají.** Původně je měl STEP-08 smazat; autor rozhodl (srpen 2026),
  že syntetické tóny (`audio/tones.ts`) i úvodní cinknutí (`audio/chime.ts`) zůstanou jako
  okamžitá odezva na dotyk a hlas se k nim jen přidá. **STEP-10** je nahradil: `tones.ts` je
  smazaný, `chime.ts` zůstává natrvalo – zní v okamžiku odemčení audia, kdy ještě nemůže být nic
  dekódovaného.
- **Přečíslování se propsalo i do komentářů v kódu.** Při STEP-08 jsem srovnal odkazy, které po
  posunu o jedno ukazovaly na špatný krok (rodičovský koutek je 17, ne 16; „Kolik je" 21, ne 20;
  diakritika 25, ne 24). Hlášku „Otoč mě!" k overlay orientace vygeneroval **STEP-09** ve stejném
  běhu jako hlášky k dokončení objednávky; overlay ji říká při přechodu do portrétu.
- Kroky se stejným „Po“ (např. 13/14/15, 03/04) jdou dělat nezávisle na sobě.
- **STEP-09** dostane navíc krátkou „dopékací“ pointu při dokončení objednávky (patro nebo
  poleva na výrobku, cinknutí trouby, konfety) – domluveno s autorem jako levná náhrada za
  mechaniku pečení, viz `navrh-hry.md` kap. 13 bod 2.
- **Po STEP-09 naskočí další objednávka sama** (rozhodnutí autora, srpen 2026): bez zvonečku by
  se smyčka nezavřela. STEP-10 mezi hvězdičku a další objednávku **vložil zvoneček** – kuchyně
  teď startuje prázdná a bez zazvonění se nic nestane, takže tempo řídí dítě. STEP-09 taky **jen zapisuje** skóre zvládnutí; zavádění nových
  prvků (`maybeIntroduce`) a postup na další stupeň dodělal **STEP-11**.
- **Manifest má po STEP-09 celkem 252 hlášek** (246 z M1 + 3× „hotovo“, 2× hvězdička, „Otoč mě!“).
  Sada M1 je tím kompletní; STEP-10 přidal 2 pobídky ke zvonečku (**254**), další přijdou
  až se STEP-13 (konec sezení).
- **Borůvka a třešeň** se kreslí už ve STEP-05 (miska i ovoce na dortu podle druhu z objednávky),
  protože generátor ze STEP-03 vybírá ze všech tří startovních druhů; STEP-14 (obchůdek) pak řeší
  jen odemykání *dalšího* ovoce.
- **Svíčka a perníček na dortu.** STEP-06 staví svíčku doprostřed horní plochy dortu
  a perníček opře zepředu. Při plánování STEP-11 se ukázalo, že u **dvoupoložkové** objednávky
  (STEP-12) kolize nehrozí: pravidlo z návrhu 5.3 („při 2+ položkách vždy aspoň jedna z každé
  dráhy“) nikdy nespojí počítání se svíčkou, a perníček stojí o kus níž než ovoce. Posunout
  jedno z toho bude potřeba až u **tří** položek, tedy se stupni Č3/P3 (STEP-22, STEP-25).
- **Rod dítěte** (holčička / kluk / neutrální) přibyl do nastavení kvůli tvarům pochval
  (`navrh-hry.md` kap. 3 a 9). STEP-07 vygeneruje všechny tři sady, přepínač je v STEP-18;
  do té doby hra chválí neutrálně.
- **Ukládání postupu (srpen 2026):** `localStorage` sám nestačí – dcera hraje na víc zařízeních
  a WebKit maže script-writable úložiště po sedmi dnech používání Safari bez interakce se
  stránkou (web apka na ploše má vlastní počítadlo a té se to netýká). Návrh dostal kap. 9.1:
  save musí jít **slučovat**, ne jen přepisovat, a hvězdičky se neukládají jako zůstatek, ale jako
  `earned` + `purchases`. Formát je potřeba mít hotový **před obchůdkem** (STEP-14); čím se postup
  přenáší (ruční soubor × vlastní endpoint s rodinným kódem) je otevřená otázka, viz kap. 13.
- **Co se ukázalo při STEP-11 (srpen 2026).** Dvě věci mimo rozsah kroku, ať se na ně nezapomene:
  1. **Prvky se můžou zavést rychleji, než je hra stihne ukázat.** Při `READY_RATIO = 0,8` má
     šestiprvková sada s pěti zvládnutými poměr 0,83, takže se hned zavede sedmý prvek a čekající
     šestý se přepíše. Návrh tím porušený není („jeden nový, když ≥ 80 %“), ale záruka „hned
     v další objednávce“ platí jen pro poslední zavedený prvek. Až bude sad víc (od P2, Č2),
     stojí za to se podívat, jestli to dceři nepřijde zahlcující.
  2. **Živá změna velikosti okna rozhodí popisky.** Když se okno zvětší, zatímco kuchyně stojí,
     písmena na perníčcích a číslice na svíčkách zůstanou v původním měřítku vedle vyrostlé
     grafiky; po reloadu je to v pořádku. Je to starší chování `resize()` ve scéně (týká se
     i svíček, kterých se STEP-11 nedotkl), na tabletu na to dítě nenarazí — ale u PWA
     (STEP-21) nebo rodičovského koutku by to chtělo srovnat.

- **Formát save patří do STEP-13 (srpen 2026).** Při plánování STEP-11 se prošlo, co v uloženém
  záznamu doopravdy je. Dobrá zpráva: **skóre zvládnutí tam je od začátku** (`tracks`: `level`,
  `active`, `scores`) a pravidla pro jeho sloučení jsou v kap. 9.1 rozhodnutá – vyšší skóre
  vyhrává, vyšší stupeň, sjednocení aktivní sady. Chybí ale dvě věci a obě jsou práce pro
  **STEP-13**, tedy dřív, než přijde obchůdek:
  1. **Migrace neexistuje.** `parseSave()` dělá `if (record.version !== SAVE_VERSION) return null`
     – záznam s jinou verzí **zahodí a založí novou hru**. `CLAUDE.md` přitom žádá „změna formátu
     = migrace s bumpem verze“. Dokud migrace není, je zvýšení `SAVE_VERSION` rovno smazání
     pokroku; proto STEP-11 formát vědomě nemění a čerstvě zavedený prvek drží jen v paměti.
  2. **Hvězdičky jsou pořád zůstatek** (`progress.stars: number`), a zůstatek se sloučit nedá
     (sečíst = vyrobit hvězdičky z ničeho, vzít vyšší = sebrat, co si dcera koupila).
     Kap. 9.1 chce `earned` + `purchases` a zůstatek dopočítat.

  Čím se postup mezi zařízeními přenáší, se rozhodovat nemusí – **formát na tom rozhodnutí
  nezávisí**, slučitelný musí být tak jako tak. `StorageLike` je injektované rozhraní, takže
  server jde na místo `localStorage` vyměnit bez zásahu do herní logiky.
- **Zákazníci mluvit nebudou (srpen 2026).** Roadmapa u STEP-10 slibovala „repliky zákazníků“;
  autor rozhodl, že zvířátka **jen vydávají zvuky** (mručení, pípnutí, mňouknutí). Odpadá tím
  druhý hlas, role v generátoru i další casting – `VoiceRole` zůstává `'narrator'` a „repliky“
  jsou položky zvukového manifestu. Mluví jedině vypravěč, takže je pořád poznat, kdo je kdo.
  STEP-10 taky zůstává **vcelku** (tři fáze: zvukový kanál → zákazníci → zvoneček), i když je
  na tři kroky práce – rozhodnutí autora.
- **Zvuk je hotový (STEP-10).** Placeholder tóny zmizely: `audio/tones.ts` je smazaný a hra hraje
  14 MP3 efektů z `public/audio/sfx/` (−22 LUFS, 4 dB pod vypravěčem). Řada počítadla je **jeden
  klip** přehrávaný přes `playbackRate` na půltónech `[0, 2, 4, 7, 9]` – text-to-sound-effects
  neumí zadat výšku tónu. `audio/chime.ts` zůstává natrvalo. Nový efekt = řádek v `src/data/sfx.ts`
  a `docker compose run --rm sfx`.
- **Font Fredoka** (`public/fonts/`, OFL) se přesunul ze STEP-21 do STEP-04: zatím se
  vůbec nenačítá a nápisy běží na náhradním systémovém fontu, takže by výtvarnou podobu
  kuchyně nešlo posoudit. STEP-21 řeší jen PWA a offline.
