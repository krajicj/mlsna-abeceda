import { fruitBowl } from '../../art/bowl';
import { cakeBase } from '../../art/cake';
import { kitchenBackdrop } from '../../art/kitchen';
import { kitchenLayout, type KitchenLayout } from '../../art/layout';
import { isLetter, type FruitKind, type Letter } from '../../data/curriculum';
import type { CustomerId } from '../../data/customers';
import {
  choiceItemOf,
  choiceValues,
  shelfDecoration,
  type ChoiceItem,
  type ChoiceState,
} from '../../game/choice';
import { isClosed } from '../../game/closing';
import { countItemOf, type CountingState } from '../../game/counting';
import { letterWord } from '../../game/curriculum';
import { createIdleWatcher, type IdleWatcher } from '../../game/idle';
import type { Order, OrderItem } from '../../game/orders';
import { itemResult, type ItemResult } from '../../game/progress';
import {
  askAgainSpeech,
  closingPreload,
  createBellPicker,
  createFinishPicker,
  createPraisePicker,
  createStarPicker,
  itemHintSpeech,
  orderPreload,
  orderSpeech,
  repeatSpeech,
} from '../../game/speech';
import { starBalance } from '../../game/stars';
import type { Scene } from '../../stage/scenes';
import { createBellHandle } from './bell';
import { createBubble } from './bubble';
import { createClosing } from './closing';
import { createChoiceItem, type ChoiceItemHandle } from './choice-item';
import { createCustomer } from './customer';
import { createCountItem } from './count-item';
import { createFinale } from './finale';
import { layer, place } from './dom';
import { createPacer } from './pacing';
import { createStars } from './stars';
import './style.css';

/** A beat before the order is spoken, so the sentence does not start over the scene fading in. */
const SPEAK_DELAY_MS = 350;
/**
 * From the praise for one finished item to the repeat of the one still open. The pacer waits the
 * praise out anyway, so the exact number changes nothing functionally – only how it sounds: a
 * slightly longer breath than before the finale, so the praise and the new request do not run into
 * one sentence. The finale makes do with 400 ms because what follows it is a picture, not an order.
 */
const REMAINING_DELAY_MS = 500;
/** From the praise of the last item to the start of the finale – it waits out the praise first. */
const FINALE_DELAY_MS = 400;

interface KitchenDevHandle {
  /** Plays any order at all, a two-item one included, whatever the save says. */
  play(order: Order): void;
  /** Replays the letter item alone; without an offer it takes the one of the order or the shelf. */
  letter(target: string, choices?: readonly string[]): void;
  digit(value: number, choices?: readonly number[]): void;
  /** Replays the counting item with any amount and kind, whatever the order says. */
  count(amount: number, kind?: FruitKind): void;
  /** An order without a playable item: the kitchen goes static. */
  clear(): void;
  /** Rings the bell from the console: the next customer walks in and brings an order. */
  ring(): void;
  /** Puts an animal at the counter without a walk, whatever the session says. */
  customer(id: CustomerId): void;
  /** Runs the finale of the current order straight away, without playing it. */
  finish(): void;
  /** Puts a number in the star counter (the picture only – the save is not touched). */
  stars(count: number): void;
  /** Closes the kitchen for `minutes` (default the hour of `CLOSED_MS`) and drops the shutter. */
  close(minutes?: number): void;
  /** Lifts the shutter and starts a new sitting. */
  open(): void;
  state(): CountingState | null;
  /** The choice still in play; with two of them the cookie comes first. */
  choice(): ChoiceState | null;
  layout(): KitchenLayout;
}

function prop(className: string, art: string): HTMLDivElement {
  const el = layer(`kitchen-prop ${className}`);
  el.innerHTML = art;
  return el;
}

/**
 * The kitchen: the counter starts empty with the bell on it. The child rings, a customer walks in
 * from the left with an order in a bubble over its head, and fills it – counting from the bowl
 * (STEP-05) and/or a choice from the shelf (STEP-06). The finale hands the cake over, the customer
 * eats it and leaves, and the bell comes back: nothing moves on until the child rings again
 * (STEP-10).
 *
 * From the eleventh order on there are TWO items on the counter at once (STEP-12), so the scene is
 * the one that speaks and the one that measures idleness: an item only ever says what answers one
 * tap of the child. Everything about the order as a whole – placing it, the 15 s nudge, the 40 s
 * hint, a tap on the bubble, the praise, what is still missing, the finale – is decided here.
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
  // Built before the items and the finale on purpose: the bell stays on the counter all the time
  // now, so the fruit and the cake have to fly IN FRONT of it, not behind it.
  const bell = createBellHandle({
    root: el,
    sfx: ctx.sfx,
    voice: ctx.voice,
    line: createBellPicker(),
    // Declared further down; only ever called when the child taps, long after the scene is built.
    onRing: () => ringBell(),
  });

  if (import.meta.env.DEV) {
    const guide = document.createElement('div');
    guide.className = 'kitchen-dev-guide';
    el.append(guide);
  }

  // One picker per kind for the whole scene, so two sentences in a row are never the same one –
  // whichever item earned them. The gender comes from the settings in STEP-19; until then neutral.
  const praise = createPraisePicker();
  const finish = createFinishPicker();
  const starLine = createStarPicker();
  /** Delays that never talk over the narrator: the order, the finale and what is left all use it. */
  const pacer = createPacer({ voice: ctx.voice });

  let order: Order = ctx.session.order;
  /** True from the praise of the last item until the counter is cleared. */
  let finishing = false;
  /** Positions in `order.items` that are on the cake already – what the bubble has ticked off. */
  const done = new Set<number>();

  const countItem = createCountItem({
    root: el,
    bowl: bowlEl,
    sfx: ctx.sfx,
    voice: ctx.voice,
    onActivity: () => idle.poke(),
    onDone: () => finishItem('count'),
  });
  // One instance per shelf: an order can ask for a candle AND a cookie at once, and then both are
  // in play. Each of them draws only its own shelf, so neither can overwrite the other's offer.
  const digitItem = createChoiceItem({
    root: el,
    kind: 'digit',
    shelf: digitShelf,
    // What the child is really learning, so the inert shelf never shows made-up content. Read per
    // order: the active set grows as the save does.
    decoration: () => shelfDecoration(ctx.session.save.tracks.numbers),
    sfx: ctx.sfx,
    voice: ctx.voice,
    onActivity: () => idle.poke(),
    onDone: () => finishItem('digit'),
  });
  const letterItem = createChoiceItem({
    root: el,
    kind: 'letter',
    shelf: letterShelf,
    decoration: () => shelfDecoration(ctx.session.save.tracks.letters),
    sfx: ctx.sfx,
    voice: ctx.voice,
    onActivity: () => idle.poke(),
    onDone: () => finishItem('letter'),
  });
  const bubble = createBubble({
    root: el,
    // Only while an item is actually being played: during the finale the tap does nothing.
    onTap: () => {
      if (finishing) return;
      const open = openItems();
      if (open.length === 0) return;
      // What is pending is the shorter repeat of what is left – it would cut this sentence off
      // half a second in, and the child is the one who asked for it (`pacer.after` only ever
      // replaces the pacer's own work, never a `voice.say()` that is already running).
      pacer.cancel();
      ctx.voice.say(askAgainSpeech(open));
      idle.poke();
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
    plate: () => [...countItem.plate(), ...digitItem.plate(), ...letterItem.plate()],
    onStar: () => writeProgress(),
    onDone: () => finishOrder(),
  });

  // Built last, so its layer lies over everything the kitchen draws – the shutter closes the whole
  // scene, the finale included.
  const closing = createClosing({
    root: el,
    voice: ctx.voice,
    sfx: ctx.sfx,
    state: () => ctx.session.save.session,
    onCode: () => ctx.session.reopen(),
    onOpen: () => bell.show(),
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

  /** Which handle plays this item – the one place the three of them are told apart. */
  function handleOf(item: OrderItem): {
    nudge(): void;
    hint(): void;
    outcome(): 'first-try' | 'hinted' | 'mistaken' | null;
  } {
    switch (item.type) {
      case 'count':
        return countItem;
      case 'digit':
        return digitItem;
      case 'letter':
        return letterItem;
    }
  }

  /** What the child still has to do, in the order of the bubble. */
  function openItems(): OrderItem[] {
    return order.items.filter((_, index) => !done.has(index));
  }

  /**
   * One watcher for the whole order (návrh 5.5): after 15 s everything still open gives a sign and
   * the narrator repeats it, after 40 s the FIRST open item lights up its target. `stop()` is final
   * by design, so every order builds a fresh one.
   */
  let idle: IdleWatcher = watcher();

  function watcher(): IdleWatcher {
    return createIdleWatcher({
      onRemind: () => {
        const open = openItems();
        if (open.length === 0) return;
        for (const item of open) handleOf(item).nudge();
        ctx.voice.say(repeatSpeech(open));
      },
      onHint: () => {
        // Only the first one: two rings lit at once would be two answers handed over. The watcher
        // starts again after a hint, so once this item is done the next hint shows the other.
        const first = openItems()[0];
        if (!first) return;
        handleOf(first).hint();
        ctx.voice.say(itemHintSpeech(first));
      },
    });
  }

  /**
   * One item is on the cake. Ticking it off is the bubble's whole job here; what happens next is
   * either the rest of the order or the finale – never both.
   */
  function itemDone(item: OrderItem): void {
    const index = order.items.indexOf(item);
    if (index < 0 || done.has(index)) return;
    done.add(index);
    bubble.tick(index);
    const open = openItems();
    if (open.length === 0) {
      startFinale();
      return;
    }
    // "Výborně!" and right behind it what is still missing, so the child knows the order goes on.
    pacer.after(REMAINING_DELAY_MS, () => ctx.voice.say(repeatSpeech(open)));
    idle.poke();
  }

  /** The praise belongs to the scene: it is what opens either the rest of the order or the finale. */
  function finishItem(type: OrderItem['type']): void {
    const item = order.items.find((candidate) => candidate.type === type);
    if (!item) return;
    ctx.voice.say(praise.next());
    itemDone(item);
  }

  /** The order is on the plate: nothing left to nudge about, the finale takes over. */
  function startFinale(): void {
    if (finishing) return;
    finishing = true;
    idle.stop();
    pacer.after(FINALE_DELAY_MS, () => finale.run());
  }

  /**
   * The star has landed. The outcome of each item is read here, not when the item finished: a tap
   * on the covered bowl during the finale is still a recount and still costs the number a point.
   */
  function writeProgress(): number {
    const results: ItemResult[] = [];
    for (const item of order.items) {
      const outcome = handleOf(item).outcome();
      if (outcome) results.push(itemResult(item, outcome));
    }
    order = ctx.session.complete(results);
    return starBalance(ctx.session.save.stars);
  }

  /**
   * The counter is empty again. The next order is already generated, but nothing happens until the
   * child rings – this is where the pace goes back to her (návrh kap. 4). Whoever is standing there
   * is the one who leaves: `session.complete()` ran when the star landed, so `session.customer` is
   * already the NEXT customer and must not be read here.
   */
  function finishOrder(): void {
    finale.reset();
    countItem.clear();
    digitItem.clear();
    letterItem.clear();
    bubble.show(null);
    ctx.voice.preload(orderPreload(order));
    // The tenth order of the sitting closes the kitchen (STEP-14) – but only once the customer has
    // walked out, so the shutter never comes down over an animal standing at the counter.
    customer.leave(() => {
      if (isClosed(ctx.session.save.session, Date.now())) closing.close();
      else bell.show();
    });
  }

  /** The child rang: the bell gets out of the way and the next customer walks in. */
  function ringBell(): void {
    bell.hide();
    customer.arrive(ctx.session.customer, () => startOrder(ctx.session.order));
  }

  /** Puts one order on the counter: the bubble, every playable item and the narrator. */
  function startOrder(next: Order): void {
    order = next;
    finishing = false;
    done.clear();
    idle.stop();
    idle = watcher();
    pacer.cancel();
    stars.set(starBalance(ctx.session.save.stars));
    bubble.show(next);
    const counted = countItemOf(next);
    const digit = choiceItemOf(next, 'digit');
    const letter = choiceItemOf(next, 'letter');
    if (counted) countItem.start(counted.amount, counted.fruit);
    else countItem.clear();
    if (digit) digitItem.start(digit);
    else digitItem.clear();
    if (letter) letterItem.start(letter);
    else letterItem.clear();
    if (!counted && !digit && !letter) {
      bubble.show(null);
      if (import.meta.env.DEV) {
        console.warn('[kitchen] the order has no playable item; the scene stays static');
      }
      return;
    }
    // ONE utterance for the whole order: "Prosím tři jahody. A ještě perníček s písmenkem ká."
    // Two `say()` calls would cut each other off (audio/voice.ts).
    pacer.after(SPEAK_DELAY_MS, () => ctx.voice.say(orderSpeech(next.items)));
    idle.poke();
  }

  countItem.layout(layout);
  digitItem.layout(layout);
  letterItem.layout(layout);
  bubble.layout(layout);
  stars.layout(layout);
  finale.layout(layout);
  customer.layout(layout);
  bell.layout(layout);
  closing.layout(0);
  // The kitchen opens EMPTY: no customer, no bubble, no order, only the bell (návrh kap. 4 – "the
  // bell rings, a customer comes"). The first thing the child does in the game is decide to start
  // it. An empty card would promise an order that nobody has placed yet.
  bubble.show(null);
  stars.set(starBalance(ctx.session.save.stars));
  ctx.voice.preload(orderPreload(order));
  ctx.voice.preload(closingPreload());
  // A sitting that ended before the page was reloaded is still over: the shutter is simply already
  // down, without the rattle (STEP-14).
  if (isClosed(ctx.session.save.session, Date.now())) closing.close({ animate: false });
  else bell.show();

  /** DEV only: the offer of the order when it fits, otherwise what stands on the shelf. */
  function devChoices(type: ChoiceItem['type']): string[] {
    const asked = choiceItemOf(order, type);
    if (asked) return choiceValues(asked);
    const tracks = ctx.session.save.tracks;
    return shelfDecoration(type === 'digit' ? tracks.numbers : tracks.letters);
  }

  /** DEV only: a replayed item is the whole order, bubble included – otherwise the card lies. */
  function devPlay(item: OrderItem): void {
    startOrder({ index: order.index, items: [item] });
  }

  const devHandle: KitchenDevHandle = {
    play: (next) => startOrder(next),
    letter(target, choices) {
      // Whatever the console types is taken as it comes; the game itself only passes real letters.
      const value = target as Letter;
      devPlay({
        type: 'letter',
        letter: value,
        word: isLetter(target) ? letterWord(target, ctx.session.save.settings) : '',
        choices: (choices ?? devChoices('letter')) as readonly Letter[],
      });
    },
    digit(value, choices) {
      devPlay({ type: 'digit', value, choices: choices ?? devChoices('digit').map(Number) });
    },
    count(amount, kind) {
      const fruit = kind ?? countItemOf(order)?.fruit ?? 'strawberry';
      devPlay({ type: 'count', amount, fruit });
    },
    clear() {
      ctx.voice.stop();
      pacer.cancel();
      idle.stop();
      finale.reset();
      bell.hide();
      finishing = false;
      done.clear();
      countItem.clear();
      digitItem.clear();
      letterItem.clear();
      bubble.show(null);
    },
    ring: () => ringBell(),
    customer: (id) => customer.show(id),
    finish() {
      order.items.forEach((_, index) => bubble.tick(index));
      startFinale();
    },
    stars: (count) => stars.set(count, { pop: true }),
    close(minutes) {
      ctx.session.close(minutes === undefined ? undefined : minutes * 60_000);
      closing.close();
    },
    open() {
      ctx.session.reopen();
      closing.open();
    },
    state: () => countItem.state(),
    choice: () => letterItem.state() ?? digitItem.state(),
    layout: () => layout,
  };
  const devWindow = window as unknown as { __kitchen?: KitchenDevHandle };
  if (import.meta.env.DEV) devWindow.__kitchen = devHandle;

  const choiceItems: readonly ChoiceItemHandle[] = [digitItem, letterItem];

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
      for (const item of choiceItems) item.layout(layout);
      bubble.layout(layout);
      stars.layout(layout);
      finale.layout(layout);
      customer.layout(layout);
      bell.layout(layout);
      closing.layout(size.width);
    },
    destroy() {
      // The scene does not own the narrator, but nothing it started may outlive it.
      ctx.voice.stop();
      pacer.cancel();
      idle.stop();
      finale.destroy();
      customer.destroy();
      bell.destroy();
      closing.destroy();
      countItem.destroy();
      for (const item of choiceItems) item.destroy();
      bubble.destroy();
      stars.destroy();
      // Leave the handle alone when a newer kitchen has already claimed it (crossfade order).
      if (import.meta.env.DEV && devWindow.__kitchen === devHandle) delete devWindow.__kitchen;
    },
  };
};
