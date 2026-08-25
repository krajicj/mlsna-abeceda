/**
 * Curriculum logic: what the child learns and in which order. Pure functions over the data tables
 * in src/data/curriculum.ts and the settings – no DOM, no storage (docs/navrh-hry.md ch. 5.2–5.6).
 */
import {
  BASE_LETTERS,
  DIACRITICS,
  FREQUENT_LETTERS,
  isLetter,
  LETTER_WORDS,
  ROLE_WORDS,
  type Letter,
} from '../data/curriculum';
import type { Settings } from './settings';

/** Stage of one track: P1–P5 for letters, Č1–Č5 for numbers (návrh 5.2). */
export type Level = 1 | 2 | 3 | 4 | 5;

export const LEVEL1_LETTERS = 4;
/** A short name plus a small family would leave stage 2 tiny – top it up from the order. */
export const LEVEL2_MIN_LETTERS = 8;
export const LEVEL3_LETTERS = 14;

/**
 * Letters of `text`, upper-cased, without duplicates. `fold` maps Č→C (used for family initials),
 * `skip` drops diacritics altogether (used inside the child's name – Č comes only in P4).
 */
export function foldLetters(text: string, mode: 'fold' | 'skip'): Letter[] {
  const out: Letter[] = [];
  for (const char of text.normalize('NFC').toUpperCase()) {
    const letter = isLetter(char) ? char : mode === 'fold' ? (DIACRITICS[char] ?? null) : null;
    if (letter !== null && !out.includes(letter)) out.push(letter);
  }
  return out;
}

function addTo(target: Letter[], letters: readonly Letter[]): void {
  for (const letter of letters) if (!target.includes(letter)) target.push(letter);
}

/** First letter of a name, diacritics folded: "Šimon" → S, "Yveta" → nothing to add. */
function initialOf(name: string): Letter[] {
  return foldLetters(name.trim().slice(0, 1), 'fold');
}

/** Letters that come from the child's own world: their name first, then the family initials. */
function personalLetters(settings: Settings): Letter[] {
  const out: Letter[] = [];
  if (settings.child) addTo(out, foldLetters(settings.child.name, 'skip'));
  for (const member of settings.family) addTo(out, initialOf(member.name));
  return out;
}

/**
 * The teaching order (návrh 5.4): the child's name, family initials, frequent letters, then the
 * rest alphabetically. Always all 22 base letters, each exactly once – also with no settings.
 */
export function letterOrder(settings: Settings): Letter[] {
  const order = personalLetters(settings);
  addTo(order, FREQUENT_LETTERS);
  addTo(order, BASE_LETTERS);
  return order;
}

/** Everything a stage may draw from; the active set inside a track grows towards it one by one. */
export function letterPool(settings: Settings, level: Level): Letter[] {
  const order = letterOrder(settings);
  switch (level) {
    case 1:
      return order.slice(0, LEVEL1_LETTERS);
    case 2:
      return order.slice(0, Math.max(LEVEL2_MIN_LETTERS, personalLetters(settings).length));
    case 3:
    case 4:
      // P4 adds the diacritics of the child's name on top of these – STEP-25.
      return order.slice(0, LEVEL3_LETTERS);
    case 5:
      return order;
  }
}

/** Č1 is the range the child already knows; from Č2 on the whole first ten (návrh 5.2). */
export function numberPool(level: Level): string[] {
  const size = level === 1 ? 5 : 10;
  return Array.from({ length: size }, (_, i) => String(i + 1));
}

/** "B jako brácha" when there is a brother, "B jako balón" otherwise (návrh 5.6). */
export function letterWord(letter: Letter, settings: Settings): string {
  const fromFamily = ROLE_WORDS.find(
    (entry) => entry.letter === letter && settings.family.some((m) => m.role === entry.role),
  );
  return fromFamily ? fromFamily.word : LETTER_WORDS[letter];
}

/** How many things end up on the shelf, the right one included. */
export function choiceCount(level: Level): number {
  return level === 1 ? 3 : 4;
}
