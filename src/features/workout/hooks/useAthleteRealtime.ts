/**
 * Oblivion 1 Fitness Club - Athlete Realtime Hook
 * Live assigned_workouts CDC for the signed-in athlete.
 */

import { useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { liveChannel } from '../../../services/realtimeChannel';
import { tactileEngine } from '../../../services/tactileEngine';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';
import type { AssignedWorkoutRow } from '../../../types/coach';

interface UseAthleteRealtimeOptions {
  athleteId?: string;
  onProtocolDispatched?: (protocol: AssignedWorkoutRow) => void;
}

export function useAthleteRealtime({
  athleteId = '',
  onProtocolDispatched,
}: UseAthleteRealtimeOptions = {}) {
  useEffect(() => {
    if (!athleteId) return;

    const handleRow = (payload: { new: AssignedWorkoutRow }) => {
      const routine = payload.new;
      if (!routine?.id) return;
      if (readAthleteSettingsSnapshot().coachUpdates) tactileEngine.triggerSelectionBuzz();
      onProtocolDispatched?.({
        ...routine,
        exercises: routine.exercises || routine.workout_data?.exercises || [],
      });
    };

    const channel = liveChannel(`athlete-assigned-${athleteId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assigned_workouts',
          filter: `client_id=eq.${athleteId}`,
        },
        handleRow,
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assigned_workouts',
          filter: `athlete_id=eq.${athleteId}`,
        },
        handleRow,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [athleteId, onProtocolDispatched]);
}
