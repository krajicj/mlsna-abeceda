import { describe, expect, it } from 'vitest';
import { FRUITS } from '../data/curriculum';
import { CUSTOMERS, type CustomerId } from '../data/customers';
import { bear } from './bear';
import { bell, BELL_SIZE } from './bell';
import { cat } from './cat';
import { customerArt, CUSTOMER_HEIGHT, CUSTOMER_WIDTH } from './customers';
import { frog } from './frog';
import { rabbit } from './rabbit';
import { fruitBowl } from './bowl';
import { bubbleFruit, orderBubble, orderCheck, speakerIcon } from './bubble';
import { cakeBase, cakeGlaze } from './cake';
import { candle } from './candle';
import { kitchenTimer } from './clock';
import { cookie } from './cookie';
import { hintRing } from './hint';
import {
  flag,
  iceCreamBase,
  iceCreamTopping,
  wafer,
  FLAG_HEIGHT,
  FLAG_WIDTH,
  ICECREAM_HEIGHT,
  ICECREAM_WIDTH,
  WAFER_SIZE,
} from './icecream';
import { productBase, productDigitArt, productLetterArt } from './product';
import { kitchenBackdrop } from './kitchen';
import { confettiPiece, CONFETTI_COUNT, CONFETTI_SIZE } from './confetti';
import { bowlLid } from './lid';
import { codeDots, keyCap, padlock } from './lock';
import { shutter } from './shutter';
import { countPill } from './pill';
import { star, starsPill } from './star';
import { basket, BASKET_SIZE } from './basket';
import {
  radioNiche,
  radioSet,
  sleepingCat,
  DECOR_CAT_HEIGHT,
  DECOR_CAT_WIDTH,
  RADIO_HEIGHT,
  RADIO_WIDTH,
} from './decor';
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
} from './shop';
import { decorLayout, shopGoodPicture, shopLayout, ANSWER_SIZE, PRICE_STAR } from './layout';
import { PRODUCTS } from '../data/products';
import { SHOP_ITEMS } from '../data/shop';
import { fruit, fruitWidth } from './fruit';
import { fitted, INK, PALETTE } from './svg';

/** Every animal, the ones bought in the shop included – art nobody tests is art nobody drew. */
const ALL_CUSTOMERS = Object.keys(CUSTOMERS) as CustomerId[];

/** Every art module returns one <svg> element as a string. */
const MODULES: Record<string, string> = {
  bear: bear(),
  rabbit: rabbit(),
  cat: cat(),
  frog: frog(),
  bell: bell(),
  cakeBase: cakeBase(),
  fruitBowl: fruitBowl(),
  strawberry: fruit('strawberry', 88),
  blueberry: fruit('blueberry', 88),
  cherry: fruit('cherry', 88),
  raspberry: fruit('raspberry', 88),
  cookie: cookie('K'),
  candle: candle('3'),
  countPill: countPill({ digit: '3', done: false }),
  bowlLid: bowlLid(),
  hintRing: hintRing(96),
  backdrop: kitchenBackdrop(1024),
  cakeGlaze: cakeGlaze(),
  orderBubble: orderBubble(),
  speakerIcon: speakerIcon(44),
  orderCheck: orderCheck(48),
  blankCookie: cookie(),
  blankCandle: candle(),
  bubbleFruit: bubbleFruit('strawberry', 3),
  star: star(),
  starsPill: starsPill(3),
  confettiPiece: confettiPiece(0),
  shutter: shutter(1024, 768),
  timerFull: kitchenTimer({ size: 260, progress: 1 }),
  timerHalf: kitchenTimer({ size: 260, progress: 0.5 }),
  timerEmpty: kitchenTimer({ size: 260, progress: 0 }),
  padlock: padlock(),
  keyCap: keyCap('7'),
  codeDots: codeDots(2, 4),
  // The shop and the decorations (STEP-16).
  basket: basket(),
  basketAsleep: basket(BASKET_SIZE, { dim: true }),
  starsPillShop: starsPill(3, { basket: 'ready' }),
  starsPillAsleep: starsPill(12, { basket: 'asleep' }),
  priceStarFull: priceStar(PRICE_STAR, true),
  priceStarEmpty: priceStar(PRICE_STAR, false),
  boughtTick: boughtTick(40),
  yesButton: yesButton(),
  noButton: noButton(),
  shopDoor: shopDoor({ x: 32, y: 412, width: 140, height: 280 }),
  confirmCard: confirmCard({ x: 0, y: 0, width: 440, height: 420 }),
  shopBoard: shopBoard({ x: 0, y: 0, width: 660, height: 44 }),
  shopBackdrop: shopBackdrop(1024),
  sleepingCat: sleepingCat(),
  radioSet: radioSet(),
  radioNiche: radioNiche(decorLayout(1024).radio),
  // The ice cream (STEP-17).
  iceCreamBase: iceCreamBase(),
  iceCreamTopping: iceCreamTopping(),
  wafer: wafer('K'),
  blankWafer: wafer(),
  flag: flag('3'),
  blankFlag: flag(),
};

/** Minimal well-formedness check: every tag closes, in the right order, exactly once. */
function unbalancedTags(markup: string): string[] {
  const problems: string[] = [];
  const stack: string[] = [];
  for (const [, slash, name, rest] of markup.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g)) {
    if (name === undefined) continue;
    if (slash === '/') {
      if (stack.pop() !== name) problems.push(`unexpected </${name}>`);
    } else if (!(rest ?? '').trimEnd().endsWith('/')) {
      stack.push(name);
    }
  }
  return [...problems, ...stack.map((name) => `unclosed <${name}>`)];
}

function attribute(markup: string, name: string): string | undefined {
  return new RegExp(`^<svg[^>]*\\s${name}="([^"]*)"`).exec(markup)?.[1];
}

describe('art modules', () => {
  it.each(Object.entries(MODULES))('%s is one well-formed <svg>', (_name, markup) => {
    expect(markup.trimStart().startsWith('<svg')).toBe(true);
    expect(markup.match(/<svg\b/g)).toHaveLength(1);
    expect(unbalancedTags(markup)).toEqual([]);
  });

  it.each(Object.entries(MODULES))('%s stays offline and script-free', (_name, markup) => {
    expect(markup).not.toContain('<script');
    expect(markup).not.toContain('http://');
    expect(markup).not.toContain('https://');
  });

  it.each([
    ['bear', MODULES['bear'], '0 0 260 320', 260, 320],
    ['rabbit', MODULES['rabbit'], '0 0 260 320', 260, 320],
    ['cat', MODULES['cat'], '0 0 260 320', 260, 320],
    ['frog', MODULES['frog'], '0 0 260 320', 260, 320],
    ['bell', MODULES['bell'], '0 0 96 96', 96, 96],
    ['cakeBase', MODULES['cakeBase'], '-7 44 274 182', 220, 146],
    ['fruitBowl', MODULES['fruitBowl'], '0 0 320 140', 320, 140],
    ['strawberry', MODULES['strawberry'], '0 -6 40 52', 68, 88],
    ['blueberry', MODULES['blueberry'], '0 -6 40 52', 68, 88],
    ['cherry', MODULES['cherry'], '0 -6 40 52', 68, 88],
    ['raspberry', MODULES['raspberry'], '0 -6 40 52', 68, 88],
    ['countPill', MODULES['countPill'], '0 0 40 40', 40, 40],
    ['bowlLid', MODULES['bowlLid'], '0 0 320 80', 320, 80],
    ['hintRing', MODULES['hintRing'], '0 0 96 96', 96, 96],
    ['cookie', MODULES['cookie'], '0 0 96 96', 96, 96],
    ['candle', MODULES['candle'], '0 0 96 112', 96, 112],
    ['backdrop', MODULES['backdrop'], '0 0 1024 768', 1024, 768],
    // The glaze is laid on the very same box as the cake, so the two must match exactly.
    ['cakeGlaze', MODULES['cakeGlaze'], '-7 44 274 182', 220, 146],
    ['orderBubble', MODULES['orderBubble'], '0 0 480 148', 480, 148],
    // The ice cream stands on the same box as the cake, so the counter never has to move.
    [
      'iceCreamBase',
      MODULES['iceCreamBase'],
      `0 0 ${ICECREAM_WIDTH} ${ICECREAM_HEIGHT}`,
      ICECREAM_WIDTH,
      ICECREAM_HEIGHT,
    ],
    // The sauce is laid on the very same box as the cone, exactly as the glaze is on the cake.
    [
      'iceCreamTopping',
      MODULES['iceCreamTopping'],
      `0 0 ${ICECREAM_WIDTH} ${ICECREAM_HEIGHT}`,
      ICECREAM_WIDTH,
      ICECREAM_HEIGHT,
    ],
    ['wafer', MODULES['wafer'], `0 0 ${WAFER_SIZE} ${WAFER_SIZE}`, WAFER_SIZE, WAFER_SIZE],
    ['flag', MODULES['flag'], `0 0 ${FLAG_WIDTH} ${FLAG_HEIGHT}`, FLAG_WIDTH, FLAG_HEIGHT],
    ['bubbleFruit', MODULES['bubbleFruit'], '0 0 116 88', 116, 88],
    ['star', MODULES['star'], '0 0 40 40', 40, 40],
    ['starsPill', MODULES['starsPill'], '0 0 160 64', 160, 64],
    ['confettiPiece', MODULES['confettiPiece'], '0 0 18 18', 18, 18],
    ['shutter', MODULES['shutter'], '0 0 1024 768', 1024, 768],
    ['timerHalf', MODULES['timerHalf'], '0 0 260 260', 260, 260],
    ['padlock', MODULES['padlock'], '0 0 96 96', 96, 96],
    ['keyCap', MODULES['keyCap'], '0 0 96 96', 96, 96],
    // Four dots 20 px across with 12 px between them.
    ['codeDots', MODULES['codeDots'], '0 0 116 48', 116, 48],
    // The shop (STEP-16): every drawing of a decoration is exactly its exported natural size, so
    // `decorLayout()` and the cells of the shelf can be built from those constants.
    ['basket', MODULES['basket'], `0 0 ${BASKET_SIZE} ${BASKET_SIZE}`, BASKET_SIZE, BASKET_SIZE],
    ['starsPillShop', MODULES['starsPillShop'], '0 0 160 64', 160, 64],
    ['yesButton', MODULES['yesButton'], '0 0 120 120', ANSWER_SIZE, ANSWER_SIZE],
    ['noButton', MODULES['noButton'], '0 0 120 120', ANSWER_SIZE, ANSWER_SIZE],
    ['shopDoor', MODULES['shopDoor'], '0 0 140 280', 140, 280],
    ['shopBackdrop', MODULES['shopBackdrop'], '0 0 1024 768', 1024, 768],
    [
      'sleepingCat',
      MODULES['sleepingCat'],
      `0 0 ${DECOR_CAT_WIDTH} ${DECOR_CAT_HEIGHT}`,
      DECOR_CAT_WIDTH,
      DECOR_CAT_HEIGHT,
    ],
    [
      'radioSet',
      MODULES['radioSet'],
      `0 0 ${RADIO_WIDTH} ${RADIO_HEIGHT}`,
      RADIO_WIDTH,
      RADIO_HEIGHT,
    ],
  ])('%s has the size the layout expects', (_name, markup, viewBox, width, height) => {
    expect(attribute(markup!, 'viewBox')).toBe(viewBox);
    expect(attribute(markup!, 'width')).toBe(String(width));
    expect(attribute(markup!, 'height')).toBe(String(height));
  });

  it.each(Object.entries(MODULES))('%s paints only with the palette', (_name, markup) => {
    const allowed = new Set<string>([INK, ...Object.values(PALETTE)].map((c) => c.toUpperCase()));
    const used = [...markup.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((match) =>
      match[0].toUpperCase(),
    );
    expect([...new Set(used)].filter((colour) => !allowed.has(colour))).toEqual([]);
  });

  it.each(ALL_CUSTOMERS)('draws %s on the shared customer box', (id) => {
    const markup = customerArt(id);
    expect(attribute(markup, 'viewBox')).toBe(`0 0 ${CUSTOMER_WIDTH} ${CUSTOMER_HEIGHT}`);
    expect(attribute(markup, 'width')).toBe(String(CUSTOMER_WIDTH));
    expect(attribute(markup, 'height')).toBe(String(CUSTOMER_HEIGHT));
  });

  it('gives every customer its own clip path, so two of them never collide in the DOM', () => {
    const ids = ALL_CUSTOMERS.map(
      (id) => /<clipPath id="([^"]+)"/.exec(customerArt(id))?.[1] ?? '',
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tells the customers apart by their skin', () => {
    expect(customerArt('bear')).toContain(PALETTE.fur);
    expect(customerArt('rabbit')).toContain(PALETTE.furRabbit);
    expect(customerArt('cat')).toContain(PALETTE.furCat);
    expect(customerArt('frog')).toContain(PALETTE.frog);
    expect(customerArt('rabbit')).not.toContain(PALETTE.fur);
    expect(customerArt('cat')).not.toContain(PALETTE.furRabbit);
    // The frog is the one customer with no fur at all – she must not borrow anyone's.
    expect(customerArt('frog')).not.toContain(PALETTE.fur);
    expect(customerArt('frog')).not.toContain(PALETTE.furRabbit);
    expect(customerArt('frog')).not.toContain(PALETTE.furCat);
  });

  it('makes the bell a target a thumb can hit', () => {
    // The drawing IS the hit box in the scene, so its own size has to clear rule 3 (88 px).
    expect(BELL_SIZE).toBeGreaterThanOrEqual(88);
    expect(bell()).toContain(PALETTE.brass);
    expect(attribute(bell(64), 'viewBox')).toBe(attribute(bell(), 'viewBox'));
    expect(attribute(bell(64), 'width')).toBe('64');
  });

  it('draws the letter on the cookie and the digit on the candle', () => {
    expect(cookie('K')).toContain('>K</text>');
    expect(candle('3')).toContain('>3</text>');
    expect(cookie('Š')).toContain('>Š</text>');
  });

  it('leaves the cookie and the candle blank when nothing is asked for', () => {
    // What the order bubble shows: the kind of thing, never the answer (návrh 5.4). With the
    // letter drawn here the child could fill the order by matching two pictures.
    expect(cookie()).not.toContain('<text');
    expect(candle()).not.toContain('<text');
    expect(cookie()).toContain(PALETTE.dough);
    expect(candle()).toContain(PALETTE.wax);
    expect(attribute(cookie(), 'viewBox')).toBe(attribute(cookie('K'), 'viewBox'));
    expect(attribute(candle(), 'viewBox')).toBe(attribute(candle('3'), 'viewBox'));
  });

  it('scales the fruit without stretching it', () => {
    expect(attribute(fruit('strawberry', 52), 'width')).toBe('40');
    expect(attribute(fruit('cherry', 26), 'width')).toBe('20');
    expect(fruitWidth(44)).toBe(34);
  });

  it.each(FRUITS)('draws the %s in its own colour', (kind) => {
    expect(fruit(kind, 88)).toContain(PALETTE[kind]);
  });

  it('puts as many pieces of fruit in the bowl as it has slots', () => {
    const front = (markup: string) => markup.match(/data-fruit="front"/g)?.length ?? 0;
    expect(front(fruitBowl())).toBe(3);
    expect(front(fruitBowl({ slots: 2 }))).toBe(2);
    expect(front(fruitBowl({ slots: 1 }))).toBe(1);
    expect(front(fruitBowl({ slots: 0 }))).toBe(0);
  });

  it('numbers every piece of fruit in the bowl so a tap can bounce exactly that one', () => {
    const spots = [...fruitBowl().matchAll(/data-spot="(\d)"/g)].map((match) => Number(match[1]));
    expect(spots.slice().sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it('draws the far rim of the bowl behind the fruit and the near wall in front of it', () => {
    const markup = fruitBowl();
    const farRim = markup.indexOf('A154 22');
    const firstFruit = markup.indexOf('data-fruit=');
    const nearWall = markup.indexOf('Q30 136');
    expect(farRim).toBeGreaterThan(-1);
    expect(farRim).toBeLessThan(firstFruit);
    expect(firstFruit).toBeLessThan(nearWall);
  });

  it.each(FRUITS)('fills the bowl with the %s the order asks for', (kind) => {
    const bowl = fruitBowl({ kind });
    expect(bowl.match(/data-fruit="front"/g)).toHaveLength(3);
    expect(bowl).toContain(PALETTE[kind]);
    for (const other of FRUITS.filter((k) => k !== kind)) {
      expect(bowl).not.toContain(PALETTE[other]);
    }
  });

  it('marks the pill as done by its fill and its digit colour', () => {
    const empty = countPill({ digit: '2', done: false });
    const done = countPill({ digit: '2', done: true });
    expect(empty).toContain('>2</text>');
    expect(done).toContain('>2</text>');
    expect(empty).toContain(PALETTE.pillMuted);
    expect(done).toContain(PALETTE.pillDone);
    expect(done).not.toContain(PALETTE.pillMuted);
  });

  it('dashes the hint ring and keeps it inside its box', () => {
    expect(hintRing(96)).toContain('stroke-dasharray="7 6"');
    expect(hintRing(96)).toContain('r="42"');
    expect(hintRing(40)).toContain('r="14"');
  });

  it('leaves the hint ring hollow, so it never veils the letter under it', () => {
    expect(hintRing(96)).toContain('fill="none"');
    expect(hintRing(96)).not.toContain('fill-opacity');
  });

  it('fills the door of the counter with the radio, at the size of the door', () => {
    // The bought radio takes one door of the counter out and stands in the opening (návrh 7.3a),
    // so its drawing is exactly the size of that door – and the whole door is then the target.
    const panel = decorLayout(1024).radio;
    const markup = radioNiche(panel);
    expect(attribute(markup, 'width')).toBe(String(panel.width));
    expect(attribute(markup, 'height')).toBe(String(panel.height));
    expect(markup).toContain(PALETTE.brass); // the dial of the radio inside the opening
    expect(Math.min(panel.width, panel.height)).toBeGreaterThanOrEqual(88); // rule 3
  });

  it('redraws the backdrop for the stage width it is given', () => {
    expect(attribute(kitchenBackdrop(1366), 'viewBox')).toBe('0 0 1366 768');
    expect(attribute(kitchenBackdrop(800), 'viewBox')).toBe('0 0 1024 768');
  });

  it('draws the order card with a tail that points down at the customer', () => {
    // One closed outline for the card and the tail: two shapes would show a seam at the join.
    expect(orderBubble().match(/<path/g)).toHaveLength(1);
    expect(orderBubble()).toContain('L 110 146');
  });

  it('leaves the middle of the cake clear so the glaze hides nothing', () => {
    // The band follows the front rim (y 64…107 of the view box); the fruit stands above it.
    expect(cakeGlaze()).toContain('M62 64');
    expect(cakeGlaze()).not.toContain('ellipse');
  });

  it('puts as much fruit in the bubble as the order asks for', () => {
    const pieces = (markup: string) => markup.match(/<g transform="translate/g)?.length ?? 0;
    expect(pieces(bubbleFruit('strawberry', 1))).toBe(1);
    expect(pieces(bubbleFruit('cherry', 3))).toBe(3);
    expect(pieces(bubbleFruit('blueberry', 5))).toBe(5);
    // Out of range is clamped, never dropped: an order is always drawn.
    expect(pieces(bubbleFruit('strawberry', 0))).toBe(1);
    expect(pieces(bubbleFruit('strawberry', 9))).toBe(5);
    expect(bubbleFruit('cherry', 2)).toContain(PALETTE.cherry);
  });

  it('shows the number of stars in the counter', () => {
    expect(starsPill(0)).toContain('>0</text>');
    expect(starsPill(7)).toContain('>7</text>');
    expect(starsPill(12)).toContain('>12</text>');
    expect(starsPill(-3)).toContain('>0</text>');
    expect(star()).toContain(PALETTE.star);
  });

  it('fills the price star only when the child can pay for it', () => {
    expect(priceStar(PRICE_STAR, true)).toContain(PALETTE.star);
    expect(priceStar(PRICE_STAR, false)).toContain(PALETTE.white);
    expect(priceStar(PRICE_STAR, false)).not.toContain(PALETTE.star);
  });

  it('wakes the basket up and puts it to sleep without moving anything in the pill', () => {
    const asleep = starsPill(3, { basket: 'asleep' });
    const ready = starsPill(3, { basket: 'ready' });
    const none = starsPill(3);
    // The number is on the same place in all three, so switching the state never shifts it.
    expect(asleep).toContain('>3</text>');
    expect(ready).toContain('>3</text>');
    expect(none).toContain('>3</text>');
    expect(asleep).toContain('opacity="0.35"');
    expect(ready).not.toContain('opacity="0.35"');
    // The shop draws the pill without a basket: it must not promise a way into itself.
    expect(none).not.toContain('translate(112');
    expect(ready).toContain('translate(112');
    // A three-digit balance gets a smaller number rather than a wider pill.
    expect(starsPill(128, { basket: 'ready' })).toContain('font-size="24"');
    expect(ready).toContain('font-size="30"');
  });

  it('draws finished art smaller without stretching or cropping it', () => {
    const box = { x: 0, y: 0, width: 180, height: 140 };
    const markup = fitted(frog(), { width: CUSTOMER_WIDTH, height: CUSTOMER_HEIGHT }, box);
    expect(attribute(markup, 'viewBox')).toBe(`0 0 ${CUSTOMER_WIDTH} ${CUSTOMER_HEIGHT}`);
    expect(attribute(markup, 'width')).toBe('180');
    expect(attribute(markup, 'height')).toBe('140');
    expect(markup).toContain('preserveAspectRatio="xMidYMid meet"');
    // The drawing itself is handed on untouched – nothing rewrites another module's markup.
    expect(markup).toContain(frog());
    expect(unbalancedTags(markup)).toEqual([]);
  });

  it.each(SHOP_ITEMS.map((item) => [item.id, item] as const))(
    'draws %s on the shelf at the size of the cell',
    (_id, item) => {
      const box = shopGoodPicture(shopLayout(1024).goods[0]!);
      const markup = shopGoodArt(item, box);
      expect(markup.trimStart().startsWith('<svg')).toBe(true);
      expect(unbalancedTags(markup)).toEqual([]);
      const width = Number(attribute(markup, 'width'));
      const height = Number(attribute(markup, 'height'));
      expect(width).toBeGreaterThan(0);
      expect(width).toBeLessThanOrEqual(box.width);
      expect(height).toBeLessThanOrEqual(box.height);
      // It fills the cell in one direction: a picture that only half fills it was not fitted at all.
      expect(Math.max(width / box.width, height / box.height)).toBeCloseTo(1, 5);
    },
  );

  it('shrinks the frog into the cell instead of cropping her', () => {
    const box = shopGoodPicture(shopLayout(1024).goods[0]!);
    const markup = shopGoodArt(
      SHOP_ITEMS.find((item) => item.id === 'customer.frog')!,
      box,
    );
    expect(attribute(markup, 'viewBox')).toBe(`0 0 ${CUSTOMER_WIDTH} ${CUSTOMER_HEIGHT}`);
    expect(attribute(markup, 'width')).toBe(String(box.width));
    expect(attribute(markup, 'height')).toBe(String(box.height));
    expect(markup).toContain('preserveAspectRatio="xMidYMid meet"');
  });

  it('gives every confetti piece a shape and a colour of its own', () => {
    for (let index = 0; index < CONFETTI_COUNT; index += 1) {
      const piece = confettiPiece(index);
      expect(piece.trimStart().startsWith('<svg')).toBe(true);
      expect(unbalancedTags(piece)).toEqual([]);
    }
    expect(confettiPiece(0)).toContain('<rect');
    expect(confettiPiece(1)).toContain('<circle');
    expect(confettiPiece(2)).toContain('<path');
    expect(CONFETTI_SIZE).toBeGreaterThan(0);
  });
});

describe('the drawings of the ice cream (STEP-17)', () => {
  it('carries the letter and the digit only when it has one', () => {
    // The order bubble shows the blank one: "a wafer", not "the wafer with a K" (návrh 5.4).
    expect(wafer('K')).toContain('>K<');
    expect(wafer()).not.toContain('<text');
    expect(flag('3')).toContain('>3<');
    expect(flag()).not.toContain('<text');
  });

  it('arrives finished, with its scoops already on it', () => {
    // Nothing is ever counted onto it, so the scoops are part of the picture (návrh kap. 4).
    const markup = iceCreamBase();
    for (const fill of [PALETTE.spongeLight, PALETTE.strawberry, PALETTE.frosting]) {
      expect(markup).toContain(fill);
    }
    expect(markup).toContain(PALETTE.dough); // the cone
    expect(markup).toContain(INK); // the 4 px outline of rule 8
  });

  it('keeps the wafer and the cookie apart at a glance', () => {
    // A rounded square against a circle: the two never stand on the same shelf, but the child
    // meets both, and two identical brown discs would be one picture too few.
    expect(wafer()).toContain('<rect');
    expect(cookie()).not.toContain('<rect');
  });
});

describe('the art dispatcher (STEP-17)', () => {
  it('has a picture for every product in the catalogue', () => {
    for (const product of PRODUCTS) {
      for (const markup of [
        productBase(product.id),
        productLetterArt(product.id, 'K'),
        productDigitArt(product.id, '3'),
      ]) {
        expect(markup.trimStart().startsWith('<svg'), product.id).toBe(true);
        expect(unbalancedTags(markup), product.id).toEqual([]);
      }
    }
  });

  it('sends each product to its own art', () => {
    expect(productBase('cake')).toBe(cakeBase());
    expect(productBase('icecream')).toBe(iceCreamBase());
    expect(productLetterArt('icecream', 'K')).toBe(wafer('K'));
    expect(productDigitArt('icecream', '3')).toBe(flag('3'));
    // The cake is untouched: exactly the markup the game has been drawing all along.
    expect(productLetterArt('cake', 'K')).toBe(cookie('K'));
    expect(productDigitArt('cake', '3')).toBe(candle('3'));
  });
});
