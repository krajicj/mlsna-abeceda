/**
 * Sound effects (docs/navrh-hry.md ch. 8): plays the pre-generated clips listed in `data/sfx.ts`
 * by id. Unlike the narrator there is NO queue – effects overlap, a new one never cuts a running
 * one, because two taps in a row must both be answered. Bytes are fetched as soon as they are
 * asked for, decoding waits for an unlocked context (rule 6), and every failure – locked audio, a
 * 404, a clip that will not decode, an id that is not in the manifest – means silence: never an
 * exception and never a blocked game (rule 2).
 *
 * The counting ladder is one clip at five playback rates (see `plingRate`), so the whole set is
 * fourteen files and the scale stays in tune.
 */
import { hasSfx, SFX, sfxPath } from '../data/sfx';
import type { AudioEngine } from './context';
import type { FetchLike } from './voice';

export interface SfxPlayer {
  /** Effects overlap; a new one never cuts a running one. An unknown id is silence (+ DEV warn). */
  play(id: string, options?: { readonly rate?: number }): void;
  /** Without an argument the whole manifest. Fetches bytes; decodes once the context is unlocked. */
  preload(ids?: readonly string[]): void;
  setVolume(volume: number): void;
  /** For the manual checks: is everything decoded and ready to answer a tap instantly? */
  readonly ready: boolean;
  destroy(): void;
}

/** `playbackRate` outside this is not a pitch any more, and the browsers disagree about it. */
const MIN_RATE = 0.25;
const MAX_RATE = 4;

function clampRate(rate: number | undefined): number {
  if (rate === undefined || !Number.isFinite(rate)) return 1;
  return Math.min(Math.max(rate, MIN_RATE), MAX_RATE);
}

function clamp01(value: number): number {
  return Math.min(Math.max(Number.isFinite(value) ? value : 1, 0), 1);
}

export function createSfxPlayer(options: {
  readonly engine: AudioEngine;
  /** Defaults to `import.meta.env.BASE_URL` (it ends with a slash). */
  readonly baseUrl?: string;
  /** Tests only; defaults to the global `fetch`. */
  readonly fetch?: FetchLike;
}): SfxPlayer {
  const engine = options.engine;
  const baseUrl = options.baseUrl ?? import.meta.env.BASE_URL;
  const load: FetchLike | null =
    options.fetch ?? (typeof fetch === 'function' ? (url) => fetch(url) : null);

  /** Downloaded files, failures included (a null result is cached so a 404 is asked for once). */
  const bytes = new Map<string, Promise<ArrayBuffer | null>>();
  const buffers = new Map<string, AudioBuffer>();
  /** Everything still sounding, so destroy() can silence a scene that is being torn down. */
  const live = new Set<AudioBufferSourceNode>();
  let bus: GainNode | null = null;
  let volume = 1;
  let destroyed = false;

  function warn(message: string): void {
    if (import.meta.env.DEV) console.warn(`[sfx] ${message}`);
  }

  function fetchBytes(id: string): Promise<ArrayBuffer | null> {
    const cached = bytes.get(id);
    if (cached) return cached;
    const pending: Promise<ArrayBuffer | null> = load
      ? load(`${baseUrl}${sfxPath(id)}`)
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
        // Some implementations detach the input buffer; the next play of the same clip would then
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

  function sfxBus(): GainNode | null {
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

  function start(buffer: AudioBuffer, rate: number): void {
    const context = engine.context;
    const target = sfxBus();
    if (destroyed || !context || !target || context.state !== 'running') return;
    const node = context.createBufferSource();
    node.buffer = buffer;
    node.playbackRate.value = rate;
    node.connect(target);
    node.addEventListener('ended', () => {
      live.delete(node);
      try {
        node.disconnect();
      } catch {
        // already detached
      }
    });
    live.add(node);
    try {
      node.start();
    } catch {
      live.delete(node);
    }
  }

  return {
    play(id, playOptions) {
      if (destroyed) return;
      if (!hasSfx(id)) {
        warn(`unknown effect: ${id}`);
        return;
      }
      const rate = clampRate(playOptions?.rate);
      const ready = buffers.get(id);
      // The common case: preloaded, so the tap is answered in the same tick. A clip that is not
      // decoded yet still plays, just as soon as it lands – late is better than a missing answer.
      if (ready) start(ready, rate);
      else void ensureBuffer(id).then((buffer) => buffer && start(buffer, rate));
    },
    preload(ids) {
      if (destroyed) return;
      for (const id of ids ?? SFX.map((effect) => effect.id)) {
        if (!hasSfx(id)) continue;
        void ensureBuffer(id);
      }
    },
    setVolume(next) {
      volume = clamp01(next);
      if (bus) bus.gain.value = volume;
    },
    get ready() {
      return SFX.every((effect) => buffers.has(effect.id));
    },
    destroy() {
      destroyed = true;
      for (const node of live) {
        try {
          node.stop();
        } catch {
          // already finished
        }
        try {
          node.disconnect();
        } catch {
          // already detached
        }
      }
      live.clear();
      buffers.clear();
      bytes.clear();
      try {
        bus?.disconnect();
      } catch {
        // already detached
      }
      bus = null;
    },
  };
}
