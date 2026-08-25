import { describe, expect, it } from 'vitest';
import { STAGE_HEIGHT } from '../stage/layout';
import {
  COUNTER_EDGE_TOP,
  COUNTER_FRONT_TOP,
  COUNTER_TOP,
  FRUIT_GAP,
  FRUIT_SLOT,
  MAX_CHOICES,
  MAX_FRUIT_SLOTS,
  SHELF_GAP,
  SHELF_ITEM_WIDTH,
  counterPanels,
  floorColumns,
  fruitSlots,
  kitchenLayout,
  shelfSlots,
} from './layout';
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
