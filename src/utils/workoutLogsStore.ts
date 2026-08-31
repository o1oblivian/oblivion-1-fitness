import { ExerciseLog } from '../types';
import { getUserState, saveUserState, UserAppState } from './authStorage';
import { supabase, isSupabaseConfigured } from './supabase';

export interface PendingWorkoutSync {
  id: string;
  userEmail: string;
  timestamp: number;
  logs: ExerciseLog[];
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
}

const ACTIVE_LOGS_CACHE_PREFIX = 'lumina_cached_activelogs_';
const PENDING_LOGS_QUEUE_PREFIX = 'lumina_pending_workout_logs_';

export function getIsOnline(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

/**
 * Load cached active logs from local-first storage for a user email.
 * Attempts Supabase fetch first if configured, then falls back to local cache.
 */
export async function loadActiveLogsFromCloud(userEmail: string): Promise<ExerciseLog[]> {
  const email = (userEmail || 'athlete@ofc.app').toLowerCase();

  if (isSupabaseConfigured()) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('workout_logs')
        .select('active_logs')
        .eq('user_email', email)
        .eq('record_date', today)
        .maybeSingle();

      if (!error && data && Array.isArray(data.active_logs) && data.active_logs.length > 0) {
        // Also cache locally for offline access
        try {
          localStorage.setItem(ACTIVE_LOGS_CACHE_PREFIX + email, JSON.stringify(data.active_logs));
        } catch (_) {}
        return data.active_logs;
      }
    } catch (e) {
      console.warn('Supabase workout logs fetch failed, using local cache:', e);
    }
  }

  return loadCachedActiveLogs(email);
}

/**
 * Load cached active logs from local-first storage for a user email
 */
export function loadCachedActiveLogs(userEmail: string): ExerciseLog[] {
  const email = (userEmail || 'athlete@ofc.app').toLowerCase();
  
  // 1. Check primary local cache key
  try {
    const raw = localStorage.getItem(ACTIVE_LOGS_CACHE_PREFIX + email);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip legacy placeholder
        const filtered = parsed.filter((l: ExerciseLog) => l.exerciseName !== '4-7-8 Breathing & Mobility Warmup');
        if (filtered.length !== parsed.length) {
          localStorage.setItem(ACTIVE_LOGS_CACHE_PREFIX + email, JSON.stringify(filtered));
        }
        return filtered;
      }
    }
  } catch (e) {
    console.warn('Failed to load active logs from cache:', e);
  }

  // 2. Fallback to authStorage UserAppState
  const savedState = getUserState(email);
  if (savedState && Array.isArray(savedState.activeLogs)) {
    const filtered = savedState.activeLogs.filter((l: ExerciseLog) => l.exerciseName !== '4-7-8 Breathing & Mobility Warmup');
    return filtered;
  }

  // 3. Default fallback - clean empty log
  return [];
}

/**
 * Get all pending offline workout logs queued for sync
 */
export function getPendingLogsQueue(userEmail: string): PendingWorkoutSync[] {
  const email = (userEmail || 'athlete@ofc.app').toLowerCase();
  try {
    const raw = localStorage.getItem(PENDING_LOGS_QUEUE_PREFIX + email);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save pending logs queue to local storage
 */
export function savePendingLogsQueue(userEmail: string, queue: PendingWorkoutSync[]): void {
  const email = (userEmail || 'athlete@ofc.app').toLowerCase();
  try {
    localStorage.setItem(PENDING_LOGS_QUEUE_PREFIX + email, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save pending workout logs queue:', e);
  }
}

/**
 * Clear pending logs queue once synced
 */
export function clearPendingLogsQueue(userEmail: string): void {
  const email = (userEmail || 'athlete@ofc.app').toLowerCase();
  try {
    localStorage.removeItem(PENDING_LOGS_QUEUE_PREFIX + email);
  } catch (e) {
    console.error('Failed to clear pending logs queue:', e);
  }
}

/**
 * Local-first save function for activeLogs.
 * Immediately persists to local storage, and then attempts remote sync or queues for offline sync.
 */
export async function saveActiveLogsLocalFirst(
  userEmail: string,
  logs: ExerciseLog[]
): Promise<{ isOnline: boolean; pendingCount: number }> {
  const email = (userEmail || 'athlete@ofc.app').toLowerCase();

  // Step 1: ALWAYS persist locally immediately (Zero latency, local-first guarantee)
  try {
    localStorage.setItem(ACTIVE_LOGS_CACHE_PREFIX + email, JSON.stringify(logs));
  } catch (e) {
    console.warn('Failed to save to local cache:', e);
  }

  // Also update user app state
  const currentState = getUserState(email);
  if (currentState) {
    saveUserState(email, {
      ...currentState,
      activeLogs: logs,
    });
  }

  const isOnline = getIsOnline();

  if (isOnline && isSupabaseConfigured()) {
    try {
      // Attempt remote sync to Supabase database
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('workout_logs').upsert([
        {
          user_email: email,
          record_date: today,
          active_logs: logs,
          synced_at: new Date().toISOString(),
        },
      ], { onConflict: 'user_email,record_date' });

      if (error) {
        throw error;
      }

      // Successful remote sync -> clear any pending queue items for this user
      clearPendingLogsQueue(email);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('workout_logs_sync_status', {
            detail: { isOnline: true, pendingCount: 0, status: 'synced' },
          })
        );
      }

      return { isOnline: true, pendingCount: 0 };
    } catch (e) {
      console.warn('Network sync failed or backend unavailable, queueing for background offline sync:', e);
      // Fall through to offline queuing logic
    }
  }

  // Step 2: Queue for offline sync if offline or remote sync failed
  const existingQueue = getPendingLogsQueue(email);
  const syncItem: PendingWorkoutSync = {
    id: 'sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    userEmail: email,
    timestamp: Date.now(),
    logs,
    status: 'pending',
  };

  // Keep latest log state in queue
  const updatedQueue = [syncItem];
  savePendingLogsQueue(email, updatedQueue);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('workout_logs_sync_status', {
        detail: { isOnline: false, pendingCount: updatedQueue.length, status: 'cached_locally' },
      })
    );
  }

  return { isOnline, pendingCount: updatedQueue.length };
}

/**
 * Flush/sync all pending queued workout logs to the cloud when network connection is restored
 */
export async function syncPendingWorkoutLogs(
  userEmail: string
): Promise<{ syncedCount: number; remainingCount: number }> {
  const email = (userEmail || 'athlete@ofc.app').toLowerCase();
  const queue = getPendingLogsQueue(email);

  if (queue.length === 0) {
    return { syncedCount: 0, remainingCount: 0 };
  }

  if (!getIsOnline()) {
    return { syncedCount: 0, remainingCount: queue.length };
  }

  let syncedCount = 0;
  const remaining: PendingWorkoutSync[] = [];

  for (const item of queue) {
    if (isSupabaseConfigured()) {
      try {
        const today = new Date(item.timestamp).toISOString().split('T')[0];
        const { error } = await supabase.from('workout_logs').upsert([
          {
            user_email: email,
            record_date: today,
            active_logs: item.logs,
            synced_at: new Date().toISOString(),
          },
        ], { onConflict: 'user_email,record_date' });

        if (!error) {
          syncedCount++;
          continue;
        }
      } catch (e) {
        console.warn('Failed sync attempt for item:', item.id, e);
      }
    } else {
      // Local-first standalone mode: mark as synced locally
      syncedCount++;
      continue;
    }

    remaining.push({ ...item, status: 'failed' });
  }

  savePendingLogsQueue(email, remaining);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('workout_logs_batch_synced', {
        detail: { syncedCount, remainingCount: remaining.length },
      })
    );
    window.dispatchEvent(
      new CustomEvent('workout_logs_sync_status', {
        detail: { isOnline: true, pendingCount: remaining.length, status: 'synced' },
      })
    );
  }

  return { syncedCount, remainingCount: remaining.length };
}

/**
 * Subscribe to online/offline network changes & auto-trigger sync when back online
 */
export function subscribeWorkoutLogsSync(
  userEmail: string,
  onSyncStatusChange: (status: { isOnline: boolean; pendingCount: number }) => void
): () => void {
  const email = (userEmail || 'athlete@ofc.app').toLowerCase();

  const handleOnline = async () => {
    const result = await syncPendingWorkoutLogs(email);
    onSyncStatusChange({
      isOnline: true,
      pendingCount: result.remainingCount,
    });
  };

  const handleOffline = () => {
    const queue = getPendingLogsQueue(email);
    onSyncStatusChange({
      isOnline: false,
      pendingCount: queue.length,
    });
  };

  const handleStatusEvent = (e: any) => {
    if (e.detail) {
      onSyncStatusChange({
        isOnline: e.detail.isOnline,
        pendingCount: e.detail.pendingCount,
      });
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('workout_logs_sync_status', handleStatusEvent);

    // Trigger initial status check
    const currentQueue = getPendingLogsQueue(email);
    onSyncStatusChange({
      isOnline: getIsOnline(),
      pendingCount: currentQueue.length,
    });

    // If online on mount and there are pending items, attempt immediate flush
    if (getIsOnline() && currentQueue.length > 0) {
      syncPendingWorkoutLogs(email);
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('workout_logs_sync_status', handleStatusEvent);
    }
  };
}
