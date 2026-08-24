/**
 * Pure stage geometry (no DOM). The stage is always STAGE_HEIGHT logical pixels tall; its width
 * follows the viewport aspect ratio, clamped to [STAGE_MIN_WIDTH, STAGE_MAX_WIDTH]. Scenes are
 * laid out in these logical pixels and fitted into the window by a single CSS transform.
 */
export const STAGE_HEIGHT = 768;
export const STAGE_MIN_WIDTH = 1024;
export const STAGE_MAX_WIDTH = 1366;

export interface Viewport {
  width: number;
  height: number;
}

export interface StageSize {
  /** Logical width, integer, clamped to [STAGE_MIN_WIDTH, STAGE_MAX_WIDTH]. */
  width: number;
  /** Always STAGE_HEIGHT. */
  height: number;
  /** CSS transform scale that fits the stage into the viewport. Always finite and > 0. */
  scale: number;
  /** width * scale – never larger than viewport.width (rounding aside). */
  renderedWidth: number;
  /** height * scale – never larger than viewport.height (rounding aside). */
  renderedHeight: number;
}

/** A viewport can report 0, a negative number or NaN (hidden tab, detached frame): fall back. */
function finiteSize(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function clamp(min: number, value: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Pure: viewport in CSS px → logical stage size and its scale. Never throws. */
export function computeStage(viewport: Viewport): StageSize {
  const w = finiteSize(viewport.width, STAGE_MIN_WIDTH);
  const h = finiteSize(viewport.height, STAGE_HEIGHT);
  const width = clamp(STAGE_MIN_WIDTH, Math.round(STAGE_HEIGHT * (w / h)), STAGE_MAX_WIDTH);
  const scale = Math.min(w / width, h / STAGE_HEIGHT);
  return {
    width,
    height: STAGE_HEIGHT,
    scale,
    renderedWidth: width * scale,
    renderedHeight: STAGE_HEIGHT * scale,
  };
}

/** Pure: true when the viewport is taller than wide (the rotate overlay shows). */
export function isPortrait(viewport: Viewport): boolean {
  return finiteSize(viewport.height, STAGE_HEIGHT) > finiteSize(viewport.width, STAGE_MIN_WIDTH);
}
