/**
 * Generates the Czech voice lines of `src/data/lines.cs.ts` through the ElevenLabs REST API into
 * `public/audio/voice/<slug>/`, one folder per narrator from `src/data/voices.ts`. It runs locally
 * and rarely: `docker compose run --rm voice`. The clips are committed, so the game, the build and
 * CI never touch the network and never need a key (CLAUDE.md rules 5 and 9).
 *
 * What actually gets generated is decided by the fingerprint kept in `public/audio/voice/index.json`
 * (text + voice + model + format + voice settings):
 *   file missing             → generate
 *   fingerprint matches      → skip, costs nothing
 *   text or voice changed    → regenerate exactly that one line
 *   line or voice gone       → report the orphan; deleting stays a manual decision
 *
 * ElevenLabs returns every sentence at its own level (the first set spanned 28 dB, so "Jedna." was
 * a whisper next to "Ef je tady!"). Every clip therefore goes through a loudness pass before it is
 * written: ffmpeg measures EBU R128 integrated loudness and true peak, and the clip is re-encoded
 * with ONE constant gain – no compression, so a one-second sentence keeps its shape. `--normalize`
 * does the same for clips that are already on disk.
 *
 * Usage:
 *   docker compose run --rm voice [--dry-run] [--force] [--voice <slug>,…] [--only <glob>,…]
 *                                 [--limit <n>] [--format <fmt>]
 *   docker compose run --rm normalize [--dry-run] [--force] [--voice <slug>,…] [--only <glob>,…]
 *   docker compose run --rm voice --casting [--candidates <elevenlabs-id>,…]
 *   docker compose run --rm voice --list-voices
 *
 * No dependency: three endpoints do not justify an SDK. The manifests are imported WITH the `.ts`
 * extension – Node strips the types itself but resolves no extensionless specifiers.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CASTING_LINES, LINES } from '../src/data/lines.cs.ts';
import { VOICES } from '../src/data/voices.ts';
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
const VOICE_DIR = join(root, 'public', 'audio', 'voice');
const INDEX_FILE = join(VOICE_DIR, 'index.json');
const CASTING_DIR = join(root, 'casting');

const API = 'https://api.elevenlabs.io';
const MODEL = 'eleven_multilingual_v2';
const DEFAULT_FORMAT = 'mp3_44100_64';
/** Deliberately no `speed`: support differs per model and a rejected request costs a whole run. */
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true,
};
/**
 * Where every clip ends up. -18 LUFS is as loud as this set can go while a constant gain still
 * fits under the ceiling: at -16 more than half the clips would hit the peak first and the set
 * would stay 4 dB apart. The ceiling leaves room for the resampler and keeps the mp3 from clipping.
 */
const LOUDNESS = { lufs: -18, truePeak: -1.5 };

const INDEX_VERSION = 2; // 1 was one flat folder, before the game had several narrators
const SLUG_PATTERN = /^[a-z][a-z0-9-]*$/;
const MIN_BYTES = 1024; // anything smaller is an error page, not speech
const MAX_BYTES = 512 * 1024;

const USAGE = `usage: docker compose run --rm voice [options]

  --dry-run            print what would be generated and how many characters it costs; sends nothing
  --force              regenerate even the lines whose fingerprint matches
  --normalize          re-gain the clips already on disk to ${LOUDNESS.lufs} LUFS; no key, no network
  --voice <slug>,…     only these narrators from src/data/voices.ts (default: all of them)
  --only <glob>,…      only ids matching a glob ("order.count.*", "*.letter.*")
  --limit <n>          generate at most n clips in this run
  --format <fmt>       ElevenLabs output_format (default ${DEFAULT_FORMAT})
  --casting            5 sample sentences per candidate into casting/ (gitignored)
  --candidates <id>,…  with --casting: these ElevenLabs voices instead of the whole library
  --list-voices        print the voices this key may use (id, category, name) and exit`;

function parseArgs(argv) {
  const args = {
    dryRun: false,
    force: false,
    casting: false,
    normalize: false,
    listVoices: false,
    voices: [],
    candidates: [],
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
      case '--casting':
        args.casting = true;
        break;
      case '--normalize':
        args.normalize = true;
        break;
      case '--list-voices':
        args.listVoices = true;
        break;
      case '--voice':
        args.voices = list(value());
        break;
      case '--candidates':
        args.candidates = list(value());
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

/** The table is data an agent edits by hand, so it gets checked before anything is spent. */
function checkVoiceTable() {
  if (VOICES.length === 0) fail('src/data/voices.ts holds no voice');
  const seen = new Set();
  for (const voice of VOICES) {
    if (!SLUG_PATTERN.test(voice.slug)) fail(`"${voice.slug}" is not a usable folder name`);
    if (seen.has(voice.slug)) fail(`src/data/voices.ts has ${voice.slug} twice`);
    if (!voice.elevenLabsId) fail(`${voice.slug} has no elevenLabsId`);
    seen.add(voice.slug);
  }
}

function pickVoices(slugs) {
  if (slugs.length === 0) return VOICES;
  return slugs.map((slug) => {
    const voice = VOICES.find((candidate) => candidate.slug === slug);
    if (!voice) fail(`src/data/voices.ts knows no voice "${slug}"`);
    return voice;
  });
}

/**
 * Everything that decides how the clip sounds, in a fixed key order. The model and the settings are
 * in it on purpose: ElevenLabs does not promise a bit-identical result, so the index has to say
 * what produced which file. The slug is NOT in it – only the voice behind it matters.
 */
function lineFingerprint(text, elevenLabsId, config) {
  return fingerprint({
    text,
    voice: elevenLabsId,
    model: config.model,
    format: config.format,
    settings: config.settings,
  });
}

function emptyIndex(config) {
  return {
    version: INDEX_VERSION,
    model: config.model,
    format: config.format,
    settings: config.settings,
    voices: {},
  };
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
    fail(
      `${INDEX_FILE}: version ${parsed?.version} is not the expected ${INDEX_VERSION};` +
        ' regenerate the clips into the per-voice folders',
    );
  }
  return { ...parsed, voices: parsed.voices ?? {} };
}

/** Sorted keys so a diff shows only real changes; the trailing newline keeps Prettier happy. */
function writeIndex(index, config) {
  const voices = {};
  for (const slug of Object.keys(index.voices).sort()) {
    const section = index.voices[slug];
    const lines = {};
    for (const id of Object.keys(section.lines).sort()) lines[id] = section.lines[id];
    voices[slug] = { elevenLabsId: section.elevenLabsId, lines };
  }
  const out = {
    version: INDEX_VERSION,
    model: config.model,
    format: config.format,
    settings: config.settings,
    voices,
  };
  writeAtomic(INDEX_FILE, `${JSON.stringify(out, null, 2)}\n`);
}

async function speak(text, elevenLabsId, config) {
  const url =
    `${API}/v1/text-to-speech/${encodeURIComponent(elevenLabsId)}` +
    `?output_format=${encodeURIComponent(config.format)}`;
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
        body: JSON.stringify({ text, model_id: config.model, voice_settings: config.settings }),
      });
    } catch (error) {
      await backoff(attempt, `the API is unreachable (${error.message})`);
      continue;
    }
    if (response.ok) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength < MIN_BYTES || bytes.byteLength > MAX_BYTES) {
        fail(`the API returned ${bytes.byteLength} B for "${text}" – that is not a clip`);
      }
      return bytes;
    }
    const detail = await readError(response);
    if (response.status === 401 || response.status === 403) {
      fail(
        `HTTP ${response.status}: invalid key, or it lacks the "Text to Speech" permission` +
          ` (${detail})`,
      );
    }
    if (response.status !== 429 && response.status < 500) {
      fail(`HTTP ${response.status} for "${text}" (${detail})`);
    }
    await backoff(attempt, `HTTP ${response.status} (${detail})`);
  }
}

async function listVoices(config) {
  let response;
  try {
    response = await fetch(`${API}/v1/voices`, { headers: { 'xi-api-key': config.apiKey } });
  } catch (error) {
    fail(`GET /v1/voices is unreachable (${error.message})`);
  }
  if (!response.ok) {
    fail(`GET /v1/voices answered HTTP ${response.status} (${await readError(response)})`);
  }
  const body = await response.json();
  const voices = Array.isArray(body?.voices) ? body.voices : [];
  if (voices.length === 0) {
    fail('the voice library is empty – add the candidates on the ElevenLabs website first');
  }
  return voices.map((voice) => ({
    id: String(voice.voice_id),
    name: String(voice.name ?? voice.voice_id),
    // A Free plan may drive only 'premade' voices through the API; a Voice Library voice answers
    // HTTP 402 (paid_plan_required), which costs a run, not characters.
    category: String(voice.category ?? 'unknown'),
  }));
}

function escapeHtml(text) {
  return text.replace(
    /[&<>"]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char],
  );
}

/** A throwaway page for one listening session with the child; casting/ is gitignored. */
function castingPage(voices) {
  const sections = voices
    .map((voice) => {
      const players = CASTING_LINES.map(
        (line, index) =>
          `      <p>${escapeHtml(line.text)}<br>` +
          `<audio controls preload="none" src="${escapeHtml(voice.id)}/${index + 1}.mp3"></audio></p>`,
      ).join('\n');
      return (
        `    <section>\n      <h2>${escapeHtml(voice.name)} ` +
        `<code>${escapeHtml(voice.id)}</code></h2>\n${players}\n    </section>`
      );
    })
    .join('\n');
  return `<!doctype html>
<html lang="cs">
  <head>
    <meta charset="utf-8" />
    <title>Casting – Mlsná abeceda</title>
    <style>
      body { font: 16px/1.5 system-ui, sans-serif; margin: 2rem auto; max-width: 44rem; }
      section { border-top: 1px solid #ccc; padding-top: 1rem; }
      code { color: #666; font-size: 0.8em; }
      audio { height: 2rem; }
    </style>
  </head>
  <body>
    <h1>Casting – Mlsná abeceda</h1>
    <p>Pusťte dceři každý hlas a vyberte jeden. Vybraný hlas pak přidejte jako řádek do
      <code>src/data/voices.ts</code> a spusťte generátor.</p>
${sections}
  </body>
</html>
`;
}

function requireKey(config) {
  if (!config.apiKey) {
    fail(
      'ELEVENLABS_API_KEY is missing – put it into ~/.config/mlsna-abeceda/elevenlabs.env' +
        ' (CLAUDE.md rule 9)',
    );
  }
}

async function runCasting(args, config) {
  const characters = CASTING_LINES.reduce((sum, line) => sum + line.text.length, 0);
  if (args.dryRun) {
    console.log(`casting: ${CASTING_LINES.length} sentences = ${characters} characters per voice`);
    for (const line of CASTING_LINES) console.log(`  ${line.id}  ${line.text}`);
    return;
  }
  requireKey(config);
  const voices =
    args.candidates.length > 0
      ? args.candidates.map((id) => ({ id, name: id }))
      : await listVoices(config);
  console.log(`casting ${voices.length} voice(s) × ${characters} characters`);
  mkdirSync(CASTING_DIR, { recursive: true });
  const done = [];
  for (const voice of voices) {
    const dir = join(CASTING_DIR, voice.id);
    mkdirSync(dir, { recursive: true });
    sweepPartials(dir);
    for (const [index, line] of CASTING_LINES.entries()) {
      const { bytes } = normalizeClip(await speak(line.text, voice.id, config), {
        format: config.format,
        ...LOUDNESS,
      });
      writeAtomic(join(dir, `${index + 1}.mp3`), bytes);
    }
    done.push(voice);
    console.log(`  casting/${voice.id}/  ${voice.name}`);
    writeAtomic(join(CASTING_DIR, 'index.html'), castingPage(done));
  }
  console.log('\nopen casting/index.html, listen with the child, then add the chosen voice as');
  console.log('a row in src/data/voices.ts and run: docker compose run --rm voice --dry-run');
}

/**
 * Orphans are looked for against the WHOLE manifest and the WHOLE voice table, so `--only` and
 * `--voice` cannot invent them. Nothing is ever deleted – that stays the author's decision.
 */
function findOrphans(index) {
  const knownLines = new Set(LINES.map((line) => line.id));
  const knownVoices = new Set(VOICES.map((voice) => voice.slug));
  const orphans = new Set();
  for (const [slug, section] of Object.entries(index.voices)) {
    if (!knownVoices.has(slug)) {
      orphans.add(`${slug}/ (the whole voice, ${Object.keys(section.lines ?? {}).length} lines)`);
      continue;
    }
    for (const id of Object.keys(section.lines ?? {})) {
      if (!knownLines.has(id)) orphans.add(`${slug}/${id}.mp3`);
    }
  }
  if (existsSync(VOICE_DIR)) {
    for (const slug of readdirSync(VOICE_DIR)) {
      if (!statSync(join(VOICE_DIR, slug)).isDirectory()) continue;
      if (!knownVoices.has(slug)) {
        orphans.add(`${slug}/ (the whole folder)`);
        continue;
      }
      for (const name of readdirSync(join(VOICE_DIR, slug))) {
        if (!name.endsWith('.mp3')) continue;
        if (!knownLines.has(name.slice(0, -'.mp3'.length))) orphans.add(`${slug}/${name}`);
      }
    }
  }
  return [...orphans].sort();
}

function warnOnHeaderChange(index, config) {
  const changes = [];
  if (index.model !== config.model) changes.push(`model ${index.model} → ${config.model}`);
  if (index.format !== config.format) changes.push(`format ${index.format} → ${config.format}`);
  if (JSON.stringify(index.settings) !== JSON.stringify(config.settings)) {
    changes.push('voice settings');
  }
  if (changes.length > 0) {
    console.warn(`warning: the index was written with a different setup (${changes.join(', ')});`);
    console.warn('         clips generated now will not match the older ones exactly');
  }
}

async function runGenerate(args, config) {
  const index = readIndex(config);
  if (Object.keys(index.voices).length > 0) warnOnHeaderChange(index, config);

  const inScope = scopeFilter(args.only);
  const plan = [];
  const total = { new: 0, changed: 0, ok: 0 };
  for (const voice of pickVoices(args.voices)) {
    const section = index.voices[voice.slug];
    const counts = { new: 0, changed: 0, ok: 0 };
    const forced = [];
    for (const line of LINES) {
      if (!inScope(line.id)) continue;
      const want = lineFingerprint(line.text, voice.elevenLabsId, config);
      const have = section?.lines?.[line.id];
      const item = { voice, line, want };
      if (!have || !existsSync(join(VOICE_DIR, voice.slug, `${line.id}.mp3`))) {
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
    for (const key of ['new', 'changed', 'ok']) total[key] += counts[key];
    console.log(
      `${voice.slug} (${voice.label}): ${counts.new + counts.changed + counts.ok} lines · ` +
        `${counts.new} new · ${counts.changed} changed · ${counts.ok} up to date`,
    );
  }

  const orphans = findOrphans(index);
  const todo = plan.slice(0, args.limit);
  const characters = todo.reduce((sum, item) => sum + item.line.text.length, 0);
  console.log(
    `total: ${total.new} new · ${total.changed} changed · ${total.ok} up to date` +
      ` · ${orphans.length} orphan · ${characters} characters`,
  );
  for (const orphan of orphans) console.log(`  orphan: ${orphan} (delete it by hand if stale)`);
  if (todo.length < plan.length) {
    console.log(`  --limit ${args.limit}: only the first ${todo.length} of ${plan.length}`);
  }

  if (args.dryRun) {
    for (const item of todo) {
      console.log(
        `  ${item.reason.padEnd(7)} ${item.voice.slug}/${item.line.id}  ${item.line.text}`,
      );
    }
    console.log('\ndry run: nothing was sent and nothing was written');
    return;
  }
  if (todo.length === 0) {
    console.log('nothing to generate');
    return;
  }

  requireKey(config);
  let generated = 0;
  for (const item of todo) {
    const dir = join(VOICE_DIR, item.voice.slug);
    mkdirSync(dir, { recursive: true });
    sweepPartials(dir);
    const { bytes, gain } = normalizeClip(
      await speak(item.line.text, item.voice.elevenLabsId, config),
      { format: config.format, ...LOUDNESS },
    );
    writeAtomic(join(dir, `${item.line.id}.mp3`), bytes);
    const section = (index.voices[item.voice.slug] ??= {
      elevenLabsId: item.voice.elevenLabsId,
      lines: {},
    });
    section.elevenLabsId = item.voice.elevenLabsId;
    section.lines[item.line.id] = {
      hash: item.want,
      text: item.line.text,
      bytes: bytes.byteLength,
      ...(gain === null ? {} : { loudness: LOUDNESS.lufs }),
    };
    // After every single clip, so Ctrl+C never leaves the index describing something else.
    writeIndex(index, config);
    generated += 1;
    console.log(
      `  ${item.voice.slug}/${item.line.id}.mp3  ${(bytes.byteLength / 1024).toFixed(1)} kB` +
        `${gain === null ? '' : `  ${signed(gain)}`}  ${item.line.text}`,
    );
  }
  console.log(`\ndone: ${generated} clip(s) in public/audio/voice/`);
}

/**
 * Re-gains the clips that are already on disk – the set generated before this pass existed, or all
 * of them after the target moves. No key and no network: the media service runs with none. The
 * model, format and settings come from the index, so a run cannot rewrite the header with defaults.
 */
function runNormalize(args, config) {
  const index = readIndex(config);
  const stored = {
    ...config,
    model: index.model ?? config.model,
    format: index.format ?? config.format,
    settings: index.settings ?? config.settings,
  };
  if (mp3Format(stored.format) === null) {
    fail(`--normalize can only re-encode an mp3 format, and the index says ${stored.format}`);
  }
  const inScope = scopeFilter(args.only);
  const wanted = args.voices.length > 0 ? new Set(args.voices) : null;
  const todo = [];
  for (const [slug, section] of Object.entries(index.voices)) {
    if (wanted !== null && !wanted.has(slug)) continue;
    for (const [id, entry] of Object.entries(section.lines)) {
      if (!inScope(id) || (entry.loudness === LOUDNESS.lufs && !args.force)) continue;
      const file = join(VOICE_DIR, slug, `${id}.mp3`);
      if (!existsSync(file)) {
        console.warn(`  missing: ${slug}/${id}.mp3 – generate it first`);
        continue;
      }
      todo.push({ slug, id, entry, file });
    }
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
    const { bytes, gain } = normalizeClip(readFileSync(item.file), {
      format: stored.format,
      ...LOUDNESS,
    });
    const label = `  ${item.slug}/${item.id}.mp3  ${signed(gain)}`;
    if (args.dryRun) {
      console.log(`${label}  (dry run)`);
      continue;
    }
    writeAtomic(item.file, bytes);
    item.entry.bytes = bytes.byteLength;
    item.entry.loudness = LOUDNESS.lufs;
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
    settings: VOICE_SETTINGS,
  };
  if (args.listVoices) {
    requireKey(config);
    for (const voice of await listVoices(config)) {
      console.log(`${voice.id}  ${voice.category.padEnd(12)} ${voice.name}`);
    }
    return;
  }
  if (args.casting) {
    await runCasting(args, config);
    return;
  }
  if (args.normalize) {
    runNormalize(args, config);
    return;
  }
  checkVoiceTable();
  await runGenerate(args, config);
}

process.on('SIGINT', () => {
  dropPending();
  console.error('\nvoice: interrupted; the clips generated so far and the index stay valid');
  process.exit(130);
});

try {
  await main();
} catch (error) {
  dropPending();
  console.error(`voice: ${error instanceof AudioGenError ? error.message : error}`);
  process.exit(1);
}
