/**
 * What the narrator says and when (docs/navrh-hry.md ch. 5.5, 5.6, 8). Game data in, line ids out –
 * no DOM, no text: every sentence is a whole clip from the manifest `data/lines.cs.ts` (rule 7,
 * Czech declines and fragments must never be stitched together). The kitchen only decides the
 * moment; which id belongs to it is decided here, so it can be tested without a browser.
 */
import type { FruitKind } from '../data/curriculum';
import {
  bellLines,
  countAloudLine,
  countEnoughLine,
  finishLines,
  hintLine,
  letterWordLine,
  orderCountLine,
  orderDigitLine,
  orderLetterLine,
  orderNextCountLine,
  orderNextDigitLine,
  orderNextLetterLine,
  praiseLines,
  seekLine,
  starLines,
  wrongLine,
  type PraiseGender,
} from '../data/lines.cs';
import type { Order, OrderItem } from './orders';
import { pick, systemRng, type Rng } from './rng';

/**
 * Where an item stands in what is being SAID – not where it stands in the order (STEP-12). The
 * first thing an utterance mentions is "Prosím…", everything after it "A ještě…". Counted this way
 * an item left on its own goes back to "Prosím…" even when it was the second one ordered, so a
 * bare "A ještě…" can never be heard.
 */
export type ItemPosition = 'first' | 'next';

/** The sentences of ONE item: a letter takes two (the order and the word), the rest just one. */
export function itemSpeech(item: OrderItem, position: ItemPosition = 'first'): readonly string[] {
  const next = position === 'next';
  switch (item.type) {
    case 'count':
      return [
        next
          ? orderNextCountLine(item.amount, item.fruit)
          : orderCountLine(item.amount, item.fruit),
      ];
    case 'digit':
      return [next ? orderNextDigitLine(item.value) : orderDigitLine(item.value)];
    case 'letter': {
      const asked = next ? orderNextLetterLine(item.letter) : orderLetterLine(item.letter);
      // The word is empty only when the dev console asks for something that is not a letter.
      return item.word === '' ? [asked] : [asked, letterWordLine(item.letter, item.word)];
    }
  }
}

/** Which form each item of one utterance takes: the first "Prosím…", the rest "A ještě…". */
function positionOf(index: number): ItemPosition {
  return index === 0 ? 'first' : 'next';
}

/** The whole order as ONE utterance: "Prosím tři jahody. A ještě perníček s písmenkem ká." */
export function orderSpeech(items: readonly OrderItem[]): readonly string[] {
  return items.flatMap((item, index) => itemSpeech(item, positionOf(index)));
}

/** The nudge after 15 s: the order sentence of each item, without "Ká jako kočka." */
export function repeatSpeech(items: readonly OrderItem[]): readonly string[] {
  return items.flatMap((item, index) => itemSpeech(item, positionOf(index)).slice(0, 1));
}

/**
 * The child asked for the order again (a tap on the bubble) – the whole thing, the word sentence
 * included. The 15 s nudge drops it on purpose (nobody asked, so do not lecture), but a tap is the
 * child saying "I do not know any more": "Prosím perníček s písmenkem ká." alone repeats exactly
 * the part they could not hold on to, and "Ká jako kočka." is what gives the letter a meaning
 * (návrh 5.6).
 */
export function askAgainSpeech(items: readonly OrderItem[]): readonly string[] {
  return orderSpeech(items);
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
 * The hint after 40 s, for one item. A cookie and a candle have a sentence of their own ("Ká je
 * tady!") because the right piece lights up on the shelf; counting has none – the ring appears over
 * the bowl and the only thing left to say is what was ordered.
 */
export function itemHintSpeech(item: OrderItem): readonly string[] {
  if (item.type === 'count') return repeatSpeech([item]);
  return hintSpeech(item.type === 'letter' ? item.letter : String(item.value));
}

/**
 * Everything this order can possibly need, so the clips are on the device before the child taps:
 * the order itself, counting up to the target, "to stačí", the corrections for every piece on the
 * shelf, the whole set of praises and the two sets the finale draws from (STEP-09).
 */
export function orderPreload(order: Order, gender: PraiseGender = 'neutral'): readonly string[] {
  const ids = new Set<string>();
  for (const [index, item] of order.items.entries()) {
    // Every item can be heard on its own ("Prosím…") once it is the only one left; from the second
    // one on it is also heard in the "A ještě…" form, as part of the whole order.
    for (const id of itemSpeech(item, 'first')) ids.add(id);
    if (index > 0) for (const id of itemSpeech(item, 'next')) ids.add(id);
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

/** Nudges towards the bell while the counter stands empty (STEP-10). */
export function createBellPicker(options?: { readonly rng?: Rng }): LinePicker {
  return createLinePicker(bellLines(), options?.rng ?? systemRng);
}
