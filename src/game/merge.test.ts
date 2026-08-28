import { describe, expect, it } from 'vitest';
import { ownedDecorations, unlockedFruits } from './shop';
import { NEW_SESSION, type SessionState } from './closing';
import { mergePending, mergeSave, mergeStars, mergeTrack } from './merge';
import { createSave, type SaveData } from './save';
import type { StarsState } from './stars';
import { SAVE_VERSION } from './version';

/** The pair from the plan: a tablet and a notebook that have both been played on. */
function tablet(): SaveData {
  const base = createSave();
  return {
    ...base,
    tracks: {
      numbers: base.tracks.numbers,
      letters: { level: 1, active: ['O', 'S'], scores: { O: 4, S: 1 } },
    },
    progress: { ordersCompleted: 7, lastPlayed: '2026-08-20' },
    stars: { earned: 7, purchases: {} },
    pending: { numbers: null, letters: null },
  };
}

function notebook(): SaveData {
  const base = createSave();
  return {
    ...base,
    tracks: {
      numbers: base.tracks.numbers,
      letters: { level: 1, active: ['O', 'S', 'T'], scores: { O: 2, S: 3, T: 1 } },
    },
    progress: { ordersCompleted: 5, lastPlayed: '2026-08-22' },
    stars: { earned: 5, purchases: { 'fruit.banana': 3 } },
    pending: { numbers: null, letters: null },
  };
}

describe('mergeStars', () => {
  it('takes the higher total earned', () => {
    expect(mergeStars({ earned: 7, purchases: {} }, { earned: 5, purchases: {} }).earned).toBe(7);
  });

  it('keeps everything either side bought', () => {
    const merged = mergeStars(
      { earned: 9, purchases: { a: 1 } },
      { earned: 9, purchases: { b: 2 } },
    );
    expect(merged.purchases).toEqual({ a: 1, b: 2 });
  });

  it('keeps the higher price for the same item – a merge must not make stars out of nothing', () => {
    const local: StarsState = { earned: 9, purchases: { a: 4 } };
    const incoming: StarsState = { earned: 9, purchases: { a: 1 } };
    expect(mergeStars(local, incoming).purchases['a']).toBe(4);
    expect(mergeStars(incoming, local).purchases['a']).toBe(4);
  });

  it('never mutates either side', () => {
    const local: StarsState = { earned: 9, purchases: { a: 1 } };
    const incoming: StarsState = { earned: 3, purchases: { b: 2 } };
    mergeStars(local, incoming);
    expect(local).toEqual({ earned: 9, purchases: { a: 1 } });
    expect(incoming).toEqual({ earned: 3, purchases: { b: 2 } });
  });
});

describe('mergeTrack', () => {
  it('takes the higher stage, the union of the sets and the better score of each element', () => {
    const merged = mergeTrack(tablet().tracks.letters, notebook().tracks.letters);
    expect(merged.level).toBe(1);
    expect(merged.active).toEqual(['O', 'S', 'T']);
    expect(merged.scores).toEqual({ O: 4, S: 3, T: 1 });
  });

  it('lets the higher stage lead, even when the other side has more elements', () => {
    const merged = mergeTrack(
      { level: 2, active: ['O', 'S'], scores: { O: 1, S: 1 } },
      { level: 1, active: ['A', 'B', 'C'], scores: { A: 5, B: 5, C: 5 } },
    );
    expect(merged.level).toBe(2);
    expect(merged.active).toEqual(['O', 'S', 'A', 'B', 'C']);
  });

  it('gives the same result either way round', () => {
    const a = tablet().tracks.letters;
    const b = notebook().tracks.letters;
    expect(mergeTrack(a, b)).toEqual(mergeTrack(b, a));
  });
});

describe('mergePending', () => {
  it('keeps an element both sides are waiting for', () => {
    expect(mergePending({ numbers: '6', letters: null }, { numbers: '6', letters: null })).toEqual({
      numbers: '6',
      letters: null,
    });
  });

  it('takes the one element when only one side is waiting', () => {
    expect(mergePending({ numbers: null, letters: 'T' }, { numbers: '6', letters: null })).toEqual({
      numbers: '6',
      letters: 'T',
    });
  });

  it('forces neither when the two disagree', () => {
    expect(mergePending({ numbers: null, letters: 'T' }, { numbers: null, letters: 'A' })).toEqual({
      numbers: null,
      letters: null,
    });
  });

  it('treats the two tracks separately', () => {
    expect(mergePending({ numbers: '6', letters: 'T' }, { numbers: '7', letters: 'T' })).toEqual({
      numbers: null,
      letters: 'T',
    });
  });
});

describe('mergeSave', () => {
  it('merges the pair from the plan', () => {
    const merged = mergeSave(tablet(), notebook());
    expect(merged.version).toBe(SAVE_VERSION);
    expect(merged.tracks.letters.active).toEqual(['O', 'S', 'T']);
    expect(merged.tracks.letters.scores).toEqual({ O: 4, S: 3, T: 1 });
    expect(merged.stars).toEqual({ earned: 7, purchases: { 'fruit.banana': 3 } });
    expect(merged.progress).toEqual({ ordersCompleted: 7, lastPlayed: '2026-08-22' });
  });

  it('gives the same result either way round – settings aside', () => {
    const one = mergeSave(tablet(), notebook());
    const other = mergeSave(notebook(), tablet());
    expect({ ...one, settings: null }).toEqual({ ...other, settings: null });
  });

  it('keeps the settings of the device the parent is sitting at', () => {
    const local: SaveData = {
      ...tablet(),
      settings: { child: { name: 'Anička', vocative: 'Aničko' }, family: [] },
    };
    expect(mergeSave(local, notebook()).settings).toEqual(local.settings);
    expect(mergeSave(notebook(), local).settings).toEqual(notebook().settings);
  });

  it('leaves a record merged with itself unchanged', () => {
    const save = tablet();
    expect(mergeSave(save, save)).toEqual(save);
  });

  it('leaves two untouched new games as a new game', () => {
    expect(mergeSave(createSave(), createSave())).toEqual(createSave());
  });

  it('keeps the later day, whichever side it is on and even when one never played', () => {
    const never: SaveData = { ...tablet(), progress: { ordersCompleted: 0, lastPlayed: null } };
    expect(mergeSave(never, notebook()).progress.lastPlayed).toBe('2026-08-22');
    expect(mergeSave(notebook(), never).progress.lastPlayed).toBe('2026-08-22');
    expect(mergeSave(never, never).progress.lastPlayed).toBeNull();
  });

  it('never lets the balance grow by merging', () => {
    const local: SaveData = { ...tablet(), stars: { earned: 7, purchases: { 'toy.ball': 4 } } };
    const incoming: SaveData = {
      ...notebook(),
      stars: { earned: 7, purchases: { 'toy.ball': 1 } },
    };
    expect(mergeSave(local, incoming).stars).toEqual({ earned: 7, purchases: { 'toy.ball': 4 } });
  });

  it('keeps the sitting of the device it is merged on (STEP-14)', () => {
    const closed: SessionState = {
      orders: 10,
      lastOrderAt: 1_756_296_000_000,
      closedFrom: 1_756_296_000_000,
      closedUntil: 1_756_303_200_000,
    };
    const local: SaveData = { ...tablet(), session: closed };
    const incoming: SaveData = { ...notebook(), session: { ...NEW_SESSION, orders: 3 } };
    // The imported closing must not lock the kitchen the child is sitting at, and the imported
    // count must not hand the limit back either.
    expect(mergeSave(local, incoming).session).toEqual(closed);
    expect(mergeSave(incoming, local).session).toEqual(incoming.session);
    expect(mergeSave(local, local)).toEqual(local);
  });

  it('never mutates either record', () => {
    const local = tablet();
    const incoming = notebook();
    mergeSave(local, incoming);
    expect(local).toEqual(tablet());
    expect(incoming).toEqual(notebook());
  });
});

describe('merging real purchases (STEP-15)', () => {
  it('keeps a thing bought on either device, and the higher price paid for it', () => {
    // The catalogue can change its prices; what the child paid is what the record keeps.
    const onTablet: StarsState = { earned: 9, purchases: { 'fruit.raspberry': 3 } };
    const onPhone: StarsState = {
      earned: 6,
      purchases: { 'fruit.raspberry': 2, 'decor.flower': 3 },
    };
    const merged = mergeStars(onTablet, onPhone);
    expect(merged.purchases).toEqual({ 'fruit.raspberry': 3, 'decor.flower': 3 });
    expect(unlockedFruits(merged)).toContain('raspberry');
    expect(ownedDecorations(merged)).toEqual(['flower']);
  });
});
