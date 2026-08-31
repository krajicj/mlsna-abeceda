/**
 * The shop (docs/navrh-hry.md kap. 7): the shelf with what the catalogue sells, the price in full
 * and empty stars, the card that asks before any star is taken, and the door back to the kitchen.
 * Not a word anywhere – the price is stars to count and the answer is a big ✓ or ✗ (rule 1).
 *
 * The shelf has six places and keeps them while the catalogue is shorter: it fills up as things are
 * added. Sizes come from `art/layout.ts` and the pictures from the art modules that draw the same
 * things elsewhere: the frog exactly as she stands at the counter, the cat as she sleeps on the
 * floor, only smaller (`fitted()`).
 */
import { orderCheck } from './bubble';
import {
  radioSet,
  sleepingCat,
  DECOR_CAT_HEIGHT,
  DECOR_CAT_WIDTH,
  RADIO_HEIGHT,
  RADIO_WIDTH,
} from './decor';
import { customerArt, CUSTOMER_HEIGHT, CUSTOMER_WIDTH } from './customers';
import { fruit } from './fruit';
import { productBase } from './product';
import {
  ANSWER_SIZE,
  clampStageWidth,
  COUNTER_FRONT_TOP,
  FLOOR_TILE_HEIGHT,
  FLOOR_TILE_WIDTH,
  FLOOR_TOP,
  floorColumns,
  PRODUCT_HEIGHT,
  PRODUCT_WIDTH,
  SHELF_BOARD,
} from './layout';
import { STAR_PATH } from './star';
import { STAGE_HEIGHT } from '../stage/layout';
import { fitted, PALETTE, stroke, svg, type Rect } from './svg';
import type { ShopItem } from '../data/shop';

/** The floor of the shop, tiled exactly like the kitchen one: the same house, another room. */
function floor(width: number): string {
  const columns = floorColumns(width);
  const tiles = [0, 1]
    .map((row) =>
      Array.from({ length: columns }, (_, column) => {
        const fill = (column + row) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
        const x = column * FLOOR_TILE_WIDTH;
        const y = FLOOR_TOP + 4 + row * FLOOR_TILE_HEIGHT;
        return `<rect x="${x}" y="${y}" width="${FLOOR_TILE_WIDTH}" height="${FLOOR_TILE_HEIGHT}" fill="${fill}"></rect>`;
      }).join(''),
    )
    .join('');
  return `
    <rect x="0" y="${FLOOR_TOP}" width="${width}" height="${STAGE_HEIGHT - FLOOR_TOP}" fill="${PALETTE.floorB}"></rect>
    ${tiles}
    <path d="M0 ${FLOOR_TOP + 2} H${width}" ${stroke(4)}></path>
  `;
}

/** Wall, wainscot and floor – everything the shop never reacts to. */
export function shopBackdrop(stageWidth: number): string {
  const width = clampStageWidth(stageWidth);
  return svg({
    viewBox: `0 0 ${width} ${STAGE_HEIGHT}`,
    width,
    height: STAGE_HEIGHT,
    className: 'shop-backdrop-svg',
    children: `
      <rect x="0" y="${COUNTER_FRONT_TOP}" width="${width}" height="${FLOOR_TOP - COUNTER_FRONT_TOP}"
            fill="${PALETTE.mint}"></rect>
      <path d="M0 ${COUNTER_FRONT_TOP + 2} H${width}" ${stroke(4)}></path>
      ${floor(width)}
    `,
  });
}

/** A board of the shelf: the plank the things stand on and the two brackets under it. */
export function shopBoard(board: Rect): string {
  const right = board.width - 4;
  const bottom = board.height;
  return svg({
    viewBox: `0 0 ${board.width} ${board.height}`,
    width: board.width,
    height: board.height,
    children: `
      <path d="M34 ${SHELF_BOARD} L34 ${bottom - 2} L8 ${SHELF_BOARD} Z" fill="${PALETTE.woodDark}" ${stroke(3)}></path>
      <path d="M${right - 30} ${SHELF_BOARD} L${right - 30} ${bottom - 2} L${right - 4} ${SHELF_BOARD} Z"
            fill="${PALETTE.woodDark}" ${stroke(3)}></path>
      <rect x="0" y="0" width="${board.width}" height="${SHELF_BOARD}" rx="4" fill="${PALETTE.wood}" ${stroke(4)}></rect>
    `,
  });
}

/**
 * One star of a price. Full = the child has this one already, empty = it is still missing, and the
 * empty ones are what she counts to hear the same number the narrator says.
 */
export function priceStar(size: number, filled: boolean): string {
  return svg({
    viewBox: '0 0 40 40',
    width: size,
    height: size,
    children:
      `<path d="${STAR_PATH}" fill="${filled ? PALETTE.star : PALETTE.white}" ${stroke(4)}>` +
      `</path>`,
  });
}

/** Owned: the green tick the order bubble uses – one picture for "hotovo" in the whole game. */
export function boughtTick(size: number): string {
  return orderCheck(size);
}

/** The card that asks "chceš koupit …?": a plain rounded panel the question is laid out on. */
export function confirmCard(rect: Rect): string {
  return svg({
    viewBox: `0 0 ${rect.width} ${rect.height}`,
    width: rect.width,
    height: rect.height,
    children: `
      <rect x="4" y="4" width="${rect.width - 8}" height="${rect.height - 8}" rx="32"
            fill="${PALETTE.white}" ${stroke(4)}></rect>
      <rect x="18" y="18" width="${rect.width - 36}" height="${rect.height - 36}" rx="22"
            fill="none" stroke="${PALETTE.wallDot}" stroke-width="3"></rect>
    `,
  });
}

/** "Ano": a green disc with a white check, `ANSWER_SIZE` px across – far over the 88 of rule 3. */
export function yesButton(size: number = ANSWER_SIZE): string {
  return svg({
    viewBox: '0 0 120 120',
    width: size,
    height: size,
    children: `
      <circle cx="60" cy="60" r="54" fill="${PALETTE.leaf}" ${stroke(4)}></circle>
      <path d="M34 62 L52 80 L86 40" fill="none" stroke="${PALETTE.white}" stroke-width="14"
            stroke-linecap="round" stroke-linejoin="round"></path>
    `,
  });
}

/** "Ne": the same disc in red with a cross. Nothing is lost by it – the card simply closes. */
export function noButton(size: number = ANSWER_SIZE): string {
  return svg({
    viewBox: '0 0 120 120',
    width: size,
    height: size,
    children: `
      <circle cx="60" cy="60" r="54" fill="${PALETTE.cherryLight}" ${stroke(4)}></circle>
      <path d="M40 40 L80 80 M80 40 L40 80" fill="none" stroke="${PALETTE.white}" stroke-width="14"
            stroke-linecap="round"></path>
    `,
  });
}

/**
 * The door back to the kitchen. A cake in its window says where it leads – the child cannot read a
 * sign, but she knows what is baked on the other side.
 */
export function shopDoor(rect: Rect): string {
  return svg({
    viewBox: '0 0 140 280',
    width: rect.width,
    height: rect.height,
    children: `
      <rect x="4" y="4" width="132" height="274" rx="18" fill="${PALETTE.wood}" ${stroke(4)}></rect>
      <rect x="18" y="18" width="104" height="104" rx="12" fill="${PALETTE.mintLight}" ${stroke(4)}></rect>
      <path d="M44 92 H96 V66 Q70 56 44 66 Z" fill="${PALETTE.frosting}" ${stroke(3)}></path>
      <path d="M50 66 Q70 58 90 66" fill="none" stroke="${PALETTE.frostingLight}" stroke-width="4"></path>
      <circle cx="70" cy="48" r="8" fill="${PALETTE.strawberry}" ${stroke(3)}></circle>
      <rect x="18" y="140" width="104" height="120" rx="12" fill="${PALETTE.woodLight}" ${stroke(4)}></rect>
      <circle cx="34" cy="200" r="9" fill="${PALETTE.brass}" ${stroke(3)}></circle>
    `,
  });
}

/**
 * The picture of one thing on the shelf, already the size of `box`. Fruit takes a height of its own
 * (it always has), everything else is finished markup on a fixed box and goes through `fitted()`.
 * The switch is over `item.kind` and then over what the row unlocks, so a new row of the catalogue
 * without a picture does not compile instead of leaving an empty cell.
 */
export function shopGoodArt(item: ShopItem, box: Rect): string {
  switch (item.kind) {
    case 'fruit':
      return fruit(item.unlocks, box.height);
    case 'customer':
      return fitted(
        customerArt(item.unlocks),
        { width: CUSTOMER_WIDTH, height: CUSTOMER_HEIGHT },
        box,
      );
    case 'decoration':
      switch (item.unlocks) {
        case 'cat':
          return fitted(sleepingCat(), { width: DECOR_CAT_WIDTH, height: DECOR_CAT_HEIGHT }, box);
        case 'radio':
          return fitted(radioSet(), { width: RADIO_WIDTH, height: RADIO_HEIGHT }, box);
      }
    // The thing itself, empty – the ice cream on the shelf is the cone the kitchen will fill.
    case 'product':
      return fitted(
        productBase(item.unlocks),
        { width: PRODUCT_WIDTH, height: PRODUCT_HEIGHT },
        box,
      );
  }
}
