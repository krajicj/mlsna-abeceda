/**
 * One playing session: the saved record, the order the kitchen is filling, and the one place where
 * a finished order is written back (rule 4 – progress is sacred, so nothing else touches storage).
 * A session that is merely opened never writes; only `complete()` does.
 */
import { afterOrder, closeUntil, NEW_SESSION } from './closing';
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
import { buyShopItem, unlockedCustomers, unlockedFruits, unlockedProducts } from './shop';
import type { FruitKind } from '../data/curriculum';
import type { ProductId } from '../data/products';
import type { CustomerId } from '../data/customers';

export interface Session {
  /** The record as it stands; a new one after every `complete()`. */
  readonly save: SaveData;
  /** The order for position `save.progress.ordersCompleted + 1`. */
  readonly order: Order;
  /**
   * Who is carrying the current order (návrh kap. 6). Deliberately NOT in the save: after a reload
   * any animal may walk in, and restoring the session is STEP-14's job.
   */
  readonly customer: CustomerId;
  /** Writes the finished order into the save and generates the next one; returns it. */
  complete(results: readonly ItemResult[]): Order;
  /**
   * Closes the kitchen for `ms` (default `CLOSED_MS`, clamped to `[0, MAX_CLOSED_MS]`) and writes
   * the save. The minute limit of the parent corner (STEP-22) will reach in here.
   */
  close(ms?: number): void;
  /** A new sitting with the kitchen open; writes the save. Nothing learnt is touched. */
  reopen(): void;
  /**
   * Buys a thing from the catalogue and writes it down – the one place a purchase is ever stored.
   * An unlocked animal is put into the queue straight away, so it can walk in without a reload;
   * the order already on the counter is left alone, a new fruit turns up in the next one.
   * false = unknown id, already bought or not enough stars, and then nothing is written at all.
   */
  buy(id: string): boolean;
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
  /** What was made last; the generator avoids it while there is more than one thing to make. */
  let lastProduct: ProductId | null = null;
  /**
   * The element `completeOrder` has just introduced, waiting for the first order of its track that
   * can actually use it (návrh 5.4). Kept in the save since v2, so a reload does not lose the nudge;
   * the copy here is the working one and goes back into the record at every `complete()`.
   */
  const pending: Record<TrackName, string | null> = {
    numbers: save.pending.numbers,
    letters: save.pending.letters,
  };

  function remember(order: Order): void {
    lastProduct = order.product;
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
      fruits: unlockedFruits(save.stars),
      // Read at every order, not once: the ice cream bought in the shop can be asked for by the
      // very next customer, without a reload (the same rule the fruit follows).
      products: unlockedProducts(save.stars),
      avoidProduct: lastProduct,
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
  let customers = createCustomerQueue({ available: unlockedCustomers(save.stars), rng });

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
      // One question to the clock: the day stamp and the sitting must not come from two readings.
      const stamp = now();
      save = completeOrder(save, results, todayStamp(stamp));
      for (const track of ['numbers', 'letters'] as const) {
        const introduced = introducedElement(before.tracks[track], save.tracks[track]);
        if (introduced !== null) pending[track] = introduced;
      }
      // The next order is generated first, because generating it is what ticks a pending element
      // off: the record then matches the order the child is about to be given.
      order = nextOrder();
      save = {
        ...save,
        pending: { numbers: pending.numbers, letters: pending.letters },
        // The tenth order of a sitting closes the kitchen; the scene reads that off the record.
        session: afterOrder(save.session, stamp.getTime()),
      };
      // A storage that refuses to write does not stop the loop: the session keeps the new record
      // in memory and the child plays on (writeSave swallows the failure).
      writeSave(storage, save);
      customer = customers.next();
      return order;
    },
    close(ms) {
      save = { ...save, session: closeUntil(save.session, now().getTime(), ms) };
      writeSave(storage, save);
    },
    reopen() {
      save = { ...save, session: NEW_SESSION };
      writeSave(storage, save);
    },
    buy(id) {
      const stars = buyShopItem(save.stars, id);
      if (stars === null) return false;
      save = { ...save, stars };
      writeSave(storage, save);
      // A new animal has to get into the bag the queue deals from, and the bag is dealt at the
      // moment the queue is built – so the queue is built again. That resets its fairness (who
      // has already been round this time), which is a fair price for the frog walking in during
      // the same sitting she was bought in.
      customers = createCustomerQueue({ available: unlockedCustomers(save.stars), rng });
      return true;
    },
  };
}
