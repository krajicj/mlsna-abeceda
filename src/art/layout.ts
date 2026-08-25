/**
 * Kitchen geometry in logical stage pixels (height is always 768, width 1024–1366). Pure and
 * DOM-free on purpose: the scene positions its boxes from here, and STEP-05/06 read the same
 * numbers to animate a strawberry from the bowl onto the cake or to fill the shelves.
 */
import { STAGE_MAX_WIDTH, STAGE_MIN_WIDTH } from '../stage/layout';
import { CANDLE_HEIGHT, CANDLE_WIDTH } from './candle';
import { COOKIE_SIZE } from './cookie';
import { fruitWidth } from './fruit';
import type { Rect } from './svg';

export const SHELF_ITEM_WIDTH = 96; // ≥ 88 (CLAUDE.md, rule 3)
export const SHELF_GAP = 16;
export const SHELF_BOARD = 16; // the board itself: the bottom strip of the shelf rect
export const MAX_CHOICES = 4;
/** Pitch of the hit boxes on a shelf: the piece plus the gap, so no tap falls between two. */
export const SHELF_HIT_WIDTH = SHELF_ITEM_WIDTH + SHELF_GAP;
export const FRUIT_SLOT = 96; // strawberry hit box, ≥ 88
export const FRUIT_GAP = 16;
export const MAX_FRUIT_SLOTS = 3; // more would not fit a 320 px bowl without overlapping

/** The counter above the cake: indicators, never touched, so they may be smaller than 88. */
export const PILL_SIZE = 40;
export const PILL_GAP = 6;
export const MAX_PILLS = 5;
/** The pills sit above the cake: y = cake.y − PILL_OFFSET_Y. */
export const PILL_OFFSET_Y = 84;

/**
 * The order bubble above the bear (STEP-09). 480 px wide, not the 500 of the artboard: on a
 * 1024 px stage the digit shelf starts at x = 562, and the layout invariant asks for 8 px between
 * any two boxes – 480 leaves 22. Sizes live here, `art/bubble.ts` draws to them.
 */
export const BUBBLE_WIDTH = 480;
export const BUBBLE_HEIGHT = 124;
export const BUBBLE_PADDING = 20;
export const BUBBLE_SPEAKER = 44;
/** Where the pictures start: padding + the speaker icon + a gap. */
export const BUBBLE_CONTENT_X = 80;
export const BUBBLE_ITEM_WIDTH = 116;
export const BUBBLE_ITEM_HEIGHT = 88;
export const BUBBLE_ITEM_GAP = 12;
/** Three pictures is what the card holds; orders that long arrive in STEP-11. */
export const BUBBLE_MAX_ITEMS = 3;
/** The tail of the bubble, measured from the left edge of the card – it points at the bear. */
export const BUBBLE_TAIL_X = 110;
/** Height of the tail below the card; the drawing is that much taller than `bubble`. */
export const BUBBLE_TAIL_HEIGHT = 24;

/** The star counter in the top right corner (návrh kap. 7). Never tapped – an indicator. */
export const STARS_PILL_WIDTH = 160;
export const STARS_PILL_HEIGHT = 64;
export const STARS_PILL_MARGIN = 16;
export const STAR_SIZE = 40;

export const MAX_CAKE_FRUIT = 5;
export const CAKE_FRUIT_HEIGHT = 44;
export const CAKE_FRUIT_PITCH = 40;
/** Centre of the top of the cake inside its 220×146 box (read off cake.ts). */
export const CAKE_TOP_CENTER_X = 110;
/** Local y where something standing on the top of the cake touches down (the candle). */
export const CAKE_TOP_ITEM_BOTTOM = 24;
/** Local y of the centre of a cookie leaning against the front of the cake (the icing band). */
export const CAKE_COOKIE_CENTER_Y = 92;
/** Bottom edges of the two rows of fruit, measured from the top of the cake box. */
const CAKE_FRUIT_FRONT_BOTTOM = 22;
const CAKE_FRUIT_BACK_BOTTOM = 10;
const CAKE_FRUIT_FRONT_MAX = 3;

/** The rim line of the bowl; everything below it is the bowl itself (see bowl.ts). */
export const BOWL_RIM_Y = 56;
export const LID_HEIGHT = 80;
/** The rim of the dome inside the lid box – it lands exactly on the rim of the bowl. */
export const LID_RIM_Y = 76;

export const COUNTER_TOP = 500; // top of the wooden worktop
export const COUNTER_EDGE_TOP = 546; // dark edge under the worktop
export const COUNTER_FRONT_TOP = 560; // mint front with the doors
export const FLOOR_TOP = 692;

export interface KitchenLayout {
  readonly bear: Rect;
  readonly cake: Rect;
  readonly bowl: Rect;
  /** The whole shelf including the board; the slots sit on top of the board. */
  readonly shelfDigits: Rect;
  readonly shelfLetters: Rect;
  /** The order card above the bear; the same place whatever the stage width. */
  readonly bubble: Rect;
  /** The star counter, held against the right edge, above the digit shelf. */
  readonly stars: Rect;
}

/** The stage clamps its own width, but the dev console and tests can pass anything. */
export function clampStageWidth(stageWidth: number): number {
  if (!Number.isFinite(stageWidth)) return STAGE_MIN_WIDTH;
  return Math.min(Math.max(Math.round(stageWidth), STAGE_MIN_WIDTH), STAGE_MAX_WIDTH);
}

/** A centred row of `count` boxes `size` wide with `gap` between them, starting at `left`. */
function centeredRow(left: number, available: number, count: number, size: number, gap: number) {
  const rowWidth = count * size + (count - 1) * gap;
  const start = left + Math.round((available - rowWidth) / 2);
  return Array.from({ length: count }, (_, index) => start + index * (size + gap));
}

/** Pure: stage width → the boxes of the scene. Clamps the width to [1024, 1366]. */
export function kitchenLayout(stageWidth: number): KitchenLayout {
  const width = clampStageWidth(stageWidth);
  const cake: Rect = { x: Math.round(width / 2) - 180, y: 384, width: 220, height: 146 };
  return {
    bear: { x: 60, y: 200, width: 260, height: 320 },
    cake,
    bowl: { x: cake.x + 248, y: 400, width: 320, height: 140 },
    shelfDigits: { x: width - 462, y: 84, width: 448, height: 128 },
    shelfLetters: { x: width - 462, y: 252, width: 448, height: 112 },
    bubble: { x: 60, y: 28, width: BUBBLE_WIDTH, height: BUBBLE_HEIGHT },
    // 10 px above the digit shelf: the layout test guards 8 px between any two boxes, so moving
    // the counter (or making it taller) means checking that gap again.
    stars: {
      x: width - STARS_PILL_WIDTH - STARS_PILL_MARGIN,
      y: 10,
      width: STARS_PILL_WIDTH,
      height: STARS_PILL_HEIGHT,
    },
  };
}

/** A centred row of `count` (0–`MAX_CHOICES`) slots standing on the shelf board. */
export function shelfSlots(shelf: Rect, count: number): Rect[] {
  const n = Math.min(Math.max(Math.floor(count) || 0, 0), MAX_CHOICES);
  const height = shelf.height - SHELF_BOARD;
  return centeredRow(shelf.x, shelf.width, n, SHELF_ITEM_WIDTH, SHELF_GAP).map((x) => ({
    x,
    y: shelf.y,
    width: SHELF_ITEM_WIDTH,
    height,
  }));
}

/**
 * Hit boxes over the slots of `shelfSlots`: the same centres, but SHELF_HIT_WIDTH wide and touching
 * each other, so a finger that lands between two pieces still hits the nearer one. The row as a
 * whole is not one target the way the bowl is – here a tap has a meaning, and a stray one at the
 * edge of the shelf must not turn into a mistake the child never made.
 */
export function shelfHitSlots(shelf: Rect, count: number): Rect[] {
  const n = Math.min(Math.max(Math.floor(count) || 0, 0), MAX_CHOICES);
  const height = shelf.height - SHELF_BOARD;
  return centeredRow(shelf.x, shelf.width, n, SHELF_HIT_WIDTH, 0).map((x) => ({
    x,
    y: shelf.y,
    width: SHELF_HIT_WIDTH,
    height,
  }));
}

/**
 * Where the picked piece lands on the cake. Both slots take their size from the art modules
 * (candle.ts, cookie.ts), so a piece is exactly as big on the cake as it was on the shelf and the
 * flight never has to rescale it. No import cycle: neither module imports this one.
 */
export function cakeCandleSlot(cake: Rect): Rect {
  return {
    x: Math.round(cake.x + CAKE_TOP_CENTER_X - CANDLE_WIDTH / 2),
    y: Math.round(cake.y + CAKE_TOP_ITEM_BOTTOM - CANDLE_HEIGHT),
    width: CANDLE_WIDTH,
    height: CANDLE_HEIGHT,
  };
}

/** The cookie leans against the front of the cake, centred on the icing – the letter stays big. */
export function cakeCookieSlot(cake: Rect): Rect {
  return {
    x: Math.round(cake.x + CAKE_TOP_CENTER_X - COOKIE_SIZE / 2),
    y: Math.round(cake.y + CAKE_COOKIE_CENTER_Y - COOKIE_SIZE / 2),
    width: COOKIE_SIZE,
    height: COOKIE_SIZE,
  };
}

/**
 * Strawberry hit boxes in the bowl: `count` (default and maximum `MAX_FRUIT_SLOTS`) squares in
 * one row, centred inside `bowl.width` – the same rule the shelf slots follow. At three slots
 * the row is exactly 320 px, so it fills the bowl edge to edge.
 */
export function fruitSlots(bowl: Rect, count: number = MAX_FRUIT_SLOTS): Rect[] {
  const n = Math.min(Math.max(Math.floor(count) || 0, 0), MAX_FRUIT_SLOTS);
  return centeredRow(bowl.x, bowl.width, n, FRUIT_SLOT, FRUIT_GAP).map((x) => ({
    x,
    y: bowl.y,
    width: FRUIT_SLOT,
    height: FRUIT_SLOT,
  }));
}

/** A slot is always `fruitWidth(CAKE_FRUIT_HEIGHT)` wide, i.e. 34 px – fruit is never stretched. */
export interface CakeSlot extends Rect {
  /** Back row – drawn under the front one (z-index 0 × 1). */
  readonly back: boolean;
}

function clampCount(count: number, max: number): number {
  const n = Math.floor(count);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0;
}

/**
 * Where the fruit lands on the cake, in the order it arrives: the first three into the front row,
 * the rest (at most two) into the back one. The front row has a pitch of CAKE_FRUIT_PITCH and is
 * centred on the top of the cake; every back piece sits in a gap of the front row, so it peeks out
 * between two front ones and the child can still count all of them.
 */
export function cakeFruitSlots(cake: Rect, count: number): CakeSlot[] {
  const n = clampCount(count, MAX_CAKE_FRUIT);
  const width = fruitWidth(CAKE_FRUIT_HEIGHT);
  const center = cake.x + CAKE_TOP_CENTER_X;
  const frontCount = Math.min(n, CAKE_FRUIT_FRONT_MAX);
  const frontCenters = Array.from(
    { length: frontCount },
    (_, index) => center + (index - (frontCount - 1) / 2) * CAKE_FRUIT_PITCH,
  );
  const backCenters = frontCenters
    .slice(1)
    .map((x, index) => (x + (frontCenters[index] ?? x)) / 2)
    .slice(0, n - frontCount);
  const slot = (cx: number, back: boolean): CakeSlot => ({
    x: Math.round(cx - width / 2),
    y: cake.y + (back ? CAKE_FRUIT_BACK_BOTTOM : CAKE_FRUIT_FRONT_BOTTOM) - CAKE_FRUIT_HEIGHT,
    width,
    height: CAKE_FRUIT_HEIGHT,
    back,
  });
  return [...frontCenters.map((cx) => slot(cx, false)), ...backCenters.map((cx) => slot(cx, true))];
}

/** The row of pills above the cake, centred on it; `count` is clamped to 0…MAX_PILLS. */
export function pillSlots(cake: Rect, count: number): Rect[] {
  const n = clampCount(count, MAX_PILLS);
  return centeredRow(cake.x, cake.width, n, PILL_SIZE, PILL_GAP).map((x) => ({
    x,
    y: cake.y - PILL_OFFSET_Y,
    width: PILL_SIZE,
    height: PILL_SIZE,
  }));
}

/**
 * The centred row of pictures inside the bubble: `count` (0…BUBBLE_MAX_ITEMS) boxes in the space
 * left of the speaker icon, vertically centred in the card – the same rule as `shelfSlots()`.
 */
export function bubbleSlots(bubble: Rect, count: number): Rect[] {
  const n = clampCount(count, BUBBLE_MAX_ITEMS);
  const left = bubble.x + BUBBLE_CONTENT_X;
  const available = bubble.width - BUBBLE_CONTENT_X - BUBBLE_PADDING;
  const y = bubble.y + Math.round((bubble.height - BUBBLE_ITEM_HEIGHT) / 2);
  return centeredRow(left, available, n, BUBBLE_ITEM_WIDTH, BUBBLE_ITEM_GAP).map((x) => ({
    x,
    y,
    width: BUBBLE_ITEM_WIDTH,
    height: BUBBLE_ITEM_HEIGHT,
  }));
}

/** The speaker icon on the left of the card – "tap me and I will say it again". */
export function bubbleSpeakerSlot(bubble: Rect): Rect {
  return {
    x: bubble.x + BUBBLE_PADDING,
    y: bubble.y + Math.round((bubble.height - BUBBLE_SPEAKER) / 2),
    width: BUBBLE_SPEAKER,
    height: BUBBLE_SPEAKER,
  };
}

/** Where the star flies to: the icon inside the counter. */
export function starSlot(stars: Rect): Rect {
  return {
    x: stars.x + STARS_PILL_MARGIN,
    y: stars.y + Math.round((stars.height - STAR_SIZE) / 2),
    width: STAR_SIZE,
    height: STAR_SIZE,
  };
}

/** The box of the lid over the bowl (the rim of the dome sits exactly on the rim of the bowl). */
export function lidRect(bowl: Rect): Rect {
  return {
    x: bowl.x,
    y: bowl.y + BOWL_RIM_Y - LID_RIM_Y,
    width: bowl.width,
    height: LID_HEIGHT,
  };
}

/**
 * Local y of every fruit centre inside the bowl: the near rim of the bowl (BOWL_RIM_Y) then cuts
 * each piece roughly in half, which is what reads as "fruit *in* the bowl". The far rim is drawn
 * behind the fruit (see bowl.ts) – over it, it looked like a wire across the fruit.
 */
export const BOWL_FRUIT_CENTER_Y = 48;
export const BOWL_FRONT_FRUIT_HEIGHT = 88;
export const BOWL_BACK_FRUIT_HEIGHT = 72;

export interface BowlSpot {
  readonly cx: number;
  readonly cy: number;
  readonly height: number;
  /** Back row: smaller, tucked into a gap of the front row and drawn under it. */
  readonly back: boolean;
}

/**
 * Every piece of fruit the bowl shows, front row first (those stand on the slots of `fruitSlots`),
 * then the smaller back ones in the gaps between them. The bowl draws from this and the scene taps
 * from it, so what the child sees and what answers a tap can never drift apart.
 */
export function bowlFruitSpots(bowl: Rect, slots: number = MAX_FRUIT_SLOTS): BowlSpot[] {
  const cy = bowl.y + BOWL_FRUIT_CENTER_Y;
  const front = fruitSlots(bowl, slots).map((slot) => ({
    cx: slot.x + slot.width / 2,
    cy,
    height: BOWL_FRONT_FRUIT_HEIGHT,
    back: false,
  }));
  const back = front.slice(1).map((spot, index) => ({
    cx: (spot.cx + (front[index]?.cx ?? spot.cx)) / 2,
    cy,
    height: BOWL_BACK_FRUIT_HEIGHT,
    back: true,
  }));
  return [...front, ...back];
}

const PANEL_WIDTH = 300;
const PANEL_GAP = 24;
const PANEL_HEIGHT = 104;

/**
 * Doors in the counter front: three up to 1295 px of stage width, four from 1296 px on, always
 * centred. `Math.floor(width / 324)` is the widest row that still leaves a margin.
 */
export function counterPanels(stageWidth: number): Rect[] {
  const width = clampStageWidth(stageWidth);
  const count = Math.min(Math.max(Math.floor(width / (PANEL_WIDTH + PANEL_GAP)), 3), 4);
  return centeredRow(0, width, count, PANEL_WIDTH, PANEL_GAP).map((x) => ({
    x,
    y: COUNTER_FRONT_TOP + 14,
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
  }));
}

export const FLOOR_TILE_WIDTH = 64;
export const FLOOR_TILE_HEIGHT = 36;

/** How many tile columns cover the floor (two rows of 64×36 tiles). */
export function floorColumns(stageWidth: number): number {
  return Math.ceil(clampStageWidth(stageWidth) / FLOOR_TILE_WIDTH);
}
