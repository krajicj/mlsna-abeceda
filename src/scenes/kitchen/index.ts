import { fruitBowl } from '../../art/bowl';
import { bear } from '../../art/bear';
import { cakeBase } from '../../art/cake';
import { kitchenBackdrop } from '../../art/kitchen';
import { kitchenLayout, type KitchenLayout } from '../../art/layout';
import { isLetter, type FruitKind, type Letter } from '../../data/curriculum';
import {
  choiceItemOf,
  choiceValues,
  shelfDecoration,
  type ChoiceItem,
  type ChoiceState,
} from '../../game/choice';
import { countItemOf, type CountingState } from '../../game/counting';
import { letterWord } from '../../game/curriculum';
import { createPraisePicker } from '../../game/speech';
import type { Scene } from '../../stage/scenes';
import { createChoiceItem } from './choice-item';
import { createCountItem } from './count-item';
import { layer, place } from './dom';
import './style.css';

interface KitchenDevHandle {
  /** Replays the letter item; without an offer it takes the one of the order or the shelf. */
  letter(target: string, choices?: readonly string[]): void;
  digit(value: number, choices?: readonly number[]): void;
  /** Replays the counting item with any amount and kind, whatever the order says. */
  count(amount: number, kind?: FruitKind): void;
  /** An order without a playable item (STEP-09 onwards): the kitchen goes static. */
  clear(): void;
  state(): CountingState | null;
  choice(): ChoiceState | null;
  layout(): KitchenLayout;
}

function prop(className: string, art: string): HTMLDivElement {
  const el = layer(`kitchen-prop ${className}`);
  el.innerHTML = art;
  return el;
}

/**
 * The kitchen: the bear waits behind the counter, the cake base and the bowl of fruit stand on the
 * worktop, digits sit on the upper shelf and letters on the lower one. Whichever item the current
 * order holds is playable – counting from the bowl (STEP-05) or a choice from the shelf (STEP-06);
 * everything else stays a picture.
 */
export const kitchenScene: Scene = (ctx) => {
  const el = document.createElement('div');
  el.className = 'scene-kitchen';

  const backdrop = document.createElement('div');
  backdrop.className = 'kitchen-backdrop';
  const bearEl = prop('kitchen-bear', bear());
  const cakeEl = prop('kitchen-cake', cakeBase());
  const bowlEl = prop('kitchen-bowl', fruitBowl());
  const digitShelf = layer('kitchen-shelf');
  const letterShelf = layer('kitchen-shelf');
  el.append(backdrop, bearEl, cakeEl, bowlEl, digitShelf, letterShelf);

  if (import.meta.env.DEV) {
    const guide = document.createElement('div');
    guide.className = 'kitchen-dev-guide';
    el.append(guide);
  }

  const tracks = ctx.session.save.tracks;
  // One picker for the whole scene, so two praises in a row are never the same one – whichever
  // item earned them. The gender comes from the settings in STEP-17; until then everyone is
  // praised neutrally.
  const praise = createPraisePicker();
  const countItem = createCountItem({
    root: el,
    bowl: bowlEl,
    audio: ctx.audio,
    voice: ctx.voice,
    praise,
  });
  const choiceItem = createChoiceItem({
    root: el,
    shelves: { digits: digitShelf, letters: letterShelf },
    // What the child is really learning, so the inert shelf never shows made-up content.
    decoration: {
      digits: shelfDecoration(tracks.numbers),
      letters: shelfDecoration(tracks.letters),
    },
    audio: ctx.audio,
    voice: ctx.voice,
    praise,
  });

  let layout = kitchenLayout(0);
  let backdropWidth = 0;

  function draw(): void {
    place(bearEl, layout.bear);
    place(cakeEl, layout.cake);
    place(bowlEl, layout.bowl);
  }

  const countOrder = countItemOf(ctx.session.order);
  const choiceOrder = choiceItemOf(ctx.session.order);
  countItem.layout(layout);
  choiceItem.layout(layout);
  if (countOrder) {
    choiceItem.clear();
    countItem.start(countOrder.amount, countOrder.fruit);
  } else if (choiceOrder) {
    countItem.clear();
    choiceItem.start(choiceOrder);
  } else {
    countItem.clear();
    choiceItem.clear();
    if (import.meta.env.DEV) {
      console.warn('[kitchen] the order has no playable item; the scene stays static');
    }
  }

  /** DEV only: the offer of the order when it fits, otherwise what stands on the shelf. */
  function devChoices(type: ChoiceItem['type']): string[] {
    if (choiceOrder && choiceOrder.type === type) return choiceValues(choiceOrder);
    return shelfDecoration(type === 'digit' ? tracks.numbers : tracks.letters);
  }

  const devHandle: KitchenDevHandle = {
    letter(target, choices) {
      // Whatever the console types is taken as it comes; the game itself only passes real letters.
      const value = target as Letter;
      choiceItem.start({
        type: 'letter',
        letter: value,
        word: isLetter(target) ? letterWord(target, ctx.session.save.settings) : '',
        choices: (choices ?? devChoices('letter')) as readonly Letter[],
      });
      countItem.clear();
    },
    digit(value, choices) {
      const digits = choices ?? devChoices('digit').map(Number);
      choiceItem.start({ type: 'digit', value, choices: digits });
      countItem.clear();
    },
    count(amount, kind) {
      choiceItem.clear();
      countItem.start(amount, kind ?? countOrder?.fruit ?? 'strawberry');
    },
    clear() {
      ctx.voice.stop();
      countItem.clear();
      choiceItem.clear();
    },
    state: () => countItem.state(),
    choice: () => choiceItem.state(),
    layout: () => layout,
  };
  const devWindow = window as unknown as { __kitchen?: KitchenDevHandle };
  if (import.meta.env.DEV) devWindow.__kitchen = devHandle;

  return {
    el,
    resize(size) {
      layout = kitchenLayout(size.width);
      if (size.width !== backdropWidth) {
        backdropWidth = size.width;
        backdrop.innerHTML = kitchenBackdrop(size.width);
      }
      draw();
      countItem.layout(layout);
      choiceItem.layout(layout);
    },
    destroy() {
      // The scene does not own the narrator, but nothing it started may outlive it.
      ctx.voice.stop();
      countItem.destroy();
      choiceItem.destroy();
      // Leave the handle alone when a newer kitchen has already claimed it (crossfade order).
      if (import.meta.env.DEV && devWindow.__kitchen === devHandle) delete devWindow.__kitchen;
    },
  };
};
