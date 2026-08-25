import type { AudioEngine } from './context';

/** Two sine notes, E5 then B5 – a friendly "we are on" cue. STEP-10 replaces it with a clip. */
const NOTES = [
  { frequency: 659.25, start: 0, duration: 0.18 },
  { frequency: 987.77, start: 0.14, duration: 0.22 },
];

const PEAK = 0.22;

/** Placeholder start chime (~350 ms). No-op while the engine is locked. */
export function playStartChime(engine: AudioEngine): void {
  const { context, master } = engine;
  if (!context || !master || context.state !== 'running') return;
  const now = context.currentTime;
  for (const note of NOTES) {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = note.frequency;
    const envelope = context.createGain();
    const from = now + note.start;
    const to = from + note.duration;
    envelope.gain.setValueAtTime(0.0001, from);
    envelope.gain.linearRampToValueAtTime(PEAK, from + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, to);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(from);
    oscillator.stop(to + 0.02);
  }
}
