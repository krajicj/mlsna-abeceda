/** Pictures specific to the primer: learning content lives in tiles, never as UI labels. */
import type { PrimerState } from '../game/primer';
import { INK, PALETTE, stroke, svg } from './svg';

const TILE_FILL: Readonly<Record<PrimerState, string>> = {
  new: PALETTE.wall,
  learning: PALETTE.frosting,
  known: PALETTE.mintLight,
};

export function primerTile(element: string, state: PrimerState): string {
  return svg({
    viewBox: '0 0 96 96',
    width: 96,
    height: 96,
    children: `
      <rect x="4" y="4" width="88" height="88" rx="22" fill="${TILE_FILL[state]}" ${stroke(4)}></rect>
      <text x="48" y="65" text-anchor="middle" fill="${INK}" font-family="Fredoka, sans-serif"
            font-size="${element.length > 1 ? 40 : 54}" font-weight="700">${element}</text>
    `,
  });
}

/** An open book with three abstract letter-shaped marks; it intentionally has no UI text. */
export function primerBookIcon(size: number = 96): string {
  return svg({
    viewBox: '0 0 96 96',
    width: size,
    height: size,
    children: `
      <path d="M48 22 C36 14 20 16 12 24 V72 C24 64 38 64 48 72 C58 64 72 64 84 72 V24 C76 16 60 14 48 22 Z"
            fill="${PALETTE.white}" ${stroke(4)}></path>
      <path d="M48 22 V72" fill="none" ${stroke(3)}></path>
      <path d="M22 52 L28 34 L34 52 M24 45 H32 M57 34 V52 M57 34 H66 Q73 34 73 40 Q73 45 66 45 H57 M57 45 H67 Q74 45 74 52"
            fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
    `,
  });
}

/** The lower-right control: letter shapes are learning content, not a written UI instruction. */
export function primerCaseToggle(lowercase: boolean, size: number = 96): string {
  const selectedX = lowercase ? 50 : 8;
  return svg({
    viewBox: '0 0 96 96',
    width: size,
    height: size,
    children: `
      <rect x="4" y="4" width="88" height="88" rx="22" fill="${PALETTE.white}" ${stroke(4)}></rect>
      <rect x="${selectedX}" y="16" width="38" height="64" rx="15" fill="${PALETTE.mintLight}"></rect>
      <text x="28" y="59" text-anchor="middle" fill="${INK}" font-family="Fredoka, sans-serif" font-size="39" font-weight="700">A</text>
      <text x="69" y="60" text-anchor="middle" fill="${INK}" font-family="Fredoka, sans-serif" font-size="38" font-weight="700">a</text>
    `,
  });
}

/** A quiet panel behind the tiles – the background is art, the tiles carry the interaction. */
export function primerBoardArt(width: number, height: number): string {
  return svg({
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    children: `
      <rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="42" fill="${PALETTE.white}" ${stroke(4)}></rect>
      <path d="M50 420 H${width - 50}" fill="none" stroke="${PALETTE.wallDot}" stroke-width="4" stroke-linecap="round"></path>
    `,
  });
}
