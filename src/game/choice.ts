/**
 * The item where the child picks from the shelf: "a cookie with a K", "a candle with a 3"
 * (docs/navrh-hry.md ch. 5.1, 5.4, 5.5). Pure state over one target and the row of choices; the
 * scene turns it into cookies, candles and cues. A wrong tap never blocks anything – after the
 * second one the right answer is revealed, and the offer is normalised so it always holds the
 * target (rule 2: the child cannot lose).
 */
import type { TrackState } from './mastery';
import type { Order, OrderItem } from './orders';

/** The item types that put a choice on the shelf – everything but counting. */
export type ChoiceItem = Exclude<OrderItem, { readonly type: 'count' }>;

/** After the second mistake the right answer lights up (návrh 5.5). */
export const REVEAL_AFTER_MISTAKES = 2;
/** How many pieces fit on a shelf; must match MAX_CHOICES in art/layout.ts (a test guards it). */
export const MAX_SHOWN_CHOICES = 4;

export interface ChoiceState {
  /** 'K' or '3' – both tracks work with strings, the same as mastery.ts. */
  readonly target: string;
  /** The offer as it lies on the shelf, left to right. Always contains `target`. */
  readonly choices: readonly string[];
  readonly mistakes: number;
  /** Every wrong tap in the order it came (a value may repeat). */
  readonly wrong: readonly string[];
  /** The right answer is shown (second mistake, or the hint after 40 s). */
  readonly revealed: boolean;
  readonly done: boolean;
}

export type ChoiceResult =
  | 'correct' // a hit; the state goes to done
  | 'wrong' // a piece of the offer, but not the right one
  | 'unknown' // the value is not in the offer – the state does not change
  | 'finished'; // a tap after the item was finished – the state does not change

/**
 * Drops empty values and duplicates (the first one wins), cuts the offer to MAX_SHOWN_CHOICES and
 * makes sure the target is in it – if it was cut off, it replaces the last kept piece. The order
 * is otherwise left alone: the shuffling happens in the generator (orders.ts).
 */
function normalise(target: string, choices: readonly string[]): string[] {
  const kept: string[] = [];
  for (const value of choices) {
    if (value === '' || kept.includes(value)) continue;
    if (kept.length >= MAX_SHOWN_CHOICES) break;
    kept.push(value);
  }
  if (kept.includes(target)) return kept;
  if (kept.length === 0) return [target];
  kept[kept.length - 1] = target;
  return kept;
}

export function createChoice(target: string, choices: readonly string[]): ChoiceState {
  return {
    target,
    choices: normalise(target, choices),
    mistakes: 0,
    wrong: [],
    revealed: false,
    done: false,
  };
}

/** One tap on a piece of the offer. Never mutates its input. */
export function pickChoice(
  state: ChoiceState,
  value: string,
): { readonly state: ChoiceState; readonly result: ChoiceResult } {
  if (state.done) return { state, result: 'finished' };
  if (!state.choices.includes(value)) return { state, result: 'unknown' };
  if (value === state.target) return { state: { ...state, done: true }, result: 'correct' };
  const mistakes = state.mistakes + 1;
  return {
    state: {
      ...state,
      mistakes,
      wrong: [...state.wrong, value],
      revealed: state.revealed || mistakes >= REVEAL_AFTER_MISTAKES,
    },
    result: 'wrong',
  };
}

/**
 * The hint after 40 s: marks the item as revealed without tapping for the child. On a finished
 * item it returns the state unchanged – the same way pickChoice answers 'finished'.
 */
export function revealChoice(state: ChoiceState): ChoiceState {
  if (state.done || state.revealed) return state;
  return { ...state, revealed: true };
}

/** No mistake and no hint → STEP-09 adds a mastery point. */
export function isFirstTry(state: ChoiceState): boolean {
  return state.mistakes === 0 && !state.revealed;
}

/** The first item of the order that is a choice, or `null` (an order may hold only counting). */
export function choiceItemOf(order: Order): ChoiceItem | null {
  for (const item of order.items) if (item.type !== 'count') return item;
  return null;
}

export function choiceTarget(item: ChoiceItem): string {
  return item.type === 'letter' ? item.letter : String(item.value);
}

export function choiceValues(item: ChoiceItem): string[] {
  return item.type === 'letter' ? [...item.choices] : item.choices.map(String);
}

/**
 * The decorative offer on the shelf that is not in play: the first `count` elements the child is
 * actually learning. Nothing is tappable there, so it only has to look like the real thing.
 */
export function shelfDecoration(track: TrackState, count: number = MAX_SHOWN_CHOICES): string[] {
  const n = Math.min(Math.max(Math.floor(count) || 0, 0), MAX_SHOWN_CHOICES);
  return track.active.slice(0, n);
}
