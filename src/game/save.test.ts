import { describe, expect, it } from 'vitest';
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
import { SAVE_KEY, SAVE_VERSION } from './version';

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
    expect(save.progress).toEqual({ ordersCompleted: 0, stars: 0, lastPlayed: null });
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
    expect(save.progress).toEqual({ ordersCompleted: 7, stars: 0, lastPlayed: null });
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
      progress: { ordersCompleted: 3, stars: 3, lastPlayed: '2026-08-24' },
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
});
