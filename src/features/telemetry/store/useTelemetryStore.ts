import { createStore } from '../../../utils/createStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { safeStorage } from '../../../utils/sanitizers';
import { getTelemetryHistoryState } from '../../log/store/useTelemetryHistoryStore';
import {
  OperatorProfileMetrics,
  HistoryWorkoutSession,
  TelemetryStoreState,
  TelemetryStoreActions,
} from './telemetryTypes';

export type {
  OperatorProfileMetrics,
  HistoryWorkoutSession,
  TelemetryStoreState,
  TelemetryStoreActions,
};

const TARGETS_STORAGE_KEY = 'o1fc_telemetry_targets_v2';
const SETTINGS_STORAGE_KEY = 'o1fc_production_settings_v3';

const loadSavedTargets = () => {
  if (typeof window === 'undefined') {
    return { stepTarget: 10000, moveTarget: 700, distTarget: 8, stepCount: 0 };
  }
  const saved = safeStorage.getItem<{ stepTarget?: number; moveTarget?: number; distTarget?: number; stepCount?: number }>(
    TARGETS_STORAGE_KEY,
    {}
  );
  const settingsSaved = safeStorage.getItem<{ stepTarget?: number }>(SETTINGS_STORAGE_KEY, {});

  // Prioritize active athlete settings target if defined and valid
  const effectiveStepTarget =
    typeof settingsSaved?.stepTarget === 'number' && settingsSaved.stepTarget > 0
      ? settingsSaved.stepTarget
      : typeof saved?.stepTarget === 'number' && saved.stepTarget > 0
      ? saved.stepTarget
      : 10000;

  // Auto-clean any stale test inputs (e.g. 32000 steps from previous step target bug)
  const savedSteps = typeof saved?.stepCount === 'number' && saved.stepCount !== 32000 && saved.stepCount !== 17750 ? saved.stepCount : 0;
  return {
    stepTarget: effectiveStepTarget,
    moveTarget: typeof saved?.moveTarget === 'number' && saved.moveTarget > 0 ? saved.moveTarget : 700,
    distTarget: typeof saved?.distTarget === 'number' && saved.distTarget > 0 ? saved.distTarget : 8,
    stepCount: savedSteps,
  };
};

const initialTargets = loadSavedTargets();

const initialState: TelemetryStoreState = {
  metrics: {
    handle: '@o1oblivianfitness',
    strainValue: 0,
    streakDays: 0,
    avgVolumeKg: 0,
    readinessScore: 0,
    macroPrecision: 0,
  },
  stepCount: initialTargets.stepCount,
  stepTarget: initialTargets.stepTarget,
  moveTarget: initialTargets.moveTarget,
  distTarget: initialTargets.distTarget,
  selectedMicrocycleDay: 17,
  activeSplit: 'Push',
  isPhotoVaultOpen: false,
  isShareBenchmarkOpen: false,
  isQuickAddOpen: false,
  bioSyncPhase: 'Follicular',
  bioSyncDayLabel: 'Day 14',
  bioSyncStatusMessage: 'Active Baseline',
  drinksCount: 0,
  cleanHabitStreakDays: 0,
  isClean: true,
  toastMessage: null,
  historyLogs: [],
};

const persistTargets = (state: Pick<TelemetryStoreState, 'stepTarget' | 'moveTarget' | 'distTarget' | 'stepCount'>) => {
  safeStorage.setItem(TARGETS_STORAGE_KEY, {
    stepTarget: state.stepTarget,
    moveTarget: state.moveTarget,
    distTarget: state.distTarget,
    stepCount: state.stepCount,
  });
  // Keep settings storage in continuous lockstep to eliminate any reversion bugs
  try {
    const currentSettings = safeStorage.getItem<Record<string, unknown>>(SETTINGS_STORAGE_KEY, {});
    safeStorage.setItem(SETTINGS_STORAGE_KEY, {
      ...currentSettings,
      stepTarget: state.stepTarget,
    });
  } catch (e) {
    console.warn('[TelemetryStore] Failed to mirror step target to settings:', e);
  }
};

const telemetryStore = createStore<TelemetryStoreState, TelemetryStoreActions>(
  initialState,
  (set, get) => ({
    selectMicrocycleDay: (dayNum) => {
      tactileEngine.triggerDialHaptic();
      set({ selectedMicrocycleDay: dayNum });
    },
    setActiveSplit: (split) => {
      tactileEngine.triggerSelectionBuzz();
      set({ activeSplit: split });
    },
    setPhotoVaultOpen: (open) => {
      tactileEngine.triggerSelectionBuzz();
      set({ isPhotoVaultOpen: open });
    },
    setShareBenchmarkOpen: (open) => {
      tactileEngine.triggerSelectionBuzz();
      set({ isShareBenchmarkOpen: open });
    },
    setQuickAddOpen: (open) => {
      tactileEngine.triggerSelectionBuzz();
      set({ isQuickAddOpen: open });
    },
    updateMetrics: (updates) => {
      set((prev) => ({ metrics: { ...prev.metrics, ...updates } }));
    },
    setBioSync: (phase, dayLabel, statusMessage) => {
      set((prev) => ({
        bioSyncPhase: phase,
        bioSyncDayLabel: dayLabel,
        bioSyncStatusMessage: statusMessage || prev.bioSyncStatusMessage,
      }));
      tactileEngine.triggerSelectionBuzz();
    },
    setDrinksCount: (drinks) => set({ drinksCount: Math.max(0, drinks) }),
    setStepCount: (steps) => {
      const next = Math.max(0, steps);
      set({ stepCount: next });
      const current = get();
      persistTargets(current);

      try {
        const now = new Date();
        const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const dist = Number((next / 1300).toFixed(1));
        const burn = Math.round(next * 0.04);
        const duration = Math.max(1, Math.round(next / 100));
        getTelemetryHistoryState().updateDayRecord(todayKey, 'cardio', {
          hasData: next > 0,
          distanceKm: dist,
          burnedKcal: burn,
          durationMinutes: duration,
          avgHeartRateBpm: 135,
          zone2Minutes: Math.round(duration * 0.75),
          activityType: 'Daily Steps / Cardio',
        });
      } catch (err) {
        console.warn('[TelemetryStore] History sync warning:', err);
      }
    },
    setStepTarget: (target) => {
      const next = Math.max(0, target);
      set({ stepTarget: next });
      const current = get();
      persistTargets(current);
    },
    setMoveTarget: (target) => {
      const next = Math.max(0, target);
      set({ moveTarget: next });
      const current = get();
      persistTargets(current);
    },
    setDistTarget: (target) => {
      const next = Math.max(0, target);
      set({ distTarget: next });
      const current = get();
      persistTargets(current);
    },
    addSteps: (steps) => {
      set((prev) => {
        const next = Math.max(0, (prev.stepCount || 0) + steps);
        persistTargets({ ...prev, stepCount: next });

        try {
          const now = new Date();
          const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const dist = Number((next / 1300).toFixed(1));
          const burn = Math.round(next * 0.04);
          const duration = Math.max(1, Math.round(next / 100));
          getTelemetryHistoryState().updateDayRecord(todayKey, 'cardio', {
            hasData: next > 0,
            distanceKm: dist,
            burnedKcal: burn,
            durationMinutes: duration,
            avgHeartRateBpm: 135,
            zone2Minutes: Math.round(duration * 0.75),
            activityType: 'Daily Steps / Cardio',
          });
        } catch (err) {
          console.warn('[TelemetryStore] History sync warning:', err);
        }

        return { stepCount: next };
      });
    },
    logFastClean: () => {
      tactileEngine.playPRCelebration();
      set((prev) => ({ cleanHabitStreakDays: prev.cleanHabitStreakDays + 1, isClean: true }));
    },
    addHistorySession: (session) => {
      tactileEngine.playPRCelebration();
      set((prev) => ({
        historyLogs: [session, ...prev.historyLogs],
        metrics: { ...prev.metrics, avgVolumeKg: prev.metrics.avgVolumeKg + session.tonnageKg },
      }));
    },
    seedTelemetryDemo: () => {
      // Genuine telemetry only - no mock data injection
    },
    clearTelemetryState: () => {
      set((prev) => ({
        stepCount: 0,
        stepTarget: prev.stepTarget || 10000,
        moveTarget: prev.moveTarget || 700,
        distTarget: prev.distTarget || 8,
        cleanHabitStreakDays: 0,
        historyLogs: [],
        metrics: {
          handle: '@o1oblivianfitness',
          strainValue: 0,
          streakDays: 0,
          avgVolumeKg: 0,
          readinessScore: 85,
          macroPrecision: 0,
        },
      }));
      persistTargets(get());
    },
    clearAllTelemetry: () => {
      get().clearTelemetryState();
    },
    showToast: () => {},
    clearToast: () => set({ toastMessage: null }),
  })
);

export const useTelemetryStore = telemetryStore.useStore;
export const getTelemetryState = telemetryStore.getState;
export const setTelemetryState = telemetryStore.setState;
export const telemetryActions = telemetryStore.actions;
