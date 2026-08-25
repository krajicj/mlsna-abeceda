/**
 * The two-stage idle watcher (docs/navrh-hry.md ch. 5.5): after 15 s of silence the game reminds
 * the child, after 40 s it shows a hint. A hint never does the work for the child and never blocks
 * anything – it only points at where to tap. Timers are injected so the logic is testable in Node.
 */
export const IDLE_REMIND_MS = 15_000;
export const IDLE_HINT_MS = 40_000;

/** For the tests; the browser passes window.setTimeout/clearTimeout. */
export interface IdleTimers {
  setTimeout(handler: () => void, ms: number): number;
  clearTimeout(id: number): void;
}

export interface IdleWatcher {
  /** The child did something: the cycle starts again from zero. */
  poke(): void;
  /** Cancels the scheduled reminders; the next poke() starts them again. */
  pause(): void;
  /** The end (item finished, scene going away); poke() does nothing after this. */
  stop(): void;
}

const defaultTimers: IdleTimers = {
  setTimeout: (handler, ms) => setTimeout(handler, ms) as unknown as number,
  clearTimeout: (id) => clearTimeout(id),
};

/**
 * After `poke()` schedules `onRemind` in `remindAfterMs` and `onHint` in `hintAfterMs` (both from
 * the last `poke()`). After `onHint` the cycle starts over, so the child is never left without a
 * nudge. A fresh watcher is idle – it only starts running on the first `poke()`.
 */
export function createIdleWatcher(options: {
  readonly onRemind: () => void;
  readonly onHint: () => void;
  readonly remindAfterMs?: number;
  readonly hintAfterMs?: number;
  readonly timers?: IdleTimers;
}): IdleWatcher {
  const timers = options.timers ?? defaultTimers;
  const remindAfterMs = options.remindAfterMs ?? IDLE_REMIND_MS;
  const hintAfterMs = options.hintAfterMs ?? IDLE_HINT_MS;
  let remindId: number | null = null;
  let hintId: number | null = null;
  let stopped = false;

  function clear(): void {
    if (remindId !== null) timers.clearTimeout(remindId);
    if (hintId !== null) timers.clearTimeout(hintId);
    remindId = null;
    hintId = null;
  }

  function schedule(): void {
    clear();
    remindId = timers.setTimeout(() => {
      remindId = null;
      options.onRemind();
    }, remindAfterMs);
    hintId = timers.setTimeout(() => {
      hintId = null;
      options.onHint();
      if (!stopped) schedule();
    }, hintAfterMs);
  }

  return {
    poke() {
      if (stopped) return;
      schedule();
    },
    pause() {
      clear();
    },
    stop() {
      stopped = true;
      clear();
    },
  };
}
