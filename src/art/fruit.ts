/**
 * The strawberry – the `strawberry` group of the design canvas, unchanged in shape and only ever
 * scaled uniformly. The bowl uses it now, the cake will use the same drawing in STEP-05.
 */
import { PALETTE, stroke, svg } from './svg';

/** Local drawing box: x 0…40, y −6…46 (the stem sticks out above the berry). */
export const STRAWBERRY_VIEW_BOX = '0 -6 40 52';
const BOX_WIDTH = 40;
const BOX_HEIGHT = 52;
/** Centre of the drawing box, for placing a scaled berry at a point. */
const CENTER_X = 20;
const CENTER_Y = 20;

const shapes = `
  <path d="M20 4 V-2" fill="none" stroke="${PALETTE.stem}" stroke-width="3" stroke-linecap="round"></path>
  <path d="M20 42 C9 37 2 27 2 17 C2 8 10 3 20 3 C30 3 38 8 38 17 C38 27 31 37 20 42 Z" fill="${PALETTE.strawberry}" ${stroke(3)}></path>
  <circle cx="13" cy="17" r="1.8" fill="${PALETTE.seed}"></circle>
  <circle cx="22" cy="13" r="1.8" fill="${PALETTE.seed}"></circle>
  <circle cx="27" cy="22" r="1.8" fill="${PALETTE.seed}"></circle>
  <circle cx="16" cy="27" r="1.8" fill="${PALETTE.seed}"></circle>
  <circle cx="24" cy="32" r="1.8" fill="${PALETTE.seed}"></circle>
  <ellipse cx="13" cy="5" rx="8" ry="4" transform="rotate(-28 13 5)" fill="${PALETTE.leaf}" ${stroke(2.5)}></ellipse>
  <ellipse cx="27" cy="5" rx="8" ry="4" transform="rotate(28 27 5)" fill="${PALETTE.leaf}" ${stroke(2.5)}></ellipse>
`;

/** Width of a berry of the given height – the drawing is never stretched. */
export function strawberryWidth(height: number): number {
  return Math.round((height * BOX_WIDTH) / BOX_HEIGHT);
}

/** A standalone berry `height` logical pixels tall. */
export function strawberry(height: number): string {
  return svg({
    viewBox: STRAWBERRY_VIEW_BOX,
    width: strawberryWidth(height),
    height,
    children: shapes,
  });
}

/**
 * The same berry as a group, for composing inside another drawing: `height` tall, its box centred
 * on (`cx`, `cy`). `marker` ends up as `data-fruit`, which the tests count.
 */
export function strawberryGroup(options: {
  readonly cx: number;
  readonly cy: number;
  readonly height: number;
  readonly marker?: string;
}): string {
  const scale = Math.round((options.height / BOX_HEIGHT) * 1000) / 1000;
  const x = Math.round((options.cx - CENTER_X * scale) * 10) / 10;
  const y = Math.round((options.cy - CENTER_Y * scale) * 10) / 10;
  const marker = options.marker ? ` data-fruit="${options.marker}"` : '';
  return `<g${marker} transform="translate(${x} ${y}) scale(${scale})">${shapes}</g>`;
}
