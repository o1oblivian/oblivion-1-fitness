import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://qkfvepjeyreicqomatyt.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_RI2IA9KKxaOf3yWTsOJ1IA_Y7JPsnCP';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
    !supabaseUrl.includes('your-supabase-project')
  );
};

export const storageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {}
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {}
  },
};

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: storageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
      timeout: 30000,
      heartbeatIntervalMs: 15000,
    },
  }
);

// Automatic Realtime Channel Reconnect & Presence Recovery for Gym Basements
if (typeof window !== 'undefined') {
  const recoverRealtimeConnection = () => {
    try {
      if (navigator.onLine && supabase.realtime) {
        supabase.realtime.connect();
      }
    } catch (e) {
      console.warn('[Supabase Realtime] Reconnect notice:', e);
    }
  };

  window.addEventListener('online', recoverRealtimeConnection);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      recoverRealtimeConnection();
    }
  });
}

export async function supabaseSignUp(email: string, password: string, name?: string) {
  try {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name || '' },
      },
    });
  } catch (err: any) {
    return { data: { user: null, session: null }, error: err };
  }
}

export async function supabaseSignIn(email: string, password: string) {
  try {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  } catch (err: any) {
    return { data: { user: null, session: null }, error: err };
  }
}

export async function supabaseOAuthSignIn(provider: 'google' | 'apple' | 'github') {
  try {
    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : undefined;

    const isIframe = typeof window !== 'undefined' && window.self !== window.top;

    return await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: isIframe,
      },
    });
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function supabaseResetPassword(email: string) {
  try {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/#reset-password` : undefined,
    });
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function supabaseGetSession() {
  try {
    return await supabase.auth.getSession();
  } catch (err: any) {
    return { data: { session: null }, error: err };
  }
}

export async function supabaseSignOut() {
  try {
    return await supabase.auth.signOut();
  } catch (err: any) {
    return { error: err };
  }
}

export function subscribeToRealtimeTable(
  tableName: string,
  onPayload: (payload: any) => void,
  filter?: string
) {
  if (!isSupabaseConfigured()) return null;

  let channel: any = null;
  let retryTimeout: any = null;
  let retryDelayMs = 1500;
  let isDissolved = false;

  const connect = () => {
    if (isDissolved) return;
    try {
      const channelName = filter
        ? `realtime_${tableName}_${filter.replace(/[^a-zA-Z0-9_]/g, '_')}_${Date.now()}`
        : `realtime_${tableName}_${Date.now()}`;

      const channelConfig: any = { event: '*', schema: 'public', table: tableName };
      if (filter) {
        channelConfig.filter = filter;
      }

      channel = supabase
        .channel(channelName)
        .on('postgres_changes' as any, channelConfig, (payload: any) => {
          onPayload(payload);
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            retryDelayMs = 1500;
          } else if (
            (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') &&
            !isDissolved
          ) {
            if (retryTimeout) clearTimeout(retryTimeout);
            retryTimeout = setTimeout(() => {
              if (navigator.onLine && !isDissolved) {
                connect();
              }
            }, retryDelayMs);
            retryDelayMs = Math.min(20000, retryDelayMs * 1.8);
          }
        });
    } catch (e) {
      console.warn(`Realtime subscription error for ${tableName}:`, e);
    }
  };

  connect();

  return {
    unsubscribe: () => {
      isDissolved = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
    },
  };
}

export async function fetchNearbyGymsPostGIS(lat: number, lng: number, radiusMeters = 25000) {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase.rpc('get_nearby_gym_venues', {
      user_lat: lat,
      user_lng: lng,
      radius_meters: radiusMeters,
    });
    if (!error && data) return data;
  } catch (e) {
    console.warn('PostGIS get_nearby_gym_venues RPC error:', e);
  }
  return null;
}

export async function findBuddyMatchesPostGIS(email: string, lat: number, lng: number, radiusKm = 250.0) {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase.rpc('find_buddy_matches', {
      current_user_email: email,
      user_lat: lat,
      user_lng: lng,
      max_distance_km: radiusKm,
    });
    if (!error && data) return data;
  } catch (e) {
    console.warn('PostGIS find_buddy_matches RPC error:', e);
  }
  return null;
}
