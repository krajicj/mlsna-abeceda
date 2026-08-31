/**
 * The end of one order (docs/navrh-hry.md ch. 4, 7, 13 point 2): the glaze runs over the cake (or
 * the sauce over the ice cream), the oven pings, confetti flies, the customer takes the thing and
 * eats it, and a star flies into the counter.
 *
 * The sequence is driven by timers, never by animation events. `motion.animate()` returns null under
 * `prefers-reduced-motion` and in a browser without the Web Animations API, and a hidden tab freezes
 * the ones that do run – if the chain hung off `finish` events, the child would be left standing in
 * front of a finished order with no way on (rule 2). The movement is decoration; the clock is what
 * actually gets the loop round.
 */
import type { SfxPlayer } from '../../audio/sfx';
import type { VoicePlayer } from '../../audio/voice';
import { confettiPiece, CONFETTI_COUNT, CONFETTI_SIZE } from '../../art/confetti';
import { starSlot, STARS_PILL_STAR, type KitchenLayout } from '../../art/layout';
import { productTopping } from '../../art/product';
import { star } from '../../art/star';
import type { Rect } from '../../art/svg';
import { plingRate } from '../../data/sfx';
import type { ProductId } from '../../data/products';
import type { CustomerHandle } from './customer';
import type { LinePicker } from '../../game/speech';
import { createMotion, layer, place } from './dom';
import type { StarsHandle } from './stars';

/** The milestones of the sequence, measured from `run()`; see the step plan for the whole table. */
const GLAZE_MS = 380;
const EAT_AT_MS = 820;
const FLIGHT_MS = 560;
const STAR_AT_MS = 1700;
const STAR_FLIGHT_MS = 700;
const COUNT_AT_MS = 2400;
const DONE_AT_MS = 2800;
const CONFETTI_MS = 900;
/** How small the cake gets on its way to the customer – it is being taken away, not shrunk. */
const EATEN_SCALE = 0.55;

export interface FinaleHandle {
  /** The order is done: the topping, confetti, the customer eats, the star flies. */
  run(): void;
  layout(layout: KitchenLayout): void;
  /** Stops a sequence in progress and puts the counter back the way it was (scene exit, DEV). */
  reset(): void;
  destroy(): void;
}

/** Layout box of an element that `place()` positioned – untouched by the scale of the stage. */
function boxOf(el: HTMLElement): Rect {
  return { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight };
}

function centerOf(rect: Rect): { readonly x: number; readonly y: number } {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

export function createFinale(options: {
  readonly root: HTMLElement;
  /** The element the product is drawn in; the glaze is laid over whatever stands there. */
  readonly product: HTMLElement;
  /** What is being made right now – read at `run()`, because it changes with every order. */
  readonly productId: () => ProductId;
  readonly customer: CustomerHandle;
  readonly sfx: SfxPlayer;
  readonly voice: VoicePlayer;
  readonly finish: LinePicker;
  readonly star: LinePicker;
  readonly stars: StarsHandle;
  /** Everything that leaves with the product: the fruit or scoops, the cookie, the candle. */
  readonly plate: () => readonly HTMLElement[];
  /** The star has landed: write the progress and say how many stars there are now. */
  readonly onStar: () => number;
  /** The kitchen may clear the counter and bring the next order. */
  readonly onDone: () => void;
}): FinaleHandle {
  // Under the fruit and the cookie: the glaze runs over the product, it does not cover what is on
  // it. The drawing itself is set at `run()`, because the product changes with every order.
  const glazeEl = layer('finale-glaze');
  glazeEl.hidden = true;
  options.product.insertAdjacentElement('afterend', glazeEl);

  const confettiLayer = layer('finale-confetti');
  const starEl = layer('finale-star');
  // The size it lands at: the star inside the pill, so the flight ends exactly on the drawing.
  starEl.innerHTML = star(STARS_PILL_STAR);
  starEl.hidden = true;
  options.root.append(confettiLayer, starEl);

  const motion = createMotion();
  let current: KitchenLayout | null = null;
  /** Everything the flight put a transform on, so `reset()` knows what to hand back. */
  let flown: HTMLElement[] = [];
  /**
   * The flight animations, kept here on purpose: they hold their last frame (`fill: 'forwards'`)
   * and `createMotion()` forgets an animation the moment it finishes, so `cancelAll()` would leave
   * the product sitting invisible in the customer's mouth for the next order.
   */
  let flight: Animation[] = [];
  let running = false;

  function placeGlaze(): void {
    if (current) place(glazeEl, current.product);
  }

  function showGlaze(): void {
    // Every product draws its topping in its own box, so only the markup changes with the order.
    glazeEl.innerHTML = productTopping(options.productId());
    glazeEl.hidden = false;
    placeGlaze();
    motion.animate(glazeEl, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
      duration: GLAZE_MS,
      easing: 'ease-out',
    });
  }

  function throwConfetti(): void {
    const box = current?.product ?? boxOf(options.product);
    const from = { x: centerOf(box).x, y: box.y - 20 };
    const pieces = Array.from({ length: CONFETTI_COUNT }, (_, index) => {
      const el = layer('finale-confetti-piece');
      el.innerHTML = confettiPiece(index);
      place(el, {
        x: Math.round(from.x - CONFETTI_SIZE / 2),
        y: Math.round(from.y - CONFETTI_SIZE / 2),
        width: CONFETTI_SIZE,
        height: CONFETTI_SIZE,
      });
      return el;
    });
    confettiLayer.replaceChildren(...pieces);
    pieces.forEach((el, index) => {
      // Fixed fan instead of randomness: the same burst every time, and nothing to seed.
      const spread = ((index / (CONFETTI_COUNT - 1)) * 2 - 1) * 190;
      const lift = 120 + (index % 4) * 34;
      const spin = (index % 2 === 0 ? 1 : -1) * (180 + index * 24);
      motion.animate(
        el,
        [
          { transform: 'translate(0px, 0px) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(${spread * 0.6}px, ${-lift}px) rotate(${spin / 2}deg)`,
            opacity: 1,
            offset: 0.45,
          },
          {
            transform: `translate(${spread}px, ${lift * 0.9}px) rotate(${spin}deg)`,
            opacity: 0,
          },
        ],
        { duration: CONFETTI_MS, easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)' },
      );
    });
    motion.after(CONFETTI_MS + 120, () => confettiLayer.replaceChildren());
  }

  /** The product and everything on it travel to the mouth as one group and shrink on the way. */
  function eat(): void {
    flight = [];
    const from = centerOf(boxOf(options.product));
    const to = options.customer.mouth();
    flown = [options.product, glazeEl, ...options.plate()];
    for (const el of flown) {
      const own = centerOf(boxOf(el));
      const dx = to.x + (own.x - from.x) * EATEN_SCALE - own.x;
      const dy = to.y + (own.y - from.y) * EATEN_SCALE - own.y;
      const animation = motion.animate(
        el,
        [
          { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
          {
            transform: `translate(${dx}px, ${dy}px) scale(${EATEN_SCALE})`,
            opacity: 1,
            offset: 0.8,
          },
          { transform: `translate(${dx}px, ${dy}px) scale(${EATEN_SCALE})`, opacity: 0 },
        ],
        { duration: FLIGHT_MS, easing: 'cubic-bezier(0.3, 0, 0.3, 1)', fill: 'forwards' },
      );
      // No animation (reduced motion, no WAAPI): the product simply is not there any more.
      if (animation) flight.push(animation);
      else el.style.opacity = '0';
    }
    options.sfx.play('whoosh');
    motion.after(FLIGHT_MS, () => {
      for (const el of flown) el.style.opacity = '0';
      // The bite, the chewing and the animal's own "yum" all live with the customer: this is the
      // one place that knows WHO is eating.
      options.customer.munch();
    });
  }

  function flyStar(): void {
    if (!current) return;
    const slot = starSlot(current.stars);
    const paw = options.customer.mouth();
    starEl.hidden = false;
    place(starEl, slot);
    const dx = paw.x - (slot.x + slot.width / 2);
    const dy = paw.y - (slot.y + slot.height / 2);
    motion.animate(
      starEl,
      [
        { transform: `translate(${dx}px, ${dy}px) scale(0.6)`, opacity: 0 },
        {
          transform: `translate(${dx / 2}px, ${dy / 2 - 60}px) scale(1.3)`,
          opacity: 1,
          offset: 0.5,
        },
        { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
      ],
      { duration: STAR_FLIGHT_MS, easing: 'cubic-bezier(0.3, 0, 0.3, 1)' },
    );
    options.sfx.play('sparkle');
    options.voice.say(options.star.next());
  }

  function reset(): void {
    motion.cancelAll();
    running = false;
    glazeEl.hidden = true;
    starEl.hidden = true;
    confettiLayer.replaceChildren();
    for (const animation of flight) animation.cancel();
    flight = [];
    for (const el of flown) {
      el.style.removeProperty('transform');
      el.style.removeProperty('opacity');
    }
    flown = [];
  }

  return {
    run() {
      if (running) return; // one finale per order; a second run() would double the star
      running = true;
      showGlaze();
      options.sfx.play('done');
      throwConfetti();
      options.voice.say(options.finish.next());
      motion.after(EAT_AT_MS, eat);
      motion.after(STAR_AT_MS, flyStar);
      motion.after(COUNT_AT_MS, () => {
        options.stars.set(options.onStar(), { pop: true });
        options.sfx.play('pling', { rate: plingRate(4) });
      });
      motion.after(DONE_AT_MS, () => {
        running = false;
        options.onDone();
      });
    },
    layout(next) {
      current = next;
      placeGlaze();
    },
    reset,
    destroy() {
      reset();
      for (const el of [glazeEl, confettiLayer, starEl]) el.remove();
    },
  };
}
