import { fruitBowl } from '../../art/bowl';
import { bear } from '../../art/bear';
import { cakeBase } from '../../art/cake';
import { candle } from '../../art/candle';
import { cookie } from '../../art/cookie';
import { kitchenBackdrop } from '../../art/kitchen';
import { MAX_CHOICES, kitchenLayout, shelfSlots, type KitchenLayout } from '../../art/layout';
import type { Rect } from '../../art/svg';
import type { FruitKind } from '../../data/curriculum';
import { countItemOf, type CountingState } from '../../game/counting';
import type { Scene } from '../../stage/scenes';
import { createCountItem } from './count-item';
import './style.css';

/** Placeholder contents of the shelves; STEP-06 fills them from the order instead. */
const DEMO_DIGITS = ['1', '2', '3', '4'];
const DEMO_LETTERS = ['K', 'A', 'M', 'O'];

interface KitchenDevHandle {
  letters(list: readonly string[]): void;
  digits(list: readonly string[]): void;
  /** Replays the counting item with any amount and kind, whatever the order says. */
  count(amount: number, kind?: FruitKind): void;
  /** The order without a counting item (STEP-08 onwards): the kitchen goes static. */
  clear(): void;
  state(): CountingState | null;
  layout(): KitchenLayout;
}

function place(el: HTMLElement, rect: Rect): void {
  el.style.left = `${rect.x}px`;
  el.style.top = `${rect.y}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
}

function prop(className: string, art: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = `kitchen-prop ${className}`;
  el.innerHTML = art;
  return el;
}

/**
 * The kitchen: the bear waits behind the counter, the cake base and the bowl of fruit stand on the
 * worktop, digits sit on the upper shelf and letters on the lower one. The counting item of the
 * current order is playable (STEP-05); the shelves still hold their STEP-04 sample until STEP-06.
 */
export const kitchenScene: Scene = (ctx) => {
  const el = document.createElement('div');
  el.className = 'scene-kitchen';

  const backdrop = document.createElement('div');
  backdrop.className = 'kitchen-backdrop';
  const bearEl = prop('kitchen-bear', bear());
  const cakeEl = prop('kitchen-cake', cakeBase());
  const bowlEl = prop('kitchen-bowl', fruitBowl());
  const digitShelf = document.createElement('div');
  const letterShelf = document.createElement('div');
  el.append(backdrop, bearEl, cakeEl, bowlEl, digitShelf, letterShelf);

  if (import.meta.env.DEV) {
    const guide = document.createElement('div');
    guide.className = 'kitchen-dev-guide';
    el.append(guide);
  }

  const countItem = createCountItem({ root: el, bowl: bowlEl, audio: ctx.audio });

  let layout = kitchenLayout(0);
  let backdropWidth = 0;
  let digits: readonly string[] = DEMO_DIGITS;
  let letters: readonly string[] = DEMO_LETTERS;

  function fillShelf(
    container: HTMLElement,
    shelf: Rect,
    items: readonly string[],
    art: (value: string) => string,
  ): void {
    const slots = shelfSlots(shelf, items.length);
    container.replaceChildren(
      ...slots.map((slot, index) => {
        const item = prop('kitchen-item', art(items[index] ?? ''));
        place(item, slot);
        return item;
      }),
    );
  }

  function draw(): void {
    place(bearEl, layout.bear);
    place(cakeEl, layout.cake);
    place(bowlEl, layout.bowl);
    fillShelf(digitShelf, layout.shelfDigits, digits, candle);
    fillShelf(letterShelf, layout.shelfLetters, letters, cookie);
  }

  const countItemOfOrder = countItemOf(ctx.session.order);
  countItem.layout(layout);
  if (countItemOfOrder) {
    countItem.start(countItemOfOrder.amount, countItemOfOrder.fruit);
  } else if (import.meta.env.DEV) {
    console.warn('[kitchen] the order has no counting item; the scene stays static');
  }

  const devHandle: KitchenDevHandle = {
    letters(list) {
      letters = list.slice(0, MAX_CHOICES);
      draw();
    },
    digits(list) {
      digits = list.slice(0, MAX_CHOICES);
      draw();
    },
    count(amount, kind) {
      countItem.start(amount, kind ?? countItemOfOrder?.fruit ?? 'strawberry');
    },
    clear() {
      countItem.clear();
    },
    state: () => countItem.state(),
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
    },
    destroy() {
      countItem.destroy();
      // Leave the handle alone when a newer kitchen has already claimed it (crossfade order).
      if (import.meta.env.DEV && devWindow.__kitchen === devHandle) delete devWindow.__kitchen;
    },
  };
};
