/**
 * The reward (docs/navrh-hry.md ch. 7): one star for a finished order and the counter it flies
 * into. The number in the counter is learning content, not UI text – the child sees how many stars
 * they have the same way they see a digit on a candle (rule 1).
 */
import { basketGroup } from './basket';
import {
  STARS_PILL_BASKET_X,
  STARS_PILL_HEIGHT,
  STARS_PILL_NUMBER_CX,
  STARS_PILL_STAR,
  STARS_PILL_STAR_X,
  STARS_PILL_STAR_Y,
  STARS_PILL_WIDTH,
  STAR_SIZE,
} from './layout';
import { centeredText, PALETTE, stroke, svg } from './svg';

/** Five points, outer radius 18, inner 7.6, inside a 40×40 box with room for the outline. */
const STAR_POINTS = [
  [20, 2],
  [24.5, 13.9],
  [37.1, 14.4],
  [27.2, 22.3],
  [30.6, 34.6],
  [20, 27.6],
  [9.4, 34.6],
  [12.8, 22.3],
  [2.9, 14.4],
  [15.5, 13.9],
] as const;

/** The outline itself, in a 40×40 box – the price stars of the shop draw with it too. */
export const STAR_PATH = `M ${STAR_POINTS.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;

/** The star as a group, for composing into another drawing at (`x`, `y`), `size` px across. */
function starGroup(x: number, y: number, size: number = STAR_SIZE): string {
  const scale = Math.round((size / STAR_SIZE) * 1000) / 1000;
  return (
    `<g transform="translate(${x} ${y}) scale(${scale})">` +
    `<path d="${STAR_PATH}" fill="${PALETTE.star}" ${stroke(4)}></path></g>`
  );
}

export function star(size: number = STAR_SIZE): string {
  return svg({
    viewBox: '0 0 40 40',
    width: size,
    height: size,
    children: `<path d="${STAR_PATH}" fill="${PALETTE.star}" ${stroke(4)}></path>`,
  });
}

/**
 * The counter: a white pill with the star, how many of them the child has collected, and – in the
 * kitchen – the basket that leads to the shop (STEP-16). `'none'` is how the shop itself draws the
 * pill: a basket there would promise a way into the shop the child is already standing in.
 *
 * The drawing is the same size in all three states and the number stays on `STARS_PILL_NUMBER_CX`,
 * so waking the basket up never moves anything. A three-digit balance gets a smaller number rather
 * than a wider pill – the kitchen around it does not move for a counter (STEP-16 decision).
 */
export function starsPill(
  count: number,
  options?: { readonly basket?: 'none' | 'asleep' | 'ready' },
): string {
  const shown = Math.max(Math.round(count) || 0, 0);
  const label = String(shown);
  const mode = options?.basket ?? 'none';
  return svg({
    viewBox: `0 0 ${STARS_PILL_WIDTH} ${STARS_PILL_HEIGHT}`,
    width: STARS_PILL_WIDTH,
    height: STARS_PILL_HEIGHT,
    children: `
      <rect x="2" y="2" width="${STARS_PILL_WIDTH - 4}" height="${STARS_PILL_HEIGHT - 4}" rx="28"
            fill="${PALETTE.white}" ${stroke(4)}></rect>
      ${starGroup(STARS_PILL_STAR_X, STARS_PILL_STAR_Y, STARS_PILL_STAR)}
      ${centeredText({
        cx: STARS_PILL_NUMBER_CX,
        cy: STARS_PILL_HEIGHT / 2,
        size: label.length >= 3 ? 24 : 30,
        content: label,
      })}
      ${
        mode === 'none'
          ? ''
          : basketGroup(STARS_PILL_BASKET_X, STARS_PILL_STAR_Y, STARS_PILL_STAR, {
              dim: mode === 'asleep',
            })
      }
    `,
  });
}
