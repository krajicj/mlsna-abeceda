import { describe, expect, it } from 'vitest';
import type { VoicePlayer } from '../../audio/voice';
import type { IdleTimers } from '../../game/idle';
import { createPacer, PACER_MAX_WAITS, PACER_RETRY_MS } from './pacing';

/** Timers under our control: `run(ms)` moves the clock and fires whatever is due. */
function fakeTimers(): IdleTimers & { run(ms: number): void; readonly pending: number } {
  let now = 0;
  let nextId = 1;
  const jobs = new Map<number, { at: number; handler: () => void }>();
  return {
    get pending() {
      return jobs.size;
    },
    setTimeout(handler, ms) {
      const id = nextId++;
      jobs.set(id, { at: now + ms, handler });
      return id;
    },
    clearTimeout(id) {
      jobs.delete(id);
    },
    run(ms) {
      const until = now + ms;
      // One job may schedule the next one; keep firing until nothing is due any more.
      for (;;) {
        const due = [...jobs.entries()]
          .filter(([, job]) => job.at <= until)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        const [id, job] = due;
        jobs.delete(id);
        now = job.at;
        job.handler();
      }
      now = until;
    },
  };
}

/** Only `speaking` matters here; the rest of the player is never touched. */
function silentVoice(speaking = false): VoicePlayer & { speaking: boolean } {
  return {
    speaking,
    say: () => undefined,
    stop: () => undefined,
    preload: () => undefined,
    setVolume: () => undefined,
    destroy: () => undefined,
  };
}

describe('createPacer', () => {
  it('runs on time while the narrator is quiet', () => {
    const timers = fakeTimers();
    const pacer = createPacer({ voice: silentVoice(), timers });
    let ran = 0;
    pacer.after(400, () => (ran += 1));
    timers.run(399);
    expect(ran).toBe(0);
    timers.run(1);
    expect(ran).toBe(1);
  });

  it('waits out a sentence and runs as soon as it ends', () => {
    const timers = fakeTimers();
    const voice = silentVoice(true);
    const pacer = createPacer({ voice, timers });
    let ran = 0;
    pacer.after(400, () => (ran += 1));
    timers.run(400 + PACER_RETRY_MS * 3);
    expect(ran).toBe(0);
    voice.speaking = false;
    timers.run(PACER_RETRY_MS);
    expect(ran).toBe(1);
  });

  it('gives up waiting rather than dropping the line (rule 2)', () => {
    const timers = fakeTimers();
    const pacer = createPacer({ voice: silentVoice(true), timers });
    let ran = 0;
    pacer.after(400, () => (ran += 1));
    timers.run(400 + PACER_RETRY_MS * PACER_MAX_WAITS);
    expect(ran).toBe(1);
  });

  it('counts the waits of each call on its own', () => {
    const timers = fakeTimers();
    const voice = silentVoice(true);
    const pacer = createPacer({ voice, timers, maxWaits: 2, retryMs: 100 });
    let ran = 0;
    pacer.after(100, () => (ran += 1));
    timers.run(100 + 100); // one wait used
    expect(ran).toBe(0);
    pacer.after(100, () => (ran += 1)); // a fresh call starts counting again
    timers.run(100 + 100);
    expect(ran).toBe(0);
    timers.run(100);
    expect(ran).toBe(1);
  });

  it('replaces what was pending instead of running it twice', () => {
    const timers = fakeTimers();
    const pacer = createPacer({ voice: silentVoice(), timers });
    const ran: string[] = [];
    pacer.after(400, () => ran.push('first'));
    pacer.after(200, () => ran.push('second'));
    timers.run(1000);
    expect(ran).toEqual(['second']);
  });

  it('cancels what is pending and leaves no timer behind', () => {
    const timers = fakeTimers();
    const pacer = createPacer({ voice: silentVoice(), timers });
    let ran = 0;
    pacer.after(400, () => (ran += 1));
    pacer.cancel();
    timers.run(2000);
    expect(ran).toBe(0);
    expect(timers.pending).toBe(0);
  });

  it('cancels a call that is already waiting for the narrator', () => {
    const timers = fakeTimers();
    const pacer = createPacer({ voice: silentVoice(true), timers });
    let ran = 0;
    pacer.after(100, () => (ran += 1));
    timers.run(100 + PACER_RETRY_MS);
    pacer.cancel();
    timers.run(10_000);
    expect(ran).toBe(0);
    expect(timers.pending).toBe(0);
  });
});
