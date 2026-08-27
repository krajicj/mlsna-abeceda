/**
 * One learning track (numbers or letters): which elements are in play and how well the child knows
 * them (docs/navrh-hry.md ch. 5.3, 5.5). Elements are always strings – a letter 'K', a number '3' –
 * so both tracks share one type and the saved JSON has one shape. Every function returns a new
 * state; nothing is mutated.
 */
import type { Level } from './curriculum';

export const MASTERY_MAX = 5;
/** From this score up an element counts as known (and may be used as a distractor). */
export const MASTERY_KNOWN = 3;
/** How much of the active set must be known before a new element joins in. */
export const READY_RATIO = 0.8;
/** An element below MASTERY_KNOWN is asked for this many times more often (návrh 5.4). */
export const WEAK_WEIGHT = 3;

export interface TrackState {
  readonly level: Level;
  /** Elements currently in play; a subset of the level pool. */
  readonly active: readonly string[];
  /** 0–5 per element of `active`. */
  readonly scores: Readonly<Record<string, number>>;
}

function zeroScores(elements: readonly string[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const element of elements) scores[element] = 0;
  return scores;
}

/** `initialSize` missing → the whole pool; otherwise the first N elements of it. */
export function createTrack(
  level: Level,
  pool: readonly string[],
  initialSize?: number,
): TrackState {
  const active = initialSize === undefined ? [...pool] : pool.slice(0, Math.max(initialSize, 0));
  return { level, active, scores: zeroScores(active) };
}

export function scoreOf(track: TrackState, element: string): number {
  return track.scores[element] ?? 0;
}

export function isMastered(track: TrackState, element: string): boolean {
  return scoreOf(track, element) >= MASTERY_KNOWN;
}

function withScore(track: TrackState, element: string, score: number): TrackState {
  if (!track.active.includes(element)) return track; // scores exist only for the active set
  return {
    ...track,
    scores: { ...track.scores, [element]: Math.min(Math.max(score, 0), MASTERY_MAX) },
  };
}

/** Only a first-try answer earns a point; getting there after a hint keeps the score as it was. */
export function recordSuccess(track: TrackState, element: string, firstTry: boolean): TrackState {
  if (!firstTry) return track;
  return withScore(track, element, scoreOf(track, element) + 1);
}

export function recordMistake(track: TrackState, element: string): TrackState {
  return withScore(track, element, scoreOf(track, element) - 1);
}

/**
 * How often the generator should ask about this element: 1 for a mastered one, `WEAK_WEIGHT` for the
 * rest (návrh 5.4). An element outside the active set scores 0 through `scoreOf` and therefore
 * weighs `WEAK_WEIGHT` – the generator never asks about one, so the value only has to be defined.
 */
export function weightOf(track: TrackState, element: string): number {
  return isMastered(track, element) ? 1 : WEAK_WEIGHT;
}

/** Empty set → yes, there is room for the first element. */
export function isReadyForNewElement(track: TrackState): boolean {
  if (track.active.length === 0) return true;
  const known = track.active.filter((element) => isMastered(track, element)).length;
  return known / track.active.length >= READY_RATIO;
}

/** Adds at most one element from the pool, and only when the active set is ready for it. */
export function maybeIntroduce(track: TrackState, pool: readonly string[]): TrackState {
  if (!isReadyForNewElement(track)) return track;
  const next = pool.find((element) => !track.active.includes(element));
  if (next === undefined) return track;
  return { ...track, active: [...track.active, next], scores: { ...track.scores, [next]: 0 } };
}

/** The whole pool is in play and known – time for the next stage. */
export function canAdvanceLevel(track: TrackState, pool: readonly string[]): boolean {
  return pool.every((element) => track.active.includes(element) && isMastered(track, element));
}

/**
 * One stage up: what is already known and still belongs to the new pool stays (with its score),
 * plus the first new element from it.
 */
export function advanceLevel(track: TrackState, nextPool: readonly string[]): TrackState {
  const level = (track.level < 5 ? track.level + 1 : 5) as Level;
  const kept = track.active.filter((element) => nextPool.includes(element));
  const next = nextPool.find((element) => !kept.includes(element));
  const active = next === undefined ? kept : [...kept, next];
  const scores: Record<string, number> = {};
  for (const element of active) scores[element] = scoreOf(track, element);
  if (next !== undefined) scores[next] = 0;
  return { level, active, scores };
}
