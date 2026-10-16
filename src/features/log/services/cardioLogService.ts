import { supabase } from '../../../services/supabaseClient';
import { getCachedUserId } from '../../../services/authUser';
import { enqueueSync, flushSync, registerSyncHandler } from '../../../services/syncOutbox';
import { useTelemetryHistoryStore, type CardioDayRecord } from '../store/useTelemetryHistoryStore';
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

type CardioSession = Omit<CardioDayRecord, 'hasData' | 'zone2Minutes'> & { zone2Minutes?: number };

/** Adds a session to what the day already holds, so a second cardio log never replaces the first. */
export function addCardioSession(base: CardioDayRecord | undefined, add: CardioSession): CardioDayRecord {
  if (!base?.hasData) return { hasData: true, zone2Minutes: 0, ...add, steps: add.steps && add.steps > 0 ? add.steps : undefined };
  const minutes = (base.durationMinutes || 0) + (add.durationMinutes || 0);
  const hrWeight = (hr: number, mins: number) => (hr > 0 ? hr * (mins || 1) : 0);
  const hrMinutes = (base.avgHeartRateBpm > 0 ? base.durationMinutes || 1 : 0) + (add.avgHeartRateBpm > 0 ? add.durationMinutes || 1 : 0);
  const steps = (base.steps || 0) + (add.steps || 0);
  const types = [base.activityType, add.activityType].map((t) => (t || '').trim()).filter((t, i, all) => t && all.indexOf(t) === i);
  return {
    hasData: true,
    distanceKm: Math.round(((base.distanceKm || 0) + (add.distanceKm || 0)) * 100) / 100,
    durationMinutes: minutes,
    burnedKcal: (base.burnedKcal || 0) + (add.burnedKcal || 0),
    avgHeartRateBpm: hrMinutes > 0 ? Math.round((hrWeight(base.avgHeartRateBpm, base.durationMinutes) + hrWeight(add.avgHeartRateBpm, add.durationMinutes)) / hrMinutes) : 0,
    zone2Minutes: (base.zone2Minutes || 0) + (add.zone2Minutes || 0),
    activityType: types.join(' + '),
    steps: steps > 0 ? steps : undefined,
  };
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
    const history = useTelemetryHistoryStore.getState();
    const day = addCardioSession(history.historyByDate[dateKey]?.cardio, {
      activityType: entry.activityType,
      distanceKm: entry.distanceKm,
      durationMinutes: entry.durationMinutes,
      burnedKcal: entry.burnedKcal,
      avgHeartRateBpm: entry.avgHeartRateBpm && entry.avgHeartRateBpm > 0 ? entry.avgHeartRateBpm : 0,
      steps: entry.steps,
    });
    history.updateDayRecord(dateKey, 'cardio', day);

    if (isToday) {
      useLogStore.getState().updateSubModule('cardio', {
        activityType: day.activityType,
        distanceKm: day.distanceKm,
        durationMinutes: day.durationMinutes,
        burnedKcal: day.burnedKcal,
        avgHeartRateBpm: day.avgHeartRateBpm,
        zone2Minutes: day.zone2Minutes,
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
    activity_type: entry.activityType || 'cardio',
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
