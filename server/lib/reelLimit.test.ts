import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REEL_LIMIT, reelSlotsLine } from '../../shared/reelLimits';

const sql = readFileSync(
  resolve(import.meta.dirname, '../../supabase/migrations/20261102_member_reels.sql'),
  'utf8',
);

describe('member reel limit migration', () => {
  it('uses the same limit as the app', () => {
    expect(REEL_LIMIT).toBe(6);
    expect(sql).toContain(`IF kept >= ${REEL_LIMIT} THEN`);
  });

  it('is enforced by a trigger, not by the screen', () => {
    expect(sql).toContain('BEFORE INSERT ON public.reels');
    expect(sql).toContain("RAISE EXCEPTION 'REEL_LIMIT'");
  });
});

describe('reelSlotsLine', () => {
  it('counts used slots out of six', () => {
    expect(reelSlotsLine(0)).toBe('0 of 6 reels used');
    expect(reelSlotsLine(6)).toBe('6 of 6 reels used');
    expect(reelSlotsLine(9)).toBe('6 of 6 reels used');
  });
});
