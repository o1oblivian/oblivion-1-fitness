import { useEffect } from 'react';
import { useUserStore } from '../../stores/useUserStore';
import { toDayKey } from './reportEngine';
import type { WeighIn } from './types';

const KEY = 'o1fc_weighins_v1';
const MAX_ENTRIES = 400;

export function readWeighIns(): WeighIn[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (w): w is WeighIn => !!w && typeof w.day === 'string' && typeof w.kg === 'number' && w.kg > 0,
    );
  } catch {
    return [];
  }
}

/** One entry per local day; later weigh-ins on the same day replace earlier ones. */
export function recordWeighIn(kg: number, now = Date.now()): void {
  if (typeof window === 'undefined' || !(kg > 0) || !Number.isFinite(kg)) return;
  const day = toDayKey(now);
  const list = readWeighIns().filter((w) => w.day !== day);
  list.push({ day, kg: Math.round(kg * 10) / 10 });
  list.sort((a, b) => (a.day < b.day ? -1 : 1));
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_ENTRIES)));
  } catch {
    // storage full or unavailable: weigh-in history is best-effort
  }
}

/** Mount once in the Log tab: captures bodyweight changes into the local weigh-in history. */
export function useWeighInCapture(): void {
  const weightKg = useUserStore((s) => s.weightKg);
  useEffect(() => {
    if (weightKg > 0) recordWeighIn(weightKg);
  }, [weightKg]);
}
