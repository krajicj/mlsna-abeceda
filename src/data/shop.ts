/**
 * What the shop sells (docs/navrh-hry.md kap. 7). One row = one thing the child can buy with the
 * stars she has earned: its price, the Czech name a grown-up reads in the plan, and what the
 * purchase unlocks in the game. The catalogue is DATA – it knows nothing about drawing, so the
 * shelf (STEP-16) decides what a row looks like and this file survives every change of the scene.
 *
 * The ids are namespaced and they are FOREVER: they are the keys in `stars.purchases`, so renaming
 * one would take a bought thing away from the child (CLAUDE.md rule 4). Nor is an id ever reused
 * for something else.
 *
 * CAREFUL: read by plain Node too (the generator, type stripping) through `lines.cs.ts`, so this
 * file may only ever use `import type` – the same rule as curriculum.ts and sfx.ts.
 */
import type { FruitKind } from './curriculum';
import type { CustomerId } from './customers';

export type ShopItemKind = 'fruit' | 'customer' | 'decoration';

/** Things that stand in the kitchen and do nothing – they are only nice to look at (STEP-16). */
export type DecorationId = 'flower' | 'curtains' | 'cat' | 'radio';

/**
 * Every id in the catalogue, as a closed union: the table of sentences in `lines.cs.ts` is keyed
 * by it, so a new item without a "chceš koupit" sentence does not compile.
 */
export type ShopItemId =
  | 'fruit.raspberry'
  | 'decor.flower'
  | 'decor.curtains'
  | 'customer.frog'
  | 'decor.cat'
  | 'decor.radio';

/** The part every row has, whatever it sells. */
interface ShopItemBase {
  /** Stable key in `stars.purchases`; never renamed and never used a second time. */
  readonly id: ShopItemId;
  /** Price in stars. The price PAID is stored with the purchase, so a later change rewrites nothing. */
  readonly price: number;
  /** Czech name (game content) – for the album and the parent corner; never written on screen. */
  readonly label: string;
}

/**
 * A discriminated union, exactly like `OrderItem` in `game/orders.ts`: `kind` decides what may
 * stand in `unlocks`. A flat union of the three id types would let a `kind: 'fruit'` row unlock a
 * flower – and 'cat' is a legal value of two different kinds at once (the cat on the shelf and the
 * cat that comes to the counter).
 */
export type ShopItem =
  | (ShopItemBase & { readonly kind: 'fruit'; readonly unlocks: FruitKind })
  | (ShopItemBase & { readonly kind: 'customer'; readonly unlocks: CustomerId })
  | (ShopItemBase & { readonly kind: 'decoration'; readonly unlocks: DecorationId });

/**
 * The shelf offers them in this order – the cheapest first, so the first thing the child can afford
 * is the first thing she sees. Nothing here costs more than five stars: "chybí ti N hvězdiček" is
 * five whole sentences and Czech has no sixth one (rule 7).
 */
export const SHOP_ITEMS: readonly ShopItem[] = [
  { id: 'fruit.raspberry', kind: 'fruit', price: 3, label: 'maliny', unlocks: 'raspberry' },
  { id: 'decor.flower', kind: 'decoration', price: 3, label: 'kytka', unlocks: 'flower' },
  { id: 'decor.curtains', kind: 'decoration', price: 4, label: 'záclony', unlocks: 'curtains' },
  { id: 'customer.frog', kind: 'customer', price: 5, label: 'žabka', unlocks: 'frog' },
  { id: 'decor.cat', kind: 'decoration', price: 5, label: 'kočička na polici', unlocks: 'cat' },
  { id: 'decor.radio', kind: 'decoration', price: 5, label: 'rádio', unlocks: 'radio' },
];

const BY_ID: ReadonlyMap<string, ShopItem> = new Map(SHOP_ITEMS.map((item) => [item.id, item]));

/** null for anything that is not in the catalogue – a typo, or a key from a newer build. */
export function shopItem(id: string): ShopItem | null {
  return BY_ID.get(id) ?? null;
}
