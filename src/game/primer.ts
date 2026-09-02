/**
 * The primer is a read-only picture of both learning tracks. It deliberately does not use the
 * curriculum pools: the board always shows the whole basic alphabet and all ten digits.
 */
import { BASE_LETTERS } from '../data/curriculum';
import { MASTERY_KNOWN, scoreOf, type TrackState } from './mastery';

export type PrimerState = 'new' | 'learning' | 'known';

export interface PrimerTile {
  readonly element: string;
  readonly state: PrimerState;
}

export interface PrimerBoard {
  readonly letters: readonly PrimerTile[];
  readonly digits: readonly PrimerTile[];
}

type IncompleteTrack = Pick<TrackState, 'level'> & Partial<Pick<TrackState, 'active' | 'scores'>>;

/** Damaged or older saves are pictures, not a reason for the book to stop opening. */
function tile(track: IncompleteTrack, element: string): PrimerTile {
  const active = track.active ?? [];
  if (!active.includes(element)) return { element, state: 'new' };
  // `scoreOf()` rightly expects the normal saved shape; the primer also accepts incomplete input.
  const safeTrack: TrackState = { level: track.level, active, scores: track.scores ?? {} };
  return {
    element,
    state: scoreOf(safeTrack, element) >= MASTERY_KNOWN ? 'known' : 'learning',
  };
}

export function primerBoard(tracks: {
  readonly numbers: IncompleteTrack;
  readonly letters: IncompleteTrack;
}): PrimerBoard {
  return {
    letters: BASE_LETTERS.map((element) => tile(tracks.letters, element)),
    // Do not use `numberPool()`: level one intentionally holds only the first five digits.
    digits: Array.from({ length: 10 }, (_, index) => tile(tracks.numbers, String(index + 1))),
  };
}

export function primerProgress(board: PrimerBoard): {
  readonly known: number;
  readonly total: number;
} {
  const tiles = [...board.letters, ...board.digits];
  return { known: tiles.filter((tile) => tile.state === 'known').length, total: tiles.length };
}
