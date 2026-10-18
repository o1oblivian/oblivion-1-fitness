import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COACH_PLANS, coachPlanFromTier } from '../../shared/coachPlans';

const sql = readFileSync(
  resolve(import.meta.dirname, '../../supabase/migrations/20261018_coach_roster_cap.sql'),
  'utf8',
);

describe('coach roster cap migration', () => {
  it('uses the same free roster size as the app', () => {
    const limit = COACH_PLANS.starter.rosterLimit;
    expect(limit).toBe(5);
    expect(sql).toContain(`THEN NULL ELSE ${limit} END`);
  });

  it('treats exactly the tiers the app calls Coach Pro as unlimited', () => {
    expect(coachPlanFromTier('o1fc_coach_pro_monthly')).toBe('pro');
    expect(coachPlanFromTier('o1fc_coach_pro_monthly:monthly')).toBe('pro');
    expect(sql).toContain("lower(e.tier) LIKE '%coach_pro%'");
  });

  it('leaves Coach Pro without a limit', () => {
    expect(COACH_PLANS.pro.rosterLimit).toBeNull();
  });

  it('is enforced by a trigger on every write path, not by the screen', () => {
    expect(sql).toContain('BEFORE INSERT OR UPDATE OF status, coach_id ON public.coach_clients');
    expect(sql).toContain("RAISE EXCEPTION 'ROSTER_FULL'");
  });
});
