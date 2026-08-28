/**
 * Putting two save records together (docs/navrh-hry.md ch. 9.1). Nothing here sends or fetches
 * anything – how a record travels between two devices is still open (návrh kap. 13); this is only
 * the rule for what the result looks like. The rule is "never take anything away": the higher
 * score, the higher stage, the union of the sets. Apart from `settings` the result does not depend
 * on the order of the arguments, and merging a record with itself gives it back unchanged.
 */
import type { TrackState } from './mastery';
import type { PendingElements, SaveData } from './save';
import type { StarsState } from './stars';
import { SAVE_VERSION } from './version';

/**
 * `earned` is one number, not one per device (the author's decision, srpen 2026): the higher wins.
 * Playing on both devices between two merges therefore undercounts (10 + 8 → 10) – accepted,
 * because the transfer will most likely go through a server that merges as it goes.
 * A purchase kept on both sides keeps the higher price paid: the item is owned once either way, and
 * the lower price would make stars out of nothing.
 */
export function mergeStars(local: StarsState, incoming: StarsState): StarsState {
  const purchases: Record<string, number> = { ...local.purchases };
  for (const [id, cost] of Object.entries(incoming.purchases)) {
    const known = purchases[id];
    purchases[id] = known === undefined ? cost : Math.max(known, cost);
  }
  return { earned: Math.max(local.earned, incoming.earned), purchases };
}

/**
 * The higher stage decides the order of the active set (its set is the one that has moved on),
 * elements the other side has on top of it follow, and every score is the better of the two. With
 * both sides on the same stage the sets are prefixes of the same pool, so the result is the same
 * either way round; the longer set leads so that a subset never reorders a superset.
 */
export function mergeTrack(local: TrackState, incoming: TrackState): TrackState {
  const localLeads =
    local.level !== incoming.level
      ? local.level > incoming.level
      : local.active.length >= incoming.active.length;
  const [leader, other] = localLeads ? [local, incoming] : [incoming, local];
  const active = [
    ...leader.active,
    ...other.active.filter((element) => !leader.active.includes(element)),
  ];
  const scores: Record<string, number> = {};
  for (const element of active) {
    scores[element] = Math.max(local.scores[element] ?? 0, incoming.scores[element] ?? 0);
  }
  return { level: leader.level, active, scores };
}

/**
 * Both waiting for the same element → that one; only one waiting → that one; each waiting for a
 * different element → neither. The cost is one nudge that never happens, the gain is a rule that
 * does not depend on the order: the element is in the active set anyway and its turn will come.
 * Applied to `numbers` and `letters` separately.
 */
export function mergePending(local: PendingElements, incoming: PendingElements): PendingElements {
  const pick = (a: string | null, b: string | null): string | null => {
    if (a === b) return a;
    if (a === null) return b;
    if (b === null) return a;
    return null;
  };
  return {
    numbers: pick(local.numbers, incoming.numbers),
    letters: pick(local.letters, incoming.letters),
  };
}

/** 'YYYY-MM-DD' sorts as text, so the later day is simply the bigger string. */
function laterDay(local: string | null, incoming: string | null): string | null {
  if (local === null) return incoming;
  if (incoming === null) return local;
  return local >= incoming ? local : incoming;
}

/**
 * Progress is merged by the table in návrh 9.1; `settings` are not progress and cannot be merged
 * (two names cannot both be the child's), so they stay with `local` – the device the parent is
 * sitting at and where they can see them.
 */
export function mergeSave(local: SaveData, incoming: SaveData): SaveData {
  return {
    version: SAVE_VERSION,
    settings: local.settings,
    tracks: {
      numbers: mergeTrack(local.tracks.numbers, incoming.tracks.numbers),
      letters: mergeTrack(local.tracks.letters, incoming.tracks.letters),
    },
    progress: {
      ordersCompleted: Math.max(local.progress.ordersCompleted, incoming.progress.ordersCompleted),
      lastPlayed: laterDay(local.progress.lastPlayed, incoming.progress.lastPlayed),
    },
    stars: mergeStars(local.stars, incoming.stars),
    pending: mergePending(local.pending, incoming.pending),
    // The sitting belongs to the device and the moment, not to progress (STEP-14), so it stays
    // with `local` the way `settings` do. Taking the lower `orders` would hand the limit back, and
    // taking the higher `closedUntil` would lock the very kitchen the child is sitting at.
    session: local.session,
  };
}
