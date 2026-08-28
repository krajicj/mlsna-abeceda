/**
 * The star counter in the top right corner (docs/navrh-hry.md ch. 7): how many orders the child has
 * finished. Since STEP-16 it is also the door to the shop – the basket sits inside the pill, next to
 * the number, so the stars and the place they are spent are one thing on the screen and the kitchen
 * did not have to move a pixel to make room for a button.
 *
 * The basket sleeps and wakes with the bell: while an order is running it is dimmed and the pill is
 * deaf, with an empty counter it lights up. Nothing is redrawn but the basket, so nothing jumps when
 * a customer walks out.
 *
 * The target is the whole strip between the top of the stage and the digit shelf (`starsHitSlot()`),
 * 160×84 – four pixels under rule 3, a deviation the author took knowingly rather than re-arrange
 * the kitchen (docs/steps/STEP-16-shop-scene-and-decorations.md).
 */
import { starsPill } from '../../art/star';
import { starsHitSlot, type KitchenLayout } from '../../art/layout';
import { createMotion, layer, place } from './dom';

const POP_MS = 320;

export interface StarsHandle {
  /** Shows `count`; with `pop` the pill gives a little jump as the star lands in it. */
  set(count: number, options?: { readonly pop?: boolean }): void;
  /** Wakes the basket up or puts it to sleep – shopping is only possible with an empty counter. */
  shop(ready: boolean): void;
  layout(layout: KitchenLayout): void;
  destroy(): void;
}

export function createStars(options: {
  readonly root: HTMLElement;
  /** A tap on the woken pill; a sleeping one does not answer at all. */
  readonly onShop: () => void;
}): StarsHandle {
  const el = layer('kitchen-stars');
  const pill = layer('kitchen-stars-pill');
  el.append(pill);
  options.root.append(el);
  const motion = createMotion();
  let current: KitchenLayout | null = null;
  let count = 0;
  /** The kitchen opens with an order or a shutter as often as with a free counter: asleep first. */
  let ready = false;

  function draw(): void {
    pill.innerHTML = starsPill(count, { basket: ready ? 'ready' : 'asleep' });
  }
  draw();

  el.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (!ready) return;
    options.onShop();
  });

  return {
    set(next, setOptions) {
      count = next;
      draw();
      if (!setOptions?.pop) return;
      motion.animate(
        pill,
        [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
        { duration: POP_MS, easing: 'ease-out' },
      );
    },
    shop(next) {
      if (next === ready) return;
      ready = next;
      el.classList.toggle('is-ready', ready);
      draw();
    },
    layout(next) {
      current = next;
      // The element is the hit box, so it is taller than the drawing; the pill hangs inside it at
      // the place `kitchenLayout()` gives it, and the star still flies exactly into `starSlot()`.
      const hit = starsHitSlot(current.stars);
      place(el, hit);
      place(pill, {
        x: 0,
        y: current.stars.y - hit.y,
        width: current.stars.width,
        height: current.stars.height,
      });
    },
    destroy() {
      motion.cancelAll();
      el.remove();
    },
  };
}
