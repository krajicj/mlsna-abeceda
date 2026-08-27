import { describe, expect, it } from 'vitest';
import { MAX_LETTER_LEVEL, MAX_NUMBER_LEVEL } from './curriculum';
import { createTrack, MASTERY_KNOWN, MASTERY_MAX, type TrackState } from './mastery';
import type { OrderItem } from './orders';
import {
  completeOrder,
  introducedElement,
  itemResult,
  STARS_PER_ORDER,
  todayStamp,
} from './progress';
import { createSave, type SaveData } from './save';

function saveWith(scores: {
  readonly numbers?: Readonly<Record<string, number>>;
  readonly letters?: Readonly<Record<string, number>>;
}): SaveData {
  const base = createSave();
  return {
    ...base,
    tracks: {
      numbers: {
        ...base.tracks.numbers,
        scores: { ...base.tracks.numbers.scores, ...scores.numbers },
      },
      letters: {
        ...base.tracks.letters,
        scores: { ...base.tracks.letters.scores, ...scores.letters },
      },
    },
  };
}

/** A save whose tracks are set up by hand – the growth rules need exact scores. */
function saveWithTracks(tracks: {
  readonly numbers?: TrackState;
  readonly letters?: TrackState;
}): SaveData {
  const base = createSave();
  return {
    ...base,
    tracks: {
      numbers: tracks.numbers ?? base.tracks.numbers,
      letters: tracks.letters ?? base.tracks.letters,
    },
  };
}

const countItem: OrderItem = { type: 'count', fruit: 'strawberry', amount: 3 };
const digitItem: OrderItem = { type: 'digit', value: 4, choices: [4, 2, 5] };

describe('itemResult', () => {
  it('maps every item type to its element and track', () => {
    expect(itemResult(countItem, 'first-try')).toEqual({
      element: '3',
      track: 'numbers',
      outcome: 'first-try',
    });
    expect(itemResult(digitItem, 'mistaken')).toEqual({
      element: '4',
      track: 'numbers',
      outcome: 'mistaken',
    });
    const letters = createSave().tracks.letters.active[0]!;
    const letterItem: OrderItem = {
      type: 'letter',
      letter: letters as never,
      word: 'kočka',
      choices: [],
    };
    expect(itemResult(letterItem, 'hinted')).toEqual({
      element: letters,
      track: 'letters',
      outcome: 'hinted',
    });
  });
});

describe('todayStamp', () => {
  it('is the local date, zero-padded – not the UTC one', () => {
    // 1 January, ten past midnight local time: in UTC this is still 31 December somewhere.
    expect(todayStamp(new Date(2026, 0, 1, 0, 10))).toBe('2026-01-01');
    expect(todayStamp(new Date(2026, 8, 9, 23, 50))).toBe('2026-09-09');
    expect(todayStamp(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });
});

describe('completeOrder', () => {
  const today = '2026-08-25';

  it('adds a point for a first-try answer', () => {
    const save = saveWith({ numbers: { '3': 1 } });
    const next = completeOrder(save, [itemResult(countItem, 'first-try')], today);
    expect(next.tracks.numbers.scores['3']).toBe(2);
  });

  it('takes a point for a mistake and leaves a hinted item alone', () => {
    const save = saveWith({ numbers: { '3': 2, '4': 2 } });
    const mistaken = completeOrder(save, [itemResult(countItem, 'mistaken')], today);
    expect(mistaken.tracks.numbers.scores['3']).toBe(1);
    const hinted = completeOrder(save, [itemResult(digitItem, 'hinted')], today);
    expect(hinted.tracks.numbers.scores['4']).toBe(2);
  });

  it('never goes above the maximum or below zero', () => {
    const full = saveWith({ numbers: { '3': MASTERY_MAX } });
    expect(
      completeOrder(full, [itemResult(countItem, 'first-try')], today).tracks.numbers.scores['3'],
    ).toBe(MASTERY_MAX);
    const empty = saveWith({ numbers: { '3': 0 } });
    expect(
      completeOrder(empty, [itemResult(countItem, 'mistaken')], today).tracks.numbers.scores['3'],
    ).toBe(0);
  });

  it('ignores an element that is not in play', () => {
    const save = createSave();
    const outside: OrderItem = { type: 'digit', value: 9, choices: [9] };
    const next = completeOrder(save, [itemResult(outside, 'first-try')], today);
    expect(next.tracks.numbers.scores['9']).toBeUndefined();
    expect(next.tracks.numbers).toEqual(save.tracks.numbers);
  });

  it('writes both tracks of a two-item order', () => {
    const save = createSave();
    const letter = save.tracks.letters.active[0]!;
    const letterItem: OrderItem = {
      type: 'letter',
      letter: letter as never,
      word: '',
      choices: [],
    };
    const next = completeOrder(
      save,
      [itemResult(countItem, 'first-try'), itemResult(letterItem, 'first-try')],
      today,
    );
    expect(next.tracks.numbers.scores['3']).toBe(1);
    expect(next.tracks.letters.scores[letter]).toBe(1);
  });

  it('counts the order, the star and the day even with no results at all', () => {
    const save = createSave();
    const next = completeOrder(save, [], today);
    expect(next.progress).toEqual({
      ordersCompleted: 1,
      stars: STARS_PER_ORDER,
      lastPlayed: today,
    });
  });

  it('keeps counting from where the save left off', () => {
    const save: SaveData = {
      ...createSave(),
      progress: { ordersCompleted: 4, stars: 4, lastPlayed: '2026-08-01' },
    };
    const next = completeOrder(save, [], today);
    expect(next.progress.ordersCompleted).toBe(5);
    expect(next.progress.stars).toBe(5);
    expect(next.progress.lastPlayed).toBe(today);
  });

  it('never mutates the record it is given', () => {
    const save = saveWith({ numbers: { '3': 2 } });
    const before = JSON.parse(JSON.stringify(save)) as SaveData;
    completeOrder(save, [itemResult(countItem, 'mistaken')], today);
    expect(save).toEqual(before);
  });

  it('leaves the settings alone', () => {
    const save = createSave();
    const next = completeOrder(save, [itemResult(countItem, 'first-try')], today);
    expect(next.settings).toBe(save.settings);
  });
});

describe('completeOrder – growing the tracks', () => {
  const today = '2026-08-25';
  const P1 = ['O', 'S', 'T', 'A'];
  const NUMBERS = ['1', '2', '3', '4', '5'];
  const known = (elements: readonly string[]): Record<string, number> =>
    Object.fromEntries(elements.map((element) => [element, MASTERY_KNOWN]));

  it('does not grow a track that still has a weak element', () => {
    const save = saveWithTracks({
      letters: { level: 1, active: ['O', 'S', 'T'], scores: { O: 5, S: 5, T: 0 } },
    });
    const next = completeOrder(save, [], today);
    expect(next.tracks.letters).toEqual(save.tracks.letters); // 2 of 3 known is under READY_RATIO
  });

  it('introduces exactly one new element, with a score of zero', () => {
    const save = saveWithTracks({
      letters: { level: 1, active: ['O', 'S'], scores: known(['O', 'S']) },
    });
    const letters = completeOrder(save, [], today).tracks.letters;
    expect(letters.level).toBe(1);
    expect(letters.active).toEqual(['O', 'S', 'T']);
    expect(letters.scores).toEqual({ O: MASTERY_KNOWN, S: MASTERY_KNOWN, T: 0 });
  });

  it('counts the point of this very order towards the growth', () => {
    // A goes from 2 to 3 with this answer – and that is what completes the P1 pool.
    const save = saveWithTracks({
      letters: { level: 1, active: P1, scores: { O: 5, S: 4, T: 3, A: 2 } },
    });
    const letterItem: OrderItem = { type: 'letter', letter: 'A', word: 'auto', choices: [] };
    const letters = completeOrder(save, [itemResult(letterItem, 'first-try')], today).tracks
      .letters;
    expect(letters.level).toBe(2);
    expect(letters.active).toEqual(['O', 'S', 'T', 'A', 'M']);
    expect(letters.scores).toEqual({ O: 5, S: 4, T: 3, A: 3, M: 0 });
  });

  it('goes one stage up when the whole pool is known, keeping the scores', () => {
    const save = saveWithTracks({
      numbers: { level: 1, active: NUMBERS, scores: { ...known(NUMBERS), '1': 5 } },
    });
    const numbers = completeOrder(save, [], today).tracks.numbers;
    expect(numbers.level).toBe(2);
    expect(numbers.active).toEqual([...NUMBERS, '6']); // exactly one new digit
    expect(numbers.scores['1']).toBe(5);
    expect(numbers.scores['6']).toBe(0);
  });

  it('stops at the ceiling instead of claiming a stage the kitchen cannot play', () => {
    const all = Array.from({ length: 10 }, (_, i) => String(i + 1));
    const save = saveWithTracks({
      numbers: { level: MAX_NUMBER_LEVEL, active: all, scores: known(all) },
    });
    const numbers = completeOrder(save, [], today).tracks.numbers;
    expect(numbers).toEqual(save.tracks.numbers);
    expect(numbers.level).toBe(MAX_NUMBER_LEVEL);
  });

  it('stops the letters at their ceiling too', () => {
    const pool2 = ['O', 'S', 'T', 'A', 'M', 'U', 'D', 'N'];
    const save = saveWithTracks({
      letters: { level: MAX_LETTER_LEVEL, active: pool2, scores: known(pool2) },
    });
    const letters = completeOrder(save, [], today).tracks.letters;
    expect(letters).toEqual(save.tracks.letters);
  });

  it('never leaves a track with an empty active set', () => {
    const cases: SaveData[] = [
      createSave(),
      saveWithTracks({ letters: { level: 1, active: ['O', 'S'], scores: known(['O', 'S']) } }),
      saveWithTracks({ letters: { level: 1, active: P1, scores: known(P1) } }),
      saveWithTracks({ letters: createTrack(1, []) }),
    ];
    for (const save of cases) {
      const next = completeOrder(save, [], today);
      expect(next.tracks.numbers.active.length).toBeGreaterThan(0);
      expect(next.tracks.letters.active.length).toBeGreaterThan(0);
    }
  });
});

describe('introducedElement', () => {
  it('names the single element that joined', () => {
    const before: TrackState = { level: 1, active: ['O', 'S'], scores: { O: 3, S: 3 } };
    const after: TrackState = { level: 1, active: ['O', 'S', 'T'], scores: { O: 3, S: 3, T: 0 } };
    expect(introducedElement(before, after)).toBe('T');
  });

  it('is null when nothing was added', () => {
    const track: TrackState = { level: 1, active: ['O', 'S'], scores: { O: 3, S: 0 } };
    expect(introducedElement(track, track)).toBeNull();
    expect(introducedElement(track, { ...track, scores: { O: 4, S: 0 } })).toBeNull();
  });

  it('is null rather than a guess when more than one appeared', () => {
    const before: TrackState = { level: 1, active: ['O'], scores: { O: 3 } };
    const after: TrackState = { level: 2, active: ['O', 'S', 'T'], scores: { O: 3, S: 0, T: 0 } };
    expect(introducedElement(before, after)).toBeNull();
  });
});
