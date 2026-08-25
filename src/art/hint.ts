/**
 * The dashed ring of the hint (docs/navrh-hry.md ch. 5.5). After 40 s of silence it appears over
 * the first piece of fruit in the bowl and says "tap here"; it never taps for the child. Same
 * values as the dashed circle on the design canvas.
 */
import { INK, svg } from './svg';

export function hintRing(diameter: number): string {
  const radius = Math.max(diameter / 2 - 6, 1);
  return svg({
    viewBox: `0 0 ${diameter} ${diameter}`,
    width: diameter,
    height: diameter,
    children:
      `<circle cx="${diameter / 2}" cy="${diameter / 2}" r="${radius}" fill="#FFFFFF"` +
      ` fill-opacity="0.6" stroke="${INK}" stroke-width="3" stroke-dasharray="7 6"` +
      ` opacity="0.6"></circle>`,
  });
}
