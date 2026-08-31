/**
 * The one place in the game where the id of a product turns into a drawing (STEP-17). The kitchen
 * scene, the choice item, the order bubble and the finale all ask here and none of them knows the
 * name `iceCreamBase`; adding the pancakes in STEP-18 is a line in each of these switches and a
 * row in `PRODUCT_GEOMETRY`.
 *
 * A switch over a closed union and no default branch: a new product that has no picture does not
 * compile, instead of leaving a hole on the counter. What is COUNTED onto a product is not here:
 * it is fruit whatever is being made (návrh kap. 4), so the bowl and the counting item draw it
 * themselves.
 */
import { cakeBase, cakeGlaze } from './cake';
import { candle } from './candle';
import { cookie } from './cookie';
import { flag, iceCreamBase, iceCreamTopping, wafer } from './icecream';
import type { ProductId } from '../data/products';

/** What stands on the counter when the order arrives: the bare cake, the finished ice cream. */
export function productBase(product: ProductId): string {
  switch (product) {
    case 'cake':
      return cakeBase();
    case 'icecream':
      return iceCreamBase();
  }
}

/** The finale: the glaze that runs over the cake, the sauce that runs over the ice cream. */
export function productTopping(product: ProductId): string {
  switch (product) {
    case 'cake':
      return cakeGlaze();
    case 'icecream':
      return iceCreamTopping();
  }
}

/** What carries the letter: the gingerbread cookie, the wafer. Blank without a letter. */
export function productLetterArt(product: ProductId, letter = ''): string {
  switch (product) {
    case 'cake':
      return cookie(letter);
    case 'icecream':
      return wafer(letter);
  }
}

/** What carries the digit: the candle, the flag. Blank without a digit. */
export function productDigitArt(product: ProductId, digit = ''): string {
  switch (product) {
    case 'cake':
      return candle(digit);
    case 'icecream':
      return flag(digit);
  }
}
