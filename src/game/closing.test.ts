import { describe, expect, it } from 'vitest';
import {
  afterOrder,
  closedProgress,
  closeUntil,
  isClosed,
  remainingMs,
  CLOSED_MS,
  MAX_CLOSED_MS,
  NEW_SESSION,
  PARENT_CODE,
  SESSION_ORDER_LIMIT,
  type SessionState,
} from './closing';

const MINUTE = 60_000;
/** Monday 14:00; every test counts from here, so nothing ever asks the real clock. */
const START = Date.UTC(2026, 7, 24, 12, 0, 0);

/** `count` orders one minute apart, the first one at `START`. */
function sitting(count: number): SessionState {
  let state = NEW_SESSION;
  for (let index = 0; index < count; index += 1) state = afterOrder(state, START + index * MINUTE);
  return state;
}

/** When the `count`-th order of `sitting(count)` was finished. */
function at(count: number): number {
  return START + (count - 1) * MINUTE;
}

describe('afterOrder', () => {
  it('counts the first order of a brand new record as the first of a sitting', () => {
    expect(afterOrder(NEW_SESSION, START)).toEqual({
      orders: 1,
      lastOrderAt: START,
      closedFrom: 0,
      closedUntil: 0,
    });
  });

  it('leaves the kitchen open up to the ninth order', () => {
    const state = sitting(SESSION_ORDER_LIMIT - 1);
    expect(state.orders).toBe(9);
    expect(state.closedUntil).toBe(0);
    expect(isClosed(state, at(9))).toBe(false);
  });

  it('closes the kitchen for two hours on the tenth', () => {
    const state = sitting(SESSION_ORDER_LIMIT);
    expect(state.orders).toBe(SESSION_ORDER_LIMIT);
    expect(state.closedFrom).toBe(at(10));
    expect(state.closedUntil).toBe(at(10) + CLOSED_MS);
    expect(isClosed(state, at(10))).toBe(true);
  });

  it('starts a new sitting after a pause longer than the closing time', () => {
    const nine = sitting(9);
    const next = afterOrder(nine, at(9) + CLOSED_MS + 1);
    expect(next.orders).toBe(1);
    expect(next.closedUntil).toBe(0);
  });

  it('keeps the sitting going through a pause shorter than the closing time', () => {
    const nine = sitting(9);
    expect(afterOrder(nine, at(9) + CLOSED_MS).orders).toBe(10);
  });

  it('starts a new sitting once the kitchen has opened again', () => {
    const closed = sitting(SESSION_ORDER_LIMIT);
    const next = afterOrder(closed, closed.closedUntil);
    expect(next.orders).toBe(1);
    expect(next.closedFrom).toBe(0);
    expect(next.closedUntil).toBe(0);
  });

  it('starts a new sitting when the clock of the device jumped backwards', () => {
    const nine = sitting(9);
    expect(afterOrder(nine, at(9) - MINUTE).orders).toBe(1);
  });

  it('keeps a closed kitchen closed when an order lands in it anyway', () => {
    const closed = sitting(SESSION_ORDER_LIMIT);
    const now = closed.closedUntil - MINUTE;
    // The scene never lets this happen (there is no bell behind the shutter); the dev console can.
    const next = afterOrder(closed, now);
    // The closing has not run out, so it is still the same sitting – and past the limit it closes
    // again from now: an order played through the shutter must not open the kitchen.
    expect(next.orders).toBe(SESSION_ORDER_LIMIT + 1);
    expect(next.closedFrom).toBe(now);
    expect(isClosed(next, now)).toBe(true);
  });
});

describe('closeUntil', () => {
  it('closes for two hours by default', () => {
    const state = closeUntil(NEW_SESSION, START);
    expect(state.closedFrom).toBe(START);
    expect(state.closedUntil).toBe(START + CLOSED_MS);
  });

  it('closes for as long as it is told, past the two hours', () => {
    const three = 3 * 60 * 60 * 1000;
    const state = closeUntil(NEW_SESSION, START, three);
    expect(state.closedUntil).toBe(START + three);
    expect(isClosed(state, START + three - MINUTE)).toBe(true);
    expect(isClosed(state, START + three)).toBe(false);
  });

  it('clamps a length that is not a closing any more', () => {
    expect(closeUntil(NEW_SESSION, START, 5 * MAX_CLOSED_MS).closedUntil).toBe(
      START + MAX_CLOSED_MS,
    );
    expect(closeUntil(NEW_SESSION, START, -1).closedUntil).toBe(START);
    expect(closeUntil(NEW_SESSION, START, Number.NaN).closedUntil).toBe(START + CLOSED_MS);
  });

  it('leaves the count of the sitting alone', () => {
    const nine = sitting(9);
    const closed = closeUntil(nine, at(9));
    expect(closed.orders).toBe(9);
    expect(closed.lastOrderAt).toBe(at(9));
  });
});

describe('isClosed', () => {
  it('is false for an open kitchen and for one that has served its time', () => {
    expect(isClosed(NEW_SESSION, START)).toBe(false);
    const closed = closeUntil(NEW_SESSION, START);
    expect(isClosed(closed, START + CLOSED_MS)).toBe(false);
    expect(isClosed(closed, START + CLOSED_MS + MINUTE)).toBe(false);
  });

  it('is true while the closing runs', () => {
    const closed = closeUntil(NEW_SESSION, START);
    expect(isClosed(closed, START)).toBe(true);
    expect(isClosed(closed, START + CLOSED_MS - 1)).toBe(true);
  });

  it('opens the kitchen when the clock of the device jumped back by days', () => {
    const closed = closeUntil(NEW_SESSION, START);
    expect(isClosed(closed, START - 3 * MAX_CLOSED_MS)).toBe(false);
  });

  it('opens a kitchen whose record claims a closing of a hundred years', () => {
    const broken: SessionState = { ...NEW_SESSION, closedFrom: START, closedUntil: 8.64e15 };
    expect(isClosed(broken, START)).toBe(false);
  });
});

describe('remainingMs and closedProgress', () => {
  it('are zero while the kitchen is open', () => {
    expect(remainingMs(NEW_SESSION, START)).toBe(0);
    expect(closedProgress(NEW_SESSION, START)).toBe(0);
  });

  it('count down from the whole closing to nothing', () => {
    const closed = closeUntil(NEW_SESSION, START);
    expect(remainingMs(closed, START)).toBe(CLOSED_MS);
    expect(closedProgress(closed, START)).toBe(1);
    expect(remainingMs(closed, START + CLOSED_MS / 2)).toBe(CLOSED_MS / 2);
    expect(closedProgress(closed, START + CLOSED_MS / 2)).toBeCloseTo(0.5, 5);
    expect(remainingMs(closed, START + CLOSED_MS)).toBe(0);
    expect(closedProgress(closed, START + CLOSED_MS)).toBe(0);
  });

  it('measures the wedge against the running closing, not against the two hours', () => {
    const minute = closeUntil(NEW_SESSION, START, MINUTE);
    expect(closedProgress(minute, START)).toBe(1);
    expect(closedProgress(minute, START + MINUTE / 2)).toBeCloseTo(0.5, 5);
  });

  it('stays inside [0, 1] for a record with a nonsensical start of the closing', () => {
    const broken: SessionState = { ...NEW_SESSION, closedFrom: START + MINUTE, closedUntil: START };
    expect(closedProgress(broken, START - MINUTE)).toBeLessThanOrEqual(1);
    expect(closedProgress(broken, START - MINUTE)).toBeGreaterThanOrEqual(0);
  });
});

describe('PARENT_CODE', () => {
  it('is four digits, so the keypad can compare what was typed as a string', () => {
    expect(PARENT_CODE).toMatch(/^\d{4}$/);
    expect(['1', '2', '3', '4'].join('')).toBe(PARENT_CODE);
  });
});
