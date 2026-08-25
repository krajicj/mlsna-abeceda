import { describe, expect, it } from 'vitest';
import { MAX_CHOICES } from '../art/layout';
import {
  choiceItemOf,
  choiceTarget,
  choiceValues,
  createChoice,
  isFirstTry,
  MAX_SHOWN_CHOICES,
  pickChoice,
  revealChoice,
  shelfDecoration,
  type ChoiceState,
} from './choice';
import type { TrackState } from './mastery';
import type { Order } from './orders';

const LETTER_ORDER: Order = {
  index: 2,
  items: [{ type: 'letter', letter: 'K', word: 'kočka', choices: ['A', 'K', 'M'] }],
};

const DIGIT_ORDER: Order = {
  index: 3,
  items: [{ type: 'digit', value: 3, choices: [1, 3, 4] }],
};

const COUNT_ORDER: Order = {
  index: 1,
  items: [{ type: 'count', fruit: 'blueberry', amount: 3 }],
};

const NUMBERS: TrackState = { level: 1, active: ['1', '2', '3', '4', '5'], scores: {} };

/** Taps the given values in order and returns the state after the last one. */
function tap(state: ChoiceState, ...values: readonly string[]): ChoiceState {
  let current = state;
  for (const value of values) current = pickChoice(current, value).state;
  return current;
}

describe('createChoice', () => {
  it('keeps the offer as the generator shuffled it', () => {
    expect(createChoice('K', ['A', 'K', 'M'])).toEqual({
      target: 'K',
      choices: ['A', 'K', 'M'],
      mistakes: 0,
      wrong: [],
      revealed: false,
      done: false,
    });
  });

  it('drops duplicates and keeps the first of them', () => {
    expect(createChoice('K', ['K', 'K', 'A']).choices).toEqual(['K', 'A']);
    expect(createChoice('K', ['A', 'A', 'M', 'K']).choices).toEqual(['A', 'M', 'K']);
  });

  it('drops empty values', () => {
    expect(createChoice('K', ['', 'A', '', 'K']).choices).toEqual(['A', 'K']);
  });

  it('cuts the offer to MAX_SHOWN_CHOICES and keeps the target in it', () => {
    expect(createChoice('K', ['A', 'M', 'O', 'S', 'T']).choices).toEqual(['A', 'M', 'O', 'K']);
    expect(createChoice('K', ['A', 'M', 'K', 'S', 'T']).choices).toEqual(['A', 'M', 'K', 'S']);
  });

  it('answers an empty offer with the target alone', () => {
    expect(createChoice('K', []).choices).toEqual(['K']);
    expect(createChoice('K', ['', '']).choices).toEqual(['K']);
  });

  it('puts the target on the shelf even when it is missing from the offer', () => {
    expect(createChoice('K', ['A', 'M']).choices).toEqual(['A', 'K']);
  });
});

describe('pickChoice', () => {
  const start = createChoice('K', ['A', 'K', 'M']);

  it('finishes the item on the right piece', () => {
    const step = pickChoice(start, 'K');
    expect(step.result).toBe('correct');
    expect(step.state.done).toBe(true);
    expect(step.state.mistakes).toBe(0);
  });

  it('counts a wrong piece and leaves the item running', () => {
    const step = pickChoice(start, 'A');
    expect(step.result).toBe('wrong');
    expect(step.state).toMatchObject({ mistakes: 1, wrong: ['A'], revealed: false, done: false });
  });

  it('reveals the answer on the second mistake', () => {
    const state = tap(start, 'A', 'M');
    expect(state).toMatchObject({ mistakes: 2, wrong: ['A', 'M'], revealed: true, done: false });
  });

  it('counts a repeated mistake on the same piece', () => {
    const state = tap(start, 'A', 'A');
    expect(state.mistakes).toBe(2);
    expect(state.wrong).toEqual(['A', 'A']);
    expect(state.revealed).toBe(true);
  });

  it('ignores a value that is not on the shelf and keeps the very same state', () => {
    const step = pickChoice(start, 'X');
    expect(step.result).toBe('unknown');
    expect(step.state).toBe(start);
  });

  it('ignores a tap after the item is finished', () => {
    const done = pickChoice(start, 'K').state;
    const step = pickChoice(done, 'A');
    expect(step.result).toBe('finished');
    expect(step.state).toBe(done);
  });

  it('never mutates the state it was given', () => {
    const before = structuredClone(start);
    tap(start, 'A', 'M', 'K');
    expect(start).toEqual(before);
  });
});

describe('revealChoice', () => {
  const start = createChoice('K', ['A', 'K', 'M']);

  it('only sets the flag', () => {
    expect(revealChoice(start)).toEqual({ ...start, revealed: true });
  });

  it('keeps the very same state when it is already revealed', () => {
    const revealed = revealChoice(start);
    expect(revealChoice(revealed)).toBe(revealed);
  });

  it('keeps the very same state on a finished item', () => {
    const done = pickChoice(start, 'K').state;
    expect(revealChoice(done)).toBe(done);
  });
});

describe('isFirstTry', () => {
  const start = createChoice('K', ['A', 'K', 'M']);

  it('is true only without a mistake and without a hint', () => {
    expect(isFirstTry(pickChoice(start, 'K').state)).toBe(true);
    expect(isFirstTry(tap(start, 'A', 'K'))).toBe(false);
    expect(isFirstTry(pickChoice(revealChoice(start), 'K').state)).toBe(false);
  });
});

describe('choiceItemOf', () => {
  it('finds the letter and the digit item of an order', () => {
    expect(choiceItemOf(LETTER_ORDER)).toEqual(LETTER_ORDER.items[0]);
    expect(choiceItemOf(DIGIT_ORDER)).toEqual(DIGIT_ORDER.items[0]);
  });

  it('is null for an order with counting only and for an empty one', () => {
    expect(choiceItemOf(COUNT_ORDER)).toBeNull();
    expect(choiceItemOf({ index: 1, items: [] })).toBeNull();
  });
});

describe('choiceTarget and choiceValues', () => {
  it('reads the letter item as it is', () => {
    const item = choiceItemOf(LETTER_ORDER)!;
    expect(choiceTarget(item)).toBe('K');
    expect(choiceValues(item)).toEqual(['A', 'K', 'M']);
  });

  it('turns the digits into strings', () => {
    const item = choiceItemOf(DIGIT_ORDER)!;
    expect(choiceTarget(item)).toBe('3');
    expect(choiceValues(item)).toEqual(['1', '3', '4']);
  });
});

describe('shelfDecoration', () => {
  it('takes the first MAX_SHOWN_CHOICES elements of the track by default', () => {
    expect(shelfDecoration(NUMBERS)).toEqual(['1', '2', '3', '4']);
  });

  it('takes fewer when asked and never more than the shelf holds', () => {
    expect(shelfDecoration(NUMBERS, 2)).toEqual(['1', '2']);
    expect(shelfDecoration(NUMBERS, 9)).toEqual(['1', '2', '3', '4']);
    expect(shelfDecoration(NUMBERS, 0)).toEqual([]);
    expect(shelfDecoration(NUMBERS, Number.NaN)).toEqual([]);
  });

  it('returns what a shorter track has, and nothing for an empty one', () => {
    expect(shelfDecoration({ level: 1, active: ['E', 'L'], scores: {} })).toEqual(['E', 'L']);
    expect(shelfDecoration({ level: 1, active: [], scores: {} })).toEqual([]);
  });
});

describe('the shelf and the offer stay in step', () => {
  it('shows exactly as many pieces as art/layout.ts puts on a shelf', () => {
    expect(MAX_SHOWN_CHOICES).toBe(MAX_CHOICES);
  });
});
