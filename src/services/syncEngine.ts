import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { DatabaseSyncMutation } from '../types/database';
import { loadStoredQueue, saveStoredQueue, loadLastSyncedAt, saveLastSyncedAt } from './syncQueueStorage';

type SyncListener = () => void;

class ResilientSyncEngine {
  private queue: DatabaseSyncMutation[] = [];
  private isOnlineState = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private lastSyncedAt: string | null = null;
  private isDraining = false;
  private listeners: Set<SyncListener> = new Set();

  constructor() {
    this.queue = loadStoredQueue();
    this.lastSyncedAt = loadLastSyncedAt();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
      if (this.isOnlineState && this.queue.length > 0) setTimeout(() => this.drainQueue(), 1000);
    }
  }

  private notify() { this.listeners.forEach((fn) => fn()); }
  public subscribe(fn: SyncListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public getStatus() {
    return { isOnline: this.isOnlineState, pendingSyncCount: this.queue.length, lastSyncedAt: this.lastSyncedAt };
  }

  private handleOnline() {
    this.isOnlineState = true;
    this.notify();
    this.drainQueue();
  }

  private handleOffline() {
    this.isOnlineState = false;
    this.notify();
  }

  public async dispatchMutation(
    mutationData: Omit<DatabaseSyncMutation, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<{ success: boolean; isOptimistic: boolean }> {
    const mutation: DatabaseSyncMutation = {
      ...mutationData,
      id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      retryCount: 0,
      payload: { ...mutationData.payload, is_pending_sync: !this.isOnlineState },
    };

    if (!this.isOnlineState) {
      this.enqueue(mutation);
      return { success: true, isOptimistic: true };
    }

    try {
      const res = await this.executeRemote(mutation);
      if (!res) {
        mutation.payload.is_pending_sync = true;
        this.enqueue(mutation);
        return { success: true, isOptimistic: true };
      }
      this.markSynced();
      return { success: true, isOptimistic: false };
    } catch {
      mutation.payload.is_pending_sync = true;
      this.enqueue(mutation);
      return { success: true, isOptimistic: true };
    }
  }

  private enqueue(mutation: DatabaseSyncMutation) {
    this.queue.push(mutation);
    saveStoredQueue(this.queue);
    this.notify();
  }

  private markSynced() {
    const now = new Date().toISOString();
    this.lastSyncedAt = now;
    saveLastSyncedAt(now);
    this.notify();
  }

  private async executeRemote(mutation: DatabaseSyncMutation): Promise<boolean> {
    const cleanPayload = { ...mutation.payload, is_pending_sync: false };
    const { error } = await supabase.from(mutation.table).upsert(cleanPayload);
    return !error;
  }

  public async drainQueue(): Promise<void> {
    if (this.isDraining || this.queue.length === 0 || !this.isOnlineState) return;
    this.isDraining = true;
    const pending = [...this.queue];
    const remaining: DatabaseSyncMutation[] = [];

    for (const mutation of pending) {
      try {
        const ok = await this.executeRemote(mutation);
        if (!ok) remaining.push({ ...mutation, retryCount: mutation.retryCount + 1 });
      } catch {
        remaining.push({ ...mutation, retryCount: mutation.retryCount + 1 });
      }
    }

    this.queue = remaining;
    saveStoredQueue(remaining);
    this.markSynced();
    this.isDraining = false;
  }
}

export const syncEngine = new ResilientSyncEngine();

export function useSyncStatus() {
  const [status, setStatus] = useState(syncEngine.getStatus());
  useEffect(() => syncEngine.subscribe(() => setStatus(syncEngine.getStatus())), []);
  return status;
}
