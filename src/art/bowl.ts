/**
 * The bowl of fruit standing on the counter. Redrawn rather than scaled: the bowl on the design
 * canvas is 130×96 and this one is a much wider 320×140, because the whole bowl is one big tap
 * target (CLAUDE.md, rule 3; návrh 4 – "klepnutí na věc"). Drawing order is what makes the fruit
 * sit *in* the bowl: the far rim behind it, the near wall of the bowl in front of it. The kind
 * comes from the order (STEP-05), so the bowl always holds what the customer asked for.
 */
import type { FruitKind } from '../data/curriculum';
import { BOWL_RIM_Y, bowlFruitSpots } from './layout';
import { fruitGroup } from './fruit';
import { PALETTE, stroke, svg } from './svg';

export const BOWL_WIDTH = 320;
export const BOWL_HEIGHT = 140;

/** The inside of the bowl seen over the rim – drawn first, so the fruit stands in front of it. */
const backRim = `
  <path d="M6 ${BOWL_RIM_Y} A154 22 0 0 0 314 ${BOWL_RIM_Y} Z" fill="${PALETTE.mintLight}" ${stroke(4)}></path>
`;

const body = `
  <path d="M6 ${BOWL_RIM_Y} Q30 136 160 136 Q290 136 314 ${BOWL_RIM_Y} Z" fill="${PALETTE.mint}" ${stroke(4)}></path>
`;

export function fruitBowl(options?: {
  readonly kind?: FruitKind;
  readonly slots?: number;
}): string {
  const kind = options?.kind ?? 'strawberry';
  const spots = bowlFruitSpots(
    { x: 0, y: 0, width: BOWL_WIDTH, height: BOWL_HEIGHT },
    options?.slots,
  );
  const piece = (index: number): string => {
    const spot = spots[index];
    if (!spot) return '';
    return fruitGroup(kind, {
      cx: spot.cx,
      cy: spot.cy,
      height: spot.height,
      marker: spot.back ? 'back' : 'front',
      spot: index,
    });
  };
  const indexes = spots.map((_, index) => index);
  const back = indexes
    .filter((index) => spots[index]?.back)
    .map(piece)
    .join('');
  const front = indexes
    .filter((index) => !spots[index]?.back)
    .map(piece)
    .join('');
  return svg({
    viewBox: `0 0 ${BOWL_WIDTH} ${BOWL_HEIGHT}`,
    width: BOWL_WIDTH,
    height: BOWL_HEIGHT,
    children: `${backRim}${back}${front}${body}`,
  });
}
