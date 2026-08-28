/**
 * The shop as pure logic (docs/navrh-hry.md kap. 7): what is on offer, what the child can afford,
 * what a purchase costs and – the half the rest of the game actually reads – what she owns. No DOM
 * and no storage: the scene of the shop (STEP-16) draws what `shopOffer()` returns and `session.buy()`
 * is the only thing that writes a purchase down (rule 4).
 *
 * Nothing here works out a balance of its own: `stars.ts` owns that arithmetic, and every purchase
 * goes through `withPurchase()`, which is also what decides that a thing cannot be bought twice.
 */
import { SHOP_ITEMS, shopItem, type DecorationId, type ShopItem } from '../data/shop';
import { STARTER_FRUITS, type FruitKind } from '../data/curriculum';
import { STARTER_CUSTOMERS, type CustomerId } from '../data/customers';
import { starBalance, withPurchase, type StarsState } from './stars';

export type ShopItemState = 'owned' | 'affordable' | 'short';

export interface ShopEntry {
  readonly item: ShopItem;
  readonly state: ShopItemState;
  /** How many stars are missing; 0 for a thing that is owned and for one that can be paid for. */
  readonly missing: number;
}

/** `hasOwnProperty` and not `in`: a record from JSON carries Object.prototype (see stars.ts). */
function owns(stars: StarsState, id: string): boolean {
  return Object.prototype.hasOwnProperty.call(stars.purchases, id);
}

function entryOf(stars: StarsState, item: ShopItem, balance: number): ShopEntry {
  if (owns(stars, item.id)) return { item, state: 'owned', missing: 0 };
  if (balance >= item.price) return { item, state: 'affordable', missing: 0 };
  return { item, state: 'short', missing: item.price - balance };
}

/** The whole shelf, in the order of the catalogue – the shop scene draws it straight through. */
export function shopOffer(stars: StarsState): readonly ShopEntry[] {
  const balance = starBalance(stars);
  return SHOP_ITEMS.map((item) => entryOf(stars, item, balance));
}

/** One row, for the thing the child has just tapped. null = the id is not in the catalogue. */
export function shopEntryOf(stars: StarsState, id: string): ShopEntry | null {
  const item = shopItem(id);
  return item === null ? null : entryOf(stars, item, starBalance(stars));
}

/**
 * The purchase itself. null = unknown id, already bought, or not enough stars – in every one of
 * those cases the caller writes nothing at all and the game says why (`shopShortSpeech()`).
 */
export function buyShopItem(stars: StarsState, id: string): StarsState | null {
  const item = shopItem(id);
  if (item === null) return null;
  return withPurchase(stars, item.id, item.price);
}

/**
 * What has been bought, one kind per function and each in the order of the catalogue. Written out
 * three times on purpose: comparing `kind` against a literal is what narrows `unlocks` to the right
 * type, so none of this needs a cast. Keys that are in no catalogue (a typo, a record from a newer
 * build) are simply skipped – a strange save must never stop the child from playing (rule 2).
 */
function purchasedFruits(stars: StarsState): FruitKind[] {
  const bought: FruitKind[] = [];
  for (const item of SHOP_ITEMS) {
    if (item.kind === 'fruit' && owns(stars, item.id)) bought.push(item.unlocks);
  }
  return bought;
}

function purchasedCustomers(stars: StarsState): CustomerId[] {
  const bought: CustomerId[] = [];
  for (const item of SHOP_ITEMS) {
    if (item.kind === 'customer' && owns(stars, item.id)) bought.push(item.unlocks);
  }
  return bought;
}

function purchasedDecorations(stars: StarsState): DecorationId[] {
  const bought: DecorationId[] = [];
  for (const item of SHOP_ITEMS) {
    if (item.kind === 'decoration' && owns(stars, item.id)) bought.push(item.unlocks);
  }
  return bought;
}

/** What the order generator may ask for: the starting three plus whatever fruit has been bought. */
export function unlockedFruits(stars: StarsState): readonly FruitKind[] {
  return [...new Set([...STARTER_FRUITS, ...purchasedFruits(stars)])];
}

/** Who may come to the counter: the starting three plus whatever animal has been invited. */
export function unlockedCustomers(stars: StarsState): readonly CustomerId[] {
  return [...new Set([...STARTER_CUSTOMERS, ...purchasedCustomers(stars)])];
}

/** What stands in the kitchen. No starting set – the kitchen begins bare (STEP-16 draws these). */
export function ownedDecorations(stars: StarsState): readonly DecorationId[] {
  return [...new Set(purchasedDecorations(stars))];
}
