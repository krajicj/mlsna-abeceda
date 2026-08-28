/**
 * Curriculum data tables (docs/navrh-hry.md ch. 5.4 and 5.6). Pure data – no logic, no DOM.
 * Words are game content, so they are Czech; everything else is English.
 */
import type { FamilyRole } from '../game/settings';

/** The 22 base letters the game teaches. Diacritics (Š, Č, …) only from stage P4 – STEP-28. */
export const BASE_LETTERS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'R',
  'S',
  'T',
  'U',
  'V',
  'Z',
] as const;

export type Letter = (typeof BASE_LETTERS)[number];

const BASE_SET: ReadonlySet<string> = new Set(BASE_LETTERS);

export function isLetter(value: string): value is Letter {
  return BASE_SET.has(value);
}

/** Frequent, easy-to-draw letters – the third source of the letter order (návrh 5.4, bod 3). */
export const FREQUENT_LETTERS: readonly Letter[] = [
  'O',
  'S',
  'T',
  'A',
  'M',
  'U',
  'D',
  'N',
  'R',
  'J',
  'B',
  'V',
  'Z',
  'H',
  'C',
  'F',
  'G',
];

/** "M jako maminka" – one word per letter (návrh 5.6). Family roles win over these, see ROLE_WORDS. */
export const LETTER_WORDS: Readonly<Record<Letter, string>> = {
  A: 'auto',
  B: 'balón',
  C: 'cibule',
  D: 'dům',
  E: 'ementál',
  F: 'fotbal',
  G: 'guma',
  H: 'houba',
  I: 'iglú',
  J: 'jablko',
  K: 'kočka',
  L: 'lev',
  M: 'maminka',
  N: 'nos',
  O: 'oko',
  P: 'pes',
  R: 'ryba',
  S: 'slon',
  T: 'táta',
  U: 'ucho',
  V: 'vlak',
  Z: 'zebra',
};

/**
 * Words taken from the family when that role is filled in (návrh 5.6). The array order is the
 * priority when two roles share a letter: a brother beats a grandmother on B.
 */
export const ROLE_WORDS: readonly {
  readonly role: FamilyRole;
  readonly letter: Letter;
  readonly word: string;
}[] = [
  { role: 'mother', letter: 'M', word: 'maminka' },
  { role: 'father', letter: 'T', word: 'táta' },
  { role: 'brother', letter: 'B', word: 'brácha' },
  { role: 'sister', letter: 'S', word: 'ségra' },
  { role: 'grandmother', letter: 'B', word: 'babička' },
  { role: 'grandfather', letter: 'D', word: 'děda' },
];

/** Czech diacritics folded onto a base letter; `null` = no base letter in this alphabet. */
export const DIACRITICS: Readonly<Record<string, Letter | null>> = {
  Á: 'A',
  Č: 'C',
  Ď: 'D',
  É: 'E',
  Ě: 'E',
  Í: 'I',
  Ň: 'N',
  Ó: 'O',
  Ř: 'R',
  Š: 'S',
  Ť: 'T',
  Ú: 'U',
  Ů: 'U',
  Ý: null, // Y is not one of the 22 letters
  Ž: 'Z',
};

/** Never offered against each other on the shelf – too similar in shape (návrh 5.4). */
export const CONFUSABLE_LETTERS: readonly (readonly [Letter, Letter])[] = [
  ['O', 'C'],
  ['O', 'D'],
  ['C', 'G'],
  ['E', 'F'],
  ['M', 'N'],
  ['P', 'R'],
  ['U', 'V'],
  ['I', 'J'],
  ['S', 'Z'],
  ['B', 'R'],
  ['H', 'N'],
];

/** Strings, because a track always holds its elements as strings (see mastery.ts). */
export const CONFUSABLE_DIGITS: readonly (readonly [string, string])[] = [
  ['1', '7'],
  ['6', '9'],
  ['3', '8'],
  ['5', '6'],
];

export type FruitKind = 'strawberry' | 'blueberry' | 'cherry' | 'raspberry';

/**
 * Every kind the game can say a sentence about – the manifest of voice lines is built from this
 * one, so a fruit missing here has no clips. What the ORDER GENERATOR may ask for is a different
 * set: the raspberry is sold in the shop (STEP-15) and only `unlockedFruits()` lets it through.
 */
export const FRUITS: readonly FruitKind[] = ['strawberry', 'blueberry', 'cherry', 'raspberry'];

/** What the child starts with, before anything is bought (návrh 5.6 and kap. 7). */
export const STARTER_FRUITS: readonly FruitKind[] = ['strawberry', 'blueberry', 'cherry'];
