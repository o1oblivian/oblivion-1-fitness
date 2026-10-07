import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useUserStore } from '../stores/useUserStore';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('o1fc_user_id') : null;
    if (!stored || stored === 'default-athlete' || stored === 'athlete-c1') return '';
    return stored;
  });
  const [email, setEmail] = useState<string | null>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('o1fc_user_email')) || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function syncProfile(uid: string, uEmail?: string | null) {
      if (!uid) return;
      try {
        const uState = useUserStore.getState();
        const profilePayload = {
          id: uid,
          handle: uState.handle || `@athlete_${uid.slice(0, 6)}`,
          full_name: uState.name || 'Oblivion 1 Athlete',
          avatar_url: uState.avatarUrl || '',
          settings: {
            weightKg: uState.weightKg || 80,
            targetWeightKg: uState.targetWeightKg || 80,
            email: uEmail,
          },
          updated_at: new Date().toISOString(),
        };

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
        localStorage.setItem('o1fc_user_id', uid);
        if (uEmail) localStorage.setItem('o1fc_user_email', uEmail);
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
        localStorage.setItem('o1fc_user_id', uid);
        if (uEmail) localStorage.setItem('o1fc_user_email', uEmail);
        await syncProfile(uid, uEmail);
      } else if (event === 'SIGNED_OUT') {
        setUserId('');
        setEmail(null);
        useUserStore.getState().setUserId('');
        localStorage.removeItem('o1fc_user_id');
        localStorage.removeItem('o1fc_user_email');
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
    localStorage.removeItem('o1fc_user_id');
    localStorage.removeItem('o1fc_user_email');
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
