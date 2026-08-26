import { describe, expect, it } from 'vitest';
import { CUSTOMERS, STARTER_CUSTOMERS, isCustomerId, type CustomerId } from '../data/customers';
import { createCustomerQueue } from './customers';
import { createRng } from './rng';

const ALL = STARTER_CUSTOMERS;

function run(count: number, seed: number, available: readonly CustomerId[] = ALL): CustomerId[] {
  const queue = createCustomerQueue({ available, rng: createRng(seed) });
  return Array.from({ length: count }, () => queue.next());
}

describe('customer data', () => {
  it('draws every starter and gives it a Czech name', () => {
    for (const id of ALL) {
      expect(CUSTOMERS[id].id).toBe(id);
      expect(CUSTOMERS[id].label.length).toBeGreaterThan(2);
    }
  });

  it('anchors the mouth inside the drawing, as a fraction of its box', () => {
    for (const id of ALL) {
      const { x, y } = CUSTOMERS[id].mouth;
      expect(x, id).toBeGreaterThan(0);
      expect(x, id).toBeLessThan(1);
      expect(y, id).toBeGreaterThan(0);
      expect(y, id).toBeLessThan(1);
    }
  });

  it('recognises its own ids and nothing else', () => {
    for (const id of ALL) expect(isCustomerId(id)).toBe(true);
    expect(isCustomerId('dog')).toBe(false);
    expect(isCustomerId('')).toBe(false);
    expect(isCustomerId('Bear')).toBe(false);
  });
});

describe('createCustomerQueue', () => {
  it('never sends the same animal straight back in', () => {
    for (let seed = 0; seed < 40; seed += 1) {
      const drawn = run(60, seed);
      for (let i = 1; i < drawn.length; i += 1) {
        expect(drawn[i], `seed ${seed} at ${i}: ${drawn.slice(i - 2, i + 1).join(' ')}`).not.toBe(
          drawn[i - 1],
        );
      }
    }
  });

  it('gives every animal exactly one turn per round', () => {
    // The complaint this fixes: over a short sitting one of the three never turned up.
    for (let seed = 0; seed < 40; seed += 1) {
      const drawn = run(9, seed);
      for (const start of [0, 3, 6]) {
        const round = drawn.slice(start, start + 3);
        expect(new Set(round).size, `seed ${seed}, round ${start / 3}: ${round.join(' ')}`).toBe(3);
      }
    }
  });

  it('shuffles the order inside a round instead of marching through a fixed cycle', () => {
    // Avoiding the last two would be fair but would lock the game into bear-rabbit-cat for ever.
    const orders = new Set(Array.from({ length: 60 }, (_, seed) => run(3, seed).join(' ')));
    expect(orders.size).toBeGreaterThan(1);
  });

  it('shares the orders out evenly over a long session', () => {
    const drawn = run(600, 11);
    for (const id of ALL) {
      const share = drawn.filter((who) => who === id).length;
      expect(share, `${id} came ${share} times out of 600`).toBe(200);
    }
  });

  it('lets the last animal standing come again rather than leaving the kitchen empty', () => {
    expect(run(4, 1, ['cat'])).toEqual(['cat', 'cat', 'cat', 'cat']);
  });

  it('falls back to the starters when it is offered nobody', () => {
    for (const picked of run(6, 3, [])) expect(ALL).toContain(picked);
  });

  it('repeats exactly with the same seed', () => {
    expect(run(12, 42)).toEqual(run(12, 42));
    expect(run(12, 42)).not.toEqual(run(12, 43));
  });
});
