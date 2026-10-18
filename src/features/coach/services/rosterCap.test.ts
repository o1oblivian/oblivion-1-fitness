import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../services/supabaseClient', () => ({ supabase: {} }));

import { isRosterFull, parseRosterStatus } from './rosterCap';

describe('isRosterFull', () => {
  it('recognises the database error', () => {
    expect(isRosterFull({ message: 'ROSTER_FULL' })).toBe(true);
    expect(isRosterFull({ message: 'rpc failed: ROSTER_FULL' })).toBe(true);
  });

  it('ignores other failures', () => {
    expect(isRosterFull({ message: 'network down' })).toBe(false);
    expect(isRosterFull(null)).toBe(false);
    expect(isRosterFull(undefined)).toBe(false);
  });
});

describe('parseRosterStatus', () => {
  it('reads seats and the cap', () => {
    expect(parseRosterStatus({ active: 3, limit: 5 })).toEqual({ active: 3, limit: 5 });
  });

  it('reads Coach Pro as no cap', () => {
    expect(parseRosterStatus({ active: 12, limit: null })).toEqual({ active: 12, limit: null });
  });

  it('rejects anything malformed instead of guessing', () => {
    expect(parseRosterStatus(null)).toBeNull();
    expect(parseRosterStatus('x')).toBeNull();
    expect(parseRosterStatus({ active: 'a', limit: 5 })).toBeNull();
    expect(parseRosterStatus({ active: 1, limit: 'many' })).toBeNull();
  });
});
