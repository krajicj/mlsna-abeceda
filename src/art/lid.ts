/**
 * The lid that closes the bowl once the child has counted out enough fruit (docs/navrh-hry.md
 * ch. 5.5): a clear "that is all" that never blocks anything – tapping the closed bowl only makes
 * the lid wobble. It shares the silhouette and the mint of the bowl in `bowl.ts`.
 */
import { LID_HEIGHT, LID_RIM_Y } from './layout';
import { PALETTE, stroke, svg } from './svg';

export const LID_WIDTH = 320;

export function bowlLid(): string {
  return svg({
    viewBox: `0 0 ${LID_WIDTH} ${LID_HEIGHT}`,
    width: LID_WIDTH,
    height: LID_HEIGHT,
    children: `
      <path d="M6 ${LID_RIM_Y} A154 66 0 0 1 314 ${LID_RIM_Y} Z" fill="${PALETTE.mintLight}" ${stroke(4)}></path>
      <path d="M58 48 Q92 20 132 15" fill="none" stroke="${PALETTE.white}" stroke-width="6" stroke-linecap="round" opacity="0.55"></path>
      <rect x="146" y="2" width="28" height="14" rx="7" fill="${PALETTE.mint}" ${stroke(4)}></rect>
    `,
  });
}
