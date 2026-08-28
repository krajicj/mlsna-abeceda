/**
 * The end of a sitting (docs/navrh-hry.md ch. 4): after ten orders the kitchen closes itself for
 * two hours – "the game itself says enough", so the grown-up does not have to. Pure and DOM-free
 * like the rest of `src/game/`; the clock is always a parameter, never `Date.now()` inside, so the
 * whole thing is testable in Node and the scene stays the only place that knows what time it is.
 *
 * The state lives in the save (`SaveData.session`), which is the point: a reload must not be a way
 * around the closing, and a kitchen that closed at bedtime is still closed in the morning.
 */

/** How many orders one sitting holds (návrh kap. 4). STEP-19 makes it settable in the parent corner. */
export const SESSION_ORDER_LIMIT = 10;

/**
 * How long the kitchen stays closed – and, with the same number, how long a pause has to be before
 * the next order counts as the first of a NEW sitting. One number for both: a child who takes an
 * hour off finishes the sitting they started, one who comes back in the afternoon starts over.
 */
export const CLOSED_MS = 2 * 60 * 60 * 1000;

/**
 * Not a closing time but a sanity ceiling: past this, `closedUntil` is not a closing any more, it
 * is a device whose clock jumped (a time zone, a hand-set date). Without it the kitchen could stay
 * locked for years and the child would have no way around it – rule 2, you cannot lose.
 */
export const MAX_CLOSED_MS = 12 * 60 * 60 * 1000;

/**
 * The temporary parent code until the parent corner arrives (STEP-19, návrh kap. 9). It is not a
 * secret – the repository is public – only a gate a four-year-old does not walk through. Compared
 * as a string: `typed.join('') === PARENT_CODE`.
 */
export const PARENT_CODE = '1234';

export interface SessionState {
  /** How many orders the running sitting has behind it; 0 = nothing yet. */
  readonly orders: number;
  /** Epoch ms of the last finished order; 0 = never. */
  readonly lastOrderAt: number;
  /** Epoch ms the kitchen closed at; 0 = open. The timer wedge is divided by it. */
  readonly closedFrom: number;
  /** Epoch ms the kitchen opens again; 0 = open. */
  readonly closedUntil: number;
}

export const NEW_SESSION: SessionState = {
  orders: 0,
  lastOrderAt: 0,
  closedFrom: 0,
  closedUntil: 0,
};

/**
 * Does an order at `now` belong to the sitting the state describes, or does it start a new one?
 * A closing that has run out ends the sitting whatever the pause was – that is what the two hours
 * are for.
 */
function continues(state: SessionState, now: number): boolean {
  // The kitchen has opened again in the meantime → the sitting before it is over.
  if (state.closedUntil > 0 && now >= state.closedUntil) return false;
  if (state.lastOrderAt <= 0) return false;
  const gap = now - state.lastOrderAt;
  // A negative pause means the clock jumped backwards; longer than a closing means a new sitting.
  return gap >= 0 && gap <= CLOSED_MS;
}

/**
 * Closes from `now` for `ms` (default `CLOSED_MS`, clamped to `[0, MAX_CLOSED_MS]`); `orders` and
 * `lastOrderAt` are left alone. Whoever asks for a length gets it, or gets it visibly clamped –
 * never silently voided.
 */
export function closeUntil(state: SessionState, now: number, ms = CLOSED_MS): SessionState {
  const span = Math.min(Math.max(Number.isFinite(ms) ? ms : CLOSED_MS, 0), MAX_CLOSED_MS);
  return { ...state, closedFrom: now, closedUntil: now + span };
}

/** One more finished order: the sitting grows, or starts over, and the tenth closes the kitchen. */
export function afterOrder(state: SessionState, now: number): SessionState {
  const orders = continues(state, now) ? state.orders + 1 : 1;
  const next: SessionState = { ...state, orders, lastOrderAt: now, closedFrom: 0, closedUntil: 0 };
  return orders >= SESSION_ORDER_LIMIT ? closeUntil(next, now) : next;
}

export function isClosed(state: SessionState, now: number): boolean {
  const left = state.closedUntil - now;
  // The upper bound guards against a reset clock, it is not the length of a closing – hence
  // MAX_CLOSED_MS and not CLOSED_MS: a three-hour closing set in the parent corner is real.
  return left > 0 && left <= MAX_CLOSED_MS;
}

/** How much of the closing is left, in ms; 0 whenever the kitchen is open. */
export function remainingMs(state: SessionState, now: number): number {
  return isClosed(state, now) ? state.closedUntil - now : 0;
}

/**
 * The share of the RUNNING closing that is still left: 1 → a full wedge, 0 → open. Divided by the
 * length of this closing (`closedUntil − closedFrom`), not by `CLOSED_MS`: a one-minute closing
 * from the console has to start with a full timer too, otherwise the picture lies.
 */
export function closedProgress(state: SessionState, now: number): number {
  const left = remainingMs(state, now);
  if (left <= 0) return 0;
  const span = Math.max(state.closedUntil - state.closedFrom, 1);
  return Math.min(left / span, 1);
}
