/**
 * Shared pieces every art module builds on: the palette read off the design canvas
 * (`docs/design/build-artboards.mjs`), the outline convention (4 px `#3B2A1A`, rounded joins)
 * and two tiny builders. Art is plain SVG markup in strings – no framework, no runtime deps.
 */
export const INK = '#3B2A1A';

/**
 * The only source of colour for the art modules. `wax`, `flame` and `flameCore` are not on the
 * artboard (it has no candle); they were picked for STEP-04 in the same warm key. The blueberry
 * and the cherry are not there either – STEP-05 picked them to sit next to the strawberry.
 */
export const PALETTE = {
  wall: '#FFE9D1',
  wallDot: '#F7D6B3',
  wood: '#D9A066',
  woodDark: '#B07A3F',
  woodLight: '#EBC08A',
  mint: '#BFE6D6',
  mintLight: '#D6F1E6',
  floorA: '#FBEBD6',
  floorB: '#F1D4B4',
  strawberry: '#E5484D',
  blueberry: '#5C6BC0',
  blueberryDark: '#3F4A9C',
  blueberryLight: '#B7C0EC',
  cherry: '#B3261E',
  cherryLight: '#E2726B',
  /** The fourth fruit, sold in the shop (STEP-15): pink-crimson, so it is not a second red berry. */
  raspberry: '#C2255C',
  raspberryLight: '#E06A99',
  stem: '#3F8F3A',
  leaf: '#4CAF50',
  seed: '#FFE08A',
  fur: '#A0643A',
  /** The rabbit and the cat (STEP-10); three customers have to be told apart at a glance. */
  furRabbit: '#F0E4D2',
  furCat: '#E8A33D',
  furCatDark: '#C9822A',
  /** The frog, bought in the shop (STEP-15) – the only customer with no fur at all. */
  frog: '#7BC043',
  frogDark: '#4E9A2F',
  frogBelly: '#EAF7C8',
  earInner: '#E8A98A',
  muzzle: '#E9C9A3',
  blush: '#F48FB1',
  bib: '#E5484D',
  plate: '#FFFFFF',
  plateShade: '#DCD3C8',
  frosting: '#F7B7C8',
  frostingLight: '#FBD1DC',
  sponge: '#FDE6B5',
  spongeLight: '#FFF3D6',
  dough: '#C98A4B',
  doughLight: '#E0AC74',
  /** The pancakes (STEP-18): golden rather than the browner gingerbread dough above. */
  pancake: '#E8B771',
  pancakeDark: '#C08A45',
  /**
   * The chocolate disc that carries the letter on pancakes, and the syrup of their finale. Two
   * classes darker than `dough` on purpose: the disc is the same 96 px circle as the gingerbread
   * cookie, and colour is one of the three things that keep the two apart (STEP-18, decision 2).
   */
  chocolate: '#5A3520',
  chocolateLight: '#7C4A2D',
  pillDone: '#FF8FAB',
  pillMuted: '#B9A697',
  wax: '#FFF1DC',
  flame: '#FFC53D',
  flameCore: '#FFB703',
  /** The reward star (STEP-09); the same value as --star in src/style.css. */
  star: '#FFC53D',
  /** The counter bell (STEP-10); brass, the one metal in a kitchen made of wood and icing. */
  brass: '#E0A83C',
  brassDark: '#B4801F',
  white: '#FFFFFF',
} as const;

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** One <svg> with the given viewBox; `children` is finished SVG markup. */
export function svg(options: {
  readonly viewBox: string;
  readonly width: number;
  readonly height: number;
  readonly className?: string;
  readonly children: string;
}): string {
  const cls = options.className ? ` class="${options.className}"` : '';
  return (
    `<svg viewBox="${options.viewBox}" width="${options.width}" height="${options.height}"` +
    `${cls} aria-hidden="true">${options.children}</svg>`
  );
}

/** Outline attributes: stroke INK, rounded joins and caps. */
export function stroke(width = 4): string {
  return `stroke="${INK}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`;
}

/** Letters and digits are the only text the game draws; keep the markup valid whatever arrives. */
function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Text centred on (`cx`, `cy`). The baseline is computed as `cy + size * 0.35` instead of
 * `dominant-baseline`, which browsers disagree about. `class="art-text"` carries the font family
 * (see `src/style.css`), so the drawing follows whatever Fredoka is loaded.
 */
export function centeredText(options: {
  readonly cx: number;
  readonly cy: number;
  readonly size: number;
  readonly content: string;
  readonly fill?: string;
  readonly weight?: 500 | 600 | 700;
}): string {
  const baseline = Math.round((options.cy + options.size * 0.35) * 10) / 10;
  return (
    `<text class="art-text" x="${options.cx}" y="${baseline}" text-anchor="middle"` +
    ` font-size="${options.size}" font-weight="${options.weight ?? 700}"` +
    ` fill="${options.fill ?? INK}">${escapeText(options.content)}</text>`
  );
}

/**
 * A finished drawing of its own natural size, drawn into `box` instead: an outer `<svg>` with the
 * natural view box and `preserveAspectRatio="xMidYMid meet"`, so the picture shrinks, stays centred
 * and keeps its proportions. The one way in this game to draw finished markup smaller – the shelf of
 * the shop needs the frog (260×320) in a 180×140 cell, and neither the animals nor the decorations
 * take a size (they are written to a fixed box, like `candle.ts` and `cookie.ts`).
 *
 * The result therefore holds a nested `<svg>`, which is valid SVG; the fruit does not go through
 * here at all, because `fruit(kind, height)` has taken a size all along.
 */
export function fitted(
  art: string,
  natural: { readonly width: number; readonly height: number },
  box: Rect,
): string {
  return (
    `<svg viewBox="0 0 ${natural.width} ${natural.height}" width="${box.width}"` +
    ` height="${box.height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${art}</svg>`
  );
}
