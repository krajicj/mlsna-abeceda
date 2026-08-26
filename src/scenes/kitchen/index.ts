import { fruitBowl } from '../../art/bowl';
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
import type { Order, OrderItem } from '../../game/orders';
import { itemResult, type ItemResult } from '../../game/progress';
import {
  createFinishPicker,
  createPraisePicker,
  createStarPicker,
  orderPreload,
} from '../../game/speech';
import type { Scene } from '../../stage/scenes';
import { createBubble } from './bubble';
import { createChoiceItem } from './choice-item';
import { createCustomer } from './customer';
import { createCountItem } from './count-item';
import { createFinale } from './finale';
import { layer, place } from './dom';
import { createPacer } from './pacing';
import { createStars } from './stars';
import './style.css';

/** From the praise of the last item to the start of the finale – it waits out the praise first. */
const FINALE_DELAY_MS = 400;

interface KitchenDevHandle {
  /** Replays the letter item; without an offer it takes the one of the order or the shelf. */
  letter(target: string, choices?: readonly string[]): void;
  digit(value: number, choices?: readonly number[]): void;
  /** Replays the counting item with any amount and kind, whatever the order says. */
  count(amount: number, kind?: FruitKind): void;
  /** An order without a playable item: the kitchen goes static. */
  clear(): void;
  /** Runs the finale of the current order straight away, without playing it. */
  finish(): void;
  /** Puts a number in the star counter (the picture only – the save is not touched). */
  stars(count: number): void;
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
 * The kitchen: the bear waits behind the counter with the order in a bubble over his head, the cake
 * base and the bowl of fruit stand on the worktop, digits sit on the upper shelf and letters on the
 * lower one. The child fills the order – counting from the bowl (STEP-05) or a choice from the
 * shelf (STEP-06) – the finale hands the cake over and the next order arrives (STEP-09).
 */
export const kitchenScene: Scene = (ctx) => {
  const el = document.createElement('div');
  el.className = 'scene-kitchen';

  const backdrop = document.createElement('div');
  backdrop.className = 'kitchen-backdrop';
  const cakeEl = prop('kitchen-cake', cakeBase());
  const bowlEl = prop('kitchen-bowl', fruitBowl());
  const digitShelf = layer('kitchen-shelf');
  const letterShelf = layer('kitchen-shelf');
  el.append(backdrop, cakeEl, bowlEl, digitShelf, letterShelf);
  // Owns its own element and appends it here, so it can walk in and out without the scene helping.
  const customer = createCustomer({ root: el, sfx: ctx.sfx });

  if (import.meta.env.DEV) {
    const guide = document.createElement('div');
    guide.className = 'kitchen-dev-guide';
    el.append(guide);
  }

  // One picker per kind for the whole scene, so two sentences in a row are never the same one –
  // whichever item earned them. The gender comes from the settings in STEP-17; until then neutral.
  const praise = createPraisePicker();
  const finish = createFinishPicker();
  const starLine = createStarPicker();
  /** Delays that never talk over the narrator: the finale and the next order both use it. */
  const pacer = createPacer({ voice: ctx.voice });

  let order: Order = ctx.session.order;
  let countOrder = countItemOf(order);
  let choiceOrder = choiceItemOf(order);
  /** True from the praise of the last item until the counter is cleared. */
  let finishing = false;

  const countItem = createCountItem({
    root: el,
    bowl: bowlEl,
    sfx: ctx.sfx,
    voice: ctx.voice,
    praise,
    onDone: () => startFinale(),
  });
  const choiceItem = createChoiceItem({
    root: el,
    shelves: { digits: digitShelf, letters: letterShelf },
    // What the child is really learning, so the inert shelf never shows made-up content. Read per
    // order: the active set grows as the save does.
    decoration: () => ({
      digits: shelfDecoration(ctx.session.save.tracks.numbers),
      letters: shelfDecoration(ctx.session.save.tracks.letters),
    }),
    sfx: ctx.sfx,
    voice: ctx.voice,
    praise,
    onDone: () => startFinale(),
  });
  const bubble = createBubble({
    root: el,
    // Only while an item is actually being played: during the finale the tap does nothing.
    onTap: () => {
      if (finishing) return;
      countItem.repeat();
      choiceItem.repeat();
    },
  });
  const stars = createStars({ root: el });
  const finale = createFinale({
    root: el,
    cake: cakeEl,
    customer,
    sfx: ctx.sfx,
    voice: ctx.voice,
    finish,
    star: starLine,
    stars,
    plate: () => [...countItem.plate(), ...choiceItem.plate()],
    onStar: () => writeProgress(),
    onDone: () => finishOrder(),
  });

  // The context is unlocked by now (the title screen saw to that), so this is where the bytes
  // fetched in main.ts actually turn into buffers.
  ctx.sfx.preload();

  let layout = kitchenLayout(0);
  let backdropWidth = 0;

  function draw(): void {
    place(cakeEl, layout.cake);
    place(bowlEl, layout.bowl);
  }

  /** The order is on the plate: tick it off in the bubble and let the finale take over. */
  function startFinale(): void {
    if (finishing) return;
    finishing = true;
    // M1 orders hold one item; ticking them all keeps this honest when they grow (STEP-11).
    order.items.forEach((_, index) => bubble.tick(index));
    pacer.after(FINALE_DELAY_MS, () => finale.run());
  }

  /**
   * The star has landed. The outcome of each item is read here, not when the item finished: a tap
   * on the covered bowl during the finale is still a recount and still costs the number a point.
   */
  function writeProgress(): number {
    const results: ItemResult[] = [];
    const counted = countItem.outcome();
    if (countOrder && counted) results.push(itemResult(countOrder, counted));
    const chosen = choiceItem.outcome();
    if (choiceOrder && chosen) results.push(itemResult(choiceOrder, chosen));
    order = ctx.session.complete(results);
    return ctx.session.save.progress.stars;
  }

  /** The counter is empty again; the next order is already generated, it only has to be served. */
  function finishOrder(): void {
    finale.reset();
    countItem.clear();
    choiceItem.clear();
    bubble.show(null);
    ctx.voice.preload(orderPreload(order));
    // Whoever is standing there is the one who leaves: `session.complete()` ran when the star
    // landed, so `session.customer` is already the NEXT customer. The bell goes into this gap in
    // the last part of STEP-10; until then the next one walks in by itself.
    customer.leave(() => {
      customer.arrive(ctx.session.customer, () => startOrder(order));
    });
  }

  /** Puts one order on the counter: the bubble, the playable item and the narrator. */
  function startOrder(next: Order): void {
    order = next;
    countOrder = countItemOf(next);
    choiceOrder = choiceItemOf(next);
    finishing = false;
    stars.set(ctx.session.save.progress.stars);
    bubble.show(next);
    if (countOrder) {
      choiceItem.clear();
      countItem.start(countOrder.amount, countOrder.fruit);
    } else if (choiceOrder) {
      countItem.clear();
      choiceItem.start(choiceOrder);
    } else {
      countItem.clear();
      choiceItem.clear();
      bubble.show(null);
      if (import.meta.env.DEV) {
        console.warn('[kitchen] the order has no playable item; the scene stays static');
      }
    }
  }

  countItem.layout(layout);
  choiceItem.layout(layout);
  bubble.layout(layout);
  stars.layout(layout);
  finale.layout(layout);
  customer.layout(layout);
  customer.show(ctx.session.customer);
  startOrder(order);

  /** DEV only: the offer of the order when it fits, otherwise what stands on the shelf. */
  function devChoices(type: ChoiceItem['type']): string[] {
    if (choiceOrder && choiceOrder.type === type) return choiceValues(choiceOrder);
    const tracks = ctx.session.save.tracks;
    return shelfDecoration(type === 'digit' ? tracks.numbers : tracks.letters);
  }

  /** DEV only: a replayed item is the whole order, bubble included – otherwise the card lies. */
  function devShow(item: OrderItem): void {
    order = { index: order.index, items: [item] };
    countOrder = countItemOf(order);
    choiceOrder = choiceItemOf(order);
    finishing = false;
    bubble.show(order);
  }

  const devHandle: KitchenDevHandle = {
    letter(target, choices) {
      // Whatever the console types is taken as it comes; the game itself only passes real letters.
      const value = target as Letter;
      devShow({
        type: 'letter',
        letter: value,
        word: isLetter(target) ? letterWord(target, ctx.session.save.settings) : '',
        choices: (choices ?? devChoices('letter')) as readonly Letter[],
      });
      if (choiceOrder) choiceItem.start(choiceOrder);
      countItem.clear();
    },
    digit(value, choices) {
      const digits = choices ?? devChoices('digit').map(Number);
      devShow({ type: 'digit', value, choices: digits });
      if (choiceOrder) choiceItem.start(choiceOrder);
      countItem.clear();
    },
    count(amount, kind) {
      devShow({ type: 'count', amount, fruit: kind ?? countOrder?.fruit ?? 'strawberry' });
      choiceItem.clear();
      if (countOrder) countItem.start(countOrder.amount, countOrder.fruit);
    },
    clear() {
      ctx.voice.stop();
      pacer.cancel();
      finale.reset();
      finishing = false;
      countItem.clear();
      choiceItem.clear();
      bubble.show(null);
    },
    finish: () => startFinale(),
    stars: (count) => stars.set(count, { pop: true }),
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
      bubble.layout(layout);
      stars.layout(layout);
      finale.layout(layout);
      customer.layout(layout);
    },
    destroy() {
      // The scene does not own the narrator, but nothing it started may outlive it.
      ctx.voice.stop();
      pacer.cancel();
      finale.destroy();
      customer.destroy();
      countItem.destroy();
      choiceItem.destroy();
      bubble.destroy();
      stars.destroy();
      // Leave the handle alone when a newer kitchen has already claimed it (crossfade order).
      if (import.meta.env.DEV && devWindow.__kitchen === devHandle) delete devWindow.__kitchen;
    },
  };
};
