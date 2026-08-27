import { describe, expect, it } from 'vitest';
import { FRUITS } from '../data/curriculum';
import { MAX_COUNT } from './counting';
import { createTrack, type TrackState } from './mastery';
import {
  generateOrder,
  numbersTurn,
  orderElements,
  orderLength,
  MAX_ORDER_ITEMS,
  SINGLE_ITEM_ORDERS,
  type Order,
  type OrderInput,
} from './orders';
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

  it('always makes exactly one item up to the tenth order', () => {
    everySeed({ index: 2 }, (order) => expect(order.items).toHaveLength(1));
    everySeed({ index: 10 }, (order) => expect(order.items).toHaveLength(1));
  });
});

describe('two items from the eleventh order on (návrh 5.3)', () => {
  /** Which track an item belongs to – letters or numbers (counting and digits are one track). */
  function trackOf(item: Order['items'][number]): 'letters' | 'numbers' {
    return item.type === 'letter' ? 'letters' : 'numbers';
  }

  it('counts one item up to the tenth order and two after it', () => {
    expect(SINGLE_ITEM_ORDERS).toBe(10);
    expect(MAX_ORDER_ITEMS).toBe(2);
    expect([1, 2, 9, 10].map(orderLength)).toEqual([1, 1, 1, 1]);
    expect([11, 12, 20, 99].map(orderLength)).toEqual([2, 2, 2, 2]);
  });

  it('puts exactly one item of each track in every order from the eleventh on', () => {
    for (let index = 11; index <= 20; index += 1) {
      everySeed({ index }, (order) => {
        expect(order.items).toHaveLength(2);
        const tracks = order.items.map(trackOf).sort();
        expect(tracks).toEqual(['letters', 'numbers']);
      });
    }
  });

  it('keeps counting and digits alternating across the boundary of the tenth order', () => {
    expect([1, 3, 9, 11, 12, 13].map(numbersTurn)).toEqual([1, 2, 5, 6, 7, 8]);
    const numbers = [9, 11, 12, 13].map((index) => {
      const order = generateOrder({ ...input({ index }), rng: createRng(index) });
      const item = order.items.find((candidate) => candidate.type !== 'letter');
      return item?.type;
    });
    expect(numbers).toEqual(['count', 'digit', 'count', 'digit']);
  });

  it('draws the order of the two items instead of always asking the same way round', () => {
    const first = new Set(
      Array.from(
        { length: 40 },
        (_, seed) =>
          generateOrder({ ...input({ index: 11 }), rng: createRng(seed) }).items[0]?.type,
      ),
    );
    expect(first.size).toBeGreaterThan(1); // both "digit first" and "letter first" turn up
  });

  it('replays the same two items in the same order from the same seed', () => {
    const a = generateOrder({ ...input({ index: 11 }), rng: createRng(42) });
    const b = generateOrder({ ...input({ index: 11 }), rng: createRng(42) });
    expect(a).toEqual(b);
  });

  it('makes a two-item order even when a track holds a single element', () => {
    for (let seed = 0; seed < 30; seed += 1) {
      const order = generateOrder({
        ...input({ index: 11 }),
        tracks: {
          numbers: allKnown(createTrack(1, NUMBERS)),
          letters: allKnown(createTrack(1, ['A'])),
        },
        rng: createRng(seed),
      });
      expect(order.items).toHaveLength(2);
      const letter = order.items.find((item) => item.type === 'letter');
      if (letter?.type !== 'letter') throw new Error('expected a letter item');
      expect(letter.choices).toEqual(['A']); // a shorter shelf, not an exception (rule 2)
    }
  });

  it('still keeps an introduced eight out of a counting item', () => {
    const bigNumbers = allKnown(createTrack(2, ['1', '2', '3', '4', '5', '6', '7', '8']));
    for (let seed = 0; seed < 30; seed += 1) {
      // Order 12 is a counting turn (numbersTurn 7) – the eight has to wait for the candle.
      const counted = generateOrder({
        ...input({ index: 12, introduced: { numbers: '8' } }),
        tracks: { numbers: bigNumbers, letters: allKnown(createTrack(1, LETTERS)) },
        rng: createRng(seed),
      });
      const item = counted.items.find((candidate) => candidate.type === 'count');
      if (item?.type !== 'count') throw new Error('expected a count item');
      expect(item.amount).toBeLessThanOrEqual(MAX_COUNT);

      // Order 13 is a digit turn (numbersTurn 8) – it takes the eight right away.
      const digits = generateOrder({
        ...input({ index: 13, introduced: { numbers: '8' } }),
        tracks: { numbers: bigNumbers, letters: allKnown(createTrack(1, LETTERS)) },
        rng: createRng(seed),
      });
      const digit = digits.items.find((candidate) => candidate.type === 'digit');
      if (digit?.type !== 'digit') throw new Error('expected a digit item');
      expect(digit.value).toBe(8);
    }
  });

  it('gives back the keys of both items', () => {
    const order = generateOrder({ ...input({ index: 11 }), rng: createRng(3) });
    expect(orderElements(order)).toHaveLength(2);
    for (const key of orderElements(order)) {
      expect([...LETTERS, ...NUMBERS]).toContain(key);
    }
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

describe('weighted target (návrh 5.4)', () => {
  /** How often each letter was the target over a long run of seeds. */
  function letterCounts(
    letters: TrackState,
    overrides: Partial<OrderInput> = {},
  ): (letter: string) => number {
    const seen = new Map<string, number>(LETTERS.map((letter) => [letter, 0]));
    for (let seed = 0; seed < 400; seed += 1) {
      const order = generateOrder({
        ...input({ index: 2, ...overrides }),
        tracks: { numbers: allKnown(createTrack(1, NUMBERS)), letters },
        rng: createRng(seed),
      });
      const item = order.items[0];
      if (item?.type !== 'letter') throw new Error('expected a letter item');
      seen.set(item.letter, (seen.get(item.letter) ?? 0) + 1);
    }
    return (letter) => seen.get(letter) ?? 0;
  }

  it('asks about a letter the child does not know yet three times as often', () => {
    // A weighs 3, the other three weigh 1 → A is half of the run, the rest a sixth each.
    const seen = letterCounts(scored(createTrack(1, LETTERS), { A: 0, N: 3, I: 3, K: 3 }));
    expect(seen('A') / 400).toBeGreaterThan(0.38);
    expect(seen('A') / 400).toBeLessThan(0.62);
    for (const letter of ['N', 'I', 'K']) expect(seen(letter)).toBeGreaterThan(0);
  });

  it('still asks about the mastered ones – weighting is not exclusion', () => {
    const seen = letterCounts(scored(createTrack(1, LETTERS), { A: 0, N: 0, I: 3, K: 3 }));
    expect(seen('I') + seen('K')).toBeGreaterThan(0);
    expect(seen('A') + seen('N')).toBeGreaterThan(seen('I') + seen('K'));
  });

  it('picks evenly when the child knows the whole set equally well', () => {
    const seen = letterCounts(allKnown(createTrack(1, LETTERS)));
    for (const letter of LETTERS) {
      expect(seen(letter) / 400).toBeGreaterThan(0.15);
      expect(seen(letter) / 400).toBeLessThan(0.35);
    }
  });
});

describe('a freshly introduced element', () => {
  it('is the target of the next order of its track', () => {
    everySeed({ index: 2, introduced: { letters: 'K' } }, (order) => {
      const item = order.items[0];
      if (item?.type !== 'letter') throw new Error('expected a letter item');
      expect(item.letter).toBe('K');
    });
  });

  it('is skipped when the no-repeat rule already rules it out', () => {
    everySeed({ index: 2, introduced: { letters: 'K' }, avoid: ['K'] }, (order) => {
      const item = order.items[0];
      if (item?.type !== 'letter') throw new Error('expected a letter item');
      expect(item.letter).not.toBe('K');
    });
  });

  it('does not leak into the other track', () => {
    everySeed({ index: 3, introduced: { letters: 'K' } }, (order) => {
      const item = order.items[0];
      if (item?.type !== 'digit') throw new Error('expected a digit item');
      expect(NUMBERS).toContain(String(item.value));
    });
  });

  it('is ignored when it is not in the active set at all', () => {
    everySeed({ index: 2, introduced: { letters: 'Z' } }, (order) => {
      const item = order.items[0];
      if (item?.type !== 'letter') throw new Error('expected a letter item');
      expect(LETTERS).toContain(item.letter);
    });
  });
});

describe('counting stays inside the cake', () => {
  const bigNumbers = allKnown(createTrack(2, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']));

  it('never asks for more pieces of fruit than fit on the cake', () => {
    for (let seed = 0; seed < 60; seed += 1) {
      const order = generateOrder({
        ...input({ index: 1 }),
        tracks: { numbers: bigNumbers, letters: allKnown(createTrack(1, LETTERS)) },
        rng: createRng(seed),
      });
      const item = order.items[0];
      if (item?.type !== 'count') throw new Error('expected a count item');
      expect(item.amount).toBeLessThanOrEqual(MAX_COUNT);
      expect(item.amount).toBeGreaterThanOrEqual(1);
    }
  });

  it('leaves an introduced eight for the candle order instead of counting to eight', () => {
    for (let seed = 0; seed < 60; seed += 1) {
      const counted = generateOrder({
        ...input({ index: 1, introduced: { numbers: '8' } }),
        tracks: { numbers: bigNumbers, letters: allKnown(createTrack(1, LETTERS)) },
        rng: createRng(seed),
      });
      const countItem = counted.items[0];
      if (countItem?.type !== 'count') throw new Error('expected a count item');
      expect(countItem.amount).toBeLessThanOrEqual(MAX_COUNT);

      const digits = generateOrder({
        ...input({ index: 3, introduced: { numbers: '8' } }),
        tracks: { numbers: bigNumbers, letters: allKnown(createTrack(1, LETTERS)) },
        rng: createRng(seed),
      });
      const digitItem = digits.items[0];
      if (digitItem?.type !== 'digit') throw new Error('expected a digit item');
      expect(digitItem.value).toBe(8); // the candle order takes it right away
    }
  });
});

describe('a new game with two letters', () => {
  const twoLetters = createTrack(1, ['O', 'S']);

  it('makes a shelf of two instead of three', () => {
    for (let seed = 0; seed < 30; seed += 1) {
      const order = generateOrder({
        settings: EMPTY_SETTINGS,
        tracks: { numbers: allKnown(createTrack(1, NUMBERS)), letters: twoLetters },
        index: 2,
        rng: createRng(seed),
      });
      const item = order.items[0];
      if (item?.type !== 'letter') throw new Error('expected a letter item');
      expect(item.choices).toHaveLength(2);
      expect(item.choices).toContain(item.letter);
      for (const choice of item.choices) expect(['O', 'S']).toContain(choice);
    }
  });
});
