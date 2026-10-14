import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useUserStore } from '../stores/useUserStore';
import { releaseDevice } from '../services/accountScope';

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

    async function syncProfile(uid: string, uEmail?: string | null) {
      if (!uid) return;
      try {
        // Only what the athlete actually entered; empty fields are left out so the account copy is never overwritten with placeholders.
        const uState = useUserStore.getState();
        const profilePayload: Record<string, unknown> = { id: uid, updated_at: new Date().toISOString() };
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

        const { error } = await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });
        if (error) {
          console.warn('[AuthContext] profiles upsert notice:', error.message);
        }
      } catch (err) {
        console.warn('[AuthContext] Profile sync exception:', err);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const uid = session.user.id;
        const uEmail = session.user.email || null;
        setUserId(uid);
        setEmail(uEmail);
        useUserStore.getState().setUserId(uid);
        writeIdentity(uid, uEmail);
        syncProfile(uid, uEmail);
      }
      setIsLoading(false);
    }).catch(() => {
      if (mounted) setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const uid = session.user.id;
        const uEmail = session.user.email || null;
        setUserId(uid);
        setEmail(uEmail);
        useUserStore.getState().setUserId(uid);
        writeIdentity(uid, uEmail);
        await syncProfile(uid, uEmail);
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
    try {
      await supabase.auth.signOut();
    } catch {}
    setUserId('');
    setEmail(null);
    useUserStore.getState().setUserId('');
    forgetIdentity();
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

export const useAuth = () => useContext(AuthContext);
