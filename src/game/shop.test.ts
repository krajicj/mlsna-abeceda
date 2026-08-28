import { describe, expect, it } from 'vitest';
import { FRUITS, STARTER_FRUITS } from '../data/curriculum';
import { CUSTOMERS, STARTER_CUSTOMERS } from '../data/customers';
import { SHOP_ITEMS, shopItem } from '../data/shop';
import {
  buyShopItem,
  ownedDecorations,
  shopEntryOf,
  shopOffer,
  unlockedCustomers,
  unlockedFruits,
} from './shop';
import { starBalance, type StarsState } from './stars';

const DECORATIONS: readonly string[] = ['flower', 'curtains', 'cat', 'radio'];
/** Whatever is not bought is derived from what is: the record only ever holds purchases. */
function stars(earned: number, purchases: Record<string, number> = {}): StarsState {
  return { earned, purchases };
}

describe('shop catalogue', () => {
  it('has unique ids, namespaced by what they unlock', () => {
    const seen = new Set<string>();
    for (const item of SHOP_ITEMS) {
      expect(seen.has(item.id), `duplicate id ${item.id}`).toBe(false);
      seen.add(item.id);
      const prefix = item.kind === 'decoration' ? 'decor' : item.kind;
      expect(item.id.startsWith(`${prefix}.`), item.id).toBe(true);
      expect(item.label.length, item.id).toBeGreaterThan(2);
    }
  });

  it('prices everything between one and five stars', () => {
    // Five is the ceiling of "Chybí ti N hvězdiček": the manifest holds five whole sentences and
    // Czech will not let the sixth be stitched together at runtime (rule 7).
    for (const item of SHOP_ITEMS) {
      expect(item.price, item.id).toBeGreaterThanOrEqual(1);
      expect(item.price, item.id).toBeLessThanOrEqual(5);
      expect(Number.isInteger(item.price), item.id).toBe(true);
    }
  });

  it('offers the cheapest things first', () => {
    const prices = SHOP_ITEMS.map((item) => item.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('unlocks something that really exists in the game', () => {
    // The discriminated union guards the TYPE of `unlocks`; this guards the VALUE – 'cat' is a
    // legal id of two different kinds, so a row could still point at the wrong table.
    for (const item of SHOP_ITEMS) {
      if (item.kind === 'fruit') expect(FRUITS, item.id).toContain(item.unlocks);
      if (item.kind === 'customer') expect(Object.keys(CUSTOMERS), item.id).toContain(item.unlocks);
      if (item.kind === 'decoration') expect(DECORATIONS, item.id).toContain(item.unlocks);
    }
  });

  it('finds a row by its id and nothing else', () => {
    expect(shopItem('fruit.raspberry')?.price).toBe(3);
    expect(shopItem('customer.frog')?.unlocks).toBe('frog');
    expect(shopItem('fruit.banana')).toBeNull();
    expect(shopItem('')).toBeNull();
    // A key from JSON carries Object.prototype; the lookup must not answer for it.
    expect(shopItem('toString')).toBeNull();
  });
});

describe('shopOffer', () => {
  it('puts everything out of reach on a brand new record', () => {
    const offer = shopOffer(stars(0));
    expect(offer).toHaveLength(SHOP_ITEMS.length);
    for (const entry of offer) {
      expect(entry.state, entry.item.id).toBe('short');
      expect(entry.missing, entry.item.id).toBe(entry.item.price);
    }
  });

  it('counts what is missing down to the last star', () => {
    expect(shopEntryOf(stars(2), 'fruit.raspberry')?.missing).toBe(1);
    expect(shopEntryOf(stars(2), 'fruit.raspberry')?.state).toBe('short');
    expect(shopEntryOf(stars(3), 'fruit.raspberry')?.state).toBe('affordable');
    expect(shopEntryOf(stars(3), 'fruit.raspberry')?.missing).toBe(0);
    expect(shopEntryOf(stars(4), 'customer.frog')?.missing).toBe(1);
  });

  it('marks what is bought as owned, whatever the balance says', () => {
    const after = stars(3, { 'fruit.raspberry': 3 });
    expect(starBalance(after)).toBe(0);
    const entry = shopEntryOf(after, 'fruit.raspberry');
    expect(entry?.state).toBe('owned');
    expect(entry?.missing).toBe(0);
  });

  it('counts the balance, not the stars earned', () => {
    // 7 earned − 3 paid for the flower = 4 left, so the frog at five is still one star away.
    const spent = stars(7, { 'decor.flower': 3 });
    expect(shopEntryOf(spent, 'customer.frog')?.missing).toBe(1);
    expect(shopEntryOf(spent, 'decor.curtains')?.state).toBe('affordable');
  });

  it('says nothing about a thing it does not sell', () => {
    expect(shopEntryOf(stars(99), 'fruit.banana')).toBeNull();
  });
});

describe('buyShopItem', () => {
  it('writes the price paid and leaves the stars earned alone', () => {
    const before = stars(3);
    const after = buyShopItem(before, 'fruit.raspberry');
    expect(after).toEqual({ earned: 3, purchases: { 'fruit.raspberry': 3 } });
    expect(starBalance(after!)).toBe(0);
  });

  it('refuses an unknown id, a second purchase and a price out of reach', () => {
    expect(buyShopItem(stars(99), 'fruit.banana')).toBeNull();
    expect(buyShopItem(stars(9, { 'fruit.raspberry': 3 }), 'fruit.raspberry')).toBeNull();
    expect(buyShopItem(stars(4), 'customer.frog')).toBeNull();
  });

  it('never touches the record it was given', () => {
    const before = stars(5);
    buyShopItem(before, 'fruit.raspberry');
    expect(before).toEqual({ earned: 5, purchases: {} });
  });

  it('lets the child spend everything she has, one thing after another', () => {
    let record = stars(25);
    for (const item of SHOP_ITEMS) {
      const after = buyShopItem(record, item.id);
      expect(after, item.id).not.toBeNull();
      record = after!;
    }
    expect(starBalance(record)).toBe(0);
    expect(shopOffer(record).every((entry) => entry.state === 'owned')).toBe(true);
  });
});

describe('what a purchase unlocks', () => {
  it('starts with the three fruits and the three animals, and no decoration', () => {
    expect(unlockedFruits(stars(0))).toEqual(STARTER_FRUITS);
    expect(unlockedCustomers(stars(0))).toEqual(STARTER_CUSTOMERS);
    expect(ownedDecorations(stars(0))).toEqual([]);
  });

  it('adds the raspberry only once it is paid for', () => {
    expect(unlockedFruits(stars(9))).not.toContain('raspberry');
    expect(unlockedFruits(stars(9, { 'fruit.raspberry': 3 }))).toEqual([
      ...STARTER_FRUITS,
      'raspberry',
    ]);
  });

  it('adds the frog only once she is invited', () => {
    expect(unlockedCustomers(stars(9))).not.toContain('frog');
    expect(unlockedCustomers(stars(9, { 'customer.frog': 5 }))).toEqual([
      ...STARTER_CUSTOMERS,
      'frog',
    ]);
  });

  it('keeps the decorations in the order of the catalogue, whatever order they were bought in', () => {
    const bought = stars(20, { 'decor.radio': 5, 'decor.flower': 3, 'decor.cat': 5 });
    expect(ownedDecorations(bought)).toEqual(['flower', 'cat', 'radio']);
  });

  it('does not let a decoration into the kitchen or an animal onto the cake', () => {
    // 'cat' is a decoration id AND a customer id; the kind of the row is what decides.
    const bought = stars(20, { 'decor.cat': 5 });
    expect(unlockedCustomers(bought)).toEqual(STARTER_CUSTOMERS);
    expect(ownedDecorations(bought)).toEqual(['cat']);
    expect(unlockedFruits(bought)).toEqual(STARTER_FRUITS);
  });

  it('ignores keys it does not know, instead of falling over them', () => {
    // A record from a newer build, merged in from another device (STEP-13).
    const strange = stars(30, { 'fruit.mango': 4, 'decor.lamp': 2, toString: 1 });
    expect(unlockedFruits(strange)).toEqual(STARTER_FRUITS);
    expect(unlockedCustomers(strange)).toEqual(STARTER_CUSTOMERS);
    expect(ownedDecorations(strange)).toEqual([]);
  });
});
