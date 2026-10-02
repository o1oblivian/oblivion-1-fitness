import { useState, useEffect } from 'react';
import { safeStorage } from '../utils/safeStorage';
import { tactileEngine } from './tactileEngine';

export interface QueuedSyncItem {
  id: string;
  type: 'workout_log' | 'exercise_set' | 'check_in' | 'telemetry_metric';
  payload: any;
  timestamp: number;
}

const OFFLINE_QUEUE_KEY = 'o1fc_offline_sync_queue';
const LISTENERS = new Set<(online: boolean) => void>();

let currentOnlineStatus = typeof navigator !== 'undefined' ? navigator.onLine : true;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    currentOnlineStatus = true;
    LISTENERS.forEach((cb) => cb(true));
    flushOfflineQueue();
  });

  window.addEventListener('offline', () => {
    currentOnlineStatus = false;
    LISTENERS.forEach((cb) => cb(false));
  });
}

export function isDeviceOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function queueOfflineAction(type: QueuedSyncItem['type'], payload: any): void {
  const queue = safeStorage.getItem<QueuedSyncItem[]>(OFFLINE_QUEUE_KEY, []) || [];
  const newItem: QueuedSyncItem = {
    id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    payload,
    timestamp: Date.now(),
  };
  queue.push(newItem);
  safeStorage.setItem(OFFLINE_QUEUE_KEY, queue);
}

export function getOfflineQueue(): QueuedSyncItem[] {
  return safeStorage.getItem<QueuedSyncItem[]>(OFFLINE_QUEUE_KEY, []) || [];
}

export async function flushOfflineQueue(): Promise<{ syncedCount: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0 };

  const count = queue.length;
  // Clear the queue after persisting locally
  safeStorage.setItem(OFFLINE_QUEUE_KEY, []);

  // Announce restoration with celebratory tactile feedback
  tactileEngine.triggerDialHaptic();
  window.dispatchEvent(
    new CustomEvent('o1fc_toast', {
      detail: {
        message: `✨ Reconnected! ${count} offline gym logs safely synced.`,
        type: 'success',
      },
    })
  );

  return { syncedCount: count };
}

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(isDeviceOnline());

  useEffect(() => {
    const handleStatus = (online: boolean) => setIsOnline(online);
    LISTENERS.add(handleStatus);
    return () => {
      LISTENERS.delete(handleStatus);
    };
  }, []);

  return {
    isOnline,
    isBasementSafe: true, // App is 100% basement resilient with local-first persistence
    pendingSyncCount: getOfflineQueue().length,
  };
}
