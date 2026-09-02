/**
 * Kitchen geometry in logical stage pixels (height is always 768, width 1024–1366). Pure and
 * DOM-free on purpose: the scene positions its boxes from here, and STEP-05/06 read the same
 * numbers to animate a strawberry from the bowl onto the product or to fill the shelves.
 */
import { STAGE_HEIGHT, STAGE_MAX_WIDTH, STAGE_MIN_WIDTH } from '../stage/layout';
import { CANDLE_HEIGHT, CANDLE_WIDTH } from './candle';
import { COOKIE_SIZE } from './cookie';
import { DECOR_CAT_HEIGHT, DECOR_CAT_WIDTH } from './decor';
import { fruitWidth } from './fruit';
import { FLAG_HEIGHT, FLAG_WIDTH, ICECREAM_HEIGHT, WAFER_SIZE } from './icecream';
import { CHOCOLATE_SIZE, SIGN_HEIGHT, SIGN_WIDTH } from './pancakes';
import type { ProductId } from '../data/products';
import type { Rect } from './svg';

export const SHELF_ITEM_WIDTH = 96; // ≥ 88 (CLAUDE.md, rule 3)
export const SHELF_GAP = 16;
export const SHELF_BOARD = 16; // the board itself: the bottom strip of the shelf rect
export const MAX_CHOICES = 4;
export const PRIMER_TILE = 96; // ≥ 88 (CLAUDE.md, rule 3)
export const PRIMER_GAP = 16;
export const PRIMER_LETTER_COLUMNS = 8;
export const PRIMER_DIGIT_COLUMNS = 5;
/** Pitch of the hit boxes on a shelf: the piece plus the gap, so no tap falls between two. */
export const SHELF_HIT_WIDTH = SHELF_ITEM_WIDTH + SHELF_GAP;
export const FRUIT_SLOT = 96; // strawberry hit box, ≥ 88
export const FRUIT_GAP = 16;
export const MAX_FRUIT_SLOTS = 3; // more would not fit a 320 px bowl without overlapping

/** The counter above the product: indicators, never touched, so they may be smaller than 88. */
export const PILL_SIZE = 40;
export const PILL_GAP = 6;
export const MAX_PILLS = 5;
/** The pills sit above the product: y = product.y − PILL_OFFSET_Y. */
export const PILL_OFFSET_Y = 84;

/**
 * The order bubble above the customer (STEP-09). 480 px wide, not the 500 of the artboard: on a
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
/** Three pictures is what the card holds; STEP-12 uses two, the third arrives with Č3/P3. */
export const BUBBLE_MAX_ITEMS = 3;
/** The tail of the bubble, measured from the left edge of the card – it points at the customer. */
export const BUBBLE_TAIL_X = 110;
/** Height of the tail below the card; the drawing is that much taller than `bubble`. */
export const BUBBLE_TAIL_HEIGHT = 24;

/**
 * The star counter in the top right corner (návrh kap. 7). Since STEP-16 it is also the way into
 * the shop, so the whole pill answers a tap – see `starsHitSlot()`.
 */
export const STARS_PILL_WIDTH = 160;
export const STARS_PILL_HEIGHT = 64;
export const STARS_PILL_MARGIN = 16;
export const STAR_SIZE = 40;
/**
 * The inside of the pill, pinned here because 160 px hold these three things exactly once: the
 * star, the number and the basket that leads to the shop. `art/star.ts` draws to these numbers and
 * `starSlot()` aims the flying star at them, so the two can never drift apart.
 */
export const STARS_PILL_STAR = 36;
export const STARS_PILL_STAR_X = 12;
export const STARS_PILL_STAR_Y = 14;
export const STARS_PILL_NUMBER_CX = 78;
export const STARS_PILL_BASKET_X = 112;

/** Top edge of the digit shelf: where the counter's hit box has to stop (`starsHitSlot()`). */
export const SHELF_DIGITS_TOP = 84;

/** Five is what one row and a half hold; a second full row is STEP-25 (`MAX_COUNT`). */
export const MAX_COUNT_PIECES = 5;

/**
 * Where the parts of ONE product sit inside its 220×146 box – the numbers `cake.ts`,
 * `icecream.ts` and `pancakes.ts` were drawn to. Every coordinate is local to the box, so the
 * geometry says nothing about where on the counter the product stands.
 *
 * Whatever is counted goes in a front row of three with the rest tucked into its gaps, so all five
 * pieces stay countable – which is what Č1 rests on (návrh 5.1).
 */
/** Where the counted pieces go on a product that takes any. Local to its 220×146 box. */
export interface ProductCountGeometry {
  readonly pitch: number;
  readonly height: number;
  /** Width of one piece at `height`; the drawing is never stretched. */
  readonly width: number;
  /** Bottom edges of the two rows, measured from the top of the box. */
  readonly frontBottom: number;
  readonly backBottom: number;
  readonly frontMax: number;
}

export interface ProductGeometry {
  /** Centre of the top of the product, where everything is lined up from. */
  readonly topCenterX: number;
  /**
   * null for a product that arrives finished and takes no counted pieces – the ice cream (návrh
   * kap. 4). The generator will not put a counting item on such a product, and `Product.counts`
   * is what says so; this is the drawing side of the same fact.
   */
  readonly count: ProductCountGeometry | null;
  /** Local y where whatever stands on top touches down: the candle, the flag, the sign. */
  readonly topItemBottom: number;
  /** Local y of the centre of what leans against the front: the cookie, the wafer, the disc. */
  readonly frontItemCenterY: number;
  /** The piece that carries the letter, at the size it stands on the shelf. */
  readonly letterSize: { readonly width: number; readonly height: number };
  /** The same for the digit. */
  readonly digitSize: { readonly width: number; readonly height: number };
}

export const PRODUCT_GEOMETRY: Readonly<Record<ProductId, ProductGeometry>> = {
  cake: {
    topCenterX: 110,
    count: {
      pitch: 40,
      height: 44,
      width: fruitWidth(44),
      frontBottom: 22,
      backBottom: 10,
      frontMax: 3,
    },
    topItemBottom: 24,
    frontItemCenterY: 92,
    letterSize: { width: COOKIE_SIZE, height: COOKIE_SIZE },
    digitSize: { width: CANDLE_WIDTH, height: CANDLE_HEIGHT },
  },
  icecream: {
    topCenterX: 110,
    count: null,
    // Both carriers sit on the centre line, separated vertically the way the cake keeps its candle
    // above and its cookie below. The flag is planted in the top scoop; the wafer leans low on the
    // cone, where it hides some of the waffle but none of the scoops – those are what say "ice
    // cream" at a glance.
    topItemBottom: 30,
    frontItemCenterY: 96,
    letterSize: { width: WAFER_SIZE, height: WAFER_SIZE },
    digitSize: { width: FLAG_WIDTH, height: FLAG_HEIGHT },
  },
  pancakes: {
    topCenterX: 110,
    count: {
      pitch: 40,
      height: 44,
      width: fruitWidth(44),
      // The fruit lies on the TOP pancake, whose surface is at y = 22 (pancakes.ts); the cake
      // carries its own four pixels higher because its top is four pixels higher.
      frontBottom: 26,
      backBottom: 14,
      frontMax: 3,
    },
    // The stack is five pancakes tall for this: the sign stands on top, the chocolate disc leans
    // against the front face, and its top edge (96 ÷ 2 below 96, so y = 48) stays 22 px clear of
    // the fruit above. An order may ask for counting and a letter at once (návrh 5.3).
    topItemBottom: 26,
    frontItemCenterY: 96,
    letterSize: { width: CHOCOLATE_SIZE, height: CHOCOLATE_SIZE },
    digitSize: { width: SIGN_WIDTH, height: SIGN_HEIGHT },
  },
};

/** The box every product is drawn in; all three are the same size (cake, icecream, pancakes). */
export const PRODUCT_WIDTH = 220;
export const PRODUCT_HEIGHT = ICECREAM_HEIGHT;

/** The rim line of the bowl; everything below it is the bowl itself (see bowl.ts). */
export const BOWL_RIM_Y = 56;
export const LID_HEIGHT = 80;
/** The rim of the dome inside the lid box – it lands exactly on the rim of the bowl. */
export const LID_RIM_Y = 76;

export const COUNTER_TOP = 500; // top of the wooden worktop
export const COUNTER_EDGE_TOP = 546; // dark edge under the worktop
/** The bell on the worktop (STEP-10): 96 ≥ 88 of rule 3, 16 px clear of whatever stands next. */
export const BELL_SIZE = 96;
export const BELL_MARGIN = 16;
/**
 * How much bare counter the bell wants between itself and the customer before it will stand on the
 * left. Eight would satisfy the layout invariant, but a bell that close reads as glued to the
 * animal; below this it goes back to the right of the bowl instead.
 */
export const BELL_LEFT_CLEARANCE = 24;

export const COUNTER_FRONT_TOP = 560; // mint front with the doors
export const FLOOR_TOP = 692;

export interface KitchenLayout {
  /** Whoever is at the counter right now; every animal is drawn on the same box. */
  readonly customer: Rect;
  /** Whatever is being made right now; every product is drawn on the same box (STEP-17). */
  readonly product: Rect;
  readonly bowl: Rect;
  /** The whole shelf including the board; the slots sit on top of the board. */
  readonly shelfDigits: Rect;
  readonly shelfLetters: Rect;
  /** The order card above the customer; the same place whatever the stage width. */
  readonly bubble: Rect;
  /** The star counter, held against the right edge, above the digit shelf. */
  readonly stars: Rect;
  /**
   * The bell on the worktop. Left of the product wherever the stage is wide enough for it (from
   * about 1272 px, so a phone or a wide tablet in landscape); on a 4:3 screen there is nothing but
   * 12 px between the customer and the product, so it falls back to the right of the bowl.
   */
  readonly bell: Rect;
  /** The primer button stays available even while the shutter is down. */
  readonly primer: Rect;
}

/**
 * Where the bell stands. It belongs next to the product on the left, within easy reach of the hand
 * that is about to work in the middle of the counter – but on a 4:3 stage the customer and the
 * product are only 12 px apart, and the row of counting pills above it already sits exactly 8 px
 * from the letter shelf, so nothing can be shifted to make room. There it goes to the right of the
 * bowl instead. Either way it stands on the same line of the worktop as the bowl: bottom edges
 * match, so the two read as standing on the counter rather than floating over it.
 */
function bellRect(customer: Rect, product: Rect, bowl: Rect): Rect {
  const y = bowl.y + bowl.height - BELL_SIZE;
  const left = product.x - BELL_MARGIN - BELL_SIZE;
  const fitsLeft = left - (customer.x + customer.width) >= BELL_LEFT_CLEARANCE;
  const x = fitsLeft ? left : bowl.x + bowl.width + BELL_MARGIN;
  return { x, y, width: BELL_SIZE, height: BELL_SIZE };
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
  const product: Rect = {
    x: Math.round(width / 2) - 180,
    y: 384,
    width: PRODUCT_WIDTH,
    height: PRODUCT_HEIGHT,
  };
  const bowl: Rect = { x: product.x + 248, y: 400, width: 320, height: 140 };
  const customer: Rect = { x: 60, y: 200, width: 260, height: 320 };
  return {
    customer,
    product,
    bowl,
    shelfDigits: { x: width - 462, y: SHELF_DIGITS_TOP, width: 448, height: 128 },
    shelfLetters: { x: width - 462, y: 252, width: 448, height: 112 },
    bubble: { x: 60, y: 28, width: BUBBLE_WIDTH, height: BUBBLE_HEIGHT },
    bell: bellRect(customer, product, bowl),
    // 10 px above the digit shelf: the layout test guards 8 px between any two boxes, so moving
    // the counter (or making it taller) means checking that gap again.
    stars: {
      x: width - STARS_PILL_WIDTH - STARS_PILL_MARGIN,
      y: 10,
      width: STARS_PILL_WIDTH,
      height: STARS_PILL_HEIGHT,
    },
    primer: { x: 16, y: 656, width: PRIMER_TILE, height: PRIMER_TILE },
  };
}

export interface PrimerLayout {
  readonly letters: readonly Rect[];
  readonly digits: readonly Rect[];
  readonly back: Rect;
  /** Upper/lowercase switch, in the other lower corner from the back door. */
  readonly letterCase: Rect;
}

/** The primer's fixed board: rows are centred individually so the short last row stays balanced. */
export function primerLayout(stageWidth: number): PrimerLayout {
  const width = clampStageWidth(stageWidth);
  const row = (count: number, columns: number, y: number): Rect[] =>
    Array.from({ length: Math.ceil(count / columns) }, (_, rowIndex) => {
      const inRow = Math.min(columns, count - rowIndex * columns);
      return centeredRow(0, width, inRow, PRIMER_TILE, PRIMER_GAP).map((x) => ({
        x,
        y: y + rowIndex * (PRIMER_TILE + PRIMER_GAP),
        width: PRIMER_TILE,
        height: PRIMER_TILE,
      }));
    }).flat();
  return {
    letters: row(22, PRIMER_LETTER_COLUMNS, 96),
    digits: row(10, PRIMER_DIGIT_COLUMNS, 456),
    back: { x: 16, y: 656, width: PRIMER_TILE, height: PRIMER_TILE },
    letterCase: { x: width - 16 - PRIMER_TILE, y: 656, width: PRIMER_TILE, height: PRIMER_TILE },
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
 * Where the picked piece lands on the product: the candle STANDS on the cake and the flag on the
 * scoops, so both are placed by their bottom edge. Every size comes from the art module that draws
 * the piece (candle.ts, cookie.ts, icecream.ts), so a piece is exactly as big on the product as it
 * was on the shelf and the flight never has to rescale it. No import cycle: none of those modules
 * imports this one.
 */
export function productDigitSlot(box: Rect, product: ProductId): Rect {
  const geometry = PRODUCT_GEOMETRY[product];
  const { width, height } = geometry.digitSize;
  return {
    x: Math.round(box.x + geometry.topCenterX - width / 2),
    y: Math.round(box.y + geometry.topItemBottom - height),
    width,
    height,
  };
}

/** The cookie and the wafer LEAN against the front, centred – the letter stays big. */
export function productLetterSlot(box: Rect, product: ProductId): Rect {
  const geometry = PRODUCT_GEOMETRY[product];
  const { width, height } = geometry.letterSize;
  return {
    x: Math.round(box.x + geometry.topCenterX - width / 2),
    y: Math.round(box.y + geometry.frontItemCenterY - height / 2),
    width,
    height,
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

/** A slot is always `PRODUCT_GEOMETRY[product].countWidth` wide – a piece is never stretched. */
export interface CountSlot extends Rect {
  /** Back row – drawn under the front one (z-index 0 × 1). */
  readonly back: boolean;
}

function clampCount(count: number, max: number): number {
  const n = Math.floor(count);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0;
}

/**
 * Where a counted piece lands on the product, in the order it arrives: the first three into the
 * front row, the rest (at most two) into the back one. The front row is centred on the top of the
 * product; every back piece sits in a gap of the front row, so it peeks out between two front ones
 * and the child can still count all of them. Fruit on the cake, scoops on the ice cream – the same
 * arrangement with the numbers of `PRODUCT_GEOMETRY`.
 */
export function productCountSlots(box: Rect, product: ProductId, count: number): CountSlot[] {
  const geometry = PRODUCT_GEOMETRY[product].count;
  // Nothing is ever counted onto a finished product, so it has no slots to give.
  if (geometry === null) return [];
  const n = clampCount(count, MAX_COUNT_PIECES);
  const width = geometry.width;
  const center = box.x + PRODUCT_GEOMETRY[product].topCenterX;
  const frontCount = Math.min(n, geometry.frontMax);
  const frontCenters = Array.from(
    { length: frontCount },
    (_, index) => center + (index - (frontCount - 1) / 2) * geometry.pitch,
  );
  const backCenters = frontCenters
    .slice(1)
    .map((x, index) => (x + (frontCenters[index] ?? x)) / 2)
    .slice(0, n - frontCount);
  const slot = (cx: number, back: boolean): CountSlot => ({
    x: Math.round(cx - width / 2),
    y: box.y + (back ? geometry.backBottom : geometry.frontBottom) - geometry.height,
    width,
    height: geometry.height,
    back,
  });
  return [...frontCenters.map((cx) => slot(cx, false)), ...backCenters.map((cx) => slot(cx, true))];
}

/** The row of pills above the product, centred on it; `count` is clamped to 0…MAX_PILLS. */
export function pillSlots(box: Rect, count: number): Rect[] {
  const n = clampCount(count, MAX_PILLS);
  return centeredRow(box.x, box.width, n, PILL_SIZE, PILL_GAP).map((x) => ({
    x,
    y: box.y - PILL_OFFSET_Y,
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

/** Where the star flies to: the icon inside the counter, at the exact place the pill draws it. */
export function starSlot(stars: Rect): Rect {
  return {
    x: stars.x + STARS_PILL_STAR_X,
    y: stars.y + STARS_PILL_STAR_Y,
    width: STARS_PILL_STAR,
    height: STARS_PILL_STAR,
  };
}

/**
 * The target of the counter (STEP-16): the whole strip between the top of the stage and the digit
 * shelf, so the pill is a button without moving a pixel of the kitchen. 160×84 – a conscious
 * deviation from rule 3 (88 px), written down in `docs/steps/STEP-16-*.md`: the alternative was
 * pushing the digit shelf 16 px down, and the kitchen is not worth re-arranging for four pixels.
 *
 * Deliberately NOT part of `kitchenLayout()`: it ends exactly where the shelf begins, so the 8 px
 * invariant would fail on a box that steals no tap from anybody (the shelf has its own targets from
 * `shelfDigits.y` down).
 */
export function starsHitSlot(stars: Rect): Rect {
  return { x: stars.x, y: 0, width: stars.width, height: SHELF_DIGITS_TOP };
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

/**
 * The closed kitchen (STEP-14). Deliberately NOT part of `kitchenLayout()`: these boxes only ever
 * apply while everything else is behind the shutter, and a timer in the middle of the scene would
 * break the 8 px invariant the kitchen layout is held to (it would sit on the cake and the bowl).
 */
export const CLOCK_SIZE = 260;
/** Where the timer hangs on the shutter – high enough to clear the keypad. */
export const CLOCK_TOP = 150;
export const LOCK_SIZE = 96; // ≥ 88 (CLAUDE.md, rule 3)
export const LOCK_MARGIN = 16;
export const KEY_SIZE = 96; // ≥ 88
export const KEY_GAP = 12;
export const KEYPAD_PADDING = 24;
/** How many digits the code has; the row of dots at the top of the panel shows that many. */
export const CODE_LENGTH = 4;
export const CODE_HEIGHT = 48;
const CODE_GAP = 12;
const KEYPAD_COLUMNS = 3;
const KEYPAD_ROWS = 4;

export const KEYPAD_WIDTH =
  KEYPAD_COLUMNS * KEY_SIZE + (KEYPAD_COLUMNS - 1) * KEY_GAP + 2 * KEYPAD_PADDING;
export const KEYPAD_HEIGHT =
  2 * KEYPAD_PADDING +
  CODE_HEIGHT +
  CODE_GAP +
  KEYPAD_ROWS * KEY_SIZE +
  (KEYPAD_ROWS - 1) * KEY_GAP;

export interface ClosedLayout {
  /** The kitchen timer hanging on the shutter, centred on the stage. */
  readonly clock: Rect;
  /** The padlock in the bottom right corner – the way to the keypad. */
  readonly lock: Rect;
  /** The keypad panel; it opens over the middle of the stage and covers the timer on purpose. */
  readonly keypad: Rect;
}

/** Pure: stage width → the boxes of the closed kitchen. Clamps the width like `kitchenLayout()`. */
export function closedLayout(stageWidth: number): ClosedLayout {
  const width = clampStageWidth(stageWidth);
  return {
    clock: {
      x: Math.round((width - CLOCK_SIZE) / 2),
      y: CLOCK_TOP,
      width: CLOCK_SIZE,
      height: CLOCK_SIZE,
    },
    lock: {
      x: width - LOCK_MARGIN - LOCK_SIZE,
      y: STAGE_HEIGHT - LOCK_MARGIN - LOCK_SIZE,
      width: LOCK_SIZE,
      height: LOCK_SIZE,
    },
    keypad: {
      x: Math.round((width - KEYPAD_WIDTH) / 2),
      y: Math.round((STAGE_HEIGHT - KEYPAD_HEIGHT) / 2),
      width: KEYPAD_WIDTH,
      height: KEYPAD_HEIGHT,
    },
  };
}

/** The row of dots of the typed code, across the top of the panel. */
export function codeSlot(panel: Rect): Rect {
  return {
    x: panel.x + KEYPAD_PADDING,
    y: panel.y + KEYPAD_PADDING,
    width: panel.width - 2 * KEYPAD_PADDING,
    height: CODE_HEIGHT,
  };
}

/** The ten keys of the panel: 1–9 in three rows, 0 in the middle of the fourth. */
export function keypadKeys(panel: Rect): Rect[] {
  const left = panel.x + KEYPAD_PADDING;
  const top = panel.y + KEYPAD_PADDING + CODE_HEIGHT + CODE_GAP;
  const box = (column: number, row: number): Rect => ({
    x: left + column * (KEY_SIZE + KEY_GAP),
    y: top + row * (KEY_SIZE + KEY_GAP),
    width: KEY_SIZE,
    height: KEY_SIZE,
  });
  const digits = Array.from({ length: 9 }, (_, index) => box(index % 3, Math.floor(index / 3)));
  return [...digits, box(1, KEYPAD_ROWS - 1)];
}

/**
 * The shop (STEP-16), a scene of its own – the shelf with six things, their prices and the card
 * that asks before it takes any stars. Deliberately NOT part of `kitchenLayout()`: nothing here
 * ever stands in the kitchen, and the two scenes only share the star counter in the corner.
 */
export const GOOD_WIDTH = 180;
export const GOOD_PICTURE_HEIGHT = 140;
export const GOOD_PRICE_HEIGHT = 32;
export const GOOD_HEIGHT = GOOD_PICTURE_HEIGHT + GOOD_PRICE_HEIGHT;
export const GOOD_GAP = 36;
export const GOOD_COLUMNS = 3; // 3 columns × 2 rows = the six rows of the catalogue
export const PRICE_STAR = 26;
export const PRICE_STAR_GAP = 6;
/** The door back to the kitchen; it stands on the floor on the left (bottom edge = `FLOOR_TOP`). */
export const SHOP_DOOR: Rect = { x: 32, y: 412, width: 140, height: 280 };
export const CARD_WIDTH = 440;
export const CARD_HEIGHT = 420;
export const ANSWER_SIZE = 120; // the ✓ and the ✗, ≥ 88 (rule 3)
/** Top edges of the two rows of goods. */
const SHOP_ROWS = [150, 400];
/** How far the board sticks out past the row on each side, and how deep its brackets hang. */
const SHOP_BOARD_OVERHANG = 24;
const SHOP_BOARD_BRACKET = 28;
const CARD_PADDING = 24;
const ANSWER_MARGIN = 60;

export interface ShopLayout {
  /** The balance, in the same corner as in the kitchen; in the shop nobody taps it. */
  readonly stars: Rect;
  readonly door: Rect;
  /** The two boards, the top one first; each is `SHOP_BOARD_OVERHANG` wider than its row. */
  readonly boards: readonly Rect[];
  /**
   * Six cells (the picture with the price strip under it); the whole cell is the target. The order
   * is `SHOP_ITEMS` read by rows: 0–2 the top row left to right, 3–5 the bottom one.
   */
  readonly goods: readonly Rect[];
  /** The question card in the middle of the stage. */
  readonly card: Rect;
  readonly yes: Rect;
  readonly no: Rect;
}

/** Pure: stage width → the boxes of the shop. Clamps the width like `kitchenLayout()`. */
export function shopLayout(stageWidth: number): ShopLayout {
  const width = clampStageWidth(stageWidth);
  const columns = centeredRow(0, width, GOOD_COLUMNS, GOOD_WIDTH, GOOD_GAP);
  const rowWidth = GOOD_COLUMNS * GOOD_WIDTH + (GOOD_COLUMNS - 1) * GOOD_GAP;
  const left = columns[0] ?? 0;
  const card: Rect = {
    x: Math.round((width - CARD_WIDTH) / 2),
    y: Math.round((STAGE_HEIGHT - CARD_HEIGHT) / 2),
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  };
  const answerY = card.y + CARD_HEIGHT - CARD_PADDING - ANSWER_SIZE;
  return {
    stars: {
      x: width - STARS_PILL_WIDTH - STARS_PILL_MARGIN,
      y: 10,
      width: STARS_PILL_WIDTH,
      height: STARS_PILL_HEIGHT,
    },
    door: SHOP_DOOR,
    boards: SHOP_ROWS.map((top) => ({
      x: left - SHOP_BOARD_OVERHANG,
      y: top + GOOD_HEIGHT,
      width: rowWidth + 2 * SHOP_BOARD_OVERHANG,
      height: SHELF_BOARD + SHOP_BOARD_BRACKET,
    })),
    goods: SHOP_ROWS.flatMap((top) =>
      columns.map((x) => ({ x, y: top, width: GOOD_WIDTH, height: GOOD_HEIGHT })),
    ),
    card,
    yes: { x: card.x + ANSWER_MARGIN, y: answerY, width: ANSWER_SIZE, height: ANSWER_SIZE },
    no: {
      x: card.x + CARD_WIDTH - ANSWER_MARGIN - ANSWER_SIZE,
      y: answerY,
      width: ANSWER_SIZE,
      height: ANSWER_SIZE,
    },
  };
}

/** The top of the cell, where the thing itself is drawn. */
export function shopGoodPicture(cell: Rect): Rect {
  return { x: cell.x, y: cell.y, width: cell.width, height: GOOD_PICTURE_HEIGHT };
}

/**
 * The centred row of `count` (0…5) price stars in the strip under the picture – the same rule the
 * shelf slots follow. Five stars are 154 px wide, so even the dearest price fits a 180 px cell.
 */
export function shopPriceSlots(cell: Rect, count: number): Rect[] {
  const n = clampCount(count, 5);
  const y = cell.y + GOOD_PICTURE_HEIGHT + Math.round((GOOD_PRICE_HEIGHT - PRICE_STAR) / 2);
  return centeredRow(cell.x, cell.width, n, PRICE_STAR, PRICE_STAR_GAP).map((x) => ({
    x,
    y,
    width: PRICE_STAR,
    height: PRICE_STAR,
  }));
}

/**
 * The things bought in the shop (STEP-16, návrh 7.3a). Deliberately NOT part of `kitchenLayout()`
 * – for the same reason `closedLayout()` is outside it: the 8 px invariant guards the boxes of the
 * game itself, and these two are toys at the edge of the scene. `layout.test.ts` measures their
 * distance from every kitchen box, from the counting pills and from the candle on the cake
 * separately, so neither of them can ever get in the way of an order.
 *
 * The cat lies on the floor in the bottom right corner – the one part of the stage nothing else
 * uses – and the radio takes the place of the last door of the counter front.
 */
export const CAT_MARGIN_X = 32;
/** How far the cat stands off the bottom edge of the stage. */
export const CAT_MARGIN_Y = 8;
/** The drawing is 68 px tall; the target grows upwards to the 88 px of rule 3. */
const CAT_TARGET_HEIGHT = 88;

export interface DecorLayout {
  /** Where the cat is drawn: bottom right, on the floor. */
  readonly cat: Rect;
  /** Her target: the same box grown up to 88 px, over the front of the counter (rule 3). */
  readonly catTarget: Rect;
  /** The last door of the counter front; the radio stands in the opening and IS the target. */
  readonly radio: Rect;
}

/** Pure: stage width → the boxes of the bought things. Clamps the width like `kitchenLayout()`. */
export function decorLayout(stageWidth: number): DecorLayout {
  const width = clampStageWidth(stageWidth);
  const panels = counterPanels(width);
  const cat: Rect = {
    x: width - CAT_MARGIN_X - DECOR_CAT_WIDTH,
    y: STAGE_HEIGHT - CAT_MARGIN_Y - DECOR_CAT_HEIGHT,
    width: DECOR_CAT_WIDTH,
    height: DECOR_CAT_HEIGHT,
  };
  const radio = panels[panels.length - 1] ?? panels[0]!;
  return {
    cat,
    catTarget: {
      x: cat.x,
      y: cat.y + cat.height - CAT_TARGET_HEIGHT,
      width: cat.width,
      height: CAT_TARGET_HEIGHT,
    },
    radio,
  };
}
