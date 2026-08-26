import { describe, expect, it } from 'vitest';
import { STARTER_CUSTOMERS } from '../data/customers';
import { countItemOf, MAX_COUNT } from './counting';
import { createTrack } from './mastery';
import { itemResult } from './progress';
import { createRng } from './rng';
import { createSave, parseSave, type SaveData, type StorageLike } from './save';
import { createSession } from './session';
import { SAVE_KEY } from './version';

function memoryStorage(initial?: unknown): StorageLike & { readonly writes: string[] } {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(SAVE_KEY, JSON.stringify(initial));
  const writes: string[] = [];
  return {
    writes,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      writes.push(key);
      map.set(key, value);
    },
    removeItem: (key) => void map.delete(key),
  };
}

/** A track with exactly two elements, so "not the same one twice in a row" has a real choice. */
function twoElementSave(): SaveData {
  const base = createSave();
  return {
    ...base,
    tracks: {
      numbers: createTrack(1, ['2', '3']),
      letters: createTrack(1, base.tracks.letters.active.slice(0, 2)),
    },
  };
}

describe('createSession', () => {
  it('starts a brand new game with a counting order', () => {
    const session = createSession(memoryStorage());
    expect(session.order.index).toBe(1);
    expect(session.order.items).toHaveLength(1);
    const item = countItemOf(session.order);
    expect(item).not.toBeNull();
    expect(item!.amount).toBeGreaterThanOrEqual(1);
    expect(item!.amount).toBeLessThanOrEqual(MAX_COUNT);
    expect(['strawberry', 'blueberry', 'cherry']).toContain(item!.fruit);
  });

  it('continues where the saved progress left off', () => {
    const saved = { ...createSave(), progress: { ordersCompleted: 2, stars: 2, lastPlayed: null } };
    const session = createSession(memoryStorage(saved));
    expect(session.order.index).toBe(3);
    expect(session.save.progress.ordersCompleted).toBe(2);
  });

  it('is reproducible with a seeded rng', () => {
    const a = createSession(memoryStorage(), { rng: createRng(7) });
    const b = createSession(memoryStorage(), { rng: createRng(7) });
    expect(a.order).toEqual(b.order);
  });

  it('never writes to the storage before an order is finished', () => {
    const storage = memoryStorage();
    createSession(storage);
    expect(storage.writes).toEqual([]);
  });

  it('survives a broken record instead of throwing', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, '{ not json');
    storage.writes.length = 0;
    const session = createSession(storage);
    expect(session.order.index).toBe(1);
    expect(storage.writes).toEqual([]);
  });
});

describe('session.complete', () => {
  it('writes the record exactly once and hands back a new save', () => {
    const storage = memoryStorage();
    const session = createSession(storage);
    const before = session.save;
    session.complete([]);
    expect(storage.writes).toEqual([SAVE_KEY]);
    expect(session.save).not.toBe(before);
    expect(session.save.progress).toEqual({
      ordersCompleted: 1,
      stars: 1,
      lastPlayed: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) as unknown as string,
    });
    expect(parseSave(storage.getItem(SAVE_KEY))?.progress.stars).toBe(1);
  });

  it('scores the item of the order it is told about', () => {
    const storage = memoryStorage();
    const session = createSession(storage, { rng: createRng(11) });
    const item = session.order.items[0]!;
    session.complete([itemResult(item, 'first-try')]);
    const element = countItemOf({ index: 1, items: [item] })?.amount;
    expect(session.save.tracks.numbers.scores[String(element)]).toBe(1);
  });

  it('moves on to the next position in the session', () => {
    const session = createSession(memoryStorage());
    const next = session.complete([]);
    expect(next.index).toBe(2);
    expect(session.order).toBe(next);
    expect(next.index).toBe(session.save.progress.ordersCompleted + 1);
    expect(session.complete([]).index).toBe(3);
  });

  it('does not ask for the same element or the same fruit twice in a row', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const session = createSession(memoryStorage(twoElementSave()), { rng: createRng(seed) });
      const first = session.order.items[0]!;
      // Position 1 is counting, 2 is a letter, 3 is a digit – so compare over the numbers track.
      session.complete([]);
      session.complete([]);
      const third = session.order.items[0]!;
      expect(first.type).toBe('count');
      expect(third.type).toBe('digit');
      if (first.type !== 'count' || third.type !== 'digit') continue;
      expect(String(third.value)).not.toBe(String(first.amount));
    }
  });

  it('avoids the fruit of the last counting order', () => {
    // Counting comes back only every fourth order (1 count, 2 letter, 3 digit, 4 letter, 5 count),
    // so the fruit is remembered across the orders in between.
    const session = createSession(memoryStorage(), { rng: createRng(5) });
    const first = countItemOf(session.order);
    for (let round = 0; round < 4; round += 1) session.complete([]);
    const fifth = countItemOf(session.order);
    expect(first).not.toBeNull();
    expect(fifth).not.toBeNull();
    expect(fifth!.fruit).not.toBe(first!.fruit);
  });

  it('stamps the day from the injected clock', () => {
    const session = createSession(memoryStorage(), { now: () => new Date(2026, 0, 9, 20, 30) });
    session.complete([]);
    expect(session.save.progress.lastPlayed).toBe('2026-01-09');
  });

  it('opens with one of the starter customers', () => {
    const session = createSession(memoryStorage(), { rng: createRng(4) });
    expect(STARTER_CUSTOMERS).toContain(session.customer);
  });

  it('sends a different animal in after every order', () => {
    const session = createSession(memoryStorage(), { rng: createRng(9) });
    let previous = session.customer;
    for (let i = 0; i < 20; i += 1) {
      session.complete([]);
      expect(session.customer).not.toBe(previous);
      previous = session.customer;
    }
  });

  it('shows all three animals inside any three orders', () => {
    // The complaint that started this rule: over a short sitting the bear never turned up.
    for (let seed = 0; seed < 30; seed += 1) {
      const session = createSession(memoryStorage(), { rng: createRng(seed) });
      const window = Array.from({ length: 3 }, () => {
        const who = session.customer;
        session.complete([]);
        return who;
      });
      expect(new Set(window).size, `seed ${seed}: ${window.join(' ')}`).toBe(3);
    }
  });

  it('replays the same customers from the same seed', () => {
    const run = (): string[] => {
      const session = createSession(memoryStorage(), { rng: createRng(21) });
      return Array.from({ length: 8 }, () => {
        const who = session.customer;
        session.complete([]);
        return who;
      });
    };
    expect(run()).toEqual(run());
  });

  it('keeps the customer out of the save – a reload may bring anybody', () => {
    const storage = memoryStorage();
    const session = createSession(storage, { rng: createRng(2) });
    session.complete([]);
    expect(storage.getItem(SAVE_KEY) ?? '').not.toContain(session.customer);
  });

  it('keeps the loop running when the storage refuses to write', () => {
    const storage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => undefined,
    };
    const session = createSession(storage);
    const next = session.complete([]);
    expect(next.index).toBe(2);
    expect(session.save.progress.ordersCompleted).toBe(1);
  });
});
