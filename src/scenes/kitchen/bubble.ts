/**
 * The order bubble over the customer (docs/navrh-hry.md ch. 4): what the animal asked for, drawn as
 * pictures – three strawberries, a gingerbread cookie, a candle. No sentence is ever written in it
 * (rule 1). The whole card is one target: tapping it repeats the order, which is the only way to
 * ask for it again before the 15 s nudge.
 *
 * The picture says WHICH KIND of thing is wanted, never the answer: a cookie with the letter drawn
 * on it would turn "find the K you can hear" into "find the same picture", and the child could fill
 * every letter order without knowing a single letter (návrh 5.4). Which letter or digit it is lives
 * in the voice and on the shelf. (The word stage P3 does show a pattern here – there the skill is
 * the order of the letters, not recognising one; návrh 5.1.)
 */
import {
  bubbleFruit,
  BUBBLE_ART_HEIGHT,
  orderBubble,
  orderCheck,
  speakerIcon,
} from '../../art/bubble';
import { candle } from '../../art/candle';
import { cookie } from '../../art/cookie';
import {
  BUBBLE_ITEM_HEIGHT,
  BUBBLE_SPEAKER,
  bubbleSlots,
  bubbleSpeakerSlot,
  type KitchenLayout,
} from '../../art/layout';
import type { Order, OrderItem } from '../../game/orders';
import { layer, place } from './dom';

/** The tick sits in the corner of the picture, not over it: what was ordered stays readable. */
const CHECK_SIZE = 44;

export interface BubbleHandle {
  /** Draws an order; `null` hides the card (an order with nothing playable in it). */
  show(order: Order | null): void;
  /** Ticks off item `index` – it is on the cake now. */
  tick(index: number): void;
  layout(layout: KitchenLayout): void;
  destroy(): void;
}

function itemArt(item: OrderItem): string {
  switch (item.type) {
    // How many is not a secret – the counter above the cake shows it as empty circles anyway.
    case 'count':
      return bubbleFruit(item.fruit, item.amount);
    case 'digit':
      return candle(); // a candle, not "the candle with a 3"
    case 'letter':
      return cookie(); // a gingerbread cookie, not "the one with a K"
  }
}

export function createBubble(options: {
  readonly root: HTMLElement;
  /** A tap on the card; the kitchen turns it into "say the order again". */
  readonly onTap: () => void;
}): BubbleHandle {
  const cardEl = layer('bubble-card');
  const speakerEl = layer('bubble-speaker');
  const itemLayer = layer('bubble-items');
  cardEl.innerHTML = orderBubble();
  speakerEl.innerHTML = speakerIcon(BUBBLE_SPEAKER);
  options.root.append(cardEl, speakerEl, itemLayer);

  cardEl.addEventListener('pointerdown', (event) => {
    if (event.isPrimary === false) return; // tap only – no second finger, no drag (rule 3)
    options.onTap();
  });

  let current: KitchenLayout | null = null;
  let items: HTMLDivElement[] = [];
  let checks: HTMLDivElement[] = [];

  function setHidden(hidden: boolean): void {
    cardEl.hidden = hidden;
    speakerEl.hidden = hidden;
    itemLayer.hidden = hidden;
  }

  function placeAll(): void {
    if (!current) return;
    const { bubble } = current;
    // The card is drawn taller than its box: the tail hangs below it, pointing at the bear.
    place(cardEl, { ...bubble, height: BUBBLE_ART_HEIGHT });
    place(speakerEl, bubbleSpeakerSlot(bubble));
    bubbleSlots(bubble, items.length).forEach((slot, index) => {
      const item = items[index];
      if (item) place(item, slot);
      const check = checks[index];
      if (check) {
        place(check, {
          x: Math.round(slot.x + slot.width - CHECK_SIZE),
          y: Math.round(slot.y + BUBBLE_ITEM_HEIGHT - CHECK_SIZE),
          width: CHECK_SIZE,
          height: CHECK_SIZE,
        });
      }
    });
  }

  return {
    show(order) {
      const list = order?.items ?? [];
      items = list.map((item) => {
        const el = layer('bubble-item');
        el.innerHTML = itemArt(item);
        return el;
      });
      checks = list.map(() => {
        const el = layer('bubble-check');
        el.innerHTML = orderCheck(CHECK_SIZE);
        el.hidden = true;
        return el;
      });
      itemLayer.replaceChildren(...items, ...checks);
      setHidden(list.length === 0);
      placeAll();
    },
    tick(index) {
      const check = checks[index];
      if (check) check.hidden = false;
    },
    layout(next) {
      current = next;
      placeAll();
    },
    destroy() {
      for (const el of [cardEl, speakerEl, itemLayer]) el.remove();
    },
  };
}
