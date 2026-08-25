import { describe, expect, it } from 'vitest';
import { MASTERY_MAX } from './mastery';
import type { OrderItem } from './orders';
import { completeOrder, itemResult, STARS_PER_ORDER, todayStamp } from './progress';
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

  it('leaves the settings and the levels alone (STEP-11 does the introducing)', () => {
    const save = createSave();
    const next = completeOrder(save, [itemResult(countItem, 'first-try')], today);
    expect(next.settings).toBe(save.settings);
    expect(next.tracks.numbers.level).toBe(save.tracks.numbers.level);
    expect(next.tracks.numbers.active).toEqual(save.tracks.numbers.active);
    expect(next.tracks.letters).toEqual(save.tracks.letters);
  });
});
