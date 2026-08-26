/**
 * The bell on the counter (docs/navrh-hry.md ch. 4). It is the only way to the next order, which is
 * the point: the child decides when the kitchen starts again, not a timer.
 *
 * It never leaves the counter – things in a kitchen do not vanish – it falls asleep instead: while
 * an order is running it is dimmed and deaf, so a stray tap cannot queue a second customer, and
 * when the counter is clear it wakes up in full colour with a little pop. The child learns one
 * rule by looking, without a word of text: bright bell, ring it.
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

/** The hop that answers the tap; the bell goes to sleep once it lands. */
const RING_MS = 320;
const POP_MS = 220;
const NUDGE_MS = 420;

export interface BellHandle {
  /** Wakes up: full colour, ready for a tap, watching for silence. */
  show(): void;
  /** Falls asleep: dimmed and deaf, still standing on the counter. */
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
  const el = layer('kitchen-prop kitchen-bell is-asleep');
  el.innerHTML = bell();
  const hintEl = layer('kitchen-bell-hint');
  hintEl.innerHTML = hintRing(BELL_SIZE);
  hintEl.hidden = true;
  options.root.append(el, hintEl);

  const motion = createMotion();
  let current: KitchenLayout | null = null;
  /** One ring per waking: a second tap during the walk-in must not order a second customer. */
  let armed = false;
  /** The bell is still hopping after a tap; `hide()` then lets the hop finish before dimming. */
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
        { transform: 'translateY(0px) scale(1)' },
        { transform: 'translateY(-18px) scale(1.1)', offset: 0.35 },
        { transform: 'translateY(0px) scale(0.97)', offset: 0.75 },
        { transform: 'translateY(0px) scale(1)' },
      ],
      { duration: RING_MS, easing: 'ease-out' },
    );
    motion.after(RING_MS, () => {
      ringing = false;
      el.classList.add('is-asleep');
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
      el.classList.remove('is-asleep');
      draw();
      // Scale only, never opacity: a frozen animation (hidden tab) must not be able to leave the
      // bell invisible. Whether it can be seen is the class's job, movement is only decoration.
      motion.animate(
        el,
        [
          { transform: 'scale(0.7)' },
          { transform: 'scale(1.06)', offset: 0.7 },
          { transform: 'scale(1)' },
        ],
        { duration: POP_MS, easing: 'ease-out' },
      );
      idle.poke();
    },
    hide() {
      armed = false;
      idle.pause();
      hintEl.hidden = true;
      if (ringing) return; // the hop puts itself to sleep when it lands
      motion.cancelAll();
      el.classList.add('is-asleep');
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
