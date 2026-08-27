/**
 * The order generator: what the animal asks for (docs/navrh-hry.md ch. 5.1, 5.3, 5.4).
 * One item per order at stages Č1/P1; the tracks strictly alternate, odd orders are numbers and
 * even ones letters. It returns data only – no text and no voice-line ids (those are STEP-07).
 */
import {
  CONFUSABLE_DIGITS,
  CONFUSABLE_LETTERS,
  FRUITS,
  type FruitKind,
  type Letter,
} from '../data/curriculum';
import { MAX_COUNT } from './counting';
import { choiceCount, letterWord } from './curriculum';
import { isMastered, weightOf, type TrackState } from './mastery';
import { pick, pickWeighted, sample, shuffle, systemRng, type Rng } from './rng';
import type { Settings } from './settings';

export type OrderItem =
  | { readonly type: 'count'; readonly fruit: FruitKind; readonly amount: number }
  | { readonly type: 'digit'; readonly value: number; readonly choices: readonly number[] }
  | {
      readonly type: 'letter';
      readonly letter: Letter;
      readonly word: string;
      readonly choices: readonly Letter[];
    };

export interface Order {
  readonly index: number;
  readonly items: readonly OrderItem[];
}

export interface OrderInput {
  readonly settings: Settings;
  readonly tracks: { readonly numbers: TrackState; readonly letters: TrackState };
  /** 1-based position in the session; drives the alternation of the two tracks. */
  readonly index: number;
  /** Elements of the last order of the same track – do not ask for those again right away. */
  readonly avoid?: readonly string[];
  readonly avoidFruit?: FruitKind | null;
  /**
   * The element each track has just introduced. It becomes the target of that track's next order
   * (návrh 5.4); an element the item cannot use (an eight for counting) is simply not taken.
   */
  readonly introduced?: {
    readonly numbers?: string | null;
    readonly letters?: string | null;
  };
  readonly rng?: Rng;
}

type ConfusablePairs = readonly (readonly [string, string])[];

function areConfusable(a: string, b: string, pairs: ConfusablePairs): boolean {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

function unique(elements: readonly string[]): string[] {
  return [...new Set(elements)];
}

function introducedOf(input: OrderInput, track: 'numbers' | 'letters'): string | null {
  return input.introduced?.[track] ?? null;
}

/**
 * The element the child is asked for (návrh 5.4). A freshly introduced element goes first, otherwise
 * the pick is weighted – what is not mastered yet comes up `WEAK_WEIGHT`× more often. `allow` narrows
 * the set to what the item can actually use (counting stops at `MAX_COUNT`); both that filter and the
 * no-repeat rule give way rather than let the generator run out of elements.
 */
function pickTarget(
  rng: Rng,
  track: TrackState,
  avoid: readonly string[],
  allow: ((element: string) => boolean) | null,
  introduced: string | null,
): string {
  const candidates = allow === null ? track.active : track.active.filter(allow);
  const fresh = candidates.filter((element) => !avoid.includes(element));
  const pool = fresh.length > 0 ? fresh : candidates.length > 0 ? candidates : track.active;
  if (introduced !== null && pool.includes(introduced)) return introduced;
  return pickWeighted(rng, pool, (element) => weightOf(track, element));
}

/**
 * What ends up on the shelf: the right answer plus distractors, already shuffled. Distractors come
 * from mastered elements that do not look like the target; when there are not enough, the rule is
 * relaxed step by step and in the worst case the shelf simply holds fewer things.
 */
function buildChoices(
  rng: Rng,
  target: string,
  track: TrackState,
  size: number,
  pairs: ConfusablePairs,
): string[] {
  const others = track.active.filter((element) => element !== target);
  const mastered = others.filter((element) => isMastered(track, element));
  const distinct = (element: string): boolean => !areConfusable(target, element, pairs);
  let pool = mastered.filter(distinct);
  if (pool.length < size - 1) pool = unique([...pool, ...others.filter(distinct)]);
  if (pool.length < size - 1) pool = unique([...pool, ...mastered, ...others]);
  return shuffle(rng, [target, ...sample(rng, pool, size - 1)]);
}

function countItem(rng: Rng, input: OrderInput, avoid: readonly string[]): OrderItem {
  // Only five pieces of fruit fit on the cake (MAX_CAKE_FRUIT), so a bigger number waits for a
  // candle order – the second row on the cake is STEP-22.
  const element = pickTarget(
    rng,
    input.tracks.numbers,
    avoid,
    (candidate) => Number(candidate) <= MAX_COUNT,
    introducedOf(input, 'numbers'),
  );
  const fruits = FRUITS.filter((fruit) => fruit !== input.avoidFruit);
  return {
    type: 'count',
    fruit: pick(rng, fruits.length > 0 ? fruits : FRUITS),
    amount: Number(element),
  };
}

function digitItem(rng: Rng, input: OrderInput, avoid: readonly string[]): OrderItem {
  const track = input.tracks.numbers;
  const element = pickTarget(rng, track, avoid, null, introducedOf(input, 'numbers'));
  const size = choiceCount(track.level);
  return {
    type: 'digit',
    value: Number(element),
    choices: buildChoices(rng, element, track, size, CONFUSABLE_DIGITS).map(Number),
  };
}

function letterItem(rng: Rng, input: OrderInput, avoid: readonly string[]): OrderItem {
  const track = input.tracks.letters;
  // the letters track holds letters
  const element = pickTarget(rng, track, avoid, null, introducedOf(input, 'letters')) as Letter;
  const size = choiceCount(track.level);
  return {
    type: 'letter',
    letter: element,
    word: letterWord(element, input.settings),
    choices: buildChoices(rng, element, track, size, CONFUSABLE_LETTERS) as Letter[],
  };
}

/**
 * One order for the given position. Odd position → numbers (counting and digits alternate inside
 * the track, counting first), even position → letters (návrh 5.3).
 */
export function generateOrder(input: OrderInput): Order {
  const rng = input.rng ?? systemRng;
  const avoid = input.avoid ?? [];
  const numbersTurn = Math.ceil(input.index / 2);
  const item =
    input.index % 2 !== 0
      ? numbersTurn % 2 !== 0
        ? countItem(rng, input, avoid)
        : digitItem(rng, input, avoid)
      : letterItem(rng, input, avoid);
  return { index: input.index, items: [item] };
}

/** The keys an order used – what the caller passes as `avoid` next time round the same track. */
export function orderElements(order: Order): string[] {
  return order.items.map((item) => {
    switch (item.type) {
      case 'count':
        return String(item.amount);
      case 'digit':
        return String(item.value);
      case 'letter':
        return item.letter;
    }
  });
}
