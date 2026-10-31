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
}

const NOTICE_TAIL = 'Your Oblivion 1 Club Pass unlocks across all your devices.';

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
  };
}

/** The store copy for the platform this build runs on. */
export function storeCopy(): StoreCopy {
  let platform = 'web';
  try {
    platform = Capacitor.getPlatform();
  } catch {
    // Treated as the web, which names no store.
  }
  return storeCopyFor(platform);
}
