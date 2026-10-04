import { create } from 'zustand';
import {
  EXPLORE_REELS_CATALOG,
  ExploreReelItem,
  ExploreCoach,
  EXPLORE_COACHES,
} from '../data/reelsExploreCatalog';

const STORAGE_KEY = 'o1_coach_uploaded_reels';

interface ReelsState {
  reels: ExploreReelItem[];
  addCoachReel: (newReel: ExploreReelItem) => void;
  removeReel: (id: string) => void;
  resetToDefault: () => void;
}

const loadStoredReels = (): ExploreReelItem[] => {
  if (typeof window === 'undefined') return EXPLORE_REELS_CATALOG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EXPLORE_REELS_CATALOG;
    const uploaded = JSON.parse(raw);
    if (Array.isArray(uploaded) && uploaded.length > 0) {
      // Validate & sanitize uploaded items so missing coach or specialtyTitle never crashes the app
      const sanitized = uploaded
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          ...item,
          coach: item.coach && typeof item.coach === 'object'
            ? {
                ...item.coach,
                specialtyTitle: item.coach.specialtyTitle || item.coach.name || 'Performance Coach',
                certificationPill: item.coach.certificationPill || 'O1FC CERTIFIED',
              }
            : EXPLORE_COACHES.marcus_reid,
        }));
      return [...sanitized, ...EXPLORE_REELS_CATALOG];
    }
  } catch (err) {
    console.warn('[useReelsStore] Failed to load stored reels:', err);
  }
  return EXPLORE_REELS_CATALOG;
};

export const useReelsStore = create<ReelsState>((set, get) => ({
  reels: loadStoredReels(),

  addCoachReel: (newReel: ExploreReelItem) => {
    const current = get().reels;
    const updated = [newReel, ...current];
    set({ reels: updated });

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const existingUploaded = stored ? JSON.parse(stored) : [];
      const nextUploaded = [newReel, ...existingUploaded];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUploaded));
    } catch (e) {
      console.warn('[useReelsStore] Failed to persist uploaded reel:', e);
    }
  },

  removeReel: (id: string) => {
    const updated = get().reels.filter((r) => r.id !== id);
    set({ reels: updated });

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const existing = JSON.parse(stored);
        const next = existing.filter((r: ExploreReelItem) => r.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    } catch (e) {
      console.warn('[useReelsStore] Failed to delete reel from storage:', e);
    }
  },

  resetToDefault: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ reels: EXPLORE_REELS_CATALOG });
  },
}));
