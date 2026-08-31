/**
 * What the narrator says and when (docs/navrh-hry.md ch. 5.5, 5.6, 8). Game data in, line ids out –
 * no DOM, no text: every sentence is a whole clip from the manifest `data/lines.cs.ts` (rule 7,
 * Czech declines and fragments must never be stitched together). The kitchen only decides the
 * moment; which id belongs to it is decided here, so it can be tested without a browser.
 */
import type { FruitKind } from '../data/curriculum';
import { STARTER_PRODUCT, type ProductId } from '../data/products';
import {
  bellLines,
  closedLines,
  closingLines,
  countAloudLine,
  countEnoughLine,
  finishLines,
  hasLine,
  hintLine,
  letterWordLine,
  orderCountLine,
  orderDigitLine,
  orderLetterLine,
  orderNextCountLine,
  orderNextDigitLine,
  orderNextLetterLine,
  OPEN_LINE,
  praiseLines,
  seekLine,
  shopAskLine,
  shopBoughtLine,
  shopHelloLines,
  shopShortLine,
  starLines,
  wrongLine,
  type PraiseGender,
} from '../data/lines.cs';
import { SHOP_ITEMS } from '../data/shop';
import type { Order, OrderItem } from './orders';
import { pick, systemRng, type Rng } from './rng';

/**
 * Where an item stands in what is being SAID – not where it stands in the order (STEP-12). The
 * first thing an utterance mentions is "Prosím…", everything after it "A ještě…". Counted this way
 * an item left on its own goes back to "Prosím…" even when it was the second one ordered, so a
 * bare "A ještě…" can never be heard.
 */
export type ItemPosition = 'first' | 'next';

/**
 * The sentences of ONE item: a letter takes two (the order and the word), the rest just one.
 *
 * `product` decides WHICH sentence, because the order names what is being made ("perníček" ×
 * "oplatku", "tři jahody" × "tři kopečky"). It defaults to the cake, so a caller that forgets it
 * still compiles and simply says what the game said before there was more than one product – see
 * the table of call sites in the step plan; every one of them has to pass it.
 */
export function itemSpeech(
  item: OrderItem,
  position: ItemPosition = 'first',
  product: ProductId = STARTER_PRODUCT,
): readonly string[] {
  const next = position === 'next';
  switch (item.type) {
    case 'count':
      // Counting says nothing about the product: what is counted is fruit, whatever is being made.
      return [
        next
          ? orderNextCountLine(item.amount, item.fruit)
          : orderCountLine(item.amount, item.fruit),
      ];
    case 'digit':
      return [next ? orderNextDigitLine(item.value, product) : orderDigitLine(item.value, product)];
    case 'letter': {
      const asked = next
        ? orderNextLetterLine(item.letter, product)
        : orderLetterLine(item.letter, product);
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
export function orderSpeech(
  items: readonly OrderItem[],
  product: ProductId = STARTER_PRODUCT,
): readonly string[] {
  return items.flatMap((item, index) => itemSpeech(item, positionOf(index), product));
}

/** The nudge after 15 s: the order sentence of each item, without "Ká jako kočka." */
export function repeatSpeech(
  items: readonly OrderItem[],
  product: ProductId = STARTER_PRODUCT,
): readonly string[] {
  return items.flatMap((item, index) => itemSpeech(item, positionOf(index), product).slice(0, 1));
}

/**
 * The child asked for the order again (a tap on the bubble) – the whole thing, the word sentence
 * included. The 15 s nudge drops it on purpose (nobody asked, so do not lecture), but a tap is the
 * child saying "I do not know any more": "Prosím perníček s písmenkem ká." alone repeats exactly
 * the part they could not hold on to, and "Ká jako kočka." is what gives the letter a meaning
 * (návrh 5.6).
 */
export function askAgainSpeech(
  items: readonly OrderItem[],
  product: ProductId = STARTER_PRODUCT,
): readonly string[] {
  return orderSpeech(items, product);
}

/** Counting out loud after the `placed`-th piece has landed. */
export function countSpeech(placed: number): readonly string[] {
  return [countAloudLine(placed)];
}

/** A tap on the bowl that is already covered: "Už máme tři jahody, to stačí!" */
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
  // No product needed: a counting hint falls back to the order sentence, and that sentence is
  // about the fruit, not about what it is going onto.
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
  // The product is read off the order itself, so this is one of the two places that need no
  // argument for it – and cannot forget one either.
  const product = order.product;
  for (const [index, item] of order.items.entries()) {
    // Every item can be heard on its own ("Prosím…") once it is the only one left; from the second
    // one on it is also heard in the "A ještě…" form, as part of the whole order.
    for (const id of itemSpeech(item, 'first', product)) ids.add(id);
    if (index > 0) for (const id of itemSpeech(item, 'next', product)) ids.add(id);
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
  for (const id of finishLines(product)) ids.add(id);
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

/**
 * "Hotovo!" – the order is finished, said while the glaze runs over it. One picker per product:
 * only the cake may be called a dortík, so the set it draws from depends on what was made.
 */
export function createFinishPicker(options?: {
  readonly product?: ProductId;
  readonly rng?: Rng;
}): LinePicker {
  return createLinePicker(
    finishLines(options?.product ?? STARTER_PRODUCT),
    options?.rng ?? systemRng,
  );
}

/** "Máš hvězdičku!" – said while the star flies into the counter. */
export function createStarPicker(options?: { readonly rng?: Rng }): LinePicker {
  return createLinePicker(starLines(), options?.rng ?? systemRng);
}

/** Nudges towards the bell while the counter stands empty (STEP-10). */
export function createBellPicker(options?: { readonly rng?: Rng }): LinePicker {
  return createLinePicker(bellLines(), options?.rng ?? systemRng);
}

/** "Kuchyně dneska zavírá" – the shutter is coming down after the tenth order (STEP-14). */
export function createClosingPicker(options?: { readonly rng?: Rng }): LinePicker {
  return createLinePicker(closingLines(), options?.rng ?? systemRng);
}

/** "Máme zavřeno" – a tap on the shutter, and a kitchen that opens closed. */
export function createClosedPicker(options?: { readonly rng?: Rng }): LinePicker {
  return createLinePicker(closedLines(), options?.rng ?? systemRng);
}

/** The five clips of the closed kitchen; the scene fetches them once, when it is built. */
export function closingPreload(): readonly string[] {
  return [...closingLines(), ...closedLines(), OPEN_LINE];
}

/** "Chceš koupit maliny za tři hvězdičky?" – the shelf asks before it takes any stars (STEP-15). */
export function shopAskSpeech(id: string): readonly string[] {
  return [shopAskLine(id)];
}

/** "Maliny jsou tvoje!" – said once the purchase is written down. */
export function shopBoughtSpeech(id: string): readonly string[] {
  return [shopBoughtLine(id)];
}

/**
 * "Chybí ti tři hvězdičky." – said when the stars do not reach. Outside 1…5 the answer is silence
 * rather than a wrong sentence: nothing in the catalogue costs more than five, and a game that says
 * nothing is still a game that plays on (rule 2).
 */
export function shopShortSpeech(missing: number): readonly string[] {
  const id = shopShortLine(missing);
  return hasLine(id) ? [id] : [];
}

/** "Vítej v obchůdku!" – said as the shelf slides in, never the same one twice running. */
export function createShopHelloPicker(options?: { readonly rng?: Rng }): LinePicker {
  return createLinePicker(shopHelloLines(), options?.rng ?? systemRng);
}

/**
 * Everything the shop can say, fetched when the scene is built: the greeting plus the question and
 * the confirmation of every thing on the shelf. The shelf is small – six things, twelve sentences –
 * and the child must not wait for a clip after a tap.
 */
export function shopPreload(): readonly string[] {
  const ids = new Set<string>(shopHelloLines());
  for (const item of SHOP_ITEMS) {
    ids.add(shopAskLine(item.id));
    ids.add(shopBoughtLine(item.id));
  }
  // Nothing can be short by more than the dearest thing costs, and `hasLine` keeps the loop honest
  // if a price ever climbs past the five sentences Czech has here.
  const dearest = Math.max(...SHOP_ITEMS.map((item) => item.price));
  for (let missing = 1; missing <= dearest; missing += 1) {
    const id = shopShortLine(missing);
    if (hasLine(id)) ids.add(id);
  }
  return [...ids];
}
