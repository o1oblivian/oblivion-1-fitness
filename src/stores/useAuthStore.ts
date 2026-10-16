import { create } from 'zustand';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { safeStorage } from '../utils/safeStorage';
import { useUserStore } from './useUserStore';
import { releaseDevice } from '../services/accountScope';
import { getOAuthRedirectTo } from '../services/oauthDeepLink';

export function clearStoredSession(): void {
  safeStorage.removeItem('o1fc_auth_token');
  safeStorage.removeItem('o1fc_user_id');
  safeStorage.removeItem('o1fc_user_email');
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith('sb-') && key.includes('auth-token')) window.localStorage.removeItem(key);
    }
  } catch {
    /* storage unavailable */
  }
}

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
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
  setProfileRole?: (role: 'coach' | 'athlete') => void;
}

export const EMAIL_NOT_CONFIRMED = 'Confirm your email before signing in.';
export const ACCOUNT_EXISTS = 'You already have an account with this email. Enter your password to sign in.';

function parseAuthError(err: AuthError | Error | any): string {
  const msg = err?.message || String(err || '');
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'That email and password don\u2019t match. Try again or reset your password.';
  }
  if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
    return EMAIL_NOT_CONFIRMED;
  }
  if (/already registered|already been registered|user_already_exists/i.test(msg)) {
    return ACCOUNT_EXISTS;
  }
  if (/rate limit|too many|over_email_send_rate_limit|429/i.test(msg)) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  if (/weak_password|password should/i.test(msg)) {
    return 'Choose a stronger password: at least 8 characters, mixing letters and numbers.';
  }
  if (/failed to fetch|network|load failed/i.test(msg)) {
    return 'No connection. Check your internet and try again.';
  }
  return msg || 'Sign-in failed. Please try again.';
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
      if (typeof window !== 'undefined' && localStorage.getItem('o1fc_signed_out_pending') === '1') {
        clearStoredSession();
        set({ user: null, session: null, isAuthenticated: false, isLoading: false });
        return;
      }
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
        useUserStore.getState().setUserId(data.session.user.id);
        if (data.session.user.email) safeStorage.setItem('o1fc_user_email', data.session.user.email);
      } else {
        set({ user: null, session: null, isAuthenticated: false, isLoading: false });
      }

      supabase.auth.onAuthStateChange((event, session) => {
        if (typeof window !== 'undefined' && localStorage.getItem('o1fc_signed_out_pending') === '1') return;
        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
          set({
            user: session.user,
            session,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          safeStorage.setItem('o1fc_user_id', session.user.id);
          useUserStore.getState().setUserId(session.user.id);
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
          useUserStore.getState().setUserId(session.user.id);
          if (session.user.email) safeStorage.setItem('o1fc_user_email', session.user.email);
        } else if (event === 'INITIAL_SESSION' && !session) {
          set({ user: null, session: null, isAuthenticated: false, isLoading: false });
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
        useUserStore.getState().setUserId(data.user.id);
        if (data.user.email) safeStorage.setItem('o1fc_user_email', data.user.email);
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
        options: { emailRedirectTo: getOAuthRedirectTo() },
      });
      if (error) {
        const formatted = parseAuthError(error);
        set({ error: formatted, isLoading: false });
        return { success: false, error: formatted };
      }
      if (data?.user && !data.session && data.user.identities?.length === 0) {
        set({ error: ACCOUNT_EXISTS, isLoading: false });
        return { success: false, error: ACCOUNT_EXISTS };
      }
      if (data?.session && data.user) {
        safeStorage.setItem('o1fc_user_id', data.user.id);
        useUserStore.getState().setUserId(data.user.id);
        if (data.user.email) safeStorage.setItem('o1fc_user_email', data.user.email);
        set({ user: data.user, session: data.session, isAuthenticated: true, isLoading: false, error: null });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: true, needsConfirmation: true };
    } catch (err: any) {
      const formatted = parseAuthError(err);
      set({ error: formatted, isLoading: false });
      return { success: false, error: formatted };
    }
  },

  signOut: async () => {
    try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
    clearStoredSession();
    set({ user: null, session: null, isAuthenticated: false, error: null });
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('o1fc_signed_out'));
    releaseDevice();
  },
}));
