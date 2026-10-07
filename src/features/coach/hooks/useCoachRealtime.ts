/**
 * Oblivion 1 Fitness Club - Coach Realtime Hook
 * Realtime PostgreSQL CDC for coach_clients and workout_completions
 * Strict File Ceiling: < 120 lines
 */

import { useEffect, useMemo } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { useCoachStore } from '../../../stores/useCoachStore';
import { tactileEngine } from '../../../services/tactileEngine';

const isValidUuid = (val?: string | null): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export function useCoachRealtime(coachId: string = '') {
  const athletes = useCoachStore((s) => s.athletes);
  const finishNotifications = useCoachStore((s) => s.finishNotifications);
  const finishedWorkouts = useCoachStore((s) => s.finishedWorkouts);
  const recordFinishedWorkout = useCoachStore((s) => s.recordFinishedWorkout);

  useEffect(() => {
    if (!coachId || !isValidUuid(coachId)) return;

    const channel = supabase
      .channel(`coach-realtime-${coachId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_clients',
          filter: `coach_id=eq.${coachId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const data: any = payload.new;
            tactileEngine.triggerSelectionBuzz();
            useCoachStore.setState((state) => ({
              athletes: state.athletes.map((a) =>
                a.id === data.athlete_id
                  ? { ...a, status: data.status || a.status, lastActive: 'Just now' }
                  : a
              ),
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workout_completions',
          filter: `coach_id=eq.${coachId}`,
        },
        (payload) => {
          const comp: any = payload.new;
          if (comp) {
            tactileEngine.playPRCelebration();
            const summary = comp.metrics_summary || {};
            recordFinishedWorkout({
              id: comp.id,
              athleteId: comp.athlete_id,
              athleteName: summary.athleteName || 'Athlete',
              title: summary.title || 'Completed Protocol',
              tonnageKg: Number(summary.tonnageKg || 0),
              totalSets: Number(summary.totalSets || 12),
              totalReps: Number(summary.totalReps || 96),
              avgRpe: Number(summary.avgRpe || 8.5),
              durationMinutes: Number(summary.durationMinutes || summary.durationMins || 45),
              completedAt: comp.submitted_at || new Date().toISOString(),
              exercises: summary.exercises || [],
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coachId, recordFinishedWorkout]);

  const stats = useMemo(() => {
    const unreadInbox = finishNotifications.filter((n) => !n.read).length;
    const activeClients = athletes.filter((a) => a.status?.toLowerCase().includes('active')).length;
    const needsReview = athletes.filter((a) => a.needsReview).length + unreadInbox;
    return {
      intelCount: athletes.length,
      inboxCount: unreadInbox,
      clientsCount: activeClients || athletes.length,
      needsReviewCount: needsReview,
      totalCompletions: finishedWorkouts.length,
    };
  }, [athletes, finishNotifications, finishedWorkouts]);

  return stats;
}
