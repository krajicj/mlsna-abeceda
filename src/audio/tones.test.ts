import { describe, expect, it } from 'vitest';
import type { AudioEngine } from './context';
import { playCue, type Cue } from './tones';

const CUES: Cue[] = ['whoosh', 'pling', 'done', 'nope'];

interface FakeEngine {
  readonly engine: AudioEngine;
  readonly oscillators: FakeOscillator[];
  readonly gains: number[];
  readonly frequencies: number[];
}

interface FakeOscillator {
  type: string;
  started: number | null;
  stopped: number | null;
}

/** The slice of the Web Audio API `playCue` touches, shaped like the one `chime.ts` uses. */
function fakeEngine(state: AudioContextState | 'missing'): FakeEngine {
  const oscillators: FakeOscillator[] = [];
  const gains: number[] = [];
  const frequencies: number[] = [];
  const param = (into: number[]) => ({
    setValueAtTime: (value: number) => void into.push(value),
    linearRampToValueAtTime: (value: number) => void into.push(value),
    exponentialRampToValueAtTime: (value: number) => void into.push(value),
  });
  const context = {
    state,
    currentTime: 1.5,
    createOscillator: () => {
      const oscillator: FakeOscillator = { type: 'sine', started: null, stopped: null };
      oscillators.push(oscillator);
      return {
        get type() {
          return oscillator.type;
        },
        set type(value: string) {
          oscillator.type = value;
        },
        frequency: param(frequencies),
        connect: () => undefined,
        start: (at: number) => void (oscillator.started = at),
        stop: (at: number) => void (oscillator.stopped = at),
      };
    },
    createGain: () => ({ gain: param(gains), connect: () => undefined }),
  };
  const engine = {
    unlocked: state === 'running',
    context: state === 'missing' ? null : context,
    master: state === 'missing' ? null : { connect: () => undefined },
    masterVolume: 1,
  } as unknown as AudioEngine;
  return { engine, oscillators, gains, frequencies };
}

describe('playCue', () => {
  it.each(CUES)('plays %s through the unlocked engine', (cue) => {
    const fake = fakeEngine('running');
    playCue(fake.engine, cue);
    expect(fake.oscillators.length).toBeGreaterThan(0);
    for (const oscillator of fake.oscillators) {
      expect(oscillator.started).not.toBeNull();
      expect(oscillator.stopped).not.toBeNull();
      expect(oscillator.stopped!).toBeGreaterThan(oscillator.started!);
    }
  });

  it.each(CUES)('keeps %s quieter than a quarter of full scale', (cue) => {
    const fake = fakeEngine('running');
    playCue(fake.engine, cue);
    expect(Math.max(...fake.gains)).toBeLessThanOrEqual(0.25);
  });

  it('walks the pling up the scale and cycles back around', () => {
    const noteOf = (step: number): number => {
      const fake = fakeEngine('running');
      playCue(fake.engine, 'pling', { step });
      expect(fake.oscillators).toHaveLength(1);
      return fake.frequencies[0]!;
    };
    const scale = [0, 1, 2, 3, 4].map(noteOf);
    expect(scale).toEqual([523.25, 587.33, 659.25, 783.99, 880.0]);
    expect(noteOf(5)).toBe(scale[0]);
    expect(noteOf(-1)).toBe(scale[4]);
    expect(noteOf(12)).toBe(scale[2]);
  });

  it('glides the whoosh up and the nope down', () => {
    const rising = fakeEngine('running');
    playCue(rising.engine, 'whoosh');
    expect(rising.frequencies).toEqual([320, 900]);
    expect(rising.oscillators[0]!.type).toBe('triangle');
    const falling = fakeEngine('running');
    playCue(falling.engine, 'nope');
    expect(falling.frequencies).toEqual([220, 165]);
  });

  it('rings the done cue as two notes, the second one later', () => {
    const fake = fakeEngine('running');
    playCue(fake.engine, 'done');
    expect(fake.oscillators).toHaveLength(2);
    expect(fake.oscillators[1]!.started!).toBeGreaterThan(fake.oscillators[0]!.started!);
  });

  it.each(['suspended', 'closed', 'missing'] as const)(
    'stays silent when the engine is %s',
    (state) => {
      const fake = fakeEngine(state);
      for (const cue of CUES) expect(() => playCue(fake.engine, cue)).not.toThrow();
      expect(fake.oscillators).toEqual([]);
    },
  );
});
