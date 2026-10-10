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
    const parsedDuration = sessionData.duration
      ? parseInt(String(sessionData.duration).replace(/[^\d]/g, ''), 10)
      : NaN;
    const durationMins = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 0;
    const durationSeconds = sessionData.duration_seconds && sessionData.duration_seconds > 0
      ? sessionData.duration_seconds
      : durationMins > 0
        ? durationMins * 60
        : 0;
    const tonnage = sessionData.tonnage_kg ?? sessionData.tonnageKg ?? 0;
    const totalSets = sessionData.total_sets ?? sessionData.totalSets ?? 0;
    const nowIso = new Date().toISOString();
    const sessionTitle = sessionData.title || 'Workout';

    const completedSessionPayload: Record<string, unknown> = {
      id: sessionData.id || `session-${Date.now()}`, user_id: userId, client_id: userId, title: sessionTitle,
      session_name: sessionTitle, tonnage_kg: tonnage, volume_kg: tonnage,
      total_sets: totalSets, completed_at: nowIso, created_at: nowIso,
    };
    if (durationSeconds > 0) completedSessionPayload.duration_seconds = durationSeconds;
    if (sessionData.strain != null && sessionData.strain > 0) completedSessionPayload.strain = sessionData.strain;

    const exercises = Array.isArray(sessionData.exercises)
      ? sessionData.exercises as Array<{
        name?: string;
        sets?: Array<{ setNumber?: number; reps?: number; weightKg?: number; weight?: number; rpe?: number; is_pr?: boolean }> | number;
        reps?: number;
        weightKg?: number;
        weight?: number;
        rpe?: number;
      }>
      : [];
    const logRows = exercises.flatMap((ex, exIdx) => {
      const setRows = Array.isArray(ex.sets) ? ex.sets : [];
      const count = setRows.length || Number(ex.sets) || 0;
      return Array.from({ length: count }, (_, sIdx) => {
        const set = setRows[sIdx] || {};
        const reps = Number(set.reps ?? ex.reps ?? 0);
        const weight = Number(set.weightKg ?? set.weight ?? ex.weightKg ?? ex.weight ?? 0);
        return {
          id: `log-${Date.now()}-${exIdx}-${sIdx}-${Math.random().toString(36).slice(2, 7)}`,
          user_id: userId,
          session_id: completedSessionPayload.id,
          exercise_name: ex.name || 'Exercise',
          set_number: Number(set.setNumber || sIdx + 1),
          reps: Number.isFinite(reps) ? reps : 0,
          weight_kg: Number.isFinite(weight) ? weight : 0,
          rpe: Number(set.rpe ?? ex.rpe ?? 0) || 0,
          is_pr: Boolean(set.is_pr),
          created_at: nowIso,
        };
      });
    });
    const prCount = logRows.filter((row) => row.is_pr).length;
    if (prCount > 0) completedSessionPayload.pr_count = prCount;

    let sessionRes = await supabase.from('completed_sessions').insert([completedSessionPayload]);
    if (sessionRes.error && /pr_count/i.test(sessionRes.error.message)) {
      const { pr_count: _count, ...withoutPr } = completedSessionPayload;
      void _count;
      sessionRes = await supabase.from('completed_sessions').insert([withoutPr]);
    }
    if (sessionRes.error) {
      console.error('[Supabase] completed_sessions insert failed:', sessionRes.error);
      return false;
    }
    if (logRows.length > 0) {
      let logsRes = await supabase.from('workout_logs').insert(logRows);
      if (logsRes.error && /is_pr/i.test(logsRes.error.message)) {
        logsRes = await supabase.from('workout_logs').insert(logRows.map(({ is_pr: _flag, ...row }) => row));
      }
      if (logsRes.error) {
        console.error('[Supabase] workout_logs insert failed:', logsRes.error);
        return false;
      }
    }
    const { pr_count: omittedPrCount, ...sessionRow } = completedSessionPayload;
    void omittedPrCount;
    const sessionsRes = await supabase.from('workout_sessions').insert([{ ...sessionRow, exercises: sessionData.exercises || [] }]);
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
