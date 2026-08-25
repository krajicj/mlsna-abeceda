import { describe, expect, it } from 'vitest';
import { bear } from './bear';
import { fruitBowl } from './bowl';
import { cakeBase } from './cake';
import { candle } from './candle';
import { cookie } from './cookie';
import { kitchenBackdrop } from './kitchen';
import { strawberry } from './fruit';

/** Every art module returns one <svg> element as a string. */
const MODULES: Record<string, string> = {
  bear: bear(),
  cakeBase: cakeBase(),
  fruitBowl: fruitBowl(),
  strawberry: strawberry(88),
  cookie: cookie('K'),
  candle: candle('3'),
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

  it('scales the strawberry without stretching it', () => {
    expect(attribute(strawberry(52), 'width')).toBe('40');
    expect(attribute(strawberry(26), 'width')).toBe('20');
  });

  it('puts as many berries in the bowl as it has slots', () => {
    const front = (markup: string) => markup.match(/data-fruit="front"/g)?.length ?? 0;
    expect(front(fruitBowl())).toBe(3);
    expect(front(fruitBowl({ slots: 2 }))).toBe(2);
    expect(front(fruitBowl({ slots: 1 }))).toBe(1);
    expect(front(fruitBowl({ slots: 0 }))).toBe(0);
  });

  it('redraws the backdrop for the stage width it is given', () => {
    expect(attribute(kitchenBackdrop(1366), 'viewBox')).toBe('0 0 1366 768');
    expect(attribute(kitchenBackdrop(800), 'viewBox')).toBe('0 0 1024 768');
  });
});
