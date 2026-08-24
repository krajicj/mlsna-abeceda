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
| STEP-04 | Kuchyně – statická scéna ze SVG (medvídek, pult, police, miska, perníčky, svíčky) + self-host fontu Fredoka | M1 | 02 | — |
| STEP-05 | Položka „počítání“: miska → výrobek, kolečka, přepočítání, nečinnost (zatím bez hlasu) | M1 | 03, 04 | — |
| STEP-06 | Položky „písmenko“ a „číslice“: výběr z police, chyba, nápověda | M1 | 05 | — |
| STEP-07 | Hlas: manifest hlášek, generátor z ElevenLabs, casting, fronta přehrávání | M1 | 02 | — |
| STEP-08 | Dokončení objednávky: bublina s objednávkou, zákazník jí, hvězdička, jedna celá smyčka | M1 | 06, 07 | — |
| STEP-09 | Zvoneček, tři zákazníci a jejich repliky | M2 | 08 | — |
| STEP-10 | Generátor: délka objednávky, stupně Č2/P2, adaptivní výběr, distraktory | M2 | 08 | — |
| STEP-11 | Konec sezení (limit 10), ukládání pokroku, obnova po reloadu | M2 | 09, 10 | — |
| STEP-12 | Obchůdek | M3 | 11 | — |
| STEP-13 | Album | M3 | 11 | — |
| STEP-14 | Překvapení | M3 | 11 | — |
| STEP-15 | Druhý výrobek: zmrzlinka | M3 | 12 | — |
| STEP-16 | Rodičovský koutek: zámek, nastavení dítěte a rodiny, limity, zvuk | M4 | 11 | — |
| STEP-17 | Hlasový balíček jmen (`personal.json`, index, oslovení) | M4 | 07, 16 | — |
| STEP-18 | Pokrok, export/import, mazání dat | M4 | 16 | — |
| STEP-19 | PWA ručně (service worker, manifest), offline, ikona na ploše | M4 | 02 | — |
| STEP-20 | „Kolik je“ a dva druhy ovoce (Č2–Č3) | M5 | 10 | — |
| STEP-21 | Sčítání (Č4) | M5 | 20 | — |
| STEP-22 | Výrobky: palačinky, koktejl | M5 | 15 | — |
| STEP-23 | Slovo se vzorem (P3) | M6 | 10 | — |
| STEP-24 | Slovo bez vzoru, diakritika ze jména, jméno jako milník (P4) | M6 | 23, 17 | — |
| STEP-25 | Lísteček (P5) | M6 | 24 | — |

## Poznámky

- STEP-07 (hlas) potřebuje účet ElevenLabs a klíč v `~/.config/mlsna-abeceda/elevenlabs.env`; do té doby
  se dá stavět s tichým placeholderem (STEP-05/06 nejsou na hlasu závislé).
- Kroky se stejným „Po“ (např. 12/13/14, 03/04) jdou dělat nezávisle na sobě.
- **Font Fredoka** (`public/fonts/`, OFL) se přesunul ze STEP-19 do STEP-04: zatím se
  vůbec nenačítá a nápisy běží na náhradním systémovém fontu, takže by výtvarnou podobu
  kuchyně nešlo posoudit. STEP-19 řeší jen PWA a offline.
