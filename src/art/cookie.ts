/**
 * The gingerbread cookie with a letter – the artboard cookie (a CSS circle there) redrawn as SVG
 * and grown from 84 to 96 px so the touch target clears 88 (CLAUDE.md, rule 3). The letter is
 * learning content, not UI text.
 */
import { PALETTE, centeredText, stroke, svg } from './svg';

export const COOKIE_SIZE = 96;

export function cookie(letter: string): string {
  return svg({
    viewBox: `0 0 ${COOKIE_SIZE} ${COOKIE_SIZE}`,
    width: COOKIE_SIZE,
    height: COOKIE_SIZE,
    children: `
      <circle cx="48" cy="48" r="44" fill="${PALETTE.dough}" ${stroke(4)}></circle>
      <circle cx="48" cy="48" r="37" fill="none" stroke="${PALETTE.doughLight}" stroke-width="6"></circle>
      ${centeredText({ cx: 48, cy: 48, size: 52, content: letter, fill: PALETTE.white })}
    `,
  });
}
