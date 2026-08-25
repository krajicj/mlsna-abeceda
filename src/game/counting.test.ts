import { describe, expect, it } from 'vitest';
import { addFruit, countItemOf, createCounting, MAX_COUNT, type CountingState } from './counting';
import type { Order } from './orders';

const LETTER_ORDER: Order = {
  index: 2,
  items: [{ type: 'letter', letter: 'K', word: 'kočka', choices: ['K', 'A'] }],
};

const COUNT_ORDER: Order = {
  index: 1,
  items: [{ type: 'count', fruit: 'blueberry', amount: 3 }],
};

/** Taps the fruit `times` times and returns the state after the last one. */
function tap(state: CountingState, times: number): CountingState {
  let current = state;
  for (let i = 0; i < times; i += 1) current = addFruit(current).state;
  return current;
}

describe('createCounting', () => {
  it.each([
    [1, 1],
    [3, 3],
    [5, 5],
    [0, 1],
    [-3, 1],
    [9, MAX_COUNT],
    [2.6, 3],
    [2.4, 2],
    [Number.NaN, 1],
    [Number.POSITIVE_INFINITY, 1],
  ])('turns a target of %s into %i', (target, expected) => {
    expect(createCounting(target).target).toBe(expected);
  });

  it('starts empty and unfinished', () => {
    expect(createCounting(3)).toEqual({ target: 3, placed: 0, extraTaps: 0, done: false });
  });
});

describe('addFruit', () => {
  it('counts the pieces up to the target', () => {
    let state = createCounting(3);
    for (const expected of [1, 2]) {
      const step = addFruit(state);
      expect(step.result).toBe('placed');
      expect(step.state.placed).toBe(expected);
      expect(step.state.done).toBe(false);
      state = step.state;
    }
    const last = addFruit(state);
    expect(last.result).toBe('completed');
    expect(last.state.placed).toBe(3);
    expect(last.state.done).toBe(true);
  });

  it('finishes a target of one on the first tap', () => {
    const step = addFruit(createCounting(1));
    expect(step.result).toBe('completed');
    expect(step.state.done).toBe(true);
  });

  it('only counts the extra taps once the item is done', () => {
    let state = tap(createCounting(2), 2);
    for (const expected of [1, 2, 3]) {
      const step = addFruit(state);
      expect(step.result).toBe('too-many');
      expect(step.state.placed).toBe(2);
      expect(step.state.extraTaps).toBe(expected);
      state = step.state;
    }
  });

  it('never mutates the state it is given', () => {
    const state = createCounting(3);
    const before = { ...state };
    addFruit(state);
    expect(state).toEqual(before);
  });
});

describe('countItemOf', () => {
  it('finds the counting item of an order', () => {
    expect(countItemOf(COUNT_ORDER)).toEqual({ type: 'count', fruit: 'blueberry', amount: 3 });
  });

  it('returns null for an order without one', () => {
    expect(countItemOf(LETTER_ORDER)).toBeNull();
    expect(countItemOf({ index: 3, items: [] })).toBeNull();
  });

  it('returns the first one when an order holds several', () => {
    const order: Order = {
      index: 1,
      items: [
        { type: 'digit', value: 3, choices: [3, 4] },
        { type: 'count', fruit: 'cherry', amount: 2 },
        { type: 'count', fruit: 'strawberry', amount: 5 },
      ],
    };
    expect(countItemOf(order)?.fruit).toBe('cherry');
  });
});
