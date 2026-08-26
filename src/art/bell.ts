/**
 * The brass counter bell (docs/navrh-hry.md ch. 4): the child taps it and the next customer comes
 * in. 96×96 – over the 88 px minimum of CLAUDE.md rule 3 on its own, before the hit box around it.
 */
import { PALETTE, stroke, svg } from './svg';

export const BELL_SIZE = 96;

/** The bell as it stands on the worktop; one drawing, the scene animates the hop. */
export function bell(size = BELL_SIZE): string {
  return svg({
    viewBox: `0 0 ${BELL_SIZE} ${BELL_SIZE}`,
    width: size,
    height: size,
    children: `
      <circle cx="48" cy="17" r="9" fill="${PALETTE.brass}" ${stroke(4)}></circle>
      <rect x="43" y="22" width="10" height="16" rx="4" fill="${PALETTE.brassDark}" ${stroke(4)}></rect>
      <path d="M14 72 V64 A34 34 0 0 1 82 64 V72 Z" fill="${PALETTE.brass}" ${stroke(4)}></path>
      <path d="M29 66 Q31 45 46 37" fill="none" stroke="${PALETTE.white}" stroke-width="7" stroke-linecap="round" stroke-opacity="0.5"></path>
      <rect x="8" y="71" width="80" height="15" rx="7" fill="${PALETTE.brassDark}" ${stroke(4)}></rect>
    `,
  });
}
