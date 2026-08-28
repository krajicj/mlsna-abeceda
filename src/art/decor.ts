/**
 * What the child buys for the kitchen (docs/navrh-hry.md 7.3a): a cat asleep on the floor and a
 * radio built into the counter. Neither of them is furniture – both ANSWER A TAP: the cat meows,
 * the radio plays a few notes. That is the whole point of them; a picture that only hangs there
 * adds nothing, and there is no free wall for one on a 4:3 stage anyway.
 *
 * Each drawing has one fixed natural size, exported as a constant – the same convention as
 * `candle.ts` (CANDLE_WIDTH/HEIGHT) and `cookie.ts` (COOKIE_SIZE). `decorLayout()` builds its boxes
 * to exactly these numbers and the shelf of the shop shrinks them into a cell with `fitted()`.
 */
import { PALETTE, stroke, svg, type Rect } from './svg';

export const DECOR_CAT_WIDTH = 112;
export const DECOR_CAT_HEIGHT = 68;
export const RADIO_WIDTH = 76;
export const RADIO_HEIGHT = 56;

/** The cat asleep on the floor: curled up, tail round her nose, eyes two closed arcs. */
export function sleepingCat(): string {
  return svg({
    viewBox: `0 0 ${DECOR_CAT_WIDTH} ${DECOR_CAT_HEIGHT}`,
    width: DECOR_CAT_WIDTH,
    height: DECOR_CAT_HEIGHT,
    children: `
      <path d="M30 62 Q6 62 8 46 Q10 30 34 28 Q64 24 86 34 Q106 44 100 56 Q96 64 78 64 Z"
            fill="${PALETTE.furCat}" ${stroke(4)}></path>
      <path d="M46 40 H74 M52 50 H80" fill="none" stroke="${PALETTE.furCatDark}" stroke-width="4"
            stroke-linecap="round"></path>
      <path d="M22 32 L18 18 L34 26 Z" fill="${PALETTE.furCat}" ${stroke(4)}></path>
      <path d="M40 30 L44 18 L52 30 Z" fill="${PALETTE.furCat}" ${stroke(4)}></path>
      <circle cx="34" cy="42" r="18" fill="${PALETTE.furCat}" ${stroke(4)}></circle>
      <path d="M24 40 Q28 45 32 40 M38 40 Q42 45 46 40" fill="none" ${stroke(3)}></path>
      <path d="M34 48 q-3 3 -6 1 M34 48 q3 3 6 1" fill="none" ${stroke(3)}></path>
      <path d="M100 52 Q112 46 104 38 Q96 32 88 40" fill="none" stroke="${PALETTE.furCatDark}"
            stroke-width="8" stroke-linecap="round"></path>
    `,
  });
}

/** The radio as a group, `scale`d and placed at (`x`, `y`) – the niche in the counter uses it. */
export function radioGroup(x: number, y: number, scale = 1): string {
  const size = Math.round(scale * 1000) / 1000;
  return (
    `<g transform="translate(${x} ${y}) scale(${size})">` +
    `<path d="M58 16 L70 4" fill="none" ${stroke(3)}></path>` +
    `<circle cx="70" cy="4" r="3" fill="${PALETTE.brass}" ${stroke(2)}></circle>` +
    `<rect x="4" y="14" width="68" height="38" rx="8" fill="${PALETTE.wood}" ${stroke(4)}></rect>` +
    `<rect x="10" y="20" width="30" height="26" rx="5" fill="${PALETTE.woodLight}" ${stroke(3)}></rect>` +
    `<path d="M16 26 H34 M16 33 H34 M16 40 H34" fill="none" stroke="${PALETTE.woodDark}"` +
    ` stroke-width="2" stroke-linecap="round"></path>` +
    `<circle cx="56" cy="27" r="7" fill="${PALETTE.brass}" ${stroke(3)}></circle>` +
    `<circle cx="56" cy="43" r="5" fill="${PALETTE.brassDark}" ${stroke(3)}></circle>` +
    `</g>`
  );
}

/** The radio on its own – this is what the shop shelf sells. */
export function radioSet(): string {
  return svg({
    viewBox: `0 0 ${RADIO_WIDTH} ${RADIO_HEIGHT}`,
    width: RADIO_WIDTH,
    height: RADIO_HEIGHT,
    children: radioGroup(0, 0),
  });
}

/**
 * The bought radio in the kitchen: one door of the counter front is taken out and the radio stands
 * in the opening (the author's idea, srpen 2026). No new wall is needed for it, the counter is the
 * one place in this kitchen with room to spare, and the whole panel is a target a thumb cannot miss.
 */
export function radioNiche(panel: Rect): string {
  const scale = Math.round(((panel.height - 28) / RADIO_HEIGHT) * 1000) / 1000;
  const x = Math.round((panel.width - RADIO_WIDTH * scale) / 2);
  const y = Math.round((panel.height - RADIO_HEIGHT * scale) / 2);
  return svg({
    viewBox: `0 0 ${panel.width} ${panel.height}`,
    width: panel.width,
    height: panel.height,
    children:
      `<rect x="2" y="2" width="${panel.width - 4}" height="${panel.height - 4}" rx="12"` +
      ` fill="${PALETTE.woodDark}" ${stroke(4)}></rect>` +
      `<rect x="10" y="10" width="${panel.width - 20}" height="${panel.height - 20}" rx="8"` +
      ` fill="${PALETTE.wood}" stroke="none"></rect>` +
      radioGroup(x, y, scale),
  });
}
