/** A plan sold through the App Store or Google Play. Prices always come from the store, never from the app. */
export interface IAPProductInfo {
  readonly productId: string;
  readonly name: string;
  readonly periodText?: string;
  readonly description: string;
  readonly badge?: string;
  readonly recommended?: boolean;
  readonly userType: 'athlete' | 'coach';
}

export const IAP_PRODUCTS = {
  founder_pass: {
    productId: 'o1fc_founder_pass',
    name: 'Founder Pass',
    periodText: ' one-time',
    description: 'Lifetime All-Access forever • one-time, non-recurring',
    badge: 'POPULAR',
    recommended: true,
    userType: 'athlete' as const,
  },
  premium: {
    productId: 'o1fc_pro_monthly',
    name: 'Monthly Pro Access',
    periodText: '/mo',
    description: 'Full training & Fuel OS',
    badge: 'POPULAR',
    recommended: true,
    userType: 'athlete' as const,
  },
  coach_pro: {
    productId: 'o1fc_coach_pro_monthly',
    name: 'Coach Pro',
    periodText: '/mo',
    description: 'Unlimited athletes • 10% fee on program sales',
    badge: 'POPULAR',
    recommended: true,
    userType: 'coach' as const,
  },
} as const;
