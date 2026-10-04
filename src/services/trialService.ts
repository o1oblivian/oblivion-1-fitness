import { safeStorage } from '../utils/safeStorage';
import { supabase } from './supabaseClient';
import { isNativePlatform } from './subscriptionService';

const TRIAL_STORAGE_KEY = 'o1fc_athlete_trial_v2';
const TRIAL_DURATION_DAYS = 90;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

export interface TrialState {
  startDate: string; // ISO date
  expiresDate: string; // ISO date
  daysRemaining: number;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  hasSubscribedPro: boolean;
  planId?: string;
}

/**
 * Initializes or returns the 90-day freemium trial state for an athlete.
 * Automatically synchronizes with local storage and Supabase if connected.
 */
export function getAthleteTrialState(userId: string = 'default-athlete'): TrialState {
  const now = Date.now();
  
  // 1. Check local storage
  let stored = safeStorage.getItem<{ startDate: string; hasSubscribedPro?: boolean; planId?: string } | null>(
    `${TRIAL_STORAGE_KEY}_${userId}`,
    null
  );

  // If first time, seed initial 90-day trial start
  if (!stored || !stored.startDate) {
    stored = {
      startDate: new Date(now).toISOString(),
      hasSubscribedPro: false,
    };
    safeStorage.setItem(`${TRIAL_STORAGE_KEY}_${userId}`, stored);

    // Sync to Supabase in background
    syncTrialToSupabase(userId, stored.startDate);
  }

  const startMs = new Date(stored.startDate).getTime();
  const expiresMs = startMs + TRIAL_DURATION_MS;
  const msRemaining = expiresMs - now;
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const isExpired = now >= expiresMs;
  const hasSubscribed = Boolean(stored.hasSubscribedPro);

  return {
    startDate: stored.startDate,
    expiresDate: new Date(expiresMs).toISOString(),
    daysRemaining,
    isTrialActive: !isExpired || hasSubscribed,
    isTrialExpired: isExpired && !hasSubscribed,
    hasSubscribedPro: hasSubscribed,
    planId: stored.planId,
  };
}

/**
 * Marks the athlete as having upgraded/subscribed to Pro (Lifetime, Monthly, or Annual)
 */
export function activateProSubscription(userId: string = 'default-athlete', planId: string): void {
  const current = getAthleteTrialState(userId);
  const updated = {
    ...current,
    hasSubscribedPro: true,
    planId,
  };
  safeStorage.setItem(`${TRIAL_STORAGE_KEY}_${userId}`, updated);
  syncTrialToSupabase(userId, current.startDate, true, planId);
}

/**
 * Helper to simulate or test trial expiration for testing/admin purposes
 */
export function simulateTrialExpired(userId: string = 'default-athlete'): void {
  const expiredStart = new Date(Date.now() - (TRIAL_DURATION_MS + 86400000)).toISOString();
  safeStorage.setItem(`${TRIAL_STORAGE_KEY}_${userId}`, {
    startDate: expiredStart,
    hasSubscribedPro: false,
  });
}

/**
 * Resets trial to fresh 90 days (for testing or customer care)
 */
export function resetTrial90Days(userId: string = 'default-athlete'): void {
  const freshStart = new Date().toISOString();
  safeStorage.setItem(`${TRIAL_STORAGE_KEY}_${userId}`, {
    startDate: freshStart,
    hasSubscribedPro: false,
  });
}

/**
 * Background sync with Supabase profiles and user_entitlements
 */
async function syncTrialToSupabase(
  userId: string,
  startDate: string,
  isPro: boolean = false,
  planId?: string
) {
  try {
    const expiresAt = new Date(new Date(startDate).getTime() + TRIAL_DURATION_MS).toISOString();
    
    // Update Supabase profile table
    await supabase.from('athlete_profiles').upsert({
      id: userId,
      trial_started_at: startDate,
      trial_expires_at: expiresAt,
      is_trial_active: true,
      membership_tier: isPro ? planId || 'pro' : 'core_free',
      updated_at: new Date().toISOString(),
    });

    if (isPro) {
      await supabase.from('user_entitlements').upsert({
        user_id: userId,
        tier: planId || 'pro',
        status: 'active',
        platform: isNativePlatform() ? 'ios' : 'web',
        expires_at: '2099-12-31T23:59:59Z',
        updated_at: new Date().toISOString(),
      });
    }
  } catch {
    // Fail-open offline resilience: Supabase sync fails gracefully without blocking app
  }
}
