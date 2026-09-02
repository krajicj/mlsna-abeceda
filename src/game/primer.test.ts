import { describe, expect, it } from 'vitest';
import { BASE_LETTERS } from '../data/curriculum';
import { primerBoard, primerProgress } from './primer';

const empty = { level: 1 as const, active: [], scores: {} };

describe('primerBoard', () => {
  it('always shows the base alphabet and ten fixed digits', () => {
    const board = primerBoard({ letters: empty, numbers: empty });
    expect(board.letters.map((tile) => tile.element)).toEqual(BASE_LETTERS);
    expect(board.digits.map((tile) => tile.element)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ]);
  });

  it('uses the same known boundary as the learning tracks', () => {
    const board = primerBoard({
      letters: { level: 1, active: ['A', 'B', 'C'], scores: { A: 2, B: 3, C: 5 } },
      numbers: { level: 1, active: ['1'], scores: { '1': 0 } },
    });
    expect(board.letters.slice(0, 4)).toEqual([
      { element: 'A', state: 'learning' },
      { element: 'B', state: 'known' },
      { element: 'C', state: 'known' },
      { element: 'D', state: 'new' },
    ]);
    expect(board.digits[0]).toEqual({ element: '1', state: 'learning' });
  });

  it('treats a missing active set as new and a missing score map as zero', () => {
    const board = primerBoard({
      letters: { level: 1 },
      numbers: { level: 1, active: ['1'] },
    });
    expect(board.letters.every((tile) => tile.state === 'new')).toBe(true);
    expect(board.digits[0]).toEqual({ element: '1', state: 'learning' });
    expect(board.digits.slice(1).every((tile) => tile.state === 'new')).toBe(true);
  });

  it('counts only known tiles', () => {
    const board = primerBoard({
      letters: { level: 1, active: ['A'], scores: { A: 3 } },
      numbers: { level: 1, active: ['1'], scores: { '1': 5 } },
    });
    expect(primerProgress(board)).toEqual({ known: 2, total: 32 });
  });
});
