/**
 * The pancakes (docs/navrh-hry.md kap. 4, STEP-18): the third thing the kitchen can make, bought in
 * the shop. Unlike the ice cream they are COUNTED onto – fruit lands on the top pancake – so the
 * stack has to be tall: the letter carrier leans against its front, and the two must never touch
 * (an order may ask for counting and a letter at once, návrh 5.3). Five pancakes put the top
 * surface at y = 22 and leave the whole front face free down to the plate.
 *
 * Everything fits INSIDE the 220×146 box of `kitchenLayout`, like the other two products, and this
 * module imports nothing but the palette: `layout.ts` reads the sizes below, so an import back
 * would close a cycle.
 */
import { centeredText, PALETTE, stroke, svg } from './svg';

export const PANCAKES_WIDTH = 220;
export const PANCAKES_HEIGHT = 146;
export const PANCAKES_VIEW_BOX = `0 0 ${PANCAKES_WIDTH} ${PANCAKES_HEIGHT}`;

/**
 * The chocolate disc with a letter: the same cell as the gingerbread cookie and the wafer, ≥ 88
 * (CLAUDE.md, rule 3). It is a circle the same size as the cookie, so three things keep the two
 * apart at a glance – dark chocolate instead of pale dough, a scalloped rim instead of a smooth
 * circle, and the gloss in the top left corner (STEP-18, decision 2).
 */
export const CHOCOLATE_SIZE = 96;
/** The little standing sign with a digit; the same box as the candle and the flag. */
export const SIGN_WIDTH = 96;
export const SIGN_HEIGHT = 112;

/** Pancakes from the top down: their centre line and how wide each one turned out in the pan. */
const STACK: readonly { readonly cy: number; readonly rx: number }[] = [
  { cy: 22, rx: 62 },
  { cy: 42, rx: 65 },
  { cy: 62, rx: 63 },
  { cy: 82, rx: 66 },
  { cy: 102, rx: 64 },
];
/** How thick one pancake is: the straight side between its top and bottom rim. */
const PANCAKE_BODY = 16;
const PANCAKE_RY = 11;

/**
 * One pancake as a flat cylinder: down the left side, round the front rim, up the right side and
 * back over the top. Both arcs are drawn in the negative direction (sweep 0), which with y running
 * down the screen is the one that bulges away from the body.
 */
function pancake(cy: number, rx: number): string {
  const left = 110 - rx;
  const right = 110 + rx;
  const bottom = cy + PANCAKE_BODY;
  return (
    `<path d="M${left} ${cy} L${left} ${bottom} A${rx} ${PANCAKE_RY} 0 0 0 ${right} ${bottom}` +
    ` L${right} ${cy} A${rx} ${PANCAKE_RY} 0 0 0 ${left} ${cy} Z"` +
    ` fill="${PALETTE.pancake}" ${stroke(4)}></path>`
  );
}

/**
 * The stack on its plate. The top surface is at y = 22 (that is where the counted fruit and the
 * sign stand), the bottom pancake ends at y = 118, and the plate is the one the cake and the ice
 * cream stand on, so all three products rest on the same line of the counter.
 */
export function pancakesBase(): string {
  return svg({
    viewBox: PANCAKES_VIEW_BOX,
    width: PANCAKES_WIDTH,
    height: PANCAKES_HEIGHT,
    children: `
      <ellipse cx="110" cy="130" rx="76" ry="13" fill="${PALETTE.plate}" ${stroke(4)}></ellipse>
      <ellipse cx="110" cy="130" rx="52" ry="7" fill="none" stroke="${PALETTE.plateShade}" stroke-width="3"></ellipse>
      ${[...STACK]
        .reverse()
        .map((layer) => pancake(layer.cy, layer.rx))
        .join('')}
      <ellipse cx="110" cy="22" rx="44" ry="7" fill="none" stroke="${PALETTE.pancakeDark}" stroke-width="3"></ellipse>
    `,
  });
}

/**
 * The syrup that runs over the finished pancakes (STEP-18, the counterpart of `cakeGlaze()`). It
 * pours over the front rim of the TOP pancake and drips down the stack; the middle of the top stays
 * clear, otherwise it would hide the fruit, the disc and the sign that stand there and the counted
 * pieces could not be counted again. Same box as `pancakesBase()`, so the finale lays it on the
 * very same rect.
 */
export function pancakesTopping(): string {
  return svg({
    viewBox: PANCAKES_VIEW_BOX,
    width: PANCAKES_WIDTH,
    height: PANCAKES_HEIGHT,
    children: `
      <path d="M48 22 A62 11 0 0 0 172 22 L172 30
               Q164 48 154 34 Q146 54 136 36 Q126 50 116 36 Q108 56 98 38
               Q88 52 78 34 Q68 54 58 32 Q53 42 48 28 Z"
            fill="${PALETTE.chocolate}" ${stroke(4)}></path>
      <ellipse cx="86" cy="26" rx="10" ry="4" transform="rotate(-14 86 26)"
               fill="${PALETTE.chocolateLight}"></ellipse>
    `,
  });
}

/** How many bumps the rim of the disc has, and how far each one bulges out of the circle. */
const RIM_BUMPS = 10;
const RIM_RADIUS = 36;
const RIM_BUMP = 13;

/** The scalloped rim: `RIM_BUMPS` points on a circle joined by little arcs that bulge outwards. */
function chocolateRim(): string {
  const point = (index: number): string => {
    const angle = (index / RIM_BUMPS) * Math.PI * 2;
    const x = 48 + RIM_RADIUS * Math.cos(angle);
    const y = 48 + RIM_RADIUS * Math.sin(angle);
    return `${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`;
  };
  let d = `M${point(0)}`;
  for (let index = 1; index <= RIM_BUMPS; index += 1) {
    d += ` A${RIM_BUMP} ${RIM_BUMP} 0 0 1 ${point(index)}`;
  }
  return `${d} Z`;
}

/**
 * The chocolate disc with a letter. Without one it is just "a piece of chocolate" – that is what
 * the order bubble shows, so which letter is wanted has to be heard rather than matched (návrh
 * 5.4). No `<circle>` anywhere in it: the rim is a path, and that is what an art test checks,
 * because the cookie is a circle of the same size.
 */
export function chocolateLetter(letter = ''): string {
  return svg({
    viewBox: `0 0 ${CHOCOLATE_SIZE} ${CHOCOLATE_SIZE}`,
    width: CHOCOLATE_SIZE,
    height: CHOCOLATE_SIZE,
    children: `
      <path d="${chocolateRim()}" fill="${PALETTE.chocolate}" ${stroke(4)}></path>
      <ellipse cx="33" cy="30" rx="11" ry="6" transform="rotate(-30 33 30)"
               fill="${PALETTE.chocolateLight}"></ellipse>
      ${letter === '' ? '' : centeredText({ cx: 48, cy: 48, size: 50, content: letter, fill: PALETTE.white })}
    `,
  });
}

/**
 * The little sign with a digit, the kind that stands beside a cake in a confectioner's window. It
 * stands on TWO legs, which is what keeps it from reading as the ice cream's flag – that one is a
 * triangular pennant on a single stick. Blank in the bubble.
 */
export function sign(digit = ''): string {
  return svg({
    viewBox: `0 0 ${SIGN_WIDTH} ${SIGN_HEIGHT}`,
    width: SIGN_WIDTH,
    height: SIGN_HEIGHT,
    children: `
      <rect x="24" y="58" width="9" height="50" rx="4" fill="${PALETTE.wood}" ${stroke(3)}
            transform="rotate(-10 28 83)"></rect>
      <rect x="63" y="58" width="9" height="50" rx="4" fill="${PALETTE.wood}" ${stroke(3)}
            transform="rotate(10 68 83)"></rect>
      <rect x="6" y="8" width="84" height="56" rx="12" fill="${PALETTE.mintLight}" ${stroke(4)}></rect>
      <rect x="14" y="16" width="68" height="40" rx="8" fill="none" stroke="${PALETTE.mint}" stroke-width="3"></rect>
      ${digit === '' ? '' : centeredText({ cx: 48, cy: 36, size: 36, content: digit })}
    `,
  });
}
