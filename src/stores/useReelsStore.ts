import { create } from 'zustand';
import type { ExploreReelItem } from '../features/reels/reelTypes';
import { fetchReelFeed } from '../features/reels/services/reelFeed';

type FeedStatus = 'idle' | 'loading' | 'ready' | 'error';

interface ReelsState {
  /** Rows from the `reels` table only. Empty until the feed loads. */
  reels: ExploreReelItem[];
  status: FeedStatus;
  /** Why the last load failed, shown to the member. `null` unless `status` is `'error'`. */
  error: string | null;
  /** Loads the shared feed from the `reels` table. Pass true to refetch after a publish elsewhere. */
  loadFeed: (force?: boolean) => Promise<void>;
  /** Shows a reel that was just written to the `reels` table without waiting for a refetch. */
  addCoachReel: (newReel: ExploreReelItem) => void;
}

let inflight: Promise<void> | null = null;

export const useReelsStore = create<ReelsState>((set, get) => ({
  reels: [],
  status: 'idle',
  error: null,

  loadFeed: (force = false) => {
    if (inflight) return inflight;
    if (!force && get().status === 'ready') return Promise.resolve();
    set({ status: 'loading', error: null });
    inflight = fetchReelFeed()
      .then(
        (rows) => set({ reels: rows, status: 'ready' }),
        (err: unknown) => {
          console.error('[Reels] Feed failed to load', err);
          set({
            status: 'error',
            error: err instanceof Error ? err.message : 'Reels could not load.',
          });
        },
      )
      .finally(() => {
        inflight = null;
      });
    return inflight;
  },

  addCoachReel: (newReel) => {
    set({ reels: [newReel, ...get().reels.filter((reel) => reel.id !== newReel.id)] });
  },
}));
