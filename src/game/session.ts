/**
 * One playing session: the saved record, the order the kitchen is filling, and the one place where
 * a finished order is written back (rule 4 – progress is sacred, so nothing else touches storage).
 * A session that is merely opened never writes; only `complete()` does.
 */
import { generateOrder, type Order } from './orders';
import {
  completeOrder,
  elementOf,
  todayStamp,
  trackOf,
  type ItemResult,
  type TrackName,
} from './progress';
import type { Rng } from './rng';
import { readSave, writeSave, type SaveData, type StorageLike } from './save';
import type { FruitKind } from '../data/curriculum';

export interface Session {
  /** The record as it stands; a new one after every `complete()`. */
  readonly save: SaveData;
  /** The order for position `save.progress.ordersCompleted + 1`. */
  readonly order: Order;
  /** Writes the finished order into the save and generates the next one; returns it. */
  complete(results: readonly ItemResult[]): Order;
}

export function createSession(
  storage: StorageLike,
  options?: { readonly rng?: Rng; readonly now?: () => Date },
): Session {
  const rng = options?.rng;
  const now = options?.now ?? ((): Date => new Date());
  let save = readSave(storage);
  /**
   * The last element each track asked for. Orders alternate the tracks, so "the previous order" is
   * usually the other track's – what must not repeat is the last element of the *same* one
   * (`OrderInput.avoid`). Kept per track instead of reading the alternation rule of `orders.ts`,
   * which longer orders (STEP-11) are going to change.
   */
  const last: Record<TrackName, string | null> = { numbers: null, letters: null };
  let lastFruit: FruitKind | null = null;

  function remember(order: Order): void {
    for (const item of order.items) {
      last[trackOf(item)] = elementOf(item);
      if (item.type === 'count') lastFruit = item.fruit;
    }
  }

  function nextOrder(): Order {
    return generateOrder({
      settings: save.settings,
      tracks: save.tracks,
      index: save.progress.ordersCompleted + 1,
      // The same thing twice in a row would read as "the game did not notice I answered".
      avoid: [last.numbers, last.letters].filter((element): element is string => element !== null),
      avoidFruit: lastFruit,
      rng,
    });
  }

  let order = nextOrder();

  return {
    get save() {
      return save;
    },
    get order() {
      return order;
    },
    complete(results) {
      remember(order);
      // A storage that refuses to write does not stop the loop: the session keeps the new record
      // in memory and the child plays on (writeSave swallows the failure).
      save = completeOrder(save, results, todayStamp(now()));
      writeSave(storage, save);
      order = nextOrder();
      return order;
    },
  };
}
