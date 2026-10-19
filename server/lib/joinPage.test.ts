import { describe, expect, it } from 'vitest';
import { renderJoinPage, resolveJoinOptions } from './joinPage';

describe('joinPage', () => {
  it('uses the Play listing by default and hides the App Store until it is set', () => {
    const options = resolveJoinOptions({} as NodeJS.ProcessEnv);
    expect(options.playUrl).toBe('https://play.google.com/store/apps/details?id=com.o1fc.fitness');
    expect(options.appleUrl).toBe('');
  });

  it('accepts only https store links from the environment', () => {
    const options = resolveJoinOptions({
      GOOGLE_PLAY_URL: 'javascript:alert(1)',
      APPLE_APP_STORE_URL: 'https://apps.apple.com/app/id123',
    } as unknown as NodeJS.ProcessEnv);
    expect(options.playUrl).toContain('play.google.com');
    expect(options.appleUrl).toBe('https://apps.apple.com/app/id123');
  });

  it('renders the store buttons and the app link', () => {
    const html = renderJoinPage(resolveJoinOptions({} as NodeJS.ProcessEnv));
    expect(html).toContain('Get it on Google Play');
    expect(html).toContain('Download on the App Store');
    expect(html).toContain('intent://auth/callback');
    expect(html).toContain('com.o1fc.fitness');
    expect(html).not.toContain('oblivion1.club');
  });
});
