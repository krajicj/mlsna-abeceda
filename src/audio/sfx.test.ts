import { describe, expect, it, vi } from 'vitest';
import { SFX } from '../data/sfx';
import type { AudioEngine } from './context';
import { createSfxPlayer } from './sfx';
import type { FetchLike } from './voice';

const BASE = '/mlsna-abeceda/';

interface FakeSource {
  started: boolean;
  stopped: boolean;
  rate: number;
  /** Fires the `ended` listener the player attached, the way the real node would. */
  end(): void;
}

interface FakeAudio {
  readonly engine: AudioEngine;
  readonly sources: FakeSource[];
  readonly gains: { value: number }[];
}

/** The slice of the Web Audio API the player touches (same shape as in voice.test.ts). */
function fakeAudio(options?: {
  readonly state?: AudioContextState | 'missing';
  readonly decode?: 'ok' | 'fail';
}): FakeAudio {
  const state = options?.state ?? 'running';
  const sources: FakeSource[] = [];
  const gains: { value: number }[] = [];
  const context = {
    state,
    createGain: () => {
      const gain = { value: 1 };
      gains.push(gain);
      return { gain, connect: () => undefined, disconnect: () => undefined };
    },
    createBufferSource: () => {
      const listeners: (() => void)[] = [];
      const source: FakeSource = {
        started: false,
        stopped: false,
        rate: 1,
        end: () => {
          for (const listener of [...listeners]) listener();
        },
      };
      sources.push(source);
      return {
        buffer: null,
        playbackRate: {
          get value() {
            return source.rate;
          },
          set value(next: number) {
            source.rate = next;
          },
        },
        connect: () => undefined,
        disconnect: () => undefined,
        addEventListener: (name: string, listener: () => void) => {
          if (name === 'ended') listeners.push(listener);
        },
        start: () => void (source.started = true),
        stop: () => void (source.stopped = true),
      };
    },
    decodeAudioData: () =>
      options?.decode === 'fail'
        ? Promise.reject(new Error('not an mp3'))
        : Promise.resolve({ duration: 0.5 }),
  };
  const engine = {
    unlocked: state === 'running',
    context: state === 'missing' ? null : context,
    master: state === 'missing' ? null : { connect: () => undefined },
    masterVolume: 1,
  } as unknown as AudioEngine;
  return { engine, sources, gains };
}

function fakeFetch(options?: { readonly missing?: readonly string[] }): {
  readonly fetch: FetchLike;
  readonly urls: string[];
} {
  const urls: string[] = [];
  const fetch: FetchLike = (url) => {
    urls.push(url);
    const missing = options?.missing?.some((part) => url.includes(part)) ?? false;
    return Promise.resolve({
      ok: !missing,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(missing ? 0 : 16)),
    });
  };
  return { fetch, urls };
}

/** One macrotask drains every promise the fetch → decode → play chain queued. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function silenceWarnings(): void {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
}

describe('createSfxPlayer', () => {
  it('fetches the clip and plays it', async () => {
    const audio = fakeAudio();
    const net = fakeFetch();
    const sfx = createSfxPlayer({ engine: audio.engine, baseUrl: BASE, fetch: net.fetch });

    sfx.play('bell');
    await flush();

    expect(net.urls).toEqual([`${BASE}audio/sfx/bell.mp3`]);
    expect(audio.sources).toHaveLength(1);
    expect(audio.sources[0]?.started).toBe(true);
  });

  it('lets effects overlap instead of cutting the running one', async () => {
    const audio = fakeAudio();
    const sfx = createSfxPlayer({
      engine: audio.engine,
      baseUrl: BASE,
      fetch: fakeFetch().fetch,
    });

    sfx.preload(['pling']);
    await flush();
    sfx.play('pling');
    sfx.play('pling');

    expect(audio.sources).toHaveLength(2);
    expect(audio.sources.every((source) => source.started)).toBe(true);
    expect(audio.sources.some((source) => source.stopped)).toBe(false);
  });

  it('answers a preloaded effect in the same tick', async () => {
    const audio = fakeAudio();
    const sfx = createSfxPlayer({
      engine: audio.engine,
      baseUrl: BASE,
      fetch: fakeFetch().fetch,
    });

    sfx.preload(['nope']);
    await flush();
    sfx.play('nope');

    expect(audio.sources[0]?.started).toBe(true); // no await: a tap cannot wait for a promise
  });

  it('climbs the counting ladder with playbackRate', async () => {
    const audio = fakeAudio();
    const sfx = createSfxPlayer({
      engine: audio.engine,
      baseUrl: BASE,
      fetch: fakeFetch().fetch,
    });

    sfx.preload(['pling']);
    await flush();
    sfx.play('pling', { rate: 2 ** (4 / 12) });

    expect(audio.sources[0]?.rate).toBeCloseTo(1.2599, 4);
  });

  it('refuses a rate the audio graph would choke on', async () => {
    const audio = fakeAudio();
    const sfx = createSfxPlayer({
      engine: audio.engine,
      baseUrl: BASE,
      fetch: fakeFetch().fetch,
    });

    sfx.preload(['pling']);
    await flush();
    sfx.play('pling', { rate: Number.NaN });
    sfx.play('pling', { rate: 99 });
    sfx.play('pling', { rate: 0 });

    expect(audio.sources.map((source) => source.rate)).toEqual([1, 4, 0.25]);
  });

  it('stays silent on an id outside the manifest', async () => {
    silenceWarnings();
    const audio = fakeAudio();
    const net = fakeFetch();
    const sfx = createSfxPlayer({ engine: audio.engine, baseUrl: BASE, fetch: net.fetch });

    expect(() => sfx.play('there-is-no-such-sound')).not.toThrow();
    await flush();

    expect(net.urls).toEqual([]);
    expect(audio.sources).toHaveLength(0);
  });

  it('stays silent while the audio is locked', async () => {
    const audio = fakeAudio({ state: 'missing' });
    const sfx = createSfxPlayer({
      engine: audio.engine,
      baseUrl: BASE,
      fetch: fakeFetch().fetch,
    });

    sfx.play('bell');
    await flush();

    expect(audio.sources).toHaveLength(0);
  });

  it('asks for a missing clip once and keeps playing the rest', async () => {
    silenceWarnings();
    const audio = fakeAudio();
    const net = fakeFetch({ missing: ['bell'] });
    const sfx = createSfxPlayer({ engine: audio.engine, baseUrl: BASE, fetch: net.fetch });

    sfx.play('bell');
    await flush();
    sfx.play('bell');
    await flush();
    sfx.play('done');
    await flush();

    expect(net.urls.filter((url) => url.includes('bell'))).toHaveLength(1);
    expect(audio.sources).toHaveLength(1); // only `done`
  });

  it('stays silent when a clip will not decode', async () => {
    silenceWarnings();
    const audio = fakeAudio({ decode: 'fail' });
    const sfx = createSfxPlayer({
      engine: audio.engine,
      baseUrl: BASE,
      fetch: fakeFetch().fetch,
    });

    sfx.play('bell');
    await flush();

    expect(audio.sources).toHaveLength(0);
  });

  it('reports ready only once the whole manifest is decoded', async () => {
    const audio = fakeAudio();
    const sfx = createSfxPlayer({
      engine: audio.engine,
      baseUrl: BASE,
      fetch: fakeFetch().fetch,
    });

    expect(sfx.ready).toBe(false);
    sfx.preload(['bell']);
    await flush();
    expect(sfx.ready).toBe(false);

    sfx.preload();
    await flush();
    expect(sfx.ready).toBe(true);
  });

  it('preloads the whole manifest and never asks for the same file twice', async () => {
    const audio = fakeAudio();
    const net = fakeFetch();
    const sfx = createSfxPlayer({ engine: audio.engine, baseUrl: BASE, fetch: net.fetch });

    sfx.preload();
    await flush();
    sfx.preload();
    await flush();

    expect(net.urls).toHaveLength(SFX.length);
  });

  it('keeps the volume on its own bus', async () => {
    const audio = fakeAudio();
    const sfx = createSfxPlayer({
      engine: audio.engine,
      baseUrl: BASE,
      fetch: fakeFetch().fetch,
    });

    sfx.preload(['bell']);
    await flush();
    sfx.play('bell');
    sfx.setVolume(0.4);

    expect(audio.gains[0]?.value).toBe(0.4);
    sfx.setVolume(Number.NaN);
    expect(audio.gains[0]?.value).toBe(1);
  });

  it('goes quiet on destroy and stays quiet afterwards', async () => {
    const audio = fakeAudio();
    const sfx = createSfxPlayer({
      engine: audio.engine,
      baseUrl: BASE,
      fetch: fakeFetch().fetch,
    });

    sfx.preload(['steps']);
    await flush();
    sfx.play('steps');
    sfx.destroy();

    expect(audio.sources[0]?.stopped).toBe(true);
    sfx.play('steps');
    await flush();
    expect(audio.sources).toHaveLength(1);
  });
});
