/**
 * One place where a `CustomerId` becomes a drawing. Every animal is built on the same 260×320 box
 * with the same counter line, so `KitchenLayout.customer` is one rect for all of them and swapping
 * a customer is swapping the markup inside one element.
 */
import type { CustomerId } from '../data/customers';
import { bear } from './bear';
import { cat } from './cat';
import { frog } from './frog';
import { rabbit } from './rabbit';

/** The box every customer is drawn in; `art.test.ts` holds every one of them to it. */
export const CUSTOMER_WIDTH = 260;
export const CUSTOMER_HEIGHT = 320;

export function customerArt(id: CustomerId): string {
  switch (id) {
    case 'rabbit':
      return rabbit();
    case 'cat':
      return cat();
    case 'bear':
      return bear();
    case 'frog':
      return frog();
  }
}
