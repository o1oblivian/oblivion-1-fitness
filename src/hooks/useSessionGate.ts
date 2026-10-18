import { useEffect, useState } from 'react';
import { forgetIdentityKeys, resolveGateStatus, type GateStatus } from '../services/sessionGate';
import { supabase } from '../services/supabaseClient';
import { useUserStore } from '../stores/useUserStore';

/**
 * Live answer to "is a person signed in?", from Supabase and not from local flags.
 * Starts at `checking`, then follows sign-ins and sign-outs, including a login that expires mid-session.
 */
export function useSessionGate(): GateStatus {
  const [status, setStatus] = useState<GateStatus>('checking');

  useEffect(() => {
    let alive = true;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      if (session?.user) {
        setStatus('in');
      } else if (event === 'SIGNED_OUT') {
        forgetIdentityKeys();
        useUserStore.getState().setUserId('');
        setStatus('out');
      }
    });

    void resolveGateStatus().then((next) => {
      if (!alive) return;
      if (next === 'out') useUserStore.getState().setUserId('');
      // A sign-in event that arrived while the first check ran is newer than its answer.
      setStatus((current) => (current === 'checking' ? next : current));
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return status;
}
