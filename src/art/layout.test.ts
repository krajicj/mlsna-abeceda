import { describe, expect, it } from 'vitest';
import { STAGE_HEIGHT } from '../stage/layout';
import {
  BOWL_BACK_FRUIT_HEIGHT,
  BOWL_FRONT_FRUIT_HEIGHT,
  BOWL_FRUIT_CENTER_Y,
  BOWL_RIM_Y,
  CAKE_COOKIE_CENTER_Y,
  CAKE_FRUIT_HEIGHT,
  CAKE_TOP_CENTER_X,
  CAKE_TOP_ITEM_BOTTOM,
  COUNTER_EDGE_TOP,
  COUNTER_FRONT_TOP,
  COUNTER_TOP,
  FRUIT_GAP,
  FRUIT_SLOT,
  LID_HEIGHT,
  LID_RIM_Y,
  MAX_CAKE_FRUIT,
  MAX_CHOICES,
  MAX_FRUIT_SLOTS,
  MAX_PILLS,
  PILL_GAP,
  PILL_OFFSET_Y,
  PILL_SIZE,
  SHELF_GAP,
  SHELF_HIT_WIDTH,
  SHELF_ITEM_WIDTH,
  bowlFruitSpots,
  cakeCandleSlot,
  cakeCookieSlot,
  cakeFruitSlots,
  counterPanels,
  floorColumns,
  fruitSlots,
  kitchenLayout,
  lidRect,
  pillSlots,
  shelfHitSlots,
  shelfSlots,
} from './layout';
import { CANDLE_HEIGHT, CANDLE_WIDTH } from './candle';
import { COOKIE_SIZE } from './cookie';
import { fruitWidth } from './fruit';
import type { Rect } from './svg';

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

  it.each(WIDTHS)('centres the cake horizontally at %i px', (width) => {
    const { cake } = kitchenLayout(width);
    expect(Math.abs(cake.x + cake.width / 2 - (width / 2 - 70))).toBeLessThanOrEqual(20);
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
    expect(kitchenLayout(1024).cake).toEqual({ x: 332, y: 384, width: 220, height: 146 });
    expect(kitchenLayout(1024).shelfLetters).toEqual({ x: 562, y: 252, width: 448, height: 112 });
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

describe('cakeCandleSlot and cakeCookieSlot', () => {
  it.each(WIDTHS)('takes the size straight from the art at %i px', (width) => {
    const { cake, shelfDigits, shelfLetters } = kitchenLayout(width);
    const candleSlot = cakeCandleSlot(cake);
    const cookieSlot = cakeCookieSlot(cake);
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
    const { cake } = kitchenLayout(width);
    const centre = cake.x + CAKE_TOP_CENTER_X;
    for (const slot of [cakeCandleSlot(cake), cakeCookieSlot(cake)]) {
      expect(slot.x + slot.width / 2).toBe(centre);
      expect(slot.x).toBeGreaterThanOrEqual(cake.x);
      expect(slot.x + slot.width).toBeLessThanOrEqual(cake.x + cake.width);
      expect(inside(slot, width)).toBe(true);
    }
  });

  it.each(WIDTHS)('stands the candle on the cake and leans the cookie on it at %i px', (width) => {
    const { cake, bowl } = kitchenLayout(width);
    const candleSlot = cakeCandleSlot(cake);
    const cookieSlot = cakeCookieSlot(cake);
    expect(candleSlot.y + candleSlot.height).toBe(cake.y + CAKE_TOP_ITEM_BOTTOM);
    expect(cookieSlot.y + cookieSlot.height / 2).toBe(cake.y + CAKE_COOKIE_CENTER_Y);
    expect(cookieSlot.y + cookieSlot.height).toBeLessThanOrEqual(cake.y + cake.height);
    for (const slot of [candleSlot, cookieSlot]) expect(separation(slot, bowl)).toBeGreaterThan(0);
  });

  it('matches the worked example from the step plan', () => {
    const { cake } = kitchenLayout(1024);
    expect(cakeCandleSlot(cake)).toEqual({ x: 394, y: 296, width: 96, height: 112 });
    expect(cakeCookieSlot(cake)).toEqual({ x: 394, y: 428, width: 96, height: 96 });
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

describe('floorColumns', () => {
  it.each(WIDTHS)('covers the whole %i px floor', (width) => {
    expect(floorColumns(width) * 64).toBeGreaterThanOrEqual(width);
  });
});

describe('pillSlots', () => {
  it.each(WIDTHS)('centres the row over the cake at %i px', (width) => {
    const { cake } = kitchenLayout(width);
    for (let count = 1; count <= MAX_PILLS; count += 1) {
      const slots = pillSlots(cake, count);
      expect(slots).toHaveLength(count);
      const first = slots[0]!;
      const last = slots[slots.length - 1]!;
      expect(first.x - cake.x).toBe(cake.x + cake.width - (last.x + last.width));
      for (const slot of slots) {
        expect(slot.y).toBe(cake.y - PILL_OFFSET_Y);
        expect(slot.width).toBe(PILL_SIZE);
        expect(slot.height).toBe(PILL_SIZE);
      }
      for (let i = 1; i < slots.length; i += 1) {
        expect(slots[i]!.x - (slots[i - 1]!.x + PILL_SIZE)).toBe(PILL_GAP);
      }
    }
  });

  it.each(WIDTHS)('leaves 8 px between the full row, the bear and the shelf at %i px', (width) => {
    const { bear, cake, shelfLetters } = kitchenLayout(width);
    const slots = pillSlots(cake, MAX_PILLS);
    const first = slots[0]!;
    const last = slots[slots.length - 1]!;
    expect(first.x - (bear.x + bear.width)).toBeGreaterThanOrEqual(8);
    expect(shelfLetters.x - (last.x + last.width)).toBeGreaterThanOrEqual(8);
    expect(first.y).toBeGreaterThanOrEqual(0);
  });

  it('clamps the count', () => {
    const { cake } = kitchenLayout(1024);
    expect(pillSlots(cake, 0)).toEqual([]);
    expect(pillSlots(cake, -2)).toEqual([]);
    expect(pillSlots(cake, Number.NaN)).toEqual([]);
    expect(pillSlots(cake, 9)).toHaveLength(MAX_PILLS);
  });

  it('matches the worked example from the step plan', () => {
    expect(pillSlots(kitchenLayout(1024).cake, 5).map((slot) => slot.x)).toEqual([
      330, 376, 422, 468, 514,
    ]);
    expect(pillSlots(kitchenLayout(1024).cake, 5)[0]).toEqual({
      x: 330,
      y: 300,
      width: 40,
      height: 40,
    });
  });
});

describe('cakeFruitSlots', () => {
  it.each(WIDTHS)('fills the front row first, then the back one at %i px', (width) => {
    const { cake } = kitchenLayout(width);
    for (let count = 1; count <= MAX_CAKE_FRUIT; count += 1) {
      const slots = cakeFruitSlots(cake, count);
      expect(slots).toHaveLength(count);
      expect(slots.map((slot) => slot.back)).toEqual(
        Array.from({ length: count }, (_, index) => index >= 3),
      );
      for (const slot of slots) {
        expect(slot.width).toBe(fruitWidth(CAKE_FRUIT_HEIGHT));
        expect(slot.height).toBe(CAKE_FRUIT_HEIGHT);
        expect(slot.x).toBeGreaterThanOrEqual(cake.x);
        expect(slot.x + slot.width).toBeLessThanOrEqual(cake.x + cake.width);
        expect(slot.y).toBeGreaterThan(cake.y - CAKE_FRUIT_HEIGHT);
        expect(slot.y + slot.height).toBeLessThan(cake.y + cake.height);
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
    const { bowl, cake } = kitchenLayout(width);
    const pills = pillSlots(cake, MAX_PILLS);
    const pillBottom = pills[0]!.y + pills[0]!.height;
    for (const slot of cakeFruitSlots(cake, MAX_CAKE_FRUIT)) {
      expect(slot.x + slot.width).toBeLessThan(bowl.x);
      expect(slot.y).toBeGreaterThan(pillBottom);
    }
  });

  it('centres both rows on the top of the cake', () => {
    const { cake } = kitchenLayout(1024);
    const center = (slots: Rect[]) =>
      (slots[0]!.x + slots[slots.length - 1]!.x + slots[0]!.width) / 2;
    const slots = cakeFruitSlots(cake, MAX_CAKE_FRUIT);
    expect(center(slots.filter((slot) => !slot.back))).toBe(442);
    expect(center(slots.filter((slot) => slot.back))).toBe(442);
  });

  it('clamps the count', () => {
    const { cake } = kitchenLayout(1024);
    expect(cakeFruitSlots(cake, 0)).toEqual([]);
    expect(cakeFruitSlots(cake, -1)).toEqual([]);
    expect(cakeFruitSlots(cake, Number.NaN)).toEqual([]);
    expect(cakeFruitSlots(cake, 9)).toHaveLength(MAX_CAKE_FRUIT);
  });

  it('matches the worked example from the step plan', () => {
    const slots = cakeFruitSlots(kitchenLayout(1024).cake, 5);
    expect(slots).toEqual([
      { x: 385, y: 362, width: 34, height: 44, back: false },
      { x: 425, y: 362, width: 34, height: 44, back: false },
      { x: 465, y: 362, width: 34, height: 44, back: false },
      { x: 405, y: 350, width: 34, height: 44, back: true },
      { x: 445, y: 350, width: 34, height: 44, back: true },
    ]);
  });
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
