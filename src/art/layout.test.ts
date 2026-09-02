import { describe, expect, it } from 'vitest';
import { STAGE_HEIGHT } from '../stage/layout';
import {
  BELL_LEFT_CLEARANCE,
  BELL_MARGIN,
  BELL_SIZE,
  BOWL_BACK_FRUIT_HEIGHT,
  BOWL_FRONT_FRUIT_HEIGHT,
  BOWL_FRUIT_CENTER_Y,
  BOWL_RIM_Y,
  BUBBLE_CONTENT_X,
  BUBBLE_HEIGHT,
  BUBBLE_ITEM_GAP,
  BUBBLE_ITEM_HEIGHT,
  BUBBLE_ITEM_WIDTH,
  BUBBLE_MAX_ITEMS,
  BUBBLE_PADDING,
  BUBBLE_SPEAKER,
  BUBBLE_WIDTH,
  CLOCK_SIZE,
  CODE_LENGTH,
  COUNTER_EDGE_TOP,
  COUNTER_FRONT_TOP,
  COUNTER_TOP,
  FRUIT_GAP,
  FRUIT_SLOT,
  KEYPAD_HEIGHT,
  KEYPAD_PADDING,
  KEYPAD_WIDTH,
  KEY_GAP,
  KEY_SIZE,
  LID_HEIGHT,
  LID_RIM_Y,
  MAX_COUNT_PIECES,
  PRODUCT_GEOMETRY,
  MAX_CHOICES,
  MAX_FRUIT_SLOTS,
  MAX_PILLS,
  PILL_GAP,
  PILL_OFFSET_Y,
  PILL_SIZE,
  SHELF_GAP,
  SHELF_HIT_WIDTH,
  SHELF_ITEM_WIDTH,
  STARS_PILL_HEIGHT,
  STARS_PILL_WIDTH,
  STAR_SIZE,
  LOCK_SIZE,
  ANSWER_SIZE,
  CARD_HEIGHT,
  CARD_WIDTH,
  FLOOR_TOP,
  GOOD_COLUMNS,
  GOOD_PICTURE_HEIGHT,
  GOOD_PRICE_HEIGHT,
  GOOD_WIDTH,
  PRICE_STAR,
  PRICE_STAR_GAP,
  STARS_PILL_STAR,
  decorLayout,
  shopGoodPicture,
  shopLayout,
  shopPriceSlots,
  starsHitSlot,
  bowlFruitSpots,
  bubbleSlots,
  bubbleSpeakerSlot,
  productCountSlots,
  productDigitSlot,
  productLetterSlot,
  closedLayout,
  codeSlot,
  counterPanels,
  floorColumns,
  fruitSlots,
  keypadKeys,
  kitchenLayout,
  lidRect,
  pillSlots,
  shelfHitSlots,
  shelfSlots,
  starSlot,
} from './layout';
import { SHOP_ITEMS } from '../data/shop';
import { CANDLE_HEIGHT, CANDLE_WIDTH } from './candle';
import { COOKIE_SIZE } from './cookie';
import { fruitWidth } from './fruit';
import type { Rect } from './svg';

const CAKE = PRODUCT_GEOMETRY.cake;
const ICECREAM = PRODUCT_GEOMETRY.icecream;
const PANCAKES = PRODUCT_GEOMETRY.pancakes;

const WIDTHS = [1024, 1200, 1366];
/** Smallest touch target the game allows (CLAUDE.md, rule 3). */
const MIN_TARGET = 88;

/** Distance between two boxes; negative means they overlap. */
function separation(a: Rect, b: Rect): number {
  const dx = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width));
  const dy = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height));
  return Math.max(dx, dy);
}

function inside(rect: Rect, width: number): boolean {
  return (
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.x + rect.width <= width &&
    rect.y + rect.height <= STAGE_HEIGHT
  );
}

describe('kitchenLayout', () => {
  it.each(WIDTHS)('keeps every box inside the %i px stage', (width) => {
    for (const box of Object.values(kitchenLayout(width))) {
      expect(inside(box, width)).toBe(true);
    }
  });

  it.each(WIDTHS)('leaves at least 8 px between any two boxes at %i px', (width) => {
    const boxes = Object.entries(kitchenLayout(width));
    // Names of the offending pairs, so a failure says which two boxes touch.
    const tight = boxes.flatMap(([nameA, a], index) =>
      boxes
        .slice(index + 1)
        .filter(([, b]) => separation(a, b) < 8)
        .map(([nameB]) => `${nameA}/${nameB}`),
    );
    expect(tight).toEqual([]);
  });

  it.each(WIDTHS)('stands the bell on the same counter line as the bowl at %i px', (width) => {
    const { bell, bowl } = kitchenLayout(width);
    // A target the child hits with a thumb, and the same counter line as the bowl - a bell
    // floating above the worktop would read as decoration, not as something to press.
    expect(Math.min(bell.width, bell.height)).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(bell.y + bell.height).toBe(bowl.y + bowl.height);
  });

  it.each(WIDTHS)('puts the bell left of the product wherever it fits at %i px', (width) => {
    const { bell, product, bowl, customer } = kitchenLayout(width);
    const left = product.x - BELL_MARGIN - BELL_SIZE;
    if (left - (customer.x + customer.width) >= BELL_LEFT_CLEARANCE) {
      expect(bell.x).toBe(left);
    } else {
      // No room between the customer and the cake: back to the right of the bowl.
      expect(bell.x).toBe(bowl.x + bowl.width + BELL_MARGIN);
    }
  });

  it('knows where the bell can and cannot stand on the left', () => {
    // 4:3 (an older iPad) has 12 px between the customer and the cake - nowhere near a target.
    expect(kitchenLayout(1024).bell).toEqual({ x: 916, y: 444, width: 96, height: 96 });
    expect(kitchenLayout(1200).bell.x).toBe(1004);
    // A phone or a wide tablet in landscape: left of the cake, 71 px clear of the customer.
    expect(kitchenLayout(1366).bell).toEqual({ x: 391, y: 444, width: 96, height: 96 });
    expect(kitchenLayout(1280).bell.x).toBe(348);
    // The old certainty, unchanged by the rename of `bear`.
    expect(kitchenLayout(1024).customer).toEqual({ x: 60, y: 200, width: 260, height: 320 });
  });

  it.each(WIDTHS)('centres the product horizontally at %i px', (width) => {
    const { product } = kitchenLayout(width);
    expect(Math.abs(product.x + product.width / 2 - (width / 2 - 70))).toBeLessThanOrEqual(20);
  });

  it.each(WIDTHS)('stands the bowl on the worktop at %i px', (width) => {
    const { bowl } = kitchenLayout(width);
    expect(bowl.y + bowl.height).toBeGreaterThan(COUNTER_TOP);
    expect(bowl.y + bowl.height).toBeLessThan(COUNTER_EDGE_TOP);
  });

  it('clamps the stage width', () => {
    expect(kitchenLayout(800)).toEqual(kitchenLayout(1024));
    expect(kitchenLayout(4000)).toEqual(kitchenLayout(1366));
    expect(kitchenLayout(-1)).toEqual(kitchenLayout(1024));
    expect(kitchenLayout(Number.NaN)).toEqual(kitchenLayout(1024));
  });

  it('puts the digit shelf above the letter shelf, both at the same place', () => {
    const { shelfDigits, shelfLetters } = kitchenLayout(1024);
    expect(shelfDigits.x).toBe(shelfLetters.x);
    expect(shelfDigits.width).toBe(shelfLetters.width);
    expect(shelfDigits.y + shelfDigits.height).toBeLessThan(shelfLetters.y);
  });

  it('matches the worked example from the step plan', () => {
    expect(kitchenLayout(1024).product).toEqual({ x: 332, y: 384, width: 220, height: 146 });
    expect(kitchenLayout(1024).shelfLetters).toEqual({ x: 562, y: 252, width: 448, height: 112 });
    expect(kitchenLayout(1024).bubble).toEqual({ x: 60, y: 28, width: 480, height: 124 });
    expect(kitchenLayout(1024).stars).toEqual({ x: 848, y: 10, width: 160, height: 64 });
    expect(kitchenLayout(1366).stars).toEqual({ x: 1190, y: 10, width: 160, height: 64 });
  });

  it('hangs the bubble in the same place whatever the stage width', () => {
    for (const width of WIDTHS)
      expect(kitchenLayout(width).bubble).toEqual(kitchenLayout(1024).bubble);
  });

  it('keeps the star counter clear of the digit shelf', () => {
    for (const width of WIDTHS) {
      const { stars, shelfDigits } = kitchenLayout(width);
      expect(stars.y + stars.height).toBeLessThanOrEqual(shelfDigits.y - 8);
      expect(stars.x + stars.width).toBeLessThanOrEqual(width);
    }
  });

  it('leaves the digit shelf room next to the bubble', () => {
    for (const width of WIDTHS) {
      const { bubble, shelfDigits } = kitchenLayout(width);
      expect(bubble.x + bubble.width).toBeLessThanOrEqual(shelfDigits.x - 8);
    }
  });
});

describe('bubbleSlots', () => {
  const bubble = kitchenLayout(1024).bubble;

  it('is empty for a count of zero or less', () => {
    expect(bubbleSlots(bubble, 0)).toEqual([]);
    expect(bubbleSlots(bubble, -2)).toEqual([]);
  });

  it('never shows more pictures than the card holds', () => {
    expect(bubbleSlots(bubble, 9)).toHaveLength(BUBBLE_MAX_ITEMS);
  });

  it('matches the worked example from the step plan', () => {
    expect(bubbleSlots(bubble, 1)).toEqual([{ x: 272, y: 46, width: 116, height: 88 }]);
    expect(bubbleSlots(bubble, 2).map((slot) => slot.x)).toEqual([208, 336]);
    expect(bubbleSlots(bubble, 3).map((slot) => slot.x)).toEqual([144, 272, 400]);
  });

  it('centres the row between the speaker and the right padding', () => {
    for (let count = 1; count <= BUBBLE_MAX_ITEMS; count += 1) {
      const slots = bubbleSlots(bubble, count);
      const first = slots[0]!;
      const last = slots[slots.length - 1]!;
      const leftGap = first.x - (bubble.x + BUBBLE_CONTENT_X);
      const rightGap = bubble.x + bubble.width - BUBBLE_PADDING - (last.x + last.width);
      expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(1);
      expect(leftGap).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps every picture inside the card', () => {
    for (const slot of bubbleSlots(bubble, BUBBLE_MAX_ITEMS)) {
      expect(slot.x).toBeGreaterThanOrEqual(bubble.x);
      expect(slot.x + slot.width).toBeLessThanOrEqual(bubble.x + bubble.width);
      expect(slot.y).toBeGreaterThanOrEqual(bubble.y);
      expect(slot.y + slot.height).toBeLessThanOrEqual(bubble.y + bubble.height);
    }
  });

  it('leaves the gap the constants promise between two pictures', () => {
    const [first, second] = bubbleSlots(bubble, 2);
    expect(second!.x - (first!.x + first!.width)).toBe(BUBBLE_ITEM_GAP);
    expect(first!.width).toBe(BUBBLE_ITEM_WIDTH);
    expect(first!.height).toBe(BUBBLE_ITEM_HEIGHT);
  });
});

describe('bubbleSpeakerSlot', () => {
  const bubble = kitchenLayout(1024).bubble;

  it('matches the worked example from the step plan', () => {
    expect(bubbleSpeakerSlot(bubble)).toEqual({ x: 80, y: 68, width: 44, height: 44 });
  });

  it('sits inside the card, left of the first picture', () => {
    const speaker = bubbleSpeakerSlot(bubble);
    expect(speaker.x).toBeGreaterThanOrEqual(bubble.x);
    expect(speaker.y).toBeGreaterThanOrEqual(bubble.y);
    expect(speaker.y + speaker.height).toBeLessThanOrEqual(bubble.y + bubble.height);
    expect(speaker.x + speaker.width).toBeLessThanOrEqual(bubbleSlots(bubble, 3)[0]!.x);
    expect(speaker.width).toBe(BUBBLE_SPEAKER);
  });

  it('makes the whole card the target, far over the 88 px of rule 3', () => {
    expect(Math.min(BUBBLE_WIDTH, BUBBLE_HEIGHT)).toBeGreaterThanOrEqual(MIN_TARGET);
  });
});

describe('starSlot', () => {
  const stars = kitchenLayout(1024).stars;

  it('matches the worked example from the step plan', () => {
    // The star of the pill since STEP-16: 36 px at (12, 14) inside the counter.
    expect(starSlot(stars)).toEqual({ x: 860, y: 24, width: 36, height: 36 });
  });

  it('lands inside the counter', () => {
    const slot = starSlot(stars);
    expect(slot.x).toBeGreaterThanOrEqual(stars.x);
    expect(slot.y).toBeGreaterThanOrEqual(stars.y);
    expect(slot.x + slot.width).toBeLessThanOrEqual(stars.x + stars.width);
    expect(slot.y + slot.height).toBeLessThanOrEqual(stars.y + stars.height);
    expect(slot.width).toBe(STARS_PILL_STAR);
    expect(stars.width).toBe(STARS_PILL_WIDTH);
    expect(stars.height).toBe(STARS_PILL_HEIGHT);
  });
});

describe('starsHitSlot (STEP-16)', () => {
  it.each(WIDTHS)('runs from the top of the stage to the digit shelf at %i px', (width) => {
    const { stars, shelfDigits } = kitchenLayout(width);
    const hit = starsHitSlot(stars);
    expect(hit.y).toBe(0);
    expect(hit.y + hit.height).toBe(shelfDigits.y);
    expect(hit.x).toBe(stars.x);
    expect(hit.width).toBe(stars.width);
  });

  it('is taller than the pill it makes tappable', () => {
    const { stars } = kitchenLayout(1024);
    const hit = starsHitSlot(stars);
    expect(hit.height).toBeGreaterThan(stars.height);
    // A conscious deviation from rule 3 (see STEP-16): the kitchen was not re-arranged for 4 px.
    expect(hit.height).toBe(84);
    expect(hit.width).toBeGreaterThanOrEqual(MIN_TARGET);
  });

  it('keeps the whole pill inside the target', () => {
    for (const width of WIDTHS) {
      const { stars } = kitchenLayout(width);
      const hit = starsHitSlot(stars);
      expect(stars.y).toBeGreaterThanOrEqual(hit.y);
      expect(stars.y + stars.height).toBeLessThanOrEqual(hit.y + hit.height);
      expect(inside(hit, width)).toBe(true);
    }
  });
});

describe('decorLayout (STEP-16)', () => {
  it.each(WIDTHS)('keeps the cat and the radio inside the %i px stage', (width) => {
    for (const box of Object.values(decorLayout(width))) {
      expect(inside(box, width)).toBe(true);
    }
  });

  it.each(WIDTHS)('leaves at least 8 px between them and every kitchen box at %i px', (width) => {
    // Neither toy may get in the way of the game: not the cake, the bowl, a shelf, the bubble,
    // the bell nor the counter of stars.
    const decor = Object.entries(decorLayout(width));
    const kitchen = Object.entries(kitchenLayout(width));
    const tight = decor.flatMap(([name, box]) =>
      kitchen
        .filter(([, other]) => separation(box, other) < 8)
        .map(([other]) => `${name}/${other}`),
    );
    expect(tight).toEqual([]);
  });

  it.each(WIDTHS)('stays clear of the counting pills and the digit carrier at %i px', (width) => {
    // The pills above the product and the candle standing on it are NOT in `kitchenLayout()` – they
    // are computed per order – so they need their own check. This is the one that caught a cat
    // sitting exactly where the child counts.
    const { product } = kitchenLayout(width);
    const transient = [
      ...Array.from({ length: MAX_PILLS }, (_, index) => pillSlots(product, index + 1)).flat(),
      productDigitSlot(product, 'cake'),
      productLetterSlot(product, 'cake'),
    ];
    for (const [name, box] of Object.entries(decorLayout(width))) {
      for (const other of transient) {
        expect(separation(box, other), `${name} at ${width}`).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it.each(WIDTHS)('lays the cat on the floor in the bottom right corner at %i px', (width) => {
    const { cat, catTarget } = decorLayout(width);
    expect(cat.y).toBeGreaterThanOrEqual(FLOOR_TOP);
    expect(cat.x + cat.width).toBeLessThanOrEqual(width);
    expect(cat.x).toBeGreaterThan(width / 2);
    // The drawing is 68 px tall, so the target grows upwards over the front of the counter.
    expect(Math.min(catTarget.width, catTarget.height)).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(catTarget.x).toBe(cat.x);
    expect(catTarget.y + catTarget.height).toBe(cat.y + cat.height);
    expect(catTarget.y).toBeLessThanOrEqual(cat.y);
  });

  it.each(WIDTHS)('puts the radio in the last door of the counter at %i px', (width) => {
    const { radio } = decorLayout(width);
    const panels = counterPanels(width);
    expect(radio).toEqual(panels[panels.length - 1]);
    expect(Math.min(radio.width, radio.height)).toBeGreaterThanOrEqual(MIN_TARGET);
  });

  it('takes any width the console throws at it, like kitchenLayout', () => {
    expect(decorLayout(200)).toEqual(decorLayout(1024));
    expect(decorLayout(4000)).toEqual(decorLayout(1366));
    expect(decorLayout(Number.NaN)).toEqual(decorLayout(1024));
  });
});

describe('shopLayout (STEP-16)', () => {
  it.each(WIDTHS)('keeps every box inside the %i px stage', (width) => {
    const layout = shopLayout(width);
    for (const box of [layout.stars, layout.door, layout.card, layout.yes, layout.no]) {
      expect(inside(box, width)).toBe(true);
    }
    for (const box of [...layout.boards, ...layout.goods]) {
      expect(inside(box, width)).toBe(true);
    }
  });

  it.each(WIDTHS)('keeps six places in three columns at %i px', (width) => {
    const goods = shopLayout(width).goods;
    // Six places whatever the catalogue holds today (návrh 7.3): the shelf fills up as things are
    // added instead of changing shape under the child's hands.
    expect(goods).toHaveLength(6);
    expect(SHOP_ITEMS.length).toBeLessThanOrEqual(goods.length);
    // 0–2 the top row left to right, 3–5 the bottom one – the order of the catalogue.
    const [a, b, c, d] = goods;
    expect(a!.y).toBe(b!.y);
    expect(b!.y).toBe(c!.y);
    expect(a!.x).toBeLessThan(b!.x);
    expect(b!.x).toBeLessThan(c!.x);
    expect(d!.y).toBeGreaterThan(a!.y);
    expect(d!.x).toBe(a!.x);
    expect(new Set(goods.map((cell) => cell.x)).size).toBe(GOOD_COLUMNS);
  });

  it.each(WIDTHS)('makes every target big enough for a thumb at %i px', (width) => {
    const layout = shopLayout(width);
    for (const box of [...layout.goods, layout.yes, layout.no, layout.door]) {
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(MIN_TARGET);
    }
    expect(ANSWER_SIZE).toBeGreaterThanOrEqual(MIN_TARGET);
  });

  it.each(WIDTHS)('leaves at least 8 px between any two things on the shelf at %i px', (width) => {
    const goods = shopLayout(width).goods;
    const tight = goods.flatMap((a, index) =>
      goods
        .slice(index + 1)
        .filter((b) => separation(a, b) < 8)
        .map((b) => `${a.x},${a.y}/${b.x},${b.y}`),
    );
    expect(tight).toEqual([]);
  });

  it.each(WIDTHS)('hangs a board under each row, wider than the row itself, at %i px', (width) => {
    const layout = shopLayout(width);
    expect(layout.boards).toHaveLength(2);
    for (const [index, board] of layout.boards.entries()) {
      const row = layout.goods.slice(index * GOOD_COLUMNS, (index + 1) * GOOD_COLUMNS);
      const first = row[0]!;
      const last = row[GOOD_COLUMNS - 1]!;
      expect(board.y).toBe(first.y + first.height);
      expect(board.x).toBeLessThan(first.x);
      expect(board.x + board.width).toBeGreaterThan(last.x + last.width);
    }
  });

  it.each(WIDTHS)('centres the card and the two answers inside it at %i px', (width) => {
    const { card, yes, no, goods } = shopLayout(width);
    expect(card.x + card.width / 2).toBe(width / 2);
    expect(card.width).toBe(CARD_WIDTH);
    expect(card.height).toBe(CARD_HEIGHT);
    for (const answer of [yes, no]) {
      expect(answer.x).toBeGreaterThanOrEqual(card.x);
      expect(answer.x + answer.width).toBeLessThanOrEqual(card.x + card.width);
      expect(answer.y + answer.height).toBeLessThanOrEqual(card.y + card.height);
    }
    expect(yes.x + yes.width).toBeLessThan(no.x); // no thumb hits both
    expect(separation(yes, no)).toBeGreaterThanOrEqual(8);
    // The card covers the middle of the shelf on purpose: it is the question, not a hint.
    expect(goods.length).toBe(6);
  });

  it.each(WIDTHS)('stands the door on the floor, clear of the shelf, at %i px', (width) => {
    const { door, goods } = shopLayout(width);
    expect(door.y + door.height).toBe(FLOOR_TOP);
    for (const cell of goods) expect(separation(door, cell)).toBeGreaterThanOrEqual(8);
  });

  it('takes any width the console throws at it, like kitchenLayout', () => {
    expect(shopLayout(200)).toEqual(shopLayout(1024));
    expect(shopLayout(4000)).toEqual(shopLayout(1366));
    expect(shopLayout(Number.NaN)).toEqual(shopLayout(1024));
  });
});

describe('shopGoodPicture and shopPriceSlots (STEP-16)', () => {
  const cell = shopLayout(1024).goods[0]!;

  it('gives the picture the top of the cell and the price the strip under it', () => {
    const picture = shopGoodPicture(cell);
    expect(picture).toEqual({
      x: cell.x,
      y: cell.y,
      width: GOOD_WIDTH,
      height: GOOD_PICTURE_HEIGHT,
    });
    expect(cell.height - picture.height).toBe(GOOD_PRICE_HEIGHT);
  });

  it('is empty for a count of zero or less', () => {
    expect(shopPriceSlots(cell, 0)).toEqual([]);
    expect(shopPriceSlots(cell, -2)).toEqual([]);
  });

  it.each([1, 2, 3, 4, 5])('fits a price of %i stars into the strip, centred', (count) => {
    const slots = shopPriceSlots(cell, count);
    expect(slots).toHaveLength(count);
    for (const slot of slots) {
      expect(slot.width).toBe(PRICE_STAR);
      expect(slot.height).toBe(PRICE_STAR);
      expect(slot.x).toBeGreaterThanOrEqual(cell.x);
      expect(slot.x + slot.width).toBeLessThanOrEqual(cell.x + cell.width);
      expect(slot.y).toBeGreaterThanOrEqual(cell.y + GOOD_PICTURE_HEIGHT);
      expect(slot.y + slot.height).toBeLessThanOrEqual(cell.y + cell.height);
    }
    const left = slots[0]!.x - cell.x;
    const right = cell.x + cell.width - (slots[count - 1]!.x + PRICE_STAR);
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
  });

  it('leaves the gap the constants promise between two stars', () => {
    const slots = shopPriceSlots(cell, 5);
    for (let index = 1; index < slots.length; index += 1) {
      expect(slots[index]!.x - (slots[index - 1]!.x + PRICE_STAR)).toBe(PRICE_STAR_GAP);
    }
  });

  it('never draws more than the five stars anything in the catalogue costs', () => {
    expect(shopPriceSlots(cell, 9)).toHaveLength(5);
    expect(Math.max(...SHOP_ITEMS.map((item) => item.price))).toBeLessThanOrEqual(5);
  });
});

describe('shelfSlots', () => {
  const shelf = kitchenLayout(1024).shelfLetters;

  it('is empty for a count of zero or less', () => {
    expect(shelfSlots(shelf, 0)).toEqual([]);
    expect(shelfSlots(shelf, -2)).toEqual([]);
  });

  it('never puts out more than MAX_CHOICES slots', () => {
    expect(shelfSlots(shelf, 9)).toHaveLength(MAX_CHOICES);
  });

  it.each([1, 2, 3, 4])('centres %i slot(s) on the shelf with equal gaps', (count) => {
    const slots = shelfSlots(shelf, count);
    expect(slots).toHaveLength(count);
    const first = slots[0]!;
    const last = slots[slots.length - 1]!;
    expect(first.x - shelf.x).toBe(shelf.x + shelf.width - (last.x + last.width));
    for (let i = 1; i < slots.length; i += 1) {
      expect(slots[i]!.x - (slots[i - 1]!.x + SHELF_ITEM_WIDTH)).toBe(SHELF_GAP);
    }
    for (const slot of slots) {
      expect(slot.x).toBeGreaterThanOrEqual(shelf.x);
      expect(slot.x + slot.width).toBeLessThanOrEqual(shelf.x + shelf.width);
      expect(slot.y).toBe(shelf.y);
      expect(slot.width).toBeGreaterThanOrEqual(MIN_TARGET);
      expect(slot.height).toBeGreaterThanOrEqual(MIN_TARGET);
    }
  });

  it('leaves the board free under the slots', () => {
    const slot = shelfSlots(shelf, 4)[0]!;
    expect(slot.y + slot.height).toBe(shelf.y + shelf.height - 16);
  });

  it('gives the candles a taller slot than the cookies', () => {
    const { shelfDigits, shelfLetters } = kitchenLayout(1024);
    expect(shelfSlots(shelfDigits, 4)[0]!.height).toBe(112);
    expect(shelfSlots(shelfLetters, 4)[0]!.height).toBe(96);
  });

  it('matches the worked example from the step plan', () => {
    expect(shelfSlots(kitchenLayout(1024).shelfLetters, 4).map((slot) => slot.x)).toEqual([
      570, 682, 794, 906,
    ]);
  });
});

describe('shelfHitSlots', () => {
  it('is empty for a count of zero or less and for nonsense', () => {
    const shelf = kitchenLayout(1024).shelfLetters;
    expect(shelfHitSlots(shelf, 0)).toEqual([]);
    expect(shelfHitSlots(shelf, -2)).toEqual([]);
    expect(shelfHitSlots(shelf, Number.NaN)).toEqual([]);
  });

  it('never puts out more than MAX_CHOICES targets', () => {
    expect(shelfHitSlots(kitchenLayout(1024).shelfDigits, 9)).toHaveLength(MAX_CHOICES);
  });

  it.each(WIDTHS)('leaves no dead space between the targets at %i px', (width) => {
    for (const shelf of [kitchenLayout(width).shelfDigits, kitchenLayout(width).shelfLetters]) {
      for (const count of [1, 2, 3, 4]) {
        const slots = shelfHitSlots(shelf, count);
        expect(slots).toHaveLength(count);
        for (let i = 1; i < slots.length; i += 1) {
          expect(slots[i]!.x).toBe(slots[i - 1]!.x + SHELF_HIT_WIDTH);
        }
        for (const slot of slots) {
          expect(slot.width).toBe(SHELF_HIT_WIDTH);
          expect(slot.width).toBeGreaterThanOrEqual(MIN_TARGET);
          expect(slot.height).toBeGreaterThanOrEqual(MIN_TARGET);
          expect(slot.x).toBeGreaterThanOrEqual(shelf.x);
          expect(slot.x + slot.width).toBeLessThanOrEqual(shelf.x + shelf.width);
          expect(inside(slot, width)).toBe(true);
        }
      }
    }
  });

  it.each(WIDTHS)('keeps the centres of the pieces it covers at %i px', (width) => {
    for (const shelf of [kitchenLayout(width).shelfDigits, kitchenLayout(width).shelfLetters]) {
      for (const count of [1, 2, 3, 4]) {
        const centres = (slots: Rect[]): number[] => slots.map((slot) => slot.x + slot.width / 2);
        expect(centres(shelfHitSlots(shelf, count))).toEqual(centres(shelfSlots(shelf, count)));
      }
    }
  });

  it('matches the worked example from the step plan', () => {
    const shelf = kitchenLayout(1024).shelfDigits;
    expect(shelfSlots(shelf, 3).map((slot) => slot.x)).toEqual([626, 738, 850]);
    expect(shelfHitSlots(shelf, 3).map((slot) => slot.x)).toEqual([618, 730, 842]);
  });
});

describe('productDigitSlot and productLetterSlot', () => {
  it.each(WIDTHS)('takes the size straight from the art at %i px', (width) => {
    const { product, shelfDigits, shelfLetters } = kitchenLayout(width);
    const candleSlot = productDigitSlot(product, 'cake');
    const cookieSlot = productLetterSlot(product, 'cake');
    expect(candleSlot.width).toBe(CANDLE_WIDTH);
    expect(candleSlot.height).toBe(CANDLE_HEIGHT);
    expect(cookieSlot.width).toBe(COOKIE_SIZE);
    expect(cookieSlot.height).toBe(COOKIE_SIZE);
    // The same size as on the shelf, so the flight never has to scale the piece.
    const shelfCandle = shelfSlots(shelfDigits, 3)[0]!;
    const shelfCookie = shelfSlots(shelfLetters, 3)[0]!;
    expect([candleSlot.width, candleSlot.height]).toEqual([shelfCandle.width, shelfCandle.height]);
    expect([cookieSlot.width, cookieSlot.height]).toEqual([shelfCookie.width, shelfCookie.height]);
  });

  it.each(WIDTHS)('centres both on the top of the cake at %i px', (width) => {
    const { product } = kitchenLayout(width);
    const centre = product.x + CAKE.topCenterX;
    for (const slot of [productDigitSlot(product, 'cake'), productLetterSlot(product, 'cake')]) {
      expect(slot.x + slot.width / 2).toBe(centre);
      expect(slot.x).toBeGreaterThanOrEqual(product.x);
      expect(slot.x + slot.width).toBeLessThanOrEqual(product.x + product.width);
      expect(inside(slot, width)).toBe(true);
    }
  });

  it.each(WIDTHS)('stands the candle on the cake and leans the cookie on it at %i px', (width) => {
    const { product, bowl } = kitchenLayout(width);
    const candleSlot = productDigitSlot(product, 'cake');
    const cookieSlot = productLetterSlot(product, 'cake');
    expect(candleSlot.y + candleSlot.height).toBe(product.y + CAKE.topItemBottom);
    expect(cookieSlot.y + cookieSlot.height / 2).toBe(product.y + CAKE.frontItemCenterY);
    // The cake carries both in the middle; only the ice cream had to move them apart.
    expect(candleSlot.x + candleSlot.width / 2).toBe(product.x + CAKE.topCenterX);
    expect(cookieSlot.x + cookieSlot.width / 2).toBe(product.x + CAKE.topCenterX);
    expect(cookieSlot.y + cookieSlot.height).toBeLessThanOrEqual(product.y + product.height);
    for (const slot of [candleSlot, cookieSlot]) expect(separation(slot, bowl)).toBeGreaterThan(0);
  });

  it('matches the worked example from the step plan', () => {
    const { product } = kitchenLayout(1024);
    expect(productDigitSlot(product, 'cake')).toEqual({ x: 394, y: 296, width: 96, height: 112 });
    expect(productLetterSlot(product, 'cake')).toEqual({ x: 394, y: 428, width: 96, height: 96 });
  });
});

describe('fruitSlots', () => {
  const bowl = kitchenLayout(1024).bowl;

  it('fills the bowl with three square hit boxes by default', () => {
    const slots = fruitSlots(bowl);
    expect(slots).toHaveLength(MAX_FRUIT_SLOTS);
    expect(slots.map((slot) => slot.x)).toEqual([580, 692, 804]);
    for (const slot of slots) {
      expect(slot.width).toBe(FRUIT_SLOT);
      expect(slot.height).toBe(FRUIT_SLOT);
      expect(slot.width).toBeGreaterThanOrEqual(MIN_TARGET);
      expect(slot.y).toBe(bowl.y);
      expect(slot.x).toBeGreaterThanOrEqual(bowl.x);
      expect(slot.x + slot.width).toBeLessThanOrEqual(bowl.x + bowl.width);
    }
    for (let i = 1; i < slots.length; i += 1) {
      expect(slots[i]!.x - (slots[i - 1]!.x + FRUIT_SLOT)).toBe(FRUIT_GAP);
    }
  });

  it.each([1, 2])('centres a row of %i berries inside the bowl', (count) => {
    const slots = fruitSlots(bowl, count);
    expect(slots).toHaveLength(count);
    const rowWidth = count * FRUIT_SLOT + (count - 1) * FRUIT_GAP;
    expect(slots[0]!.x).toBe(bowl.x + (bowl.width - rowWidth) / 2);
  });

  it('clamps the count', () => {
    expect(fruitSlots(bowl, 0)).toEqual([]);
    expect(fruitSlots(bowl, -3)).toEqual([]);
    expect(fruitSlots(bowl, 9)).toHaveLength(MAX_FRUIT_SLOTS);
  });
});

describe('counterPanels', () => {
  it.each([
    [1024, 3],
    [1200, 3],
    [1295, 3],
    [1296, 4],
    [1366, 4],
  ])('draws %i px wide counter with the right number of doors', (width, count) => {
    expect(counterPanels(width)).toHaveLength(count);
  });

  it.each(WIDTHS)('centres the doors inside the %i px counter front', (width) => {
    const panels = counterPanels(width);
    const first = panels[0]!;
    const last = panels[panels.length - 1]!;
    expect(first.x).toBe(width - (last.x + last.width));
    expect(first.x).toBeGreaterThan(0);
    for (const panel of panels) {
      expect(panel.y).toBe(COUNTER_FRONT_TOP + 14);
      expect(panel.y + panel.height).toBeLessThan(STAGE_HEIGHT);
    }
  });

  it('matches the worked example from the step plan', () => {
    expect(counterPanels(1024)[0]).toEqual({ x: 38, y: 574, width: 300, height: 104 });
  });
});

describe('closedLayout (STEP-14)', () => {
  it.each(WIDTHS)('keeps the timer, the lock and the panel inside the %i px stage', (width) => {
    for (const box of Object.values(closedLayout(width))) {
      expect(inside(box, width)).toBe(true);
    }
  });

  it.each(WIDTHS)('centres the timer and the panel at %i px', (width) => {
    const { clock, keypad } = closedLayout(width);
    expect(clock.x + clock.width / 2).toBeCloseTo(width / 2, 0);
    expect(keypad.x + keypad.width / 2).toBeCloseTo(width / 2, 0);
    expect(clock.width).toBe(CLOCK_SIZE);
    expect(keypad.width).toBe(KEYPAD_WIDTH);
    expect(keypad.height).toBe(KEYPAD_HEIGHT);
  });

  it.each(WIDTHS)('holds the lock in the bottom right corner at %i px', (width) => {
    const { lock } = closedLayout(width);
    expect(Math.min(lock.width, lock.height)).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(lock.x + lock.width).toBeLessThan(width);
    expect(lock.y + lock.height).toBeLessThan(STAGE_HEIGHT);
    expect(lock.width).toBe(LOCK_SIZE);
  });

  it('takes any width the console throws at it, like kitchenLayout', () => {
    expect(closedLayout(Number.NaN)).toEqual(closedLayout(1024));
    expect(closedLayout(4000)).toEqual(closedLayout(1366));
  });
});

describe('keypadKeys and codeSlot', () => {
  it.each(WIDTHS)('lays ten keys inside the panel at %i px', (width) => {
    const panel = closedLayout(width).keypad;
    const keys = keypadKeys(panel);
    expect(keys).toHaveLength(10);
    for (const key of keys) {
      expect(Math.min(key.width, key.height)).toBeGreaterThanOrEqual(MIN_TARGET);
      expect(key.x).toBeGreaterThanOrEqual(panel.x + KEYPAD_PADDING);
      expect(key.x + key.width).toBeLessThanOrEqual(panel.x + panel.width - KEYPAD_PADDING);
      expect(key.y).toBeGreaterThanOrEqual(panel.y + KEYPAD_PADDING);
      expect(key.y + key.height).toBeLessThanOrEqual(panel.y + panel.height - KEYPAD_PADDING);
    }
  });

  it('never lets two keys overlap', () => {
    const keys = keypadKeys(closedLayout(1024).keypad);
    for (const [index, key] of keys.entries()) {
      for (const other of keys.slice(index + 1)) {
        expect(separation(key, other)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('puts the nought in the middle of the fourth row', () => {
    const keys = keypadKeys(closedLayout(1024).keypad);
    const nought = keys[9]!;
    const five = keys[4]!;
    expect(nought.x).toBe(five.x);
    expect(nought.y).toBe(keys[6]!.y + KEY_SIZE + KEY_GAP);
  });

  it('runs the row of typed dots across the top of the panel', () => {
    const panel = closedLayout(1024).keypad;
    const dots = codeSlot(panel);
    expect(CODE_LENGTH).toBe(4);
    expect(dots.y).toBe(panel.y + KEYPAD_PADDING);
    expect(dots.width).toBe(panel.width - 2 * KEYPAD_PADDING);
    expect(dots.y + dots.height).toBeLessThanOrEqual(keypadKeys(panel)[0]!.y);
  });
});

describe('floorColumns', () => {
  it.each(WIDTHS)('covers the whole %i px floor', (width) => {
    expect(floorColumns(width) * 64).toBeGreaterThanOrEqual(width);
  });
});

describe('pillSlots', () => {
  it.each(WIDTHS)('centres the row over the cake at %i px', (width) => {
    const { product } = kitchenLayout(width);
    for (let count = 1; count <= MAX_PILLS; count += 1) {
      const slots = pillSlots(product, count);
      expect(slots).toHaveLength(count);
      const first = slots[0]!;
      const last = slots[slots.length - 1]!;
      expect(first.x - product.x).toBe(product.x + product.width - (last.x + last.width));
      for (const slot of slots) {
        expect(slot.y).toBe(product.y - PILL_OFFSET_Y);
        expect(slot.width).toBe(PILL_SIZE);
        expect(slot.height).toBe(PILL_SIZE);
      }
      for (let i = 1; i < slots.length; i += 1) {
        expect(slots[i]!.x - (slots[i - 1]!.x + PILL_SIZE)).toBe(PILL_GAP);
      }
    }
  });

  it.each(WIDTHS)(
    'leaves 8 px between the full row, the customer and the shelf at %i px',
    (width) => {
      const { customer, product, shelfLetters } = kitchenLayout(width);
      const slots = pillSlots(product, MAX_PILLS);
      const first = slots[0]!;
      const last = slots[slots.length - 1]!;
      expect(first.x - (customer.x + customer.width)).toBeGreaterThanOrEqual(8);
      expect(shelfLetters.x - (last.x + last.width)).toBeGreaterThanOrEqual(8);
      expect(first.y).toBeGreaterThanOrEqual(0);
    },
  );

  it('clamps the count', () => {
    const { product } = kitchenLayout(1024);
    expect(pillSlots(product, 0)).toEqual([]);
    expect(pillSlots(product, -2)).toEqual([]);
    expect(pillSlots(product, Number.NaN)).toEqual([]);
    expect(pillSlots(product, 9)).toHaveLength(MAX_PILLS);
  });

  it('matches the worked example from the step plan', () => {
    expect(pillSlots(kitchenLayout(1024).product, 5).map((slot) => slot.x)).toEqual([
      330, 376, 422, 468, 514,
    ]);
    expect(pillSlots(kitchenLayout(1024).product, 5)[0]).toEqual({
      x: 330,
      y: 300,
      width: 40,
      height: 40,
    });
  });
});

describe('productCountSlots', () => {
  it.each(WIDTHS)('fills the front row first, then the back one at %i px', (width) => {
    const { product } = kitchenLayout(width);
    for (let count = 1; count <= MAX_COUNT_PIECES; count += 1) {
      const slots = productCountSlots(product, 'cake', count);
      expect(slots).toHaveLength(count);
      expect(slots.map((slot) => slot.back)).toEqual(
        Array.from({ length: count }, (_, index) => index >= 3),
      );
      for (const slot of slots) {
        expect(slot.width).toBe(fruitWidth(CAKE.count!.height));
        expect(slot.height).toBe(CAKE.count!.height);
        expect(slot.x).toBeGreaterThanOrEqual(product.x);
        expect(slot.x + slot.width).toBeLessThanOrEqual(product.x + product.width);
        expect(slot.y).toBeGreaterThan(product.y - CAKE.count!.height);
        expect(slot.y + slot.height).toBeLessThan(product.y + product.height);
      }
      const back = slots.filter((slot) => slot.back);
      const front = slots.filter((slot) => !slot.back);
      for (const row of [front, back]) {
        for (let i = 1; i < row.length; i += 1) {
          expect(row[i]!.x).toBeGreaterThanOrEqual(row[i - 1]!.x + row[i - 1]!.width);
        }
      }
      for (const slot of back) expect(slot.y).toBeLessThan(front[0]!.y);
    }
  });

  it.each(WIDTHS)('keeps the fruit away from the bowl and the pills at %i px', (width) => {
    const { bowl, product } = kitchenLayout(width);
    const pills = pillSlots(product, MAX_PILLS);
    const pillBottom = pills[0]!.y + pills[0]!.height;
    for (const slot of productCountSlots(product, 'cake', MAX_COUNT_PIECES)) {
      expect(slot.x + slot.width).toBeLessThan(bowl.x);
      expect(slot.y).toBeGreaterThan(pillBottom);
    }
  });

  it('centres both rows on the top of the cake', () => {
    const { product } = kitchenLayout(1024);
    const center = (slots: Rect[]) =>
      (slots[0]!.x + slots[slots.length - 1]!.x + slots[0]!.width) / 2;
    const slots = productCountSlots(product, 'cake', MAX_COUNT_PIECES);
    expect(center(slots.filter((slot) => !slot.back))).toBe(442);
    expect(center(slots.filter((slot) => slot.back))).toBe(442);
  });

  it('clamps the count', () => {
    const { product } = kitchenLayout(1024);
    expect(productCountSlots(product, 'cake', 0)).toEqual([]);
    expect(productCountSlots(product, 'cake', -1)).toEqual([]);
    expect(productCountSlots(product, 'cake', Number.NaN)).toEqual([]);
    expect(productCountSlots(product, 'cake', 9)).toHaveLength(MAX_COUNT_PIECES);
  });

  it('matches the worked example from the step plan', () => {
    const slots = productCountSlots(kitchenLayout(1024).product, 'cake', 5);
    expect(slots).toEqual([
      { x: 385, y: 362, width: 34, height: 44, back: false },
      { x: 425, y: 362, width: 34, height: 44, back: false },
      { x: 465, y: 362, width: 34, height: 44, back: false },
      { x: 405, y: 350, width: 34, height: 44, back: true },
      { x: 445, y: 350, width: 34, height: 44, back: true },
    ]);
  });

  it.each(WIDTHS)('counts onto the pancakes the same way as onto the cake at %i px', (width) => {
    const { bowl, product } = kitchenLayout(width);
    const pills = pillSlots(product, MAX_PILLS);
    const pillBottom = pills[0]!.y + pills[0]!.height;
    expect(PANCAKES.count).not.toBeNull();
    const slots = productCountSlots(product, 'pancakes', MAX_COUNT_PIECES);
    expect(slots).toHaveLength(MAX_COUNT_PIECES);
    const front = slots.filter((slot) => !slot.back);
    const back = slots.filter((slot) => slot.back);
    expect(front).toHaveLength(3);
    for (let i = 1; i < front.length; i += 1) {
      expect(front[i]!.x).toBeGreaterThanOrEqual(front[i - 1]!.x + front[i - 1]!.width);
    }
    // Every back piece peeks out of a gap in the front row, so all five can still be counted.
    for (const slot of back) {
      expect(slot.y).toBeLessThan(front[0]!.y);
      expect(slot.x).toBeGreaterThan(front[0]!.x);
      expect(slot.x + slot.width).toBeLessThan(front[2]!.x + front[2]!.width);
    }
    for (const slot of slots) {
      expect(slot.x + slot.width).toBeLessThan(bowl.x);
      expect(slot.y).toBeGreaterThan(pillBottom);
      expect(slot.x).toBeGreaterThanOrEqual(product.x);
      expect(slot.x + slot.width).toBeLessThanOrEqual(product.x + product.width);
    }
  });

  it.each(WIDTHS)(
    'leaves the fruit and the chocolate disc room for each other at %i px',
    (width) => {
      // An order may ask for counting AND a letter (návrh 5.3), and on the pancakes they meet: the
      // fruit lies on top of the stack, the disc leans against its front. This is what the fifth
      // pancake is for – three of them would put the two on top of each other.
      const { product } = kitchenLayout(width);
      const letterSlot = productLetterSlot(product, 'pancakes');
      for (const slot of productCountSlots(product, 'pancakes', MAX_COUNT_PIECES)) {
        expect(slot.y + slot.height).toBeLessThan(letterSlot.y);
      }
      expect(letterSlot.y - (product.y + PANCAKES.count!.frontBottom)).toBe(22);
    },
  );

  it.each(WIDTHS)(
    'stands the sign on the stack and leans the disc on its front at %i px',
    (width) => {
      const { bowl, product } = kitchenLayout(width);
      const signSlot = productDigitSlot(product, 'pancakes');
      const discSlot = productLetterSlot(product, 'pancakes');
      expect(signSlot.y + signSlot.height).toBe(product.y + PANCAKES.topItemBottom);
      expect(discSlot.y + discSlot.height / 2).toBe(product.y + PANCAKES.frontItemCenterY);
      // Both on the centre line of the stack, and never on top of one another or of the bowl.
      for (const slot of [signSlot, discSlot]) {
        expect(slot.x + slot.width / 2).toBe(product.x + PANCAKES.topCenterX);
        expect(separation(slot, bowl)).toBeGreaterThan(0);
        expect(inside(slot, width)).toBe(true);
      }
      expect(separation(signSlot, discSlot)).toBeGreaterThan(0);
      // The disc leans on the stack, it does not hang below the plate.
      expect(discSlot.y + discSlot.height).toBeLessThanOrEqual(product.y + product.height);
      // Both are drawn at the size they stand on the shelf, so no flight ever rescales one.
      const shelfSlot = shelfSlots(kitchenLayout(width).shelfLetters, 3)[0]!;
      expect(discSlot.width).toBe(shelfSlot.width);
    },
  );
});

describe('lidRect', () => {
  it.each(WIDTHS)('sits the dome exactly on the rim of the bowl at %i px', (width) => {
    const { bowl } = kitchenLayout(width);
    const lid = lidRect(bowl);
    expect(lid.x).toBe(bowl.x);
    expect(lid.width).toBe(bowl.width);
    expect(lid.height).toBe(LID_HEIGHT);
    expect(lid.y + LID_RIM_Y).toBe(bowl.y + BOWL_RIM_Y);
    expect(lid.y).toBeGreaterThan(0);
  });

  it('matches the worked example from the step plan', () => {
    expect(lidRect(kitchenLayout(1024).bowl)).toEqual({
      x: 580,
      y: 380,
      width: 320,
      height: 80,
    });
  });
});

describe('bowlFruitSpots', () => {
  const bowl = kitchenLayout(1024).bowl;

  it('shows the front row first and tucks the back row into its gaps', () => {
    const spots = bowlFruitSpots(bowl);
    expect(spots.map((spot) => spot.back)).toEqual([false, false, false, true, true]);
    const front = spots.filter((spot) => !spot.back);
    const back = spots.filter((spot) => spot.back);
    expect(front.map((spot) => spot.cx)).toEqual([628, 740, 852]);
    expect(back.map((spot) => spot.cx)).toEqual([684, 796]);
    for (const spot of spots) expect(spot.cy).toBe(bowl.y + BOWL_FRUIT_CENTER_Y);
    for (const spot of front) expect(spot.height).toBe(BOWL_FRONT_FRUIT_HEIGHT);
    for (const spot of back) expect(spot.height).toBe(BOWL_BACK_FRUIT_HEIGHT);
  });

  it('stands every piece of fruit on a slot of fruitSlots', () => {
    const centers = fruitSlots(bowl).map((slot) => slot.x + slot.width / 2);
    expect(
      bowlFruitSpots(bowl)
        .filter((spot) => !spot.back)
        .map((spot) => spot.cx),
    ).toEqual(centers);
  });

  it('keeps every piece inside the bowl and reachable by one tap on it', () => {
    for (const spot of bowlFruitSpots(bowl)) {
      expect(spot.cx - spot.height / 2).toBeGreaterThanOrEqual(bowl.x);
      expect(spot.cx + spot.height / 2).toBeLessThanOrEqual(bowl.x + bowl.width);
      expect(spot.cy - spot.height / 2).toBeGreaterThanOrEqual(bowl.y);
      expect(spot.cy + spot.height / 2).toBeLessThanOrEqual(bowl.y + bowl.height);
    }
    // The tap target is the whole bowl, so it clears the 88 px of rule 3 many times over.
    expect(Math.min(bowl.width, bowl.height)).toBeGreaterThanOrEqual(MIN_TARGET);
  });

  it('follows the number of slots it is given', () => {
    expect(bowlFruitSpots(bowl, 1)).toHaveLength(1);
    expect(bowlFruitSpots(bowl, 2)).toHaveLength(3);
    expect(bowlFruitSpots(bowl, 0)).toEqual([]);
  });
});

describe('the ice cream arrives finished (STEP-17)', () => {
  it('has no slots to count into, whatever is asked of it', () => {
    // `Product.counts` says the same thing on the data side; the generator never sends a counting
    // item its way, and if one ever arrived it would land nowhere rather than on top of the cone.
    const { product } = kitchenLayout(1024);
    expect(PRODUCT_GEOMETRY.icecream.count).toBeNull();
    for (const count of [0, 1, 3, 5, 9]) {
      expect(productCountSlots(product, 'icecream', count)).toEqual([]);
    }
  });

  it.each(WIDTHS)('never crosses the flag with the wafer at %i px', (width) => {
    const { product, bowl } = kitchenLayout(width);
    for (const id of ['cake', 'icecream'] as const) {
      const digit = productDigitSlot(product, id);
      const letter = productLetterSlot(product, id);
      expect(separation(digit, letter), id).toBeGreaterThan(0);
      expect(separation(digit, bowl), id).toBeGreaterThan(0);
      expect(separation(letter, bowl), id).toBeGreaterThan(0);
      // Both are drawn at the size they stand on the shelf, so no flight ever rescales one.
      expect(digit.width).toBe(PRODUCT_GEOMETRY[id].digitSize.width);
      expect(letter.height).toBe(PRODUCT_GEOMETRY[id].letterSize.height);
    }
  });

  it('plants the flag in the scoops and leans the wafer on the cone below them', () => {
    const { product } = kitchenLayout(1024);
    const flag = productDigitSlot(product, 'icecream');
    const waferSlot = productLetterSlot(product, 'icecream');
    expect(flag.y + flag.height).toBe(product.y + ICECREAM.topItemBottom);
    expect(waferSlot.y + waferSlot.height / 2).toBe(product.y + ICECREAM.frontItemCenterY);
    // The flag is above the wafer, never beside it, and both are on the centre line.
    expect(flag.y + flag.height).toBeLessThan(waferSlot.y);
    expect(flag.x + flag.width / 2).toBe(product.x + ICECREAM.topCenterX);
    expect(waferSlot.x + waferSlot.width / 2).toBe(product.x + ICECREAM.topCenterX);
    // The wafer stays low enough to leave the scoops – what says "ice cream" – in the clear.
    expect(waferSlot.y).toBeGreaterThan(product.y + 40);
    expect(waferSlot.y + waferSlot.height).toBeLessThanOrEqual(product.y + product.height + 8);
  });
});
