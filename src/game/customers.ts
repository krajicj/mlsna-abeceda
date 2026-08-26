/**
 * Who comes to the counter next (docs/navrh-hry.md ch. 6). The rule the child would notice is that
 * the animals take turns – three customers feel like three only if all three actually show up.
 *
 * Drawing at random with "just not the one who left" is not enough for that. It leaves two animals
 * to toss a coin between, so the likeliest short pattern is two of them playing ping-pong while the
 * third seems to have left the game: measured, a quarter of four-order sittings never saw one of
 * them. Avoiding the last two instead fixes the fairness but locks the order into bear-rabbit-cat
 * for ever, which is worse in its own way.
 *
 * So the queue deals from a shuffled bag: every animal comes exactly once per round and the order
 * inside a round is drawn afresh, with the one guarantee the child would notice kept intact –
 * nobody walks straight back in across the seam between two rounds.
 *
 * DOM-free, and the randomness is injected, so the whole sequence of a session is replayable.
 */
import { STARTER_CUSTOMERS, type CustomerId } from '../data/customers';
import { shuffle, systemRng, type Rng } from './rng';

export interface CustomerQueue {
  /** Who is at the counter next. Never throws – with one animal on offer it simply comes again. */
  next(): CustomerId;
}

export function createCustomerQueue(options: {
  readonly available: readonly CustomerId[];
  readonly rng?: Rng;
}): CustomerQueue {
  const rng = options.rng ?? systemRng;
  // An empty offer goes back to the starters, so this can never leave the kitchen empty (rule 2).
  const pool = options.available.length > 0 ? options.available : STARTER_CUSTOMERS;
  let bag: CustomerId[] = [];
  let last: CustomerId | null = null;

  function refill(): void {
    bag = shuffle(rng, pool);
    // The seam between two rounds is the only place the same animal could come twice in a row.
    if (bag.length > 1 && bag[0] === last) {
      const first = bag[0] as CustomerId;
      bag[0] = bag[1] as CustomerId;
      bag[1] = first;
    }
  }

  return {
    next() {
      if (bag.length === 0) refill();
      const who = bag.shift() ?? (pool[0] as CustomerId);
      last = who;
      return who;
    },
  };
}
