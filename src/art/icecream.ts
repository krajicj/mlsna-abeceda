/**
 * The ice cream (docs/navrh-hry.md kap. 4, STEP-17): the second thing the kitchen can make, bought
 * in the shop. It arrives FINISHED – a cone with three scoops already on it – and the child only
 * adds the wafer with the letter or the flag with the digit. Nothing is ever counted onto it: the
 * child taps a bowl of strawberries, and a scoop of ice cream flying out of that bowl is the one
 * place in the game where what is tapped is not what arrives.
 *
 * The whole drawing therefore fits INSIDE the 220×146 box of `kitchenLayout` (the cake's fruit may
 * stick out above its box because it is a separate element; these scoops are part of the picture).
 * It imports nothing but the palette: `layout.ts` reads the sizes below, so an import back would
 * close a cycle.
 */
import { centeredText, PALETTE, stroke, svg } from './svg';

export const ICECREAM_WIDTH = 220;
export const ICECREAM_HEIGHT = 146;
export const ICECREAM_VIEW_BOX = `0 0 ${ICECREAM_WIDTH} ${ICECREAM_HEIGHT}`;

/** The wafer with a letter: a rounded square, so it is never mistaken for a gingerbread circle. */
export const WAFER_SIZE = 96; // ≥ 88 (CLAUDE.md, rule 3), the same cell as the cookie
/** The flag with a digit; the same box as the candle, so both shelves keep one set of slots. */
export const FLAG_WIDTH = 96;
export const FLAG_HEIGHT = 112;

/**
 * One scoop: a dome with a wavy lower edge, `width` × `height`, centred on (`cx`, `cy`). Three of
 * them make the pile, and the flavours are fixed – nobody is ever asked which one is which, so
 * they are picked to sit apart at a glance rather than to mean anything (návrh kap. 4).
 */
function scoop(cx: number, cy: number, fill: string): string {
  return (
    `<g transform="translate(${cx - 31} ${cy - 22})">` +
    `<path d="M4 28 C4 12 14 3 26 3 C38 3 48 12 48 28` +
    ` C43 33 41 27 35 31 C29 35 25 29 19 33 C13 37 9 33 4 28 Z"` +
    ` transform="scale(1.192 0.955)" fill="${fill}" ${stroke(3)}></path>` +
    `<ellipse cx="21" cy="13" rx="8" ry="5" transform="rotate(-28 21 13)"` +
    ` fill="${PALETTE.white}" opacity="0.4"></ellipse></g>`
  );
}

/**
 * The finished ice cream on its plate: a cone with its mouth at y = 50, two scoops sitting in it
 * and a third on top. The plate is the one the cake stands on, so both products rest on the same
 * line of the counter.
 */
export function iceCreamBase(): string {
  return svg({
    viewBox: ICECREAM_VIEW_BOX,
    width: ICECREAM_WIDTH,
    height: ICECREAM_HEIGHT,
    children: `
      <ellipse cx="110" cy="132" rx="74" ry="14" fill="${PALETTE.plate}" ${stroke(4)}></ellipse>
      <ellipse cx="110" cy="132" rx="52" ry="8" fill="none" stroke="${PALETTE.plateShade}" stroke-width="3"></ellipse>
      <path d="M40 50 L110 128 L180 50 Z" fill="${PALETTE.dough}" ${stroke(4)}></path>
      <!-- Every waffle line runs from one slanted edge to the other; the cone is convex, so no
           segment can leave it and no clip path is needed (ids would collide across instances). -->
      <path d="M47 58 L145 96 M68 81 L124 119 M173 58 L75 96 M152 81 L96 119"
            fill="none" stroke="${PALETTE.doughLight}" stroke-width="3" stroke-linecap="round"></path>
      <ellipse cx="110" cy="50" rx="70" ry="12" fill="${PALETTE.doughLight}" ${stroke(4)}></ellipse>
      ${scoop(110, 22, PALETTE.spongeLight)}
      ${scoop(78, 40, PALETTE.strawberry)}
      ${scoop(142, 40, PALETTE.frosting)}
    `,
  });
}

/**
 * The sauce that runs over the finished ice cream (STEP-17, the counterpart of `cakeGlaze()`). It
 * pours over the top scoop and runs down between the two below it, and the same box as
 * `iceCreamBase()` holds it, so the finale lays it on the very same rect.
 */
export function iceCreamTopping(): string {
  return svg({
    viewBox: ICECREAM_VIEW_BOX,
    width: ICECREAM_WIDTH,
    height: ICECREAM_HEIGHT,
    children: `
      <path d="M80 12 C80 2 93 -4 110 -4 C127 -4 140 2 140 12
               C140 24 132 30 132 42 Q124 62 116 44 Q110 66 104 44 Q96 62 88 42
               C88 30 80 24 80 12 Z"
            fill="${PALETTE.cherry}" ${stroke(4)}></path>
      <ellipse cx="97" cy="8" rx="9" ry="4" transform="rotate(-16 97 8)"
               fill="${PALETTE.cherryLight}"></ellipse>
    `,
  });
}

/** The wafer with a letter. Without one it is just "a wafer" – that is what the bubble shows. */
export function wafer(letter = ''): string {
  return svg({
    viewBox: `0 0 ${WAFER_SIZE} ${WAFER_SIZE}`,
    width: WAFER_SIZE,
    height: WAFER_SIZE,
    children: `
      <rect x="6" y="6" width="84" height="84" rx="14" fill="${PALETTE.dough}" ${stroke(4)}></rect>
      <path d="M34 10 V86 M62 10 V86 M10 34 H86 M10 62 H86"
            fill="none" stroke="${PALETTE.doughLight}" stroke-width="5"></path>
      ${letter === '' ? '' : centeredText({ cx: 48, cy: 48, size: 52, content: letter, fill: PALETTE.white })}
    `,
  });
}

/** The flag with a digit, on a stick that goes down into the scoops. Blank in the bubble. */
export function flag(digit = ''): string {
  return svg({
    viewBox: `0 0 ${FLAG_WIDTH} ${FLAG_HEIGHT}`,
    width: FLAG_WIDTH,
    height: FLAG_HEIGHT,
    children: `
      <rect x="20" y="6" width="9" height="102" rx="4" fill="${PALETTE.wood}" ${stroke(3)}></rect>
      <path d="M28 8 H88 L76 32 L88 56 H28 Z" fill="${PALETTE.frosting}" ${stroke(4)}></path>
      ${digit === '' ? '' : centeredText({ cx: 56, cy: 32, size: 36, content: digit })}
    `,
  });
}
