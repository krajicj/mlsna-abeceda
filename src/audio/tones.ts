/**
 * Placeholder sound effects, synthesised so the counting item has feedback before the recorded
 * files arrive. STEP-07 brings `sfx.ts` (MP3 by id) and voice, and this module goes away – it
 * deliberately does not take that name. Silent while the engine is locked (rule 6).
 */
import type { AudioEngine } from './context';

export type Cue = 'whoosh' | 'pling' | 'done' | 'nope';

/** C5, D5, E5, G5, A5 – one step up per piece of fruit, so counting sounds like it is going up. */
const PLING_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0];

interface Tone {
  readonly type: OscillatorType;
  readonly from: number;
  /** Same as `from` for a steady note, different for a glide. */
  readonly to: number;
  readonly start: number;
  readonly duration: number;
  readonly peak: number;
}

function tonesOf(cue: Cue, step: number): Tone[] {
  switch (cue) {
    case 'whoosh':
      return [{ type: 'triangle', from: 320, to: 900, start: 0, duration: 0.18, peak: 0.1 }];
    case 'pling': {
      const index =
        ((Math.trunc(step) % PLING_NOTES.length) + PLING_NOTES.length) % PLING_NOTES.length;
      const note = PLING_NOTES[index] ?? PLING_NOTES[0]!;
      return [{ type: 'sine', from: note, to: note, start: 0, duration: 0.22, peak: 0.18 }];
    }
    case 'done':
      return [
        { type: 'sine', from: 783.99, to: 783.99, start: 0, duration: 0.26, peak: 0.18 },
        { type: 'sine', from: 1046.5, to: 1046.5, start: 0.12, duration: 0.26, peak: 0.18 },
      ];
    case 'nope':
      return [{ type: 'sine', from: 220, to: 165, start: 0, duration: 0.2, peak: 0.14 }];
  }
}

/**
 * One cue. `step` picks the note of a 'pling' (0…4, cycling) and is ignored by the others.
 * A locked engine, a missing Web Audio API or a suspended context all mean silence, never a throw.
 */
export function playCue(engine: AudioEngine, cue: Cue, options?: { readonly step?: number }): void {
  const { context, master } = engine;
  if (!context || !master || context.state !== 'running') return;
  const now = context.currentTime;
  for (const tone of tonesOf(cue, options?.step ?? 0)) {
    const oscillator = context.createOscillator();
    oscillator.type = tone.type;
    const from = now + tone.start;
    const to = from + tone.duration;
    oscillator.frequency.setValueAtTime(tone.from, from);
    if (tone.to !== tone.from) oscillator.frequency.exponentialRampToValueAtTime(tone.to, to);
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, from);
    envelope.gain.linearRampToValueAtTime(tone.peak, from + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, to);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(from);
    oscillator.stop(to + 0.02);
  }
}
