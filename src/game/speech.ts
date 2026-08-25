/**
 * What the narrator says and when (docs/navrh-hry.md ch. 5.5, 5.6, 8). Game data in, line ids out –
 * no DOM, no text: every sentence is a whole clip from the manifest `data/lines.cs.ts` (rule 7,
 * Czech declines and fragments must never be stitched together). The kitchen only decides the
 * moment; which id belongs to it is decided here, so it can be tested without a browser.
 */
import type { FruitKind } from '../data/curriculum';
import {
  countAloudLine,
  countEnoughLine,
  finishLines,
  hintLine,
  letterWordLine,
  orderCountLine,
  orderDigitLine,
  orderLetterLine,
  praiseLines,
  seekLine,
  starLines,
  wrongLine,
  type PraiseGender,
} from '../data/lines.cs';
import type { Order, OrderItem } from './orders';
import { pick, systemRng, type Rng } from './rng';

/** Placing the order: a letter takes two sentences (the order and the word), the rest just one. */
export function orderSpeech(item: OrderItem): readonly string[] {
  switch (item.type) {
    case 'count':
      return [orderCountLine(item.amount, item.fruit)];
    case 'digit':
      return [orderDigitLine(item.value)];
    case 'letter':
      // The word is empty only when the dev console asks for something that is not a letter.
      return item.word === ''
        ? [orderLetterLine(item.letter)]
        : [orderLetterLine(item.letter), letterWordLine(item.letter, item.word)];
  }
}

/** The nudge after 15 s: the order sentence alone, without "Ká jako kočka." */
export function repeatSpeech(item: OrderItem): readonly string[] {
  return orderSpeech(item).slice(0, 1);
}

/**
 * The child asked for the order again (a tap on the bubble) – the whole thing, the word sentence
 * included. The 15 s nudge drops it on purpose (nobody asked, so do not lecture), but a tap is the
 * child saying "I do not know any more": "Prosím perníček s písmenkem ká." alone repeats exactly
 * the part they could not hold on to, and "Ká jako kočka." is what gives the letter a meaning
 * (návrh 5.6).
 */
export function askAgainSpeech(item: OrderItem): readonly string[] {
  return orderSpeech(item);
}

/** Counting out loud after the `placed`-th piece has landed. */
export function countSpeech(placed: number): readonly string[] {
  return [countAloudLine(placed)];
}

/** A tap on the bowl that is already covered. */
export function enoughSpeech(amount: number, fruit: FruitKind): readonly string[] {
  return [countEnoughLine(amount, fruit)];
}

/**
 * A wrong piece: what it was, and then where to go. Once the right answer is lit up (the second
 * mistake), "Hledáme ká." would send the child looking for something they can already see – the
 * hint sentence takes its place.
 */
export function correctionSpeech(
  target: string,
  wrong: string,
  revealed: boolean,
): readonly string[] {
  return [wrongLine(wrong), revealed ? hintLine(target) : seekLine(target)];
}

/** The hint after 40 s, and the same sentence for the reveal after the second mistake. */
export function hintSpeech(target: string): readonly string[] {
  return [hintLine(target)];
}

/**
 * Everything this order can possibly need, so the clips are on the device before the child taps:
 * the order itself, counting up to the target, "to stačí", the corrections for every piece on the
 * shelf, the whole set of praises and the two sets the finale draws from (STEP-09).
 */
export function orderPreload(order: Order, gender: PraiseGender = 'neutral'): readonly string[] {
  const ids = new Set<string>();
  for (const item of order.items) {
    for (const id of orderSpeech(item)) ids.add(id);
    if (item.type === 'count') {
      for (let step = 1; step <= item.amount; step += 1) ids.add(countAloudLine(step));
      ids.add(countEnoughLine(item.amount, item.fruit));
      continue;
    }
    const target = item.type === 'letter' ? item.letter : String(item.value);
    ids.add(seekLine(target));
    ids.add(hintLine(target));
    for (const choice of item.choices) ids.add(wrongLine(String(choice)));
  }
  for (const id of praiseLines(gender)) ids.add(id);
  for (const id of finishLines()) ids.add(id);
  for (const id of starLines()) ids.add(id);
  return [...ids];
}

export interface LinePicker {
  /** Never the same one twice in a row (unless there is only one line to pick from). */
  next(): readonly string[];
}

/** The kitchen items were written against this name; a praise picker is just a line picker. */
export type PraisePicker = LinePicker;

/** One sentence out of a set, never the same one twice running. An empty set stays silent. */
export function createLinePicker(ids: readonly string[], rng: Rng = systemRng): LinePicker {
  let last: string | null = null;
  return {
    next() {
      if (ids.length === 0) return [];
      const pool = ids.filter((id) => id !== last);
      const id = pick(rng, pool.length > 0 ? pool : ids);
      last = id;
      return [id];
    },
  };
}

export function createPraisePicker(options?: {
  readonly gender?: PraiseGender;
  readonly rng?: Rng;
}): LinePicker {
  return createLinePicker(praiseLines(options?.gender ?? 'neutral'), options?.rng ?? systemRng);
}

/** "Hotovo!" – the order is finished, said while the glaze runs over the cake. */
export function createFinishPicker(options?: { readonly rng?: Rng }): LinePicker {
  return createLinePicker(finishLines(), options?.rng ?? systemRng);
}

/** "Máš hvězdičku!" – said while the star flies into the counter. */
export function createStarPicker(options?: { readonly rng?: Rng }): LinePicker {
  return createLinePicker(starLines(), options?.rng ?? systemRng);
}
