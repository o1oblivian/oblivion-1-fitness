import { useEffect, useState } from 'react';
import { IAP_PRODUCTS, IAPProductInfo } from '../../types/iap';
import { revenueCatService } from '../../services/revenueCatService';
import type { MembershipTier } from '../induction/consultationTypes';

export interface PlanCopy {
  product: IAPProductInfo;
  audience: 'athlete' | 'coach';
  headline: string;
  highlights: string[];
  renews: boolean;
}

export const TIER_PLANS: Record<MembershipTier, PlanCopy> = {
  core: {
    product: IAP_PRODUCTS.core_free,
    audience: 'athlete',
    headline: 'Start free with 90 days of full access.',
    highlights: [
      'Workout logger for every exercise',
      'Hydration, supplement and basic fuel tracking',
      'Radar within 25 km, 5 connections a day',
      '3 direct messages a day',
    ],
    renews: false,
  },
  pro: {
    product: IAP_PRODUCTS.premium,
    audience: 'athlete',
    headline: 'The complete training and fuel system.',
    highlights: [
      'Meal scan and the full fuel tracker',
      'Deep analytics and training load balance',
      'Radar within 250 km, unlimited messages',
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
      'Global radar included',
      'Founding member badge',
      'One payment, never renews',
    ],
    renews: false,
  },
  coach: {
    product: IAP_PRODUCTS.coach_free,
    audience: 'coach',
    headline: 'Coach up to 5 athletes free.',
    highlights: [
      'Roster of up to 5 athletes',
      'Workout dispatch and form video review',
      'Earnings dashboard',
      '15% fee on program sales',
    ],
    renews: false,
  },
  coach_pro: {
    product: IAP_PRODUCTS.coach_pro,
    audience: 'coach',
    headline: 'Unlimited roster, lower fees.',
    highlights: [
      'Unlimited athletes',
      'Automated periodization',
      'Priority support',
      '10% fee on program sales',
    ],
    renews: true,
  },
};

/** Live store prices keyed by product id; falls back to the catalog price when the store has none. */
export function useStorePrices(): (product: IAPProductInfo) => string {
  const [live, setLive] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    revenueCatService
      .getOfferings()
      .then((offerings) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        Object.values(IAP_PRODUCTS).forEach((product) => {
          if (product.isFree) return;
          const pkg = revenueCatService.packageForPlan(offerings, product.productId);
          const price = pkg?.product?.priceString;
          if (typeof price === 'string' && price) next[product.productId] = price;
        });
        setLive(next);
      })
      .catch(() => {
        /* catalog prices stay */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (product) => live[product.productId] || product.price;
}
