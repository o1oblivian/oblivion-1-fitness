/**
 * Oblivion 1 Fitness Club - Athlete Realtime Hook
 * Realtime PostgreSQL CDC for dispatched_routines
 * Strict File Ceiling: < 110 lines
 */

import { useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { tactileEngine } from '../../../services/tactileEngine';

interface UseAthleteRealtimeOptions {
  athleteId?: string;
  onProtocolDispatched?: (protocol: any) => void;
}

export function useAthleteRealtime({
  athleteId = 'default-athlete',
  onProtocolDispatched,
}: UseAthleteRealtimeOptions = {}) {
  const showToast = useWorkoutStore((s) => s.showToast);

  useEffect(() => {
    if (!athleteId) return;

    const channel = supabase
      .channel(`athlete-realtime-${athleteId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dispatched_routines',
          filter: `athlete_id=eq.${athleteId}`,
        },
        (payload) => {
          const routine: any = payload.new;
          if (routine) {
            tactileEngine.playPRCelebration();
            showToast?.(`⚡ Coach dispatched routine: ${routine.routine_data?.title || 'New Protocol'}`);
            if (onProtocolDispatched) {
              onProtocolDispatched(routine.routine_data || routine);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dispatched_routines',
          filter: `athlete_id=eq.${athleteId}`,
        },
        (payload) => {
          const routine: any = payload.new;
          if (routine?.status) {
            tactileEngine.triggerSelectionBuzz();
            showToast?.(`⚡ Routine status updated: ${routine.status}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [athleteId, onProtocolDispatched, showToast]);
}
