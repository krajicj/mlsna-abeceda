import { describe, expect, it } from 'vitest';
import {
  advanceLevel,
  canAdvanceLevel,
  createTrack,
  isMastered,
  isReadyForNewElement,
  maybeIntroduce,
  recordMistake,
  recordSuccess,
  scoreOf,
  WEAK_WEIGHT,
  weightOf,
  type TrackState,
} from './mastery';

const NUMBERS = ['1', '2', '3', '4', '5'];

function withScores(track: TrackState, scores: Record<string, number>): TrackState {
  return { ...track, scores: { ...track.scores, ...scores } };
}

describe('createTrack', () => {
  it('takes the whole pool without a size', () => {
    const track = createTrack(1, NUMBERS);
    expect(track.active).toEqual(NUMBERS);
    expect(track.scores).toEqual({ '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 });
  });

  it('takes only the first elements with a size', () => {
    expect(createTrack(1, NUMBERS, 2).active).toEqual(['1', '2']);
  });
});

describe('recordSuccess / recordMistake', () => {
  it('adds a point for a first-try answer, up to five', () => {
    let track = createTrack(1, NUMBERS);
    for (let i = 0; i < 8; i += 1) track = recordSuccess(track, '3', true);
    expect(scoreOf(track, '3')).toBe(5);
  });

  it('leaves the score alone when the answer came after a mistake', () => {
    const track = recordSuccess(createTrack(1, NUMBERS), '3', false);
    expect(scoreOf(track, '3')).toBe(0);
  });

  it('takes a point away for a mistake, down to zero', () => {
    let track = recordSuccess(createTrack(1, NUMBERS), '3', true);
    track = recordMistake(track, '3');
    expect(scoreOf(track, '3')).toBe(0);
    track = recordMistake(track, '3');
    expect(scoreOf(track, '3')).toBe(0);
  });

  it('does not mutate the state it was given', () => {
    const track = createTrack(1, NUMBERS);
    recordSuccess(track, '3', true);
    expect(track.scores['3']).toBe(0);
  });

  it('ignores an element that is not in play', () => {
    const track = createTrack(1, NUMBERS);
    expect(recordSuccess(track, '9', true)).toBe(track);
  });

  it('counts an element as known from three', () => {
    const track = withScores(createTrack(1, NUMBERS), { '1': 2, '2': 3 });
    expect(isMastered(track, '1')).toBe(false);
    expect(isMastered(track, '2')).toBe(true);
  });
});

describe('isReadyForNewElement', () => {
  it('needs four of five known', () => {
    const almost = withScores(createTrack(1, NUMBERS), { '1': 3, '2': 3, '3': 3, '4': 2, '5': 0 });
    expect(isReadyForNewElement(almost)).toBe(false);
    expect(isReadyForNewElement(withScores(almost, { '4': 3 }))).toBe(true);
  });
});

describe('maybeIntroduce', () => {
  const pool = ['A', 'N', 'I', 'K', 'L', 'T'];

  it('adds exactly one element when the set is ready', () => {
    const ready = withScores(createTrack(1, pool, 4), { A: 3, N: 3, I: 3, K: 3 });
    const grown = maybeIntroduce(ready, pool);
    expect(grown.active).toEqual(['A', 'N', 'I', 'K', 'L']);
    expect(scoreOf(grown, 'L')).toBe(0);
  });

  it('adds nothing when the set is not ready yet', () => {
    const track = createTrack(1, pool, 4);
    expect(maybeIntroduce(track, pool)).toBe(track);
  });

  it('adds nothing when the pool is used up', () => {
    const full = withScores(createTrack(1, pool), Object.fromEntries(pool.map((e) => [e, 3])));
    expect(maybeIntroduce(full, pool)).toBe(full);
  });
});

describe('canAdvanceLevel / advanceLevel', () => {
  const pool = ['A', 'N', 'I', 'K'];
  const next = ['A', 'N', 'I', 'K', 'L', 'T', 'O', 'S'];

  it('waits until the whole pool is in play and known', () => {
    const partial = withScores(createTrack(1, pool), { A: 3, N: 3, I: 3, K: 2 });
    expect(canAdvanceLevel(partial, pool)).toBe(false);
    expect(canAdvanceLevel(withScores(partial, { K: 3 }), pool)).toBe(true);
  });

  it('is false while an element of the pool has not been introduced', () => {
    const track = withScores(createTrack(1, pool, 3), { A: 3, N: 3, I: 3 });
    expect(canAdvanceLevel(track, pool)).toBe(false);
  });

  it('moves up a stage, keeps the scores and brings one new element', () => {
    const mastered = withScores(createTrack(1, pool), { A: 3, N: 4, I: 5, K: 3 });
    const grown = advanceLevel(mastered, next);
    expect(grown.level).toBe(2);
    expect(grown.active).toEqual(['A', 'N', 'I', 'K', 'L']);
    expect(grown.scores).toEqual({ A: 3, N: 4, I: 5, K: 3, L: 0 });
  });

  it('drops elements that are not in the new pool', () => {
    const track = withScores(createTrack(2, ['A', 'X'], undefined), { A: 3, X: 4 });
    const grown = advanceLevel(track, ['A', 'B']);
    expect(grown.active).toEqual(['A', 'B']);
    expect(grown.scores).toEqual({ A: 3, B: 0 });
  });

  it('never goes past stage five', () => {
    expect(advanceLevel(createTrack(5, ['A']), ['A', 'B']).level).toBe(5);
  });
});

describe('weightOf', () => {
  const track = withScores(createTrack(1, NUMBERS), { '1': 5, '2': 3, '3': 2, '4': 0 });

  it('gives a mastered element the plain weight and a weak one WEAK_WEIGHT', () => {
    expect(weightOf(track, '1')).toBe(1);
    expect(weightOf(track, '2')).toBe(1); // exactly MASTERY_KNOWN already counts as known
    expect(weightOf(track, '3')).toBe(WEAK_WEIGHT);
    expect(weightOf(track, '4')).toBe(WEAK_WEIGHT);
  });

  it('is defined for an element outside the active set', () => {
    // The generator never asks about one; the value only has to exist, not to mean anything.
    expect(weightOf(track, '9')).toBe(WEAK_WEIGHT);
  });

  it('is always a positive finite number', () => {
    for (const element of [...NUMBERS, 'X']) {
      const weight = weightOf(track, element);
      expect(Number.isFinite(weight)).toBe(true);
      expect(weight).toBeGreaterThan(0);
    }
  });
});
