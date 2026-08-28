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
| STEP-12 | [Delší objednávka: dvě položky, souběžné plnění, jeden hlas a jeden hlídač nečinnosti](steps/STEP-12-two-item-order.md) | M2 | 11 | done |
| STEP-13 | [Slučitelný formát save (v2): migrace, `earned`/`purchases`, slučování](steps/STEP-13-mergeable-save-format.md) | M2 | 11 | done |
| STEP-14 | [Konec sezení: zavírací mříž, minutka a rodičovský zámek](steps/STEP-14-session-end-and-closing.md) | M2 | 13 | done |
| STEP-15 | Obchůdek | M3 | 13 | — |
| STEP-16 | Album | M3 | 13 | — |
| STEP-17 | Překvapení | M3 | 13 | — |
| STEP-18 | Druhý výrobek: zmrzlinka | M3 | 15 | — |
| STEP-19 | Rodičovský koutek: zámek, nastavení dítěte a rodiny (jméno, rod, členové), limity, zvuk | M4 | 13, 14 | — |
| STEP-20 | Hlasový balíček jmen (`personal.json`, index, oslovení) | M4 | 07, 19 | — |
| STEP-21 | Pokrok, export/import, mazání dat | M4 | 13, 19 | — |
| STEP-22 | PWA ručně (service worker, manifest), offline, ikona na ploše | M4 | 02 | — |
| STEP-23 | „Kolik je“ a dva druhy ovoce (Č2–Č3) | M5 | 11 | — |
| STEP-24 | Sčítání (Č4) | M5 | 23 | — |
| STEP-25 | Výrobky: palačinky, koktejl | M5 | 18 | — |
| STEP-26 | Slovo se vzorem (P3) | M6 | 11 | — |
| STEP-27 | Slovo bez vzoru, diakritika ze jména, jméno jako milník (P4) | M6 | 26, 20 | — |
| STEP-28 | Lísteček (P5) | M6 | 27 | — |

## Poznámky

- **STEP-11 se rozdělil na dva kroky (srpen 2026).** Původní řádek roadmapy sliboval
  „délku objednávky, stupně Č2/P2, adaptivní výběr a distraktory“ v jednom kroku. Při plánování
  se ukázalo, že jde o dvě různě rizikové práce: adaptivní výběr a postup stupňů je čistá logika
  v `src/game/`, kdežto **delší objednávka je zásah do scény** – `voice.say()` každou předchozí
  větu utne a obě položky si dnes objednávku říkají samy (`count-item.ts`, `choice-item.ts`),
  takže by se při dvou položkách přeřvaly; totéž platí pro hlídač nečinnosti. Hlas i nečinnost
  se proto musí vytáhnout do scény. STEP-11 dělá jen logiku, STEP-12 scénu; **zbytek roadmapy
  se posunul o jedno číslo** (starý STEP-12 je dnes STEP-13 atd.). Při plánování se ještě
  předpokládalo, že ani jeden z nich nebude potřebovat nové hlášky; u STEP-12 to autor
  změnil – viz poznámka níž.
- **STEP-13 se rozdělil na dva kroky (srpen 2026).** Řádek roadmapy sliboval konec sezení, obnovu
  po reloadu i slučitelný formát save v jednom kroku. Jsou to ale dvě různé práce: **formát je
  čistá logika** v `src/game/` (migrace, `earned`/`purchases`, slučování, spousta testů, ve hře
  není vidět nic), kdežto **konec sezení je scéna** – zhasnutá kuchyně, mávající zvířátka, nové
  hlášky, tedy i běh generátoru hlasu. STEP-13 dělá formát, **STEP-14 konec sezení**; formát jde
  první, aby si sezení mohlo uložit svůj stav bez dalšího bumpu verze. **Zbytek roadmapy se posunul
  o jedno číslo** (starý STEP-14 „Obchůdek“ je dnes STEP-15 atd.); odkazy `STEP-NN` v komentářích
  kódu srovnala implementace STEP-13 (20 míst v 11 souborech, seznam v jeho plánu). **Hotové plány
  v `docs/steps/` se nepřečíslovávají** – jsou zápisem o tom, co platilo tehdy.
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
- Kroky se stejným „Po“ (např. 15/16/17, 03/04) jdou dělat nezávisle na sobě.
- **STEP-09** dostane navíc krátkou „dopékací“ pointu při dokončení objednávky (patro nebo
  poleva na výrobku, cinknutí trouby, konfety) – domluveno s autorem jako levná náhrada za
  mechaniku pečení, viz `navrh-hry.md` kap. 13 bod 2.
- **Po STEP-09 naskočí další objednávka sama** (rozhodnutí autora, srpen 2026): bez zvonečku by
  se smyčka nezavřela. STEP-10 mezi hvězdičku a další objednávku **vložil zvoneček** – kuchyně
  teď startuje prázdná a bez zazvonění se nic nestane, takže tempo řídí dítě. STEP-09 taky **jen zapisuje** skóre zvládnutí; zavádění nových
  prvků (`maybeIntroduce`) a postup na další stupeň dodělal **STEP-11**.
- **Manifest má po STEP-09 celkem 252 hlášek** (246 z M1 + 3× „hotovo“, 2× hvězdička, „Otoč mě!“).
  Sada M1 je tím kompletní; STEP-10 přidal 2 pobídky ke zvonečku (**254**) a STEP-12 přidal
  62 vět pro druhou položku objednávky (**316**); STEP-14 přidal 5 vět zavřené kuchyně (**321**)
  a jeden zvukový efekt (`shutter`, 14 → **15**).
- **Borůvka a třešeň** se kreslí už ve STEP-05 (miska i ovoce na dortu podle druhu z objednávky),
  protože generátor ze STEP-03 vybírá ze všech tří startovních druhů; STEP-15 (obchůdek) pak řeší
  jen odemykání *dalšího* ovoce.
- **Svíčka a perníček na dortu.** STEP-06 staví svíčku doprostřed horní plochy dortu
  a perníček opře zepředu. Při plánování STEP-11 se ukázalo, že u **dvoupoložkové** objednávky
  (STEP-12) kolize nehrozí: pravidlo z návrhu 5.3 („při 2+ položkách vždy aspoň jedna z každé
  dráhy“) nikdy nespojí počítání se svíčkou, a perníček stojí o kus níž než ovoce. Posunout
  jedno z toho bude potřeba až u **tří** položek, tedy se stupni Č3/P3 (STEP-23, STEP-26).
- **Rod dítěte** (holčička / kluk / neutrální) přibyl do nastavení kvůli tvarům pochval
  (`navrh-hry.md` kap. 3 a 9). STEP-07 vygeneruje všechny tři sady, přepínač je v STEP-19;
  do té doby hra chválí neutrálně.
- **Ukládání postupu (srpen 2026):** `localStorage` sám nestačí – dcera hraje na víc zařízeních
  a WebKit maže script-writable úložiště po sedmi dnech používání Safari bez interakce se
  stránkou (web apka na ploše má vlastní počítadlo a té se to netýká). Návrh dostal kap. 9.1:
  save musí jít **slučovat**, ne jen přepisovat, a hvězdičky se neukládají jako zůstatek, ale jako
  `earned` + `purchases`. Formát je potřeba mít hotový **před obchůdkem** (STEP-15); čím se postup
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
     (STEP-22) nebo rodičovského koutku by to chtělo srovnat.

- **Formát save patří do STEP-13 (srpen 2026, hotovo).** Při plánování STEP-11 se prošlo, co v uloženém
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

  Obojí řeší plán [STEP-13](steps/STEP-13-mergeable-save-format.md). Autor u něj rozhodl (srpen
  2026), že **`earned` bude jedno číslo**, ne mapa per zařízení, jak nadhazovala poznámka v kap.
  9.1: přenos půjde nejspíš přes server, kde se stav slučuje průběžně, a podhodnocení součtu
  (10 + 8 → 10 mezi dvěma sloučeními) je přijatelná cena za jednodušší formát. `purchases` navíc
  nese i **zaplacenou cenu**, takže zůstatek jde dopočítat bez ceníku, který vznikne až
  s obchůdkem. Slučovací funkce se píše rovnou v STEP-13, i když ji zavolá až import v rodičovském
  koutku – jinak by „slučitelný formát“ zůstal slib bez důkazu. **Implementováno:** záznam je na
  verzi 2, `parseSave()` migruje místo aby zahazoval, a text, kterému hra nerozumí, se odkládá do
  `kk.save.backup` – i cizí nebo novější formát tak jde zachránit ručně.
- **Zákazníci mluvit nebudou (srpen 2026).** Roadmapa u STEP-10 slibovala „repliky zákazníků“;
  autor rozhodl, že zvířátka **jen vydávají zvuky** (mručení, pípnutí, mňouknutí). Odpadá tím
  druhý hlas, role v generátoru i další casting – `VoiceRole` zůstává `'narrator'` a „repliky“
  jsou položky zvukového manifestu. Mluví jedině vypravěč, takže je pořád poznat, kdo je kdo.
  STEP-10 taky zůstává **vcelku** (tři fáze: zvukový kanál → zákazníci → zvoneček), i když je
  na tři kroky práce – rozhodnutí autora.
- **Druhá položka objednávky dostane vlastní věty (srpen 2026).** Při plánování STEP-12 se
  nabízelo nechat obě položky znít jako dvě samostatné prosby („Prosím tři jahody. Prosím perníček
  s písmenkem ká.“) a nic negenerovat. Autor rozhodl jinak: druhá pozice má vlastní sadu **62 celých
  vět** („A ještě…“) – 30 počítacích, 10 číslicových, 22 písmenkových – aby objednávka zněla jako
  jedna prosba. Manifest tím roste na **316 hlášek** a STEP-12 si vyžádá běh
  `docker compose run --rm voice` (generátor je přírůstkový, vyrobí jen nové). Když položka zazní
  sama, použije se vždycky tvar s „Prosím“, takže osamocené „A ještě…“ nikdy nezazní. Věty pro
  **třetí** pozici se zatím nedělají – přijdou se stupni Č3/P3 (STEP-23, STEP-26).
- **Police mají po STEP-12 vlastní modul každá.** Při implementaci se ukázalo, že dvoupoložková
  objednávka bývá **číslice + písmeno** (obě jsou „výběr z police“, jen každá z jiné dráhy), takže
  jeden `choice-item` na scénu nestačil – uměl vždycky jen jednu polici. `createChoiceItem` proto
  dostává jednu polici a jeden druh (`kind: 'digit' | 'letter'`) a kuchyně staví **dvě instance**;
  každá kreslí jen tu svou, takže si nabídky nepřepisují. Podrobnosti a důvod: výsledek
  implementace v [STEP-12](steps/STEP-12-two-item-order.md).

- **Zvuk je hotový (STEP-10).** Placeholder tóny zmizely: `audio/tones.ts` je smazaný a hra hraje
  14 MP3 efektů z `public/audio/sfx/` (−22 LUFS, 4 dB pod vypravěčem). Řada počítadla je **jeden
  klip** přehrávaný přes `playbackRate` na půltónech `[0, 2, 4, 7, 9]` – text-to-sound-effects
  neumí zadat výšku tónu. `audio/chime.ts` zůstává natrvalo. Nový efekt = řádek v `src/data/sfx.ts`
  a `docker compose run --rm sfx`.
- **Konec sezení vypadá jinak, než sliboval návrh (STEP-14, srpen 2026).** Při plánování se
  rozhodly čtyři věci. **Cedule „Zavřeno" odpadá** – text v herním UI zakazuje pravidlo 1; místo ní
  sjede ze shora **mříž** (kuchyně za ní zůstane vidět) a na ní visí **kuchyňská minutka**
  s ubývající výsečí, která odpočítává hodinu do otevření (autor ji po STEP-14 zkrátil ze dvou
  hodin na jednu; je to jedna konstanta `CLOSED_MS`, a platí zároveň pro pauzu, po které začíná
  nové sezení). **Zvířátka nemávají** (rozhodnutí
  autora): zákazník odejde jako po každé objednávce a teprve pak se zavírá. Zavřenou kuchyni jde
  otevřít **dočasným kódem `1234`** na ikoně zámku vpravo dole – náhražka rodičovského koutku, aby
  zavřená kuchyně nebyla na celou tu dobu slepá ulička; STEP-19 ji nahradí držením hvězdiček
  a příkladem 4 × 3. A **stav sezení se ukládá** (kolik objednávek, kdy byla poslední, do kdy
  zavřeno), takže ho reload neobejde; „obnova sezení po reloadu“ z roadmapy znamená právě tohle,
  ne obnovu rozehrané objednávky – tou se nic neztrácí, protože save se zapisuje až s dokončenou
  objednávkou.
- **Sezení je páté pole save, a `SAVE_VERSION` zůstává na 2 (STEP-14).** Pole `session` je čistě
  přírůstkové: chybí-li, opraví se na výchozí, a starší build ho ignoruje. Bump na 3 by naopak
  znamenal, že build s `SAVE_VERSION = 2` (nacachovaná stránka) potká `version: 3`, `migrateRecord()`
  vrátí null a dcera začne novou hru – přesně to, před čím pravidlo 4 chrání. Pravidlo „změna
  formátu = migrace s bumpem“ míří na změny, které **přeznačují existující data** (jako v1 → v2
  u hvězdiček). Sezení se navíc **neslučuje**: je to vlastnost zařízení, ne postupu, takže při
  importu zůstává to lokální (stejně jako `settings`).
- **Font Fredoka** (`public/fonts/`, OFL) se přesunul ze STEP-22 do STEP-04: zatím se
  vůbec nenačítá a nápisy běží na náhradním systémovém fontu, takže by výtvarnou podobu
  kuchyně nešlo posoudit. STEP-22 řeší jen PWA a offline.
