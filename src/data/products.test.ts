import { describe, expect, it } from 'vitest';
import { PRODUCTS, productOf, STARTER_PRODUCT, type ProductId } from './products';

describe('the catalogue of products', () => {
  it('has unique ids', () => {
    const seen = new Set<ProductId>();
    for (const product of PRODUCTS) {
      expect(seen.has(product.id), `duplicate id ${product.id}`).toBe(false);
      seen.add(product.id);
    }
  });

  it('starts with the cake, and the cake is in the catalogue', () => {
    expect(STARTER_PRODUCT).toBe('cake');
    expect(productOf(STARTER_PRODUCT)).not.toBeNull();
  });

  it('keeps the cake on bare line ids forever', () => {
    // Its clips are generated and committed; a suffix would throw every one of them away.
    expect(productOf('cake')?.lineSuffix).toBeNull();
  });

  it('gives every other product a suffix of its own', () => {
    const suffixes = PRODUCTS.filter((product) => product.id !== 'cake').map(
      (product) => product.lineSuffix,
    );
    expect(suffixes).not.toContain(null);
    expect(new Set(suffixes).size).toBe(suffixes.length);
    for (const suffix of suffixes) expect(suffix).toMatch(/^[a-z0-9]+$/);
  });

  it('says which products can be counted onto', () => {
    // The ice cream arrives finished; a bowl of strawberries has nothing to give it (návrh kap. 4).
    expect(productOf('cake')?.counts).toBe(true);
    expect(productOf('icecream')?.counts).toBe(false);
    // The pancakes are the second thing fruit lands on, so counting stops being the cake's alone.
    expect(productOf('pancakes')?.counts).toBe(true);
  });

  it('sells the pancakes as the third thing the kitchen can make (STEP-18)', () => {
    expect(PRODUCTS.map((product) => product.id)).toEqual(['cake', 'icecream', 'pancakes']);
    expect(productOf('pancakes')?.lineSuffix).toBe('pancakes');
    expect(productOf('pancakes')?.label).toBe('palačinky');
  });

  it('always leaves at least one product that counts', () => {
    // Otherwise a counting order would have nothing to be made as.
    expect(PRODUCTS.some((product) => product.counts)).toBe(true);
    expect(productOf(STARTER_PRODUCT)?.counts).toBe(true);
  });

  it('has a Czech label for every row (the plan and the parent corner read it)', () => {
    for (const product of PRODUCTS) expect(product.label.length).toBeGreaterThan(0);
  });

  it('is null for anything that is not in it', () => {
    // A typo, or a record from a newer build – never a crash (rule 2).
    expect(productOf('pancake')).toBeNull();
    expect(productOf('')).toBeNull();
    expect(productOf('toString')).toBeNull();
  });
});
