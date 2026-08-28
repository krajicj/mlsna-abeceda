/**
 * The roller shutter of a closed kitchen (docs/navrh-hry.md ch. 4), the way a shop in a mall pulls
 * one down: bars with gaps, so the kitchen stays visible behind it. Nothing here says "closed" in
 * words – the picture does it (rule 1), and the kitchen timer hanging on it says for how long.
 *
 * Drawn to the width of the stage, so it is built again on every resize; the scene animates it
 * down from above.
 */
import { PALETTE, stroke, svg } from './svg';

/** Pitch of the bars: wide enough to see the kitchen through, narrow enough to read as a grille. */
const BAR_PITCH = 56;
const BAR_WIDTH = 14;
const RAIL_HEIGHT = 12;
const RAIL_COUNT = 4;
/** The solid bar at the bottom, the one a shopkeeper takes hold of. */
export const SHUTTER_BOTTOM = 44;

export function shutter(width: number, height: number): string {
  const w = Math.max(Math.round(width), BAR_PITCH);
  const h = Math.max(Math.round(height), SHUTTER_BOTTOM * 2);
  const bottom = h - SHUTTER_BOTTOM;
  const bars: string[] = [];
  for (let x = 10; x + BAR_WIDTH <= w - 10; x += BAR_PITCH) {
    bars.push(
      `<rect x="${x}" y="-8" width="${BAR_WIDTH}" height="${bottom + 8}" rx="7"` +
        ` fill="${PALETTE.brass}" ${stroke(4)}></rect>`,
    );
  }
  const rails: string[] = [];
  const step = bottom / (RAIL_COUNT + 1);
  for (let index = 1; index <= RAIL_COUNT; index += 1) {
    const y = Math.round(step * index - RAIL_HEIGHT / 2);
    rails.push(
      `<rect x="-4" y="${y}" width="${w + 8}" height="${RAIL_HEIGHT}" rx="6"` +
        ` fill="${PALETTE.brassDark}" ${stroke(4)}></rect>`,
    );
  }
  const handleY = bottom + Math.round((SHUTTER_BOTTOM - 12) / 2);
  const handle = (cx: number): string =>
    `<rect x="${cx - 22}" y="${handleY}" width="44" height="12" rx="6"` +
    ` fill="${PALETTE.brass}" ${stroke(4)}></rect>`;
  return svg({
    viewBox: `0 0 ${w} ${h}`,
    width: w,
    height: h,
    children:
      bars.join('') +
      rails.join('') +
      `<rect x="-4" y="${bottom}" width="${w + 8}" height="${SHUTTER_BOTTOM + 8}" rx="10"` +
      ` fill="${PALETTE.brassDark}" ${stroke(4)}></rect>` +
      handle(Math.round(w / 2) - 60) +
      handle(Math.round(w / 2) + 60),
  });
}
