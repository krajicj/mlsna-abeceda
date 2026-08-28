/**
 * The shop (docs/navrh-hry.md kap. 7). The child taps the star counter in the kitchen and walks in
 * here: a shelf with the six things of the catalogue, each with its price in stars – as many full
 * ones as she can pay for, the rest empty to count. A tap on something she can afford brings up a
 * card with the thing, its price and a big ✓ / ✗; the narrator asks the question out loud, because
 * nothing here may be written down (rule 1).
 *
 * Nothing can go wrong in here (rule 2): too few stars is a rattle and "chybí ti dvě hvězdičky",
 * something already bought says "je tvoje!" again, and the door back to the kitchen is open the
 * whole time. `session.buy()` is the only thing that writes a purchase down (rule 4).
 *
 * A scene of its own and not a panel over the kitchen: the shelf does not fit over a kitchen, and
 * coming back rebuilds the kitchen – so bought decorations and a new fruit simply turn up, with no
 * "redraw the kitchen after a purchase" logic anywhere. Shopping is only possible with an empty
 * counter, so no order can be lost by it.
 */
import {
  ANSWER_SIZE,
  GOOD_HEIGHT,
  GOOD_PICTURE_HEIGHT,
  GOOD_WIDTH,
  PRICE_STAR,
  shopGoodPicture,
  shopLayout,
  shopPriceSlots,
  type ShopLayout,
} from '../../art/layout';
import {
  boughtTick,
  confirmCard,
  noButton,
  priceStar,
  shopBackdrop,
  shopBoard,
  shopDoor,
  shopGoodArt,
  yesButton,
} from '../../art/shop';
import { starsPill } from '../../art/star';
import type { Rect } from '../../art/svg';
import { SHOP_ITEMS, type ShopItemId } from '../../data/shop';
import { shopEntryOf, shopOffer, shopPriceStars, type ShopEntry } from '../../game/shop';
import {
  createShopHelloPicker,
  shopAskSpeech,
  shopBoughtSpeech,
  shopPreload,
  shopShortSpeech,
} from '../../game/speech';
import { starBalance } from '../../game/stars';
import { STAGE_HEIGHT } from '../../stage/layout';
import type { Scene } from '../../stage/scenes';
import { createMotion, layer, place } from '../kitchen/dom';
import './style.css';

/** A beat before the greeting, so it does not start over the scene fading in (as in the kitchen). */
const HELLO_DELAY_MS = 350;
const HOP_MS = 260;
const RATTLE_MS = 360;
const POP_MS = 320;
/** The tick over a bought thing; smaller than a price star row, it only has to be recognised. */
const TICK_SIZE = 40;

/** The picture of the thing inside the card: the same cell as on the shelf, in the middle of it. */
function cardCell(card: Rect): Rect {
  return {
    x: card.x + Math.round((card.width - GOOD_WIDTH) / 2),
    y: card.y + 32,
    width: GOOD_WIDTH,
    height: GOOD_HEIGHT,
  };
}

export const shopScene: Scene = (ctx) => {
  const el = document.createElement('div');
  el.className = 'scene-shop';

  const backdrop = layer('shop-backdrop');
  const boardEls = [layer('shop-board'), layer('shop-board')];
  const goodEls = SHOP_ITEMS.map(() => {
    const cell = layer('shop-good');
    const art = layer('shop-good-art');
    const price = layer('shop-good-price');
    cell.append(art, price);
    return { cell, art, price };
  });
  const doorEl = layer('shop-door');
  const starsEl = layer('shop-stars');
  const cardEl = layer('shop-card');
  cardEl.hidden = true;
  const cardBack = layer('shop-card-back');
  const cardPanel = layer('shop-card-panel');
  const cardArt = layer('shop-card-art');
  const cardPrice = layer('shop-card-price');
  const yesEl = layer('shop-answer');
  yesEl.innerHTML = yesButton(ANSWER_SIZE);
  const noEl = layer('shop-answer');
  noEl.innerHTML = noButton(ANSWER_SIZE);
  cardEl.append(cardBack, cardPanel, cardArt, cardPrice, yesEl, noEl);
  el.append(backdrop, ...boardEls, ...goodEls.map((good) => good.cell), doorEl, starsEl, cardEl);

  const motion = createMotion();
  const hello = createShopHelloPicker();
  let layout: ShopLayout = shopLayout(0);
  /** The width the backdrop markup was built for; rebuilding it on every draw would be waste. */
  let drawnWidth = 0;
  /** What the open card is asking about; null = no card. Also the guard against a double ✓. */
  let asking: ShopItemId | null = null;

  ctx.voice.preload(shopPreload());

  function balance(): number {
    return starBalance(ctx.session.save.stars);
  }

  function drawStars(options?: { readonly pop?: boolean }): void {
    starsEl.innerHTML = starsPill(balance());
    if (!options?.pop) return;
    motion.animate(
      starsEl,
      [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
      { duration: POP_MS, easing: 'ease-out' },
    );
  }

  /**
   * The price under the picture: full stars first, then the missing ones – or a tick if it is hers.
   * The slots come in stage coordinates and `target` is the price strip itself, so both offsets are
   * taken off them: the strip starts at the left edge of the cell, `GOOD_PICTURE_HEIGHT` down.
   */
  function drawPrice(target: HTMLElement, entry: ShopEntry, cell: Rect): void {
    const price = shopPriceStars(entry);
    if (entry.state === 'owned') {
      target.innerHTML = boughtTick(TICK_SIZE);
      target.classList.add('is-owned');
      return;
    }
    target.classList.remove('is-owned');
    const slots = shopPriceSlots(cell, price.filled + price.empty);
    target.innerHTML = slots
      .map((slot, index) => {
        const left = slot.x - cell.x;
        const top = slot.y - cell.y - GOOD_PICTURE_HEIGHT;
        return (
          `<span class="shop-price-star" style="left:${left}px;top:${top}px">` +
          `${priceStar(PRICE_STAR, index < price.filled)}</span>`
        );
      })
      .join('');
  }

  /** The whole shelf: the pictures, the prices and the balance – everything a purchase changes. */
  function drawShelf(): void {
    const offer = shopOffer(ctx.session.save.stars);
    for (const [index, entry] of offer.entries()) {
      const good = goodEls[index];
      const cell = layout.goods[index];
      if (!good || !cell) continue;
      place(good.cell, cell);
      const picture = shopGoodPicture(cell);
      place(good.art, { x: 0, y: 0, width: picture.width, height: picture.height });
      good.art.innerHTML = shopGoodArt(entry.item, picture);
      place(good.price, {
        x: 0,
        y: picture.height,
        width: cell.width,
        height: cell.height - picture.height,
      });
      drawPrice(good.price, entry, cell);
    }
  }

  function draw(width: number): void {
    if (width !== drawnWidth) {
      drawnWidth = width;
      backdrop.innerHTML = shopBackdrop(width);
    }
    place(backdrop, { x: 0, y: 0, width, height: STAGE_HEIGHT });
    for (const [index, boardEl] of boardEls.entries()) {
      const board = layout.boards[index];
      if (!board) continue;
      place(boardEl, board);
      boardEl.innerHTML = shopBoard(board);
    }
    place(doorEl, layout.door);
    doorEl.innerHTML = shopDoor(layout.door);
    place(starsEl, layout.stars);
    drawStars();
    drawShelf();
    drawCard();
  }

  /** The open card. Nothing is placed when no card is up – the layer is hidden anyway. */
  function drawCard(): void {
    const entry = asking === null ? null : shopEntryOf(ctx.session.save.stars, asking);
    if (!entry) return;
    const cell = cardCell(layout.card);
    place(cardPanel, layout.card);
    cardPanel.innerHTML = confirmCard(layout.card);
    const picture = shopGoodPicture(cell);
    place(cardArt, picture);
    cardArt.innerHTML = shopGoodArt(entry.item, picture);
    place(cardPrice, {
      x: cell.x,
      y: cell.y + picture.height,
      width: cell.width,
      height: cell.height - picture.height,
    });
    drawPrice(cardPrice, entry, cell);
    place(yesEl, layout.yes);
    place(noEl, layout.no);
  }

  function closeCard(): void {
    asking = null;
    cardEl.hidden = true;
  }

  function openCard(entry: ShopEntry): void {
    asking = entry.item.id;
    cardEl.hidden = false;
    drawCard();
    motion.animate(cardPanel, [{ transform: 'scale(0.92)' }, { transform: 'scale(1)' }], {
      duration: 180,
      easing: 'ease-out',
    });
  }

  function hop(index: number): void {
    const good = goodEls[index];
    if (!good) return;
    motion.animate(
      good.cell,
      [
        { transform: 'translateY(0px)' },
        { transform: 'translateY(-14px)' },
        { transform: 'translateY(0px)' },
      ],
      { duration: HOP_MS, easing: 'ease-out' },
    );
  }

  /** Too few stars: the thing shakes its head instead of the game saying no in words. */
  function rattle(index: number): void {
    const good = goodEls[index];
    if (!good) return;
    motion.animate(
      good.cell,
      [
        { transform: 'translateX(0px)' },
        { transform: 'translateX(-8px)' },
        { transform: 'translateX(8px)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(0px)' },
      ],
      { duration: RATTLE_MS, easing: 'ease-out' },
    );
  }

  /** The three answers to a tap on the shelf: it is hers, it is too dear, or the card asks. */
  function tapGood(index: number): void {
    if (asking !== null) return; // the card is up; the layer over the shelf catches the tap anyway
    const item = SHOP_ITEMS[index];
    if (!item) return;
    const entry = shopEntryOf(ctx.session.save.stars, item.id);
    if (!entry) return; // not in the catalogue – cannot happen, but it must not throw either
    hop(index);
    if (entry.state === 'owned') {
      ctx.voice.say(shopBoughtSpeech(item.id));
      return;
    }
    if (entry.state === 'short') {
      ctx.sfx.play('shop.rattle');
      rattle(index);
      ctx.voice.say(shopShortSpeech(entry.missing));
      return;
    }
    openCard(entry);
    ctx.voice.say(shopAskSpeech(item.id));
  }

  function buy(): void {
    const id = asking;
    if (id === null) return;
    closeCard(); // before the purchase: a second tap on the ✓ can then buy nothing
    if (!ctx.session.buy(id)) {
      // Should not happen – the card only ever opens for something affordable – but the number of
      // missing stars is read from the record again, never from the entry the card was opened with.
      ctx.voice.say(shopShortSpeech(shopEntryOf(ctx.session.save.stars, id)?.missing ?? 0));
      return;
    }
    ctx.sfx.play('shop.buy');
    ctx.voice.say(shopBoughtSpeech(id));
    drawShelf();
    drawStars({ pop: true });
  }

  function tap(target: HTMLElement, run: () => void): void {
    target.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      run();
    });
  }

  for (const [index, good] of goodEls.entries()) tap(good.cell, () => tapGood(index));
  tap(yesEl, () => buy());
  tap(noEl, () => closeCard());
  tap(cardBack, () => closeCard());
  tap(doorEl, () => ctx.go('kitchen'));

  motion.after(HELLO_DELAY_MS, () => ctx.voice.say(hello.next()));

  return {
    el,
    resize(size) {
      layout = shopLayout(size.width);
      draw(size.width);
    },
    destroy() {
      // The scene does not own the narrator, but nothing it started may outlive it.
      ctx.voice.stop();
      motion.cancelAll();
    },
  };
};
