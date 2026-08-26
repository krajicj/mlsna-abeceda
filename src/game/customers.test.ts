import { describe, expect, it } from 'vitest';
import { CUSTOMERS, STARTER_CUSTOMERS, isCustomerId, type CustomerId } from '../data/customers';
import { nextCustomer } from './customers';
import { createRng } from './rng';

const ALL = STARTER_CUSTOMERS;

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

describe('nextCustomer', () => {
  it('never sends the same animal straight back in', () => {
    const rng = createRng(7);
    let previous: CustomerId | null = null;
    for (let i = 0; i < 300; i += 1) {
      const next = nextCustomer({ available: ALL, avoid: previous, rng });
      expect(next).not.toBe(previous);
      previous = next;
    }
  });

  it('lets the last animal standing come twice rather than leaving the kitchen empty', () => {
    expect(nextCustomer({ available: ['cat'], avoid: 'cat' })).toBe('cat');
  });

  it('falls back to the starters when it is offered nobody', () => {
    const picked = nextCustomer({ available: [], rng: createRng(3) });
    expect(ALL).toContain(picked);
  });

  it('falls back to the starters even while avoiding somebody', () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const picked = nextCustomer({ available: [], avoid: 'bear', rng: createRng(seed) });
      expect(picked).not.toBe('bear');
      expect(ALL).toContain(picked);
    }
  });

  it('repeats exactly with the same seed', () => {
    const draw = (): CustomerId[] => {
      const rng = createRng(42);
      let previous: CustomerId | null = null;
      return Array.from({ length: 12 }, () => {
        previous = nextCustomer({ available: ALL, avoid: previous, rng });
        return previous;
      });
    };
    expect(draw()).toEqual(draw());
  });

  it('lets every animal have a turn', () => {
    const rng = createRng(11);
    const seen = new Set<CustomerId>();
    let previous: CustomerId | null = null;
    for (let i = 0; i < 600; i += 1) {
      previous = nextCustomer({ available: ALL, avoid: previous, rng });
      seen.add(previous);
    }
    expect([...seen].sort()).toEqual([...ALL].sort());
  });

  it('ignores an avoid that is not on offer', () => {
    const picked = nextCustomer({ available: ['bear', 'rabbit'], avoid: 'cat', rng: createRng(5) });
    expect(['bear', 'rabbit']).toContain(picked);
  });
});
