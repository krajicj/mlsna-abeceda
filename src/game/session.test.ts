import { describe, expect, it } from 'vitest';
import { STARTER_CUSTOMERS } from '../data/customers';
import { STARTER_FRUITS } from '../data/curriculum';
import { CLOSED_MS, isClosed, NEW_SESSION, SESSION_ORDER_LIMIT } from './closing';
import { countItemOf, MAX_COUNT } from './counting';
import { createTrack, MASTERY_KNOWN } from './mastery';
import { elementOf, itemResult } from './progress';
import { createRng } from './rng';
import { createSave, parseSave, type SaveData, type StorageLike } from './save';
import { createSession } from './session';
import { SAVE_BACKUP_KEY, SAVE_KEY, SAVE_VERSION } from './version';

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
    expect(STARTER_FRUITS).toContain(item!.fruit);
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

  it('survives a broken record instead of throwing, and keeps it in the backup', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, '{ not json');
    storage.writes.length = 0;
    const session = createSession(storage);
    expect(session.order.index).toBe(1);
    // The save itself is still untouched; the unreadable text is only copied aside (rule 4).
    expect(storage.writes).toEqual([SAVE_BACKUP_KEY]);
    expect(storage.getItem(SAVE_BACKUP_KEY)).toBe('{ not json');
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
      lastPlayed: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) as unknown as string,
    });
    expect(parseSave(storage.getItem(SAVE_KEY))?.stars.earned).toBe(1);
  });

  it('scores the item of the order it is told about', () => {
    const storage = memoryStorage();
    const session = createSession(storage, { rng: createRng(11) });
    const item = session.order.items[0]!;
    session.complete([itemResult(item, 'first-try')]);
    const element = countItemOf({ index: 1, product: 'cake', items: [item] })?.amount;
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

describe('session – the end of a sitting (STEP-14)', () => {
  const AT = new Date(2026, 7, 24, 14, 0);
  const clock = (): Date => AT;

  it('closes the kitchen on the tenth order and not before', () => {
    const storage = memoryStorage();
    const session = createSession(storage, { now: clock });
    for (let index = 1; index < SESSION_ORDER_LIMIT; index += 1) {
      session.complete([]);
      expect(session.save.session.orders).toBe(index);
      expect(isClosed(session.save.session, AT.getTime())).toBe(false);
    }
    session.complete([]);
    expect(session.save.session.orders).toBe(SESSION_ORDER_LIMIT);
    expect(isClosed(session.save.session, AT.getTime())).toBe(true);
    // The record on the device knows it too, so a reload cannot walk around the shutter.
    expect(parseSave(storage.getItem(SAVE_KEY))?.session.closedUntil).toBe(
      AT.getTime() + CLOSED_MS,
    );
  });

  it('still writes the record exactly once per finished order', () => {
    const storage = memoryStorage();
    createSession(storage, { now: clock }).complete([]);
    expect(storage.writes).toEqual([SAVE_KEY]);
  });

  it('closes from the console for as long as it is asked to', () => {
    const storage = memoryStorage();
    const session = createSession(storage, { now: clock });
    session.close(60_000);
    expect(isClosed(session.save.session, AT.getTime())).toBe(true);
    expect(isClosed(session.save.session, AT.getTime() + 60_000)).toBe(false);
    expect(parseSave(storage.getItem(SAVE_KEY))?.session.closedUntil).toBe(AT.getTime() + 60_000);
    session.close();
    expect(session.save.session.closedUntil).toBe(AT.getTime() + CLOSED_MS);
  });

  it('reopens into a brand new sitting without touching what was learnt', () => {
    const storage = memoryStorage();
    const session = createSession(storage, { now: clock });
    for (let index = 0; index < SESSION_ORDER_LIMIT; index += 1) session.complete([]);
    const learnt = session.save;
    session.reopen();
    expect(session.save.session).toEqual(NEW_SESSION);
    expect(session.save.tracks).toEqual(learnt.tracks);
    expect(session.save.stars).toEqual(learnt.stars);
    expect(session.save.progress).toEqual(learnt.progress);
    expect(session.save.settings).toEqual(learnt.settings);
    expect(parseSave(storage.getItem(SAVE_KEY))?.session).toEqual(NEW_SESSION);

    // The next order is the first of the new sitting, and the kitchen stays open.
    session.complete([]);
    expect(session.save.session.orders).toBe(1);
    expect(isClosed(session.save.session, AT.getTime())).toBe(false);
  });

  it('starts a new sitting after a pause longer than the closing time', () => {
    let at = new Date(2026, 7, 24, 9, 0).getTime();
    const session = createSession(memoryStorage(), { now: () => new Date(at) });
    session.complete([]);
    session.complete([]);
    expect(session.save.session.orders).toBe(2);
    at += CLOSED_MS + 1;
    session.complete([]);
    expect(session.save.session.orders).toBe(1);
  });
});

describe('session – two-item orders (STEP-12)', () => {
  /** A save that is waiting for the order at `index` – nothing else about it is special. */
  function atOrder(index: number): SaveData {
    const base = createSave();
    return {
      ...base,
      progress: { ordersCompleted: index - 1, lastPlayed: null },
    };
  }

  it('hands the kitchen two items from the eleventh order on', () => {
    const session = createSession(memoryStorage(atOrder(11)), { rng: createRng(5) });
    expect(session.order.index).toBe(11);
    expect(session.order.items).toHaveLength(2);
    expect(session.order.items.filter((item) => item.type === 'letter')).toHaveLength(1);
  });

  it('remembers the elements of BOTH tracks and does not ask for them again', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const session = createSession(memoryStorage(atOrder(11)), { rng: createRng(seed) });
      const before = session.order.items.map(elementOf);
      session.complete([]);
      const after = session.order.items.map(elementOf);
      expect(after).toHaveLength(2);
      for (const element of after) expect(before).not.toContain(element);
    }
  });

  it('replays a whole seeded sitting across the boundary of the tenth order', () => {
    const run = (): string => {
      const session = createSession(memoryStorage(), { rng: createRng(17) });
      return JSON.stringify(
        Array.from({ length: 14 }, () => {
          const items = session.order.items;
          session.complete([]);
          return items;
        }),
      );
    };
    expect(run()).toBe(run());
  });

  it('stores nothing new for it – a two-item order has the same shape as any other', () => {
    const storage = memoryStorage(atOrder(11));
    const session = createSession(storage, { rng: createRng(3) });
    session.complete([]);
    const raw = storage.getItem(SAVE_KEY) ?? '';
    expect(parseSave(raw)?.version).toBe(SAVE_VERSION);
    expect(Object.keys(JSON.parse(raw) as object).sort()).toEqual([
      'pending',
      'progress',
      'session',
      'settings',
      'stars',
      'tracks',
      'version',
    ]);
  });
});

describe('session – a freshly introduced element', () => {
  const known = (elements: readonly string[]): Record<string, number> =>
    Object.fromEntries(elements.map((element) => [element, MASTERY_KNOWN]));

  /** A save whose letters are both mastered, so the next finished order introduces a third one. */
  function lettersReady(ordersCompleted: number): SaveData {
    const base = createSave();
    return {
      ...base,
      tracks: {
        numbers: base.tracks.numbers,
        letters: { level: 1, active: ['O', 'S'], scores: known(['O', 'S']) },
      },
      progress: { ordersCompleted, lastPlayed: null },
    };
  }

  /** The same for numbers: 1–5 known, so the next finished order opens Č2 with a six. */
  function numbersReady(ordersCompleted: number): SaveData {
    const base = createSave();
    const all = ['1', '2', '3', '4', '5'];
    return {
      ...base,
      tracks: {
        numbers: { level: 1, active: all, scores: known(all) },
        letters: base.tracks.letters,
      },
      progress: { ordersCompleted, lastPlayed: null },
    };
  }

  it('waits through an order of the other track and then becomes the target', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      // Position 2 is a letter, 3 a digit, 4 a letter again.
      const session = createSession(memoryStorage(lettersReady(1)), { rng: createRng(seed) });
      session.complete([]); // the letter order is done → 'T' joins the set
      expect(session.save.tracks.letters.active).toEqual(['O', 'S', 'T']);
      expect(session.order.items[0]?.type).toBe('digit'); // the numbers track goes first
      session.complete([]);
      const item = session.order.items[0];
      expect(item?.type).toBe('letter');
      if (item?.type !== 'letter') continue;
      expect(item.letter).toBe('T'); // held all the way to the letter order
    }
  });

  it('goes straight into the next order of its own track', () => {
    const session = createSession(memoryStorage(lettersReady(3)), { rng: createRng(6) });
    session.complete([]); // position 4 was a letter, position 5 is counting…
    session.complete([]); // …position 6 is a letter again
    const item = session.order.items[0];
    expect(item?.type).toBe('letter');
    if (item?.type !== 'letter') throw new Error('expected a letter item');
    expect(item.letter).toBe('T');
  });

  it('lets a digit above five wait for the candle instead of the cake', () => {
    for (let seed = 1; seed <= 10; seed += 1) {
      // Position 6 is a letter, 7 a digit – the six may be asked for right away.
      const digits = createSession(memoryStorage(numbersReady(5)), { rng: createRng(seed) });
      digits.complete([]);
      expect(digits.save.tracks.numbers.level).toBe(2);
      const digitItem = digits.order.items[0];
      expect(digitItem?.type).toBe('digit');
      if (digitItem?.type === 'digit') expect(digitItem.value).toBe(6);

      // Position 4 is a letter, 5 is counting – six pieces of fruit do not fit on the cake.
      const counting = createSession(memoryStorage(numbersReady(3)), { rng: createRng(seed) });
      counting.complete([]);
      const countItem = counting.order.items[0];
      expect(countItem?.type).toBe('count');
      if (countItem?.type === 'count') expect(countItem.amount).toBeLessThanOrEqual(MAX_COUNT);
      expect(counting.save.tracks.numbers.active).toContain('6');
    }
  });

  it('stores what the order it has just generated is really waiting for', () => {
    const storage = memoryStorage(lettersReady(1));
    const session = createSession(storage, { rng: createRng(3) });
    session.complete([]); // 'T' joins the set, but order 2 belongs to the numbers track
    expect(parseSave(storage.getItem(SAVE_KEY))?.version).toBe(SAVE_VERSION);
    expect(parseSave(storage.getItem(SAVE_KEY))?.pending.letters).toBe('T');

    session.complete([]); // order 3 is the letter order and asks for 'T'
    expect(session.order.items.map(elementOf)).toContain('T');
    // The record matches the order the child is holding: nothing is waiting any more.
    expect(parseSave(storage.getItem(SAVE_KEY))?.pending.letters).toBeNull();
  });

  it('keeps a waiting element across a reload (STEP-13)', () => {
    const storage = memoryStorage(lettersReady(1));
    createSession(storage, { rng: createRng(3) }).complete([]); // 'T' joins and has to wait
    expect(parseSave(storage.getItem(SAVE_KEY))?.pending.letters).toBe('T');

    // The reload: a brand new session over the same storage, a different seed – and the nudge
    // still lands, because it came back out of the record and not out of the old session.
    const reloaded = createSession(storage, { rng: createRng(11) });
    expect(reloaded.save.pending.letters).toBe('T');
    expect(reloaded.order.items[0]?.type).toBe('digit'); // order 2 belongs to the numbers track
    reloaded.complete([]);
    expect(reloaded.order.items.map(elementOf)).toContain('T');
    expect(parseSave(storage.getItem(SAVE_KEY))?.pending.letters).toBeNull();
  });

  it('is still reproducible from the same seed', () => {
    const run = (): string[] => {
      const session = createSession(memoryStorage(lettersReady(1)), { rng: createRng(31) });
      return Array.from({ length: 6 }, () => {
        const item = session.order.items[0];
        session.complete([]);
        return item === undefined ? '' : JSON.stringify(item);
      });
    };
    expect(run()).toEqual(run());
  });
});

describe('session.buy', () => {
  /** Only `complete()` and `buy()` write; a session that is merely opened writes nothing. */
  function withStars(earned: number): StorageLike & { readonly writes: string[] } {
    return memoryStorage({ ...createSave(), stars: { earned, purchases: {} } });
  }

  it('writes the purchase down and keeps the stars earned', () => {
    const storage = withStars(5);
    const session = createSession(storage);
    expect(session.buy('fruit.raspberry')).toBe(true);
    expect(session.save.stars).toEqual({ earned: 5, purchases: { 'fruit.raspberry': 3 } });
    const stored = parseSave(storage.getItem(SAVE_KEY) ?? '');
    expect(stored?.stars.purchases).toEqual({ 'fruit.raspberry': 3 });
  });

  it('writes nothing at all when the thing cannot be bought', () => {
    const storage = withStars(2);
    const session = createSession(storage);
    expect(session.buy('fruit.raspberry')).toBe(false); // two stars, the raspberry costs three
    expect(session.buy('fruit.banana')).toBe(false); // not in the catalogue
    expect(storage.writes).toEqual([]);
    expect(session.save.stars).toEqual({ earned: 2, purchases: {} });
  });

  it('refuses to charge for the same thing twice', () => {
    const session = createSession(withStars(9));
    expect(session.buy('fruit.raspberry')).toBe(true);
    expect(session.buy('fruit.raspberry')).toBe(false);
    expect(session.save.stars.purchases).toEqual({ 'fruit.raspberry': 3 });
  });

  it('lets the bought fruit into the orders that follow', () => {
    const session = createSession(withStars(9), { rng: createRng(3) });
    const before = Array.from({ length: 20 }, () => {
      const item = countItemOf(session.order);
      session.complete([]);
      return item?.fruit ?? null;
    });
    expect(before).not.toContain('raspberry');
    expect(session.buy('fruit.raspberry')).toBe(true);
    const after = Array.from({ length: 20 }, () => {
      const item = countItemOf(session.order);
      session.complete([]);
      return item?.fruit ?? null;
    });
    expect(after).toContain('raspberry');
  });

  it('leaves the order already on the counter alone', () => {
    const session = createSession(withStars(9), { rng: createRng(5) });
    const before = session.order;
    session.buy('fruit.raspberry');
    expect(session.order).toBe(before);
  });

  it('sends the bought animal in without a reload, and never before', () => {
    const session = createSession(withStars(9), { rng: createRng(11) });
    const before = Array.from({ length: 20 }, () => {
      const who = session.customer;
      session.complete([]);
      return who;
    });
    expect(before).not.toContain('frog');
    expect(session.buy('customer.frog')).toBe(true);
    const after = Array.from({ length: 20 }, () => {
      const who = session.customer;
      session.complete([]);
      return who;
    });
    expect(after).toContain('frog');
  });

  it('survives a reload – the purchase is read back with the record', () => {
    const storage = withStars(9);
    createSession(storage).buy('customer.frog');
    const next = createSession(storage);
    expect(next.save.stars.purchases).toEqual({ 'customer.frog': 5 });
  });
});

describe('which product the session asks for (STEP-17)', () => {
  it('makes the cake until the ice cream is bought', () => {
    const session = createSession(memoryStorage(), { rng: createRng(5) });
    expect(session.order.product).toBe('cake');
    for (let round = 0; round < 6; round += 1) {
      const item = session.order.items[0]!;
      expect(session.complete([itemResult(item, 'first-try')]).product).toBe('cake');
    }
  });

  it('lets the very next order use what was just bought, without a reload', () => {
    const session = createSession(
      memoryStorage({ ...createSave(), stars: { earned: 9, purchases: {} } }),
      { rng: createRng(3) },
    );
    expect(session.buy('product.icecream')).toBe(true);
    const seen = new Set<string>();
    for (let round = 0; round < 8; round += 1) {
      const item = session.order.items[0]!;
      seen.add(session.complete([itemResult(item, 'first-try')]).product);
    }
    expect(seen.has('icecream')).toBe(true);
  });

  it('does not ask for the same product twice running', () => {
    const session = createSession(
      memoryStorage({ ...createSave(), stars: { earned: 9, purchases: {} } }),
      { rng: createRng(8) },
    );
    session.buy('product.icecream');
    let previous = session.order.product;
    for (let round = 0; round < 10; round += 1) {
      const item = session.order.items[0]!;
      const next = session.complete([itemResult(item, 'first-try')]);
      expect(next.product).not.toBe(previous);
      previous = next.product;
    }
  });
});
