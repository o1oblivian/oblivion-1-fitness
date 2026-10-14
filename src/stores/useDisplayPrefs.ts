import { createStore } from '../utils/createStore';
import { safeStorage } from '../utils/safeStorage';
import { useConsultationStore } from '../features/induction/useConsultationStore';
import type { AgeBand, TrainingAge } from '../features/induction/consultationTypes';

export type TextSizePref = 'auto' | 'standard' | 'large' | 'xlarge';
export type DetailPref = 'auto' | 'simple' | 'pro';
export type TextSize = Exclude<TextSizePref, 'auto'>;
export type Detail = Exclude<DetailPref, 'auto'>;

const KEY = 'o1fc_display_prefs_v1';

/** Body copy scales fully; big display numbers scale less so they never overflow their cards. */
const SCALE: Record<TextSize, { text: number; display: number }> = {
  standard: { text: 1, display: 1 },
  large: { text: 1.12, display: 1.06 },
  xlarge: { text: 1.25, display: 1.12 },
};

interface DisplayPrefsState {
  textSize: TextSizePref;
  detail: DetailPref;
}

interface DisplayPrefsActions {
  setTextSize: (textSize: TextSizePref) => void;
  setDetail: (detail: DetailPref) => void;
}

function readPrefs(): DisplayPrefsState {
  const saved = safeStorage.getItem<Partial<DisplayPrefsState> | null>(KEY, null);
  return {
    textSize: saved?.textSize && saved.textSize in SCALE ? saved.textSize : 'auto',
    detail: saved?.detail === 'simple' || saved?.detail === 'pro' ? saved.detail : 'auto',
  };
}

const store = createStore<DisplayPrefsState, DisplayPrefsActions>(readPrefs(), (set, get) => ({
  setTextSize: (textSize) => {
    set({ textSize });
    safeStorage.setItem(KEY, { textSize, detail: get().detail });
  },
  setDetail: (detail) => {
    set({ detail });
    safeStorage.setItem(KEY, { textSize: get().textSize, detail });
  },
}));

export const useDisplayPrefs = store.useStore;

/** Over-60s start on large text. */
export function resolveTextSize(pref: TextSizePref, ageBand: AgeBand | ''): TextSize {
  if (pref !== 'auto') return pref;
  return ageBand === '60+' ? 'large' : 'standard';
}

/** Beginners, teenagers and over-60s start on Simple: plain words and fewer numbers. */
export function resolveDetail(pref: DetailPref, trainingAge: TrainingAge | '', ageBand: AgeBand | ''): Detail {
  if (pref !== 'auto') return pref;
  const simple = trainingAge === 'new' || trainingAge === '<1yr' || ageBand === 'under18' || ageBand === '60+';
  return simple ? 'simple' : 'pro';
}

export function useTextSize(): TextSize {
  const pref = useDisplayPrefs((s) => s.textSize);
  const ageBand = useConsultationStore((s) => s.ageBand);
  return resolveTextSize(pref, ageBand);
}

export function useDetail(): Detail {
  const pref = useDisplayPrefs((s) => s.detail);
  const trainingAge = useConsultationStore((s) => s.trainingAge);
  const ageBand = useConsultationStore((s) => s.ageBand);
  return resolveDetail(pref, trainingAge, ageBand);
}

export const useSimpleMode = (): boolean => useDetail() === 'simple';

function applyTextSize(): void {
  if (typeof document === 'undefined') return;
  const size = resolveTextSize(store.getState().textSize, useConsultationStore.getState().ageBand);
  const root = document.documentElement;
  if (size === 'standard') {
    delete root.dataset.textSize;
    root.style.removeProperty('--o1-text-scale');
    root.style.removeProperty('--o1-display-scale');
    return;
  }
  root.dataset.textSize = size;
  root.style.setProperty('--o1-text-scale', String(SCALE[size].text));
  root.style.setProperty('--o1-display-scale', String(SCALE[size].display));
}

applyTextSize();
store.useStore.subscribe((next, prev) => {
  if (next.textSize !== prev.textSize) applyTextSize();
});
useConsultationStore.subscribe((next, prev) => {
  if (next.ageBand !== prev.ageBand) applyTextSize();
});
