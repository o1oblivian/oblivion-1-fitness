/**
 * Supabase Client & Telemetry Sync Service
 * Safe initialization guard with defensive env checks.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface WorkoutSessionPayload {
  id?: string; user_id?: string; title?: string; duration?: string; duration_seconds?: number;
  strain?: number; tonnage_kg?: number; total_sets?: number; exercises?: any; created_at?: string; [key: string]: any;
}

export interface AthleteProfile {
  id: string; handle?: string; full_name?: string; bio?: string; avatar_url?: string; settings?: Record<string, any>; updated_at?: string;
}

export const PROD_SUPABASE_URL = 'https://qkfvepjeyreicqomatyt.supabase.co';
export const PROD_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZnZlcGpleXJlaWNxb21hdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MTgxMTUsImV4cCI6MjEwMzI5NDExNX0.mHwZdAANv_Ii4t-oKyz--EeQR64A0lVhUgqtuOfNXpA';

function getSafeEnv(key: string): string {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.[key]) return (import.meta as any).env[key];
    if (typeof process !== 'undefined' && process?.env?.[key]) return process.env[key]!;
  } catch {}
  return '';
}

const envUrl = import.meta.env.VITE_SUPABASE_URL || getSafeEnv('VITE_SUPABASE_URL');
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || getSafeEnv('VITE_SUPABASE_ANON_KEY');

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY at startup.');
}

// Hardwire production Supabase credentials as default fallbacks
export const SUPABASE_URL = (envUrl && envUrl.startsWith('http') && !envUrl.includes('placeholder')) ? envUrl : PROD_SUPABASE_URL;
export const SUPABASE_ANON_KEY = (envKey && !envKey.includes('placeholder')) ? envKey : PROD_SUPABASE_ANON_KEY;
export const SUPABASE_AUTH_URL = `${SUPABASE_URL}/auth/v1`;

function hasSubtleCrypto(): boolean {
  try {
    return typeof window !== 'undefined' && Boolean(window.crypto && window.crypto.subtle);
  } catch {
    return false;
  }
}

const insecureOrigin = typeof window !== 'undefined' && !hasSubtleCrypto();

type ExtendedSupabaseClient = SupabaseClient & {
  insert: (table: string, payload: any) => Promise<{ data: any; error: any }>;
  selectOne: (table: string, queryParam: string) => Promise<{ data: any; error: any }>;
};

const authOptions = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: (insecureOrigin ? 'implicit' : 'pkce') as 'implicit' | 'pkce',
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
};

export const supabaseAuthOptions = authOptions;

let rawClient: SupabaseClient;
try {
  rawClient = createClient(
    import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY,
    {
      auth: authOptions,
    }
  );
} catch (e) {
  console.warn('[Supabase Safe Guard] Initialization notice:', e);
  rawClient = createClient(PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  });
}

export const supabase: ExtendedSupabaseClient = Object.assign(rawClient, {
  insert: async (table: string, payload: any) => {
    try {
      const { data, error } = await rawClient.from(table).insert(payload).select();
      return { data, error };
    } catch (err) { return { data: null, error: err }; }
  },
  selectOne: async (table: string, queryParam: string) => {
    try {
      const { data, error } = await rawClient.from(table).select('*').limit(1);
      return { data: data?.[0] || null, error };
    } catch (err) { return { data: null, error: err }; }
  },
});

export async function syncSessionToSupabase(sessionData: WorkoutSessionPayload): Promise<boolean> {
  try {
    const { data: authData } = await rawClient.auth.getUser();
    const userId = sessionData.user_id || authData?.user?.id;
    if (!userId || userId === 'default-athlete' || userId === 'athlete-c1') return false;
    const durationMins = parseInt(sessionData.duration?.replace('m', '') || '45', 10);
    const durationSeconds = sessionData.duration_seconds || durationMins * 60;
    const tonnage = sessionData.tonnage_kg ?? sessionData.tonnageKg ?? 0;
    const totalSets = sessionData.total_sets ?? sessionData.totalSets ?? 0;
    const nowIso = new Date().toISOString();
    const sessionTitle = sessionData.title || 'Gym Protocol';

    const completedSessionPayload = {
      id: sessionData.id || `session-${Date.now()}`, user_id: userId, client_id: userId, title: sessionTitle,
      session_name: sessionTitle, duration_seconds: durationSeconds, tonnage_kg: tonnage, volume_kg: tonnage,
      total_sets: totalSets, strain: sessionData.strain || 14.5, completed_at: nowIso, created_at: nowIso,
    };

    const sessionRes = await supabase.from('completed_sessions').insert([completedSessionPayload]);
    if (sessionRes.error) {
      console.error('[Supabase] completed_sessions insert failed:', sessionRes.error);
      return false;
    }
    if (Array.isArray(sessionData.exercises) && sessionData.exercises.length > 0) {
      const logRows = sessionData.exercises.flatMap((ex: any) => {
        const setRows = Array.isArray(ex.sets) ? ex.sets : [];
        const count = setRows.length || Number(ex.sets) || 1;
        return Array.from({ length: count }, (_, sIdx) => {
          const set = setRows[sIdx] || {};
          return {
            id: `log-${Date.now()}-${sIdx}-${Math.random().toString(36).slice(2, 7)}`,
            user_id: userId,
            session_id: completedSessionPayload.id,
            exercise_name: ex.name || 'Exercise',
            set_number: Number(set.setNumber || sIdx + 1),
            reps: Number(set.reps ?? ex.reps ?? 0),
            weight_kg: Number(set.weightKg ?? set.weight ?? ex.weightKg ?? ex.weight ?? 0),
            rpe: Number(set.rpe ?? ex.rpe ?? 0),
            created_at: new Date().toISOString(),
          };
        });
      });
      const logsRes = await supabase.from('workout_logs').insert(logRows);
      if (logsRes.error) {
        console.error('[Supabase] workout_logs insert failed:', logsRes.error);
        return false;
      }
    }
    const sessionsRes = await supabase.from('workout_sessions').insert([{ ...completedSessionPayload, exercises: sessionData.exercises || [] }]);
    if (sessionsRes.error) {
      console.error('[Supabase] workout_sessions insert failed:', sessionsRes.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Exception while archiving session:', err);
    return false;
  }
}

export async function fetchAthleteProfile(userId?: string): Promise<AthleteProfile | null> {
  try {
    const uid = userId || (await rawClient.auth.getUser()).data.user?.id;
    if (!uid) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    return error ? null : (data as AthleteProfile | null);
  } catch { return null; }
}
