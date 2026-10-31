import { describe, expect, it } from 'vitest';
import { storeCopyFor } from './storeCopy';

function words(platform: string): string {
  return Object.values(storeCopyFor(platform)).join(' | ');
}

describe('storeCopyFor', () => {
  it('names only the App Store on iOS', () => {
    const text = words('ios');
    expect(text).not.toMatch(/google|play|android/i);
    expect(storeCopyFor('ios').subscribeLabel).toBe('Subscribe with App Store');
    expect(storeCopyFor('ios').subscriptionNotice).toBe(
      'In-App Subscription: Billed via Apple App Store. Your Oblivion 1 Club Pass unlocks across all your devices.',
    );
    expect(storeCopyFor('ios').footerName).toBe('Apple App Store');
  });

  it('names only Google Play on Android', () => {
    const text = words('android');
    expect(text).not.toMatch(/apple|app store|ios/i);
    expect(storeCopyFor('android').subscribeLabel).toBe('Subscribe with Google Play');
  });

  it('names no store on the web', () => {
    expect(words('web')).not.toMatch(/google|apple|app store|play|android|ios/i);
  });
});
