import { describe, expect, it } from 'vitest';
import {
  BASE_LETTERS,
  FRUITS,
  LETTER_WORDS,
  ROLE_WORDS,
  type FruitKind,
  type Letter,
} from '../data/curriculum';
import { hasLine } from '../data/lines.cs';
import type { Order, OrderItem } from './orders';
import { createRng } from './rng';
import {
  askAgainSpeech,
  correctionSpeech,
  countSpeech,
  createFinishPicker,
  createLinePicker,
  createPraisePicker,
  createStarPicker,
  enoughSpeech,
  hintSpeech,
  orderPreload,
  orderSpeech,
  repeatSpeech,
} from './speech';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function letterItem(
  letter: Letter,
  word: string,
  choices: readonly Letter[] = [letter],
): OrderItem {
  return { type: 'letter', letter, word, choices };
}

function countItem(amount: number, fruit: FruitKind = 'strawberry'): OrderItem {
  return { type: 'count', amount, fruit };
}

function digitItem(value: number, choices: readonly number[] = [value]): OrderItem {
  return { type: 'digit', value, choices };
}

function order(items: readonly OrderItem[]): Order {
  return { index: 1, items };
}

/** Every id the game can ask for has to exist as a clip – silence would be a bug, not a feature. */
function expectKnown(ids: readonly string[]): void {
  for (const id of ids) expect({ id, known: hasLine(id) }).toEqual({ id, known: true });
}

describe('orderSpeech', () => {
  it('says the order and the word for a letter', () => {
    expect(orderSpeech(letterItem('K', 'kočka'))).toEqual([
      'order.letter.k',
      'letter.word.k.kocka',
    ]);
  });

  it('drops the word when the dev console asks for something that is not a letter', () => {
    expect(orderSpeech(letterItem('K', ''))).toEqual(['order.letter.k']);
  });

  it('says one sentence for a digit and one for counting', () => {
    expect(orderSpeech(digitItem(3))).toEqual(['order.digit.3']);
    expect(orderSpeech(countItem(3, 'strawberry'))).toEqual(['order.count.3.strawberry']);
  });

  it('repeats only the first sentence in the 15 s nudge', () => {
    expect(repeatSpeech(letterItem('K', 'kočka'))).toEqual(['order.letter.k']);
    expect(repeatSpeech(digitItem(3))).toEqual(['order.digit.3']);
    expect(repeatSpeech(countItem(2, 'cherry'))).toEqual(['order.count.2.cherry']);
  });

  it('says the whole order when the child asks for it (a tap on the bubble)', () => {
    // The nudge drops "Ká jako kočka." because nobody asked; a tap is the child saying they do
    // not know any more, and that sentence is the one that gives the letter a meaning.
    expect(askAgainSpeech(letterItem('K', 'kočka'))).toEqual([
      'order.letter.k',
      'letter.word.k.kocka',
    ]);
    expect(askAgainSpeech(letterItem('K', 'kočka')).length).toBeGreaterThan(
      repeatSpeech(letterItem('K', 'kočka')).length,
    );
    // A digit and a counting order are one sentence either way.
    expect(askAgainSpeech(digitItem(3))).toEqual(repeatSpeech(digitItem(3)));
    expect(askAgainSpeech(countItem(2, 'cherry'))).toEqual(repeatSpeech(countItem(2, 'cherry')));
    expectKnown(askAgainSpeech(letterItem('K', 'kočka')));
  });
});

describe('the sentences of one item', () => {
  it('counts out loud and stops the counting', () => {
    expect(countSpeech(3)).toEqual(['count.3']);
    expect(enoughSpeech(3, 'strawberry')).toEqual(['count.enough.3.strawberry']);
  });

  it('names the wrong piece and then points on', () => {
    expect(correctionSpeech('K', 'A', false)).toEqual(['wrong.letter.a', 'seek.letter.k']);
    expect(correctionSpeech('3', '5', false)).toEqual(['wrong.digit.5', 'seek.digit.3']);
  });

  it('replaces "hledáme" with the hint once the answer is lit up', () => {
    expect(correctionSpeech('K', 'A', true)).toEqual(['wrong.letter.a', 'hint.letter.k']);
    expect(hintSpeech('K')).toEqual(['hint.letter.k']);
    expect(hintSpeech('3')).toEqual(['hint.digit.3']);
  });
});

describe('every id the game can ask for is in the manifest', () => {
  it('covers all 22 letters, their words and the family words', () => {
    for (const letter of BASE_LETTERS) {
      expectKnown(orderSpeech(letterItem(letter, LETTER_WORDS[letter])));
      expectKnown(repeatSpeech(letterItem(letter, LETTER_WORDS[letter])));
      expectKnown(hintSpeech(letter));
      for (const wrong of BASE_LETTERS) {
        expectKnown(correctionSpeech(letter, wrong, false));
        expectKnown(correctionSpeech(letter, wrong, true));
      }
    }
    for (const entry of ROLE_WORDS) {
      expectKnown(orderSpeech(letterItem(entry.letter, entry.word)));
    }
  });

  it('covers the digits 1 to 10', () => {
    for (const value of DIGITS) {
      const target = String(value);
      expectKnown(orderSpeech(digitItem(value)));
      expectKnown(hintSpeech(target));
      expectKnown(countSpeech(value));
      for (const wrong of DIGITS) expectKnown(correctionSpeech(target, String(wrong), false));
    }
  });

  it('covers all three fruits in the whole range', () => {
    for (const fruit of FRUITS) {
      for (const amount of DIGITS) {
        expectKnown(orderSpeech(countItem(amount, fruit)));
        expectKnown(enoughSpeech(amount, fruit));
      }
    }
  });
});

describe('orderPreload', () => {
  it('holds everything the counting item can need', () => {
    const ids = orderPreload(order([countItem(3, 'blueberry')]));
    expect(ids).toContain('order.count.3.blueberry');
    expect(ids).toContain('count.1');
    expect(ids).toContain('count.3');
    expect(ids).not.toContain('count.4');
    expect(ids).toContain('count.enough.3.blueberry');
    expect(ids).toContain('praise.neutral.1');
    expectKnown(ids);
  });

  it('holds the order, the corrections and the hint of a choice item', () => {
    const ids = orderPreload(order([letterItem('K', 'kočka', ['K', 'A', 'M'])]));
    expect(ids).toContain('order.letter.k');
    expect(ids).toContain('letter.word.k.kocka');
    expect(ids).toContain('seek.letter.k');
    expect(ids).toContain('hint.letter.k');
    expect(ids).toContain('wrong.letter.a');
    expect(ids).toContain('wrong.letter.m');
    expectKnown(ids);
  });

  it('holds the sentences of the finale, whatever the item is', () => {
    const ids = orderPreload(order([countItem(2, 'cherry')]));
    for (const id of ['finish.1', 'finish.2', 'finish.3', 'star.1', 'star.2']) {
      expect(ids).toContain(id);
    }
    expectKnown(ids);
  });

  it('says every praise of the picked gender and never lists an id twice', () => {
    const ids = orderPreload(order([digitItem(3, [3, 5])]), 'female');
    expect(ids).toContain('praise.female.1');
    expect(ids).not.toContain('praise.neutral.1');
    expect(new Set(ids).size).toBe(ids.length);
    expectKnown(ids);
  });
});

describe('createPraisePicker', () => {
  it('never says the same praise twice in a row and uses them all', () => {
    const picker = createPraisePicker({ rng: createRng(7) });
    const seen = new Set<string>();
    let previous = '';
    for (let draw = 0; draw < 100; draw += 1) {
      const lines = picker.next();
      expect(lines).toHaveLength(1);
      const id = lines[0]!;
      expect(id).not.toBe(previous);
      expect(hasLine(id)).toBe(true);
      seen.add(id);
      previous = id;
    }
    expect(seen.size).toBe(10);
  });

  it('praises a girl and a boy from their own sets', () => {
    const girl = createPraisePicker({ gender: 'female', rng: createRng(3) });
    const boy = createPraisePicker({ gender: 'male', rng: createRng(3) });
    for (let draw = 0; draw < 20; draw += 1) {
      expect(girl.next()[0]).toMatch(/^praise\.female\./);
      expect(boy.next()[0]).toMatch(/^praise\.male\./);
    }
  });
});

describe('createLinePicker', () => {
  it('stays silent for an empty set instead of throwing', () => {
    expect(createLinePicker([]).next()).toEqual([]);
  });

  it('says the only line it has over and over', () => {
    const picker = createLinePicker(['finish.1'], createRng(2));
    expect(picker.next()).toEqual(['finish.1']);
    expect(picker.next()).toEqual(['finish.1']);
  });
});

describe('the pickers of the finale', () => {
  it('never repeats a finish line and uses them all', () => {
    const picker = createFinishPicker({ rng: createRng(4) });
    const seen = new Set<string>();
    let previous = '';
    for (let draw = 0; draw < 60; draw += 1) {
      const id = picker.next()[0]!;
      expect(id).not.toBe(previous);
      expect(hasLine(id)).toBe(true);
      seen.add(id);
      previous = id;
    }
    expect(seen.size).toBe(3);
  });

  it('alternates the two star lines', () => {
    const picker = createStarPicker({ rng: createRng(9) });
    const seen = new Set<string>();
    let previous = '';
    for (let draw = 0; draw < 20; draw += 1) {
      const id = picker.next()[0]!;
      expect(id).not.toBe(previous);
      expect(hasLine(id)).toBe(true);
      seen.add(id);
      previous = id;
    }
    expect(seen.size).toBe(2);
  });
});
