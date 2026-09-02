/**
 * The one place in the game where the id of a product turns into a drawing (STEP-17). The kitchen
 * scene, the choice item, the order bubble and the finale all ask here and none of them knows the
 * name `iceCreamBase`; the pancakes of STEP-18 were a line in each of these switches and a row in
 * `PRODUCT_GEOMETRY`, and nothing else.
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
import { chocolateLetter, pancakesBase, pancakesTopping, sign } from './pancakes';
import type { ProductId } from '../data/products';

/** What stands on the counter when the order arrives: the bare cake, the finished ice cream. */
export function productBase(product: ProductId): string {
  switch (product) {
    case 'cake':
      return cakeBase();
    case 'icecream':
      return iceCreamBase();
    case 'pancakes':
      return pancakesBase();
  }
}

/** The finale: the glaze over the cake, the sauce over the ice cream, the syrup over the stack. */
export function productTopping(product: ProductId): string {
  switch (product) {
    case 'cake':
      return cakeGlaze();
    case 'icecream':
      return iceCreamTopping();
    case 'pancakes':
      return pancakesTopping();
  }
}

/** What carries the letter: the gingerbread cookie, the wafer, the chocolate disc. Blank without one. */
export function productLetterArt(product: ProductId, letter = ''): string {
  switch (product) {
    case 'cake':
      return cookie(letter);
    case 'icecream':
      return wafer(letter);
    case 'pancakes':
      return chocolateLetter(letter);
  }
}

/** What carries the digit: the candle, the flag, the standing sign. Blank without a digit. */
export function productDigitArt(product: ProductId, digit = ''): string {
  switch (product) {
    case 'cake':
      return candle(digit);
    case 'icecream':
      return flag(digit);
    case 'pancakes':
      return sign(digit);
  }
}
