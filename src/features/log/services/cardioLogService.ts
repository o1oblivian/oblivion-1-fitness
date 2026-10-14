import { supabase } from '../../../services/supabaseClient';
import { getCachedUserId } from '../../../services/authUser';
import { enqueueSync, flushSync, registerSyncHandler } from '../../../services/syncOutbox';
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

registerSyncHandler('cardio_session', async (payload, userId) => {
  const { error } = await supabase
    .from('completed_sessions')
    .upsert([{ ...payload, user_id: userId, client_id: userId }], { onConflict: 'id' });
  if (error) console.warn('[CardioService] Backup notice:', error.message);
  return !error;
});

/**
 * Records a cardio log on this phone first, then queues its backup to completed_sessions;
 * the day record itself syncs through athlete_day_logs.
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
  const userId = (await getCachedUserId()) || '';

  const nowIso = new Date().toISOString();
  const todayKey = localDayKey(nowIso);
  const dateKey = entry.dateKey || todayKey;
  const isToday = dateKey === todayKey;
  const happenedAt = isToday ? nowIso : localNoonIso(dateKey) || nowIso;

  const cardioRecord: CardioLogEntry = {
    id: crypto.randomUUID(),
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

  // 2. Queue the completed_sessions backup; it is sent when the account is reachable.
  if (!userId) return;
  const sessionPayload: Record<string, unknown> = {
    id: cardioRecord.id,
    title: `Cardio: ${entry.activityType}`,
    session_name: `Cardio: ${entry.activityType}`,
    tonnage_kg: 0,
    volume_kg: 0,
    total_sets: 1,
    completed_at: happenedAt,
    created_at: happenedAt,
  };
  if (entry.durationMinutes > 0) sessionPayload.duration_seconds = Math.round(entry.durationMinutes * 60);
  enqueueSync('cardio_session', `cardio:${cardioRecord.id}`, dateKey, sessionPayload);
  void flushSync();
}
