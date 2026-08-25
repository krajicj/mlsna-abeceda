/**
 * "Do this in N ms – but never over the narrator." The praise after the last strawberry, the finale
 * after the praise and the next order after the star all need the same thing: a delay that stretches
 * while a sentence is still running. Nothing is ever dropped (rule 2): after `maxWaits` postponements
 * it runs anyway, so a clip that never reports its end cannot stall the loop.
 */
import type { VoicePlayer } from '../../audio/voice';
import type { IdleTimers } from '../../game/idle';

/** How long one postponement lasts. */
export const PACER_RETRY_MS = 250;
/** …and how many of them, before the waiting stops being polite. */
export const PACER_MAX_WAITS = 16;

export interface Pacer {
  /** Runs `run` after `delayMs`, waiting out a sentence in progress. Replaces anything pending. */
  after(delayMs: number, run: () => void): void;
  /** Drops what is pending; the scene going away or a new order both do this. */
  cancel(): void;
}

const defaultTimers: IdleTimers = {
  setTimeout: (handler, ms) => setTimeout(handler, ms) as unknown as number,
  clearTimeout: (id) => clearTimeout(id),
};

export function createPacer(options: {
  readonly voice: VoicePlayer;
  readonly retryMs?: number;
  readonly maxWaits?: number;
  /** Tests only; the browser leaves the default. Same shape as `IdleTimers` in game/idle.ts. */
  readonly timers?: IdleTimers;
}): Pacer {
  const timers = options.timers ?? defaultTimers;
  const retryMs = options.retryMs ?? PACER_RETRY_MS;
  const maxWaits = options.maxWaits ?? PACER_MAX_WAITS;
  let id: number | null = null;
  let waits = 0;

  function cancel(): void {
    if (id !== null) timers.clearTimeout(id);
    id = null;
  }

  function schedule(delayMs: number, run: () => void): void {
    id = timers.setTimeout(() => {
      id = null;
      if (options.voice.speaking && waits < maxWaits) {
        waits += 1;
        schedule(retryMs, run);
        return;
      }
      run();
    }, delayMs);
  }

  return {
    after(delayMs, run) {
      cancel();
      waits = 0;
      schedule(delayMs, run);
    },
    cancel,
  };
}
