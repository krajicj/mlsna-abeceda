/**
 * The backdrop: counter, its front with the doors, the floor and the two wall shelves. One SVG
 * drawn at 1:1 with the stage, redrawn whenever the stage width changes – that keeps every
 * outline exactly 4 px wide instead of stretching a tiled background.
 *
 * The doors of the counter are drawn here as they always were; a bought radio takes one of them
 * out and stands in the opening, which `scenes/kitchen/decor.ts` draws over this (STEP-16).
 */
import { STAGE_HEIGHT } from '../stage/layout';
import {
  COUNTER_EDGE_TOP,
  COUNTER_FRONT_TOP,
  COUNTER_TOP,
  FLOOR_TILE_HEIGHT,
  FLOOR_TILE_WIDTH,
  FLOOR_TOP,
  SHELF_BOARD,
  clampStageWidth,
  counterPanels,
  floorColumns,
  kitchenLayout,
} from './layout';
import { PALETTE, stroke, svg, type Rect } from './svg';

/** A shelf: the board plus the two brackets hanging under it. */
function shelf(board: Rect): string {
  const bottom = board.y + board.height;
  const top = bottom - SHELF_BOARD;
  const right = board.x + board.width;
  return `
    <path d="M${board.x + 30} ${bottom + 2} L${board.x + 30} ${bottom + 28} L${board.x + 4} ${bottom + 2} Z" fill="${PALETTE.woodDark}" ${stroke(3)}></path>
    <path d="M${right - 30} ${bottom + 2} L${right - 30} ${bottom + 28} L${right - 4} ${bottom + 2} Z" fill="${PALETTE.woodDark}" ${stroke(3)}></path>
    <rect x="${board.x}" y="${top}" width="${board.width}" height="${SHELF_BOARD}" rx="4" fill="${PALETTE.wood}" ${stroke(4)}></rect>
  `;
}

function floor(width: number): string {
  const columns = floorColumns(width);
  const tiles = [0, 1]
    .map((row) =>
      Array.from({ length: columns }, (_, column) => {
        const fill = (column + row) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
        const x = column * FLOOR_TILE_WIDTH;
        const y = FLOOR_TOP + 4 + row * FLOOR_TILE_HEIGHT;
        return `<rect x="${x}" y="${y}" width="${FLOOR_TILE_WIDTH}" height="${FLOOR_TILE_HEIGHT}" fill="${fill}"></rect>`;
      }).join(''),
    )
    .join('');
  return `
    <rect x="0" y="${FLOOR_TOP}" width="${width}" height="${STAGE_HEIGHT - FLOOR_TOP}" fill="${PALETTE.floorB}"></rect>
    ${tiles}
    <path d="M0 ${FLOOR_TOP + 2} H${width}" ${stroke(4)}></path>
  `;
}

function counter(width: number): string {
  const panels = counterPanels(width)
    .map(
      (panel) => `
      <rect x="${panel.x}" y="${panel.y}" width="${panel.width}" height="${panel.height}" rx="12" fill="${PALETTE.mintLight}" ${stroke(4)}></rect>
      <circle cx="${panel.x + panel.width - 24}" cy="${panel.y + panel.height / 2}" r="8" fill="${PALETTE.wood}" ${stroke(3)}></circle>
    `,
    )
    .join('');
  return `
    <rect x="0" y="${COUNTER_FRONT_TOP}" width="${width}" height="${FLOOR_TOP - COUNTER_FRONT_TOP}" fill="${PALETTE.mint}"></rect>
    ${panels}
  `;
}

/** The worktop, drawn last so the bear's belly and the counter front disappear behind it. */
function worktop(width: number): string {
  return `
    <rect x="0" y="${COUNTER_EDGE_TOP + 2}" width="${width}" height="12" fill="${PALETTE.woodDark}"></rect>
    <rect x="0" y="${COUNTER_TOP}" width="${width}" height="${COUNTER_EDGE_TOP - COUNTER_TOP}" fill="${PALETTE.wood}"></rect>
    <rect x="0" y="${COUNTER_TOP + 8}" width="${width}" height="8" fill="${PALETTE.woodLight}"></rect>
    <path d="M0 ${COUNTER_TOP + 2} H${width}" ${stroke(4)}></path>
    <path d="M0 ${COUNTER_EDGE_TOP} H${width}" ${stroke(4)}></path>
  `;
}

/** Everything the scene never taps: counter, floor and shelves for the given stage width. */
export function kitchenBackdrop(stageWidth: number): string {
  const width = clampStageWidth(stageWidth);
  const layout = kitchenLayout(width);
  return svg({
    viewBox: `0 0 ${width} ${STAGE_HEIGHT}`,
    width,
    height: STAGE_HEIGHT,
    className: 'kitchen-backdrop-svg',
    children: `
      ${shelf(layout.shelfDigits)}
      ${shelf(layout.shelfLetters)}
      ${counter(width)}
      ${floor(width)}
      ${worktop(width)}
    `,
  });
}
