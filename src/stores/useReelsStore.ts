import { create } from 'zustand';
import type { ExploreReelItem } from '../features/reels/reelTypes';
import { mockReels } from '../services/devMocks';

const STORAGE_KEY = 'o1_coach_uploaded_reels';

interface ReelsState {
  reels: ExploreReelItem[];
  addCoachReel: (newReel: ExploreReelItem) => void;
  removeReel: (id: string) => void;
  resetToDefault: () => void;
}

function readUploadedReels(): ExploreReelItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === 'object' && item.coach && typeof item.coach === 'object')
      .map((item) => ({
        ...item,
        coach: {
          ...item.coach,
          specialtyTitle: item.coach.specialtyTitle || item.coach.name || 'Coach',
          certificationPill: item.coach.certificationPill || '',
        },
      }));
  } catch (err) {
    console.warn('[useReelsStore] Failed to load stored reels:', err);
    return [];
  }
}

function writeUploadedReels(reels: ExploreReelItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reels));
  } catch (err) {
    console.warn('[useReelsStore] Failed to persist uploaded reels:', err);
  }
}

export const useReelsStore = create<ReelsState>((set, get) => ({
  reels: [...readUploadedReels(), ...mockReels()],

  addCoachReel: (newReel) => {
    set({ reels: [newReel, ...get().reels] });
    writeUploadedReels([newReel, ...readUploadedReels()]);
  },

  removeReel: (id) => {
    set({ reels: get().reels.filter((reel) => reel.id !== id) });
    writeUploadedReels(readUploadedReels().filter((reel) => reel.id !== id));
  },

  resetToDefault: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
    set({ reels: mockReels() });
  },
}));
