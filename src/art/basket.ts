/**
 * The shopping basket (STEP-16): the picture way of saying "tap here and we go shopping". It lives
 * inside the star counter, next to the number – the stars and the place they are spent are then one
 * thing on the screen, and the kitchen needs no new button (docs/navrh-hry.md kap. 7).
 *
 * Dimmed while an order is running, exactly like the bell: bright basket, go shopping (rule 1 – the
 * child reads the rule off the picture, never off a word).
 */
import { PALETTE, stroke, svg } from './svg';

/** Natural size of the icon, and the size it has inside the pill. */
export const BASKET_SIZE = 36;

/** The basket as a group, for composing into another drawing – the same shape as `starGroup()`. */
export function basketGroup(
  x: number,
  y: number,
  size: number = BASKET_SIZE,
  options?: { readonly dim?: boolean },
): string {
  const scale = size / BASKET_SIZE;
  const opacity = options?.dim ? ' opacity="0.35"' : '';
  return (
    `<g transform="translate(${x} ${y}) scale(${Math.round(scale * 1000) / 1000})"${opacity}>` +
    `<path d="M11 15 A7 7 0 0 1 25 15" fill="none" ${stroke(3)}></path>` +
    `<path d="M4 14 H32 L28 31 H8 Z" fill="${PALETTE.wood}" ${stroke(3)}></path>` +
    `<path d="M4.5 18 H31.5" fill="none" stroke="${PALETTE.woodDark}" stroke-width="2"></path>` +
    `<path d="M13 15 L14.5 30 M23 15 L21.5 30" fill="none" stroke="${PALETTE.woodDark}"` +
    ` stroke-width="2" stroke-linecap="round"></path>` +
    `<path d="M4 14 H32" fill="none" ${stroke(3)}></path>` +
    `</g>`
  );
}

export function basket(size: number = BASKET_SIZE, options?: { readonly dim?: boolean }): string {
  return svg({
    viewBox: `0 0 ${BASKET_SIZE} ${BASKET_SIZE}`,
    width: size,
    height: size,
    children: basketGroup(0, 0, BASKET_SIZE, options),
  });
}
