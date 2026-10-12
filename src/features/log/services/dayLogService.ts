import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { useTelemetryHistoryStore } from '../store/useTelemetryHistoryStore';
import { cancelDayLogSync, DayLogCategory, isForgotten } from './dayLogCloud';

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

/** Remove a cloud copy when the athlete deletes that day on Log. */
export async function deleteDayLog(dateKey: string, category: DayLogCategory): Promise<void> {
  cancelDayLogSync(dateKey, category);
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

/** Pull saved day logs onto this device. Signed-out state leaves the local cache as it is. */
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
      }, { skipCloud: true });
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

/** Noon on a YYYY-MM-DD day in local time, so the day survives any timezone round trip. */
export function localNoonIso(dateKey: string): string | undefined {
  const hit = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!hit) return undefined;
  const date = new Date(Number(hit[1]), Number(hit[2]) - 1, Number(hit[3]), 12, 0, 0);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
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
      await supabase.from('meal_logs').delete().eq('user_id', userId).eq('date', dateKey);
      await supabase.from('fuel_days').delete().eq('user_id', userId).eq('date_key', dateKey);
    }
  } catch (err) {
    console.warn('[DayLog] Archive delete notice:', err);
  }
}
