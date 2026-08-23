import { describe, expect, it } from 'vitest';
import { SAVE_KEY, SAVE_VERSION } from './version';

describe('save format version', () => {
  it('starts at 1', () => {
    expect(SAVE_VERSION).toBe(1);
  });

  it('is encoded in the localStorage key', () => {
    expect(SAVE_KEY.endsWith(`.v${SAVE_VERSION}`)).toBe(true);
  });
});
