type AudioContextConstructor = new () => AudioContext;

/** Safari still ships the prefixed constructor; narrow it instead of reaching for `any`. */
function resolveAudioContext(): AudioContextConstructor | null {
  const scope = window as typeof window & { webkitAudioContext?: AudioContextConstructor };
  return scope.AudioContext ?? scope.webkitAudioContext ?? null;
}

/**
 * WebKit runs Web Audio in the "ambient" audio session: on iOS and iPadOS it is then silenced by
 * the mute switch and follows the ringer volume, not the media volume – which is why an iPad with
 * a muted ringer stays silent while the same page speaks on a desktop. Safari 16.4+ lets us ask
 * for the "playback" session instead; everywhere else the property simply does not exist.
 */
function preferPlaybackSession(): void {
  const scope = navigator as Navigator & { audioSession?: { type: string } };
  if (!scope.audioSession) return;
  try {
    scope.audioSession.type = 'playback';
  } catch {
    // read-only or an unknown value: the ambient session is still better than an exception
  }
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
   * in STEP-20 – nothing calls it yet except the manual check.
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

  /**
   * The tap screen is the intended unlock (rule 6), but it gets exactly one try: on an iPad the
   * fullscreen transition shares that gesture, and a resume() that does not make it leaves the
   * game silent for the rest of the run. So every later tap tries again until the context runs –
   * idempotent, and a no-op in the normal case.
   */
  function onGesture(): void {
    if (context?.state === 'running') return;
    void unlock();
  }
  // Both events: `click` is the gesture Safari honours most reliably (STEP-02), `pointerdown` is
  // the one a tap that never becomes a click still produces.
  document.addEventListener('pointerdown', onGesture, { capture: true, passive: true });
  document.addEventListener('click', onGesture, { capture: true });

  async function unlock(): Promise<boolean> {
    try {
      if (!context) {
        const Ctor = resolveAudioContext();
        if (!Ctor) return false; // no Web Audio: the game stays silent, never blocked
        preferPlaybackSession(); // before the context exists – it inherits the session category
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
      document.removeEventListener('pointerdown', onGesture, { capture: true });
      document.removeEventListener('click', onGesture, { capture: true });
      void context?.close().catch(() => undefined);
      context = null;
      master = null;
    },
  };
}
