/**
 * What a finished order does to the saved game (docs/navrh-hry.md ch. 5.4, 7): the mastery score of
 * every element the child worked with, one star and the counters. Pure – a `SaveData` in, a new
 * `SaveData` out, nothing mutated and nothing written to storage (that is `session.ts`). Keeping it
 * DOM-free and side-effect-free is what makes the scoring rules testable without a browser.
 */
import { recordMistake, recordSuccess, type TrackState } from './mastery';
import type { OrderItem } from './orders';
import type { SaveData } from './save';

export type TrackName = 'numbers' | 'letters';

/**
 * How one item of the order went (návrh 5.4): right away +1, after a mistake or a recount −1, after
 * the 40 s hint no change – the hint costs the point but never takes one away.
 */
export type ItemOutcome = 'first-try' | 'hinted' | 'mistaken';

export interface ItemResult {
  /** The track element exactly as `mastery.ts` holds it: 'K' or '3'. */
  readonly element: string;
  readonly track: TrackName;
  readonly outcome: ItemOutcome;
}

/** One order is one star; the VIP customer for 3 ★ comes with the shop (návrh kap. 7). */
export const STARS_PER_ORDER = 1;

/** Which track an item belongs to: counting and candles teach numbers, cookies teach letters. */
export function trackOf(item: OrderItem): TrackName {
  return item.type === 'letter' ? 'letters' : 'numbers';
}

/** The element of an item, the same key `orderElements()` uses for the no-repeat rule. */
export function elementOf(item: OrderItem): string {
  switch (item.type) {
    case 'count':
      return String(item.amount);
    case 'digit':
      return String(item.value);
    case 'letter':
      return item.letter;
  }
}

export function itemResult(item: OrderItem, outcome: ItemOutcome): ItemResult {
  return { element: elementOf(item), track: trackOf(item), outcome };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** 'YYYY-MM-DD' in local time – `toISOString()` would call an evening in Prague yesterday. */
export function todayStamp(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function withResult(track: TrackState, result: ItemResult): TrackState {
  switch (result.outcome) {
    case 'first-try':
      return recordSuccess(track, result.element, true);
    case 'mistaken':
      return recordMistake(track, result.element);
    case 'hinted':
      return track; // the hint is not a mistake (návrh 5.5)
  }
}

/**
 * The order is done. Elements outside the active set are ignored (`mastery.ts` keeps scores only
 * for what is in play), the star and the counters always land – even for an empty `results`, so a
 * dev-console order the child never really played still closes the loop.
 */
export function completeOrder(
  save: SaveData,
  results: readonly ItemResult[],
  today: string,
): SaveData {
  let numbers = save.tracks.numbers;
  let letters = save.tracks.letters;
  for (const result of results) {
    if (result.track === 'numbers') numbers = withResult(numbers, result);
    else letters = withResult(letters, result);
  }
  return {
    ...save,
    tracks: { numbers, letters },
    progress: {
      ordersCompleted: save.progress.ordersCompleted + 1,
      stars: save.progress.stars + STARS_PER_ORDER,
      lastPlayed: today,
    },
  };
}
