export interface FeedbackPreferences {
  audioEnabled: boolean;
  hapticsEnabled: boolean;
  dialTicks: boolean;
  restTimerAlarm: boolean;
  prChime: boolean;
  speechVoice: boolean;
}

const STORAGE_KEY = 'ofc_feedback_preferences_v1';

const DEFAULT_PREFERENCES: FeedbackPreferences = {
  audioEnabled: true,
  hapticsEnabled: true,
  dialTicks: true,
  restTimerAlarm: true,
  prChime: true,
  speechVoice: false,
};

export function getFeedbackPreferences(): FeedbackPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveFeedbackPreferences(prefs: Partial<FeedbackPreferences>): FeedbackPreferences {
  const current = getFeedbackPreferences();
  const next = { ...current, ...prefs };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('ofc_feedback_prefs_changed', { detail: next }));
  } catch {}
  return next;
}
