/**
 * Oblivion 1 Fitness Club - Athlete Realtime Hook
 * Live assigned_workouts CDC for the signed-in athlete.
 */

import { useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';

interface UseAthleteRealtimeOptions {
  athleteId?: string;
  onProtocolDispatched?: (protocol: any) => void;
}

export function useAthleteRealtime({
  athleteId = '',
  onProtocolDispatched,
}: UseAthleteRealtimeOptions = {}) {
  const showToast = useWorkoutStore((s) => s.showToast);

  useEffect(() => {
    if (!athleteId) return;

    const handleRow = (payload: any) => {
      const routine: any = payload.new;
      if (!routine) return;
      if (readAthleteSettingsSnapshot().coachUpdates) {
        tactileEngine.playPRCelebration();
        showToast?.(`Coach dispatched: ${routine.title || routine.routine_data?.title || 'New protocol'}`);
      }
      if (onProtocolDispatched) {
        onProtocolDispatched({
          ...routine,
          exercises: routine.exercises || routine.workout_data?.exercises || [],
        });
      }
    };

    const channel = supabase
      .channel(`athlete-assigned-${athleteId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'assigned_workouts', filter: `client_id=eq.${athleteId}` },
        handleRow,
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'assigned_workouts', filter: `athlete_id=eq.${athleteId}` },
        handleRow,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [athleteId, onProtocolDispatched, showToast]);
}
