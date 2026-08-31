import { supabase, isSupabaseConfigured } from './supabase';
import { getSessionUserEmail } from './authStorage';

const BATCH_INTERVAL = 5000;
const MAX_BATCH_SIZE = 10;

interface ErrorEntry {
  user_email: string | null;
  error_message: string;
  error_stack: string | null;
  component: string | null;
  url: string;
  user_agent: string;
  metadata: Record<string, unknown> | null;
}

let errorQueue: ErrorEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flushErrors, BATCH_INTERVAL);
}

async function flushErrors() {
  flushTimer = null;
  if (errorQueue.length === 0) return;
  if (!isSupabaseConfigured()) return;

  const batch = errorQueue.splice(0, MAX_BATCH_SIZE);
  try {
    await supabase.from('error_logs').insert(batch);
  } catch {
    // If reporting fails, don't re-queue to avoid infinite loops
  }

  if (errorQueue.length > 0) scheduleFlush();
}

export function reportError(
  error: Error | string,
  component?: string,
  metadata?: Record<string, unknown>
) {
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? null : error.stack || null;

  const entry: ErrorEntry = {
    user_email: getSessionUserEmail(),
    error_message: message.slice(0, 2000),
    error_stack: stack?.slice(0, 4000) || null,
    component: component || null,
    url: window.location.href,
    user_agent: navigator.userAgent.slice(0, 500),
    metadata: metadata || null,
  };

  errorQueue.push(entry);
  if (errorQueue.length >= MAX_BATCH_SIZE) {
    flushErrors();
  } else {
    scheduleFlush();
  }
}

export function initGlobalErrorHandlers() {
  window.addEventListener('error', (event) => {
    reportError(
      event.error || event.message || 'Unknown error',
      'window.onerror',
      { filename: event.filename, lineno: event.lineno, colno: event.colno }
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason : String(reason || 'Unhandled promise rejection');
    reportError(
      message instanceof Error ? message : new Error(String(message)),
      'unhandledrejection'
    );
  });
}
