/**
 * The animal at the counter (docs/navrh-hry.md ch. 6): one element that holds whichever customer is
 * being served, walks it in from the left, chews and walks it out again.
 *
 * The walk is driven by a timer, not by animation events – the same rule the finale follows.
 * `motion.animate()` returns null under `prefers-reduced-motion` and in a browser without the Web
 * Animations API, and a hidden tab freezes the animations that do run; if `onDone` hung off a
 * `finish` event, the child would be left in front of an empty counter with no way on (rule 2).
 * Without the movement the customer simply appears and disappears, and the sounds play regardless.
 */
import type { SfxPlayer } from '../../audio/sfx';
import { customerArt } from '../../art/customers';
import type { KitchenLayout } from '../../art/layout';
import { customerHelloSfx, customerYumSfx } from '../../data/sfx';
import { CUSTOMERS, type CustomerId } from '../../data/customers';
import { createMotion, layer, place } from './dom';

/** Far enough left to clear the box and the stage edge behind it. */
const OFFSTAGE_X = 340;
const WALK_MS = 600;
/** How long the animal chews before it is happy about it. */
const MUNCH_MS = 640;

export interface CustomerHandle {
  /**
   * Stands the animal in place with no walk. DEV only (and the reserve for restoring a reloaded
   * session in STEP-14); the real kitchen opens empty and the child rings the bell.
   */
  show(id: CustomerId): void;
  /** Walks in from the left; `onDone` once it is standing at the counter. */
  arrive(id: CustomerId, onDone: () => void): void;
  /** Walks out to the left and hides; `onDone` once the counter is empty. */
  leave(onDone: () => void): void;
  /** Chewing, plus the bite and the contented sound that goes with it. */
  munch(): void;
  /**
   * Where the cake flies: an absolute point in the scene, from the mouth anchor of whichever
   * animal is standing there. With nobody there it is the middle of the box – the finale never
   * runs without a customer, but the handle must not throw if it ever does.
   */
  mouth(): { readonly x: number; readonly y: number };
  readonly current: CustomerId | null;
  layout(layout: KitchenLayout): void;
  destroy(): void;
}

export function createCustomer(options: {
  readonly root: HTMLElement;
  readonly sfx: SfxPlayer;
}): CustomerHandle {
  const el = layer('kitchen-prop kitchen-customer');
  el.hidden = true;
  options.root.append(el);

  const motion = createMotion();
  let current: KitchenLayout | null = null;
  let who: CustomerId | null = null;
  /** The walk holds its last frame, and `createMotion` forgets an animation once it finishes. */
  let walk: Animation | null = null;

  function draw(): void {
    if (current) place(el, current.customer);
  }

  function stand(id: CustomerId): void {
    if (who !== id) {
      who = id;
      el.innerHTML = customerArt(id);
    }
    draw();
    el.hidden = false;
  }

  function clearWalk(): void {
    walk?.cancel();
    walk = null;
    el.style.removeProperty('transform');
  }

  return {
    show(id) {
      clearWalk();
      stand(id);
    },
    arrive(id, onDone) {
      clearWalk();
      stand(id);
      options.sfx.play('steps');
      walk = motion.animate(
        el,
        [{ transform: `translateX(${-OFFSTAGE_X}px)` }, { transform: 'translateX(0px)' }],
        { duration: WALK_MS, easing: 'ease-out' },
      );
      motion.after(WALK_MS, () => {
        clearWalk();
        options.sfx.play(customerHelloSfx(id));
        onDone();
      });
    },
    leave(onDone) {
      clearWalk();
      if (!who) {
        onDone();
        return;
      }
      options.sfx.play('steps');
      walk = motion.animate(
        el,
        [{ transform: 'translateX(0px)' }, { transform: `translateX(${-OFFSTAGE_X}px)` }],
        { duration: WALK_MS, easing: 'ease-in', fill: 'forwards' },
      );
      motion.after(WALK_MS, () => {
        el.hidden = true; // hide first: removing the transform under a visible element would flash
        clearWalk();
        who = null;
        onDone();
      });
    },
    munch() {
      options.sfx.play('munch');
      motion.animate(
        el,
        [
          { transform: 'scale(1, 1)' },
          { transform: 'scale(1.03, 0.96)' },
          { transform: 'scale(0.99, 1.02)' },
          { transform: 'scale(1.02, 0.97)' },
          { transform: 'scale(1, 1)' },
        ],
        { duration: MUNCH_MS, easing: 'ease-in-out' },
      );
      const id = who;
      if (id) motion.after(MUNCH_MS, () => options.sfx.play(customerYumSfx(id)));
    },
    mouth() {
      const box = current?.customer ?? { x: el.offsetLeft, y: el.offsetTop, width: 0, height: 0 };
      const anchor = who ? CUSTOMERS[who].mouth : { x: 0.5, y: 0.5 };
      return { x: box.x + box.width * anchor.x, y: box.y + box.height * anchor.y };
    },
    get current() {
      return who;
    },
    layout(next) {
      current = next;
      draw();
    },
    destroy() {
      motion.cancelAll();
      clearWalk();
      el.remove();
    },
  };
}
