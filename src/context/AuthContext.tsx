import React, { createContext, useEffect, useState } from 'react';
import { fetchAthleteProfile, supabase } from '../services/supabaseClient';
import { useUserStore } from '../stores/useUserStore';
import { releaseDevice } from '../services/accountScope';
import { withdrawBuddyCardForSignOut } from '../services/buddyPresenceSync';

interface AuthContextType {
  userId: string;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  userId: '',
  email: null,
  isAuthenticated: false,
  isLoading: true,
  signOut: async () => {},
});

/** Private browsing and full storage throw on access; identity then lives in memory only. */
function readKey(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function writeIdentity(uid: string, uEmail: string | null): void {
  try {
    localStorage.setItem('o1fc_user_id', uid);
    if (uEmail) localStorage.setItem('o1fc_user_email', uEmail);
  } catch {
    /* storage unavailable */
  }
}

function forgetIdentity(): void {
  try {
    localStorage.removeItem('o1fc_user_id');
    localStorage.removeItem('o1fc_user_email');
  } catch {
    /* storage unavailable */
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string>(() => {
    const stored = readKey('o1fc_user_id');
    if (!stored || stored === 'default-athlete' || stored === 'athlete-c1') return '';
    return stored;
  });
  const [email, setEmail] = useState<string | null>(() => readKey('o1fc_user_email') || null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function hydrateProfile(uid: string) {
      const row = await fetchAthleteProfile(uid);
      if (!row) return;
      const local = useUserStore.getState();
      const name = !local.name && row.full_name ? row.full_name.trim() : '';
      const handle = !local.handle && row.handle ? row.handle.trim() : '';
      const avatarUrl = !local.avatarUrl && row.avatar_url ? row.avatar_url : '';
      if (name || handle || avatarUrl) {
        useUserStore.getState().updateProfile({
          ...(name ? { name } : {}),
          ...(handle ? { handle } : {}),
          ...(avatarUrl ? { avatarUrl } : {}),
        });
      }
      if (name) {
        try {
          const key = 'o1fc_production_settings_v3';
          const cached = JSON.parse(localStorage.getItem(key) || '{}') as Record<string, unknown>;
          if (!cached.name) localStorage.setItem(key, JSON.stringify({ ...cached, name }));
        } catch {
          /* settings cache stays as it is */
        }
      }
    }

    async function syncProfile(uid: string, uEmail?: string | null) {
      if (!uid) return;
      try {
        // Only what the athlete actually entered; empty fields are left out so the account copy is never overwritten with placeholders.
        const uState = useUserStore.getState();
        const profilePayload: Record<string, unknown> = {
          id: uid,
          updated_at: new Date().toISOString(),
        };
        if (uState.handle) profilePayload.handle = uState.handle;
        if (uState.name) profilePayload.full_name = uState.name;
        if (uState.avatarUrl) profilePayload.avatar_url = uState.avatarUrl;
        if (uState.weightKg > 0) {
          profilePayload.settings = {
            weightKg: uState.weightKg,
            ...(uState.targetWeightKg > 0 ? { targetWeightKg: uState.targetWeightKg } : {}),
            email: uEmail,
          };
        }

        const { error } = await supabase
          .from('profiles')
          .upsert(profilePayload, { onConflict: 'id' });
        if (error) {
          console.warn('[AuthContext] profiles upsert notice:', error.message);
        }
      } catch (err) {
        console.warn('[AuthContext] Profile sync exception:', err);
      }
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        if (session?.user) {
          const uid = session.user.id;
          const uEmail = session.user.email || null;
          setUserId(uid);
          setEmail(uEmail);
          useUserStore.getState().setUserId(uid);
          writeIdentity(uid, uEmail);
          syncProfile(uid, uEmail);
          void hydrateProfile(uid);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (mounted) setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const uid = session.user.id;
        const uEmail = session.user.email || null;
        setUserId(uid);
        setEmail(uEmail);
        useUserStore.getState().setUserId(uid);
        writeIdentity(uid, uEmail);
        await syncProfile(uid, uEmail);
        await hydrateProfile(uid);
      } else if (event === 'SIGNED_OUT') {
        setUserId('');
        setEmail(null);
        useUserStore.getState().setUserId('');
        forgetIdentity();
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await withdrawBuddyCardForSignOut();
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {}
    setUserId('');
    setEmail(null);
    useUserStore.getState().setUserId('');
    forgetIdentity();
    try {
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith('sb-') && key.includes('auth-token'))
          window.localStorage.removeItem(key);
      }
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new CustomEvent('o1fc_signed_out'));
    releaseDevice();
  };

  return (
    <AuthContext.Provider
      value={{
        userId,
        email,
        isAuthenticated: Boolean(userId),
        isLoading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
