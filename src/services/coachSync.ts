import { supabase } from './supabaseClient';
import { liveChannel } from './realtimeChannel';
import type { AssignedWorkoutRow } from '../types/coach';

export interface CoachDirectivePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  new: AssignedWorkoutRow;
}

export function subscribeToCoachDirectives(
  athleteId: string,
  onDirectiveOrRoutineChanged: (payload: CoachDirectivePayload) => void,
): () => void {
  const channel = liveChannel(`athlete-coach-pipeline-${athleteId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'assigned_workouts',
        filter: `athlete_id=eq.${athleteId}`,
      },
      (payload) => {
        onDirectiveOrRoutineChanged(payload);
      },
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'assigned_workouts',
        filter: `client_id=eq.${athleteId}`,
      },
      (payload) => {
        onDirectiveOrRoutineChanged(payload);
      },
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'coach_clients',
        filter: `client_id=eq.${athleteId}`,
      },
      (payload) => {
        onDirectiveOrRoutineChanged(payload);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
