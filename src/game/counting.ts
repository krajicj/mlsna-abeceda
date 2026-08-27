/**
 * The counting item: "three strawberries on the cake" (docs/navrh-hry.md ch. 5.1, 5.5). Pure state
 * over one number – how many pieces the customer asked for and how many are already on the cake.
 * Taps past the target are counted, never refused: the game can never block progress (rule 2).
 */
import type { Order, OrderItem } from './orders';

/** Č1 counts to 5; Č2 (to 10) needs a second row on the cake – STEP-22. */
export const MAX_COUNT = 5;

export interface CountingState {
  /** 1…MAX_COUNT. */
  readonly target: number;
  readonly placed: number;
  /** Taps after the target was reached (recounting); STEP-09 turns those into a score. */
  readonly extraTaps: number;
  readonly done: boolean;
}

export type CountingResult = 'placed' | 'completed' | 'too-many';

/**
 * The target is rounded (`Math.round`, so 2.6 → 3) and clamped to 1…MAX_COUNT; anything that is
 * not a finite number ≥ 1 after rounding (0, −3, `NaN`) ends up as 1.
 */
export function createCounting(target: number): CountingState {
  const rounded = Math.round(target);
  const safe = Number.isFinite(rounded) ? Math.min(Math.max(rounded, 1), MAX_COUNT) : 1;
  return { target: safe, placed: 0, extraTaps: 0, done: false };
}

/** One tap on the fruit in the bowl. Never mutates its input. */
export function addFruit(state: CountingState): {
  readonly state: CountingState;
  readonly result: CountingResult;
} {
  if (state.done) {
    return { state: { ...state, extraTaps: state.extraTaps + 1 }, result: 'too-many' };
  }
  const placed = state.placed + 1;
  const done = placed >= state.target;
  return { state: { ...state, placed, done }, result: done ? 'completed' : 'placed' };
}

/**
 * The first `count` item of an order, or `null`. From STEP-09 on, when `ordersCompleted` starts to
 * grow, an order can hold only a letter or a digit – the kitchen then stays static. A pure
 * function so that branch can be tested without a DOM.
 */
export function countItemOf(order: Order): Extract<OrderItem, { readonly type: 'count' }> | null {
  for (const item of order.items) if (item.type === 'count') return item;
  return null;
}
