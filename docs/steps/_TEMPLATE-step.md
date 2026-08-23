# STEP-NN · <název kroku>

Status: proposed | approved | done
Milník: M? · Po: STEP-?? (nebo „—“) · Plán: [plan.md](../plan.md) · Návrh: [navrh-hry.md](../navrh-hry.md) kap. ?

## Shrnutí

3–6 vět: kontext, co krok dodá, co umožní dál.

## Rozsah

**V rozsahu**
- …

**Mimo rozsah**
- …

## Implementace

**Soubory**
```
src/…            (nový) …
src/…            (změna) …
```

**Knihovny** – název@verze (pinnuto), proč.

**Kroky**
1. …
2. …

**Klíčová rozhodnutí** – proč takhle a ne jinak; pseudokód netriviální logiky.

## Kontrakt

Přesné TS signatury / datové tvary / formáty souborů + příklad vstupu a výstupu.
Technické názvy anglicky.

```ts
export function example(input: Input): Output
```

Příklad: …

## Akceptační kritéria

- KDYŽ …, PAK ….
- KDYŽ … (chyba / okraj), PAK ….

## Testy

- Unit (Vitest): …
- Spuštění: `npm test`

## Ruční ověření

- [ ] Otevřít …, klepnout na …, musí být vidět/slyšet …
- [ ] Totéž v rozměru mobilu na šířku (např. 844×390).

## DoD

- [ ] Všechna akceptační kritéria splněna
- [ ] Testy a build zelené
- [ ] Ruční ověření projito (nebo výslovně uvedeno, co ne)
- [ ] Výsledek implementace vyplněn, `docs/plan.md` aktualizován

## Výsledek implementace

_(vyplní /implement-step)_
