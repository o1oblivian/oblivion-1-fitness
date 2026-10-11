import { useEffect } from 'react';
import { hydrateSessionsFromSupabase } from '../services/sessionHydrationService';
import { hydrateMacrosFromSupabase } from '../services/macroHydrationService';
import { hydrateDayLogs } from '../services/dayLogService';

/**
 * Custom hook to execute unified Log Tab Supabase hydration on mount.
 * Pulls completed sessions (cardio + strength) and 7-day nutritional totals.
 */
export function useLogHydration(): void {
  useEffect(() => {
    void Promise.allSettled([
      hydrateSessionsFromSupabase(),
      hydrateMacrosFromSupabase(),
      hydrateDayLogs(),
    ]);
  }, []);
}
