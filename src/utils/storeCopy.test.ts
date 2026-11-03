import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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
    expect(storeCopyFor('ios').renewalDisclosure).toBe(
      'Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. Payment will be charged to your Apple ID account at confirmation of purchase. Subscriptions may be managed and auto-renewal turned off in your Account Settings after purchase.',
    );
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

describe('screens', () => {
  it('take store and platform names from storeCopy, never hard-coded', () => {
    const src = join(__dirname, '..');
    const offenders = readdirSync(src, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.tsx') && !file.includes('.test.'))
      .filter((file) => {
        const code = readFileSync(join(src, file), 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*$/gm, '');
        return /Google Play|Google LLC|Play Store|Apple (?:&amp;|&|or|and) Google|Android/.test(
          code,
        );
      });
    expect(offenders).toEqual([]);
  });
});
