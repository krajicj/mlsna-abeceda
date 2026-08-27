/**
 * Stars as they are saved (docs/navrh-hry.md ch. 9.1): what the child has earned and what she has
 * bought – never a balance. A balance cannot be merged between two devices: adding them up invents
 * stars, taking the higher one takes back something she bought. So the record keeps both halves and
 * the balance is derived. Pure logic over `StarsState`; it knows nothing about `SaveData`, which is
 * what keeps `save.ts` free to import it.
 */

export interface StarsState {
  /** How many stars the child has been given in total. Only ever grows; nothing is subtracted. */
  readonly earned: number;
  /** What is bought: item id → the price paid in stars. */
  readonly purchases: Readonly<Record<string, number>>;
}

export const NO_STARS: StarsState = { earned: 0, purchases: {} };

/** `hasOwnProperty` and not `in`: a record from JSON carries Object.prototype, so `in` would
 *  claim an item called 'toString' is already bought. */
function owns(purchases: Readonly<Record<string, number>>, id: string): boolean {
  return Object.prototype.hasOwnProperty.call(purchases, id);
}

export function starsSpent(stars: StarsState): number {
  let spent = 0;
  for (const cost of Object.values(stars.purchases)) spent += cost;
  return spent;
}

/** What is left to spend; never negative – a damaged record must not leave the child in debt. */
export function starBalance(stars: StarsState): number {
  return Math.max(stars.earned - starsSpent(stars), 0);
}

/** `count` missing → one star; `completeOrder()` passes `STARS_PER_ORDER` explicitly. */
export function withStar(stars: StarsState, count = 1): StarsState {
  return { ...stars, earned: stars.earned + count };
}

/**
 * null = already bought, price out of range (negative, NaN, infinite) or not enough stars; what to
 * do about it is the shop's business (STEP-15). A price of 0 goes through – a free item is
 * legitimate, it just leaves the balance where it was. The price paid is stored with the item, so
 * the balance can be worked out without a price list and a later price change cannot rewrite what
 * the child already paid.
 */
export function withPurchase(stars: StarsState, id: string, cost: number): StarsState | null {
  if (owns(stars.purchases, id)) return null;
  if (!Number.isFinite(cost) || cost < 0) return null;
  if (cost > starBalance(stars)) return null;
  return { ...stars, purchases: { ...stars.purchases, [id]: cost } };
}
