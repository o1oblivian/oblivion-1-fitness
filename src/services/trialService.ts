import { safeStorage } from '../utils/safeStorage';

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
const EMPTY_TRIAL: TrialState = {
  startDate: '',
  expiresDate: '',
  daysRemaining: 0,
  isTrialActive: false,
  isTrialExpired: true,
  hasSubscribedPro: false,
};

export function getAthleteTrialState(userId: string = ''): TrialState {
  if (!userId) return EMPTY_TRIAL;
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
 * Marks the athlete as having upgraded/subscribed to Pro (Lifetime or Monthly)
 */
export function activateProSubscription(userId: string = '', planId: string): void {
  if (!userId) return;
  const current = getAthleteTrialState(userId);
  const updated = {
    ...current,
    hasSubscribedPro: true,
    planId,
  };
  safeStorage.setItem(`${TRIAL_STORAGE_KEY}_${userId}`, updated);
}

/** The store reports no active plan (expired, refunded or cancelled), so the athlete goes back to the trial clock. */
export function clearProSubscription(userId: string = ''): void {
  if (!userId) return;
  const current = getAthleteTrialState(userId);
  if (!current.hasSubscribedPro) return;
  safeStorage.setItem(`${TRIAL_STORAGE_KEY}_${userId}`, { startDate: current.startDate, hasSubscribedPro: false });
}
