import { describe, expect, it } from 'vitest';
import { EMPTY_SETTINGS, MAX_FAMILY_MEMBERS, normalizeSettings } from './settings';

describe('normalizeSettings', () => {
  it('turns anything unusable into empty settings', () => {
    for (const input of [null, undefined, 'Anička', 42, [], true]) {
      expect(normalizeSettings(input)).toEqual(EMPTY_SETTINGS);
    }
  });

  it('keeps a child and trims the names', () => {
    expect(normalizeSettings({ child: { name: '  Anička ', vocative: ' Aničko ' } })).toEqual({
      child: { name: 'Anička', vocative: 'Aničko' },
      family: [],
    });
  });

  it('falls back to the name when the vocative is missing or blank', () => {
    expect(normalizeSettings({ child: { name: 'Anička' } }).child?.vocative).toBe('Anička');
    expect(normalizeSettings({ child: { name: 'Anička', vocative: '   ' } }).child?.vocative).toBe(
      'Anička',
    );
  });

  it('drops a child without a usable name', () => {
    expect(normalizeSettings({ child: { name: '   ' } }).child).toBeNull();
    expect(normalizeSettings({ child: 'Anička' }).child).toBeNull();
  });

  it('drops family members with an unknown role or a blank name', () => {
    const settings = normalizeSettings({
      family: [
        { name: 'Lenka', role: 'mother' },
        { name: 'Rex', role: 'dog' },
        { name: '  ', role: 'father' },
        'Tomík',
        { name: 'Tomík', role: 'brother' },
      ],
    });
    expect(settings.family).toEqual([
      { name: 'Lenka', role: 'mother' },
      { name: 'Tomík', role: 'brother' },
    ]);
  });

  it('caps the family size', () => {
    const family = Array.from({ length: 20 }, (_, i) => ({ name: `N${i}`, role: 'sister' }));
    expect(normalizeSettings({ family }).family).toHaveLength(MAX_FAMILY_MEMBERS);
  });

  it('ignores a family that is not an array', () => {
    expect(normalizeSettings({ family: { name: 'Lenka', role: 'mother' } }).family).toEqual([]);
  });
});
