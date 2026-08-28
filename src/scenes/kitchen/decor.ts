/**
 * What the child has bought for the kitchen (docs/navrh-hry.md 7.3a): a cat asleep on the floor in
 * the bottom right corner and a radio built into the counter, in place of one of its doors. Neither
 * is furniture – both answer a tap: the cat stretches and meows, the radio bounces and plays a few
 * notes. That is all they do, and that is the point: they are toys at the edge of the scene, they
 * cost nothing, break nothing and lead nowhere (rule 2).
 *
 * They never speak (no voice, no narrator) and they never touch the order: a tap during counting is
 * a meow and nothing else, so the child can play with them whenever she likes.
 *
 * What is owned is read at every `layout()`, and a purchase always arrives with a freshly built
 * kitchen (the shop is a scene of its own), so nothing here has to listen for one.
 */
import type { SfxPlayer } from '../../audio/sfx';
import { radioNiche, sleepingCat } from '../../art/decor';
import { decorLayout } from '../../art/layout';
import { customerHelloSfx } from '../../data/sfx';
import type { DecorationId } from '../../data/shop';
import { createMotion, layer, place } from './dom';

/** The cat borrows the meow she greets with when she comes to the counter (STEP-10). */
const MEOW = customerHelloSfx('cat');
/** The radio has one sound of its own – a few notes, generated in STEP-16. */
const TUNE = 'decor.radio.tune';
const STRETCH_MS = 420;
const WIGGLE_MS = 320;
/** The tune runs about two seconds; until it ends the radio ignores further taps. */
const TUNE_MS = 2200;

export interface DecorHandle {
  layout(stageWidth: number): void;
  destroy(): void;
}

export function createDecor(options: {
  readonly root: HTMLElement;
  readonly sfx: SfxPlayer;
  /** Read when the scene is built and at every `layout()`; a purchase comes with a new scene. */
  readonly owned: () => readonly DecorationId[];
}): DecorHandle {
  const wrap = layer('kitchen-decor');
  const catEl = layer('kitchen-decor-piece kitchen-cat');
  catEl.innerHTML = sleepingCat();
  const catTarget = layer('kitchen-decor-target');
  const radioEl = layer('kitchen-decor-piece kitchen-radio');
  wrap.append(radioEl, catEl, catTarget);
  options.root.append(wrap);

  const motion = createMotion();
  /** The radio is mid-tune; a second tap would only stack two melodies on top of each other. */
  let playing = false;

  function meow(): void {
    options.sfx.play(MEOW);
    motion.animate(
      catEl,
      [
        { transform: 'scaleX(1) scaleY(1)' },
        { transform: 'scaleX(1.06) scaleY(0.94)', offset: 0.45 },
        { transform: 'scaleX(1) scaleY(1)' },
      ],
      { duration: STRETCH_MS, easing: 'ease-in-out' },
    );
  }

  function play(): void {
    if (playing) return;
    playing = true;
    options.sfx.play(TUNE);
    motion.animate(
      radioEl,
      [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-1.5deg)', offset: 0.3 },
        { transform: 'rotate(1.5deg)', offset: 0.7 },
        { transform: 'rotate(0deg)' },
      ],
      { duration: WIGGLE_MS, easing: 'ease-in-out' },
    );
    motion.after(TUNE_MS, () => {
      playing = false;
    });
  }

  catTarget.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    meow();
  });
  radioEl.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    play();
  });

  return {
    layout(stageWidth) {
      const boxes = decorLayout(stageWidth);
      const owned = new Set(options.owned());
      place(catEl, boxes.cat);
      place(catTarget, boxes.catTarget);
      place(radioEl, boxes.radio);
      radioEl.innerHTML = radioNiche(boxes.radio);
      const hasCat = owned.has('cat');
      catEl.hidden = !hasCat;
      catTarget.hidden = !hasCat;
      radioEl.hidden = !owned.has('radio');
    },
    destroy() {
      motion.cancelAll();
      wrap.remove();
    },
  };
}
