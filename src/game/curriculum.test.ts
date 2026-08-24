import { describe, expect, it } from 'vitest';
import { BASE_LETTERS } from '../data/curriculum';
import {
  choiceCount,
  foldLetters,
  letterOrder,
  letterPool,
  letterWord,
  numberPool,
} from './curriculum';
import { EMPTY_SETTINGS, type Settings } from './settings';

// Made-up family from the design doc; the real names live only in the settings, never in the repo.
const FAMILY: Settings = {
  child: { name: 'Anička', vocative: 'Aničko' },
  family: [
    { name: 'Lenka', role: 'mother' },
    { name: 'Tomík', role: 'brother' },
  ],
};

describe('foldLetters', () => {
  it('upper-cases and drops duplicates', () => {
    expect(foldLetters('kočka', 'fold')).toEqual(['K', 'O', 'C', 'A']);
  });

  it('skips diacritics in skip mode and folds them in fold mode', () => {
    expect(foldLetters('Anička', 'skip')).toEqual(['A', 'N', 'I', 'K']);
    expect(foldLetters('Anička', 'fold')).toEqual(['A', 'N', 'I', 'C', 'K']);
    expect(foldLetters('Šimon', 'fold')).toEqual(['S', 'I', 'M', 'O', 'N']);
  });

  it('drops letters outside the alphabet and any other character', () => {
    expect(foldLetters('Xénie 42 - qwy', 'fold')).toEqual(['E', 'N', 'I']);
  });

  it('treats a decomposed name like a composed one', () => {
    const decomposed = 'Anic\u030Cka'; // c + combining caron, as some keyboards produce it
    expect(foldLetters(decomposed, 'skip')).toEqual(['A', 'N', 'I', 'K']);
    expect(foldLetters(decomposed, 'fold')).toEqual(['A', 'N', 'I', 'C', 'K']);
  });

  it('handles an empty string', () => {
    expect(foldLetters('', 'fold')).toEqual([]);
  });
});

describe('letterOrder', () => {
  it('follows name, family initials, frequent letters, the rest', () => {
    expect(letterOrder(FAMILY)).toEqual([
      ...['A', 'N', 'I', 'K'],
      ...['L', 'T'],
      ...['O', 'S', 'M', 'U', 'D', 'R', 'J', 'B', 'V', 'Z', 'H', 'C', 'F', 'G'],
      ...['E', 'P'],
    ]);
  });

  it('starts with the frequent letters when nothing is configured', () => {
    expect(letterOrder(EMPTY_SETTINGS).slice(0, 5)).toEqual(['O', 'S', 'T', 'A', 'M']);
  });

  it('folds a family initial with a diacritic', () => {
    const settings: Settings = { child: null, family: [{ name: 'Šimon', role: 'father' }] };
    expect(letterOrder(settings)[0]).toBe('S');
  });

  it('contains all 22 base letters exactly once, whatever the settings', () => {
    const cases: Settings[] = [
      EMPTY_SETTINGS,
      FAMILY,
      { child: { name: 'Žofie', vocative: 'Žofie' }, family: [{ name: 'Ivo', role: 'father' }] },
      { child: { name: '   ', vocative: '' }, family: [] },
    ];
    for (const settings of cases) {
      const order = letterOrder(settings);
      expect(order).toHaveLength(BASE_LETTERS.length);
      expect([...order].sort()).toEqual([...BASE_LETTERS].sort());
    }
  });
});

describe('letterPool', () => {
  it('starts with the four letters of the name', () => {
    expect(letterPool(FAMILY, 1)).toEqual(['A', 'N', 'I', 'K']);
  });

  it('tops stage 2 up to eight letters', () => {
    expect(letterPool(FAMILY, 2)).toEqual(['A', 'N', 'I', 'K', 'L', 'T', 'O', 'S']);
    const short: Settings = { child: { name: 'Ema', vocative: 'Emo' }, family: [] };
    expect(letterPool(short, 2)).toHaveLength(8);
    expect(letterPool(short, 2).slice(0, 3)).toEqual(['E', 'M', 'A']);
  });

  it('grows to fourteen letters on stage 3 (stage 4 adds diacritics in STEP-24)', () => {
    expect(letterPool(FAMILY, 3)).toEqual([
      'A',
      'N',
      'I',
      'K',
      'L',
      'T',
      'O',
      'S',
      'M',
      'U',
      'D',
      'R',
      'J',
      'B',
    ]);
    expect(letterPool(FAMILY, 4)).toEqual(letterPool(FAMILY, 3));
  });

  it('holds the whole alphabet on stage 5', () => {
    expect(letterPool(FAMILY, 5)).toHaveLength(BASE_LETTERS.length);
  });

  it('works with no settings at all', () => {
    expect(letterPool(EMPTY_SETTINGS, 1)).toEqual(['O', 'S', 'T', 'A']);
  });
});

describe('numberPool', () => {
  it('is 1–5 on stage 1 and 1–10 from stage 2 on', () => {
    expect(numberPool(1)).toEqual(['1', '2', '3', '4', '5']);
    expect(numberPool(2)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
    expect(numberPool(5)).toHaveLength(10);
  });
});

describe('letterWord', () => {
  it('uses the family word when the role is filled in', () => {
    expect(letterWord('B', { child: null, family: [{ name: 'Tomík', role: 'brother' }] })).toBe(
      'brácha',
    );
  });

  it('falls back to the picture word otherwise', () => {
    expect(letterWord('B', EMPTY_SETTINGS)).toBe('balón');
    expect(letterWord('K', FAMILY)).toBe('kočka');
  });

  it('gives the brother priority over the grandmother on B', () => {
    const settings: Settings = {
      child: null,
      family: [
        { name: 'Božena', role: 'grandmother' },
        { name: 'Tomík', role: 'brother' },
      ],
    };
    expect(letterWord('B', settings)).toBe('brácha');
  });

  it('says ementál for E until the name clip exists (STEP-17)', () => {
    expect(letterWord('E', FAMILY)).toBe('ementál');
    expect(letterWord('E', EMPTY_SETTINGS)).toBe('ementál');
  });
});

describe('choiceCount', () => {
  it('is three things on the shelf on stage 1 and four later', () => {
    expect(choiceCount(1)).toBe(3);
    expect(choiceCount(2)).toBe(4);
    expect(choiceCount(5)).toBe(4);
  });
});
