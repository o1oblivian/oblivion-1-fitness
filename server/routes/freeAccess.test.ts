import { describe, expect, it } from 'vitest';
import { FREE_ACCESS_CAP, decideFreeAccess, freeAccessRemaining } from './freeAccess';

describe('freeAccessRemaining', () => {
  it('starts at 100,000 and drops by each member', () => {
    expect(FREE_ACCESS_CAP).toBe(100_000);
    expect(freeAccessRemaining(0)).toBe(100_000);
    expect(freeAccessRemaining(18)).toBe(99_982);
    expect(freeAccessRemaining(100_000)).toBe(0);
    expect(freeAccessRemaining(120_000)).toBe(0);
  });
});

describe('decideFreeAccess', () => {
  it('gives the 90 days to everyone up to 100,000 members', () => {
    expect(decideFreeAccess(undefined, 1)).toBe(true);
    expect(decideFreeAccess(undefined, 100_000)).toBe(true);
  });

  it('does not give them to member 100,001', () => {
    expect(decideFreeAccess(undefined, 100_001)).toBe(false);
  });

  it('keeps an earlier decision whatever the count is now', () => {
    expect(decideFreeAccess(true, 250_000)).toBe(true);
    expect(decideFreeAccess(false, 5)).toBe(false);
  });
});
