/**
 * Lifting an older save record to the current format (CLAUDE.md rule 4: a format change is a
 * migration, not a wiped record). A step only reshapes, it never validates – a hand-edited or
 * half-written record has to survive the chain and is put right afterwards by the `repair*`
 * functions in `save.ts`. Hence the loose `Record<string, unknown>` in and out.
 */
import { SAVE_VERSION } from './version';

export type Migration = (record: Record<string, unknown>) => Record<string, unknown>;

/** A JSON object and nothing else – arrays and null are not records. Shared with `save.ts`. */
export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * v1 → v2: the star balance in `progress.stars` becomes `stars.earned` (nothing was ever spent, so
 * the balance and the total are the same number), and `pending` – the freshly introduced element,
 * kept only in memory until now – gets its place in the record. Values are carried over as they
 * are; `repairStars()` deals with a `stars` that turns out to be "x".
 */
const v1ToV2: Migration = (record) => {
  const { stars, ...progress } = asRecord(record['progress']) ?? {};
  return {
    ...record,
    version: 2,
    progress,
    stars: { earned: stars ?? 0, purchases: {} },
    pending: { numbers: null, letters: null },
  };
};

/** Key = the version the step lifts *from*. A new bump is one line here and one test. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = { 1: v1ToV2 };

/**
 * The record at the current version, or null when there is no way there: a version that is not a
 * whole number, one from a newer build, or a missing step in the chain. Null means "start a new
 * game" – and `readSave()` puts the original text aside before it does.
 */
export function migrateRecord(record: Record<string, unknown>): Record<string, unknown> | null {
  const start = record['version'];
  if (typeof start !== 'number' || !Number.isInteger(start) || start > SAVE_VERSION) return null;
  let current = record;
  let version = start;
  while (version < SAVE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) return null;
    current = step(current);
    const next = current['version'];
    // A step that does not lift the version would spin here forever.
    if (typeof next !== 'number' || next <= version) return null;
    version = next;
  }
  return current;
}
