import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { enqueueSync, flushSync, hasPendingSync, registerSyncHandler } from '../../../services/syncOutbox';
import { safeStorage } from '../../../utils/safeStorage';
import { useTelemetryHistoryStore } from '../store/useTelemetryHistoryStore';
import {
  cancelDayLogSync,
  DayLogCategory,
  dayOpKey,
  isForgotten,
  localEditedAt,
  queueDayLogDelete,
  queueDayLogSync,
  setLocalEditedAt,
  withoutSteps,
} from './dayLogCloud';

export type { DayLogCategory };
export { markForgotten, isForgotten, releaseForgotten } from './dayLogCloud';

function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Remember a step count without turning it into distance, calories, or a heart rate. */
export function noteDailySteps(steps: number, dateKey = todayKey()): void {
  if (steps <= 0) return;
  const existing = useTelemetryHistoryStore.getState().historyByDate[dateKey]?.cardio;
  const name = (existing?.activityType || '').toLowerCase();
  const stepShadow = !existing?.hasData || name.includes('step');
  if (!stepShadow) return;
  useTelemetryHistoryStore.getState().updateDayRecord(dateKey, 'cardio', {
    hasData: true,
    steps,
    distanceKm: 0,
    burnedKcal: 0,
    durationMinutes: 0,
    avgHeartRateBpm: 0,
    zone2Minutes: 0,
    activityType: 'Steps',
  });
}

/** Remove the account copy when the athlete deletes that day on Log. Queued, so it lands even offline. */
export async function deleteDayLog(dateKey: string, category: DayLogCategory): Promise<void> {
  cancelDayLogSync(dateKey, category);
  queueDayLogDelete(dateKey, category);
}

const BASELINE_KEY = 'o1fc_day_edits_baseline_v1';
let baselineChecked = false;

/**
 * Days logged before edit times existed get the upgrade moment as their edit time, so the account
 * cannot replace them unless it was changed after this phone updated. Runs once per install.
 */
function ensureEditBaseline(): void {
  if (baselineChecked) return;
  baselineChecked = true;
  if (safeStorage.getItem<boolean>(BASELINE_KEY, false)) return;
  const at = Date.now();
  const history = useTelemetryHistoryStore.getState().historyByDate;
  for (const [dateKey, day] of Object.entries(history)) {
    for (const [category, record] of Object.entries(day ?? {})) {
      const rec = record as { hasData?: boolean } | undefined;
      if (rec?.hasData && localEditedAt(dateKey, category as DayLogCategory) === 0) {
        setLocalEditedAt(dateKey, category as DayLogCategory, at);
      }
    }
  }
  safeStorage.setItem(BASELINE_KEY, true);
}

/** True when this phone holds a change for the day the account has not confirmed, or edited it more recently. */
export function phoneOwnsDay(dateKey: string, category: DayLogCategory, accountUpdatedAt = 0): boolean {
  ensureEditBaseline();
  if (hasPendingSync((op) => op.scope === dateKey && (op.key === dayOpKey(dateKey, category) || op.kind !== 'day_log'))) return true;
  const edited = localEditedAt(dateKey, category);
  return edited > 0 && edited >= accountUpdatedAt;
}

const PHONE_ONLY_KEY = 'o1fc_phone_days_backed_up_v1';
const DAY_CATEGORIES: DayLogCategory[] = ['workout', 'cardio', 'nutrition', 'sleep', 'meditation'];

/**
 * Days logged before the sync queue survived restarts may never have reached the account.
 * Once per account on this phone, queue every logged day the account does not have.
 */
async function backUpPhoneOnlyDays(userId: string): Promise<void> {
  if (safeStorage.getItem<boolean>(PHONE_ONLY_KEY, false)) return;
  const { data, error } = await supabase
    .from('athlete_day_logs')
    .select('date_key, category')
    .eq('user_id', userId);
  if (error || !Array.isArray(data)) return;
  const onAccount = new Set(data.map((row) => dayOpKey(String(row.date_key || '').slice(0, 10), row.category as DayLogCategory)));
  const history = useTelemetryHistoryStore.getState().historyByDate;
  for (const [dateKey, day] of Object.entries(history)) {
    for (const category of DAY_CATEGORIES) {
      const record = day?.[category];
      if (!record?.hasData || isForgotten(dateKey, category)) continue;
      const key = dayOpKey(dateKey, category);
      if (onAccount.has(key) || hasPendingSync((op) => op.key === key)) continue;
      queueDayLogSync(dateKey, category, { ...(record as unknown as Record<string, unknown>) });
    }
  }
  safeStorage.setItem(PHONE_ONLY_KEY, true);
}

/** Fill this phone from the account copy. The phone's newer edits win and are sent back up. */
export async function hydrateDayLogs(): Promise<void> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return;
    const { data, error } = await supabase
      .from('athlete_day_logs')
      .select('date_key, category, payload, updated_at')
      .eq('user_id', userId)
      .order('date_key', { ascending: false })
      .limit(120);
    if (error || !Array.isArray(data)) return;
    for (const row of data) {
      const dateKey = String(row.date_key || '').slice(0, 10);
      const category = row.category as DayLogCategory;
      if (!dateKey || !category || !row.payload || typeof row.payload !== 'object') continue;
      if (isForgotten(dateKey, category)) continue;
      const accountRecord = withoutSteps(category, row.payload as Record<string, unknown>);
      if (!accountRecord) continue;
      const accountAt = Date.parse(String(row.updated_at || '')) || 0;
      if (phoneOwnsDay(dateKey, category, accountAt)) {
        const local = useTelemetryHistoryStore.getState().historyByDate[dateKey]?.[category];
        const queued = hasPendingSync((op) => op.key === dayOpKey(dateKey, category));
        if (local?.hasData && !queued && localEditedAt(dateKey, category) > accountAt) {
          queueDayLogSync(dateKey, category, { ...(local as unknown as Record<string, unknown>) });
        }
        continue;
      }
      useTelemetryHistoryStore.getState().updateDayRecord(dateKey, category, {
        ...accountRecord,
        hasData: true,
      }, { skipCloud: true });
      if (accountAt > 0) setLocalEditedAt(dateKey, category, accountAt);
    }
    await backUpPhoneOnlyDays(userId);
  } catch (err) {
    console.warn('[DayLog] Hydration notice:', err);
  }
}

export function localDayKey(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Noon on a YYYY-MM-DD day in local time, so the day survives any timezone round trip. */
export function localNoonIso(dateKey: string): string | undefined {
  const hit = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!hit) return undefined;
  const date = new Date(Number(hit[1]), Number(hit[2]) - 1, Number(hit[3]), 12, 0, 0);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

async function archivedSessionIds(userId: string, dateKey: string, category: 'workout' | 'cardio'): Promise<string[] | null> {
  const { data, error } = await supabase
    .from('completed_sessions')
    .select('id, title, session_name, activity_type, completed_at, created_at')
    .or(`client_id.eq.${userId},user_id.eq.${userId}`)
    .limit(200);
  if (error) return null;
  return (data || [])
    .filter((row) => {
      const key = localDayKey(row.completed_at) || localDayKey(row.created_at);
      if (key !== dateKey) return false;
      const title = String(row.session_name || row.title || '').toLowerCase();
      const cardio = title.startsWith('cardio') || row.activity_type != null;
      return category === 'cardio' ? cardio : !cardio;
    })
    .map((row) => String(row.id))
    .filter(Boolean);
}

async function purgeLift(payload: Record<string, unknown>, userId: string): Promise<boolean> {
  const ids = await archivedSessionIds(userId, String(payload.dateKey), 'workout');
  if (ids === null) return false;
  if (ids.length === 0) return true;
  const { error } = await supabase.from('workout_logs').delete().in('session_id', ids).eq('exercise_name', String(payload.name));
  return !error;
}

async function purgeDay(payload: Record<string, unknown>, userId: string): Promise<boolean> {
  const dateKey = String(payload.dateKey);
  const category = payload.category as DayLogCategory;
  if (category === 'workout' || category === 'cardio') {
    const ids = await archivedSessionIds(userId, dateKey, category);
    if (ids === null) return false;
    if (ids.length > 0) {
      const logs = await supabase.from('workout_logs').delete().in('session_id', ids);
      if (logs.error) return false;
      const sessions = await supabase.from('completed_sessions').delete().in('id', ids);
      if (sessions.error) return false;
      await supabase.from('workout_sessions').delete().in('id', ids);
    }
  }
  if (category === 'nutrition') {
    const meals = await supabase.from('meal_logs').delete().eq('user_id', userId).eq('date', dateKey);
    if (meals.error) return false;
    const day = await supabase.from('fuel_days').delete().eq('user_id', userId).eq('date_key', dateKey);
    if (day.error) return false;
  }
  return true;
}

registerSyncHandler('purge_lift', purgeLift);
registerSyncHandler('purge_day', purgeDay);

/** Delete one lift's backed-up sets for a day so it does not come back in history. */
export async function purgeArchivedLift(dateKey: string, exerciseName: string): Promise<void> {
  enqueueSync('purge_lift', `purge_lift:${dateKey}:${exerciseName}`, dateKey, { dateKey, name: exerciseName });
  void flushSync();
}

/** Delete the backed-up session or meals that would otherwise restore a removed day. */
export async function purgeArchivedDay(dateKey: string, category: DayLogCategory): Promise<void> {
  enqueueSync('purge_day', `purge_day:${dateKey}:${category}`, dateKey, { dateKey, category });
  void flushSync();
}
