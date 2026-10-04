export interface IAPProductInfo {
  readonly productId: string;
  readonly name: string;
  readonly price: string;
  readonly periodText?: string;
  readonly description: string;
  readonly badge?: string;
  readonly recommended?: boolean;
  readonly isFree?: boolean;
  readonly userType: 'athlete' | 'coach';
}

export const IAP_PRODUCTS = {
  founder_pass: {
    productId: 'o1fc_founder_pass_lifetime',
    name: 'Founder Pass',
    price: '$24.00',
    periodText: '/once',
    description: 'Lifetime All-Access (First 5,000)',
    badge: 'POPULAR',
    recommended: true,
    isFree: false,
    userType: 'athlete' as const,
  },
  core_free: {
    productId: 'o1fc_core_free',
    name: 'Core Free',
    price: '$0',
    periodText: '/forever',
    description: '90-day full trial included',
    isFree: true,
    userType: 'athlete' as const,
  },
  premium: {
    productId: 'o1fc_premium_monthly',
    name: 'Premium Pro',
    price: '$9.99',
    periodText: '/mo',
    description: 'Full training & fuel OS',
    badge: 'POPULAR',
    recommended: true,
    isFree: false,
    userType: 'athlete' as const,
  },
  premium_travel: {
    productId: 'o1fc_premium_travel_monthly',
    name: 'Pro + Travel',
    price: '$15.99',
    periodText: '/mo',
    description: 'Global corridor everywhere',
    badge: 'ALL-ACCESS',
    recommended: false,
    isFree: false,
    userType: 'athlete' as const,
  },
  coach_free: {
    productId: 'o1fc_coach_free',
    name: 'CoachFree',
    price: '$0',
    periodText: '/forever',
    description: 'Start coaching today (manage up to 5 clients free)',
    isFree: true,
    userType: 'coach' as const,
  },
  coach_pro: {
    productId: 'o1fc_coach_pro_monthly',
    name: 'CoachPro',
    price: '$29.99',
    periodText: '/mo',
    description: 'Unlimited roster & dispatch',
    badge: 'POPULAR',
    recommended: true,
    isFree: false,
    userType: 'coach' as const,
  },
} as const;

export type IAPProductKey = keyof typeof IAP_PRODUCTS;

