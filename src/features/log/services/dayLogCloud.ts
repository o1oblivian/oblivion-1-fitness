import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { safeStorage } from '../../../utils/sanitizers';

export type DayLogCategory = 'workout' | 'cardio' | 'nutrition' | 'sleep' | 'meditation';

const SYNC_DELAY_MS = 1500;
const FORGOTTEN_KEY = 'o1fc_log_forgotten_v1';

const pending = new Map<string, { timer: ReturnType<typeof setTimeout>; payload: Record<string, unknown> }>();
let flushOnHideBound = false;

function bindFlushOnHide(): void {
  if (flushOnHideBound || typeof document === 'undefined') return;
  flushOnHideBound = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushDayLogSync();
  });
}

function syncKey(dateKey: string, category: DayLogCategory): string {
  return `${dateKey}:${category}`;
}

/** Upsert one day category to the athlete's account. */
export async function persistDayLog(
  dateKey: string,
  category: DayLogCategory,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return;
    const { error } = await supabase.from('athlete_day_logs').upsert(
      [
        {
          user_id: userId,
          date_key: dateKey,
          category,
          payload,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'user_id,date_key,category' },
    );
    if (error) console.warn('[DayLog] Cloud save notice:', error.message);
  } catch (err) {
    console.warn('[DayLog] Cloud save notice:', err);
  }
}

/** Live workouts update on every set, so writes are coalesced per day and category. */
export function queueDayLogSync(dateKey: string, category: DayLogCategory, payload: Record<string, unknown>): void {
  const key = syncKey(dateKey, category);
  const existing = pending.get(key);
  if (existing) clearTimeout(existing.timer);
  releaseForgotten(dateKey, category);
  bindFlushOnHide();
  const timer = setTimeout(() => {
    pending.delete(key);
    void persistDayLog(dateKey, category, payload);
  }, SYNC_DELAY_MS);
  pending.set(key, { timer, payload });
}

export function cancelDayLogSync(dateKey: string, category: DayLogCategory): void {
  const key = syncKey(dateKey, category);
  const existing = pending.get(key);
  if (!existing) return;
  clearTimeout(existing.timer);
  pending.delete(key);
}

/** Send queued writes now, e.g. when the app is backgrounded. */
export function flushDayLogSync(): void {
  for (const [key, { timer, payload }] of pending) {
    clearTimeout(timer);
    pending.delete(key);
    const [dateKey, category] = key.split(':') as [string, DayLogCategory];
    void persistDayLog(dateKey, category, payload);
  }
}

function forgottenMap(): Record<string, true> {
  return safeStorage.getItem<Record<string, true>>(FORGOTTEN_KEY, {}) || {};
}

/** A deleted day must not come back from the cloud before the delete lands. */
export function markForgotten(dateKey: string, category: DayLogCategory): void {
  const map = forgottenMap();
  map[syncKey(dateKey, category)] = true;
  safeStorage.setItem(FORGOTTEN_KEY, map);
}

export function releaseForgotten(dateKey: string, category: DayLogCategory): void {
  const map = forgottenMap();
  if (!map[syncKey(dateKey, category)]) return;
  delete map[syncKey(dateKey, category)];
  safeStorage.setItem(FORGOTTEN_KEY, map);
}

export function isForgotten(dateKey: string, category: DayLogCategory): boolean {
  return Boolean(forgottenMap()[syncKey(dateKey, category)]);
}
