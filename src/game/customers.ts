/**
 * Who comes to the counter next (docs/navrh-hry.md ch. 6). The only rule the child would notice is
 * that the same animal never walks straight back in – three customers feel like three only if they
 * take turns.
 *
 * DOM-free, and the randomness is injected, so the whole sequence of a session is replayable.
 */
import { STARTER_CUSTOMERS, type CustomerId } from '../data/customers';
import { pick, systemRng, type Rng } from './rng';

export function nextCustomer(input: {
  readonly available: readonly CustomerId[];
  /** Who has just left – we do not want them again immediately. */
  readonly avoid?: CustomerId | null;
  readonly rng?: Rng;
}): CustomerId {
  const rng = input.rng ?? systemRng;
  // Two fallbacks, both there so this can never throw and leave the kitchen empty (rule 2): an
  // empty offer goes back to the starters, and the last animal standing may come twice in a row.
  const pool = input.available.length > 0 ? input.available : STARTER_CUSTOMERS;
  const fresh = pool.filter((id) => id !== input.avoid);
  return pick(rng, fresh.length > 0 ? fresh : pool);
}
