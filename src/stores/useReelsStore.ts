import { create } from 'zustand';
import type { ExploreReelItem } from '../features/reels/reelTypes';
import { mockReels } from '../services/devMocks';
import { fetchReelFeed } from '../features/reels/services/reelFeed';

type FeedStatus = 'idle' | 'loading' | 'ready' | 'error';

interface ReelsState {
  reels: ExploreReelItem[];
  status: FeedStatus;
  /** Loads the shared feed from the `reels` table. Pass true to refetch after a publish elsewhere. */
  loadFeed: (force?: boolean) => Promise<void>;
  /** Shows a reel that was just written to the `reels` table without waiting for a refetch. */
  addCoachReel: (newReel: ExploreReelItem) => void;
}

let inflight: Promise<void> | null = null;

export const useReelsStore = create<ReelsState>((set, get) => ({
  reels: mockReels(),
  status: 'idle',

  loadFeed: (force = false) => {
    if (inflight) return inflight;
    if (!force && get().status === 'ready') return Promise.resolve();
    set({ status: 'loading' });
    inflight = fetchReelFeed()
      .then((rows) => {
        if (rows === null) {
          set({ status: 'error' });
          return;
        }
        const seen = new Set(rows.map((reel) => reel.id));
        set({ reels: [...rows, ...mockReels().filter((reel) => !seen.has(reel.id))], status: 'ready' });
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  },

  addCoachReel: (newReel) => {
    set({ reels: [newReel, ...get().reels.filter((reel) => reel.id !== newReel.id)] });
  },
}));
