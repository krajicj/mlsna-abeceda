/**
 * The save record in localStorage (docs/navrh-hry.md ch. 9). Progress is sacred: a record of an
 * older format is migrated, a damaged one is repaired, and one the game cannot read at all is put
 * aside into a backup instead of being overwritten – never thrown away silently. A storage that
 * refuses to work (private mode, full quota) must not stop the game. Storage is injected so the
 * logic stays testable in Node.
 */
import { type Letter } from '../data/curriculum';
import { NEW_SESSION, type SessionState } from './closing';
import { LEVEL1_INITIAL_LETTERS, letterPool, numberPool, type Level } from './curriculum';
import { createTrack, MASTERY_MAX, type TrackState } from './mastery';
import { asRecord, migrateRecord } from './migrate';
import { EMPTY_SETTINGS, normalizeSettings, type Settings } from './settings';
import { NO_STARS, type StarsState } from './stars';
import { SAVE_BACKUP_KEY, SAVE_KEY, SAVE_VERSION } from './version';

/** The slice of the Storage API the game uses. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SaveProgress {
  readonly ordersCompleted: number;
  /** 'YYYY-MM-DD' in local time, or null when never played. */
  readonly lastPlayed: string | null;
}

/** The element a track has just introduced and is waiting to ask about (návrh 5.4). */
export interface PendingElements {
  readonly numbers: string | null;
  readonly letters: string | null;
}

export interface SaveData {
  readonly version: typeof SAVE_VERSION;
  readonly settings: Settings;
  readonly tracks: { readonly numbers: TrackState; readonly letters: TrackState };
  readonly progress: SaveProgress;
  readonly stars: StarsState;
  readonly pending: PendingElements;
  /**
   * How far the running sitting has got and whether the kitchen is closed (STEP-14). Added without
   * a version bump on purpose: the field is purely additive, a record without it is repaired to
   * `NEW_SESSION`, and an older build simply ignores it – whereas a bump to 3 would make that older
   * build (a cached page on the tablet) throw the record away and start a new game. See the step
   * plan `docs/steps/STEP-14-session-end-and-closing.md`.
   */
  readonly session: SessionState;
}

const NO_PENDING: PendingElements = { numbers: null, letters: null };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
    progress: { ordersCompleted: 0, lastPlayed: null },
    stars: NO_STARS,
    pending: NO_PENDING,
    session: NEW_SESSION,
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
    lastPlayed: typeof lastPlayed === 'string' && DATE_PATTERN.test(lastPlayed) ? lastPlayed : null,
  };
}

/**
 * A bought item stays bought even when its price is unreadable (it is repaired to 0, not dropped) –
 * taking a toy away from the child is the one repair that would really hurt. `earned` on the other
 * hand is just a count, so a nonsense value starts from zero.
 */
function repairStars(input: unknown): StarsState {
  const record = asRecord(input);
  const saved = asRecord(record?.['purchases']);
  const purchases: Record<string, number> = {};
  if (saved) for (const [id, cost] of Object.entries(saved)) purchases[id] = repairCount(cost);
  return { earned: repairCount(record?.['earned']), purchases };
}

/**
 * A pending element only makes sense while its track can actually ask about it, so anything outside
 * the active set becomes null – the game never forces an element it cannot offer.
 */
function repairPending(
  input: unknown,
  tracks: { readonly numbers: TrackState; readonly letters: TrackState },
): PendingElements {
  const record = asRecord(input);
  const pick = (key: 'numbers' | 'letters'): string | null => {
    const value = record?.[key];
    return typeof value === 'string' && tracks[key].active.includes(value) ? value : null;
  };
  return { numbers: pick('numbers'), letters: pick('letters') };
}

/**
 * Four independent counts, each repaired on its own: a broken `lastOrderAt` must not cost the
 * sitting its `orders`. Nothing checks that they make sense together – `isClosed()` copes with a
 * `closedUntil` from any century by itself.
 */
function repairSession(input: unknown): SessionState {
  const record = asRecord(input);
  return {
    orders: repairCount(record?.['orders']),
    lastOrderAt: repairCount(record?.['lastOrderAt']),
    closedFrom: repairCount(record?.['closedFrom']),
    closedUntil: repairCount(record?.['closedUntil']),
  };
}

/**
 * Unreadable JSON or a record there is no migration path from → null (a fresh game, and `readSave`
 * keeps the original text). Anything else is lifted to the current version and then repaired.
 */
export function parseSave(raw: string | null): SaveData | null {
  if (raw === null || raw === '') return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const record = asRecord(parsed);
  if (!record) return null;
  const migrated = migrateRecord(record);
  if (!migrated) return null;
  const settings = normalizeSettings(migrated['settings']);
  const saved = asRecord(migrated['tracks']);
  const tracks = {
    numbers: repairTrack(saved?.['numbers'], numberPool),
    letters: repairTrack(saved?.['letters'], (level) => letterPool(settings, level)),
  };
  return {
    version: SAVE_VERSION,
    settings,
    tracks,
    progress: repairProgress(migrated['progress']),
    stars: repairStars(migrated['stars']),
    pending: repairPending(migrated['pending'], tracks),
    session: repairSession(migrated['session']),
  };
}

/** The rescue copy of a record the game could not read; a later one overwrites it. */
function backupSave(storage: StorageLike, raw: string): void {
  try {
    storage.setItem(SAVE_BACKUP_KEY, raw);
  } catch {
    // see writeSave
  }
}

/** Never throws, never returns null – a broken or missing record simply becomes a new game. */
export function readSave(storage: StorageLike): SaveData {
  let raw: string | null = null;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch {
    raw = null;
  }
  const save = parseSave(raw);
  if (save) return save;
  // Not readable: the text goes into the backup before the new game starts writing over it.
  if (raw !== null && raw !== '') backupSave(storage, raw);
  return createSave();
}

/** A storage that refuses to write (quota, private mode) must not stop the game. */
export function writeSave(storage: StorageLike, data: SaveData): void {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // nothing we can do here; the session keeps running on the in-memory state
  }
}

/** The backup is left alone: it belongs to a record this reset never saw (rule 4). */
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
  const tracks = { ...data.tracks, letters: { level: letters.level, active, scores } };
  return {
    ...data,
    settings,
    tracks,
    // A letter that left the set must not stay pending – the generator could never ask for it.
    pending: { ...data.pending, letters: repairPending(data.pending, tracks).letters },
  };
}
