/**
 * Kitchen geometry in logical stage pixels (height is always 768, width 1024–1366). Pure and
 * DOM-free on purpose: the scene positions its boxes from here, and STEP-05/06 read the same
 * numbers to animate a strawberry from the bowl onto the cake or to fill the shelves.
 */
import { STAGE_MAX_WIDTH, STAGE_MIN_WIDTH } from '../stage/layout';
import type { Rect } from './svg';

export const SHELF_ITEM_WIDTH = 96; // ≥ 88 (CLAUDE.md, rule 3)
export const SHELF_GAP = 16;
export const SHELF_BOARD = 16; // the board itself: the bottom strip of the shelf rect
export const MAX_CHOICES = 4;
export const FRUIT_SLOT = 96; // strawberry hit box, ≥ 88
export const FRUIT_GAP = 16;
export const MAX_FRUIT_SLOTS = 3; // more would not fit a 320 px bowl without overlapping

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
