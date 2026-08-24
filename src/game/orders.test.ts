import { describe, expect, it } from 'vitest';
import { FRUITS } from '../data/curriculum';
import { createTrack, type TrackState } from './mastery';
import { generateOrder, orderElements, type Order, type OrderInput } from './orders';
import { createRng } from './rng';
import { EMPTY_SETTINGS, type Settings } from './settings';

const SETTINGS: Settings = {
  child: { name: 'Anička', vocative: 'Aničko' },
  family: [{ name: 'Lenka', role: 'mother' }],
};

const LETTERS = ['A', 'N', 'I', 'K'];
const NUMBERS = ['1', '2', '3', '4', '5'];

function scored(track: TrackState, scores: Record<string, number>): TrackState {
  return { ...track, scores: { ...track.scores, ...scores } };
}

function allKnown(track: TrackState): TrackState {
  return scored(track, Object.fromEntries(track.active.map((element) => [element, 3])));
}

function input(overrides: Partial<OrderInput> = {}): OrderInput {
  return {
    settings: SETTINGS,
    tracks: {
      numbers: allKnown(createTrack(1, NUMBERS)),
      letters: allKnown(createTrack(1, LETTERS)),
    },
    index: 1,
    ...overrides,
  };
}

/** Runs the generator over many seeds – the assertions must hold for every one of them. */
function everySeed(overrides: Partial<OrderInput>, check: (order: Order) => void): void {
  for (let seed = 0; seed < 60; seed += 1) {
    check(generateOrder({ ...input(overrides), rng: createRng(seed) }));
  }
}

describe('track alternation', () => {
  it('alternates numbers and letters, counting first', () => {
    const types = [1, 2, 3, 4, 5, 6, 7, 8].map(
      (index) => generateOrder({ ...input({ index }), rng: createRng(index) }).items[0]?.type,
    );
    expect(types).toEqual([
      'count',
      'letter',
      'digit',
      'letter',
      'count',
      'letter',
      'digit',
      'letter',
    ]);
  });

  it('always makes exactly one item at this stage', () => {
    everySeed({ index: 2 }, (order) => expect(order.items).toHaveLength(1));
  });
});

describe('count item', () => {
  it('asks for a number of the active set as a real number', () => {
    everySeed({ index: 1 }, (order) => {
      const item = order.items[0];
      if (item?.type !== 'count') throw new Error('expected a count item');
      expect(NUMBERS).toContain(String(item.amount));
      expect(typeof item.amount).toBe('number');
      expect(FRUITS).toContain(item.fruit);
    });
  });

  it('picks another fruit than the one before', () => {
    everySeed({ index: 1, avoidFruit: 'cherry' }, (order) => {
      const item = order.items[0];
      if (item?.type !== 'count') throw new Error('expected a count item');
      expect(item.fruit).not.toBe('cherry');
    });
  });
});

describe('digit item', () => {
  it('offers numbers, the right one exactly once', () => {
    everySeed({ index: 3 }, (order) => {
      const item = order.items[0];
      if (item?.type !== 'digit') throw new Error('expected a digit item');
      expect(item.choices).toHaveLength(3);
      expect(item.choices.filter((choice) => choice === item.value)).toHaveLength(1);
      for (const choice of item.choices) {
        expect(typeof choice).toBe('number');
        expect(NUMBERS).toContain(String(choice));
      }
    });
  });

  it('never puts a look-alike digit next to the right one', () => {
    const numbers = allKnown(createTrack(2, ['1', '3', '5', '6', '7', '8', '9']));
    for (let seed = 0; seed < 60; seed += 1) {
      const order = generateOrder({
        ...input({ index: 3 }),
        tracks: { numbers, letters: allKnown(createTrack(1, LETTERS)) },
        rng: createRng(seed),
      });
      const item = order.items[0];
      if (item?.type !== 'digit') throw new Error('expected a digit item');
      const others = item.choices.filter((choice) => choice !== item.value);
      for (const [a, b] of [
        [1, 7],
        [6, 9],
        [3, 8],
        [5, 6],
      ]) {
        if (item.value === a) expect(others).not.toContain(b);
        if (item.value === b) expect(others).not.toContain(a);
      }
      expect(item.choices).toHaveLength(4); // stage 2 → four things on the shelf
    }
  });
});

describe('letter item', () => {
  it('offers three letters of the active set, the right one exactly once', () => {
    everySeed({ index: 2 }, (order) => {
      const item = order.items[0];
      if (item?.type !== 'letter') throw new Error('expected a letter item');
      expect(item.choices).toHaveLength(3);
      expect(item.choices.filter((choice) => choice === item.letter)).toHaveLength(1);
      for (const choice of item.choices) expect(LETTERS).toContain(choice);
      expect(item.word.length).toBeGreaterThan(0);
    });
  });

  it('never puts a look-alike letter next to the right one', () => {
    const letters = allKnown(createTrack(2, ['M', 'N', 'O', 'C', 'A', 'L']));
    for (let seed = 0; seed < 60; seed += 1) {
      const order = generateOrder({
        ...input({ index: 2 }),
        tracks: { numbers: allKnown(createTrack(1, NUMBERS)), letters },
        rng: createRng(seed),
      });
      const item = order.items[0];
      if (item?.type !== 'letter') throw new Error('expected a letter item');
      const others = item.choices.filter((choice) => choice !== item.letter);
      if (item.letter === 'M') expect(others).not.toContain('N');
      if (item.letter === 'N') expect(others).not.toContain('M');
      if (item.letter === 'O') expect(others).not.toContain('C');
      if (item.letter === 'C') expect(others).not.toContain('O');
    }
  });

  it('takes the distractors from the letters the child already knows', () => {
    const letters = scored(createTrack(1, LETTERS), { A: 3, N: 3, I: 3, K: 0 });
    for (let seed = 0; seed < 60; seed += 1) {
      const order = generateOrder({
        ...input({ index: 2, avoid: ['N', 'I', 'K'] }), // target is always A
        tracks: { numbers: allKnown(createTrack(1, NUMBERS)), letters },
        rng: createRng(seed),
      });
      const item = order.items[0];
      if (item?.type !== 'letter') throw new Error('expected a letter item');
      expect(item.letter).toBe('A');
      expect(item.choices).not.toContain('K'); // K is not known yet, N and I are
    }
  });

  it('uses the family word when the settings have one', () => {
    const letters = allKnown(createTrack(1, ['M']));
    const order = generateOrder({
      ...input({ index: 2 }),
      tracks: { numbers: allKnown(createTrack(1, NUMBERS)), letters },
      rng: createRng(1),
    });
    const item = order.items[0];
    if (item?.type !== 'letter') throw new Error('expected a letter item');
    expect(item.word).toBe('maminka');
  });
});

describe('avoid and small sets', () => {
  it('does not ask for an element from the last order of the same track', () => {
    everySeed({ index: 2, avoid: ['A', 'N', 'I'] }, (order) => {
      const item = order.items[0];
      if (item?.type !== 'letter') throw new Error('expected a letter item');
      expect(item.letter).toBe('K');
    });
  });

  it('gives the rule up rather than failing when everything is avoided', () => {
    everySeed({ index: 2, avoid: LETTERS }, (order) => {
      const item = order.items[0];
      if (item?.type !== 'letter') throw new Error('expected a letter item');
      expect(LETTERS).toContain(item.letter);
    });
  });

  it('makes a shorter shelf for a one-element set instead of crashing', () => {
    const order = generateOrder({
      ...input({ index: 2 }),
      tracks: {
        numbers: allKnown(createTrack(1, NUMBERS)),
        letters: allKnown(createTrack(1, ['A'])),
      },
      rng: createRng(4),
    });
    const item = order.items[0];
    if (item?.type !== 'letter') throw new Error('expected a letter item');
    expect(item.choices).toEqual(['A']);
  });

  it('works with no settings at all', () => {
    const order = generateOrder({
      settings: EMPTY_SETTINGS,
      tracks: {
        numbers: allKnown(createTrack(1, NUMBERS)),
        letters: allKnown(createTrack(1, ['O', 'S', 'T', 'A'])),
      },
      index: 2,
      rng: createRng(8),
    });
    const item = order.items[0];
    if (item?.type !== 'letter') throw new Error('expected a letter item');
    expect(item.word).toBe(
      { O: 'oko', S: 'slon', T: 'táta', A: 'auto' }[item.letter as 'O' | 'S' | 'T' | 'A'],
    );
  });
});

describe('determinism', () => {
  it('gives the same order for the same seed and input', () => {
    const first = generateOrder({ ...input({ index: 2 }), rng: createRng(42) });
    const second = generateOrder({ ...input({ index: 2 }), rng: createRng(42) });
    expect(first).toEqual(second);
  });

  it('does not always give the same order for different seeds', () => {
    const letters = new Set(
      Array.from(
        { length: 30 },
        (_, seed) => generateOrder({ ...input({ index: 2 }), rng: createRng(seed) }).items[0],
      ).map((item) => (item?.type === 'letter' ? item.letter : '')),
    );
    expect(letters.size).toBeGreaterThan(1);
  });
});

describe('orderElements', () => {
  it('gives the string keys of what the order asked for', () => {
    const count = generateOrder({ ...input({ index: 1 }), rng: createRng(2) });
    const countItem = count.items[0];
    if (countItem?.type !== 'count') throw new Error('expected a count item');
    expect(orderElements(count)).toEqual([String(countItem.amount)]);

    const digit = generateOrder({ ...input({ index: 3 }), rng: createRng(2) });
    const digitItem = digit.items[0];
    if (digitItem?.type !== 'digit') throw new Error('expected a digit item');
    expect(orderElements(digit)).toEqual([String(digitItem.value)]);

    const letter = generateOrder({ ...input({ index: 2 }), rng: createRng(2) });
    const letterItem = letter.items[0];
    if (letterItem?.type !== 'letter') throw new Error('expected a letter item');
    expect(orderElements(letter)).toEqual([letterItem.letter]);
  });
});
