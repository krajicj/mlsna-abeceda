import { describe, expect, it } from 'vitest';
import {
  NO_STARS,
  starBalance,
  starsSpent,
  withPurchase,
  withStar,
  type StarsState,
} from './stars';

const BOUGHT: StarsState = { earned: 10, purchases: { 'toy.ball': 3, 'toy.kite': 2 } };

describe('starsSpent', () => {
  it('is nothing for a record that never bought anything', () => {
    expect(starsSpent(NO_STARS)).toBe(0);
  });

  it('adds up every price paid', () => {
    expect(starsSpent(BOUGHT)).toBe(5);
  });
});

describe('starBalance', () => {
  it('is everything earned while nothing is bought', () => {
    expect(starBalance({ earned: 7, purchases: {} })).toBe(7);
  });

  it('is what is left after the purchases', () => {
    expect(starBalance(BOUGHT)).toBe(5);
  });

  it('never goes negative – a damaged record must not leave the child in debt', () => {
    expect(starBalance({ earned: 1, purchases: { 'toy.ball': 40 } })).toBe(0);
  });
});

describe('withStar', () => {
  it('adds one star when no count is given', () => {
    expect(withStar(NO_STARS).earned).toBe(1);
  });

  it('adds as many as it is told and leaves the purchases alone', () => {
    const next = withStar(BOUGHT, 3);
    expect(next.earned).toBe(13);
    expect(next.purchases).toEqual(BOUGHT.purchases);
  });

  it('never mutates the record it is given', () => {
    const before = { ...NO_STARS };
    withStar(NO_STARS, 5);
    expect(NO_STARS).toEqual(before);
  });
});

describe('withPurchase', () => {
  it('records the item with the price paid', () => {
    const next = withPurchase({ earned: 5, purchases: {} }, 'toy.ball', 3);
    expect(next?.purchases).toEqual({ 'toy.ball': 3 });
    expect(next && starBalance(next)).toBe(2);
  });

  it('refuses an item that is already bought', () => {
    expect(withPurchase(BOUGHT, 'toy.ball', 1)).toBeNull();
  });

  it('refuses what the child cannot afford', () => {
    expect(withPurchase(BOUGHT, 'toy.doll', 6)).toBeNull();
    // The whole balance is fine, one star more is not.
    expect(withPurchase(BOUGHT, 'toy.doll', 5)).not.toBeNull();
  });

  it('lets a free item through and leaves the balance where it was', () => {
    const next = withPurchase(BOUGHT, 'toy.free', 0);
    expect(next?.purchases['toy.free']).toBe(0);
    expect(next && starBalance(next)).toBe(starBalance(BOUGHT));
  });

  it('refuses a price out of range', () => {
    for (const cost of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(withPurchase(BOUGHT, 'toy.doll', cost)).toBeNull();
    }
  });

  it('is not fooled by an item named after a property of Object', () => {
    const stars: StarsState = { earned: 5, purchases: {} };
    expect(withPurchase(stars, 'toString', 1)?.purchases['toString']).toBe(1);
  });

  it('never mutates the record it is given', () => {
    const before = JSON.parse(JSON.stringify(BOUGHT)) as StarsState;
    withPurchase(BOUGHT, 'toy.doll', 4);
    expect(BOUGHT).toEqual(before);
  });
});
