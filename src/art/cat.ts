/**
 * The cat behind the counter – built exactly like `bear.ts` so the layout can put any customer in
 * the same 260×320 box: the body is clipped at y = 300 (the counter line, its 4 px outline hides
 * the cut) and the paws are drawn below the clip so they rest on the worktop.
 *
 * What tells her apart at a glance: the pointed ears, the ginger stripes and the pink collar.
 */
import { INK, PALETTE, stroke, svg } from './svg';

export const CAT_WIDTH = 260;
export const CAT_HEIGHT = 320;

const ears = `
  <path d="M66 92 L72 26 L126 62 Z" fill="${PALETTE.furCat}" ${stroke(5)}></path>
  <path d="M194 92 L188 26 L134 62 Z" fill="${PALETTE.furCat}" ${stroke(5)}></path>
  <path d="M80 82 L84 46 L112 66 Z" fill="${PALETTE.earInner}"></path>
  <path d="M180 82 L176 46 L148 66 Z" fill="${PALETTE.earInner}"></path>
`;

const body = `
  <ellipse cx="130" cy="266" rx="92" ry="80" fill="${PALETTE.furCat}" ${stroke(5)}></ellipse>
  <ellipse cx="130" cy="276" rx="56" ry="52" fill="${PALETTE.muzzle}"></ellipse>
  <path d="M74 198 Q130 230 186 198 L192 218 Q130 252 68 218 Z" fill="${PALETTE.frosting}" ${stroke(4)}></path>
`;

const head = `
  <circle cx="130" cy="126" r="82" fill="${PALETTE.furCat}" ${stroke(5)}></circle>
  <g fill="none" stroke="${PALETTE.furCatDark}" stroke-width="7" stroke-linecap="round">
    <path d="M112 62 v20"></path><path d="M130 56 v22"></path><path d="M148 62 v20"></path>
  </g>
  <ellipse cx="112" cy="156" rx="25" ry="19" fill="${PALETTE.muzzle}"></ellipse>
  <ellipse cx="148" cy="156" rx="25" ry="19" fill="${PALETTE.muzzle}"></ellipse>
  <path d="M120 142 L140 142 L130 152 Z" fill="${PALETTE.blush}" ${stroke(3)}></path>
  <path d="M130 154 v5" fill="none" ${stroke(4)}></path>
  <path d="M112 166 Q130 174 130 159 Q130 174 148 166" fill="none" ${stroke(4)}></path>
  <g fill="none" ${stroke(3)}>
    <path d="M78 148 h-24"></path><path d="M80 160 h-24"></path>
    <path d="M182 148 h24"></path><path d="M180 160 h24"></path>
  </g>
  <circle cx="98" cy="118" r="9" fill="${INK}"></circle>
  <circle cx="162" cy="118" r="9" fill="${INK}"></circle>
  <circle cx="101" cy="115" r="3" fill="${PALETTE.white}"></circle>
  <circle cx="165" cy="115" r="3" fill="${PALETTE.white}"></circle>
  <circle cx="76" cy="140" r="10" fill="${PALETTE.blush}" fill-opacity="0.55"></circle>
  <circle cx="184" cy="140" r="10" fill="${PALETTE.blush}" fill-opacity="0.55"></circle>
`;

const paws = `
  <ellipse cx="58" cy="302" rx="30" ry="17" fill="${PALETTE.furCat}" ${stroke(4)}></ellipse>
  <ellipse cx="202" cy="302" rx="30" ry="17" fill="${PALETTE.furCat}" ${stroke(4)}></ellipse>
  <g fill="none" ${stroke(3)}>
    <path d="M48 308 v-9"></path><path d="M60 309 v-10"></path><path d="M72 307 v-8"></path>
    <path d="M192 308 v-9"></path><path d="M204 309 v-10"></path><path d="M216 307 v-8"></path>
  </g>
`;

/** The waiting cat; one drawing, the same states the bear has (none of its own). */
export function cat(): string {
  return svg({
    viewBox: `0 0 ${CAT_WIDTH} ${CAT_HEIGHT}`,
    width: CAT_WIDTH,
    height: CAT_HEIGHT,
    children: `
      <defs><clipPath id="cat-above-counter"><rect x="0" y="0" width="260" height="300"></rect></clipPath></defs>
      <g clip-path="url(#cat-above-counter)">${ears}${body}${head}</g>
      ${paws}
    `,
  });
}
