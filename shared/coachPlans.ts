/**
 * Coach plan economics. Imported by BOTH the Express backend and the app so the
 * roster limit and platform cut can never drift between client display and server maths.
 */
export type CoachPlanId = 'starter' | 'pro';

export interface CoachPlanDefinition {
  id: CoachPlanId;
  label: string;
  productId: string;
  /** Monthly price in USD. */
  priceMonthlyUsd: number;
  /** Max roster athletes; null means unlimited. */
  rosterLimit: number | null;
  /** Fraction of every program sale kept by the platform (0.15 = 15%). */
  platformFeeRate: number;
}

export const COACH_PLANS: Record<CoachPlanId, CoachPlanDefinition> = {
  starter: {
    id: 'starter',
    label: 'Coach Starter',
    productId: 'o1fc_coach_free',
    priceMonthlyUsd: 0,
    rosterLimit: 5,
    platformFeeRate: 0.15,
  },
  pro: {
    id: 'pro',
    label: 'Coach Pro',
    productId: 'o1fc_coach_pro_monthly',
    priceMonthlyUsd: 29.99,
    rosterLimit: null,
    platformFeeRate: 0.1,
  },
};

/** Maps a store / entitlement tier id to a coach plan. Anything unrecognised is Starter. */
export function coachPlanFromTier(tier?: string | null): CoachPlanId {
  const t = String(tier || '').toLowerCase();
  return t.includes('coach_pro') ? 'pro' : 'starter';
}

export function formatFeePercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/** Splits a gross sale (in cents) between platform and coach. Platform fee is rounded, coach gets the remainder. */
export function splitProgramSale(
  grossCents: number,
  plan: CoachPlanId,
): { platformFeeCents: number; coachNetCents: number; platformFeeRate: number } {
  const gross = Math.max(0, Math.round(grossCents));
  const platformFeeRate = COACH_PLANS[plan].platformFeeRate;
  const platformFeeCents = Math.round(gross * platformFeeRate);
  return { platformFeeCents, coachNetCents: gross - platformFeeCents, platformFeeRate };
}
