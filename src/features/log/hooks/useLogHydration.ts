import { useEffect } from 'react';
import { hydrateSessionsFromSupabase } from '../services/sessionHydrationService';
import { hydrateMacrosFromSupabase } from '../services/macroHydrationService';

/**
 * Custom hook to execute unified Log Tab Supabase hydration on mount.
 * Pulls completed sessions (cardio + strength) and 7-day nutritional totals.
 */
export function useLogHydration(): void {
  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      await Promise.allSettled([
        hydrateSessionsFromSupabase(),
        hydrateMacrosFromSupabase(),
      ]);
    }

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);
}
