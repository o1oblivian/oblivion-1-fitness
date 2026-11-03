import { Capacitor } from '@capacitor/core';

/**
 * The words the app uses for the store the person buys from. Apple reviews the iOS build and rejects
 * mentions of other platforms (Guideline 2.3.10), so each platform shows only its own store and the
 * web shows neither.
 */
export interface StoreCopy {
  /** "Apple App Store", "Google Play", or "the store" on the web. */
  billedBy: string;
  /** How the store is named inside a sentence: "the App Store", "Google Play". */
  inSentence: string;
  /** The account a subscription is billed to. */
  account: string;
  /** The platform privacy rule the app states compliance with. */
  trackingPolicy: string;
  /** Where a subscription is managed or cancelled. */
  settings: string;
  /** Label on the subscribe button, without the arrow. */
  subscribeLabel: string;
  /** The in-app subscription notice under the plan list. */
  subscriptionNotice: string;
  /** The line before "Cancel Anytime" under the subscribe button. */
  footerName: string;
  /** Who processes the purchase: "Apple", "Google", or "the store". */
  processor: string;
  /** The company whose distribution terms apply: "Apple Inc.", "Google LLC", or "the store". */
  distributor: string;
  /**
   * The auto-renewal paragraph App Store Review Guideline 3.1.2(c) requires under a subscribe button.
   * On iOS this is the Apple wording, with the charge named against the Apple ID.
   */
  renewalDisclosure: string;
}

const NOTICE_TAIL = 'Your Oblivion 1 Club Pass unlocks across all your devices.';

/** Guideline 3.1.2(c). `account` is the platform's own billing account, already phrased for a sentence. */
function renewalDisclosure(account: string): string {
  return `Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. Payment will be charged to ${account} at confirmation of purchase. Subscriptions may be managed and auto-renewal turned off in your Account Settings after purchase.`;
}

export function storeCopyFor(platform: string): StoreCopy {
  if (platform === 'ios') {
    return {
      billedBy: 'Apple App Store',
      inSentence: 'the App Store',
      account: 'your Apple ID account',
      trackingPolicy: 'Apple App Tracking Transparency (ATT)',
      settings: 'your Apple ID subscription settings',
      subscribeLabel: 'Subscribe with App Store',
      subscriptionNotice: `In-App Subscription: Billed via Apple App Store. ${NOTICE_TAIL}`,
      footerName: 'Apple App Store',
      processor: 'Apple',
      distributor: 'Apple Inc.',
      renewalDisclosure: renewalDisclosure('your Apple ID account'),
    };
  }
  if (platform === 'android') {
    return {
      billedBy: 'Google Play',
      inSentence: 'Google Play',
      account: 'your Google Play account',
      trackingPolicy: 'Google Play User Data policies',
      settings: 'your Google Play subscription settings',
      subscribeLabel: 'Subscribe with Google Play',
      subscriptionNotice: `In-App Subscription: Billed via Google Play. ${NOTICE_TAIL}`,
      footerName: 'Google Play',
      processor: 'Google',
      distributor: 'Google LLC',
      renewalDisclosure: renewalDisclosure('your Google Play account'),
    };
  }
  return {
    billedBy: 'the store',
    inSentence: 'the store',
    account: 'your store account',
    trackingPolicy: 'platform privacy requirements',
    settings: 'your store subscription settings',
    subscribeLabel: 'Subscribe',
    subscriptionNotice: `In-App Subscription: Billed by the store. ${NOTICE_TAIL}`,
    footerName: 'In-app billing',
    processor: 'the store',
    distributor: 'the store',
    renewalDisclosure: renewalDisclosure('your store account'),
  };
}

/** The store copy for the platform this build runs on. */
export function storeCopy(): StoreCopy {
  let platform = 'web';
  try {
    platform = Capacitor.getPlatform();
  } catch (err) {
    console.warn('[storeCopy] Treated as the web, which names no store.', err);
  }
  return storeCopyFor(platform);
}
