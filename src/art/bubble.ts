/**
 * The order bubble above the customer (docs/navrh-hry.md ch. 4): a card with a tail, a speaker icon
 * saying "tap me and I will say it again", and the tick that closes a finished item. What the child
 * sees inside are pictures only – the bubble never carries a sentence (rule 1). Sizes come from
 * `layout.ts`, which owns the geometry of the scene.
 */
import type { FruitKind } from '../data/curriculum';
import { fruitGroup } from './fruit';
import {
  BUBBLE_HEIGHT,
  BUBBLE_ITEM_HEIGHT,
  BUBBLE_ITEM_WIDTH,
  BUBBLE_TAIL_HEIGHT,
  BUBBLE_TAIL_X,
  BUBBLE_WIDTH,
} from './layout';
import { PALETTE, stroke, svg } from './svg';

/** The card plus its tail; the drawing is `BUBBLE_TAIL_HEIGHT` taller than the box of the card. */
export const BUBBLE_ART_HEIGHT = BUBBLE_HEIGHT + BUBBLE_TAIL_HEIGHT;

const RADIUS = 28;
/** Half the width of the tail where it meets the card. */
const TAIL_HALF = 20;

/** One closed outline for the card and the tail, so no stroke crosses the join. */
function cardPath(): string {
  const right = BUBBLE_WIDTH - 2;
  const bottom = BUBBLE_HEIGHT - 2;
  const tip = BUBBLE_ART_HEIGHT - 2;
  return (
    `M ${2 + RADIUS} 2 H ${right - RADIUS} A ${RADIUS} ${RADIUS} 0 0 1 ${right} ${2 + RADIUS}` +
    ` V ${bottom - RADIUS} A ${RADIUS} ${RADIUS} 0 0 1 ${right - RADIUS} ${bottom}` +
    ` H ${BUBBLE_TAIL_X + TAIL_HALF} L ${BUBBLE_TAIL_X} ${tip} L ${BUBBLE_TAIL_X - TAIL_HALF} ${bottom}` +
    ` H ${2 + RADIUS} A ${RADIUS} ${RADIUS} 0 0 1 2 ${bottom - RADIUS}` +
    ` V ${2 + RADIUS} A ${RADIUS} ${RADIUS} 0 0 1 ${2 + RADIUS} 2 Z`
  );
}

export function orderBubble(): string {
  return svg({
    viewBox: `0 0 ${BUBBLE_WIDTH} ${BUBBLE_ART_HEIGHT}`,
    width: BUBBLE_WIDTH,
    height: BUBBLE_ART_HEIGHT,
    children: `<path d="${cardPath()}" fill="${PALETTE.white}" ${stroke(4)}></path>`,
  });
}

/** The speaker on the left of the card: the picture way of saying "you can hear this again". */
export function speakerIcon(size: number): string {
  return svg({
    viewBox: '0 0 44 44',
    width: size,
    height: size,
    children: `
      <path d="M8 17 H15 L24 9 V35 L15 27 H8 Z" fill="${PALETTE.wood}" ${stroke(3.5)}></path>
      <path d="M30 15 Q35 22 30 29" fill="none" ${stroke(3.5)}></path>
      <path d="M36 10 Q43 22 36 34" fill="none" ${stroke(3.5)}></path>
    `,
  });
}

/** The tick over a finished picture: green disc, white check – the same read as the pill "done". */
export function orderCheck(size: number): string {
  return svg({
    viewBox: '0 0 48 48',
    width: size,
    height: size,
    children: `
      <circle cx="24" cy="24" r="20" fill="${PALETTE.leaf}" ${stroke(4)}></circle>
      <path d="M14 25 L21 32 L34 17" fill="none" stroke="${PALETTE.white}" stroke-width="6"
            stroke-linecap="round" stroke-linejoin="round"></path>
    `,
  });
}

/**
 * "Three strawberries" as a picture: up to five pieces in the box of one bubble item, three in the
 * front row and the rest tucked into its gaps – the same arrangement they end up in on the
 * product, so the child sees the same thing twice. `amount` is clamped to 1…5.
 */
export function bubbleFruit(kind: FruitKind, amount: number): string {
  const height = 44;
  const pitch = 36;
  const total = Math.min(Math.max(Math.round(amount) || 1, 1), 5);
  const front = Math.min(total, 3);
  const centerX = BUBBLE_ITEM_WIDTH / 2;
  // With no back row the front one is centred in the box; a second row pushes it down to make
  // room, exactly the way the two rows sit on the product.
  const frontY = total > 3 ? BUBBLE_ITEM_HEIGHT - 24 : BUBBLE_ITEM_HEIGHT / 2;
  const backY = frontY - 26;
  const frontCenters = Array.from(
    { length: front },
    (_, index) => centerX + (index - (front - 1) / 2) * pitch,
  );
  const backCenters = frontCenters
    .slice(1)
    .map((x, index) => (x + (frontCenters[index] ?? x)) / 2)
    .slice(0, total - front);
  const pieces = [
    ...backCenters.map((cx) => fruitGroup(kind, { cx, cy: backY, height })),
    ...frontCenters.map((cx) => fruitGroup(kind, { cx, cy: frontY, height })),
  ];
  return svg({
    viewBox: `0 0 ${BUBBLE_ITEM_WIDTH} ${BUBBLE_ITEM_HEIGHT}`,
    width: BUBBLE_ITEM_WIDTH,
    height: BUBBLE_ITEM_HEIGHT,
    children: pieces.join(''),
  });
}
