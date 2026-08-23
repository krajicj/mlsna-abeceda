---
name: implement-step
description: Implement one approved step of the Mlsná abeceda game according to its plan in docs/steps/ (code → tests → build → manual browser check → write-up → update docs/plan.md). Use on "/implement-step STEP-NN". Requires a plan with Status: approved.
metadata:
  argument-hint: "STEP-NN"
---

# /implement-step — build an approved step

Argument = the step number. Work **exactly** by `docs/steps/STEP-NN-*.md`; the plan is the
contract. The plan is in Czech; code, comments and commits are in English (`CLAUDE.md`).

## 0 · Checks

1. The plan must have `Status: approved`. If it is `proposed` → stop and say it awaits
   approval. If `done` → stop, do not overwrite anything.
2. Read the whole plan, `CLAUDE.md` and the steps this one depends on (they must be `done`).
3. Verify the baseline: `npm test` and `npm run build` pass before any change (if the project
   exists). If not, report it before changing anything.

## 1 · Implementation

- Stay within Rozsah. Do not do what is "mimo rozsah" — even when tempting; record it as a
  suggestion in the write-up.
- A deviation from the plan (different file, signature, library) is fine only when it changes
  neither Kontrakt nor Rozsah; record every deviation with its reason. A deviation that changes
  Kontrakt or Rozsah → **ask** before continuing.
- Logic in `src/game/` without DOM, with tests. Voice lines only via the manifest
  `src/data/lines.cs.ts`.
- No real names, keys or personal data in the repository.

## 2 · Verification

1. `npm test` — all tests, including the new ones from the plan, green.
2. `npm run build` — no errors or warnings.
3. Walk through the plan's **Ruční ověření** item by item in the browser (Chrome tools if
   available; tablet landscape **and** phone landscape sizes). Whatever cannot be verified,
   state explicitly as unverified — never pretend.

## 3 · Write-up and closing

- Fill in **Výsledek implementace** in the plan (in Czech): what was created (files),
  deviations with reasons, how it was verified (including what was not), suggestions out of
  scope. Set `Status: done`.
- Switch the step's status in `docs/plan.md` to `done`. If the implementation revealed an
  error in `docs/navrh-hry.md`, fix the design doc (and say so).
- **Do not commit.** Report the result and wait: the author reviews the work and then says
  "commit". Only on that instruction create one commit per step with the message
  `STEP-NN: <step name>` and push `main` (the push triggers the Pages deploy). Never commit
  or push on your own initiative.
- Report briefly (in Czech): what is done, what is unverified, what you propose as the next step.
