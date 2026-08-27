/**
 * One item where the child picks from a shelf (docs/navrh-hry.md ch. 5.4, 5.5): the offer from the
 * order stands on it – cookies below, candles above – the child taps a piece and the right one flies
 * onto the cake. The state lives in `game/choice.ts`, the geometry in `art/layout.ts`. A wrong tap
 * only shakes the piece; after the second one the right answer lights up, so the child can never get
 * stuck (rule 2). A shelf that is not in play stays full but inert: a tap there is not a mistake.
 *
 * ONE INSTANCE OWNS ONE SHELF. From STEP-12 an order can ask for a candle AND a cookie at the same
 * time, and both are then in play; the kitchen therefore builds one of these per shelf and each of
 * them only ever draws its own. It says just what answers one tap ("To je bé. Hledáme ká."); the
 * order itself, the nudge, the hint sentence and the praise belong to the whole order and are said
 * by the scene, which is also the one that watches for idleness.
 */
import type { SfxPlayer } from '../../audio/sfx';
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
import { plingRate } from '../../data/sfx';
import {
  choiceTarget,
  choiceValues,
  createChoice,
  pickChoice,
  revealChoice,
  type ChoiceItem,
  type ChoiceState,
} from '../../game/choice';
import type { ItemOutcome } from '../../game/progress';
import { correctionSpeech } from '../../game/speech';
import { createMotion, layer, place, prefersReducedMotion } from './dom';

/** The ring is wider than the piece it points at: on a cookie of its own size it would land on
 *  the outline and read as decoration instead of a hint. */
const HINT_SIZE = SHELF_ITEM_WIDTH + 24;
const FLIGHT_MS = 420;
const SHAKE_MS = 360;
const HOP_MS = 420;
/** One wave of the bobbing offer, including the delay of the last piece (see style.css). */
const BOB_MS = 1150;

export interface ChoiceItemHandle {
  /** Starts the item: the offer goes on this shelf in place of the decoration. */
  start(item: ChoiceItem): void;
  /** The order does not ask for this shelf: it goes back to being decoration, with no targets. */
  clear(): void;
  /** Called after every stage resize; re-places everything from the new layout. */
  layout(layout: KitchenLayout): void;
  state(): ChoiceState | null;
  /** How the item went, or `null` while none is running or one is unfinished. */
  outcome(): ItemOutcome | null;
  /** What flies to the customer with the cake – the cookie or the candle that landed on it. */
  plate(): readonly HTMLElement[];
  /** 15 s of silence: the offer bobs. Wordless – the scene says the sentence. */
  nudge(): void;
  /** 40 s of silence: the right piece lights up (no hop). Wordless. */
  hint(): void;
  destroy(): void;
}

/**
 * `shelf` is the element the kitchen scene positions; the item owns what is drawn in it, because
 * what stands there is either the offer of the order or the decoration from the save.
 */
export function createChoiceItem(options: {
  readonly root: HTMLElement;
  /** Which shelf this instance owns: 'digit' is the candles on top, 'letter' the cookies below. */
  readonly kind: ChoiceItem['type'];
  readonly shelf: HTMLElement;
  /**
   * What stands on this shelf while it is not in play. A function, not a list: the set the child is
   * learning grows between orders, and the shelf has to show what the save says right now.
   */
  readonly decoration: () => readonly string[];
  readonly sfx: SfxPlayer;
  readonly voice: VoicePlayer;
  /** Every tap on the offer, right or wrong. The scene resets the idle watcher of the order. */
  readonly onActivity: () => void;
  /** The piece is on the cake; the praise and the finale are the scene's call. */
  readonly onDone: () => void;
}): ChoiceItemHandle {
  const digits = options.kind === 'digit';
  const landedLayer = layer('choice-landed');
  const targetLayer = layer('choice-targets');
  const hintEl = layer('choice-hint');
  const flightLayer = layer('choice-flight');
  hintEl.innerHTML = hintRing(HINT_SIZE);
  hintEl.hidden = true;
  options.root.append(landedLayer, targetLayer, hintEl, flightLayer);

  const motion = createMotion();
  let pieces: HTMLDivElement[] = [];
  let current: KitchenLayout | null = null;
  let state: ChoiceState | null = null;
  let targets: HTMLDivElement[] = [];

  function shelfRect(): Rect | null {
    if (!current) return null;
    return digits ? current.shelfDigits : current.shelfLetters;
  }

  function art(value: string): string {
    return digits ? candle(value) : cookie(value);
  }

  /** Where the picked piece lands: the candle stands on top, the cookie leans on the front. */
  function cakeSlot(): Rect | null {
    if (!current) return null;
    return digits ? cakeCandleSlot(current.cake) : cakeCookieSlot(current.cake);
  }

  function drawShelf(values: readonly string[]): void {
    pieces = values.map((value) => {
      const el = layer('kitchen-prop kitchen-item choice-piece');
      el.dataset['choice'] = value;
      el.innerHTML = art(value);
      return el;
    });
    options.shelf.replaceChildren(...pieces);
  }

  function buildTargets(count: number): void {
    targets = Array.from({ length: count }, (_, index) => {
      const el = layer('choice-target');
      el.addEventListener('pointerdown', (event) => onTap(event, index));
      return el;
    });
    targetLayer.replaceChildren(...targets);
  }

  function placeShelf(): void {
    const rect = shelfRect();
    if (!rect) return;
    shelfSlots(rect, pieces.length).forEach((slot, index) => {
      const piece = pieces[index];
      if (piece) place(piece, slot);
    });
  }

  /** The slot of one piece of the offer, in stage coordinates. */
  function slotOf(index: number): Rect | null {
    const rect = shelfRect();
    if (!rect || !state) return null;
    return shelfSlots(rect, state.choices.length)[index] ?? null;
  }

  function placeTargets(): void {
    const rect = shelfRect();
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
    placeShelf();
    placeTargets();
    placeHint();
    placeLanded();
  }

  function land(): void {
    const slot = cakeSlot();
    if (!slot || !state) return;
    const piece = layer('choice-landed-piece');
    piece.innerHTML = art(state.target);
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
    flyer.innerHTML = art(state.target);
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
    const piece = pieces[index];
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
    options.shelf.classList.add('is-bobbing');
    motion.after(BOB_MS, () => options.shelf.classList.remove('is-bobbing'));
  }

  /** The right answer lights up: after 40 s of silence, and after the second mistake (with a hop). */
  function reveal(hop: boolean): void {
    if (!state || state.done) return;
    state = revealChoice(state);
    const index = state.choices.indexOf(state.target);
    const piece = pieces[index];
    if (!piece) return;
    piece.classList.add('is-revealed');
    placeHint();
    hintEl.hidden = false;
    options.sfx.play('pling', { rate: plingRate(0) });
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
    options.shelf.classList.remove('is-bobbing');
  }

  function onTap(event: PointerEvent, index: number): void {
    if (event.isPrimary === false) return; // tap only – no second finger, no drag (rule 3)
    if (!state || state.done) return;
    options.onActivity();
    hideHint();
    const value = state.choices[index];
    if (value === undefined) return;
    const step = pickChoice(state, value);
    state = step.state;
    if (step.result === 'wrong') {
      shake(index);
      options.sfx.play('nope');
      if (state.revealed) reveal(true);
      // Once the right piece is lit up, "Hledáme ká." would send the child looking for something
      // they can already see – the hint sentence takes its place (speech.ts).
      options.voice.say(correctionSpeech(state.target, value, state.revealed));
      return;
    }
    if (step.result !== 'correct') return;
    for (const target of targets) target.hidden = true;
    const piece = pieces[index];
    if (piece) piece.hidden = true; // it leaves the shelf and flies to the cake
    options.sfx.play('whoosh');
    fly(index, () => {
      land();
      options.sfx.play('done');
      options.onDone();
    });
  }

  function reset(): void {
    motion.cancelAll();
    hintEl.hidden = true;
    options.shelf.classList.remove('is-bobbing');
    targets = [];
    targetLayer.replaceChildren();
    landedLayer.replaceChildren();
    flightLayer.replaceChildren();
  }

  return {
    start(item) {
      reset();
      state = createChoice(choiceTarget(item), choiceValues(item));
      drawShelf(state.choices);
      buildTargets(state.choices.length);
      placeAll();
    },
    clear() {
      reset();
      state = null;
      drawShelf(options.decoration());
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
    nudge() {
      bobOffer();
    },
    hint() {
      reveal(false);
    },
    destroy() {
      reset();
      for (const el of [landedLayer, targetLayer, hintEl, flightLayer]) el.remove();
    },
  };
}
