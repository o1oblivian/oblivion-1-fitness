import { create } from 'zustand';
import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { isValidUuid } from '../../coach/services/coachService';

const CACHE_KEY = 'o1fc_reel_views_v1';
const CACHE_LIMIT = 2000;

function readCache(): Record<string, true> {
  try {
    const ids = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    return Array.isArray(ids) ? Object.fromEntries(ids.filter((id) => typeof id === 'string').map((id: string) => [id, true as const])) : {};
  } catch {
    return {};
  }
}

function writeCache(viewed: Record<string, true>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.keys(viewed).slice(-CACHE_LIMIT)));
  } catch {
    /* storage full: the server copy still holds the views */
  }
}

interface ReelViewsState {
  viewed: Record<string, true>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  markViewed: (reelId: string) => void;
}

let hydrating: Promise<void> | null = null;

export const useReelViewsStore = create<ReelViewsState>((set, get) => ({
  viewed: readCache(),
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return Promise.resolve();
    if (hydrating) return hydrating;
    hydrating = (async () => {
      const userId = await getAuthenticatedUserId();
      if (!isValidUuid(userId || '')) return;
      const { data, error } = await supabase.from('reel_views').select('reel_id').eq('user_id', userId);
      if (error || !Array.isArray(data)) return;
      const merged = { ...get().viewed };
      for (const row of data) if (row?.reel_id) merged[String(row.reel_id)] = true;
      writeCache(merged);
      set({ viewed: merged, hydrated: true });
    })().finally(() => {
      hydrating = null;
    });
    return hydrating;
  },

  markViewed: (reelId) => {
    if (!reelId || get().viewed[reelId]) return;
    const next = { ...get().viewed, [reelId]: true as const };
    writeCache(next);
    set({ viewed: next });
    void getAuthenticatedUserId().then((userId) => {
      if (!isValidUuid(userId || '')) return;
      void supabase.from('reel_views').upsert({ user_id: userId, reel_id: reelId }, { onConflict: 'user_id,reel_id', ignoreDuplicates: true });
    });
  },
}));
