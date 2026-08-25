/**
 * The reward (docs/navrh-hry.md ch. 7): one star for a finished order and the counter it flies
 * into. The number in the counter is learning content, not UI text – the child sees how many stars
 * they have the same way they see a digit on a candle (rule 1).
 */
import { STARS_PILL_HEIGHT, STARS_PILL_WIDTH, STAR_SIZE } from './layout';
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

const STAR_PATH = `M ${STAR_POINTS.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;

/** The star as a group, for composing into another drawing at (`x`, `y`) in a 40×40 slot. */
function starGroup(x: number, y: number): string {
  return (
    `<g transform="translate(${x} ${y})">` +
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

/** The counter: a white pill with the star and how many of them the child has collected. */
export function starsPill(count: number): string {
  const shown = Math.max(Math.round(count) || 0, 0);
  return svg({
    viewBox: `0 0 ${STARS_PILL_WIDTH} ${STARS_PILL_HEIGHT}`,
    width: STARS_PILL_WIDTH,
    height: STARS_PILL_HEIGHT,
    children: `
      <rect x="2" y="2" width="${STARS_PILL_WIDTH - 4}" height="${STARS_PILL_HEIGHT - 4}" rx="28"
            fill="${PALETTE.white}" ${stroke(4)}></rect>
      ${starGroup(16, (STARS_PILL_HEIGHT - STAR_SIZE) / 2)}
      ${centeredText({ cx: 108, cy: STARS_PILL_HEIGHT / 2, size: 34, content: String(shown) })}
    `,
  });
}
