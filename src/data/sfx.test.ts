import { describe, expect, it } from 'vitest';
import { CUSTOMERS } from './customers.ts';
import {
  customerHelloSfx,
  customerYumSfx,
  hasSfx,
  plingRate,
  PLING_SEMITONES,
  SFX,
  sfxPath,
} from './sfx.ts';

const ID_PATTERN = /^[a-z0-9]+([.-][a-z0-9]+)*$/;
/** Every animal, the bought ones included – a customer with no sound would walk in silently. */
const ANIMALS = Object.keys(CUSTOMERS);

describe('manifest of sound effects', () => {
  it('holds exactly the effects the plan pays for', () => {
    // Every entry is a paid request to ElevenLabs; the number is here so adding one is a conscious
    // edit and not a surprise on the bill (the same guard as the voice manifest). +4 in STEP-15:
    // the frog has a voice of her own and the shop has two sounds (used by the shelf in STEP-16);
    // +1 in STEP-16 for the radio that plays when the child taps it.
    expect(SFX).toHaveLength(20);
  });

  it('has unique ids usable as file names', () => {
    const seen = new Set<string>();
    for (const effect of SFX) {
      expect(effect.id).toMatch(ID_PATTERN);
      expect(seen.has(effect.id), `duplicate id ${effect.id}`).toBe(false);
      seen.add(effect.id);
    }
  });

  it('asks for durations the API accepts', () => {
    for (const effect of SFX) {
      expect(effect.durationSeconds, effect.id).toBeGreaterThanOrEqual(0.5);
      expect(effect.durationSeconds, effect.id).toBeLessThanOrEqual(30);
      if (effect.promptInfluence !== undefined) {
        expect(effect.promptInfluence, effect.id).toBeGreaterThanOrEqual(0);
        expect(effect.promptInfluence, effect.id).toBeLessThanOrEqual(1);
      }
    }
  });

  it('describes every effect in English, without the child ever hearing a word', () => {
    for (const effect of SFX) {
      expect(effect.prompt.length, effect.id).toBeGreaterThan(10);
      // Czech diacritics would mean the prompt slipped into the language of the game content.
      expect(effect.prompt, effect.id).not.toMatch(/[áčďéěíňóřšťúůýž]/i);
    }
  });

  it('gives every customer a hello and a yum', () => {
    for (const animal of ANIMALS) {
      expect(hasSfx(customerHelloSfx(animal)), animal).toBe(true);
      expect(hasSfx(customerYumSfx(animal)), animal).toBe(true);
    }
  });

  it('has the two sounds the shop shelf will need (STEP-16)', () => {
    expect(hasSfx('shop.buy')).toBe(true);
    expect(hasSfx('shop.rattle')).toBe(true);
  });

  it('knows only the ids it lists', () => {
    expect(hasSfx('bell')).toBe(true);
    expect(hasSfx('nothing-like-this')).toBe(false);
    expect(hasSfx('')).toBe(false);
  });

  it('builds the path the game fetches', () => {
    expect(sfxPath('bell')).toBe('audio/sfx/bell.mp3');
    expect(sfxPath('customer.cat.yum')).toBe('audio/sfx/customer.cat.yum.mp3');
  });
});

describe('plingRate', () => {
  it('leaves the first piece of fruit at the pitch of the clip', () => {
    expect(plingRate(0)).toBe(1);
  });

  it('climbs the same scale the oscillators used to synthesise', () => {
    expect(plingRate(1)).toBeCloseTo(2 ** (2 / 12), 5); // D5
    expect(plingRate(2)).toBeCloseTo(2 ** (4 / 12), 5); // E5
    expect(plingRate(3)).toBeCloseTo(2 ** (7 / 12), 5); // G5, a fifth up
    expect(plingRate(4)).toBeCloseTo(2 ** (9 / 12), 5); // A5, a major sixth up
    expect(plingRate(4)).toBeGreaterThan(plingRate(3));
  });

  it('wraps around instead of running out on a longer order', () => {
    expect(plingRate(PLING_SEMITONES.length)).toBe(plingRate(0));
    expect(plingRate(7)).toBe(plingRate(2));
  });

  it('never returns a rate the audio graph would refuse', () => {
    for (const step of [-1, -8, 0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const rate = plingRate(step);
      expect(Number.isFinite(rate), String(step)).toBe(true);
      expect(rate, String(step)).toBeGreaterThan(0);
    }
  });
});
