import { describe, expect, it } from 'vitest';
import { FRUITS } from '../data/curriculum';
import { bear } from './bear';
import { fruitBowl } from './bowl';
import { cakeBase } from './cake';
import { candle } from './candle';
import { cookie } from './cookie';
import { hintRing } from './hint';
import { kitchenBackdrop } from './kitchen';
import { bowlLid } from './lid';
import { countPill } from './pill';
import { fruit, fruitWidth } from './fruit';
import { PALETTE } from './svg';

/** Every art module returns one <svg> element as a string. */
const MODULES: Record<string, string> = {
  bear: bear(),
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
  ])('%s has the size the layout expects', (_name, markup, viewBox, width, height) => {
    expect(attribute(markup!, 'viewBox')).toBe(viewBox);
    expect(attribute(markup!, 'width')).toBe(String(width));
    expect(attribute(markup!, 'height')).toBe(String(height));
  });

  it('draws the letter on the cookie and the digit on the candle', () => {
    expect(cookie('K')).toContain('>K</text>');
    expect(candle('3')).toContain('>3</text>');
    expect(cookie('Š')).toContain('>Š</text>');
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
});
