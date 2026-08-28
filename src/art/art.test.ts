import { describe, expect, it } from 'vitest';
import { FRUITS } from '../data/curriculum';
import { STARTER_CUSTOMERS } from '../data/customers';
import { bear } from './bear';
import { bell, BELL_SIZE } from './bell';
import { cat } from './cat';
import { customerArt, CUSTOMER_HEIGHT, CUSTOMER_WIDTH } from './customers';
import { rabbit } from './rabbit';
import { fruitBowl } from './bowl';
import { bubbleFruit, orderBubble, orderCheck, speakerIcon } from './bubble';
import { cakeBase, cakeGlaze } from './cake';
import { candle } from './candle';
import { kitchenTimer } from './clock';
import { cookie } from './cookie';
import { hintRing } from './hint';
import { kitchenBackdrop } from './kitchen';
import { confettiPiece, CONFETTI_COUNT, CONFETTI_SIZE } from './confetti';
import { bowlLid } from './lid';
import { codeDots, keyCap, padlock } from './lock';
import { shutter } from './shutter';
import { countPill } from './pill';
import { star, starsPill } from './star';
import { fruit, fruitWidth } from './fruit';
import { INK, PALETTE } from './svg';

/** Every art module returns one <svg> element as a string. */
const MODULES: Record<string, string> = {
  bear: bear(),
  rabbit: rabbit(),
  cat: cat(),
  bell: bell(),
  cakeBase: cakeBase(),
  fruitBowl: fruitBowl(),
  strawberry: fruit('strawberry', 88),
  blueberry: fruit('blueberry', 88),
  cherry: fruit('cherry', 88),
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
    ['bell', MODULES['bell'], '0 0 96 96', 96, 96],
    ['cakeBase', MODULES['cakeBase'], '-7 44 274 182', 220, 146],
    ['fruitBowl', MODULES['fruitBowl'], '0 0 320 140', 320, 140],
    ['strawberry', MODULES['strawberry'], '0 -6 40 52', 68, 88],
    ['blueberry', MODULES['blueberry'], '0 -6 40 52', 68, 88],
    ['cherry', MODULES['cherry'], '0 -6 40 52', 68, 88],
    ['countPill', MODULES['countPill'], '0 0 40 40', 40, 40],
    ['bowlLid', MODULES['bowlLid'], '0 0 320 80', 320, 80],
    ['hintRing', MODULES['hintRing'], '0 0 96 96', 96, 96],
    ['cookie', MODULES['cookie'], '0 0 96 96', 96, 96],
    ['candle', MODULES['candle'], '0 0 96 112', 96, 112],
    ['backdrop', MODULES['backdrop'], '0 0 1024 768', 1024, 768],
    // The glaze is laid on the very same box as the cake, so the two must match exactly.
    ['cakeGlaze', MODULES['cakeGlaze'], '-7 44 274 182', 220, 146],
    ['orderBubble', MODULES['orderBubble'], '0 0 480 148', 480, 148],
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

  it.each(STARTER_CUSTOMERS)('draws %s on the shared customer box', (id) => {
    const markup = customerArt(id);
    expect(attribute(markup, 'viewBox')).toBe(`0 0 ${CUSTOMER_WIDTH} ${CUSTOMER_HEIGHT}`);
    expect(attribute(markup, 'width')).toBe(String(CUSTOMER_WIDTH));
    expect(attribute(markup, 'height')).toBe(String(CUSTOMER_HEIGHT));
  });

  it('gives every customer its own clip path, so two of them never collide in the DOM', () => {
    const ids = STARTER_CUSTOMERS.map(
      (id) => /<clipPath id="([^"]+)"/.exec(customerArt(id))?.[1] ?? '',
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tells the three customers apart by their fur', () => {
    expect(customerArt('bear')).toContain(PALETTE.fur);
    expect(customerArt('rabbit')).toContain(PALETTE.furRabbit);
    expect(customerArt('cat')).toContain(PALETTE.furCat);
    expect(customerArt('rabbit')).not.toContain(PALETTE.fur);
    expect(customerArt('cat')).not.toContain(PALETTE.furRabbit);
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
