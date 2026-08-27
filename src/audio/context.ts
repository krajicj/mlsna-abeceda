type AudioContextConstructor = new () => AudioContext;

/** Safari still ships the prefixed constructor; narrow it instead of reaching for `any`. */
function resolveAudioContext(): AudioContextConstructor | null {
  const scope = window as typeof window & { webkitAudioContext?: AudioContextConstructor };
  return scope.AudioContext ?? scope.webkitAudioContext ?? null;
}

export interface AudioEngine {
  /**
   * Live read of `context?.state === 'running'` – not a latch: it goes false again while the
   * context is suspended in the background and true after it resumes.
   */
  readonly unlocked: boolean;
  /** null until unlock() succeeds. */
  readonly context: AudioContext | null;
  /** Master gain – the voice bus hangs here (STEP-08), sfx and music follow in STEP-10. */
  readonly master: GainNode | null;
  readonly masterVolume: number;
  /** Call from a user-gesture handler. Idempotent, never rejects; false = still silent. */
  unlock(): Promise<boolean>;
  /**
   * 0..1; remembered and applied when the context appears. Scaffolding for the volume sliders
   * in STEP-19 – nothing calls it yet except the manual check.
   */
  setMasterVolume(volume: number): void;
  destroy(): void;
}

/** iOS keeps the context silent until something has actually been played from a gesture. */
function primeOutput(context: AudioContext): void {
  const source = context.createBufferSource();
  source.buffer = context.createBuffer(1, 1, context.sampleRate);
  source.connect(context.destination);
  source.start(0);
}

export function createAudioEngine(): AudioEngine {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let volume = 1;

  function onVisibilityChange(): void {
    if (document.visibilityState !== 'visible' || !context) return;
    void context.resume().catch(() => undefined);
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  async function unlock(): Promise<boolean> {
    try {
      if (!context) {
        const Ctor = resolveAudioContext();
        if (!Ctor) return false; // no Web Audio: the game stays silent, never blocked
        context = new Ctor();
        master = context.createGain();
        master.gain.value = volume;
        master.connect(context.destination);
      }
      if (context.state === 'suspended') await context.resume();
      primeOutput(context);
      return context.state === 'running';
    } catch {
      return false;
    }
  }

  return {
    get unlocked() {
      return context?.state === 'running';
    },
    get context() {
      return context;
    },
    get master() {
      return master;
    },
    get masterVolume() {
      return volume;
    },
    unlock,
    setMasterVolume(next: number) {
      volume = Math.min(Math.max(Number.isFinite(next) ? next : 1, 0), 1);
      if (master) master.gain.value = volume;
    },
    destroy() {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      void context?.close().catch(() => undefined);
      context = null;
      master = null;
    },
  };
}
