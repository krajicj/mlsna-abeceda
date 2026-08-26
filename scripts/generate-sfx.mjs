/**
 * Generates the sound effects of `src/data/sfx.ts` through the ElevenLabs text-to-sound-effects
 * endpoint into `public/audio/sfx/`. It runs locally and rarely: `docker compose run --rm sfx`.
 * The clips are committed, so the game, the build and CI never touch the network and never need a
 * key (CLAUDE.md rules 5 and 9).
 *
 * What actually gets generated is decided by the fingerprint kept in `public/audio/sfx/index.json`
 * (prompt + duration + prompt influence + model + format):
 *   file missing             → generate
 *   fingerprint matches      → skip, costs nothing
 *   prompt or duration moved → regenerate exactly that one effect
 *   effect gone              → report the orphan; deleting stays a manual decision
 *
 * The effects sit at -22 LUFS, 4 dB below the narrator: an effect that shouts over the instruction
 * would cost the child the sentence it needs. On a clip this short the R128 gate can throw away
 * everything it hears and report -inf, so `normalizeClip` falls back to lining the clip up by its
 * true peak; the index then says `"loudness": "peak"` instead of the number.
 *
 * Usage:
 *   docker compose run --rm sfx [--dry-run] [--force] [--only <glob>,…] [--limit <n>]
 *                              [--format <fmt>]
 *   docker compose run --rm normalize-sfx [--dry-run] [--force] [--only <glob>,…]
 *
 * No dependency: one endpoint does not justify an SDK. The manifest is imported WITH the `.ts`
 * extension – Node strips the types itself but resolves no extensionless specifiers.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SFX } from '../src/data/sfx.ts';
import {
  AudioGenError,
  backoff,
  dropPending,
  fail,
  fingerprint,
  list,
  mp3Format,
  normalizeClip,
  readError,
  scopeFilter,
  signed,
  sweepPartials,
  writeAtomic,
} from './lib/audio.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SFX_DIR = join(root, 'public', 'audio', 'sfx');
const INDEX_FILE = join(SFX_DIR, 'index.json');

const API = 'https://api.elevenlabs.io';
const MODEL = 'eleven_text_to_sound_v2';
const DEFAULT_FORMAT = 'mp3_44100_64';
const DEFAULT_PROMPT_INFLUENCE = 0.3; // the API default; in the index so a change is visible
/**
 * Where every effect ends up. -22 LUFS keeps the effects under the -18 LUFS narrator: they are
 * punctuation, not the message. `peakCeiling` is only for the clips the R128 gate cannot measure.
 */
const LOUDNESS = { lufs: -22, truePeak: -1.5, peakCeiling: -3 };

const INDEX_VERSION = 1;
const ID_PATTERN = /^[a-z0-9]+([.-][a-z0-9]+)*$/;
const MIN_BYTES = 1024; // anything smaller is an error page, not audio
const MAX_BYTES = 512 * 1024;

const USAGE = `usage: docker compose run --rm sfx [options]

  --dry-run          print what would be generated; sends nothing
  --force            regenerate even the effects whose fingerprint matches
  --normalize        re-gain the clips already on disk to ${LOUDNESS.lufs} LUFS; no key, no network
  --only <glob>,…    only ids matching a glob ("customer.*", "*.yum")
  --limit <n>        generate at most n clips in this run
  --format <fmt>     ElevenLabs output_format (default ${DEFAULT_FORMAT})`;

function parseArgs(argv) {
  const args = {
    dryRun: false,
    force: false,
    normalize: false,
    only: [],
    limit: Infinity,
    format: DEFAULT_FORMAT,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) fail(`${arg} needs a value`);
      i += 1;
      return next;
    };
    switch (arg) {
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--force':
        args.force = true;
        break;
      case '--normalize':
        args.normalize = true;
        break;
      case '--only':
        args.only = list(value());
        break;
      case '--format':
        args.format = value();
        break;
      case '--limit': {
        const limit = Number(value());
        if (!Number.isInteger(limit) || limit < 1) fail('--limit needs a whole number ≥ 1');
        args.limit = limit;
        break;
      }
      case '--help':
      case '-h':
        console.log(USAGE);
        process.exit(0);
        break;
      default:
        fail(`unknown argument ${arg}\n\n${USAGE}`);
    }
  }
  return args;
}

/** The manifest is data an agent edits by hand, so it gets checked before anything is spent. */
function checkManifest() {
  if (SFX.length === 0) fail('src/data/sfx.ts holds no effect');
  const seen = new Set();
  for (const effect of SFX) {
    if (!ID_PATTERN.test(effect.id)) fail(`"${effect.id}" is not a usable file name`);
    if (seen.has(effect.id)) fail(`src/data/sfx.ts has ${effect.id} twice`);
    if (!effect.prompt?.trim()) fail(`${effect.id} has no prompt`);
    if (!(effect.durationSeconds >= 0.5 && effect.durationSeconds <= 30)) {
      fail(`${effect.id}: duration_seconds must be between 0.5 and 30`);
    }
    const influence = effect.promptInfluence ?? DEFAULT_PROMPT_INFLUENCE;
    if (!(influence >= 0 && influence <= 1)) fail(`${effect.id}: prompt_influence must be 0..1`);
    seen.add(effect.id);
  }
}

/** Everything that decides how the clip sounds, in a fixed key order (see lib/audio.mjs). */
function effectFingerprint(effect, config) {
  return fingerprint({
    prompt: effect.prompt,
    durationSeconds: effect.durationSeconds,
    promptInfluence: effect.promptInfluence ?? DEFAULT_PROMPT_INFLUENCE,
    model: config.model,
    format: config.format,
  });
}

function emptyIndex(config) {
  return { version: INDEX_VERSION, model: config.model, format: config.format, effects: {} };
}

function readIndex(config) {
  if (!existsSync(INDEX_FILE)) return emptyIndex(config);
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(INDEX_FILE, 'utf8'));
  } catch (error) {
    fail(`${INDEX_FILE} is not valid JSON (${error.message}); delete it to start over`);
  }
  if (parsed?.version !== INDEX_VERSION) {
    fail(`${INDEX_FILE}: version ${parsed?.version} is not the expected ${INDEX_VERSION}`);
  }
  return { ...parsed, effects: parsed.effects ?? {} };
}

/** Sorted keys so a diff shows only real changes; the trailing newline keeps Prettier happy. */
function writeIndex(index, config) {
  const effects = {};
  for (const id of Object.keys(index.effects).sort()) effects[id] = index.effects[id];
  const out = {
    version: INDEX_VERSION,
    model: config.model,
    format: config.format,
    effects,
  };
  writeAtomic(INDEX_FILE, `${JSON.stringify(out, null, 2)}\n`);
}

async function sound(effect, config) {
  const url = `${API}/v1/sound-generation?output_format=${encodeURIComponent(config.format)}`;
  for (let attempt = 0; ; attempt += 1) {
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': config.apiKey,
          'content-type': 'application/json',
          accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: effect.prompt,
          duration_seconds: effect.durationSeconds,
          prompt_influence: effect.promptInfluence ?? DEFAULT_PROMPT_INFLUENCE,
          model_id: config.model,
        }),
      });
    } catch (error) {
      await backoff(attempt, `the API is unreachable (${error.message})`);
      continue;
    }
    if (response.ok) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength < MIN_BYTES || bytes.byteLength > MAX_BYTES) {
        fail(`the API returned ${bytes.byteLength} B for "${effect.id}" – that is not a clip`);
      }
      return bytes;
    }
    const detail = await readError(response);
    if (response.status === 401 || response.status === 403) {
      fail(
        `HTTP ${response.status}: invalid key, or it lacks the "Sound Generation" permission` +
          ` (${detail})`,
      );
    }
    if (response.status !== 429 && response.status < 500) {
      fail(`HTTP ${response.status} for "${effect.id}" (${detail})`);
    }
    await backoff(attempt, `HTTP ${response.status} (${detail})`);
  }
}

/**
 * Orphans are looked for against the WHOLE manifest, so `--only` cannot invent them. Nothing is
 * ever deleted – that stays the author's decision.
 */
function findOrphans(index) {
  const known = new Set(SFX.map((effect) => effect.id));
  const orphans = new Set();
  for (const id of Object.keys(index.effects)) {
    if (!known.has(id)) orphans.add(`${id} (index)`);
  }
  if (existsSync(SFX_DIR)) {
    for (const name of readdirSync(SFX_DIR)) {
      if (!name.endsWith('.mp3')) continue;
      if (!known.has(name.slice(0, -'.mp3'.length))) orphans.add(name);
    }
  }
  return [...orphans].sort();
}

function warnOnHeaderChange(index, config) {
  const changes = [];
  if (index.model !== config.model) changes.push(`model ${index.model} → ${config.model}`);
  if (index.format !== config.format) changes.push(`format ${index.format} → ${config.format}`);
  if (changes.length > 0) {
    console.warn(`warning: the index was written with a different setup (${changes.join(', ')});`);
    console.warn('         clips generated now will not match the older ones exactly');
  }
}

function requireKey(config) {
  if (!config.apiKey) {
    fail(
      'ELEVENLABS_API_KEY is missing – put it into ~/.config/mlsna-abeceda/elevenlabs.env' +
        ' (CLAUDE.md rule 9)',
    );
  }
}

/** How the index records what the clip was gained by: the target, or the peak fallback. */
function loudnessOf(mode) {
  if (mode === null) return {};
  return { loudness: mode === 'lufs' ? LOUDNESS.lufs : mode };
}

async function runGenerate(args, config) {
  const index = readIndex(config);
  if (Object.keys(index.effects).length > 0) warnOnHeaderChange(index, config);

  const inScope = scopeFilter(args.only);
  const plan = [];
  const forced = [];
  const counts = { new: 0, changed: 0, ok: 0 };
  for (const effect of SFX) {
    if (!inScope(effect.id)) continue;
    const want = effectFingerprint(effect, config);
    const have = index.effects[effect.id];
    const item = { effect, want };
    if (!have || !existsSync(join(SFX_DIR, `${effect.id}.mp3`))) {
      counts.new += 1;
      plan.push({ ...item, reason: 'new' });
    } else if (have.hash !== want) {
      counts.changed += 1;
      plan.push({ ...item, reason: 'changed' });
    } else {
      counts.ok += 1;
      forced.push({ ...item, reason: 'forced' });
    }
  }
  if (args.force) plan.push(...forced);

  const orphans = findOrphans(index);
  const todo = plan.slice(0, args.limit);
  const seconds = todo.reduce((sum, item) => sum + item.effect.durationSeconds, 0);
  console.log(
    `sfx: ${counts.new + counts.changed + counts.ok} effects · ${counts.new} new · ` +
      `${counts.changed} changed · ${counts.ok} up to date · ${orphans.length} orphan · ` +
      `${seconds.toFixed(1)} s to generate`,
  );
  for (const orphan of orphans) console.log(`  orphan: ${orphan} (delete it by hand if stale)`);
  if (todo.length < plan.length) {
    console.log(`  --limit ${args.limit}: only the first ${todo.length} of ${plan.length}`);
  }

  if (args.dryRun) {
    for (const item of todo) {
      console.log(`  ${item.reason.padEnd(7)} ${item.effect.id}  ${item.effect.prompt}`);
    }
    console.log('\ndry run: nothing was sent and nothing was written');
    return;
  }
  if (todo.length === 0) {
    console.log('nothing to generate');
    return;
  }

  requireKey(config);
  mkdirSync(SFX_DIR, { recursive: true });
  sweepPartials(SFX_DIR);
  let generated = 0;
  for (const item of todo) {
    const { bytes, gain, mode } = normalizeClip(await sound(item.effect, config), {
      format: config.format,
      ...LOUDNESS,
    });
    writeAtomic(join(SFX_DIR, `${item.effect.id}.mp3`), bytes);
    index.effects[item.effect.id] = {
      hash: item.want,
      prompt: item.effect.prompt,
      durationSeconds: item.effect.durationSeconds,
      promptInfluence: item.effect.promptInfluence ?? DEFAULT_PROMPT_INFLUENCE,
      bytes: bytes.byteLength,
      ...loudnessOf(mode),
    };
    // After every single clip, so Ctrl+C never leaves the index describing something else.
    writeIndex(index, config);
    generated += 1;
    console.log(
      `  ${item.effect.id}.mp3  ${(bytes.byteLength / 1024).toFixed(1)} kB` +
        `${gain === null ? '' : `  ${signed(gain)}`}${mode === 'peak' ? '  (by peak)' : ''}`,
    );
  }
  console.log(`\ndone: ${generated} clip(s) in public/audio/sfx/`);
}

/**
 * Re-gains the clips that are already on disk – after the target moves, or for a set generated
 * before this pass existed. No key and no network: the media service runs with none.
 */
function runNormalize(args, config) {
  const index = readIndex(config);
  const stored = {
    ...config,
    model: index.model ?? config.model,
    format: index.format ?? config.format,
  };
  if (mp3Format(stored.format) === null) {
    fail(`--normalize can only re-encode an mp3 format, and the index says ${stored.format}`);
  }
  const inScope = scopeFilter(args.only);
  const todo = [];
  for (const [id, entry] of Object.entries(index.effects)) {
    if (!inScope(id) || (entry.loudness !== undefined && !args.force)) continue;
    const file = join(SFX_DIR, `${id}.mp3`);
    if (!existsSync(file)) {
      console.warn(`  missing: ${id}.mp3 – generate it first`);
      continue;
    }
    todo.push({ id, entry, file });
  }
  console.log(
    `loudness: ${todo.length} clip(s) → ${LOUDNESS.lufs} LUFS,` +
      ` ceiling ${LOUDNESS.truePeak} dBTP (${stored.format})`,
  );
  if (todo.length === 0) {
    console.log('nothing to re-gain');
    return;
  }
  let changed = 0;
  for (const item of todo.slice(0, args.limit === Infinity ? undefined : args.limit)) {
    const { bytes, gain, mode } = normalizeClip(readFileSync(item.file), {
      format: stored.format,
      ...LOUDNESS,
    });
    const label = `  ${item.id}.mp3  ${signed(gain)}${mode === 'peak' ? '  (by peak)' : ''}`;
    if (args.dryRun) {
      console.log(`${label}  (dry run)`);
      continue;
    }
    writeAtomic(item.file, bytes);
    item.entry.bytes = bytes.byteLength;
    Object.assign(item.entry, loudnessOf(mode));
    // After every clip, the same as the generator: Ctrl+C never leaves the index lying.
    writeIndex(index, stored);
    changed += 1;
    console.log(label);
  }
  console.log(
    args.dryRun ? '\ndry run: nothing was written' : `\ndone: ${changed} clip(s) re-gained`,
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = {
    apiKey: process.env.ELEVENLABS_API_KEY ?? '',
    model: MODEL,
    format: args.format,
  };
  checkManifest();
  if (args.normalize) {
    runNormalize(args, config);
    return;
  }
  await runGenerate(args, config);
}

process.on('SIGINT', () => {
  dropPending();
  console.error('\nsfx: interrupted; the clips generated so far and the index stay valid');
  process.exit(130);
});

try {
  await main();
} catch (error) {
  dropPending();
  console.error(`sfx: ${error instanceof AudioGenError ? error.message : error}`);
  process.exit(1);
}
