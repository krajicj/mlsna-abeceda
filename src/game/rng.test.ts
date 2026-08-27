import { describe, expect, it } from 'vitest';
import { createRng, pick, pickWeighted, sample, shuffle } from './rng';

describe('createRng', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const first = [a(), a(), a(), a(), a()];
    const second = [b(), b(), b(), b(), b()];
    expect(first).toEqual(second);
  });

  it('gives a different sequence for a different seed', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  it('stays inside [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 200; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('pick', () => {
  it('returns an item of the array', () => {
    const items = ['A', 'B', 'C'];
    const rng = createRng(3);
    for (let i = 0; i < 50; i += 1) expect(items).toContain(pick(rng, items));
  });

  it('throws on an empty array', () => {
    expect(() => pick(createRng(1), [])).toThrow(RangeError);
  });

  it('survives a broken rng that returns 1 or NaN', () => {
    expect(pick(() => 1, ['A', 'B'])).toBe('B');
    expect(pick(() => Number.NaN, ['A', 'B'])).toBe('A');
  });
});

describe('sample', () => {
  it('never repeats an item', () => {
    const result = sample(createRng(9), ['A', 'B', 'C', 'D'], 3);
    expect(result).toHaveLength(3);
    expect(new Set(result).size).toBe(3);
  });

  it('returns fewer items than asked when there are not enough', () => {
    expect(sample(createRng(9), ['A', 'B'], 5)).toHaveLength(2);
  });

  it('returns nothing for a non-positive count', () => {
    expect(sample(createRng(9), ['A', 'B'], 0)).toEqual([]);
  });
});

describe('shuffle', () => {
  it('keeps the same items', () => {
    const items = ['A', 'B', 'C', 'D', 'E'];
    const result = shuffle(createRng(5), items);
    expect([...result].sort()).toEqual([...items].sort());
    expect(items).toEqual(['A', 'B', 'C', 'D', 'E']); // input untouched
  });

  it('does change the order at least sometimes', () => {
    const items = ['A', 'B', 'C', 'D', 'E'];
    const rng = createRng(11);
    const orders = new Set(Array.from({ length: 20 }, () => shuffle(rng, items).join('')));
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe('pickWeighted', () => {
  /** How often each item came up over `rounds` picks. */
  const counts = (
    items: readonly string[],
    weight: (item: string) => number,
    rounds = 4000,
  ): ((item: string) => number) => {
    const rng = createRng(3);
    const seen = new Map<string, number>(items.map((item) => [item, 0]));
    for (let i = 0; i < rounds; i += 1) {
      const item = pickWeighted(rng, items, weight);
      seen.set(item, (seen.get(item) ?? 0) + 1);
    }
    return (item) => seen.get(item) ?? 0;
  };

  it('follows the weights over a long run', () => {
    // A weighs 3, B and C weigh 1 → A comes up about 3/5 of the time, B and C about 1/5 each.
    const seen = counts(['A', 'B', 'C'], (item) => (item === 'A' ? 3 : 1));
    expect(seen('A') / 4000).toBeGreaterThan(0.55);
    expect(seen('A') / 4000).toBeLessThan(0.65);
    expect(seen('B') / 4000).toBeGreaterThan(0.15);
    expect(seen('C') / 4000).toBeGreaterThan(0.15);
  });

  it('never returns an item whose weight is zero', () => {
    const seen = counts(['A', 'B'], (item) => (item === 'A' ? 1 : 0));
    expect(seen('B')).toBe(0);
    expect(seen('A')).toBe(4000);
  });

  it('falls back to a uniform pick when every weight is zero or NaN', () => {
    const zero = counts(['A', 'B'], () => 0);
    expect(zero('A')).toBeGreaterThan(0);
    expect(zero('B')).toBeGreaterThan(0);
    const nan = counts(['A', 'B'], () => Number.NaN);
    expect(nan('A') + nan('B')).toBe(4000);
  });

  it('always gives the only item of a one-element array', () => {
    expect(pickWeighted(createRng(1), ['A'], () => 0)).toBe('A');
    expect(pickWeighted(createRng(1), ['A'], () => 5)).toBe('A');
  });

  it('never returns undefined, not even for a broken rng', () => {
    for (const rng of [() => 1, () => Number.NaN, () => -1, () => 0.999999999]) {
      expect(['A', 'B', 'C']).toContain(pickWeighted(rng, ['A', 'B', 'C'], () => 1));
    }
  });

  it('throws on an empty array, like pick', () => {
    expect(() => pickWeighted(createRng(1), [], () => 1)).toThrow(RangeError);
  });

  it('repeats the same choices for the same seed', () => {
    const run = (): string[] => {
      const rng = createRng(17);
      return Array.from({ length: 10 }, () =>
        pickWeighted(rng, ['A', 'B', 'C'], (item) => (item === 'B' ? 3 : 1)),
      );
    };
    expect(run()).toEqual(run());
  });
});
