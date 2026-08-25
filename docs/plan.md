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
| STEP-09 | Dokončení objednávky: bublina s objednávkou, zákazník jí, hvězdička, jedna celá smyčka | M1 | 06, 08 | — |
| STEP-10 | Zvoneček, tři zákazníci a jejich repliky (+ efekty z ElevenLabs Sound Effects) | M2 | 09 | — |
| STEP-11 | Generátor: délka objednávky, stupně Č2/P2, adaptivní výběr, distraktory | M2 | 09 | — |
| STEP-12 | Konec sezení (limit 10), ukládání pokroku, obnova po reloadu | M2 | 10, 11 | — |
| STEP-13 | Obchůdek | M3 | 12 | — |
| STEP-14 | Album | M3 | 12 | — |
| STEP-15 | Překvapení | M3 | 12 | — |
| STEP-16 | Druhý výrobek: zmrzlinka | M3 | 13 | — |
| STEP-17 | Rodičovský koutek: zámek, nastavení dítěte a rodiny (jméno, rod, členové), limity, zvuk | M4 | 12 | — |
| STEP-18 | Hlasový balíček jmen (`personal.json`, index, oslovení) | M4 | 07, 17 | — |
| STEP-19 | Pokrok, export/import, mazání dat | M4 | 17 | — |
| STEP-20 | PWA ručně (service worker, manifest), offline, ikona na ploše | M4 | 02 | — |
| STEP-21 | „Kolik je“ a dva druhy ovoce (Č2–Č3) | M5 | 11 | — |
| STEP-22 | Sčítání (Č4) | M5 | 21 | — |
| STEP-23 | Výrobky: palačinky, koktejl | M5 | 16 | — |
| STEP-24 | Slovo se vzorem (P3) | M6 | 11 | — |
| STEP-25 | Slovo bez vzoru, diakritika ze jména, jméno jako milník (P4) | M6 | 24, 18 | — |
| STEP-26 | Lísteček (P5) | M6 | 25 | — |

## Poznámky

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
  okamžitá odezva na dotyk a hlas se k nim jen přidá. Nahradí je MP3 efekty ve **STEP-10**.
- **Přečíslování se propsalo i do komentářů v kódu.** Při STEP-08 jsem srovnal odkazy, které po
  posunu o jedno ukazovaly na špatný krok (rodičovský koutek je 17, ne 16; „Kolik je" 21, ne 20;
  diakritika 25, ne 24). Hláška „Otoč mě!" k overlay orientace v manifestu není – čeká na další
  generovací běh (nejdřív STEP-10).
- Kroky se stejným „Po“ (např. 13/14/15, 03/04) jdou dělat nezávisle na sobě.
- **STEP-09** dostane navíc krátkou „dopékací“ pointu při dokončení objednávky (patro nebo
  poleva na výrobku, cinknutí trouby, konfety) – domluveno s autorem jako levná náhrada za
  mechaniku pečení, viz `navrh-hry.md` kap. 13 bod 2.
- **Borůvka a třešeň** se kreslí už ve STEP-05 (miska i ovoce na dortu podle druhu z objednávky),
  protože generátor ze STEP-03 vybírá ze všech tří startovních druhů; STEP-13 (obchůdek) pak řeší
  jen odemykání *dalšího* ovoce.
- **STEP-06** staví svíčku doprostřed horní plochy dortu a perníček opře zepředu; s jednou
  položkou na objednávku se nepotká s kolečky počítadla. Až budou objednávky delší
  (**STEP-11**), bude potřeba jedno z toho posunout.
- **Rod dítěte** (holčička / kluk / neutrální) přibyl do nastavení kvůli tvarům pochval
  (`navrh-hry.md` kap. 3 a 9). STEP-07 vygeneruje všechny tři sady, přepínač je v STEP-17;
  do té doby hra chválí neutrálně.
- **Font Fredoka** (`public/fonts/`, OFL) se přesunul ze STEP-20 do STEP-04: zatím se
  vůbec nenačítá a nápisy běží na náhradním systémovém fontu, takže by výtvarnou podobu
  kuchyně nešlo posoudit. STEP-20 řeší jen PWA a offline.
