/**
 * The frog behind the counter – built exactly like `bear.ts` so the layout can put any customer in
 * the same 260×320 box: the body is clipped at y = 300 (the counter line, its 4 px outline hides
 * the cut) and the feet are drawn below the clip so they rest on the worktop.
 *
 * What tells her apart at a glance: the two eyes bulging off the top of the head, the wide smile
 * and the green skin – the only customer with no fur at all. She is bought in the shop (STEP-15).
 */
import { INK, PALETTE, stroke, svg } from './svg';

export const FROG_WIDTH = 260;
export const FROG_HEIGHT = 320;

/** The eyes sit ON the head, not in it: two domes over the skull line, like a frog in a pond. */
const eyes = `
  <circle cx="88" cy="76" r="34" fill="${PALETTE.frog}" ${stroke(5)}></circle>
  <circle cx="172" cy="76" r="34" fill="${PALETTE.frog}" ${stroke(5)}></circle>
  <circle cx="88" cy="76" r="20" fill="${PALETTE.white}" ${stroke(4)}></circle>
  <circle cx="172" cy="76" r="20" fill="${PALETTE.white}" ${stroke(4)}></circle>
  <circle cx="90" cy="78" r="9" fill="${INK}"></circle>
  <circle cx="174" cy="78" r="9" fill="${INK}"></circle>
  <circle cx="93" cy="74" r="3" fill="${PALETTE.white}"></circle>
  <circle cx="177" cy="74" r="3" fill="${PALETTE.white}"></circle>
`;

const body = `
  <ellipse cx="130" cy="266" rx="94" ry="80" fill="${PALETTE.frog}" ${stroke(5)}></ellipse>
  <ellipse cx="130" cy="276" rx="58" ry="52" fill="${PALETTE.frogBelly}"></ellipse>
  <path d="M74 198 Q130 230 186 198 L192 218 Q130 252 68 218 Z" fill="${PALETTE.mint}" ${stroke(4)}></path>
`;

/**
 * The mouth is the widest thing on her, and it has to end up where `CUSTOMERS.frog.mouth` says
 * (y ≈ 151 of 320) – that is the point the cake flies to when she eats.
 */
const head = `
  <ellipse cx="130" cy="134" rx="88" ry="74" fill="${PALETTE.frog}" ${stroke(5)}></ellipse>
  <ellipse cx="130" cy="160" rx="62" ry="38" fill="${PALETTE.frogBelly}"></ellipse>
  <path d="M72 142 Q130 190 188 142" fill="none" ${stroke(5)}></path>
  <ellipse cx="112" cy="120" rx="4" ry="5" fill="${PALETTE.frogDark}"></ellipse>
  <ellipse cx="148" cy="120" rx="4" ry="5" fill="${PALETTE.frogDark}"></ellipse>
  <circle cx="80" cy="150" r="11" fill="${PALETTE.blush}" fill-opacity="0.55"></circle>
  <circle cx="180" cy="150" r="11" fill="${PALETTE.blush}" fill-opacity="0.55"></circle>
  <ellipse cx="86" cy="196" rx="10" ry="7" transform="rotate(-20 86 196)" fill="${PALETTE.frogDark}"></ellipse>
  <ellipse cx="174" cy="196" rx="10" ry="7" transform="rotate(20 174 196)" fill="${PALETTE.frogDark}"></ellipse>
`;

/** Webbed feet instead of paws: three toes each, drawn as one scalloped shape. */
const feet = `
  <ellipse cx="58" cy="302" rx="32" ry="17" fill="${PALETTE.frog}" ${stroke(4)}></ellipse>
  <ellipse cx="202" cy="302" rx="32" ry="17" fill="${PALETTE.frog}" ${stroke(4)}></ellipse>
  <g fill="none" ${stroke(3)}>
    <path d="M46 310 v-10"></path><path d="M58 311 v-11"></path><path d="M70 310 v-10"></path>
    <path d="M190 310 v-10"></path><path d="M202 311 v-11"></path><path d="M214 310 v-10"></path>
  </g>
`;

/** The waiting frog; one drawing, the same states the bear has (none of its own). */
export function frog(): string {
  return svg({
    viewBox: `0 0 ${FROG_WIDTH} ${FROG_HEIGHT}`,
    width: FROG_WIDTH,
    height: FROG_HEIGHT,
    children: `
      <defs><clipPath id="frog-above-counter"><rect x="0" y="0" width="260" height="300"></rect></clipPath></defs>
      <g clip-path="url(#frog-above-counter)">${body}${head}${eyes}</g>
      ${feet}
    `,
  });
}
