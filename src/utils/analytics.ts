import { supabase, isSupabaseConfigured } from './supabase';
import { getSessionUserEmail } from './authStorage';

const BATCH_INTERVAL = 10000;
const MAX_BATCH_SIZE = 20;

interface AnalyticsEvent {
  user_email: string | null;
  event_name: string;
  event_data: Record<string, unknown> | null;
  page: string | null;
  session_id: string;
}

let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flushEvents, BATCH_INTERVAL);
}

async function flushEvents() {
  flushTimer = null;
  if (eventQueue.length === 0) return;
  if (!isSupabaseConfigured()) return;

  const batch = eventQueue.splice(0, MAX_BATCH_SIZE);
  try {
    await supabase.from('analytics_events').insert(batch);
  } catch {
    // Silent fail - analytics should never break the app
  }

  if (eventQueue.length > 0) scheduleFlush();
}

export function trackEvent(
  eventName: string,
  eventData?: Record<string, unknown>
) {
  const entry: AnalyticsEvent = {
    user_email: getSessionUserEmail(),
    event_name: eventName,
    event_data: eventData || null,
    page: getCurrentPage(),
    session_id: SESSION_ID,
  };

  eventQueue.push(entry);
  if (eventQueue.length >= MAX_BATCH_SIZE) {
    flushEvents();
  } else {
    scheduleFlush();
  }
}

export function trackPageView(page: string) {
  trackEvent('page_view', { page });
}

export function trackFeatureUsed(feature: string, details?: Record<string, unknown>) {
  trackEvent('feature_used', { feature, ...details });
}

function getCurrentPage(): string {
  return window.location.pathname + window.location.hash;
}

export function initAnalytics() {
  trackEvent('session_start', {
    referrer: document.referrer || null,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    platform: navigator.platform,
    language: navigator.language,
  });
}

// Flush remaining events before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushEvents();
    }
  });
}
