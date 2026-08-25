import { describe, expect, it, vi } from 'vitest';
import type { AudioEngine } from './context';
import { createVoicePlayer, type FetchLike } from './voice';

const BASE = '/mlsna-abeceda/';
const CLIP_MS = 400;

interface FakeSource {
  started: boolean;
  stopped: boolean;
  /** Fires the `ended` listener the player attached, the way the real node would. */
  end(): void;
}

interface FakeAudio {
  readonly engine: AudioEngine;
  readonly sources: FakeSource[];
  readonly gains: { value: number }[];
}

/** The slice of the Web Audio API the player touches (same shape as in tones.test.ts). */
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
        end: () => {
          for (const listener of [...listeners]) listener();
        },
      };
      sources.push(source);
      return {
        buffer: null,
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
        : Promise.resolve({ duration: CLIP_MS / 1000 }),
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

describe('createVoicePlayer', () => {
  it('fetches the clip of the narrator and plays it', async () => {
    const audio = fakeAudio();
    const net = fakeFetch();
    const voice = createVoicePlayer({ engine: audio.engine, baseUrl: BASE, fetch: net.fetch });
    voice.say('count.3');
    await flush();
    expect(net.urls).toEqual([`${BASE}audio/voice/cook/count.3.mp3`]);
    expect(audio.sources).toHaveLength(1);
    expect(audio.sources[0]!.started).toBe(true);
    expect(voice.speaking).toBe(true);
    voice.destroy();
  });

  it('says the lines of one call in order, the next one only after the first ends', async () => {
    const audio = fakeAudio();
    const net = fakeFetch();
    const voice = createVoicePlayer({ engine: audio.engine, baseUrl: BASE, fetch: net.fetch });
    voice.say(['order.letter.k', 'letter.word.k.kocka']);
    await flush();
    expect(audio.sources).toHaveLength(1);
    expect(net.urls).toHaveLength(1);
    audio.sources[0]!.end();
    await flush();
    expect(audio.sources).toHaveLength(2);
    expect(net.urls[1]).toBe(`${BASE}audio/voice/cook/letter.word.k.kocka.mp3`);
    audio.sources[1]!.end();
    await flush();
    expect(voice.speaking).toBe(false);
    voice.destroy();
  });

  it('cuts the running line and forgets the rest of its queue', async () => {
    const audio = fakeAudio();
    const net = fakeFetch();
    const voice = createVoicePlayer({ engine: audio.engine, baseUrl: BASE, fetch: net.fetch });
    voice.say(['count.1', 'count.2']);
    await flush();
    const first = audio.sources[0]!;
    voice.say('count.3');
    expect(first.stopped).toBe(true);
    await flush();
    expect(audio.sources).toHaveLength(2);
    // The stale chain must stay stale: a late `ended` of the cut line says nothing any more.
    first.end();
    await flush();
    expect(audio.sources).toHaveLength(2);
    expect(net.urls).toEqual([
      `${BASE}audio/voice/cook/count.1.mp3`,
      `${BASE}audio/voice/cook/count.3.mp3`,
    ]);
    voice.destroy();
  });

  it('goes quiet on stop() and on destroy()', async () => {
    const audio = fakeAudio();
    const net = fakeFetch();
    const voice = createVoicePlayer({ engine: audio.engine, baseUrl: BASE, fetch: net.fetch });
    voice.say(['count.1', 'count.2']);
    await flush();
    voice.stop();
    expect(audio.sources[0]!.stopped).toBe(true);
    expect(voice.speaking).toBe(false);
    await flush();
    expect(audio.sources).toHaveLength(1);

    voice.say('count.4');
    await flush();
    expect(audio.sources).toHaveLength(2);
    voice.destroy();
    expect(audio.sources[1]!.stopped).toBe(true);
    expect(voice.speaking).toBe(false);
    voice.say('count.5');
    await flush();
    expect(audio.sources).toHaveLength(2);
  });

  it('asks for nothing when the id is not in the manifest', async () => {
    silenceWarnings();
    const audio = fakeAudio();
    const net = fakeFetch();
    const voice = createVoicePlayer({ engine: audio.engine, baseUrl: BASE, fetch: net.fetch });
    expect(() => voice.say('nope.nope')).not.toThrow();
    await flush();
    expect(net.urls).toEqual([]);
    expect(audio.sources).toEqual([]);
    expect(voice.speaking).toBe(false);
    voice.destroy();
  });

  it('skips a clip that is missing and keeps talking', async () => {
    silenceWarnings();
    const audio = fakeAudio();
    const net = fakeFetch({ missing: ['count.1.mp3'] });
    const voice = createVoicePlayer({ engine: audio.engine, baseUrl: BASE, fetch: net.fetch });
    voice.say(['count.1', 'count.2']);
    await flush();
    expect(net.urls).toHaveLength(2);
    expect(audio.sources).toHaveLength(1); // only the second line is heard
    voice.destroy();
  });

  it('survives a fetch that rejects and a clip that will not decode', async () => {
    silenceWarnings();
    const offline = fakeAudio();
    const dead: FetchLike = () => Promise.reject(new Error('offline'));
    const first = createVoicePlayer({ engine: offline.engine, baseUrl: BASE, fetch: dead });
    expect(() => first.say('count.1')).not.toThrow();
    await flush();
    expect(offline.sources).toEqual([]);
    expect(first.speaking).toBe(false);
    first.destroy();

    const broken = fakeAudio({ decode: 'fail' });
    const net = fakeFetch();
    const second = createVoicePlayer({ engine: broken.engine, baseUrl: BASE, fetch: net.fetch });
    second.say('count.1');
    await flush();
    expect(broken.sources).toEqual([]);
    expect(second.speaking).toBe(false);
    second.destroy();
  });

  it.each(['missing', 'suspended'] as const)('stays silent while the engine is %s', async (how) => {
    const audio = fakeAudio({ state: how });
    const net = fakeFetch();
    const voice = createVoicePlayer({ engine: audio.engine, baseUrl: BASE, fetch: net.fetch });
    expect(() => voice.say('count.1')).not.toThrow();
    await flush();
    expect(audio.sources).toEqual([]);
    expect(voice.speaking).toBe(false);
    voice.destroy();
  });

  it('fetches a preloaded clip once, before the audio is unlocked', async () => {
    const locked = fakeAudio({ state: 'missing' });
    const net = fakeFetch();
    const voice = createVoicePlayer({ engine: locked.engine, baseUrl: BASE, fetch: net.fetch });
    voice.preload(['count.1', 'count.1', 'nope.nope']);
    await flush();
    expect(net.urls).toEqual([`${BASE}audio/voice/cook/count.1.mp3`]);
    voice.destroy();

    const audio = fakeAudio();
    const other = fakeFetch();
    const ready = createVoicePlayer({ engine: audio.engine, baseUrl: BASE, fetch: other.fetch });
    ready.preload(['count.2']);
    ready.say('count.2');
    await flush();
    expect(other.urls).toHaveLength(1);
    expect(audio.sources).toHaveLength(1);
    ready.destroy();
  });

  it('plays the same clip again without fetching it again', async () => {
    const audio = fakeAudio();
    const net = fakeFetch();
    const voice = createVoicePlayer({ engine: audio.engine, baseUrl: BASE, fetch: net.fetch });
    voice.say('count.1');
    await flush();
    voice.say('count.1');
    await flush();
    expect(net.urls).toHaveLength(1);
    expect(audio.sources).toHaveLength(2);
    voice.destroy();
  });

  it('keeps the voice bus between 0 and 1', async () => {
    const audio = fakeAudio();
    const net = fakeFetch();
    const voice = createVoicePlayer({ engine: audio.engine, baseUrl: BASE, fetch: net.fetch });
    voice.setVolume(0.5);
    voice.say('count.1');
    await flush();
    expect(audio.gains).toHaveLength(1);
    expect(audio.gains[0]!.value).toBe(0.5);
    voice.setVolume(2);
    expect(audio.gains[0]!.value).toBe(1);
    voice.setVolume(-1);
    expect(audio.gains[0]!.value).toBe(0);
    voice.setVolume(Number.NaN);
    expect(audio.gains[0]!.value).toBe(1);
    voice.destroy();
  });
});
