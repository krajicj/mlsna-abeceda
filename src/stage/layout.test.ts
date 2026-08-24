import { describe, expect, it } from 'vitest';
import {
  computeStage,
  isPortrait,
  STAGE_HEIGHT,
  STAGE_MAX_WIDTH,
  STAGE_MIN_WIDTH,
  type Viewport,
} from './layout';

describe('computeStage', () => {
  it('fills the viewport exactly at the supported aspect ratios', () => {
    expect(computeStage({ width: 1024, height: 768 })).toEqual({
      width: 1024,
      height: 768,
      scale: 1,
      renderedWidth: 1024,
      renderedHeight: 768,
    });
    expect(computeStage({ width: 1366, height: 768 })).toMatchObject({ width: 1366, scale: 1 });
  });

  it('clamps the width down on a tall viewport and letterboxes top and bottom', () => {
    const size = computeStage({ width: 1280, height: 1024 });
    expect(size.width).toBe(1024);
    expect(size.scale).toBe(1.25);
    expect(size.renderedHeight).toBe(960); // 32 px bar above and below
  });

  it('clamps the width up on a wide viewport', () => {
    expect(computeStage({ width: 844, height: 390 }).width).toBe(STAGE_MAX_WIDTH);
    expect(computeStage({ width: 2304, height: 768 })).toMatchObject({ width: 1366, scale: 1 });
  });

  it('scales down for a tiny viewport', () => {
    expect(computeStage({ width: 320, height: 240 })).toMatchObject({ width: 1024, scale: 0.3125 });
  });

  it('never renders outside the viewport', () => {
    const viewports: Viewport[] = [
      { width: 844, height: 390 }, // phone, landscape
      { width: 926, height: 428 },
      { width: 1024, height: 768 }, // tablet, landscape
      { width: 1180, height: 820 },
      { width: 1280, height: 800 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 }, // laptop
      { width: 1920, height: 1080 },
      { width: 2304, height: 768 }, // extreme ratio
      { width: 390, height: 844 }, // portrait (the overlay covers it)
    ];
    for (const viewport of viewports) {
      const size = computeStage(viewport);
      expect(size.renderedWidth).toBeLessThanOrEqual(viewport.width + 0.5);
      expect(size.renderedHeight).toBeLessThanOrEqual(viewport.height + 0.5);
      expect(size.width).toBeGreaterThanOrEqual(STAGE_MIN_WIDTH);
      expect(size.width).toBeLessThanOrEqual(STAGE_MAX_WIDTH);
      expect(Number.isInteger(size.width)).toBe(true);
      expect(size.scale).toBeGreaterThan(0);
      expect(size.height).toBe(STAGE_HEIGHT);
    }
  });

  it('survives a nonsensical viewport', () => {
    const broken: Viewport[] = [
      { width: 0, height: 0 },
      { width: -5, height: 10 },
      { width: Number.NaN, height: 768 },
      { width: 1024, height: Number.POSITIVE_INFINITY },
    ];
    for (const viewport of broken) {
      const size = computeStage(viewport);
      expect(Number.isFinite(size.scale)).toBe(true);
      expect(size.scale).toBeGreaterThan(0);
      expect(size.width).toBeGreaterThanOrEqual(STAGE_MIN_WIDTH);
      expect(size.width).toBeLessThanOrEqual(STAGE_MAX_WIDTH);
    }
    expect(computeStage({ width: 0, height: 0 })).toMatchObject({ width: 1024, scale: 1 });
  });
});

describe('isPortrait', () => {
  it('is true only when the viewport is taller than wide', () => {
    expect(isPortrait({ width: 390, height: 844 })).toBe(true);
    expect(isPortrait({ width: 844, height: 390 })).toBe(false);
    expect(isPortrait({ width: 500, height: 500 })).toBe(false);
  });
});
