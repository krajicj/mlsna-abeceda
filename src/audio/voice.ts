/**
 * Voice playback (docs/navrh-hry.md ch. 8): plays the pre-generated clips listed in
 * `data/lines.cs.ts` by id, one at a time. Every `say()` cuts whatever is running – the child's tap
 * always wins and two lines never overlap – while the ids inside one `say()` follow each other
 * ("To je bé." then "Hledáme ká."). Bytes are fetched as soon as they are asked for, decoding waits
 * for an unlocked context (rule 6), and every failure – locked audio, a 404, a clip that will not
 * decode, an id that is not in the manifest – means silence: never an exception, never a stuck
 * queue and never a blocked game (rule 2).
 */
import { hasLine } from '../data/lines.cs';
import { clipPath, DEFAULT_VOICE } from '../data/voices';
import type { AudioEngine } from './context';

/** Only the part of `fetch` the player uses, so a test can hand it a stub. */
export type FetchLike = (url: string) => Promise<{
  readonly ok: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
}>;

export interface VoicePlayer {
  /** Cuts the running line and says these ids in order. An id outside the manifest is skipped. */
  say(lines: string | readonly string[]): void;
  /** Immediate silence and an empty queue. */
  stop(): void;
  /** Fetches clips ahead of time (bytes only). Safe before the audio unlock; errors are ignored. */
  preload(lines: readonly string[]): void;
  /** Something is playing or loading right now. */
  readonly speaking: boolean;
  /** 0..1 on the voice bus (parent corner, STEP-17). */
  setVolume(volume: number): void;
  destroy(): void;
}

/** A hidden tab can swallow the `ended` event; this far past the clip the queue moves on anyway. */
const TAIL_MS = 250;

function clamp01(value: number): number {
  return Math.min(Math.max(Number.isFinite(value) ? value : 1, 0), 1);
}

export function createVoicePlayer(options: {
  readonly engine: AudioEngine;
  /** Slug from `src/data/voices.ts`; defaults to `DEFAULT_VOICE`. */
  readonly voice?: string;
  /** Defaults to `import.meta.env.BASE_URL` (it ends with a slash). */
  readonly baseUrl?: string;
  /** Tests only; defaults to the global `fetch`. */
  readonly fetch?: FetchLike;
}): VoicePlayer {
  const engine = options.engine;
  const slug = options.voice ?? DEFAULT_VOICE;
  const baseUrl = options.baseUrl ?? import.meta.env.BASE_URL;
  const load: FetchLike | null =
    options.fetch ?? (typeof fetch === 'function' ? (url) => fetch(url) : null);

  /** Downloaded files, failures included (a null result is cached so a 404 is asked for once). */
  const bytes = new Map<string, Promise<ArrayBuffer | null>>();
  const buffers = new Map<string, AudioBuffer>();
  let queue: string[] = [];
  /** Generation of the current chain: every say()/stop()/destroy() makes older ones stale. */
  let token = 0;
  let source: AudioBufferSourceNode | null = null;
  let bus: GainNode | null = null;
  let volume = 1;
  let speaking = false;
  let endTimer: number | null = null;
  let destroyed = false;

  function warn(message: string): void {
    if (import.meta.env.DEV) console.warn(`[voice] ${message}`);
  }

  function clipUrl(id: string): string {
    return `${baseUrl}${clipPath(slug, id)}`;
  }

  function fetchBytes(id: string): Promise<ArrayBuffer | null> {
    const cached = bytes.get(id);
    if (cached) return cached;
    const pending: Promise<ArrayBuffer | null> = load
      ? load(clipUrl(id))
          .then((response) => (response.ok ? response.arrayBuffer() : null))
          .catch(() => null)
          .then((data) => {
            if (!data) warn(`missing clip: ${id}`);
            return data;
          })
      : Promise.resolve(null);
    bytes.set(id, pending);
    return pending;
  }

  /** Older Safari knows only the callback form and returns nothing; both shapes are handled. */
  function decode(context: AudioContext, data: ArrayBuffer): Promise<AudioBuffer | null> {
    return new Promise((resolve) => {
      let settled = false;
      const done = (buffer: AudioBuffer | null): void => {
        if (settled) return;
        settled = true;
        resolve(buffer);
      };
      try {
        // Some implementations detach the input buffer; a second play of the same clip would then
        // decode from an empty one, so decodeAudioData gets a copy.
        const result: unknown = context.decodeAudioData(
          data.slice(0),
          (buffer) => done(buffer),
          () => done(null),
        );
        if (result instanceof Promise) void result.then(done, () => done(null));
      } catch {
        done(null);
      }
    });
  }

  async function ensureBuffer(id: string): Promise<AudioBuffer | null> {
    const ready = buffers.get(id);
    if (ready) return ready;
    const context = engine.context;
    if (!context) return null; // still locked: nothing to decode into
    const data = await fetchBytes(id);
    if (!data) return null;
    const buffer = await decode(context, data);
    if (buffer) buffers.set(id, buffer);
    else warn(`cannot decode: ${id}`);
    return buffer;
  }

  function clearEndTimer(): void {
    if (endTimer !== null) clearTimeout(endTimer);
    endTimer = null;
  }

  function stopSource(): void {
    clearEndTimer();
    const node = source;
    source = null;
    if (!node) return;
    try {
      node.stop();
    } catch {
      // already finished – nothing to stop
    }
    try {
      node.disconnect();
    } catch {
      // already detached
    }
  }

  function voiceBus(): GainNode | null {
    const context = engine.context;
    const master = engine.master;
    if (!context || !master) return null;
    if (!bus) {
      bus = context.createGain();
      bus.gain.value = volume;
      bus.connect(master);
    }
    return bus;
  }

  function play(id: string, buffer: AudioBuffer, myToken: number): void {
    const context = engine.context;
    const target = voiceBus();
    if (!context || !target || context.state !== 'running') {
      speaking = false; // locked or suspended audio: the rest of the queue stays silent
      return;
    }
    const node = context.createBufferSource();
    node.buffer = buffer;
    node.connect(target);
    node.addEventListener('ended', () => {
      if (myToken !== token) return; // a newer say()/stop() already took over
      clearEndTimer();
      source = null;
      step(myToken);
    });
    source = node;
    try {
      node.start();
    } catch {
      warn(`cannot start: ${id}`);
      source = null;
      step(myToken);
      return;
    }
    endTimer = setTimeout(
      () => {
        endTimer = null;
        if (myToken !== token) return;
        stopSource();
        step(myToken);
      },
      buffer.duration * 1000 + TAIL_MS,
    ) as unknown as number;
  }

  function step(myToken: number): void {
    if (destroyed || myToken !== token) return;
    const id = queue.shift();
    if (id === undefined) {
      speaking = false;
      return;
    }
    void ensureBuffer(id).then((buffer) => {
      if (destroyed || myToken !== token) return;
      if (!buffer) {
        step(myToken); // missing clip: skip it and keep talking
        return;
      }
      play(id, buffer, myToken);
    });
  }

  function known(lines: string | readonly string[]): string[] {
    const ids = typeof lines === 'string' ? [lines] : lines;
    return ids.filter((id) => {
      if (hasLine(id)) return true;
      warn(`unknown line: ${id}`);
      return false;
    });
  }

  return {
    say(lines) {
      if (destroyed) return;
      const ids = known(lines);
      token += 1;
      stopSource();
      queue = ids;
      speaking = ids.length > 0;
      if (speaking) step(token);
    },
    stop() {
      token += 1;
      queue = [];
      speaking = false;
      stopSource();
    },
    preload(lines) {
      if (destroyed) return;
      for (const id of known(lines)) void fetchBytes(id);
    },
    get speaking() {
      return speaking;
    },
    setVolume(next) {
      volume = clamp01(next);
      if (bus) bus.gain.value = volume;
    },
    destroy() {
      destroyed = true;
      token += 1;
      queue = [];
      speaking = false;
      stopSource();
      try {
        bus?.disconnect();
      } catch {
        // the context may already be closed
      }
      bus = null;
      buffers.clear();
      bytes.clear();
    },
  };
}
