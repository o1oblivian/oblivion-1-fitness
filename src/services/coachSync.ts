import { supabase } from './supabaseClient';

export function subscribeToCoachDirectives(
  athleteId: string,
  onDirectiveOrRoutineChanged: (payload: any) => void
): () => void {
  const channel = supabase
    .channel(`athlete-coach-pipeline-${athleteId}`)
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
      }
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
      }
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
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
