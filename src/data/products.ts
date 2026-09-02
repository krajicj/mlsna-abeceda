/**
 * What the kitchen can make (docs/navrh-hry.md kap. 4). One row = one thing an animal may order:
 * what is counted onto it, and how its order sentences are named in the manifest. The cake is the
 * one the child starts with; everything else is bought in the shop (STEP-17 added the ice cream,
 * STEP-18 the pancakes, STEP-19 the milkshake).
 *
 * The catalogue is DATA – it knows nothing about drawing (that is `art/product.ts`) and nothing
 * about geometry (`art/layout.ts`), so a new product touches this file, one art module and a set
 * of sentences, and nothing else has to learn its name.
 *
 * CAREFUL: read by plain Node too (the generator, type stripping) through `lines.cs.ts`, so this
 * file may only ever use `import type` – the same rule as curriculum.ts and shop.ts.
 */

export type ProductId = 'cake' | 'icecream' | 'pancakes';

export interface Product {
  readonly id: ProductId;
  /** Czech, for the plan and the parent corner – never written on screen (rule 1). */
  readonly label: string;
  /**
   * Can pieces be counted onto it? The ice cream arrives finished and only takes a wafer or a flag
   * (návrh kap. 4): the child taps a bowl of STRAWBERRIES, and a scoop of ice cream flying out of
   * it is the one place in the game where what is tapped is not what arrives.
   *
   * Whatever is counted is fruit, on every product that counts at all – so this is a yes/no and
   * not a unit. The generator reads it: an order with a counting item can only be made as a
   * product that says yes.
   */
  readonly counts: boolean;
  /**
   * What is appended to the id of an order sentence, or null for the product with bare ids. The
   * cake is null FOREVER: `order.letter.k` has a generated and committed clip, and renaming it
   * would throw that clip away (see the step plan, decision 7).
   */
  readonly lineSuffix: string | null;
}

/** What the kitchen can make before anything is bought. */
export const STARTER_PRODUCT: ProductId = 'cake';

export const PRODUCTS: readonly Product[] = [
  { id: 'cake', label: 'dortík', counts: true, lineSuffix: null },
  { id: 'icecream', label: 'zmrzlinka', counts: false, lineSuffix: 'icecream' },
  { id: 'pancakes', label: 'palačinky', counts: true, lineSuffix: 'pancakes' },
];

const BY_ID: ReadonlyMap<string, Product> = new Map(
  PRODUCTS.map((product) => [product.id, product]),
);

/** null = an id that is in no catalogue: a typo, or a record from a newer build. */
export function productOf(id: string): Product | null {
  return BY_ID.get(id) ?? null;
}
