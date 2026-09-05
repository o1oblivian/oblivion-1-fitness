/**
 * Oblivion 1 Fitness Club (O1FC Official)
 * Cloud Sync & On-Device Storage Preferences Engine
 * 
 * Allows athletes to enforce 100% Local-Only / Offline Private Mode
 * with zero outbound data transmission to cloud databases.
 */

const CLOUD_SYNC_KEY = 'o1fc_cloud_sync_enabled';

export function isCloudSyncEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem(CLOUD_SYNC_KEY);
    // Cloud sync is OFF by default; only active if user explicitly set to 'true'
    return val === 'true';
  } catch {
    return false;
  }
}

export function setCloudSyncEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLOUD_SYNC_KEY, String(enabled));
    window.dispatchEvent(
      new CustomEvent('o1fc_cloud_sync_toggled', { detail: { enabled } })
    );
  } catch (e) {
    console.warn('Failed to save cloud sync preference:', e);
  }
}

/**
 * Switch to Local-Only mode:
 * Disables cloud sync and flushes/purges any pending outbound cloud queues
 * so the user never sees 'X to sync' badges again.
 */
export function enforceLocalOnlyStorage(): void {
  setCloudSyncEnabled(false);
  try {
    // Clear pending workout queues
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('lumina_pending_workout_logs_') || key === 'o1fc_meal_offline_queue')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    // Broadcast status to all UI subscribers
    window.dispatchEvent(
      new CustomEvent('workout_logs_sync_status', {
        detail: { isOnline: true, pendingCount: 0, status: 'local_only' },
      })
    );
  } catch (e) {
    console.warn('Error purging pending sync queue for local-only mode:', e);
  }
}
