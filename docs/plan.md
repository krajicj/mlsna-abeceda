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
| STEP-15 | [Obchůdek: katalog, nákup a odemykání (logika)](steps/STEP-15-shop-catalogue-and-unlocks.md) | M3 | 13 | done |
| STEP-16 | [Obchůdek: scéna, košík a věci do kuchyně](steps/STEP-16-shop-scene-and-decorations.md) | M3 | 15 | done |
| STEP-17 | [Druhý výrobek: zmrzlinka (výrobek jako proměnná)](steps/STEP-17-icecream-second-product.md) | M3 | 15, 16 | done |
| STEP-18 | [Třetí výrobek: palačinky](steps/STEP-18-pancakes-third-product.md) | M3 | 17 | done |
| STEP-19 | Čtvrtý výrobek: koktejl (mixuje se až na konci) | M3 | 17 | — |
| STEP-20 | [Slabikář a mluvící police](steps/STEP-20-primer-and-talking-shelves.md) | M3 | 11, 16 | done |
| STEP-21 | PWA ručně (service worker, manifest), offline, ikona na ploše | M3 | 02 | — |
| STEP-22 | Překvapení | M3 | 13 | — |
| STEP-23 | Rodičovský koutek: zámek, nastavení dítěte a rodiny (jméno, rod, členové), limity, zvuk | M4 | 13, 14 | — |
| STEP-24 | Hlasový balíček jmen (`personal.json`, index, oslovení) | M4 | 07, 23 | — |
| STEP-25 | Pokrok, export/import, mazání dat | M4 | 13, 23 | — |
| STEP-26 | „Kolik je“ a dva druhy ovoce (Č2–Č3) | M5 | 11 | — |
| STEP-27 | Sčítání (Č4) | M5 | 26 | — |
| STEP-28 | Slovo se vzorem (P3) | M6 | 11 | — |
| STEP-29 | Slovo bez vzoru, diakritika ze jména, jméno jako milník (P4) | M6 | 28, 24 | — |
| STEP-30 | Lísteček (P5) | M6 | 29 | — |
| STEP-31 | Album (vědomě až úplně nakonec, viz poznámka) | M3 | 13 | — |

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
- Kroky se stejným „Po“ (např. 18/19, 03/04) jdou dělat nezávisle na sobě.
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
  jedno z toho bude potřeba až u **tří** položek, tedy se stupni Č3/P3 (STEP-26, STEP-28).
- **Rod dítěte** (holčička / kluk / neutrální) přibyl do nastavení kvůli tvarům pochval
  (`navrh-hry.md` kap. 3 a 9). STEP-07 vygeneruje všechny tři sady, přepínač je v STEP-23;
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
     (STEP-21) nebo rodičovského koutku by to chtělo srovnat.

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
  **třetí** pozici se zatím nedělají – přijdou se stupni Č3/P3 (STEP-26, STEP-28).
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
  zavřená kuchyně nebyla na celou tu dobu slepá ulička; STEP-22 ji nahradí držením hvězdiček
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
- **Obchůdek se rozdělil na dva kroky (srpen 2026).** Řádek roadmapy sliboval obchůdek v jednom
  kroku; autor rozhodl jinak. **STEP-15 je logika a data** – katalog zboží, nákup nad `earned`
  a `purchases` ze STEP-13, brány, kterými se koupené věci propíšou do hry (odemčené ovoce do
  generátoru, odemčená zvířátka do fronty zákazníků), a obsah, který kuchyně už umí nakreslit sama:
  **malina** jako čtvrté ovoce a **žabka** jako čtvrtý zákazník. Ve hře po něm není vidět nic
  nového, koupit se dá jedině z konzole. **STEP-16 je scéna** – regál s cenami v prázdných
  hvězdičkách, otázka a velké ✓ / ✗, zachrastění při nedostatku, **nákupní košík vedle počítadla
  hvězdiček** (rozhodnutí autora) a výzdoba kuchyně (kytka, záclony, kočička na polici, rádio)
  včetně jejích kreseb a míst. Sortiment prvního kola je podle návrhu kap. 7 všechno tři: ovoce,
  zákazník i výzdoba. **Za zavřenou mříží se nenakupuje** (rozhodnutí autora) – zavřeno je zavřeno.
  **Zbytek roadmapy se posunul o jedno číslo** (staré STEP-16 „Album“ je dnes STEP-31, viz přeskládání M3 níž);
  odkazy `STEP-NN` v komentářích kódu srovná implementace STEP-15 (22 míst ve 12 souborech, seznam
  v jeho plánu). Hotové plány v `docs/steps/` se nepřečíslovávají.
- **Co se u STEP-16 změnilo při implementaci (srpen 2026).** Autor zrušil nábytek na zeď (okno,
  záclony, kytka) — na jevišti 1024 × 768 pro něj není volná stěna a mrtvá dekorace nic nepřidá.
  Katalog má nově **čtyři řádky** (maliny, žabka, kočička, rádio), regál si nechává **šest míst**
  a zaplní se, jak budou věci přibývat. Věci do kuchyně jsou **klepatelné**: kočička leží vpravo
  dole na podlaze a mňouká, rádio je vestavěné do linky místo posledních dvířek a hraje pár tónů
  (návrh 7.3a). Hlášky pro kytku a záclony jsou smazané i s klipy, věta o kočičce přegenerovaná
  (už není „na polici“), přibyl efekt `decor.radio.tune`.
- **Co se u STEP-16 rozhodlo při plánování (srpen 2026).** Čtyři věci, které mění, co bylo v řádku
  roadmapy výš:
  1. **Košík nebude vedle počítadla, ale v něm.** Nad policí na číslice je pruh 84 px a terč chce
     podle pravidla 3 aspoň 88; police posunout níž nejde (konzolky spodní končí 8 px nad miskou).
     Autor rozhodl, že **tlačítkem je celá pilulka s hvězdičkami** a košík je ikona uvnitř ní —
     kuchyně se tím nehne o pixel. Terč je 160×84, tedy **vědomá odchylka od pravidla 3** (42
     fyzických px na mobilu místo 44); alternativu „pilulka 88 vysoká, police o 16 px níž“ autor
     odmítl. Odchylka je zapsaná i v plánu kroku a musí zaznít ve výsledku implementace.
  2. **Kuchyně dostane okno natrvalo** (rozhodnutí autora), i než si dcera cokoli koupí. Záclony
     se pak věší do něj a kytka stojí na parapetu; varianta „volán přes celou zeď bez okna“
     odpadla. Kočička musí stát na poličce, protože nahraná věta zní „kočičku **na polici**“, a na
     police s perníčky a svíčkami nesmí (při čtyřech nabídkách jsou plné na milimetr) — dostane
     proto vlastní malou poličku pod oknem, na které stojí i rádio.
  3. **Koupená věc zůstane v regálu s fajfkou** místo ceny a klepnutí zopakuje „…je tvoje!“.
     **Cena se kreslí plnými a prázdnými hvězdičkami** podle zůstatku (cena 5, zůstatek 3 →
     ★★★☆☆), takže „kolik chybí“ jde spočítat očima — návrh kap. 7 („prázdné hvězdičky – zase
     počítání“).
  4. **Krok jde na dvě zastavení** (A obchůdek a košík, B výzdoba), každé zvlášť ověřené
     a commitnuté. Nové hlášky ani zvuky nepotřebuje — vygeneroval je STEP-15, takže se
     **generátor vůbec nepouští**.
- **Font Fredoka** (`public/fonts/`, OFL) se přesunul ze STEP-21 do STEP-04: zatím se
  vůbec nenačítá a nápisy běží na náhradním systémovém fontu, takže by výtvarnou podobu
  kuchyně nešlo posoudit. STEP-21 řeší jen PWA a offline.

- **M3 se přeskládalo: výrobky dopředu, album dozadu (31. 8. 2026, rozhodnutí autora).** Po STEP-16
  měla přijít odměnová část M3 v pořadí album → překvapení → zmrzlinka. Autor to obrátil: dcera hraje
  pořád tentýž dort, takže **pestrost výrobků jde první** a album až úplně nakonec (dnes STEP-31).
  Důvody pro album: je to jediná odměna, která dítěti nedá nic nového na práci, a hlavně by si sáhla
  na save — fotky objednávek ve `slučitelném` formátu ze STEP-13 jsou samostatný problém a nemá cenu
  ho řešit dřív, než se rozhodne přenos postupu mezi zařízeními (kap. 13). Nové pořadí:

  | bylo | je | krok |
  |---|---|---|
  | 19 | **17** | zmrzlinka |
  | 26 (půlka) | **18** | palačinky |
  | 26 (půlka) | **19** | koktejl |
  | 23 | **20** | PWA |
  | 18 | **21** | překvapení |
  | 20 | **22** | rodičovský koutek |
  | 21 | **23** | hlasový balíček jmen |
  | 22 | **24** | pokrok, export/import |
  | 24 | **25** | „kolik je“ |
  | 25 | **26** | sčítání |
  | 27–29 | **27–29** | beze změny |
  | 17 | **30** | album |

  Odkazy `STEP-NN` v komentářích kódu jsou srovnané rovnou (13 míst v 13 souborech + 3 v návrhu);
  hotové plány v `docs/steps/` se nepřečíslovávají, jsou zápisem o tom, co platilo tehdy. Milník
  u alba zůstává M3, i když jde jako poslední — je to pořád odměna, ne nová látka.
  **Pravý sloupec téhle tabulky platil do 2. 9. 2026**, kdy se mezi výrobky a PWA vešel slabikář
  (STEP-20) a všechno od PWA dál se posunulo ještě o jedno – viz poznámka o slabikáři níž.
- **Výrobky jsou tři kroky, ne jeden (31. 8. 2026).** Nabízelo se slepit zmrzlinku, palačinky
  a koktejl do jednoho kroku „další výrobky“, protože mechanika je u všech stejná. Nejde to kvůli
  **hlasu**: věty nesou nosič („Prosím **perníček** s písmenkem ká“ × „**oplatku**“ × „**brčko**“),
  takže každý výrobek si žádá vlastní sadu — 22 písmen a 10 číslic × obě pozice objednávky.
  Odhad z manifestu: zmrzlinka ~94 hlášek, palačinky ~94, koktejl ~64, dohromady ~250 na dnešních
  321. Jedním krokem by se manifest skoro zdvojnásobil a ověřit u dcery by se to dalo až všechno
  najednou. Generátor je přírůstkový, takže tři běhy nestojí nic navíc.
  Tři rozhodnutí autora k tomu:
  1. **Kopečky nemají příchuť.** Návrh sliboval „tři kopečky jahodové“, což je 10 × 4 × 3 = 120 vět
     jen na počítání zmrzliny. Zůstane „tři kopečky“ a příchuť je vidět na obrázku — 90 vět dolů
     a dcera nepřijde o nic, příchuť není učivo. Palačinky se počítají stejně („tři palačinky“),
     koktejl počítá ovoce do mixéru, takže **použije stávající počítací sadu** beze změny.
  2. **Koktejl se mixuje až na konci.** Kap. 13 bod 2 zamítla pečení právě proto, že spočítané kusy
     zmizí v těstě a nedají se přepočítat — na čemž stojí Č1 i pozdější „kolik je“. Mixér má tentýž
     problém, takže ovoce zůstane vidět ve sklenici po celou objednávku a rozmixuje se **až jako
     dopékací pointa** po jejím dokončení. Proto jde koktejl jako poslední z trojice.
  3. **Zmrzlinka jde první, protože v ní vznikne pojem výrobku.** Scéna má dnes dort natvrdo
     (`art/cake.ts`, police s perníčky a svíčkami). STEP-17 z toho udělá proměnnou: co se počítá,
     kam se lepí písmenko a kam číslice. Palačinky a koktejl jsou pak skoro jen kresba a hlášky.
- **PWA se posunula z M4 do M3, hned za výrobky (31. 8. 2026).** Původně poslední věc rodičovského
  milníku. Důvod k posunu: WebKit maže script-writable úložiště po sedmi dnech Safari bez interakce
  se stránkou, kdežto **web apka na ploše má vlastní počítadlo a té se to netýká** (kap. 9.1). Od
  STEP-15 jsou hvězdičky měna a dcera za ně nakupuje, takže „ikona na ploše“ přestala být pohodlí
  a stala se pojistkou na pravidlo 4. Na iPadu navíc odpadne i celoobrazovkový režim, který dnes
  řeší `requestFullscreen` v úvodní scéně. **Od 2. 9. 2026 je PWA STEP-21**, protože před ni vklouzl
  slabikář.

- **Co se rozhodlo při plánování STEP-17 (31. 8. 2026).** Čtyři věci nad rámec řádku roadmapy:
  1. **Výrobek losuje generátor** z koupených a nepadne dvakrát po sobě týž – stejný vzor jako
     `avoidFruit` u ovoce. Losuje se **až po položkách a jen když je z čeho vybírat**, takže save
     s jediným výrobkem netáhne z `rng` navíc a všechny seedované testy zůstávají v platnosti.
  2. **Kupuje se „zmrzlinka" za 5 ★, ne „zmrzlinový stroj" za 8 ★**, jak psal návrh kap. 7. Obrázek
     je zmrzlina, protože stroj na zmrzlinu čtyřleté dítě nikdy nevidělo a obrázek by neřekl nic
     (pravidlo 1); cena zůstává na pěti, protože „Chybí ti N hvězdiček" existuje přesně pětkrát.
  3. **Stará id hlášek se nepřejmenovávají.** Dort si nechává holá id (`order.letter.k`), jejichž
     klipy jsou vygenerované a commitnuté; nové výrobky dostávají příponu (`order.letter.k.icecream`).
     Počítání se liší podle **jednotky**, ne podle výrobku: dort i koktejl počítají ovoce a sdílejí
     jednu sadu, zmrzlina má `.scoop`. (Obojí od té doby padlo: zmrzlina se nakonec vůbec nepočítá
     a palačinky si v STEP-18 **žádnou počítací sadu nepřidaly** – nosí ovoce jako dort.)
  4. **Kopečky jsou mužského rodu.** `NUMERALS` v manifestu je jediná řada, protože všechna čtyři
     ovoce jsou ženská; „kopeček" ne, takže dvojka potřebuje vlastní tvar („**dva** kopečky").
     Našla to nezávislá revize plánu — bez ní by chyba prošla až do zaplaceného klipu, protože
     kontrola id ji neukáže. Sada tvarů proto nese i rod, ať si to palačinky nemusí odvozovat znovu.

  Manifest má dnes **366 hlášek** (poznámka výš o 321 je z STEP-14 a STEP-15 ji nedopsal); STEP-17
  ho zvedl na **463** – o jednu víc, než plán počítal, viz „Výsledek implementace", odchylka 2.

- **STEP-17 hotový (31. 8. 2026).** 928 testů zelených, 67 klipů navíc (`index.json` jen přibývá,
  nic staršího se nepřepsalo). **Zmrzlinka se nepočítá** – přijíždí hotová a přidává se na ni jen
  oplatka nebo vlaječka; rozhodnutí autora poté, co uviděl, že dcera klepne na misku jahod a vyletí
  z ní kopeček. Návrh kap. 4 je přepsaný, generátor dává počítací objednávky vždycky dortu.
  Poslechová kontrola „dva kopečky" tím odpadla – ty věty už neexistují.
- **Co se rozhodlo při plánování STEP-18 (2. 9. 2026).** Palačinky jsou po STEP-17 skoro jen data:
  řádek v `PRODUCTS`, `PRODUCT_GEOMETRY`, `PRODUCT_TEXTS`, `FINISH` a `SHOP_ITEMS`, k tomu jedna
  kresba. Tři věci nad rámec řádku roadmapy:
  1. **Písmenko nese čokoládová placička, ne šlehačka** (rozhodnutí autora). Návrh kap. 4 sliboval
     „písmenko ze šlehačky“, jenže bublina ukazuje nosič **prázdný** (návrh 5.4) a prázdné písmenko
     ze šlehačky není nic; doslovná varianta by navíc potřebovala vlastní šablonu věty jen pro
     palačinky. Riziko je záměna s perníčkem, a nese ho tahle volba vědomě: placička se odliší
     tmavou čokoládovou barvou a vlnitým okrajem, a hlídá to test i ruční porovnání.
  2. **Číslici nese cedulka** na dvou nožičkách, ne praporek na tyčce – jinak by splývala
     s vlaječkou od zmrzliny.
  3. **Krok nepřidá počítací sadu.** Počítá se ovoce, ať se staví cokoli, takže palačinky sdílejí
     `order.count.*` s dortem. Manifest jde ze 433 na **500** (64 objednávkových vět + 2 obchodní
     + „Palačinky jsou hotové!“).

  **Regál v obchůdku je po tomhle kroku plný.** `shopLayout()` má šest buněk a katalog bude mít šest
  řádků; sedmá položka by se **nenakreslila a nešla koupit** (`drawShelf()` ji při `undefined` buňce
  přeskočí, nic nespadne). Rozšíření regálu je práce pro **STEP-19** (rozhodnutí autora); STEP-18
  proto přidá test `SHOP_ITEMS.length <= shopLayout(1024).goods.length`, aby na tu hranici STEP-19
  narazil v testech a ne až na obrazovce.

- **STEP-18 hotový (2. 9. 2026).** 976 testů zelených (bylo 928), 67 klipů navíc, manifest je na
  **500 hláškách**; `index.json` jen přibyl (402 řádků, 0 ubylo). Palačinky jsou **první výrobek,
  který ověřil abstrakci ze STEP-17**: generátor, scéna, bublina, police, počítání ani finále se
  nesáhly. Dvě věci z plánu nesedly a implementace je opravila:
  1. **„Se třemi výrobky se z rng táhne stejně jako se dvěma“ neplatí** (rozhodnutí 6). U počítací
     objednávky měl `pickProduct()` dřív jediného kandidáta a netáhl vůbec; teď má dva a jedno
     `pick` udělá. Nevadí to (výrobek se losuje poslední, sejv jen s dortem se přehraje beze změny),
     ale test tvrdí pravdu, ne plán.
  2. **Test „cedulka nezasahuje do řady koleček“ nešel napsat**, protože neplatí ani u dortu:
     svíčka i cedulka jsou vyšší než `PILL_OFFSET_Y`. Nevadí to, protože objednávka má z číselné
     dráhy **buď** počítání, **nebo** číslici – kolečka a cedulka se nikdy nepotkají.

  Návrh kap. 4 se opravil na dvou místech: řádek palačinek (čokoládová placička) a věta
  „objednávka na počítání je vždycky dort“, která od tohohle kroku neplatí. **Neověřený zůstal
  poslech** tří nových hlášek. Regál obchůdku je plný 6/6 a nový test na to STEP-19 upozorní.

- **Slabikář je nápad dcery, a roadmapa se kvůli němu posunula (2. 9. 2026).** Požadavek zněl:
  tlačítko v rohu, deska s písmeny a čísly, klepnutí řekne „T jako táta“ – a to samé na policích
  v kuchyni, když u pultu nikdo není. Autor ho zařadil jako **STEP-20**, tedy hned za výrobky, takže
  **zbytek roadmapy se posunul o jedno číslo** (PWA 20 → 21, překvapení 21 → 22, rodičovský koutek
  22 → 23, …, album 30 → **31**). Odkazy `STEP-NN` v komentářích kódu srovná implementace toho
  kroku, který půjde první; v `docs/plan.md` a v návrhu jsou srovnané hned. Hotové plány
  v `docs/steps/` se nepřečíslovávají – jsou zápisem o tom, co platilo tehdy, a **historická tabulka
  přeskládání M3 z 31. 8. proto taky zůstává, jak byla** (její pravý sloupec platil do 2. 9.).

  Čtyři věci, které se u kroku rozhodly:
  1. **Nula nových hlášek.** „Ká jako kočka.“ (`letter.word.k.kocka`) i „To je pětka.“
     (`wrong.digit.5`) jsou v manifestu od STEP-07 a klipy jsou zaplacené. Generátor se nepouští
     vůbec. (Id se v plánu musela opravit: `letterWordLine()` zahazuje diakritiku ve slově
     a `wrongLine()` nese v id druh prvku – našla to nezávislá revize.)
  2. **Deska ukazuje všechno**, i to, co hra ještě nezavedla – nezavedené dlaždice jsou bledé, ale
     plně klepatelné (rozhodnutí autora). Tři odstíny podle skóre zvládnutí jsou zároveň to jediné
     místo, kde dcera **vidí svůj postup**.
  3. **Slabikář je dostupný i za zavřenou mříží** (rozhodnutí autora). Cena je známá: konec sezení
     tím přestává být úplná stopka. Argument pro: slabikář nemá odměnu, nepřičítá hvězdičky
     a nehne s postupem – je to knížka, a knížka se nezavírá s kuchyní.
  4. **Klepnutí nikdy nezapisuje do skóre** a mluvící police se zapínají jen s prázdným pultem –
     ne podle toho, že je police hluchá. `clear()` se totiž volá i na polici, kterou běžící
     objednávka nepoužívá, a mluvící police během objednávky by byla nápověda zadarmo.

- **Klíč `elevenlabs.env` je v kořeni repozitáře jako obyčejný soubor, ne symlink.** Gitignorem
  krytý, ale uvnitř bind mountu, takže na něj vidí i kontejnery bez internetu (`dev`, `test`,
  `build`, `check`) – pravidlo 9 v CLAUDE.md počítá s tím, že klíč leží mimo repozitář. Přesunout do
  `~/.config/mlsna-abeceda/` a nechat symlink.
