/**
 * The kitchen timer hanging on the shutter (docs/navrh-hry.md ch. 4): the one thing that tells a
 * child who cannot read how long the kitchen stays closed. The wedge shrinks as the time runs out
 * and the single hand walks back towards twelve – no digits on the dial, nothing to read (rule 1).
 */
import { INK, PALETTE, stroke, svg } from './svg';

/** The drawing is built in this box and scaled to whatever size the layout asks for. */
const VIEW = 260;
const CENTER = VIEW / 2;
const DIAL_RADIUS = 104;
const WEDGE_RADIUS = 92;
const TICK_OUTER = 92;
const TICK_INNER = 80;

/** The point on the dial `angle` degrees clockwise from twelve. */
function pointAt(angle: number, radius: number): { readonly x: number; readonly y: number } {
  const radians = (angle * Math.PI) / 180;
  return {
    x: Math.round((CENTER + radius * Math.sin(radians)) * 100) / 100,
    y: Math.round((CENTER - radius * Math.cos(radians)) * 100) / 100,
  };
}

/**
 * The slice still to run, clockwise from twelve. A 360° arc is degenerate in SVG (start and end
 * are the same point), so a full timer is drawn as a circle instead.
 */
function wedge(progress: number): string {
  if (progress >= 0.999) {
    return (
      `<circle cx="${CENTER}" cy="${CENTER}" r="${WEDGE_RADIUS}"` +
      ` fill="${PALETTE.frosting}"></circle>`
    );
  }
  const angle = progress * 360;
  const end = pointAt(angle, WEDGE_RADIUS);
  const large = angle > 180 ? 1 : 0;
  return (
    `<path d="M${CENTER} ${CENTER} L${CENTER} ${CENTER - WEDGE_RADIUS}` +
    ` A${WEDGE_RADIUS} ${WEDGE_RADIUS} 0 ${large} 1 ${end.x} ${end.y} Z"` +
    ` fill="${PALETTE.frosting}"></path>`
  );
}

function ticks(): string {
  return Array.from({ length: 12 }, (_, index) => {
    const angle = index * 30;
    const outer = pointAt(angle, TICK_OUTER);
    const inner = pointAt(angle, TICK_INNER);
    return (
      `<line x1="${inner.x}" y1="${inner.y}" x2="${outer.x}" y2="${outer.y}"` +
      ` ${stroke(index % 3 === 0 ? 6 : 4)}></line>`
    );
  }).join('');
}

/** `progress`: 1 = the whole closing still ahead, 0 = the kitchen opens now. */
export function kitchenTimer(options: {
  readonly size: number;
  readonly progress: number;
}): string {
  const size = Math.max(Math.round(options.size), 1);
  const raw = options.progress;
  const progress = Math.min(Math.max(Number.isFinite(raw) ? raw : 0, 0), 1);
  const hand = pointAt(progress * 360, WEDGE_RADIUS - 10);
  return svg({
    viewBox: `0 0 ${VIEW} ${VIEW}`,
    width: size,
    height: size,
    children:
      `<rect x="${CENTER - 16}" y="6" width="32" height="26" rx="10"` +
      ` fill="${PALETTE.brass}" ${stroke(4)}></rect>` +
      `<circle cx="${CENTER}" cy="${CENTER}" r="${DIAL_RADIUS}"` +
      ` fill="${PALETTE.white}" ${stroke(4)}></circle>` +
      wedge(progress) +
      ticks() +
      `<line x1="${CENTER}" y1="${CENTER}" x2="${hand.x}" y2="${hand.y}" ${stroke(6)}></line>` +
      `<circle cx="${CENTER}" cy="${CENTER}" r="9" fill="${INK}"></circle>`,
  });
}
