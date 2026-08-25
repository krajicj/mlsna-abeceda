/**
 * One circle of the counter above the cake – the `countPill` of the design canvas, 40 px instead of
 * 44 so five of them fit between the bear and the shelves on the narrowest stage. Nothing is ever
 * tapped here (it is an indicator, not a target), so rule 3 does not apply. The digit is learning
 * content: while counting, the child sees what the number looks like.
 */
import { centeredText, PALETTE, stroke, svg } from './svg';

export const PILL_DIAMETER = 40;

export function countPill(options: { readonly digit: string; readonly done: boolean }): string {
  return svg({
    viewBox: `0 0 ${PILL_DIAMETER} ${PILL_DIAMETER}`,
    width: PILL_DIAMETER,
    height: PILL_DIAMETER,
    children: `
      <circle cx="20" cy="20" r="18" fill="${options.done ? PALETTE.pillDone : PALETTE.white}" ${stroke(4)}></circle>
      ${centeredText({
        cx: 20,
        cy: 20,
        size: 22,
        content: options.digit,
        fill: options.done ? PALETTE.white : PALETTE.pillMuted,
      })}
    `,
  });
}
