import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { useTelemetryHistoryStore } from '../store/useTelemetryHistoryStore';
import { useLogStore } from '../../../stores/useLogStore';
import { localDayKey, localNoonIso } from './dayLogService';

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
 * completed_sessions; the day record itself syncs through athlete_day_logs.
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
  const todayKey = localDayKey(nowIso);
  const dateKey = entry.dateKey || todayKey;
  const isToday = dateKey === todayKey;
  const happenedAt = isToday ? nowIso : localNoonIso(dateKey) || nowIso;

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
    timestamp: happenedAt,
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

    if (isToday) {
      useLogStore.getState().updateSubModule('cardio', {
        activityType: entry.activityType,
        distanceKm: entry.distanceKm,
        durationMinutes: entry.durationMinutes,
        burnedKcal: entry.burnedKcal,
        avgHeartRateBpm: entry.avgHeartRateBpm && entry.avgHeartRateBpm > 0 ? entry.avgHeartRateBpm : 0,
        zone2Minutes: 0,
      });
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
      completed_at: happenedAt,
      created_at: happenedAt,
    };
    if (entry.durationMinutes > 0) sessionPayload.duration_seconds = Math.round(entry.durationMinutes * 60);

    const { error } = await supabase.from('completed_sessions').insert([sessionPayload]);
    if (error) console.warn('[CardioService] Supabase sync notice:', error.message);
  } catch (err) {
    console.warn('[CardioService] Supabase sync notice:', err);
  }
}
