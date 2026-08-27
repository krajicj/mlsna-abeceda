/**
 * One playing session: the saved record, the order the kitchen is filling, and the one place where
 * a finished order is written back (rule 4 – progress is sacred, so nothing else touches storage).
 * A session that is merely opened never writes; only `complete()` does.
 */
import { createCustomerQueue } from './customers';
import { generateOrder, type Order } from './orders';
import {
  completeOrder,
  elementOf,
  introducedElement,
  todayStamp,
  trackOf,
  type ItemResult,
  type TrackName,
} from './progress';
import type { Rng } from './rng';
import { readSave, writeSave, type SaveData, type StorageLike } from './save';
import type { FruitKind } from '../data/curriculum';
import { STARTER_CUSTOMERS, type CustomerId } from '../data/customers';

export interface Session {
  /** The record as it stands; a new one after every `complete()`. */
  readonly save: SaveData;
  /** The order for position `save.progress.ordersCompleted + 1`. */
  readonly order: Order;
  /**
   * Who is carrying the current order (návrh kap. 6). Deliberately NOT in the save: after a reload
   * any animal may walk in, and restoring the session is STEP-13's job.
   */
  readonly customer: CustomerId;
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
   * The last element each track asked for. Up to the tenth order the tracks alternate, so "the
   * previous order" is usually the other track's; from the eleventh every order asks about both.
   * Either way what must not repeat is the last element of the *same* track (`OrderInput.avoid`),
   * which is why this is kept per track and not read off the alternation rule of `orders.ts`.
   */
  const last: Record<TrackName, string | null> = { numbers: null, letters: null };
  let lastFruit: FruitKind | null = null;
  /**
   * The element `completeOrder` has just introduced, waiting for the first order of its track that
   * can actually use it (návrh 5.4). Deliberately NOT in the save: a new field would mean a new
   * `SAVE_VERSION`, and `parseSave()` throws a record of another version away – a wiped record is a
   * far worse price than losing one nudge on reload.
   */
  const pending: Record<TrackName, string | null> = { numbers: null, letters: null };

  function remember(order: Order): void {
    for (const item of order.items) {
      last[trackOf(item)] = elementOf(item);
      if (item.type === 'count') lastFruit = item.fruit;
    }
  }

  function nextOrder(): Order {
    const order = generateOrder({
      settings: save.settings,
      tracks: save.tracks,
      index: save.progress.ordersCompleted + 1,
      // The same thing twice in a row would read as "the game did not notice I answered".
      avoid: [last.numbers, last.letters].filter((element): element is string => element !== null),
      avoidFruit: lastFruit,
      introduced: { numbers: pending.numbers, letters: pending.letters },
      rng,
    });
    // Ticked off only once an order really asked for it: an introduced eight does not fit a counting
    // order, so it keeps waiting for the one with the candle.
    for (const item of order.items) {
      const track = trackOf(item);
      if (pending[track] === elementOf(item)) pending[track] = null;
    }
    return order;
  }

  // Built here and not in the scene: this is the one place with an injected rng, so a seeded
  // session replays the customers as exactly as it replays the orders.
  const customers = createCustomerQueue({ available: STARTER_CUSTOMERS, rng });

  let order = nextOrder();
  let customer = customers.next();

  return {
    get save() {
      return save;
    },
    get order() {
      return order;
    },
    get customer() {
      return customer;
    },
    complete(results) {
      remember(order);
      const before = save;
      // A storage that refuses to write does not stop the loop: the session keeps the new record
      // in memory and the child plays on (writeSave swallows the failure).
      save = completeOrder(save, results, todayStamp(now()));
      writeSave(storage, save);
      for (const track of ['numbers', 'letters'] as const) {
        const introduced = introducedElement(before.tracks[track], save.tracks[track]);
        if (introduced !== null) pending[track] = introduced;
      }
      order = nextOrder();
      customer = customers.next();
      return order;
    },
  };
}
