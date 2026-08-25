/**
 * The star counter in the top right corner (docs/navrh-hry.md ch. 7): how many orders the child has
 * finished. It is an indicator, never a target – nothing here answers a tap.
 */
import { starsPill } from '../../art/star';
import type { KitchenLayout } from '../../art/layout';
import { createMotion, layer, place } from './dom';

const POP_MS = 320;

export interface StarsHandle {
  /** Shows `count`; with `pop` the pill gives a little jump as the star lands in it. */
  set(count: number, options?: { readonly pop?: boolean }): void;
  layout(layout: KitchenLayout): void;
  destroy(): void;
}

export function createStars(options: { readonly root: HTMLElement }): StarsHandle {
  const el = layer('kitchen-stars');
  options.root.append(el);
  const motion = createMotion();
  let current: KitchenLayout | null = null;
  let count = 0;

  function draw(): void {
    el.innerHTML = starsPill(count);
  }
  draw();

  return {
    set(next, setOptions) {
      count = next;
      draw();
      if (!setOptions?.pop) return;
      motion.animate(
        el,
        [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
        { duration: POP_MS, easing: 'ease-out' },
      );
    },
    layout(next) {
      current = next;
      place(el, current.stars);
    },
    destroy() {
      motion.cancelAll();
      el.remove();
    },
  };
}
