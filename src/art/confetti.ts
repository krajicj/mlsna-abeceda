/**
 * The confetti of the finale (docs/navrh-hry.md ch. 13 point 2): the cheap stand-in for a baking
 * mechanic. One piece per element, its colour and shape decided by the index, so the scene only
 * has to say "piece number 7" and every run of the animation looks the same as the last.
 */
import { PALETTE, stroke, svg } from './svg';

export const CONFETTI_COUNT = 14;
export const CONFETTI_SIZE = 18;

const COLOURS = [
  PALETTE.strawberry,
  PALETTE.star,
  PALETTE.leaf,
  PALETTE.blueberry,
  PALETTE.frosting,
  PALETTE.mint,
  PALETTE.flameCore,
] as const;

function shapeOf(index: number, colour: string): string {
  switch (index % 3) {
    case 0:
      return `<rect x="3" y="5" width="12" height="8" rx="2" fill="${colour}" ${stroke(2)}></rect>`;
    case 1:
      return `<circle cx="9" cy="9" r="6" fill="${colour}" ${stroke(2)}></circle>`;
    default:
      return `<path d="M9 2 L16 15 L2 15 Z" fill="${colour}" ${stroke(2)}></path>`;
  }
}

/** One piece; `index` is taken modulo the palette and the shapes, so any number is safe. */
export function confettiPiece(index: number): string {
  const safe = Math.abs(Math.trunc(index) || 0);
  const colour = COLOURS[safe % COLOURS.length] ?? PALETTE.star;
  return svg({
    viewBox: `0 0 ${CONFETTI_SIZE} ${CONFETTI_SIZE}`,
    width: CONFETTI_SIZE,
    height: CONFETTI_SIZE,
    children: shapeOf(safe, colour),
  });
}
