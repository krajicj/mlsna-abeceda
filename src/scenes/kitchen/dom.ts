/**
 * The handful of DOM helpers every kitchen item needs: placing a box from `art/layout.ts`, making
 * a layer, and a registry of timeouts and animations that one `cancelAll()` cleans up. Shared on
 * purpose – a copy of the registry is exactly the thing that drifts apart between two items and
 * leaves a timer running after the scene is gone.
 */
import type { Rect } from '../../art/svg';

export function place(el: HTMLElement, rect: Rect): void {
  el.style.left = `${rect.x}px`;
  el.style.top = `${rect.y}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
}

export function layer(className: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = className;
  return el;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface Motion {
  /** null = reduced motion or a browser without WAAPI; the caller then finishes without movement. */
  animate(el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions): Animation | null;
  after(ms: number, run: () => void): void;
  cancelAll(): void;
}

export function createMotion(): Motion {
  const timeouts = new Set<number>();
  const animations = new Set<Animation>();
  return {
    animate(el, keyframes, keyframeOptions) {
      if (prefersReducedMotion()) return null;
      try {
        const animation = el.animate(keyframes, keyframeOptions);
        animations.add(animation);
        const forget = (): void => void animations.delete(animation);
        animation.addEventListener('finish', forget);
        animation.addEventListener('cancel', forget);
        return animation;
      } catch {
        return null; // no Web Animations API: the game keeps working, just without the movement
      }
    },
    after(ms, run) {
      const id = window.setTimeout(() => {
        timeouts.delete(id);
        run();
      }, ms);
      timeouts.add(id);
    },
    cancelAll() {
      for (const id of timeouts) window.clearTimeout(id);
      timeouts.clear();
      for (const animation of animations) animation.cancel();
      animations.clear();
    },
  };
}
