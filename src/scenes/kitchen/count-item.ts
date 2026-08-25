/**
 * The counting item in the kitchen (docs/navrh-hry.md ch. 5.5): the child taps the fruit in the
 * bowl, a piece flies onto the cake and one more circle above it fills in. The state lives in
 * `game/counting.ts`, the geometry in `art/layout.ts`; this module only turns them into elements,
 * animations and cues. Nothing here can block the child – an extra tap only wobbles the lid.
 */
import type { AudioEngine } from '../../audio/context';
import { playCue } from '../../audio/tones';
import type { VoicePlayer } from '../../audio/voice';
import { fruitBowl } from '../../art/bowl';
import { fruit } from '../../art/fruit';
import { hintRing } from '../../art/hint';
import {
  bowlFruitSpots,
  CAKE_FRUIT_HEIGHT,
  cakeFruitSlots,
  FRUIT_SLOT,
  lidRect,
  pillSlots,
  type BowlSpot,
  type CakeSlot,
  type KitchenLayout,
} from '../../art/layout';
import { bowlLid } from '../../art/lid';
import { countPill } from '../../art/pill';
import type { FruitKind } from '../../data/curriculum';
import { addFruit, createCounting, type CountingState } from '../../game/counting';
import { createIdleWatcher, type IdleWatcher } from '../../game/idle';
import type { OrderItem } from '../../game/orders';
import {
  countSpeech,
  enoughSpeech,
  orderSpeech,
  repeatSpeech,
  type PraisePicker,
} from '../../game/speech';
import { createMotion, layer, place, prefersReducedMotion } from './dom';

const FLIGHT_MS = 420;
/** A breath between the last piece landing and the lid, so the child sees the cake finished. */
const LID_DELAY_MS = 250;
const BLINK_MS = 960;
const BOUNCE_MS = 260;
const POP_MS = 260;
/** A beat before the order is spoken, so the sentence does not start over the scene fading in. */
const SPEAK_DELAY_MS = 350;
/** From the last piece landing to the praise – long enough for "Tři." to be out of the way. */
const PRAISE_DELAY_MS = 900;
/** The praise waits for a line that is still running instead of cutting it in half. */
const PRAISE_RETRY_MS = 250;
/** …but not forever: after this much waiting it is said anyway (rule 2 – it is never dropped). */
const PRAISE_MAX_WAITS = 16;

/** What the narrator was asked to order – the amount is the clamped one, not the raw input. */
type CountOrder = Extract<OrderItem, { readonly type: 'count' }>;

export interface CountItemHandle {
  /** Starts the item over: `amount` pieces of `kind`, empty cake, open bowl. */
  start(amount: number, kind: FruitKind): void;
  /** No counting item in this order (STEP-09 onwards): the kitchen goes back to being a picture. */
  clear(): void;
  /** Called after every stage resize; re-places everything from the new layout. */
  layout(layout: KitchenLayout): void;
  state(): CountingState | null;
  destroy(): void;
}

/**
 * `bowl` is the element the kitchen scene positions; the item owns what is drawn inside it, because
 * the fruit in the bowl has to match the order and it is what the child taps.
 */
export function createCountItem(options: {
  readonly root: HTMLElement;
  readonly bowl: HTMLElement;
  readonly audio: AudioEngine;
  readonly voice: VoicePlayer;
  readonly praise: PraisePicker;
}): CountItemHandle {
  const cakeFruitLayer = layer('count-fruit');
  const pillLayer = layer('count-pills');
  const targetEl = layer('count-target');
  const lidEl = layer('count-lid');
  const hintEl = layer('count-hint');
  const flightLayer = layer('count-flight');
  lidEl.innerHTML = bowlLid();
  hintEl.innerHTML = hintRing(FRUIT_SLOT);
  lidEl.hidden = true;
  hintEl.hidden = true;
  options.root.append(cakeFruitLayer, pillLayer, targetEl, lidEl, hintEl, flightLayer);

  /**
   * The whole bowl is one target (návrh 4: "klepnutí na věc", 5.5: "klepne na misku"). Every piece
   * of fruit the bowl shows is therefore tappable, including the smaller ones in the back row –
   * with a hit box per piece the child would keep hitting the gaps between them.
   */
  targetEl.addEventListener('pointerdown', (event) => {
    if (event.isPrimary === false) return; // tap only – no second finger, no drag (rule 3)
    onTap(event);
  });

  const motion = createMotion();
  let current: KitchenLayout | null = null;
  let state: CountingState | null = null;
  let kind: FruitKind = 'strawberry';
  let landed: HTMLDivElement[] = [];
  let pills: HTMLDivElement[] = [];
  let spoken: CountOrder | null = null;
  /** Own handle: the praise has to be postponed on its own, `motion.after()` cancels everything. */
  let praiseTimer: number | null = null;
  let praiseWaits = 0;

  function speakOrder(): void {
    const item = spoken;
    if (!item) return;
    motion.after(SPEAK_DELAY_MS, () => options.voice.say(orderSpeech(item)));
  }

  /** The nudge and the hint both repeat the order – there is no "tap the bowl" clip to play. */
  function repeatOrder(): void {
    if (spoken) options.voice.say(repeatSpeech(spoken));
  }

  function clearPraise(): void {
    if (praiseTimer !== null) window.clearTimeout(praiseTimer);
    praiseTimer = null;
  }

  function armPraise(delayMs: number): void {
    clearPraise();
    praiseTimer = window.setTimeout(() => {
      praiseTimer = null;
      // "Už máme tři jahody, to stačí!" must finish first; the praise only moves back, it is
      // never dropped – and the waiting is capped so a stuck line cannot swallow it either.
      if (options.voice.speaking && praiseWaits < PRAISE_MAX_WAITS) {
        praiseWaits += 1;
        armPraise(PRAISE_RETRY_MS);
        return;
      }
      options.voice.say(options.praise.next());
    }, delayMs);
  }

  /**
   * One watcher per item: `stop()` is final by design (the item is over and nothing may nudge the
   * child any more), so starting the next item builds a fresh one.
   */
  let idle: IdleWatcher = watcher();

  function watcher(): IdleWatcher {
    return createIdleWatcher({
      onRemind: () => {
        blinkPills();
        repeatOrder();
      },
      onHint: () => {
        if (state === null || state.done) return;
        showHint();
        repeatOrder();
      },
    });
  }

  function renderPill(index: number): void {
    const pill = pills[index];
    if (!pill || !state) return;
    pill.innerHTML = countPill({ digit: String(index + 1), done: index < state.placed });
  }

  function drawPills(): void {
    const counting = state;
    pills = counting
      ? Array.from({ length: counting.target }, (_, index) => {
          const pill = layer('count-pill');
          pill.innerHTML = countPill({ digit: String(index + 1), done: index < counting.placed });
          return pill;
        })
      : [];
    pillLayer.replaceChildren(...pills);
  }

  function placeAll(): void {
    if (!current) return;
    place(targetEl, current.bowl);
    targetEl.hidden = state === null;
    const first = spots()[0];
    if (first) {
      place(hintEl, {
        x: first.cx - FRUIT_SLOT / 2,
        y: first.cy - FRUIT_SLOT / 2,
        width: FRUIT_SLOT,
        height: FRUIT_SLOT,
      });
    }
    place(lidEl, lidRect(current.bowl));
    pillSlots(current.cake, pills.length).forEach((slot, index) => {
      const pill = pills[index];
      if (pill) place(pill, slot);
    });
    cakeSlots().forEach((slot, index) => {
      const piece = landed[index];
      if (piece) place(piece, slot);
    });
  }

  function cakeSlots(): CakeSlot[] {
    return current && state ? cakeFruitSlots(current.cake, state.target) : [];
  }

  function spots(): BowlSpot[] {
    return current ? bowlFruitSpots(current.bowl) : [];
  }

  /** Which piece of fruit the finger landed on – the nearest one, so no tap is ever wasted. */
  function spotAt(event: PointerEvent): number {
    const box = targetEl.getBoundingClientRect();
    const all = spots();
    if (!current || box.width === 0 || all.length === 0) return 0;
    const scale = box.width / current.bowl.width;
    const x = current.bowl.x + (event.clientX - box.left) / scale;
    const y = current.bowl.y + (event.clientY - box.top) / scale;
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    all.forEach((spot, index) => {
      const distance = (spot.cx - x) ** 2 + (spot.cy - y) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  }

  function land(index: number): void {
    const slot = cakeSlots()[index];
    if (!slot) return;
    const piece = layer('count-fruit-piece');
    piece.innerHTML = fruit(kind, CAKE_FRUIT_HEIGHT);
    piece.style.zIndex = slot.back ? '0' : '1';
    place(piece, slot);
    landed[index] = piece;
    cakeFruitLayer.append(piece);
    renderPill(index);
    const pill = pills[index];
    if (pill) {
      motion.animate(
        pill,
        [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
        {
          duration: POP_MS,
          easing: 'ease-out',
        },
      );
    }
  }

  function fly(from: BowlSpot, index: number, onLanded: () => void): void {
    const slot = cakeSlots()[index];
    if (!slot) return;
    const flyer = layer('count-flyer');
    flyer.innerHTML = fruit(kind, CAKE_FRUIT_HEIGHT);
    place(flyer, slot);
    flightLayer.append(flyer);
    const dx = from.cx - (slot.x + slot.width / 2);
    const dy = from.cy - (slot.y + slot.height / 2);
    const scale = from.height / CAKE_FRUIT_HEIGHT;
    const animation = motion.animate(
      flyer,
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
        {
          transform: `translate(${dx / 2}px, ${dy / 2 - 46}px) scale(${(scale + 1) / 2})`,
          offset: 0.5,
        },
        { transform: 'translate(0px, 0px) scale(1)' },
      ],
      { duration: FLIGHT_MS, easing: 'cubic-bezier(0.3, 0, 0.3, 1)' },
    );
    let settled = false;
    const arrive = (): void => {
      if (settled) return;
      settled = true;
      flyer.remove();
      onLanded();
    };
    if (!animation) {
      arrive();
      return;
    }
    animation.addEventListener('finish', arrive);
    animation.addEventListener('cancel', () => {
      settled = true;
      flyer.remove();
    });
    // A hidden document freezes Web Animations and `finish` may never arrive; without this the
    // piece would hang in the air and the counter would never fill in (see stage/scenes.ts).
    motion.after(FLIGHT_MS + 120, arrive);
  }

  /** The tapped piece stays in the bowl (it never runs out) and only bows to say "taken". */
  function bounceBowlFruit(index: number): void {
    const piece = options.bowl.querySelector(`[data-spot="${index}"] .art-fruit-body`);
    if (!piece) return;
    motion.animate(
      piece,
      [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }],
      {
        duration: BOUNCE_MS,
        easing: 'ease-out',
      },
    );
  }

  function blinkPills(): void {
    if (prefersReducedMotion()) return;
    pillLayer.classList.add('is-blinking');
    motion.after(BLINK_MS, () => pillLayer.classList.remove('is-blinking'));
  }

  function showHint(): void {
    if (state === null || state.done) return;
    hintEl.hidden = false;
    playCue(options.audio, 'pling', { step: 0 });
  }

  function hideHint(): void {
    hintEl.hidden = true;
    pillLayer.classList.remove('is-blinking');
  }

  function closeLid(): void {
    lidEl.hidden = false;
    // A covered bowl shows no fruit: the dome dips at its ends, so a stem would poke out over it.
    options.bowl.classList.add('is-covered');
    playCue(options.audio, 'done');
    motion.animate(
      lidEl,
      [
        { transform: 'translateY(-26px)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 },
      ],
      {
        duration: 260,
        easing: 'ease-out',
      },
    );
    for (const pill of pills) {
      motion.animate(
        pill,
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-8px)' },
          { transform: 'translateY(0)' },
        ],
        {
          duration: 300,
          easing: 'ease-out',
        },
      );
    }
  }

  function wobbleLid(): void {
    motion.animate(
      lidEl,
      [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-3.5deg)' },
        { transform: 'rotate(3deg)' },
        { transform: 'rotate(0deg)' },
      ],
      { duration: 380, easing: 'ease-in-out' },
    );
    for (const pill of pills) {
      motion.animate(
        pill,
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-6px)' },
          { transform: 'translateY(0)' },
        ],
        {
          duration: 300,
          easing: 'ease-out',
        },
      );
    }
  }

  function onTap(event: PointerEvent): void {
    if (!state || !current) return;
    const index = spotAt(event);
    hideHint();
    const step = addFruit(state);
    state = step.state;
    if (step.result === 'too-many') {
      wobbleLid();
      playCue(options.audio, 'nope');
      options.voice.say(enoughSpeech(state.target, kind));
      if (praiseTimer !== null) {
        praiseWaits = 0;
        armPraise(PRAISE_DELAY_MS); // the praise waits for "to stačí" and comes after it
      }
      return; // the watcher stopped when the item was finished – nothing left to remind about
    }
    const completed = step.result === 'completed';
    if (completed) idle.stop();
    else idle.poke();
    const placedIndex = state.placed - 1;
    const source = spots()[index];
    if (!source) return;
    playCue(options.audio, 'whoosh');
    bounceBowlFruit(index);
    fly(source, placedIndex, () => {
      land(placedIndex);
      playCue(options.audio, 'pling', { step: placedIndex });
      options.voice.say(countSpeech(placedIndex + 1));
      if (!completed) return;
      motion.after(LID_DELAY_MS, closeLid);
      praiseWaits = 0;
      armPraise(PRAISE_DELAY_MS);
    });
  }

  function reset(): void {
    motion.cancelAll();
    idle.stop();
    clearPraise();
    landed = [];
    options.bowl.classList.remove('is-covered');
    cakeFruitLayer.replaceChildren();
    flightLayer.replaceChildren();
    lidEl.hidden = true;
    hideHint();
  }

  return {
    start(amount, nextKind) {
      reset();
      state = createCounting(amount);
      kind = nextKind;
      spoken = { type: 'count', fruit: kind, amount: state.target };
      options.bowl.innerHTML = fruitBowl({ kind });
      drawPills();
      placeAll();
      idle = watcher();
      idle.poke();
      speakOrder();
    },
    clear() {
      reset();
      state = null;
      spoken = null;
      kind = 'strawberry';
      options.bowl.innerHTML = fruitBowl();
      drawPills();
      placeAll();
    },
    layout(next) {
      current = next;
      placeAll();
    },
    state: () => state,
    destroy() {
      reset();
      for (const el of [cakeFruitLayer, pillLayer, targetEl, lidEl, hintEl, flightLayer]) {
        el.remove();
      }
    },
  };
}
