import { describe, expect, it } from 'vitest';
import { FRUITS, STARTER_FRUITS } from '../data/curriculum';
import { CUSTOMERS, STARTER_CUSTOMERS } from '../data/customers';
import { PRODUCTS, STARTER_PRODUCT } from '../data/products';
import { SHOP_ITEMS, shopItem } from '../data/shop';
import {
  buyShopItem,
  ownedDecorations,
  shopEntryOf,
  shopOffer,
  shopPriceStars,
  unlockedCustomers,
  unlockedFruits,
  unlockedProducts,
} from './shop';
import { starBalance, type StarsState } from './stars';

const DECORATIONS: readonly string[] = ['cat', 'radio'];
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
    const spent = stars(7, { 'fruit.raspberry': 3 });
    expect(shopEntryOf(spent, 'customer.frog')?.missing).toBe(1);
    expect(shopEntryOf(spent, 'decor.cat')?.state).toBe('short');
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
    // Exactly what the whole catalogue costs, so the last purchase leaves her at nought.
    let record = stars(SHOP_ITEMS.reduce((sum, item) => sum + item.price, 0));
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
    const bought = stars(20, { 'decor.radio': 5, 'decor.cat': 5 });
    expect(ownedDecorations(bought)).toEqual(['cat', 'radio']);
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

describe('shopPriceStars', () => {
  /** The entry the shelf would draw for `id` at this balance – null never happens for a real id. */
  function entry(earned: number, id: string, purchases: Record<string, number> = {}) {
    const found = shopEntryOf(stars(earned, purchases), id);
    if (!found) throw new Error(`no entry for ${id}`);
    return found;
  }

  it('gives a bought thing no price at all – a tick goes where the stars were', () => {
    expect(shopPriceStars(entry(9, 'decor.cat', { 'decor.cat': 5 }))).toEqual({
      filled: 0,
      empty: 0,
    });
  });

  it('fills every star of a price the child can pay', () => {
    expect(shopPriceStars(entry(9, 'customer.frog'))).toEqual({ filled: 5, empty: 0 });
    expect(shopPriceStars(entry(3, 'fruit.raspberry'))).toEqual({ filled: 3, empty: 0 });
  });

  it('leaves exactly the missing stars empty', () => {
    // Four stars and a frog for five: ★★★★☆, and "chybí ti jedna hvězdička".
    expect(shopPriceStars(entry(4, 'customer.frog'))).toEqual({ filled: 4, empty: 1 });
    expect(shopPriceStars(entry(0, 'customer.frog'))).toEqual({ filled: 0, empty: 5 });
  });

  it('matches the worked example from the step plan', () => {
    const purchases = { 'fruit.raspberry': 3 };
    // earned 7, three of them spent on the raspberry: the balance is four.
    expect(starBalance(stars(7, purchases))).toBe(4);
    expect(shopPriceStars(entry(7, 'fruit.raspberry', purchases))).toEqual({ filled: 0, empty: 0 });
    expect(shopPriceStars(entry(7, 'customer.frog', purchases))).toEqual({ filled: 4, empty: 1 });
    expect(shopPriceStars(entry(7, 'decor.cat', purchases))).toEqual({ filled: 4, empty: 1 });
  });

  it('always draws the whole price, whatever the balance', () => {
    for (const item of SHOP_ITEMS) {
      for (const earned of [0, 1, item.price - 1, item.price, item.price + 1]) {
        const price = shopPriceStars(entry(earned, item.id));
        expect(price.filled + price.empty, `${item.id} at ${earned}`).toBe(item.price);
        expect(price.empty, `${item.id} at ${earned}`).toBe(entry(earned, item.id).missing);
        expect(price.filled).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('unlockedProducts (STEP-17)', () => {
  it('is the cake alone before anything is bought', () => {
    expect(unlockedProducts(stars(0))).toEqual(['cake']);
    expect(unlockedProducts(stars(20))).toEqual(['cake']); // stars are not a purchase
  });

  it('adds the ice cream once it is bought', () => {
    expect(unlockedProducts(stars(0, { 'product.icecream': 5 }))).toEqual(['cake', 'icecream']);
  });

  it('skips a key that is in no catalogue and still returns the cake (rule 2)', () => {
    const strange = stars(0, { 'product.spaceship': 5, nonsense: 1 });
    expect(unlockedProducts(strange)).toEqual(['cake']);
  });

  it('never returns the same product twice', () => {
    const bought = unlockedProducts(stars(0, { 'product.icecream': 5 }));
    expect(new Set(bought).size).toBe(bought.length);
    expect(bought).toContain(STARTER_PRODUCT);
  });

  it('can only ever return products that are in the catalogue', () => {
    const known = new Set(PRODUCTS.map((product) => product.id));
    for (const id of unlockedProducts(stars(0, { 'product.icecream': 5 }))) {
      expect(known.has(id), id).toBe(true);
    }
  });

  it('sells the ice cream for five stars, and only once', () => {
    expect(shopItem('product.icecream')?.price).toBe(5);
    const bought = buyShopItem(stars(5), 'product.icecream');
    expect(bought).not.toBeNull();
    expect(starBalance(bought!)).toBe(0);
    expect(buyShopItem(bought!, 'product.icecream')).toBeNull();
    expect(buyShopItem(stars(4), 'product.icecream')).toBeNull();
  });
});
