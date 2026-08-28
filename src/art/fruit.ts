/**
 * The fruit the kitchen counts (docs/navrh-hry.md ch. 5.6). The strawberry is the `strawberry`
 * group of the design canvas; the blueberry and the cherry are not on the canvas and were drawn
 * for STEP-05 in the same key, the raspberry for STEP-15 (it is bought in the shop). All of them
 * share one drawing box, so the bowl, the cake and the flight animation can swap them without
 * moving anything.
 */
import type { FruitKind } from '../data/curriculum';
import { PALETTE, stroke, svg } from './svg';

/** Local drawing box of every kind: x 0…40, y −6…46 (the stem sticks out above the fruit). */
export const FRUIT_VIEW_BOX = '0 -6 40 52';
const BOX_WIDTH = 40;
const BOX_HEIGHT = 52;
/** Centre of the drawing box, for placing a scaled fruit at a point. */
const CENTER_X = 20;
const CENTER_Y = 20;

const strawberry = `
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

const blueberry = `
  <circle cx="20" cy="25" r="16" fill="${PALETTE.blueberry}" ${stroke(4)}></circle>
  <circle cx="20" cy="13" r="6" fill="${PALETTE.blueberryDark}" ${stroke(3)}></circle>
  <path d="M20 8 V18 M15.5 10.5 L24.5 15.5 M24.5 10.5 L15.5 15.5" fill="none" ${stroke(2)}></path>
  <ellipse cx="13" cy="20" rx="4.5" ry="3" transform="rotate(-25 13 20)" fill="${PALETTE.blueberryLight}"></ellipse>
`;

const cherry = `
  <path d="M20 12 Q27 0 35 -3" fill="none" stroke="${PALETTE.stem}" stroke-width="3.5" stroke-linecap="round"></path>
  <ellipse cx="30" cy="2" rx="7.5" ry="3.5" transform="rotate(-22 30 2)" fill="${PALETTE.leaf}" ${stroke(2.5)}></ellipse>
  <circle cx="20" cy="27" r="16" fill="${PALETTE.cherry}" ${stroke(4)}></circle>
  <ellipse cx="13.5" cy="22" rx="4.5" ry="3" transform="rotate(-25 13.5 22)" fill="${PALETTE.cherryLight}"></ellipse>
`;

/**
 * A cluster of drupelets, not a smooth berry: the raspberry has to stay apart from the strawberry
 * at the size of a piece in the bowl (44 px), and pink alone would not do it – the bumps carry it.
 */
const raspberry = `
  <ellipse cx="13" cy="4" rx="7.5" ry="3.5" transform="rotate(-25 13 4)" fill="${PALETTE.leaf}" ${stroke(2.5)}></ellipse>
  <ellipse cx="27" cy="4" rx="7.5" ry="3.5" transform="rotate(25 27 4)" fill="${PALETTE.leaf}" ${stroke(2.5)}></ellipse>
  <path d="M20 44 C8 38 3 29 3 21 C3 12 11 7 20 7 C29 7 37 12 37 21 C37 29 32 38 20 44 Z" fill="${PALETTE.raspberry}" ${stroke(3.5)}></path>
  <g fill="${PALETTE.raspberry}" ${stroke(2)}>
    <circle cx="12" cy="16" r="5.5"></circle>
    <circle cx="20" cy="13" r="5.5"></circle>
    <circle cx="28" cy="16" r="5.5"></circle>
    <circle cx="11" cy="26" r="5.5"></circle>
    <circle cx="20" cy="24" r="5.5"></circle>
    <circle cx="29" cy="26" r="5.5"></circle>
    <circle cx="15" cy="35" r="5"></circle>
    <circle cx="25" cy="35" r="5"></circle>
  </g>
  <circle cx="12" cy="16" r="2" fill="${PALETTE.raspberryLight}"></circle>
  <circle cx="20" cy="13" r="2" fill="${PALETTE.raspberryLight}"></circle>
`;

const SHAPES: Readonly<Record<FruitKind, string>> = { strawberry, blueberry, cherry, raspberry };

/** Width of a fruit of the given height – the drawing is never stretched. */
export function fruitWidth(height: number): number {
  return Math.round((height * BOX_WIDTH) / BOX_HEIGHT);
}

/** A standalone fruit `height` logical pixels tall. */
export function fruit(kind: FruitKind, height: number): string {
  return svg({
    viewBox: FRUIT_VIEW_BOX,
    width: fruitWidth(height),
    height,
    children: SHAPES[kind],
  });
}

/**
 * The same fruit as a group, for composing inside another drawing: `height` tall, its box centred
 * on (`cx`, `cy`). `marker` ends up as `data-fruit`, which the tests count. The inner group carries
 * no transform of its own, so a scene can animate it (the bounce in the bowl) without disturbing
 * the placement.
 */
export function fruitGroup(
  kind: FruitKind,
  options: {
    readonly cx: number;
    readonly cy: number;
    readonly height: number;
    readonly marker?: string;
    /** `data-spot`: which piece of the bowl this is, so a tap can bounce exactly that one. */
    readonly spot?: number;
  },
): string {
  const scale = Math.round((options.height / BOX_HEIGHT) * 1000) / 1000;
  const x = Math.round((options.cx - CENTER_X * scale) * 10) / 10;
  const y = Math.round((options.cy - CENTER_Y * scale) * 10) / 10;
  const marker = options.marker ? ` data-fruit="${options.marker}"` : '';
  const spot = options.spot === undefined ? '' : ` data-spot="${options.spot}"`;
  return (
    `<g${marker}${spot} transform="translate(${x} ${y}) scale(${scale})">` +
    `<g class="art-fruit-body">${SHAPES[kind]}</g></g>`
  );
}
