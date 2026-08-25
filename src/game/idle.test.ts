import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createIdleWatcher, IDLE_HINT_MS, IDLE_REMIND_MS } from './idle';

interface Spy {
  readonly remind: () => void;
  readonly hint: () => void;
  readonly counts: () => { remind: number; hint: number };
}

function spy(): Spy {
  let remind = 0;
  let hint = 0;
  return {
    remind: () => void (remind += 1),
    hint: () => void (hint += 1),
    counts: () => ({ remind, hint }),
  };
}

describe('createIdleWatcher', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('stays silent until the first poke', () => {
    const calls = spy();
    createIdleWatcher({ onRemind: calls.remind, onHint: calls.hint });
    vi.advanceTimersByTime(10 * IDLE_HINT_MS);
    expect(calls.counts()).toEqual({ remind: 0, hint: 0 });
  });

  it('reminds at 15 s and hints at 40 s after a poke', () => {
    const calls = spy();
    const watcher = createIdleWatcher({ onRemind: calls.remind, onHint: calls.hint });
    watcher.poke();
    vi.advanceTimersByTime(IDLE_REMIND_MS - 1);
    expect(calls.counts()).toEqual({ remind: 0, hint: 0 });
    vi.advanceTimersByTime(1);
    expect(calls.counts()).toEqual({ remind: 1, hint: 0 });
    vi.advanceTimersByTime(IDLE_HINT_MS - IDLE_REMIND_MS - 1);
    expect(calls.counts()).toEqual({ remind: 1, hint: 0 });
    vi.advanceTimersByTime(1);
    expect(calls.counts()).toEqual({ remind: 1, hint: 1 });
  });

  it('starts the cycle over on every poke', () => {
    const calls = spy();
    const watcher = createIdleWatcher({ onRemind: calls.remind, onHint: calls.hint });
    watcher.poke();
    vi.advanceTimersByTime(14_000);
    watcher.poke();
    vi.advanceTimersByTime(14_900);
    expect(calls.counts()).toEqual({ remind: 0, hint: 0 });
    vi.advanceTimersByTime(100);
    expect(calls.counts()).toEqual({ remind: 1, hint: 0 });
  });

  it('keeps nudging: the cycle repeats after a hint', () => {
    const calls = spy();
    const watcher = createIdleWatcher({ onRemind: calls.remind, onHint: calls.hint });
    watcher.poke();
    vi.advanceTimersByTime(IDLE_HINT_MS);
    expect(calls.counts()).toEqual({ remind: 1, hint: 1 });
    vi.advanceTimersByTime(IDLE_HINT_MS);
    expect(calls.counts()).toEqual({ remind: 2, hint: 2 });
  });

  it('pauses and can be started again', () => {
    const calls = spy();
    const watcher = createIdleWatcher({ onRemind: calls.remind, onHint: calls.hint });
    watcher.poke();
    vi.advanceTimersByTime(10_000);
    watcher.pause();
    vi.advanceTimersByTime(10 * IDLE_HINT_MS);
    expect(calls.counts()).toEqual({ remind: 0, hint: 0 });
    watcher.poke();
    vi.advanceTimersByTime(IDLE_REMIND_MS);
    expect(calls.counts()).toEqual({ remind: 1, hint: 0 });
  });

  it('is final after stop, poke included', () => {
    const calls = spy();
    const watcher = createIdleWatcher({ onRemind: calls.remind, onHint: calls.hint });
    watcher.poke();
    watcher.stop();
    watcher.poke();
    vi.advanceTimersByTime(10 * IDLE_HINT_MS);
    expect(calls.counts()).toEqual({ remind: 0, hint: 0 });
  });

  it('takes its own delays and timers', () => {
    const calls = spy();
    const cleared: number[] = [];
    const watcher = createIdleWatcher({
      onRemind: calls.remind,
      onHint: calls.hint,
      remindAfterMs: 100,
      hintAfterMs: 300,
      timers: {
        setTimeout: (handler, ms) => setTimeout(handler, ms) as unknown as number,
        clearTimeout: (id) => {
          cleared.push(id);
          clearTimeout(id);
        },
      },
    });
    watcher.poke();
    vi.advanceTimersByTime(100);
    expect(calls.counts()).toEqual({ remind: 1, hint: 0 });
    watcher.stop();
    expect(cleared.length).toBeGreaterThan(0);
  });
});
