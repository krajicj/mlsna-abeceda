import { describe, expect, it } from 'vitest';
import { SAVE_BACKUP_KEY, SAVE_KEY, SAVE_VERSION } from './version';

describe('save format version', () => {
  it('is at 2 – the mergeable format (STEP-13)', () => {
    expect(SAVE_VERSION).toBe(2);
  });

  it('keeps the original key: the key is the slot, the version lives in the record', () => {
    expect(SAVE_KEY).toBe('kk.save.v1');
  });

  it('backs up under a key of its own, so it can never overwrite the save', () => {
    expect(SAVE_BACKUP_KEY).not.toBe(SAVE_KEY);
  });
});
