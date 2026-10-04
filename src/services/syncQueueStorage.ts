import { DatabaseSyncMutation } from '../types/database';
import { safeStorage } from '../utils/safeStorage';

const QUEUE_STORAGE_KEY = 'O1_OFFLINE_MUTATION_QUEUE';
const LAST_SYNCED_KEY = 'O1_LAST_SYNCED_AT';

export const loadStoredQueue = (): DatabaseSyncMutation[] => {
  try {
    const raw = safeStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[SyncStorage] Silently handled offline queue parse:', err);
    return [];
  }
};

export const saveStoredQueue = (queue: DatabaseSyncMutation[]): void => {
  try {
    safeStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[SyncStorage] Silently handled offline queue write:', err);
  }
};

export const loadLastSyncedAt = (): string | null => {
  try {
    return safeStorage.getItem(LAST_SYNCED_KEY);
  } catch {
    return null;
  }
};

export const saveLastSyncedAt = (timestamp: string): void => {
  try {
    safeStorage.setItem(LAST_SYNCED_KEY, timestamp);
  } catch {
    // Silently handled
  }
};
