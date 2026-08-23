---
name: plan-step
description: Write the implementation plan for one step of the Mlsná abeceda game (draft → questions → plan from the template → independent Sonnet review → entry in docs/plan.md) and request approval. Use on "/plan-step <brief or STEP-NN from docs/plan.md>". This session only WRITES the plan — implementation is /implement-step.
metadata:
  argument-hint: "step brief or STEP-NN from docs/plan.md"
---

# /plan-step — write the plan for one step

Argument = a **brief** (what should be built) or a **step number** from `docs/plan.md`.
Output: one file `docs/steps/STEP-NN-<slug>.md` with `Status: proposed`, reviewed by an
independent agent, ready for the author's approval. **This session writes the plan; it does
not implement.** The plan itself is written in **Czech** (technical names in English), per the
language policy in `CLAUDE.md`.

The bar: a step is **small, atomic and specific enough that an agent builds it without
guessing** (typically 1–3 hours of work, one commit). If the brief does not fit, split it into
several steps and say so.

## 0 · Context

1. Read `CLAUDE.md`, `docs/plan.md` (milestones, existing steps, statuses) and the relevant
   chapters of `docs/navrh-hry.md` (source of truth for mechanics). Determine the **next free
   step number**; if the step already has a row in the roadmap, use its number and name.
2. **Verify dependencies in the code, not in documents:** what existing modules in `src/`
   actually export (signatures, types). The plan builds on real interfaces.
3. If a mechanic is missing from `docs/navrh-hry.md` or contradicts the code → do not guess;
   put it into the questions (step 2).

## 1 · Draft

Write a **rough draft** (max ~15 lines): one summary paragraph, scope bullets (in / out),
main files, 3–5 acceptance criteria. It is a skeleton to tune, not the plan.

## 2 · Questions

- Ask **only about decisions that change the plan's content** and that are genuinely the
  author's: scope boundaries, edge-case behaviour, naming visible in the game, a choice
  between two reasonable solutions. For multi-option choices use `AskUserQuestion`.
- **Do not ask what you can verify yourself** in the code, the design doc or library docs.
- Send the draft and the questions in one message and **wait for the answer**. If there are no
  questions, show the draft and continue with step 3 right away.

## 3 · Write the plan

Copy `docs/steps/_TEMPLATE-step.md` → `docs/steps/STEP-NN-<slug>.md`, `Status: proposed`.
Fill in **every** section concretely:

- **Shrnutí** – 3–6 sentences: context, what the step delivers, what it enables next.
- **Rozsah** – in scope / out of scope, as lists.
- **Implementace** – tree of touched files (new/changed), steps 1..n, libraries with
  **pinned versions**, key decisions; guiding pseudocode for non-trivial logic.
- **Kontrakt** – exact TS signatures / data shapes / file formats + an **example**. Technical
  names in English. (May be short for a purely visual step.)
- **Akceptační kritéria** – "KDYŽ X, PAK Y", pass/fail, covering the whole scope including
  errors and edge cases.
- **Testy** – what Vitest covers (logic in `src/game/` always), how to run.
- **Ruční ověření** – a browser checklist: what to open, what to tap, what must be
  seen/heard; including the phone size (the game is visual — tests are not enough).
- **DoD** + an empty "Výsledek implementace".
- Links (design doc, roadmap, other steps) must resolve; from `docs/steps/` that is
  `../navrh-hry.md`, `../plan.md`, `./STEP-NN-….md`.

## 4 · Independent review (Sonnet, not codex)

Launch **one** fresh agent: `Agent` with `subagent_type: "general-purpose"`,
`model: "sonnet"`, read-only. Pass it this brief VERBATIM (fill in the path):

> You are a strict reviewer of an implementation plan (a spec to be built later), NOT of
> code. Read `<path to the STEP file>`, then `docs/plan.md`, `docs/steps/_TEMPLATE-step.md`,
> `CLAUDE.md` and the chapters of `docs/navrh-hry.md` the plan references (the plan and the
> design doc are in Czech). Verify the plan can be implemented by an agent WITHOUT guessing.
> Check: (1) Kontrakt — precise signatures, data shapes, formats + a concrete example;
> (2) Akceptační kritéria — testable KDYŽ/PAK pass/fail, covering the scope, including
> errors and edge cases; (3) Dependencies — the interfaces the plan builds on ACTUALLY exist
> in `src/` as described (verify in the code, do not trust the plan); (4) Implementace —
> concrete files, steps, pinned libraries; (5) Scope — coherent, no gaps, no creep beyond
> Rozsah; (6) compliance with the rules in `CLAUDE.md` (player cannot read, cannot lose, no
> external requests at runtime, no real names in the repo, voice lines only via the
> manifest). List every finding as `critical` / `warning` / `suggestion` with a line
> reference and a concrete fix. End with a one-line verdict:
> **ready / fix-then-ready / not-ready**. Do not modify any files.

## 5 · Triage

- **Triage, not obedience:** fix a real gap in the plan; reject a false positive **with a
  written reason** (in the message to the author, never silently).
- A finding that needs a **product decision** → ask the author, do not guess.
- After larger fixes, at most **one** more review, limited to the changed parts. No more —
  escalate.

## 6 · Register in the roadmap and request approval

- Update `docs/plan.md`: the step's row (number, name, milestone, "Po" = dependencies,
  `proposed`), plus a note if the step changes ordering or the pipeline.
- **Do not start implementing.** Report briefly to the author (in Czech): what the step
  delivers, the number of review findings (`critical`/`warning`), what was fixed and what was
  rejected and why, and **ask for approval**. After approval the author (or you on their
  instruction) sets `Status: approved` and runs `/implement-step STEP-NN`.
