import { supabase } from '../../../services/supabaseClient';
import { enqueueSync, flushSync, registerSyncHandler, rewriteSyncOps, scheduleSync } from '../../../services/syncOutbox';
import { safeStorage } from '../../../utils/safeStorage';

export type DayLogCategory = 'workout' | 'cardio' | 'nutrition' | 'sleep' | 'meditation';

const FORGOTTEN_KEY = 'o1fc_log_forgotten_v1';
const EDITS_KEY = 'o1fc_day_edits_v1';
let flushOnHideBound = false;

function bindFlushOnHide(): void {
  if (flushOnHideBound || typeof document === 'undefined') return;
  flushOnHideBound = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushSync();
  });
}

function syncKey(dateKey: string, category: DayLogCategory): string {
  return `${dateKey}:${category}`;
}

export function dayOpKey(dateKey: string, category: DayLogCategory): string {
  return `day:${syncKey(dateKey, category)}`;
}

/** When this phone last changed a day category. The phone's copy wins over an older account copy. */
export function localEditedAt(dateKey: string, category: DayLogCategory): number {
  const map = safeStorage.getItem<Record<string, number>>(EDITS_KEY, {}) || {};
  return Number(map[syncKey(dateKey, category)]) || 0;
}

export function setLocalEditedAt(dateKey: string, category: DayLogCategory, at: number): void {
  const map = safeStorage.getItem<Record<string, number>>(EDITS_KEY, {}) || {};
  map[syncKey(dateKey, category)] = at;
  safeStorage.setItem(EDITS_KEY, map);
}

/**
 * Step counts never leave this phone. Returns the record without steps, or null when the
 * record is only a step count and there is nothing else to back up.
 */
export function withoutSteps(category: DayLogCategory, record: Record<string, unknown>): Record<string, unknown> | null {
  if (category !== 'cardio') return record;
  const { steps: _steps, ...rest } = record;
  const name = String(rest.activityType ?? '').toLowerCase();
  const measured = ['distanceKm', 'durationMinutes', 'burnedKcal', 'avgHeartRateBpm'].some((k) => Number(rest[k]) > 0);
  if (!measured && (name === '' || name.includes('step'))) return null;
  return rest;
}

/** Upsert one day category to the athlete's account. */
async function persistDayLog(payload: Record<string, unknown>, userId: string): Promise<boolean> {
  const record = withoutSteps(payload.category as DayLogCategory, (payload.record ?? {}) as Record<string, unknown>);
  if (!record) return true;
  const { error } = await supabase.from('athlete_day_logs').upsert(
    [
      {
        user_id: userId,
        date_key: payload.dateKey,
        category: payload.category,
        payload: record,
        updated_at: payload.updatedAt,
      },
    ],
    { onConflict: 'user_id,date_key,category' },
  );
  if (error) console.warn('[DayLog] Backup notice:', error.message);
  return !error;
}

async function removeDayLog(payload: Record<string, unknown>, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('athlete_day_logs')
    .delete()
    .eq('user_id', userId)
    .eq('date_key', payload.dateKey)
    .eq('category', payload.category);
  if (error) console.warn('[DayLog] Backup delete notice:', error.message);
  return !error;
}

registerSyncHandler('day_log', persistDayLog);
registerSyncHandler('day_log_delete', removeDayLog);

/** Live workouts update on every set; the queue keeps only the latest copy per day and category. */
export function queueDayLogSync(dateKey: string, category: DayLogCategory, full: Record<string, unknown>): void {
  const record = withoutSteps(category, full);
  if (!record) {
    cancelDayLogSync(dateKey, category);
    return;
  }
  const at = Date.now();
  releaseForgotten(dateKey, category);
  setLocalEditedAt(dateKey, category, at);
  bindFlushOnHide();
  enqueueSync('day_log', dayOpKey(dateKey, category), dateKey, {
    dateKey,
    category,
    record,
    updatedAt: new Date(at).toISOString(),
  });
  scheduleSync();
}

/** Queue removal of the account copy; replaces any upload still waiting for that day. */
export function queueDayLogDelete(dateKey: string, category: DayLogCategory): void {
  setLocalEditedAt(dateKey, category, Date.now());
  enqueueSync('day_log_delete', dayOpKey(dateKey, category), dateKey, { dateKey, category });
  void flushSync();
}

export function cancelDayLogSync(dateKey: string, category: DayLogCategory): void {
  const key = dayOpKey(dateKey, category);
  rewriteSyncOps((op) => (op.kind === 'day_log' && op.key === key ? null : op));
}

function forgottenMap(): Record<string, true> {
  return safeStorage.getItem<Record<string, true>>(FORGOTTEN_KEY, {}) || {};
}

/** A deleted day must not come back from the account copy. */
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
