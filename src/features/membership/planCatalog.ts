import { IAP_PRODUCTS, IAPProductInfo } from '../../types/iap';
import type { MembershipTier } from '../induction/consultationTypes';

/** `openPaywall(COACH_PAYWALL_FEATURE)` opens the paywall on the coach plans. */
export const COACH_PAYWALL_FEATURE = 'Coach Pro';

export interface PlanCopy {
  product: IAPProductInfo;
  audience: 'athlete' | 'coach';
  headline: string;
  highlights: string[];
  renews: boolean;
}

/** Tiers sold through the store. `core` and `coach` mean no paid plan and are never listed. */
export type PaidTier = Exclude<MembershipTier, 'core' | 'coach'>;

export function isPaidTier(tier: string): tier is PaidTier {
  return tier in TIER_PLANS;
}

export const TIER_PLANS: Record<PaidTier, PlanCopy> = {
  pro: {
    product: IAP_PRODUCTS.premium,
    audience: 'athlete',
    headline: 'The complete training and fuel system.',
    highlights: [
      'Meal scan and the full fuel tracker',
      'Deep analytics and training load balance',
      'Every wallpaper and dial face, plus data export',
    ],
    renews: true,
  },
  founders_pass: {
    product: IAP_PRODUCTS.founder_pass,
    audience: 'athlete',
    headline: 'Pay once. Pro access for life.',
    highlights: [
      'Everything in Pro, permanently',
      'Founding member badge',
      'One payment, never renews',
    ],
    renews: false,
  },
  coach_pro: {
    product: IAP_PRODUCTS.coach_pro,
    audience: 'coach',
    headline: 'Unlimited roster, lower fees.',
    highlights: ['Unlimited athletes', '10% fee on program sales', 'Everything in Club Pass Pro'],
    renews: true,
  },
};
