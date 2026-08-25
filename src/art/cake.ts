/**
 * The cake base – the `cake` group of the design canvas without the strawberries and without the
 * dashed "here comes the fruit" circle (STEP-05 puts those back). Cropped to the drawing itself
 * and scaled uniformly to the 220×146 box of `kitchenLayout`.
 */
import { PALETTE, stroke, svg } from './svg';

export const CAKE_WIDTH = 220;
export const CAKE_HEIGHT = 146;
/** Bounds of the undecorated drawing: 44…226 vertically, padded sideways to keep the box ratio. */
export const CAKE_VIEW_BOX = '-7 44 274 182';

/** The plate rests on the bottom edge of the box, so the box bottom is the counter. */
export function cakeBase(): string {
  return svg({
    viewBox: CAKE_VIEW_BOX,
    width: CAKE_WIDTH,
    height: CAKE_HEIGHT,
    children: `
      <ellipse cx="130" cy="200" rx="122" ry="24" fill="${PALETTE.plate}" ${stroke(4)}></ellipse>
      <ellipse cx="130" cy="200" rx="96" ry="15" fill="none" stroke="${PALETTE.plateShade}" stroke-width="3"></ellipse>
      <rect x="36" y="122" width="188" height="72" rx="16" fill="${PALETTE.frosting}" ${stroke(4)}></rect>
      <ellipse cx="130" cy="124" rx="94" ry="22" fill="${PALETTE.frostingLight}" ${stroke(4)}></ellipse>
      <rect x="62" y="62" width="136" height="62" rx="14" fill="${PALETTE.sponge}" ${stroke(4)}></rect>
      <path d="M62 76 C70 96 80 96 88 76 C96 96 106 96 114 76 C122 96 132 96 140 76 C148 96 158 96 166 76 C174 96 184 96 192 76 L198 76 L198 62 L62 62 Z" fill="${PALETTE.frosting}"></path>
      <ellipse cx="130" cy="64" rx="68" ry="17" fill="${PALETTE.spongeLight}" ${stroke(4)}></ellipse>
    `,
  });
}
