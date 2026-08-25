/**
 * The candle with a digit. The design canvas has no candle (it only shows the "letter" state),
 * so the shape is the one specified in docs/steps/STEP-04-kitchen-scene-and-font.md. Strokes are
 * centred, so every shape keeps 2 px of slack inside the box and nothing is clipped.
 *
 * Without a digit it is just "a candle" – what the order bubble shows, so which number is wanted
 * has to be heard rather than matched (návrh 5.4).
 */
import { PALETTE, centeredText, stroke, svg } from './svg';

export const CANDLE_WIDTH = 96;
export const CANDLE_HEIGHT = 112;

export function candle(digit = ''): string {
  return svg({
    viewBox: `0 0 ${CANDLE_WIDTH} ${CANDLE_HEIGHT}`,
    width: CANDLE_WIDTH,
    height: CANDLE_HEIGHT,
    children: `
      <ellipse cx="48" cy="18" rx="10" ry="14" fill="${PALETTE.flame}" ${stroke(4)}></ellipse>
      <ellipse cx="48" cy="22" rx="5" ry="8" fill="${PALETTE.flameCore}"></ellipse>
      <path d="M48 32 V38" fill="none" ${stroke(4)}></path>
      <rect x="26" y="36" width="44" height="72" rx="12" fill="${PALETTE.wax}" ${stroke(4)}></rect>
      ${digit === '' ? '' : centeredText({ cx: 48, cy: 74, size: 40, content: digit })}
    `,
  });
}
