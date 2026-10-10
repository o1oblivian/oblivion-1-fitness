import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { safeStorage } from '../../../utils/sanitizers';
import { TelemetryCategory, useTelemetryHistoryStore } from '../store/useTelemetryHistoryStore';

export type DayLogCategory = TelemetryCategory;

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

/** Save a day log on this device and, when signed in, on the athlete's account. */
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

const FORGOTTEN_KEY = 'o1fc_log_forgotten_v1';

function forgottenMap(): Record<string, true> {
  return safeStorage.getItem<Record<string, true>>(FORGOTTEN_KEY, {}) || {};
}

function forgottenId(dateKey: string, category: DayLogCategory): string {
  return `${dateKey}:${category}`;
}

/** A deleted day must not come back from the cloud on the next sign-in. */
export function markForgotten(dateKey: string, category: DayLogCategory): void {
  const map = forgottenMap();
  map[forgottenId(dateKey, category)] = true;
  safeStorage.setItem(FORGOTTEN_KEY, map);
}

export function releaseForgotten(dateKey: string, category: DayLogCategory): void {
  const map = forgottenMap();
  if (!map[forgottenId(dateKey, category)]) return;
  delete map[forgottenId(dateKey, category)];
  safeStorage.setItem(FORGOTTEN_KEY, map);
}

export function isForgotten(dateKey: string, category: DayLogCategory): boolean {
  return Boolean(forgottenMap()[forgottenId(dateKey, category)]);
}

/** Remove a cloud copy when the athlete deletes that day on Log. */
export async function deleteDayLog(dateKey: string, category: DayLogCategory): Promise<void> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return;
    const { error } = await supabase
      .from('athlete_day_logs')
      .delete()
      .eq('user_id', userId)
      .eq('date_key', dateKey)
      .eq('category', category);
    if (error) console.warn('[DayLog] Cloud delete notice:', error.message);
  } catch (err) {
    console.warn('[DayLog] Cloud delete notice:', err);
  }
}

/** Pull saved day logs back onto this device. Missing table or signed-out state leaves local logs as they are. */
export async function hydrateDayLogs(): Promise<void> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return;
    const { data, error } = await supabase
      .from('athlete_day_logs')
      .select('date_key, category, payload')
      .eq('user_id', userId)
      .order('date_key', { ascending: false })
      .limit(120);
    if (error || !Array.isArray(data)) return;
    for (const row of data) {
      const dateKey = String(row.date_key || '').slice(0, 10);
      const category = row.category as DayLogCategory;
      if (!dateKey || !category || !row.payload || typeof row.payload !== 'object') continue;
      if (isForgotten(dateKey, category)) continue;
      useTelemetryHistoryStore.getState().updateDayRecord(dateKey, category, {
        ...(row.payload as Record<string, unknown>),
        hasData: true,
      });
    }
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

/** Delete the archived session or meals that would otherwise restore a removed day. */
export async function purgeArchivedDay(dateKey: string, category: DayLogCategory): Promise<void> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return;

    if (category === 'workout' || category === 'cardio') {
      const { data } = await supabase
        .from('completed_sessions')
        .select('id, title, session_name, activity_type, completed_at, created_at')
        .or(`client_id.eq.${userId},user_id.eq.${userId}`)
        .limit(200);
      const ids = (data || [])
        .filter((row) => {
          const key = localDayKey(row.completed_at) || localDayKey(row.created_at);
          if (key !== dateKey) return false;
          const title = String(row.session_name || row.title || '').toLowerCase();
          const cardio = title.startsWith('cardio') || row.activity_type != null;
          return category === 'cardio' ? cardio : !cardio;
        })
        .map((row) => String(row.id))
        .filter(Boolean);
      if (ids.length > 0) {
        await supabase.from('workout_logs').delete().in('session_id', ids);
        await supabase.from('completed_sessions').delete().in('id', ids);
        await supabase.from('workout_sessions').delete().in('id', ids);
      }
    }

    if (category === 'nutrition') {
      await supabase.from('daily_macros').delete().or(`user_id.eq.${userId},client_id.eq.${userId}`).eq('date', dateKey);
      const { data: meals } = await supabase
        .from('meal_logs')
        .select('id, created_at')
        .or(`user_id.eq.${userId},client_id.eq.${userId}`)
        .limit(400);
      const mealIds = (meals || [])
        .filter((row) => localDayKey(row.created_at) === dateKey && row.id)
        .map((row) => String(row.id));
      if (mealIds.length > 0) {
        await supabase.from('meal_logs').delete().in('id', mealIds);
      }
    }
  } catch (err) {
    console.warn('[DayLog] Archive delete notice:', err);
  }
}
