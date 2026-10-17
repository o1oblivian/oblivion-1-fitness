import { create } from 'zustand';
import { safeStorage } from '../../../utils/safeStorage';

const STORAGE_KEY = 'o1fc_rest_timer_v1';
const MIN_REST_SECONDS = 15;
const MAX_REST_SECONDS = 600;

export interface RestTimer {
  /** Epoch ms. Stored instead of a countdown so it survives backgrounding and reloads. */
  endsAt: number;
  durationSec: number;
  exerciseName: string;
}

interface RestTimerState {
  timer: RestTimer | null;
  start: (seconds: number, exerciseName: string) => void;
  extend: (seconds: number) => void;
  skip: () => void;
}

function load(): RestTimer | null {
  const saved = safeStorage.getItem<RestTimer | null>(STORAGE_KEY, null);
  return saved && Number.isFinite(saved.endsAt) && saved.endsAt > Date.now() ? saved : null;
}

function persist(timer: RestTimer | null) {
  if (timer) safeStorage.setItem(STORAGE_KEY, timer);
  else safeStorage.removeItem(STORAGE_KEY);
}

export const useRestTimerStore = create<RestTimerState>((set, get) => ({
  timer: load(),
  start: (seconds, exerciseName) => {
    const durationSec = Math.round(
      Math.min(MAX_REST_SECONDS, Math.max(MIN_REST_SECONDS, seconds || 90)),
    );
    const timer = { endsAt: Date.now() + durationSec * 1000, durationSec, exerciseName };
    persist(timer);
    set({ timer });
  },
  extend: (seconds) => {
    const current = get().timer;
    if (!current) return;
    const timer = {
      ...current,
      endsAt: current.endsAt + seconds * 1000,
      durationSec: current.durationSec + seconds,
    };
    persist(timer);
    set({ timer });
  },
  skip: () => {
    persist(null);
    set({ timer: null });
  },
}));
