import { describe, expect, it } from 'vitest';
import { NEW_SESSION } from './closing';
import { LEVEL1_INITIAL_LETTERS } from './curriculum';
import {
  createSave,
  parseSave,
  readSave,
  resetSave,
  withSettings,
  writeSave,
  type SaveData,
  type StorageLike,
} from './save';
import { EMPTY_SETTINGS, type Settings } from './settings';
import { SAVE_BACKUP_KEY, SAVE_KEY, SAVE_VERSION } from './version';

const SETTINGS: Settings = {
  child: { name: 'Anička', vocative: 'Aničko' },
  family: [{ name: 'Lenka', role: 'mother' }],
};

function memoryStorage(initial?: string): StorageLike & { readonly map: Map<string, string> } {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(SAVE_KEY, initial);
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error('storage is blocked');
  },
  setItem: () => {
    throw new Error('quota exceeded');
  },
  removeItem: () => {
    throw new Error('storage is blocked');
  },
};

describe('createSave', () => {
  it('starts on stage 1 with numbers 1–5 and two letters', () => {
    const save = createSave(SETTINGS);
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.tracks.numbers.active).toEqual(['1', '2', '3', '4', '5']);
    // The rest of the P1 pool joins one by one, as the first two are learnt (STEP-11).
    expect(save.tracks.letters.active).toEqual(['A', 'N']);
    expect(save.tracks.letters.active).toHaveLength(LEVEL1_INITIAL_LETTERS);
    expect(save.tracks.letters.scores).toEqual({ A: 0, N: 0 });
    expect(save.progress).toEqual({ ordersCompleted: 0, lastPlayed: null });
    expect(save.stars).toEqual({ earned: 0, purchases: {} });
    expect(save.pending).toEqual({ numbers: null, letters: null });
  });

  it('starts with a sitting that has not begun', () => {
    expect(createSave(SETTINGS).session).toEqual(NEW_SESSION);
  });

  it('works with no settings', () => {
    expect(createSave().tracks.letters.active).toEqual(['O', 'S']);
  });

  it('keeps a saved four-letter set – only a brand new game starts small', () => {
    const played = JSON.stringify({
      ...createSave(),
      tracks: {
        numbers: createSave().tracks.numbers,
        letters: { level: 1, active: ['O', 'S', 'T', 'A'], scores: { O: 3, S: 2, T: 1, A: 0 } },
      },
    });
    const save = parseSave(played);
    expect(save?.version).toBe(SAVE_VERSION);
    expect(save?.tracks.letters.active).toEqual(['O', 'S', 'T', 'A']);
  });
});

describe('parseSave', () => {
  it('returns null for nothing, rubbish or another version', () => {
    expect(parseSave(null)).toBeNull();
    expect(parseSave('')).toBeNull();
    expect(parseSave('{oops')).toBeNull();
    expect(parseSave('[]')).toBeNull();
    expect(parseSave('"kk"')).toBeNull();
    expect(parseSave(JSON.stringify({ version: 99 }))).toBeNull();
  });

  it('repairs a record of the right version instead of throwing it away', () => {
    const raw = JSON.stringify({
      version: SAVE_VERSION,
      settings: { child: { name: 'Anička' }, family: [{ name: 'Lenka', role: 'mother' }] },
      tracks: {
        numbers: { level: 0, active: ['1', '2', 'x'], scores: { '1': 99, '2': -4, x: 3 } },
        letters: { level: 9, active: ['A', 'N', 'ZZ'], scores: { A: 2 } },
      },
      progress: { ordersCompleted: 7.6, stars: -3, lastPlayed: 'včera' },
    });
    const save = parseSave(raw);
    expect(save).not.toBeNull();
    if (!save) return;
    expect(save.settings.child?.vocative).toBe('Anička');
    expect(save.tracks.numbers.level).toBe(1);
    expect(save.tracks.numbers.active).toEqual(['1', '2']);
    expect(save.tracks.numbers.scores).toEqual({ '1': 5, '2': 0 });
    expect(save.tracks.letters.level).toBe(5); // clamped from 9
    expect(save.tracks.letters.active).toEqual(['A', 'N']);
    expect(save.tracks.letters.scores).toEqual({ A: 2, N: 0 });
    expect(save.progress).toEqual({ ordersCompleted: 7, lastPlayed: null });
  });

  it('rebuilds a track whose active set is unusable, keeping the stage', () => {
    const raw = JSON.stringify({
      version: SAVE_VERSION,
      settings: {},
      tracks: { numbers: { level: 2, active: 'nonsense' }, letters: {} },
    });
    const save = parseSave(raw);
    expect(save?.tracks.numbers.level).toBe(2);
    expect(save?.tracks.numbers.active).toHaveLength(10);
    expect(save?.tracks.letters.active).toEqual(['O', 'S', 'T', 'A']);
  });

  it('keeps a valid record as it is', () => {
    const save = createSave(SETTINGS);
    expect(parseSave(JSON.stringify(save))).toEqual(save);
  });
});

describe('readSave / writeSave / resetSave', () => {
  it('gives a fresh game for empty or broken storage', () => {
    expect(readSave(memoryStorage()).progress.ordersCompleted).toBe(0);
    expect(readSave(memoryStorage('{oops')).tracks.letters.active).toEqual(['O', 'S']);
  });

  it('survives storage that throws on every call', () => {
    expect(() => readSave(throwingStorage)).not.toThrow();
    expect(() => writeSave(throwingStorage, createSave())).not.toThrow();
    expect(() => resetSave(throwingStorage)).not.toThrow();
  });

  it('writes under the save key and reads the same thing back', () => {
    const storage = memoryStorage();
    const save: SaveData = {
      ...createSave(SETTINGS),
      progress: { ordersCompleted: 3, lastPlayed: '2026-08-24' },
      stars: { earned: 3, purchases: { 'toy.ball': 2 } },
    };
    writeSave(storage, save);
    expect(storage.map.has(SAVE_KEY)).toBe(true);
    expect(readSave(storage)).toEqual(save);
  });

  it('forgets everything on reset', () => {
    const storage = memoryStorage();
    writeSave(storage, createSave(SETTINGS));
    const fresh = resetSave(storage);
    expect(storage.map.has(SAVE_KEY)).toBe(false);
    expect(fresh.settings).toEqual(EMPTY_SETTINGS);
    expect(fresh.progress.ordersCompleted).toBe(0);
    expect(fresh.tracks.letters.active).toEqual(['O', 'S']);
  });
});

describe('parseSave – a record of the older format (v1)', () => {
  /** The v1 record from docs/steps/STEP-13-mergeable-save-format.md. */
  const V1 = JSON.stringify({
    version: 1,
    settings: { child: null, family: [] },
    tracks: {
      numbers: { level: 1, active: ['1', '2', '3'], scores: { '1': 5, '2': 2, '3': 0 } },
      letters: { level: 1, active: ['O', 'S'], scores: { O: 3, S: 1 } },
    },
    progress: { ordersCompleted: 7, stars: 7, lastPlayed: '2026-08-20' },
  });

  it('lifts it instead of starting a new game – nothing is lost', () => {
    const save = parseSave(V1);
    expect(save?.version).toBe(SAVE_VERSION);
    expect(save?.tracks.numbers.scores).toEqual({ '1': 5, '2': 2, '3': 0 });
    expect(save?.tracks.letters.scores).toEqual({ O: 3, S: 1 });
    expect(save?.progress).toEqual({ ordersCompleted: 7, lastPlayed: '2026-08-20' });
    expect(save?.stars).toEqual({ earned: 7, purchases: {} });
    expect(save?.pending).toEqual({ numbers: null, letters: null });
    // The sitting is new in STEP-14 and came without a version bump: a record that never heard of
    // it simply starts its first sitting.
    expect(save?.session).toEqual(NEW_SESSION);
  });

  it('is stored back as v2 under the same key', () => {
    const storage = memoryStorage(V1);
    writeSave(storage, readSave(storage));
    expect([...storage.map.keys()]).toEqual([SAVE_KEY]);
    expect((JSON.parse(storage.map.get(SAVE_KEY) ?? '') as { version: number }).version).toBe(2);
  });
});

describe('parseSave – repairing the parts new in v2', () => {
  const withStars = (stars: unknown): SaveData | null =>
    parseSave(JSON.stringify({ ...createSave(), stars }));

  it('starts the stars over when they make no sense, and keeps the rest of the record', () => {
    for (const stars of [undefined, 'x', [], { earned: -5 }, { earned: 'x', purchases: [] }]) {
      const save = withStars(stars);
      expect(save?.stars).toEqual({ earned: 0, purchases: {} });
      expect(save?.tracks.letters.active).toEqual(['O', 'S']); // the record itself survived
    }
  });

  it('keeps a bought item whose price is unreadable rather than taking it away', () => {
    const save = withStars({ earned: 4, purchases: { 'toy.ball': 'free', 'toy.kite': 2 } });
    expect(save?.stars.purchases).toEqual({ 'toy.ball': 0, 'toy.kite': 2 });
  });

  it('drops a pending element the track cannot ask about', () => {
    const raw = JSON.stringify({ ...createSave(), pending: { numbers: '9', letters: 'S' } });
    // 'S' is in play, '9' is not (stage 1 counts to five).
    expect(parseSave(raw)?.pending).toEqual({ numbers: null, letters: 'S' });
  });

  it('takes anything but a string as nothing at all', () => {
    const raw = JSON.stringify({ ...createSave(), pending: { numbers: 3, letters: [] } });
    expect(parseSave(raw)?.pending).toEqual({ numbers: null, letters: null });
  });
});

describe('parseSave – the sitting (STEP-14)', () => {
  const withSession = (session: unknown): SaveData | null =>
    parseSave(JSON.stringify({ ...createSave(), session }));

  const CLOSED = {
    orders: 10,
    lastOrderAt: 1_756_296_000_000,
    closedFrom: 1_756_296_000_000,
    closedUntil: 1_756_303_200_000,
  };

  it('keeps a whole sitting as it stands', () => {
    expect(withSession(CLOSED)?.session).toEqual(CLOSED);
  });

  it('starts a new sitting when the field is missing or unreadable, and keeps the record', () => {
    for (const session of [undefined, null, 'x', [], 42]) {
      const save = withSession(session);
      expect(save?.session).toEqual(NEW_SESSION);
      expect(save?.tracks.letters.active).toEqual(['O', 'S']); // the record itself survived
      expect(save?.version).toBe(SAVE_VERSION); // the field arrived without a version bump
    }
  });

  it('repairs one broken field without taking the healthy ones with it', () => {
    const save = withSession({ ...CLOSED, lastOrderAt: -5, orders: 'x' });
    expect(save?.session).toEqual({ ...CLOSED, lastOrderAt: 0, orders: 0 });
  });

  it('survives a round trip through the storage', () => {
    const storage = memoryStorage();
    writeSave(storage, { ...createSave(), session: CLOSED });
    expect(readSave(storage).session).toEqual(CLOSED);
  });
});

describe('readSave – the backup of a record that cannot be read', () => {
  it('keeps the raw text and starts a new game', () => {
    for (const raw of ['{{{', '"kk"', JSON.stringify({ version: 99, tracks: {} })]) {
      const storage = memoryStorage(raw);
      expect(readSave(storage).progress.ordersCompleted).toBe(0);
      expect(storage.map.get(SAVE_BACKUP_KEY)).toBe(raw);
      // The save itself is left where it was until the game writes its first order.
      expect(storage.map.get(SAVE_KEY)).toBe(raw);
    }
  });

  it('keeps only the latest one – it is a rescue copy, not an archive', () => {
    const storage = memoryStorage('{{{');
    readSave(storage);
    storage.map.set(SAVE_KEY, '}}}');
    readSave(storage);
    expect(storage.map.get(SAVE_BACKUP_KEY)).toBe('}}}');
  });

  it('does not back up a record it could read, nor an empty storage', () => {
    const readable = memoryStorage(JSON.stringify(createSave(SETTINGS)));
    readSave(readable);
    expect(readable.map.has(SAVE_BACKUP_KEY)).toBe(false);
    const empty = memoryStorage();
    readSave(empty);
    expect(empty.map.has(SAVE_BACKUP_KEY)).toBe(false);
  });

  it('leaves the backup alone on reset – it belongs to a record the reset never saw', () => {
    const storage = memoryStorage('{{{');
    readSave(storage);
    resetSave(storage);
    expect(storage.map.get(SAVE_BACKUP_KEY)).toBe('{{{');
  });
});

describe('withSettings', () => {
  it('rebuilds the letter set from the new order and keeps what stayed', () => {
    const before: SaveData = {
      ...createSave(),
      tracks: {
        numbers: createSave().tracks.numbers,
        letters: { level: 1, active: ['O', 'S', 'T', 'A'], scores: { O: 4, S: 2, T: 1, A: 5 } },
      },
    };
    const after = withSettings(before, SETTINGS);
    expect(after.settings).toEqual(SETTINGS);
    expect(after.tracks.letters.active).toEqual(['A', 'N', 'I', 'K']);
    expect(after.tracks.letters.scores).toEqual({ A: 5, N: 0, I: 0, K: 0 }); // A stayed with its score
    expect(after.tracks.numbers).toEqual(before.tracks.numbers);
    expect(after.progress).toEqual(before.progress);
  });

  it('keeps the size of the set, not just the first four letters', () => {
    const before: SaveData = {
      ...createSave(),
      tracks: {
        numbers: createSave().tracks.numbers,
        letters: { level: 2, active: ['O', 'S', 'T', 'A', 'M'], scores: { A: 3 } },
      },
    };
    const after = withSettings(before, SETTINGS);
    expect(after.tracks.letters.active).toHaveLength(5);
    expect(after.tracks.letters.active.slice(0, 4)).toEqual(['A', 'N', 'I', 'K']);
  });

  it('goes back to a neutral set when the settings are cleared', () => {
    const withName = createSave(SETTINGS);
    expect(withSettings(withName, EMPTY_SETTINGS).tracks.letters.active).toEqual(['O', 'S']);
  });

  it('forgets a pending letter that the new order dropped from the set', () => {
    const before: SaveData = { ...createSave(), pending: { numbers: '3', letters: 'S' } };
    const after = withSettings(before, SETTINGS); // 'S' is not in the new letter order
    expect(after.pending).toEqual({ numbers: '3', letters: null });
  });
});
