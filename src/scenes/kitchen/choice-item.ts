/**
 * The letter and digit items in the kitchen (docs/navrh-hry.md ch. 5.4, 5.5): the offer from the
 * order stands on one shelf – cookies below, candles above – the child taps a piece and the right
 * one flies onto the cake. The state lives in `game/choice.ts`, the geometry in `art/layout.ts`.
 * A wrong tap only shakes the piece; after the second one the right answer lights up, so the child
 * can never get stuck (rule 2). The shelf that is not in play stays full but inert: a tap there is
 * not a mistake.
 */
import type { AudioEngine } from '../../audio/context';
import { playCue } from '../../audio/tones';
import type { VoicePlayer } from '../../audio/voice';
import { candle } from '../../art/candle';
import { cookie } from '../../art/cookie';
import { hintRing } from '../../art/hint';
import {
  SHELF_ITEM_WIDTH,
  cakeCandleSlot,
  cakeCookieSlot,
  shelfHitSlots,
  shelfSlots,
  type KitchenLayout,
} from '../../art/layout';
import type { Rect } from '../../art/svg';
import {
  choiceTarget,
  choiceValues,
  createChoice,
  pickChoice,
  revealChoice,
  type ChoiceItem,
  type ChoiceState,
} from '../../game/choice';
import { createIdleWatcher, type IdleWatcher } from '../../game/idle';
import type { ItemOutcome } from '../../game/progress';
import {
  askAgainSpeech,
  correctionSpeech,
  hintSpeech,
  orderSpeech,
  repeatSpeech,
  type PraisePicker,
} from '../../game/speech';
import { createMotion, layer, place, prefersReducedMotion } from './dom';

/** The ring is wider than the piece it points at: on a cookie of its own size it would land on
 *  the outline and read as decoration instead of a hint. */
const HINT_SIZE = SHELF_ITEM_WIDTH + 24;
const FLIGHT_MS = 420;
const SHAKE_MS = 360;
const HOP_MS = 420;
/** One wave of the bobbing offer, including the delay of the last piece (see style.css). */
const BOB_MS = 1150;
/** A beat before the order is spoken, so the sentence does not start over the scene fading in. */
const SPEAK_DELAY_MS = 350;

/** Which shelf a piece belongs on: digits are candles (top), letters are cookies (bottom). */
type Shelf = 'digits' | 'letters';

export interface ChoiceItemHandle {
  /** Starts the item: the offer goes on its own shelf, the other one stays decoration. */
  start(item: ChoiceItem): void;
  /** An order without a choice (counting): both shelves are decoration, no targets. */
  clear(): void;
  /** Called after every stage resize; re-places everything from the new layout. */
  layout(layout: KitchenLayout): void;
  state(): ChoiceState | null;
  /** How the item went, or `null` while none is running or one is unfinished. */
  outcome(): ItemOutcome | null;
  /** What flies to the customer with the cake – the cookie or the candle that landed on it. */
  plate(): readonly HTMLElement[];
  /** Says the order again (a tap on the bubble) and restarts the idle watcher. */
  repeat(): void;
  destroy(): void;
}

function other(shelf: Shelf): Shelf {
  return shelf === 'digits' ? 'letters' : 'digits';
}

/**
 * `shelves` are the two elements the kitchen scene positions; the item owns what is drawn in them,
 * because what stands there is either the offer of the order or the decoration from the save.
 */
export function createChoiceItem(options: {
  readonly root: HTMLElement;
  readonly shelves: { readonly digits: HTMLElement; readonly letters: HTMLElement };
  /**
   * What stands on the shelf that is not in play. A function, not a list: the set the child is
   * learning grows between orders, and the shelf has to show what the save says right now.
   */
  readonly decoration: () => {
    readonly digits: readonly string[];
    readonly letters: readonly string[];
  };
  readonly audio: AudioEngine;
  readonly voice: VoicePlayer;
  readonly praise: PraisePicker;
  /** The praise is out and the piece is on the cake – the kitchen may start the finale. */
  readonly onDone: () => void;
}): ChoiceItemHandle {
  const landedLayer = layer('choice-landed');
  const targetLayer = layer('choice-targets');
  const hintEl = layer('choice-hint');
  const flightLayer = layer('choice-flight');
  hintEl.innerHTML = hintRing(HINT_SIZE);
  hintEl.hidden = true;
  options.root.append(landedLayer, targetLayer, hintEl, flightLayer);

  const motion = createMotion();
  const pieces: Record<Shelf, HTMLDivElement[]> = { digits: [], letters: [] };
  let current: KitchenLayout | null = null;
  let state: ChoiceState | null = null;
  let active: Shelf = 'letters';
  let targets: HTMLDivElement[] = [];
  /** The item as the narrator got it – the word ("Ká jako kočka.") is only in here. */
  let spoken: ChoiceItem | null = null;

  function speakOrder(): void {
    const item = spoken;
    if (!item) return;
    motion.after(SPEAK_DELAY_MS, () => options.voice.say(orderSpeech(item)));
  }

  /**
   * One watcher per item: `stop()` is final by design (the item is over and nothing may nudge the
   * child any more), so starting the next item builds a fresh one.
   */
  let idle: IdleWatcher = watcher();

  function watcher(): IdleWatcher {
    return createIdleWatcher({
      onRemind: () => {
        bobOffer();
        // The word stays out of the nudge: after 15 s the child needs the order, not the lesson.
        if (spoken) options.voice.say(repeatSpeech(spoken));
      },
      onHint: () => {
        if (!state || state.done) return;
        const target = state.target;
        reveal(false);
        options.voice.say(hintSpeech(target));
      },
    });
  }

  function shelfEl(shelf: Shelf): HTMLElement {
    return shelf === 'digits' ? options.shelves.digits : options.shelves.letters;
  }

  function shelfRect(shelf: Shelf): Rect | null {
    if (!current) return null;
    return shelf === 'digits' ? current.shelfDigits : current.shelfLetters;
  }

  function art(shelf: Shelf, value: string): string {
    return shelf === 'digits' ? candle(value) : cookie(value);
  }

  /** Where the picked piece lands: the candle stands on top, the cookie leans on the front. */
  function cakeSlot(): Rect | null {
    if (!current) return null;
    return active === 'digits' ? cakeCandleSlot(current.cake) : cakeCookieSlot(current.cake);
  }

  function drawShelf(shelf: Shelf, values: readonly string[]): void {
    pieces[shelf] = values.map((value) => {
      const el = layer('kitchen-prop kitchen-item choice-piece');
      el.dataset['choice'] = value;
      el.innerHTML = art(shelf, value);
      return el;
    });
    shelfEl(shelf).replaceChildren(...pieces[shelf]);
  }

  function buildTargets(count: number): void {
    targets = Array.from({ length: count }, (_, index) => {
      const el = layer('choice-target');
      el.addEventListener('pointerdown', (event) => onTap(event, index));
      return el;
    });
    targetLayer.replaceChildren(...targets);
  }

  function placeShelf(shelf: Shelf): void {
    const rect = shelfRect(shelf);
    if (!rect) return;
    shelfSlots(rect, pieces[shelf].length).forEach((slot, index) => {
      const piece = pieces[shelf][index];
      if (piece) place(piece, slot);
    });
  }

  /** The slot of one piece of the offer, in stage coordinates. */
  function slotOf(index: number): Rect | null {
    const rect = shelfRect(active);
    if (!rect || !state) return null;
    return shelfSlots(rect, state.choices.length)[index] ?? null;
  }

  function placeTargets(): void {
    const rect = shelfRect(active);
    if (!rect) return;
    shelfHitSlots(rect, targets.length).forEach((slot, index) => {
      const target = targets[index];
      if (target) place(target, slot);
    });
  }

  function placeHint(): void {
    if (!state) return;
    const slot = slotOf(state.choices.indexOf(state.target));
    if (!slot) return;
    place(hintEl, {
      x: Math.round(slot.x + (slot.width - HINT_SIZE) / 2),
      y: Math.round(slot.y + (slot.height - HINT_SIZE) / 2),
      width: HINT_SIZE,
      height: HINT_SIZE,
    });
  }

  function placeLanded(): void {
    const slot = cakeSlot();
    if (!slot) return;
    for (const piece of landedLayer.children) place(piece as HTMLElement, slot);
  }

  function placeAll(): void {
    if (!current) return;
    placeShelf('digits');
    placeShelf('letters');
    placeTargets();
    placeHint();
    placeLanded();
  }

  function land(): void {
    const slot = cakeSlot();
    if (!slot || !state) return;
    const piece = layer('choice-landed-piece');
    piece.innerHTML = art(active, state.target);
    place(piece, slot);
    landedLayer.append(piece);
  }

  function fly(index: number, onLanded: () => void): void {
    const slot = cakeSlot();
    const from = slotOf(index);
    if (!slot || !from || !state) {
      onLanded();
      return;
    }
    const flyer = layer('choice-flyer');
    flyer.innerHTML = art(active, state.target);
    place(flyer, slot);
    flightLayer.append(flyer);
    // The shelf slot and the cake slot are the same size (both come from the art module), so the
    // flight only has to travel – nothing is scaled and the piece never changes size mid-air.
    const dx = from.x - slot.x;
    const dy = from.y - slot.y;
    const animation = motion.animate(
      flyer,
      [
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: `translate(${dx / 2}px, ${dy / 2 - 46}px)`, offset: 0.5 },
        { transform: 'translate(0px, 0px)' },
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
    // piece would hang in the air and never reach the cake (see stage/scenes.ts).
    motion.after(FLIGHT_MS + 120, arrive);
  }

  /** A wrong piece stays where it is and only shakes its head. */
  function shake(index: number): void {
    const piece = pieces[active][index];
    if (!piece) return;
    motion.animate(
      piece,
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-7px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: SHAKE_MS, easing: 'ease-in-out' },
    );
  }

  function bobOffer(): void {
    if (!state || state.done || prefersReducedMotion()) return;
    const shelf = shelfEl(active);
    shelf.classList.add('is-bobbing');
    motion.after(BOB_MS, () => shelf.classList.remove('is-bobbing'));
  }

  /** The right answer lights up: after 40 s of silence, and after the second mistake (with a hop). */
  function reveal(hop: boolean): void {
    if (!state || state.done) return;
    state = revealChoice(state);
    const index = state.choices.indexOf(state.target);
    const piece = pieces[active][index];
    if (!piece) return;
    piece.classList.add('is-revealed');
    placeHint();
    hintEl.hidden = false;
    playCue(options.audio, 'pling', { step: 0 });
    if (!hop) return;
    motion.animate(
      piece,
      [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-16px)' },
        { transform: 'translateY(0)' },
      ],
      { duration: HOP_MS, easing: 'ease-out' },
    );
  }

  function hideHint(): void {
    hintEl.hidden = true;
    shelfEl(active).classList.remove('is-bobbing');
  }

  function onTap(event: PointerEvent, index: number): void {
    if (event.isPrimary === false) return; // tap only – no second finger, no drag (rule 3)
    if (!state || state.done) return;
    hideHint();
    const value = state.choices[index];
    if (value === undefined) return;
    const step = pickChoice(state, value);
    state = step.state;
    if (step.result === 'wrong') {
      shake(index);
      playCue(options.audio, 'nope');
      idle.poke();
      if (state.revealed) reveal(true);
      // Once the right piece is lit up, "Hledáme ká." would send the child looking for something
      // they can already see – the hint sentence takes its place (speech.ts).
      options.voice.say(correctionSpeech(state.target, value, state.revealed));
      return;
    }
    if (step.result !== 'correct') return;
    idle.stop();
    for (const target of targets) target.hidden = true;
    const piece = pieces[active][index];
    if (piece) piece.hidden = true; // it leaves the shelf and flies to the cake
    playCue(options.audio, 'whoosh');
    fly(index, () => {
      land();
      playCue(options.audio, 'done');
      options.voice.say(options.praise.next());
      options.onDone();
    });
  }

  function reset(): void {
    motion.cancelAll();
    idle.stop();
    hintEl.hidden = true;
    for (const shelf of [options.shelves.digits, options.shelves.letters]) {
      shelf.classList.remove('is-bobbing');
    }
    targets = [];
    targetLayer.replaceChildren();
    landedLayer.replaceChildren();
    flightLayer.replaceChildren();
  }

  return {
    start(item) {
      reset();
      active = item.type === 'digit' ? 'digits' : 'letters';
      spoken = item;
      state = createChoice(choiceTarget(item), choiceValues(item));
      drawShelf(active, state.choices);
      drawShelf(other(active), options.decoration()[other(active)]);
      buildTargets(state.choices.length);
      placeAll();
      idle = watcher();
      idle.poke();
      speakOrder();
    },
    clear() {
      reset();
      state = null;
      spoken = null;
      const shelves = options.decoration();
      drawShelf('digits', shelves.digits);
      drawShelf('letters', shelves.letters);
      placeAll();
    },
    layout(next) {
      current = next;
      placeAll();
    },
    state: () => state,
    outcome() {
      if (!state || !state.done) return null;
      if (state.mistakes > 0) return 'mistaken';
      return state.revealed ? 'hinted' : 'first-try'; // revealed without a mistake = the 40 s hint
    },
    plate: () =>
      [...landedLayer.children].filter((el): el is HTMLElement => el instanceof HTMLElement),
    repeat() {
      if (!state || state.done) return;
      // The whole order, "Ká jako kočka." included – the child tapped because they do not know
      // which letter it was. Only the unasked-for 15 s nudge keeps the short version.
      if (spoken) options.voice.say(askAgainSpeech(spoken));
      idle.poke();
    },
    destroy() {
      reset();
      for (const el of [landedLayer, targetLayer, hintEl, flightLayer]) el.remove();
    },
  };
}
