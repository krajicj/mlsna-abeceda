/**
 * What the two audio generators share: `generate-voice.mjs` (ElevenLabs text-to-speech, one clip
 * per line of `src/data/lines.cs.ts`) and `generate-sfx.mjs` (text-to-sound-effects, one clip per
 * entry of `src/data/sfx.ts`). Both fetch mp3 bytes from the same API, put them through the same
 * loudness pass and keep an index with a fingerprint so a rerun costs nothing.
 *
 * Nothing here knows about voices, lines or effects – the callers own their manifests, their index
 * format and their endpoint. This module owns the boring parts: arguments, globs, atomic writes,
 * ffmpeg, retries.
 *
 * No dependency, the same as the scripts themselves (CLAUDE.md › Supply-chain security).
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Below this the re-encode would only cost quality – the clip is already where we want it. */
const GAIN_EPSILON = 0.1;
/** 429 and 5xx only; anything else is a mistake that a retry cannot fix. */
export const RETRY_DELAYS = [1000, 4000, 9000];

/** A message meant for the author; `main()` prints it without a stack trace. */
export class AudioGenError extends Error {}

export function fail(message) {
  throw new AudioGenError(message);
}

export function list(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/** `*` stands for any part of an id; everything else is literal. */
export function globToRegExp(glob) {
  const escaped = glob.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll('\\*', '.*');
  return new RegExp(`^${escaped}$`);
}

export function scopeFilter(only) {
  if (only.length === 0) return () => true;
  const patterns = only.map(globToRegExp);
  return (id) => patterns.some((pattern) => pattern.test(id));
}

/**
 * Everything that decides how the clip sounds, hashed in the order the caller wrote it. The model
 * and the settings belong in it: the API does not promise a bit-identical result, so the index has
 * to say what produced which file. Changing the shape of the payload regenerates the whole set –
 * for a paid API that is a real cost, so callers keep their key order stable.
 */
export function fingerprint(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);
}

let pendingTemp = null;

/** Write through a temporary file: an interrupted run never leaves half a clip behind. */
export function writeAtomic(path, contents) {
  const temp = `${path}.part`;
  pendingTemp = temp;
  writeFileSync(temp, contents);
  renameSync(temp, path);
  pendingTemp = null;
}

export function dropPending() {
  if (pendingTemp !== null) rmSync(pendingTemp, { force: true });
  pendingTemp = null;
}

export function sweepPartials(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (name.endsWith('.part')) rmSync(join(dir, name), { force: true });
  }
}

/** `mp3_44100_64` → what the re-encode needs; a pcm/ulaw format has no encoder here. */
export function mp3Format(format) {
  const match = /^mp3_(\d+)_(\d+)$/.exec(format);
  return match === null ? null : { rate: match[1], kbps: match[2] };
}

export function ffmpeg(args, input) {
  const run = spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], {
    input,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (run.error) {
    fail(
      `ffmpeg is missing (${run.error.message}) – it lives in the media stage of the image,` +
        ' so run: docker compose build',
    );
  }
  if (run.status !== 0) {
    fail(`ffmpeg exited with ${run.status}: ${String(run.stderr).trim().split('\n').pop()}`);
  }
  return run;
}

/**
 * EBU R128 integrated loudness and true peak of one clip. The gate of R128 ignores the silence
 * around the sentence, which plain RMS does not – a clip with a long lead-in would look quiet.
 */
export function measureLoudness(bytes) {
  const stderr = String(
    ffmpeg(['-i', 'pipe:0', '-af', 'ebur128=peak=true', '-f', 'null', '-'], bytes).stderr,
  );
  // Only the summary at the end; the per-frame lines carry an "I:" of their own.
  const summary = stderr.slice(stderr.lastIndexOf('Summary:'));
  const lufs = /^\s*I:\s*(-?\d+(?:\.\d+)?) LUFS/m.exec(summary);
  const peak = /^\s*Peak:\s*(-?\d+(?:\.\d+)?) dBFS/m.exec(summary);
  if (lufs === null || peak === null) fail('ffmpeg printed no loudness summary for a clip');
  return { lufs: Number(lufs[1]), truePeak: Number(peak[1]) };
}

/**
 * One constant gain, never compression: the whole clip moves to `target.lufs` unless its true peak
 * would cross `target.truePeak` first (a few clips with a sharp consonant stop there, ~1.5 dB
 * short). Returns the clip unchanged when it is already in place or the format has no encoder here.
 */
export function normalizeClip(bytes, target) {
  const format = mp3Format(target.format);
  if (format === null) return { bytes, gain: null };
  const measured = measureLoudness(bytes);
  const gain = Math.min(target.lufs - measured.lufs, target.truePeak - measured.truePeak);
  if (Math.abs(gain) < GAIN_EPSILON) return { bytes, gain: 0 };
  const out = ffmpeg(
    [
      '-i',
      'pipe:0',
      '-af',
      `volume=${gain.toFixed(2)}dB`,
      '-ar',
      format.rate,
      '-b:a',
      `${format.kbps}k`,
      '-map_metadata',
      '-1',
      '-f',
      'mp3',
      'pipe:1',
    ],
    bytes,
  );
  return { bytes: new Uint8Array(out.stdout), gain };
}

export async function readError(response) {
  try {
    return (await response.text()).slice(0, 200).replace(/\s+/g, ' ').trim();
  } catch {
    return 'no body';
  }
}

export async function backoff(attempt, reason) {
  const delay = RETRY_DELAYS[attempt];
  if (delay === undefined) fail(`${reason} – gave up after ${RETRY_DELAYS.length + 1} attempts`);
  console.warn(`  ${reason}; retrying in ${delay / 1000} s`);
  await new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

export function signed(gain) {
  return `${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB`;
}
