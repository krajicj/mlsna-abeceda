import { describe, expect, it } from 'vitest';
import { createRng, pick, sample, shuffle } from './rng';

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
