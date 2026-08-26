/**
 * The rabbit behind the counter – built exactly like `bear.ts` so the layout can put any customer
 * in the same 260×320 box: the body is clipped at y = 300 (the counter line, its 4 px outline
 * hides the cut) and the paws are drawn below the clip so they rest on the worktop.
 *
 * What tells him apart at a glance: the tall ears, the cream fur and the mint scarf.
 */
import { INK, PALETTE, stroke, svg } from './svg';

export const RABBIT_WIDTH = 260;
export const RABBIT_HEIGHT = 320;

const ears = `
  <g transform="rotate(-9 102 62)">
    <ellipse cx="102" cy="62" rx="21" ry="54" fill="${PALETTE.furRabbit}" ${stroke(5)}></ellipse>
    <ellipse cx="102" cy="66" rx="10" ry="38" fill="${PALETTE.earInner}"></ellipse>
  </g>
  <g transform="rotate(9 158 62)">
    <ellipse cx="158" cy="62" rx="21" ry="54" fill="${PALETTE.furRabbit}" ${stroke(5)}></ellipse>
    <ellipse cx="158" cy="66" rx="10" ry="38" fill="${PALETTE.earInner}"></ellipse>
  </g>
`;

const body = `
  <ellipse cx="130" cy="266" rx="94" ry="82" fill="${PALETTE.furRabbit}" ${stroke(5)}></ellipse>
  <ellipse cx="130" cy="278" rx="56" ry="54" fill="${PALETTE.white}"></ellipse>
  <path d="M74 200 Q130 232 186 200 L192 220 Q130 254 68 220 Z" fill="${PALETTE.mint}" ${stroke(4)}></path>
`;

const head = `
  <circle cx="130" cy="134" r="78" fill="${PALETTE.furRabbit}" ${stroke(5)}></circle>
  <ellipse cx="106" cy="166" rx="27" ry="21" fill="${PALETTE.white}"></ellipse>
  <ellipse cx="154" cy="166" rx="27" ry="21" fill="${PALETTE.white}"></ellipse>
  <path d="M120 148 L140 148 L130 158 Z" fill="${PALETTE.blush}" ${stroke(3)}></path>
  <path d="M130 160 v6" fill="none" ${stroke(4)}></path>
  <path d="M112 176 Q130 182 130 166 Q130 182 148 176" fill="none" ${stroke(4)}></path>
  <rect x="122" y="182" width="7" height="12" rx="3" fill="${PALETTE.white}" ${stroke(3)}></rect>
  <rect x="131" y="182" width="7" height="12" rx="3" fill="${PALETTE.white}" ${stroke(3)}></rect>
  <circle cx="76" cy="146" r="10" fill="${PALETTE.blush}" fill-opacity="0.55"></circle>
  <circle cx="184" cy="146" r="10" fill="${PALETTE.blush}" fill-opacity="0.55"></circle>
  <circle cx="100" cy="122" r="9" fill="${INK}"></circle>
  <circle cx="160" cy="122" r="9" fill="${INK}"></circle>
  <circle cx="103" cy="119" r="3" fill="${PALETTE.white}"></circle>
  <circle cx="163" cy="119" r="3" fill="${PALETTE.white}"></circle>
`;

const paws = `
  <ellipse cx="58" cy="302" rx="30" ry="17" fill="${PALETTE.furRabbit}" ${stroke(4)}></ellipse>
  <ellipse cx="202" cy="302" rx="30" ry="17" fill="${PALETTE.furRabbit}" ${stroke(4)}></ellipse>
  <g fill="none" ${stroke(3)}>
    <path d="M48 308 v-9"></path><path d="M60 309 v-10"></path><path d="M72 307 v-8"></path>
    <path d="M192 308 v-9"></path><path d="M204 309 v-10"></path><path d="M216 307 v-8"></path>
  </g>
`;

/** The waiting rabbit; one drawing, the same states the bear has (none of its own). */
export function rabbit(): string {
  return svg({
    viewBox: `0 0 ${RABBIT_WIDTH} ${RABBIT_HEIGHT}`,
    width: RABBIT_WIDTH,
    height: RABBIT_HEIGHT,
    children: `
      <defs><clipPath id="rabbit-above-counter"><rect x="0" y="0" width="260" height="300"></rect></clipPath></defs>
      <g clip-path="url(#rabbit-above-counter)">${ears}${body}${head}</g>
      ${paws}
    `,
  });
}
