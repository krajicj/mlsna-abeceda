/**
 * The bowl of strawberries standing on the counter. Redrawn rather than scaled: the bowl on the
 * design canvas is 130×96 and this one is a much wider 320×140, because every berry needs a
 * 96×96 hit box (CLAUDE.md, rule 3). The berries are drawn first and the bowl over them, so they
 * sit *in* the bowl; only the front row is ever tapped (STEP-05).
 */
import { fruitSlots, MAX_FRUIT_SLOTS } from './layout';
import { strawberryGroup } from './fruit';
import { PALETTE, stroke, svg } from './svg';

export const BOWL_WIDTH = 320;
export const BOWL_HEIGHT = 140;
const FRONT_FRUIT_HEIGHT = 88;
const BACK_FRUIT_HEIGHT = 72;
/** The rim line; everything below it is the bowl, so the berries are half hidden behind it. */
const RIM_Y = 56;

const body = `
  <path d="M6 ${RIM_Y} Q30 136 160 136 Q290 136 314 ${RIM_Y} Z" fill="${PALETTE.mint}" ${stroke(4)}></path>
  <path d="M6 ${RIM_Y} A154 22 0 0 0 314 ${RIM_Y}" fill="none" ${stroke(4)}></path>
`;

/** Centres of the front berries – the same slots the scene turns into hit boxes. */
function frontCenters(slots: number): number[] {
  return fruitSlots({ x: 0, y: 0, width: BOWL_WIDTH, height: BOWL_HEIGHT }, slots).map(
    (slot) => slot.x + slot.width / 2,
  );
}

export function fruitBowl(options?: { readonly slots?: number }): string {
  const centers = frontCenters(options?.slots ?? MAX_FRUIT_SLOTS);
  // Decoration only: one smaller berry tucked in between every pair of the front ones.
  const back = centers
    .slice(1)
    .map((center, index) =>
      strawberryGroup({
        cx: (center + (centers[index] ?? center)) / 2,
        cy: 48,
        height: BACK_FRUIT_HEIGHT,
        marker: 'back',
      }),
    )
    .join('');
  const front = centers
    .map((cx) => strawberryGroup({ cx, cy: 48, height: FRONT_FRUIT_HEIGHT, marker: 'front' }))
    .join('');
  return svg({
    viewBox: `0 0 ${BOWL_WIDTH} ${BOWL_HEIGHT}`,
    width: BOWL_WIDTH,
    height: BOWL_HEIGHT,
    children: `${back}${front}${body}`,
  });
}
