import { useEffect, useState } from 'react';
import { safeStorage } from '../utils/safeStorage';
import { getAuthenticatedUserId } from './authUser';

/**
 * Local-first sync. Every change is applied on the phone first, then queued here and sent to the
 * athlete's account in order. An op leaves the queue only after the account confirms it.
 */
export interface OutboxOp {
  id: string;
  kind: string;
  /** Newer ops with the same key replace older ones (last write wins). */
  key: string;
  /** Ops in one scope (a calendar day) are sent in order; a failure holds back the rest of that day. */
  scope: string;
  payload: Record<string, unknown>;
  at: number;
  attempts: number;
  /** Last failed send; automatic retries back off from here. */
  failedAt?: number;
}

type Handler = (payload: Record<string, unknown>, userId: string) => Promise<boolean>;

interface ExternalQueue {
  flush: () => Promise<void>;
  pending: () => number;
}

const OUTBOX_KEY = 'o1fc_sync_outbox_v1';
const RETRY_MS = 120_000;
const BACKOFF_CAP_MS = 30 * 60_000;
const RECONNECT_JITTER_MS = 5_000;

/** 2, 4, 8 … minutes after each failure, capped at 30. */
function backoffMs(attempts: number): number {
  return Math.min(BACKOFF_CAP_MS, RETRY_MS * 2 ** Math.max(0, attempts - 1));
}

function waitingOut(op: OutboxOp, now: number): boolean {
  return op.attempts > 0 && typeof op.failedAt === 'number' && now - op.failedAt < backoffMs(op.attempts);
}

const handlers = new Map<string, Handler>();
const externals = new Map<string, ExternalQueue>();
const listeners = new Set<() => void>();

const read = (): OutboxOp[] => {
  const list = safeStorage.getItem<OutboxOp[]>(OUTBOX_KEY, []);
  return Array.isArray(list) ? list : [];
};

const write = (ops: OutboxOp[]) => {
  safeStorage.setItem(OUTBOX_KEY, ops);
  listeners.forEach((fn) => fn());
};

export function registerSyncHandler(kind: string, handler: Handler): void {
  handlers.set(kind, handler);
}

/** Queues with their own storage (e.g. Food) report into the same status and retry loop. */
export function registerExternalQueue(name: string, queue: ExternalQueue): void {
  externals.set(name, queue);
}

export function enqueueSync(kind: string, key: string, scope: string, payload: Record<string, unknown>): void {
  const op: OutboxOp = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    key,
    scope,
    payload,
    at: Date.now(),
    attempts: 0,
  };
  write([...read().filter((o) => o.key !== key), op]);
}

/** Rewrite or drop queued ops; return null to drop. */
export function rewriteSyncOps(fn: (op: OutboxOp) => OutboxOp | null): void {
  const before = read();
  const after = before.flatMap((op) => {
    const next = fn(op);
    return next ? [next] : [];
  });
  if (after.length !== before.length || after.some((op, i) => op !== before[i])) write(after);
}

export function pendingSyncOps(): OutboxOp[] {
  return read();
}

export function hasPendingSync(predicate: (op: OutboxOp) => boolean): boolean {
  return read().some(predicate);
}

function pendingCount(): number {
  let n = read().length;
  externals.forEach((q) => {
    try {
      n += q.pending();
    } catch {
      // ignore a broken counter
    }
  });
  return n;
}

let flushing: Promise<void> | null = null;
let again = false;

let userRequested = false;

async function pass(respectBackoff: boolean): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  const ops = read();
  if (ops.length > 0) {
    const userId = await getAuthenticatedUserId();
    if (userId) {
      const blocked = new Set<string>();
      const now = Date.now();
      for (const op of ops) {
        if (blocked.has(op.scope)) continue;
        if (respectBackoff && waitingOut(op, now)) {
          blocked.add(op.scope);
          continue;
        }
        const handler = handlers.get(op.kind);
        let ok = false;
        if (handler) {
          try {
            ok = await handler(op.payload, userId);
          } catch {
            ok = false;
          }
        }
        if (ok) {
          write(read().filter((o) => o.id !== op.id));
        } else {
          blocked.add(op.scope);
          if (handler) {
            const failedAt = Date.now();
            write(read().map((o) => (o.id === op.id ? { ...o, attempts: o.attempts + 1, failedAt } : o)));
          }
        }
      }
    }
  }
  for (const queue of externals.values()) {
    try {
      await queue.flush();
    } catch {
      // retried on the next pass
    }
  }
}

/**
 * Send everything queued. Concurrent calls share one run and trigger one more pass afterwards.
 * Automatic retries skip ops still backing off; anything the athlete does sends everything now.
 */
export function flushSync(automatic = false): Promise<void> {
  if (!automatic) userRequested = true;
  if (flushing) {
    again = true;
    return flushing;
  }
  flushing = (async () => {
    do {
      again = false;
      const respectBackoff = !userRequested;
      userRequested = false;
      await pass(respectBackoff);
    } while (again);
  })().finally(() => {
    flushing = null;
    listeners.forEach((fn) => fn());
  });
  return flushing;
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** Coalesces bursts (e.g. every set of a live workout) into one send. */
export function scheduleSync(delayMs = 1500): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushSync();
  }, delayMs);
}

/**
 * Retries on launch, on reconnect, when the app is reopened or backgrounded, and every two minutes.
 * Launch and reconnect wait a random few seconds so phones coming back together do not send at once.
 */
export function startSync(): () => void {
  let jitterTimer: ReturnType<typeof setTimeout> | null = null;
  const retry = () => void flushSync(true);
  const retrySoon = () => {
    if (jitterTimer) return;
    jitterTimer = setTimeout(() => {
      jitterTimer = null;
      retry();
    }, Math.random() * RECONNECT_JITTER_MS);
  };
  const onVisibility = () => (document.visibilityState === 'hidden' ? retry() : retrySoon());
  const onStatus = () => listeners.forEach((fn) => fn());
  retrySoon();
  window.addEventListener('online', retrySoon);
  window.addEventListener('online', onStatus);
  window.addEventListener('offline', onStatus);
  document.addEventListener('visibilitychange', onVisibility);
  const timer = window.setInterval(() => {
    if (pendingCount() > 0) retry();
  }, RETRY_MS);
  return () => {
    if (jitterTimer) clearTimeout(jitterTimer);
    window.removeEventListener('online', retrySoon);
    window.removeEventListener('online', onStatus);
    window.removeEventListener('offline', onStatus);
    document.removeEventListener('visibilitychange', onVisibility);
    window.clearInterval(timer);
  };
}

export interface SyncStatus {
  online: boolean;
  pending: number;
  /** When the oldest queued change was made; null when nothing waits. */
  oldestAt: number | null;
  syncing: boolean;
}

let externalSince: number | null = null;

function snapshot(): SyncStatus {
  const ops = read();
  const external = pendingCount() - ops.length;
  if (external <= 0) externalSince = null;
  else if (externalSince === null) externalSince = Date.now();
  const times = [...ops.map((o) => o.at), ...(externalSince !== null ? [externalSince] : [])];
  const oldest = times.length > 0 ? Math.min(...times) : null;
  return {
    online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
    pending: ops.length + external,
    oldestAt: oldest,
    syncing: flushing !== null,
  };
}

export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(snapshot);
  useEffect(() => {
    const update = () => setStatus(snapshot());
    listeners.add(update);
    update();
    const tick = window.setInterval(update, 10_000);
    return () => {
      listeners.delete(update);
      window.clearInterval(tick);
    };
  }, []);
  return status;
}
