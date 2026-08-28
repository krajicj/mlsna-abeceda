/**
 * The closed kitchen (docs/navrh-hry.md ch. 4). After the tenth order of a sitting a roller shutter
 * comes down over the whole scene the way a shop in a mall closes, a kitchen timer hangs on it and
 * counts the hour down, and that is the whole message – no text anywhere (rule 1). The child
 * cannot lose anything by it (rule 2): nothing is taken away, the kitchen simply opens again.
 *
 * The padlock in the corner is a stand-in for the parent corner (STEP-19): the code `PARENT_CODE`
 * starts a new sitting and lifts the shutter at once, so a closed kitchen is not a dead end for the
 * grown-up either.
 *
 * Whether the kitchen is closed is decided by the saved record, not by this handle – it only reads
 * `state()` afresh every time, so a reload cannot walk around the shutter.
 */
import type { SfxPlayer } from '../../audio/sfx';
import type { VoicePlayer } from '../../audio/voice';
import { kitchenTimer } from '../../art/clock';
import {
  clampStageWidth,
  closedLayout,
  codeSlot,
  keypadKeys,
  CLOCK_SIZE,
  CODE_LENGTH,
  LOCK_SIZE,
  type ClosedLayout,
} from '../../art/layout';
import { codeDots, keyCap, padlock } from '../../art/lock';
import { shutter } from '../../art/shutter';
import { OPEN_LINE } from '../../data/lines.cs';
import { closedProgress, isClosed, PARENT_CODE } from '../../game/closing';
import type { SessionState } from '../../game/closing';
import { createClosedPicker, createClosingPicker } from '../../game/speech';
import { STAGE_HEIGHT } from '../../stage/layout';
import { createMotion, layer, place } from './dom';

/** The shutter takes its time: it is the beat that says the playing is over for now. */
const SHUTTER_MS = 900;
const PANEL_MS = 180;
const SHAKE_MS = 400;
/**
 * How often the timer is redrawn. The wedge of an hour-long closing moves by a degree and a half in
 * that time, and it is also how late the kitchen can be to open itself – both are fine, and one
 * timer every 15 s costs nothing.
 */
const TICK_MS = 15_000;

/** The keys of the panel in the order `keypadKeys()` returns them: 1–9, then 0. */
const KEY_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export interface ClosingHandle {
  /** Brings the shutter down. `animate: false` = it is already down (the page opened closed). */
  close(options?: { readonly animate?: boolean }): void;
  /** Lifts it again: the timer ran out, or the code was typed. */
  open(options?: { readonly animate?: boolean }): void;
  readonly closed: boolean;
  layout(stageWidth: number): void;
  destroy(): void;
}

export function createClosing(options: {
  readonly root: HTMLElement;
  readonly voice: VoicePlayer;
  readonly sfx: SfxPlayer;
  /** The saved sitting, read afresh every time: the timer and the self-opening run off it. */
  readonly state: () => SessionState;
  /** The code was right: start a new sitting (this writes the save). The shutter lifts itself. */
  readonly onCode: () => void;
  /** The shutter is up: the kitchen can put the bell back on the counter. */
  readonly onOpen: () => void;
}): ClosingHandle {
  const wrap = layer('kitchen-closing');
  wrap.hidden = true;
  const dim = layer('kitchen-dim');
  const shutterEl = layer('kitchen-shutter');
  // Inside the shutter, so it comes down with it – a timer hanging on the grille, not next to it.
  const clockEl = layer('kitchen-clock');
  shutterEl.append(clockEl);
  const lockEl = layer('kitchen-lock');
  lockEl.innerHTML = padlock(LOCK_SIZE);
  const keypad = layer('kitchen-keypad');
  keypad.hidden = true;
  const keypadBack = layer('kitchen-keypad-back');
  const card = layer('kitchen-card');
  const dotsEl = layer('kitchen-code');
  const keyEls = KEY_LABELS.map((label) => {
    const key = layer('kitchen-key');
    key.innerHTML = keyCap(label);
    return key;
  });
  keypad.append(keypadBack, card, dotsEl, ...keyEls);
  wrap.append(dim, shutterEl, lockEl, keypad);
  options.root.append(wrap);

  const motion = createMotion();
  const closingLine = createClosingPicker();
  const closedLine = createClosedPicker();
  let boxes: ClosedLayout = closedLayout(0);
  /** The width the shutter markup was built for; rebuilding it on every tick would be waste. */
  let drawnWidth = 0;
  let stageWidth = 0;
  let closed = false;
  let typed: string[] = [];
  let ticker: number | null = null;

  function drawDots(): void {
    dotsEl.innerHTML = codeDots(typed.length, CODE_LENGTH);
  }

  function drawClock(): void {
    clockEl.innerHTML = kitchenTimer({
      size: CLOCK_SIZE,
      progress: closedProgress(options.state(), Date.now()),
    });
  }

  function draw(): void {
    const width = clampStageWidth(stageWidth);
    if (width !== drawnWidth) {
      drawnWidth = width;
      shutterEl.innerHTML = shutter(width, STAGE_HEIGHT);
      shutterEl.append(clockEl);
    }
    place(shutterEl, { x: 0, y: 0, width, height: STAGE_HEIGHT });
    place(clockEl, boxes.clock);
    place(lockEl, boxes.lock);
    place(card, boxes.keypad);
    place(dotsEl, codeSlot(boxes.keypad));
    const keys = keypadKeys(boxes.keypad);
    for (const [index, key] of keyEls.entries()) {
      const box = keys[index];
      if (box) place(key, box);
    }
  }

  function stopTicking(): void {
    if (ticker !== null) window.clearInterval(ticker);
    ticker = null;
  }

  /** The timer is redrawn, and the moment the closing has run out the shutter lifts itself. */
  function tick(): void {
    if (!closed) return;
    if (!isClosed(options.state(), Date.now())) {
      open();
      return;
    }
    drawClock();
  }

  function closePanel(): void {
    typed = [];
    drawDots();
    keypad.hidden = true;
  }

  function openPanel(): void {
    if (!closed) return;
    typed = [];
    drawDots();
    keypad.hidden = false;
    motion.animate(keypad, [{ transform: 'scale(0.92)' }, { transform: 'scale(1)' }], {
      duration: PANEL_MS,
      easing: 'ease-out',
    });
  }

  function close(closeOptions?: { readonly animate?: boolean }): void {
    const animate = closeOptions?.animate ?? true;
    motion.cancelAll();
    // Whatever is left of a lift that finished with `fill: 'forwards'` and was never cancelled
    // (a scene torn down mid-animation, a tab woken up): the grille starts every closing at rest.
    for (const animation of shutterEl.getAnimations()) animation.cancel();
    closed = true;
    options.root.classList.add('is-closed');
    wrap.hidden = false;
    closePanel();
    drawClock();
    draw();
    stopTicking();
    ticker = window.setInterval(tick, TICK_MS);
    if (!animate) {
      // The page opened onto a closed kitchen: no rattle out of nowhere, just the state of things.
      options.voice.say(closedLine.next());
      return;
    }
    options.sfx.play('shutter');
    options.voice.say(closingLine.next());
    motion.animate(
      shutterEl,
      [{ transform: 'translateY(-100%)' }, { transform: 'translateY(0)' }],
      { duration: SHUTTER_MS, easing: 'ease-in' },
    );
  }

  function open(openOptions?: { readonly animate?: boolean }): void {
    if (!closed) return;
    const animate = openOptions?.animate ?? true;
    motion.cancelAll();
    // First of all the panel: the countdown can run out while a grown-up is typing, and a keypad
    // yanked away mid-code would be the one thing here that feels broken.
    closePanel();
    stopTicking();
    closed = false;
    options.root.classList.remove('is-closed');
    const done = (): void => {
      wrap.hidden = true;
      options.onOpen();
    };
    if (!animate) {
      done();
      return;
    }
    options.sfx.play('shutter');
    options.voice.say(OPEN_LINE);
    // `fill: 'forwards'` so the shutter stays up for the frame between the end of the animation and
    // the layer being hidden – without it the grille drops back down for one frame, which reads as
    // a glitch. The fill is dropped again the moment the layer is hidden (see below): a finished
    // animation keeps applying its last frame, and the next `close()` would find the shutter stuck
    // above the stage.
    const lift = motion.animate(
      shutterEl,
      [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
      { duration: SHUTTER_MS, easing: 'ease-in-out', fill: 'forwards' },
    );
    // Reduced motion (or no WAAPI): the shutter never moves, so the layer goes straight away.
    if (!lift) {
      done();
      return;
    }
    motion.after(SHUTTER_MS, () => {
      done();
      lift.cancel();
    });
  }

  function press(label: string): void {
    if (typed.length >= CODE_LENGTH) return;
    typed.push(label);
    drawDots();
    if (typed.length < CODE_LENGTH) return;
    const code = typed.join('');
    typed = [];
    if (code === PARENT_CODE) {
      options.onCode();
      open();
      return;
    }
    // No counting of attempts, no lockout: a wrong code shakes its head and waits (rule 2).
    motion.animate(
      keypad,
      [
        { transform: 'translateX(0px)' },
        { transform: 'translateX(-12px)', offset: 0.25 },
        { transform: 'translateX(12px)', offset: 0.75 },
        { transform: 'translateX(0px)' },
      ],
      { duration: SHAKE_MS, easing: 'ease-in-out' },
    );
    motion.after(SHAKE_MS, () => drawDots());
  }

  shutterEl.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    // Only into silence: a child drumming on the grille must not queue ten sentences.
    if (!closed || !keypad.hidden || options.voice.speaking) return;
    options.voice.say(closedLine.next());
  });
  lockEl.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    openPanel();
  });
  keypadBack.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    closePanel();
  });
  card.addEventListener('pointerdown', (event) => event.preventDefault());
  for (const [index, key] of keyEls.entries()) {
    key.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      press(KEY_LABELS[index] ?? '');
    });
  }

  drawDots();

  return {
    close,
    open,
    get closed() {
      return closed;
    },
    layout(width) {
      stageWidth = width;
      boxes = closedLayout(width);
      draw();
    },
    destroy() {
      stopTicking();
      motion.cancelAll();
      options.root.classList.remove('is-closed');
      wrap.remove();
    },
  };
}
