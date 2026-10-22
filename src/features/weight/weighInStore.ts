import { useEffect, useMemo, useRef } from 'react';
import { createStore } from '../../utils/createStore';
import { safeStorage } from '../../utils/safeStorage';
import { useUserStore } from '../../stores/useUserStore';
import { toDayKey } from '../report/reportEngine';
import type { WeighIn } from '../report/types';

/** Kept under the original name so weigh-ins already on the phone carry over. */
const KEY = 'o1fc_weighins_v1';
const MAX_ENTRIES = 400;
const MAX_KG = 500;

/**
 * Bumped on every save so screens re-read the list. The list itself stays in storage rather than
 * in memory: the copy restored from durable storage at launch lands after this module loads.
 */
const revisionStore = createStore<{ revision: number }, Record<string, never>>(
  { revision: 0 },
  () => ({}),
);

/** Oldest first, one entry per day. */
export function readWeighIns(): WeighIn[] {
  const saved = safeStorage.getItem<unknown>(KEY, []);
  if (!Array.isArray(saved)) return [];
  return saved.filter(
    (w): w is WeighIn =>
      !!w && typeof w.day === 'string' && typeof w.kg === 'number' && w.kg > 0 && w.kg <= MAX_KG,
  );
}

/** Saves today's weight. A second weigh-in on the same day replaces the first, even at the same weight. */
export function logWeighIn(kg: number, now: number = Date.now()): void {
  if (!(kg > 0) || !Number.isFinite(kg) || kg > MAX_KG) return;
  const day = toDayKey(now);
  const list = readWeighIns().filter((w) => w.day !== day);
  list.push({ day, kg: Math.round(kg * 10) / 10 });
  list.sort((a, b) => (a.day < b.day ? -1 : 1));
  safeStorage.setItem(KEY, list.slice(-MAX_ENTRIES));
  revisionStore.setState((prev) => ({ revision: prev.revision + 1 }));
}

/** The saved weigh-ins, kept current as new ones are logged. */
export function useWeighIns(): WeighIn[] {
  const revision = revisionStore.useStore((s) => s.revision);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- revision is the cue to re-read storage
  return useMemo(readWeighIns, [revision]);
}

/**
 * Mount once for the whole app: a bodyweight change made anywhere (Settings, the Energy Engine,
 * Fuel) is kept as that day's weigh-in. The weight the app starts with is not a weigh-in.
 */
export function useWeighInCapture(): void {
  const weightKg = useUserStore((s) => s.weightKg);
  const previous = useRef(weightKg);
  useEffect(() => {
    if (previous.current === weightKg) return;
    previous.current = weightKg;
    if (weightKg > 0) logWeighIn(weightKg);
  }, [weightKg]);
}
