/**
 * One playing session: the saved record plus the order the kitchen is currently filling. STEP-05
 * only reads – the save is written when an order is completed (STEP-08), so a session that is
 * merely opened never touches the child's progress (rule 4).
 */
import { generateOrder, type Order } from './orders';
import type { Rng } from './rng';
import { readSave, type SaveData, type StorageLike } from './save';

export interface Session {
  /** The record as read; STEP-05 does not write to it. */
  readonly save: SaveData;
  /** The order for position `save.progress.ordersCompleted + 1`, the same for the whole scene. */
  readonly order: Order;
}

export function createSession(storage: StorageLike, rng?: Rng): Session {
  const save = readSave(storage);
  const order = generateOrder({
    settings: save.settings,
    tracks: save.tracks,
    index: save.progress.ordersCompleted + 1,
    rng,
  });
  return { save, order };
}
