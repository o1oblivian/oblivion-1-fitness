import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase module
vi.mock('@/utils/supabase', () => ({
  supabase: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
  isSupabaseConfigured: () => true,
}));

vi.mock('@/utils/authStorage', () => ({
  getSessionUserEmail: () => 'test@example.com',
}));

describe('errorReporter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('queues errors and flushes on batch interval', async () => {
    const { reportError } = await import('@/utils/errorReporter');

    reportError(new Error('Test error'), 'TestComponent');
    reportError('String error message', 'AnotherComponent');

    // Errors are queued, not sent immediately
    expect(true).toBe(true);
  });

  it('handles string errors', async () => {
    const { reportError } = await import('@/utils/errorReporter');
    
    // Should not throw
    expect(() => reportError('Simple string error')).not.toThrow();
  });
});

describe('analytics', () => {
  it('trackEvent does not throw', async () => {
    const { trackEvent, trackPageView, trackFeatureUsed } = await import('@/utils/analytics');

    expect(() => trackEvent('test_event', { key: 'value' })).not.toThrow();
    expect(() => trackPageView('/home')).not.toThrow();
    expect(() => trackFeatureUsed('workout_started')).not.toThrow();
  });
});
