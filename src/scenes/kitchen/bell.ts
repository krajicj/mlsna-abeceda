/**
 * The bell on the counter (docs/navrh-hry.md ch. 4). It is the only way to the next order, which is
 * the point: the child decides when the kitchen starts again, not a timer. It appears once the
 * counter is clear and disappears the moment it is rung, so during an order there is nothing there
 * to tap by mistake.
 *
 * Nobody is ever told about it straight away – after 15 s of silence it hops and the narrator asks
 * for it, after another 25 s a hint ring shows up around it, and the cycle starts over. The game
 * cannot get stuck (rule 2) and the child is not nagged from the first second either.
 */
import type { SfxPlayer } from '../../audio/sfx';
import type { VoicePlayer } from '../../audio/voice';
import { bell } from '../../art/bell';
import { hintRing } from '../../art/hint';
import { BELL_SIZE, type KitchenLayout } from '../../art/layout';
import { createIdleWatcher, type IdleWatcher } from '../../game/idle';
import type { LinePicker } from '../../game/speech';
import { createMotion, layer, place } from './dom';

/** The hop that answers the tap; the bell fades out over the same time. */
const RING_MS = 260;
const POP_MS = 220;
const NUDGE_MS = 420;

export interface BellHandle {
  /** Shows up on the counter and starts watching for silence. */
  show(): void;
  /** Goes away and stops watching; a tap where it used to be does nothing. */
  hide(): void;
  layout(layout: KitchenLayout): void;
  destroy(): void;
}

export function createBellHandle(options: {
  readonly root: HTMLElement;
  readonly sfx: SfxPlayer;
  readonly voice: VoicePlayer;
  readonly line: LinePicker;
  /** The child rang: bring the next customer. Fires once per `show()`. */
  readonly onRing: () => void;
}): BellHandle {
  const el = layer('kitchen-prop kitchen-bell');
  el.innerHTML = bell();
  el.hidden = true;
  const hintEl = layer('kitchen-bell-hint');
  hintEl.innerHTML = hintRing(BELL_SIZE);
  hintEl.hidden = true;
  options.root.append(el, hintEl);

  const motion = createMotion();
  let current: KitchenLayout | null = null;
  /** One ring per appearance: a second tap during the walk-in must not order a second customer. */
  let armed = false;
  /** The bell is fading out after a tap; `hide()` then lets the animation finish. */
  let ringing = false;

  const idle: IdleWatcher = createIdleWatcher({
    onRemind: () => {
      hop();
      options.voice.say(options.line.next());
    },
    onHint: () => {
      hintEl.hidden = false;
      options.voice.say(options.line.next());
    },
  });

  function draw(): void {
    if (!current) return;
    place(el, current.bell);
    place(hintEl, current.bell);
  }

  function hop(): void {
    motion.animate(
      el,
      [
        { transform: 'translateY(0px)' },
        { transform: 'translateY(-14px)' },
        { transform: 'translateY(0px)' },
      ],
      { duration: NUDGE_MS, easing: 'ease-out' },
    );
  }

  function ring(): void {
    if (!armed) return;
    armed = false;
    ringing = true;
    idle.stop();
    hintEl.hidden = true;
    // The nudge must not talk over the customer that is already walking in.
    options.voice.stop();
    options.sfx.play('bell');
    motion.animate(
      el,
      [
        { transform: 'translateY(0px) scale(1)', opacity: 1 },
        { transform: 'translateY(-16px) scale(1.08)', opacity: 1, offset: 0.4 },
        { transform: 'translateY(-4px) scale(0.9)', opacity: 0 },
      ],
      { duration: RING_MS, easing: 'ease-out' },
    );
    motion.after(RING_MS, () => {
      ringing = false;
      el.hidden = true;
      el.style.removeProperty('opacity');
    });
    options.onRing();
  }

  el.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    ring();
  });

  return {
    show() {
      motion.cancelAll();
      ringing = false;
      armed = true;
      hintEl.hidden = true;
      el.style.removeProperty('opacity');
      el.hidden = false;
      draw();
      motion.animate(
        el,
        [
          { transform: 'scale(0.6)', opacity: 0 },
          { transform: 'scale(1.06)', opacity: 1, offset: 0.7 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        { duration: POP_MS, easing: 'ease-out' },
      );
      idle.poke();
    },
    hide() {
      armed = false;
      idle.pause();
      hintEl.hidden = true;
      if (ringing) return; // let the tap finish its own way out
      motion.cancelAll();
      el.hidden = true;
      el.style.removeProperty('opacity');
    },
    layout(next) {
      current = next;
      draw();
    },
    destroy() {
      idle.stop();
      motion.cancelAll();
      el.remove();
      hintEl.remove();
    },
  };
}
