/**
 * The padlock in the corner of a closed kitchen and the keypad behind it (STEP-14, návrh kap. 9).
 * A stand-in for the parent corner (STEP-20): the code is what opens the kitchen before the timer
 * runs out. The keys are the one place in the game where a digit is UI and not learning content –
 * the parent corner is the standing exception to rule 1.
 */
import { centeredText, INK, PALETTE, stroke, svg } from './svg';

const LOCK_VIEW = 96;
const KEY_VIEW = 96;
/** One dot of the typed code, and the gap to the next one. */
const DOT_SIZE = 20;
const DOT_GAP = 12;
const DOT_BOX = 48;

export function padlock(size = LOCK_VIEW): string {
  return svg({
    viewBox: `0 0 ${LOCK_VIEW} ${LOCK_VIEW}`,
    width: size,
    height: size,
    children:
      // The shackle as one filled U, so it carries the 4 px outline like everything else.
      `<path d="M26 50 V34 A22 22 0 0 1 70 34 V50 H56 V34 A8 8 0 0 0 40 34 V50 Z"` +
      ` fill="${PALETTE.brassDark}" ${stroke(4)}></path>` +
      `<rect x="18" y="46" width="60" height="42" rx="10" fill="${PALETTE.brass}" ${stroke(4)}></rect>` +
      `<circle cx="48" cy="62" r="7" fill="${INK}"></circle>` +
      `<path d="M48 68 L43 80 H53 Z" fill="${INK}"></path>`,
  });
}

/** One key of the keypad; `label` is a single digit. */
export function keyCap(label: string, size = KEY_VIEW): string {
  return svg({
    viewBox: `0 0 ${KEY_VIEW} ${KEY_VIEW}`,
    width: size,
    height: size,
    children:
      `<rect x="4" y="4" width="88" height="88" rx="22" fill="${PALETTE.white}" ${stroke(4)}></rect>` +
      centeredText({ cx: KEY_VIEW / 2, cy: KEY_VIEW / 2, size: 44, content: label }),
  });
}

/** How many digits have been typed, out of `total`: a filled dot for each one. */
export function codeDots(filled: number, total: number): string {
  const count = Math.max(Math.floor(total) || 0, 0);
  const done = Math.min(Math.max(Math.floor(filled) || 0, 0), count);
  const width = Math.max(count * DOT_SIZE + Math.max(count - 1, 0) * DOT_GAP, 1);
  const dots = Array.from({ length: count }, (_, index) => {
    const cx = index * (DOT_SIZE + DOT_GAP) + DOT_SIZE / 2;
    const colour = index < done ? PALETTE.brass : PALETTE.white;
    return (
      `<circle cx="${cx}" cy="${DOT_BOX / 2}" r="${DOT_SIZE / 2 - 2}"` +
      ` fill="${colour}" ${stroke(4)}></circle>`
    );
  }).join('');
  return svg({ viewBox: `0 0 ${width} ${DOT_BOX}`, width, height: DOT_BOX, children: dots });
}
