import { describe, expect, it } from 'vitest';
import { countItemOf, MAX_COUNT } from './counting';
import { createRng } from './rng';
import { createSave, type StorageLike } from './save';
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
    const a = createSession(memoryStorage(), createRng(7));
    const b = createSession(memoryStorage(), createRng(7));
    expect(a.order).toEqual(b.order);
  });

  it('never writes to the storage', () => {
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
