import { describe, expect, it } from 'vitest';
import { migrateRecord } from './migrate';
import { parseSave } from './save';
import { SAVE_VERSION } from './version';

/** The v1 record from the plan (docs/steps/STEP-13-mergeable-save-format.md). */
function v1(): Record<string, unknown> {
  return {
    version: 1,
    settings: { child: null, family: [] },
    tracks: {
      numbers: { level: 1, active: ['1', '2', '3'], scores: { '1': 5, '2': 2, '3': 0 } },
      letters: { level: 1, active: ['O', 'S'], scores: { O: 3, S: 1 } },
    },
    progress: { ordersCompleted: 7, stars: 7, lastPlayed: '2026-08-20' },
  };
}

describe('migrateRecord – v1 to v2', () => {
  it('turns the star balance into what was earned and adds an empty pending', () => {
    const migrated = migrateRecord(v1());
    expect(migrated).toEqual({
      version: 2,
      settings: { child: null, family: [] },
      tracks: v1()['tracks'],
      progress: { ordersCompleted: 7, lastPlayed: '2026-08-20' },
      stars: { earned: 7, purchases: {} },
      pending: { numbers: null, letters: null },
    });
  });

  it('never mutates the record it is given', () => {
    const record = v1();
    const before = JSON.parse(JSON.stringify(record)) as unknown;
    migrateRecord(record);
    expect(record).toEqual(before);
  });

  it('leaves a record that is already current exactly as it is', () => {
    const current = { version: SAVE_VERSION, anything: 'kept' };
    expect(migrateRecord(current)).toEqual(current);
  });

  it('gives up on a version there is no way from', () => {
    expect(migrateRecord({ version: 99 })).toBeNull(); // a newer build
    expect(migrateRecord({ version: '1' })).toBeNull();
    expect(migrateRecord({ version: 1.5 })).toBeNull();
    expect(migrateRecord({})).toBeNull();
    expect(migrateRecord({ version: 0 })).toBeNull(); // no step lifts from 0
  });
});

describe('migrateRecord – a v1 record with a broken inside', () => {
  const broken: readonly unknown[] = [undefined, 'x', [], 42, null];

  it('never throws, whatever `progress` turns out to be', () => {
    for (const progress of broken) {
      expect(() => migrateRecord({ version: 1, progress })).not.toThrow();
      expect(migrateRecord({ version: 1, progress })?.['version']).toBe(2);
    }
  });

  it('hands the repairs a record they can work with', () => {
    const save = parseSave(JSON.stringify({ version: 1, progress: 'x' }));
    expect(save).not.toBeNull();
    expect(save?.version).toBe(SAVE_VERSION);
    expect(save?.stars).toEqual({ earned: 0, purchases: {} });
    expect(save?.progress).toEqual({ ordersCompleted: 0, lastPlayed: null });
    // Nothing readable was left, so each track starts over from the pool of its stage – the
    // record survived, which is the whole point.
    expect(save?.tracks.letters.active).toEqual(['O', 'S', 'T', 'A']);
  });

  it('carries a nonsense star balance over for the repairs to sort out', () => {
    const save = parseSave(
      JSON.stringify({ version: 1, progress: { ordersCompleted: 3, stars: 'lots' } }),
    );
    expect(save?.stars).toEqual({ earned: 0, purchases: {} });
    expect(save?.progress.ordersCompleted).toBe(3);
  });
});
