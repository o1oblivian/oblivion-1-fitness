import { supabase } from '../../../services/supabaseClient';
import { useTelemetryHistoryStore } from '../store/useTelemetryHistoryStore';
import { useLogStore, PastWorkoutSession } from '../../../stores/useLogStore';

/**
 * Hydrates completed strength and cardio workout history directly from
 * Supabase completed_sessions (client_id / user_id = auth.uid()).
 */
export async function hydrateSessionsFromSupabase(): Promise<void> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId =
      authData?.user?.id ||
      (typeof window !== 'undefined' && localStorage.getItem('o1fc_user_id')) ||
      'default-athlete';

    let res = await supabase
      .from('completed_sessions')
      .select('*')
      .or(`client_id.eq.${userId},user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(30);

    if (res.error) {
      res = await supabase
        .from('completed_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
    }

    const data = res.data;
    if (!Array.isArray(data) || data.length === 0) return;

    const strengthSessions: PastWorkoutSession[] = [];

    for (const row of data) {
      const completedAt = row.completed_at || row.created_at;
      const dateKey = completedAt ? completedAt.slice(0, 10) : '';
      const sessionTitle = row.session_name || row.title || 'Workout Session';
      const durSeconds = Number(row.duration_seconds) || 2700;
      const durMinutes = Math.round(durSeconds / 60);
      const rawTonnage = Number(row.volume_kg ?? row.tonnage_kg ?? row.tonnage) || 0;
      const totalSets = Number(row.total_sets || row.sets_count) || 0;

      const isCardio =
        sessionTitle.toLowerCase().startsWith('cardio') ||
        row.activity_type != null ||
        (rawTonnage === 0 && durMinutes > 0 && totalSets <= 1);

      if (isCardio) {
        const distMatch = sessionTitle.match(/([\d.]+)\s*km/i);
        const calMatch = sessionTitle.match(/(\d+)\s*kcal/i);
        const dist = distMatch ? parseFloat(distMatch[1]) : Number(row.distance_km || row.distance) || Number((durMinutes * 0.12).toFixed(1));
        const cals = calMatch ? parseInt(calMatch[1], 10) : Number(row.burned_kcal || row.calories) || Math.round(durMinutes * 7.5);
        const actType = row.activity_type || sessionTitle.replace(/^Cardio:\s*/i, '').split('(')[0].trim() || 'Cardio Protocol';

        if (dateKey) {
          useTelemetryHistoryStore.getState().updateDayRecord(dateKey, 'cardio', {
            hasData: true,
            distanceKm: dist,
            durationMinutes: durMinutes,
            burnedKcal: cals,
            avgHeartRateBpm: Number(row.avg_heart_rate || row.avg_hr) || 138,
            zone2Minutes: Math.round(durMinutes * 0.75),
            activityType: actType,
          });
        }
      } else {
        if (dateKey) {
          useTelemetryHistoryStore.getState().updateDayRecord(dateKey, 'workout', {
            hasData: true,
            tonnageKg: rawTonnage,
            completedSets: totalSets,
            durationMinutes: durMinutes,
            routineName: sessionTitle,
            intensityRpe: Number(row.strain) || 8.5,
          });
        }

        strengthSessions.push({
          id: row.id || `session-${Math.random()}`,
          title: sessionTitle,
          timestamp: completedAt ? new Date(completedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent',
          duration: `${durMinutes}m`,
          tonnageKg: rawTonnage,
          totalSets,
          strain: Number(row.strain) || 14.5,
          exercises: [],
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
