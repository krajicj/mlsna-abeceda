/**
 * The bear behind the counter – shapes taken from the `bear` and `paws` groups of the design
 * canvas at 1:1 scale. The body is clipped at y = 300 (the counter line in the scene sits
 * exactly there and its 4 px outline hides the cut); the paws are drawn below the clip so they
 * rest on the worktop.
 */
import { INK, PALETTE, stroke, svg } from './svg';

export const BEAR_WIDTH = 260;
export const BEAR_HEIGHT = 320;

const body = `
  <circle cx="62" cy="62" r="30" fill="${PALETTE.fur}" ${stroke(5)}></circle>
  <circle cx="198" cy="62" r="30" fill="${PALETTE.fur}" ${stroke(5)}></circle>
  <circle cx="62" cy="62" r="14" fill="${PALETTE.earInner}"></circle>
  <circle cx="198" cy="62" r="14" fill="${PALETTE.earInner}"></circle>
  <ellipse cx="130" cy="262" rx="98" ry="84" fill="${PALETTE.fur}" ${stroke(5)}></ellipse>
  <ellipse cx="130" cy="272" rx="58" ry="56" fill="${PALETTE.muzzle}"></ellipse>
  <path d="M72 196 Q130 228 188 196 L194 216 Q130 250 66 216 Z" fill="${PALETTE.bib}" ${stroke(4)}></path>
  <circle cx="130" cy="112" r="86" fill="${PALETTE.fur}" ${stroke(5)}></circle>
  <ellipse cx="130" cy="146" rx="42" ry="30" fill="${PALETTE.muzzle}"></ellipse>
  <ellipse cx="130" cy="132" rx="15" ry="11" fill="${INK}"></ellipse>
  <path d="M116 154 Q130 168 144 154" fill="none" ${stroke(4)}></path>
  <circle cx="78" cy="132" r="10" fill="${PALETTE.blush}" fill-opacity="0.55"></circle>
  <circle cx="182" cy="132" r="10" fill="${PALETTE.blush}" fill-opacity="0.55"></circle>
  <circle cx="96" cy="100" r="9" fill="${INK}"></circle>
  <circle cx="164" cy="100" r="9" fill="${INK}"></circle>
  <circle cx="99" cy="97" r="3" fill="${PALETTE.white}"></circle>
  <circle cx="167" cy="97" r="3" fill="${PALETTE.white}"></circle>
`;

const paws = `
  <ellipse cx="58" cy="302" rx="30" ry="17" fill="${PALETTE.fur}" ${stroke(4)}></ellipse>
  <ellipse cx="202" cy="302" rx="30" ry="17" fill="${PALETTE.fur}" ${stroke(4)}></ellipse>
  <g fill="none" ${stroke(3)}>
    <path d="M48 308 v-9"></path><path d="M60 309 v-10"></path><path d="M72 307 v-8"></path>
    <path d="M192 308 v-9"></path><path d="M204 309 v-10"></path><path d="M216 307 v-8"></path>
  </g>
`;

/** The waiting bear; the only customer of STEP-04 and its only state. */
export function bear(): string {
  return svg({
    viewBox: `0 0 ${BEAR_WIDTH} ${BEAR_HEIGHT}`,
    width: BEAR_WIDTH,
    height: BEAR_HEIGHT,
    children: `
      <defs><clipPath id="bear-above-counter"><rect x="0" y="0" width="260" height="300"></rect></clipPath></defs>
      <g clip-path="url(#bear-above-counter)">${body}</g>
      ${paws}
    `,
  });
}
