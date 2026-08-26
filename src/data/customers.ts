/**
 * The animals that come to the kitchen (docs/navrh-hry.md ch. 6). One row = one customer: the id
 * the game passes around, the Czech name the child will hear once the album exists (M3), and where
 * the cake disappears when the animal eats it.
 *
 * The customers do not speak. Each one has a `hello` and a `yum` in `data/sfx.ts` - a grunt, a
 * squeak, a meow - and the narrator stays the only voice in the game, so the child can always tell
 * who is talking to them (rozhodnutí autora, srpen 2026).
 *
 * CAREFUL: read by plain Node too (type stripping), so this file stays import-free - the same rule
 * as curriculum.ts and sfx.ts.
 */
export type CustomerId = 'bear' | 'rabbit' | 'cat';

export interface Customer {
  readonly id: CustomerId;
  /** Czech name for the child (album and shop in M3); game content, hence Czech. */
  readonly label: string;
  /**
   * Where the cake vanishes, as a fraction of the animal's own 260x320 drawing. A fraction and not
   * pixels: every muzzle sits somewhere else, and the finale must not know one animal by heart.
   */
  readonly mouth: { readonly x: number; readonly y: number };
}

export const CUSTOMERS: Readonly<Record<CustomerId, Customer>> = {
  bear: { id: 'bear', label: 'medvídek', mouth: { x: 0.5, y: 0.469 } },
  rabbit: { id: 'rabbit', label: 'zajíček', mouth: { x: 0.5, y: 0.506 } },
  cat: { id: 'cat', label: 'kočička', mouth: { x: 0.5, y: 0.488 } },
};

/** Who is in the game from the first order (návrh kap. 6); more animals arrive with the shop. */
export const STARTER_CUSTOMERS: readonly CustomerId[] = ['bear', 'rabbit', 'cat'];

export function isCustomerId(value: string): value is CustomerId {
  return value === 'bear' || value === 'rabbit' || value === 'cat';
}
