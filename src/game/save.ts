/**
 * The save record in localStorage (docs/navrh-hry.md ch. 9). Progress is sacred: a record with the
 * right version is repaired, never thrown away, and a storage that refuses to work (private mode,
 * full quota) must not stop the game. Storage is injected so the logic stays testable in Node.
 */
import { type Letter } from '../data/curriculum';
import { LEVEL1_INITIAL_LETTERS, letterPool, numberPool, type Level } from './curriculum';
import { createTrack, MASTERY_MAX, type TrackState } from './mastery';
import { EMPTY_SETTINGS, normalizeSettings, type Settings } from './settings';
import { SAVE_KEY, SAVE_VERSION } from './version';

/** The slice of the Storage API the game uses. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SaveProgress {
  readonly ordersCompleted: number;
  readonly stars: number;
  /** 'YYYY-MM-DD' in local time, or null when never played. */
  readonly lastPlayed: string | null;
}

export interface SaveData {
  readonly version: typeof SAVE_VERSION;
  readonly settings: Settings;
  readonly tracks: { readonly numbers: TrackState; readonly letters: TrackState };
  readonly progress: SaveProgress;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * A brand new game: numbers 1–5 (the child knows those) and the first two letters – the rest of the
 * P1 pool joins one by one as they are learnt (návrh 5.4).
 */
export function createSave(settings: Settings = EMPTY_SETTINGS): SaveData {
  return {
    version: SAVE_VERSION,
    settings,
    tracks: {
      numbers: createTrack(1, numberPool(1)),
      letters: createTrack(1, letterPool(settings, 1), LEVEL1_INITIAL_LETTERS),
    },
    progress: { ordersCompleted: 0, stars: 0, lastPlayed: null },
  };
}

function repairLevel(value: unknown): Level {
  const level = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 1;
  return Math.min(Math.max(level, 1), 5) as Level;
}

function repairCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(Math.floor(value), 0) : 0;
}

function repairScore(value: unknown): number {
  const score = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;
  return Math.min(Math.max(score, 0), MASTERY_MAX);
}

/**
 * A hand-edited or half-written track is rebuilt around the pool of its own level: unknown elements
 * go, the scores of the surviving ones stay. An empty result starts the level over from its pool.
 */
function repairTrack(input: unknown, poolFor: (level: Level) => readonly string[]): TrackState {
  const record = asRecord(input);
  const level = repairLevel(record?.['level']);
  const pool = poolFor(level);
  const activeValue = record?.['active'];
  const rawActive: readonly unknown[] = Array.isArray(activeValue) ? activeValue : [];
  const active = [...new Set(rawActive.filter((e): e is string => typeof e === 'string'))].filter(
    (element) => pool.includes(element),
  );
  if (active.length === 0) return createTrack(level, pool);
  const savedScores = asRecord(record?.['scores']) ?? {};
  const scores: Record<string, number> = {};
  for (const element of active) scores[element] = repairScore(savedScores[element]);
  return { level, active, scores };
}

function repairProgress(input: unknown): SaveProgress {
  const record = asRecord(input);
  const lastPlayed = record?.['lastPlayed'];
  return {
    ordersCompleted: repairCount(record?.['ordersCompleted']),
    stars: repairCount(record?.['stars']),
    lastPlayed: typeof lastPlayed === 'string' && DATE_PATTERN.test(lastPlayed) ? lastPlayed : null,
  };
}

/** Unreadable JSON or another format version → null (a fresh game); anything else gets repaired. */
export function parseSave(raw: string | null): SaveData | null {
  if (raw === null || raw === '') return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const record = asRecord(parsed);
  if (!record || record['version'] !== SAVE_VERSION) return null;
  const settings = normalizeSettings(record['settings']);
  const tracks = asRecord(record['tracks']);
  return {
    version: SAVE_VERSION,
    settings,
    tracks: {
      numbers: repairTrack(tracks?.['numbers'], numberPool),
      letters: repairTrack(tracks?.['letters'], (level) => letterPool(settings, level)),
    },
    progress: repairProgress(record['progress']),
  };
}

/** Never throws, never returns null – a broken or missing record simply becomes a new game. */
export function readSave(storage: StorageLike): SaveData {
  let raw: string | null = null;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch {
    raw = null;
  }
  return parseSave(raw) ?? createSave();
}

/** A storage that refuses to write (quota, private mode) must not stop the game. */
export function writeSave(storage: StorageLike, data: SaveData): void {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // nothing we can do here; the session keeps running on the in-memory state
  }
}

export function resetSave(storage: StorageLike): SaveData {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    // see writeSave
  }
  return createSave();
}

/**
 * New settings mean a new letter order: the active set is rebuilt from the new pool to the same
 * size, scores of letters that stayed are kept, the rest go. The number track is untouched.
 */
export function withSettings(data: SaveData, settings: Settings): SaveData {
  const letters = data.tracks.letters;
  const pool: readonly Letter[] = letterPool(settings, letters.level);
  const size = Math.min(Math.max(letters.active.length, 1), pool.length);
  const active = pool.slice(0, size);
  const scores: Record<string, number> = {};
  for (const element of active) scores[element] = letters.scores[element] ?? 0;
  return {
    ...data,
    settings,
    tracks: { ...data.tracks, letters: { level: letters.level, active, scores } },
  };
}
