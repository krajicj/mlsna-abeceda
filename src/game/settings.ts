/**
 * Player settings: the child and the family. Names live only here (localStorage) – never in the
 * repository. Everything that reaches this module is untrusted (saved JSON, the DEV console), so
 * `normalizeSettings` turns anything at all into a valid, empty-by-default `Settings`.
 */
export type FamilyRole = 'mother' | 'father' | 'brother' | 'sister' | 'grandmother' | 'grandfather';

export const FAMILY_ROLES: readonly FamilyRole[] = [
  'mother',
  'father',
  'brother',
  'sister',
  'grandmother',
  'grandfather',
];

export interface FamilyMember {
  readonly name: string;
  readonly role: FamilyRole;
}

export interface ChildProfile {
  readonly name: string;
  /** Vocative case for "Ahoj, …!"; falls back to the name when not filled in. */
  readonly vocative: string;
}

export interface Settings {
  readonly child: ChildProfile | null;
  readonly family: readonly FamilyMember[];
}

/** The game must be fully playable with no name configured at all. */
export const EMPTY_SETTINGS: Settings = { child: null, family: [] };

export const MAX_FAMILY_MEMBERS = 8;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function cleanName(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isFamilyRole(value: unknown): value is FamilyRole {
  return typeof value === 'string' && (FAMILY_ROLES as readonly string[]).includes(value);
}

function normalizeChild(input: unknown): ChildProfile | null {
  const record = asRecord(input);
  if (!record) return null;
  const name = cleanName(record['name']);
  if (name === '') return null;
  const vocative = cleanName(record['vocative']);
  return { name, vocative: vocative === '' ? name : vocative };
}

function normalizeMember(input: unknown): FamilyMember | null {
  const record = asRecord(input);
  if (!record) return null;
  const name = cleanName(record['name']);
  const role = record['role'];
  if (name === '' || !isFamilyRole(role)) return null;
  return { name, role };
}

/** Anything → valid settings. Blank names and unknown roles are dropped, never repaired. */
export function normalizeSettings(input: unknown): Settings {
  const record = asRecord(input);
  if (!record) return EMPTY_SETTINGS;
  const rawFamily: readonly unknown[] = Array.isArray(record['family']) ? record['family'] : [];
  const family: FamilyMember[] = [];
  for (const raw of rawFamily) {
    if (family.length >= MAX_FAMILY_MEMBERS) break;
    const member = normalizeMember(raw);
    if (member) family.push(member);
  }
  return { child: normalizeChild(record['child']), family };
}
