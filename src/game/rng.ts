/**
 * Seedable randomness. Every random choice in the game goes through an injected `Rng`, so a test
 * can replay the exact same order and production still gets real randomness (`systemRng`).
 */
export type Rng = () => number; // [0, 1)

/** mulberry32: tiny, fast, well distributed – plenty for picking cakes and gingerbread. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The production source of randomness. */
export const systemRng: Rng = () => Math.random();

/** A stray 1.0 or NaN from a hand-written Rng must never index past the array. */
function indexIn(rng: Rng, length: number): number {
  const raw = Math.floor(rng() * length);
  return Number.isFinite(raw) ? Math.min(Math.max(raw, 0), length - 1) : 0;
}

/** One random item. Empty array is a caller bug, not a game state – it throws. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new RangeError('pick() needs a non-empty array');
  return items[indexIn(rng, items.length)] as T; // indexIn always lands inside the array
}

/**
 * One item, chance proportional to `weight` (návrh 5.4: an element the child does not know yet comes
 * up more often). Weights that are not finite or ≤ 0 count as zero; when every weight ends up zero
 * it falls back to a uniform `pick`. An empty array throws, like `pick`.
 */
export function pickWeighted<T>(rng: Rng, items: readonly T[], weight: (item: T) => number): T {
  if (items.length === 0) throw new RangeError('pickWeighted() needs a non-empty array');
  const weights = items.map((item) => {
    const value = weight(item);
    return Number.isFinite(value) && value > 0 ? value : 0;
  });
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return pick(rng, items);
  const raw = rng();
  const threshold = (Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 1) : 0) * total;
  let running = 0;
  for (let i = 0; i < items.length; i += 1) {
    running += weights[i] as number;
    if (threshold < running) return items[i] as T;
  }
  return items[items.length - 1] as T; // only rounding can get us here
}

/** Fisher–Yates; returns a new array, the input is left alone. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = indexIn(rng, i + 1);
    const swapped = out[i] as T;
    out[i] = out[j] as T;
    out[j] = swapped;
  }
  return out;
}

/** Up to `count` distinct items (no repeats); fewer when there are not enough to choose from. */
export function sample<T>(rng: Rng, items: readonly T[], count: number): T[] {
  if (count <= 0) return [];
  return shuffle(rng, items).slice(0, count);
}
