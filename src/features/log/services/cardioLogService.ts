import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { useTelemetryHistoryStore } from '../store/useTelemetryHistoryStore';
import { useLogStore } from '../../../stores/useLogStore';
import { syncDailyStepsToSupabase } from './userTelemetryService';

export interface CardioLogEntry {
  id: string;
  userId: string;
  activityType: string;
  distanceKm: number;
  durationMinutes: number;
  burnedKcal: number;
  avgHeartRateBpm?: number;
  steps?: number;
  dateKey: string;
  timestamp: string;
}

/**
 * Records a cardio log in today's telemetry and syncs it to Supabase
 * completed_sessions and cardio_logs.
 */
export async function persistCardioLog(entry: {
  activityType: string;
  distanceKm: number;
  durationMinutes: number;
  burnedKcal: number;
  avgHeartRateBpm?: number;
  steps?: number;
  dateKey?: string;
}): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return;

  const nowIso = new Date().toISOString();
  const dateKey =
    entry.dateKey ||
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(
      new Date().getDate()
    ).padStart(2, '0')}`;

  const cardioRecord: CardioLogEntry = {
    id: `cardio-${Date.now()}`,
    userId,
    activityType: entry.activityType,
    distanceKm: entry.distanceKm,
    durationMinutes: entry.durationMinutes,
    burnedKcal: entry.burnedKcal,
    avgHeartRateBpm: entry.avgHeartRateBpm && entry.avgHeartRateBpm > 0 ? entry.avgHeartRateBpm : undefined,
    steps: entry.steps,
    dateKey,
    timestamp: nowIso,
  };

  // 1. Reactively update in-memory stores for immediate UI reflection
  try {
    useTelemetryHistoryStore.getState().updateDayRecord(dateKey, 'cardio', {
      hasData: true,
      activityType: entry.activityType,
      distanceKm: entry.distanceKm,
      durationMinutes: entry.durationMinutes,
      burnedKcal: entry.burnedKcal,
      avgHeartRateBpm: entry.avgHeartRateBpm && entry.avgHeartRateBpm > 0 ? entry.avgHeartRateBpm : 0,
      zone2Minutes: 0,
    });

    useLogStore.getState().updateSubModule('cardio', {
      activityType: entry.activityType,
      distanceKm: entry.distanceKm,
      durationMinutes: entry.durationMinutes,
      burnedKcal: entry.burnedKcal,
      avgHeartRateBpm: entry.avgHeartRateBpm && entry.avgHeartRateBpm > 0 ? entry.avgHeartRateBpm : 0,
      zone2Minutes: 0,
    });

    if (entry.steps && entry.steps > 0) {
      syncDailyStepsToSupabase(entry.steps);
    }
  } catch (storeErr) {
    console.warn('[CardioService] Store update notice:', storeErr);
  }

  // 2. Map properly into completed_sessions on Supabase
  try {
    const sessionPayload: Record<string, unknown> = {
      id: cardioRecord.id,
      user_id: userId,
      client_id: userId,
      title: `Cardio: ${entry.activityType}`,
      session_name: `Cardio: ${entry.activityType}`,
      tonnage_kg: 0,
      volume_kg: 0,
      total_sets: 1,
      completed_at: nowIso,
      created_at: nowIso,
    };
    if (entry.durationMinutes > 0) sessionPayload.duration_seconds = Math.round(entry.durationMinutes * 60);

    const heartRate = entry.avgHeartRateBpm && entry.avgHeartRateBpm > 0 ? entry.avgHeartRateBpm : null;
    await Promise.allSettled([
      supabase.from('completed_sessions').insert([sessionPayload]),
      supabase.from('cardio_logs').insert([{
        id: cardioRecord.id,
        user_id: userId,
        activity_type: entry.activityType,
        distance_km: entry.distanceKm,
        duration_minutes: entry.durationMinutes,
        burned_kcal: entry.burnedKcal,
        avg_heart_rate_bpm: heartRate,
        steps: entry.steps || 0,
        created_at: nowIso,
      }]),
    ]);
  } catch (err) {
    console.warn('[CardioService] Supabase sync notice:', err);
  }
}
