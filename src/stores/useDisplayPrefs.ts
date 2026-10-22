import { createStore } from '../utils/createStore';
import { safeStorage } from '../utils/safeStorage';
import { useConsultationStore } from '../features/induction/useConsultationStore';
import type { AgeBand, TrainingAge } from '../features/induction/consultationTypes';
import { readSystemTextSize, type SystemTextSize } from '../utils/systemTextSize';

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
  /** The phone's own text size setting, when the phone has one the app can read. Never saved. */
  systemTextSize: SystemTextSize | null;
}

interface DisplayPrefsActions {
  setTextSize: (textSize: TextSizePref) => void;
  setDetail: (detail: DetailPref) => void;
  setSystemTextSize: (size: SystemTextSize | null) => void;
}

function readPrefs(): DisplayPrefsState {
  const saved = safeStorage.getItem<Partial<DisplayPrefsState> | null>(KEY, null);
  return {
    textSize: saved?.textSize && saved.textSize in SCALE ? saved.textSize : 'auto',
    detail: saved?.detail === 'simple' || saved?.detail === 'pro' ? saved.detail : 'auto',
    systemTextSize: null,
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
  setSystemTextSize: (systemTextSize) => set({ systemTextSize }),
}));

export const useDisplayPrefs = store.useStore;

const SIZE_ORDER: readonly TextSize[] = ['standard', 'large', 'xlarge'];

/**
 * Automatic size: the larger of the phone's own text size and the age-band default (over-60s start
 * on large). A size chosen in Settings always wins.
 */
export function resolveTextSize(
  pref: TextSizePref,
  ageBand: AgeBand | '',
  system: SystemTextSize | null = null,
): TextSize {
  if (pref !== 'auto') return pref;
  const byAge: TextSize = ageBand === '60+' ? 'large' : 'standard';
  const fromPhone: TextSize = system ?? 'standard';
  return SIZE_ORDER.indexOf(fromPhone) > SIZE_ORDER.indexOf(byAge) ? fromPhone : byAge;
}

/** Beginners, teenagers and over-60s start on Simple: plain words and fewer numbers. */
export function resolveDetail(
  pref: DetailPref,
  trainingAge: TrainingAge | '',
  ageBand: AgeBand | '',
): Detail {
  if (pref !== 'auto') return pref;
  const simple =
    trainingAge === 'new' || trainingAge === '<1yr' || ageBand === 'under18' || ageBand === '60+';
  return simple ? 'simple' : 'pro';
}

export function useTextSize(): TextSize {
  const pref = useDisplayPrefs((s) => s.textSize);
  const system = useDisplayPrefs((s) => s.systemTextSize);
  const ageBand = useConsultationStore((s) => s.ageBand);
  return resolveTextSize(pref, ageBand, system);
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
  const { textSize, systemTextSize } = store.getState();
  const size = resolveTextSize(textSize, useConsultationStore.getState().ageBand, systemTextSize);
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
  if (next.textSize !== prev.textSize || next.systemTextSize !== prev.systemTextSize) {
    applyTextSize();
  }
});
useConsultationStore.subscribe((next, prev) => {
  if (next.ageBand !== prev.ageBand) applyTextSize();
});

/** Reads the phone's text size now and again each time the app comes back to the front. */
function followSystemTextSize(): void {
  if (typeof document === 'undefined') return;
  const refresh = () => void readSystemTextSize().then(store.getState().setSystemTextSize);
  refresh();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh();
  });
}
followSystemTextSize();
