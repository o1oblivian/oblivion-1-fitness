/**
 * Supabase Client & Telemetry Sync Service
 * Safe initialization guard with defensive env checks.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { buildArchiveRows } from './archiveRows';

export interface WorkoutSessionPayload {
  id?: string;
  user_id?: string;
  title?: string;
  duration?: string;
  duration_seconds?: number;
  strain?: number;
  tonnage_kg?: number;
  total_sets?: number;
  exercises?: unknown;
  created_at?: string;
  /** When the session happened. Defaults to now; past-day entries pass their own day. */
  completed_at?: string;
  [key: string]: unknown;
}

export interface AthleteProfile {
  id: string;
  handle?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  settings?: Record<string, unknown>;
  updated_at?: string;
}

const PROD_SUPABASE_URL = 'https://qkfvepjeyreicqomatyt.supabase.co';
const PROD_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZnZlcGpleXJlaWNxb21hdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MTgxMTUsImV4cCI6MjEwMzI5NDExNX0.mHwZdAANv_Ii4t-oKyz--EeQR64A0lVhUgqtuOfNXpA';

function getSafeEnv(key: string): string {
  try {
    const metaEnv =
      typeof import.meta !== 'undefined'
        ? (import.meta.env as Record<string, string | undefined>)
        : undefined;
    const fromMeta = metaEnv?.[key];
    if (fromMeta) return fromMeta;
    const fromProcess = typeof process !== 'undefined' ? process?.env?.[key] : undefined;
    if (fromProcess) return fromProcess;
  } catch {}
  return '';
}

const envUrl = import.meta.env.VITE_SUPABASE_URL || getSafeEnv('VITE_SUPABASE_URL');
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || getSafeEnv('VITE_SUPABASE_ANON_KEY');

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY at startup.');
}

// Hardwire production Supabase credentials as default fallbacks
const SUPABASE_URL =
  envUrl && envUrl.startsWith('http') && !envUrl.includes('placeholder')
    ? envUrl
    : PROD_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  envKey && !envKey.includes('placeholder') ? envKey : PROD_SUPABASE_ANON_KEY;

function hasSubtleCrypto(): boolean {
  try {
    return typeof window !== 'undefined' && Boolean(window.crypto && window.crypto.subtle);
  } catch {
    return false;
  }
}

const insecureOrigin = typeof window !== 'undefined' && !hasSubtleCrypto();

/** Finishes an explicit sign-out before the auth client reads storage. */
function finishPendingSignOut(): void {
  try {
    if (typeof window === 'undefined' || localStorage.getItem('o1fc_signed_out_pending') !== '1')
      return;
    for (const key of Object.keys(localStorage)) {
      if (/^sb-.+-auth-token/.test(key)) localStorage.removeItem(key);
    }
    localStorage.removeItem('o1fc_user_id');
    localStorage.removeItem('o1fc_user_email');
    localStorage.removeItem('o1fc_signed_out_pending');
  } catch {
    /* storage unavailable */
  }
}
finishPendingSignOut();

const authOptions = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: (insecureOrigin ? 'implicit' : 'pkce') as 'implicit' | 'pkce',
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
};
let rawClient: SupabaseClient;
try {
  rawClient = createClient(
    import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY,
    {
      auth: authOptions,
    },
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

export const supabase: SupabaseClient = rawClient;

/** Idempotent: safe to retry with the same payload id; never duplicates rows. */
export async function syncSessionToSupabase(sessionData: WorkoutSessionPayload): Promise<boolean> {
  try {
    const { data: authData } = await rawClient.auth.getUser();
    const userId = sessionData.user_id || authData?.user?.id;
    if (!userId || userId === 'default-athlete' || userId === 'athlete-c1') return false;
    const { session, logs, mirror } = buildArchiveRows(sessionData, userId);

    const sessionRes = await supabase
      .from('completed_sessions')
      .upsert([session], { onConflict: 'id' });
    if (sessionRes.error) {
      console.error('[Supabase] completed_sessions upsert failed:', sessionRes.error);
      return false;
    }
    if (logs.length > 0) {
      await supabase
        .from('workout_logs')
        .delete()
        .eq('session_id', session.id as string);
      const logsRes = await supabase.from('workout_logs').insert(logs);
      if (logsRes.error) {
        console.error('[Supabase] workout_logs insert failed:', logsRes.error);
        return false;
      }
    }
    const mirrorRes = await supabase
      .from('workout_sessions')
      .upsert([mirror], { onConflict: 'id' });
    if (mirrorRes.error)
      console.warn('[Supabase] workout_sessions mirror upsert failed:', mirrorRes.error);
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
  } catch {
    return null;
  }
}
