import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { useTelemetryHistoryStore } from '../store/useTelemetryHistoryStore';
import { useLogStore, PastWorkoutSession } from '../../../stores/useLogStore';
import { exerciseFromSets } from '../liftLedger';
import { isForgotten, localDayKey } from './dayLogService';

/**
 * Hydrates completed strength and cardio workout history directly from
 * Supabase completed_sessions (client_id / user_id = auth.uid()).
 */
export async function hydrateSessionsFromSupabase(): Promise<void> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return;

    let res = await supabase
      .from('completed_sessions')
      .select('*')
      .or(`client_id.eq.${userId},user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(120);

    if (res.error) {
      res = await supabase
        .from('completed_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(120);
    }

    const data = res.data;
    if (!Array.isArray(data) || data.length === 0) return;

    const strengthSessions: PastWorkoutSession[] = [];
    const strengthDays: Array<{ id: string; dateKey: string }> = [];

    for (const row of data) {
      const completedAt = row.completed_at || row.created_at;
      const dateKey = localDayKey(completedAt);
      const sessionTitle = row.session_name || row.title || 'Workout Session';
      const rawSeconds = Number(row.duration_seconds);
      const durMinutes = Number.isFinite(rawSeconds) && rawSeconds > 0 ? Math.round(rawSeconds / 60) : 0;
      const rawTonnage = Number(row.volume_kg ?? row.tonnage_kg ?? row.tonnage) || 0;
      const totalSets = Number(row.total_sets || row.sets_count) || 0;
      const heartRate = Number(row.avg_heart_rate || row.avg_hr) || 0;
      const loggedRpe = Number(row.avg_rpe ?? row.rpe) || 0;

      const isCardio =
        sessionTitle.toLowerCase().startsWith('cardio') ||
        row.activity_type != null;

      if (isCardio) {
        const distMatch = sessionTitle.match(/([\d.]+)\s*km/i);
        const calMatch = sessionTitle.match(/(\d+)\s*kcal/i);
        const dist = distMatch ? parseFloat(distMatch[1]) : Number(row.distance_km || row.distance) || 0;
        const cals = calMatch ? parseInt(calMatch[1], 10) : Number(row.burned_kcal || row.calories) || 0;
        const actType = row.activity_type || sessionTitle.replace(/^Cardio:\s*/i, '').split('(')[0].trim() || 'Cardio';

        if (dateKey && !isForgotten(dateKey, 'cardio')) {
          useTelemetryHistoryStore.getState().updateDayRecord(dateKey, 'cardio', {
            hasData: true,
            distanceKm: dist,
            durationMinutes: durMinutes,
            burnedKcal: cals,
            avgHeartRateBpm: heartRate,
            zone2Minutes: 0,
            activityType: actType,
          });
        }
      } else {
        if (dateKey && !isForgotten(dateKey, 'workout')) {
          if (row.id) strengthDays.push({ id: String(row.id), dateKey });
          useTelemetryHistoryStore.getState().updateDayRecord(dateKey, 'workout', {
            hasData: true,
            tonnageKg: rawTonnage,
            completedSets: totalSets,
            durationMinutes: durMinutes,
            routineName: sessionTitle,
            intensityRpe: loggedRpe,
          });
        }

        strengthSessions.push({
          id: row.id || `session-${Date.now()}`,
          title: sessionTitle,
          timestamp: completedAt ? new Date(completedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent',
          duration: durMinutes > 0 ? `${durMinutes}m` : '--',
          tonnageKg: rawTonnage,
          totalSets,
          strain: Number(row.strain) || 0,
          exercises: [],
        });
      }
    }

    if (strengthDays.length > 0) {
      const { data: logs } = await supabase
        .from('workout_logs')
        .select('session_id, exercise_name, set_number, reps, weight_kg')
        .in('session_id', strengthDays.map((day) => day.id))
        .limit(800);
      if (Array.isArray(logs) && logs.length > 0) {
        const bySession = new Map<string, Map<string, Array<{ setNumber: number; reps: number; weightKg: number }>>>();
        logs.forEach((row) => {
          const sessionId = String(row.session_id || '');
          const name = String(row.exercise_name || 'Exercise');
          if (!sessionId) return;
          const lifts = bySession.get(sessionId) || new Map<string, Array<{ setNumber: number; reps: number; weightKg: number }>>();
          const sets = lifts.get(name) || [];
          sets.push({
            setNumber: Number(row.set_number) || sets.length + 1,
            reps: Number(row.reps) || 0,
            weightKg: Number(row.weight_kg) || 0,
          });
          lifts.set(name, sets);
          bySession.set(sessionId, lifts);
        });
        strengthDays.forEach((day) => {
          const lifts = bySession.get(day.id);
          if (!lifts || isForgotten(day.dateKey, 'workout')) return;
          const local = useTelemetryHistoryStore.getState().historyByDate[day.dateKey]?.workout?.exercises || [];
          if (local.some((lift) => (lift.setLog?.length || 0) > 0)) return;
          const exercises = [...lifts.entries()].map(([name, sets]) => exerciseFromSets(
            name,
            [...sets].sort((a, b) => a.setNumber - b.setNumber).map((set) => ({ reps: set.reps, weightKg: set.weightKg })),
          ));
          if (exercises.length === 0) return;
          useTelemetryHistoryStore.getState().updateDayRecord(day.dateKey, 'workout', {
            hasData: true,
            exercises,
            completedSets: exercises.reduce((sum, lift) => sum + lift.sets, 0),
          });
        });
      }
    }

    if (strengthSessions.length > 0) {
      useLogStore.getState().setRecentSessions(strengthSessions.slice(0, 15));
    }
  } catch (err) {
    console.warn('[SessionHydration] Query notice:', err);
  }
}
