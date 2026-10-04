import { create } from 'zustand';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { safeStorage } from '../utils/safeStorage';

export interface AuthProfile {
  id?: string;
  role?: 'coach' | 'athlete';
  name?: string;
  email?: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile?: AuthProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
  setProfileRole?: (role: 'coach' | 'athlete') => void;
}

function parseAuthError(err: AuthError | Error | any): string {
  const msg = err?.message || String(err || '');
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Invalid email or password. Please verify your details.';
  }
  if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'Please confirm your email before signing in.';
  }
  return msg || 'Authentication request failed. Please check network connection.';
}

const getStoredRole = (): 'coach' | 'athlete' => {
  const r = safeStorage.getItem('o1fc_active_role') || safeStorage.getItem('o1fc_role');
  return r === 'coach' ? 'coach' : 'athlete';
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: { role: getStoredRole() },
  isAuthenticated: Boolean(safeStorage.getItem('o1fc_user_id')),
  isLoading: true,
  error: null,
  clearError: () => set({ error: null }),
  setProfileRole: (role) => {
    safeStorage.setItem('o1fc_active_role', role);
    set((s) => ({ profile: { ...s.profile, role } }));
  },

  initialize: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        set({
          user: data.session.user,
          session: data.session,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        safeStorage.setItem('o1fc_user_id', data.session.user.id);
        if (data.session.user.email) safeStorage.setItem('o1fc_user_email', data.session.user.email);
      } else {
        const storedUserId = safeStorage.getItem('o1fc_user_id');
        if (!storedUserId) {
          set({ user: null, session: null, isAuthenticated: false, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      }

      supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
          set({
            user: session.user,
            session,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          safeStorage.setItem('o1fc_user_id', session.user.id);
          if (session.user.email) safeStorage.setItem('o1fc_user_email', session.user.email);
        } else if (event === 'SIGNED_OUT') {
          safeStorage.removeItem('o1fc_auth_token');
          safeStorage.removeItem('o1fc_user_id');
          safeStorage.removeItem('o1fc_user_email');
          set({ user: null, session: null, isAuthenticated: false, isLoading: false, error: null });
        } else if (session?.user) {
          set({
            user: session.user,
            session,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          safeStorage.setItem('o1fc_user_id', session.user.id);
          if (session.user.email) safeStorage.setItem('o1fc_user_email', session.user.email);
        } else if (event === 'INITIAL_SESSION' && !session) {
          const storedUserId = safeStorage.getItem('o1fc_user_id');
          if (!storedUserId) {
            set({ user: null, session: null, isAuthenticated: false, isLoading: false });
          }
        }
      });
    } catch (err) {
      console.warn('[useAuthStore] initialize error:', err);
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        const formatted = parseAuthError(error);
        set({ error: formatted, isLoading: false });
        return { success: false, error: formatted };
      }
      if (data?.user) {
        safeStorage.setItem('o1fc_user_id', data.user.id);
        if (data.user.email) safeStorage.setItem('o1fc_user_email', data.user.email);
        safeStorage.setItem('o1fc_onboarding_completed', 'true');
        set({ user: data.user, session: data.session, isAuthenticated: true, isLoading: false, error: null });
        return { success: true };
      }
      return { success: false, error: 'No user session returned.' };
    } catch (err: any) {
      const formatted = parseAuthError(err);
      set({ error: formatted, isLoading: false });
      return { success: false, error: formatted };
    }
  },

  signUp: async (email, password) => {
    set({ isLoading: true, error: null });
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
      });
      if (error) {
        const formatted = parseAuthError(error);
        set({ error: formatted, isLoading: false });
        return { success: false, error: formatted };
      }
      if (data?.session && data.user) {
        safeStorage.setItem('o1fc_user_id', data.user.id);
        if (data.user.email) safeStorage.setItem('o1fc_user_email', data.user.email);
        safeStorage.setItem('o1fc_onboarding_completed', 'true');
        set({ user: data.user, session: data.session, isAuthenticated: true, isLoading: false, error: null });
      } else {
        set({ isLoading: false });
      }
      return { success: true };
    } catch (err: any) {
      const formatted = parseAuthError(err);
      set({ error: formatted, isLoading: false });
      return { success: false, error: formatted };
    }
  },

  signOut: async () => {
    try { await supabase.auth.signOut(); } catch {}
    safeStorage.removeItem('o1fc_auth_token');
    safeStorage.removeItem('o1fc_user_id');
    safeStorage.removeItem('o1fc_user_email');
    set({ user: null, session: null, isAuthenticated: false, error: null });
  },
}));
