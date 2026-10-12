import { createStore } from '../../../utils/createStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { safeStorage } from '../../../utils/safeStorage';
import { queueOfflineAction, isDeviceOnline } from '../../../services/offlineSyncService';
import {
  useTelemetryHistoryStore,
  getTelemetryHistoryState,
  WorkoutDayRecord,
} from '../../log/store/useTelemetryHistoryStore';
import {
  NormalizedWorkoutMode,
  NormalizedWorkoutSubMode,
  WorkoutStoreState,
  WorkoutStoreActions,
  initialWorkoutState,
} from './workoutStoreTypes';
import {
  createSevenWorkouts,
  createRecoveryExercise,
} from './workoutStoreFactories';
import {
  addSetToExercises,
  removeSetFromExercises,
  toggleSetInExercises,
  updateSetInExercises,
  computeSessionMetrics,
  sessionLedger,
  mergeWorkoutDay,
} from './workoutSetOperations';

const BASELINE_KEY = 'o1fc_workout_day_baseline';

function localTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * What today held before the current session started. Captured once per session so live edits
 * add to earlier sessions instead of overwriting them.
 */
function dayBaseline(todayKey: string): Partial<WorkoutDayRecord> | undefined {
  const saved = safeStorage.getItem<{ dateKey: string; record?: Partial<WorkoutDayRecord> } | null>(BASELINE_KEY, null);
  if (saved && saved.dateKey === todayKey) return saved.record;
  const record = getTelemetryHistoryState().historyByDate[todayKey]?.workout;
  const snapshot = record?.hasData ? { ...record } : undefined;
  safeStorage.setItem(BASELINE_KEY, { dateKey: todayKey, record: snapshot });
  return snapshot;
}

/** Nothing ticked any more: put today back to how it was before this session touched it. */
function restoreBaseline(todayKey: string, sessionEnded: boolean) {
  const saved = safeStorage.getItem<{ dateKey: string; record?: Partial<WorkoutDayRecord> } | null>(BASELINE_KEY, null);
  if (!saved || saved.dateKey !== todayKey) return;
  const history = getTelemetryHistoryState();
  if (saved.record?.hasData) history.updateDayRecord(todayKey, 'workout', saved.record);
  else if (history.historyByDate[todayKey]?.workout?.hasData) history.clearDayRecord(todayKey, 'workout');
  if (sessionEnded) safeStorage.removeItem(BASELINE_KEY);
}

export type { NormalizedWorkoutMode, NormalizedWorkoutSubMode, WorkoutStoreState, WorkoutStoreActions };

// Hydrate saved session if available for 100% offline gym basement safety
const STORAGE_WORKOUT_KEY = 'o1fc_active_workout_session';
const savedExercisesRaw = safeStorage.getItem<any[]>(STORAGE_WORKOUT_KEY, []);
// Clean out any misclassified cardio items from resistance workout sessions
const savedExercises = (savedExercisesRaw || [])
  .filter(
    (e) => !e.name?.toLowerCase().startsWith('cardio:') && !e.name?.toLowerCase().includes('telemetry')
  )
    .map((e) => ({
      ...e,
      sets: (e.sets || []).map((s: any) => {
        if (s.completed) return s;
        const reps = Number(s.reps) || 0;
        const weight = Number(s.weightKg ?? s.weight) || 0;
        if (reps > 0 || weight > 0) return s;
        return { ...s, weightKg: 0, weight: 0, reps: 0, rpe: 0 };
      }),
    }));
const hydratedState: WorkoutStoreState = {
  ...initialWorkoutState,
  ...(savedExercises && savedExercises.length > 0
    ? {
        exercises: savedExercises,
        activeLogs: savedExercises,
        activeExercises: savedExercises,
        activeSession: true,
        ...computeSessionMetrics(savedExercises, false),
      }
    : {}),
};
if (savedExercises.length > 0) {
  safeStorage.setItem(STORAGE_WORKOUT_KEY, savedExercises);
}

const workoutStore = createStore<WorkoutStoreState, WorkoutStoreActions>(
  hydratedState,
  (set, get) => {
    const updateExercisesWithMetrics = (nextExercises: any[]) => {
      const metrics = computeSessionMetrics(nextExercises, get().isRestDayActive);
      
      // Save locally immediately - guaranteed zero data loss in gym basements
      if (nextExercises.length > 0) {
        safeStorage.setItem(STORAGE_WORKOUT_KEY, nextExercises);
        if (!isDeviceOnline()) {
          queueOfflineAction('exercise_set', { exercisesCount: nextExercises.length, timestamp: Date.now() });
        }
      } else {
        safeStorage.removeItem(STORAGE_WORKOUT_KEY);
      }

      set({
        exercises: nextExercises,
        activeLogs: nextExercises,
        activeExercises: nextExercises,
        sessionTonnageKg: metrics.sessionTonnageKg,
        completedSetsCount: metrics.completedSetsCount,
        totalRepsCount: metrics.totalRepsCount,
        recoveryEnergyScore: metrics.recoveryEnergyScore,
        weeklyVolumeData: nextExercises.length > 0 && get().weeklyVolumeData.length > 0
          ? get().weeklyVolumeData
          : metrics.weeklyVolumeData,
      });

      try {
        const ledger = sessionLedger(nextExercises);
        const todayKey = localTodayKey();
        if (ledger.completedSets > 0) {
          getTelemetryHistoryState().updateDayRecord(
            todayKey,
            'workout',
            mergeWorkoutDay(dayBaseline(todayKey), ledger, get().activeRoutine || ''),
          );
        } else {
          restoreBaseline(todayKey, nextExercises.length === 0);
        }
      } catch (err) {
        console.warn('[WorkoutStore] History sync warning:', err);
      }
    };


    return {
      setActiveSession: (active) => set({ activeSession: active }),
      setMode: (mode) => {
        const normalized: NormalizedWorkoutMode =
          mode.toUpperCase() === 'LIFT' ? 'Lift' : mode.toUpperCase() === 'SPORTS' ? 'Sports' : 'Recovery';
        set({ selectedMode: normalized });
        tactileEngine.triggerSelectionBuzz();
      },
      setSubMode: (sub) => {
        set({ subMode: sub });
        tactileEngine.triggerSelectionBuzz();
      },
      toggleExerciseHub: () => {
        tactileEngine.triggerSelectionBuzz();
        set({ isExerciseHubOpen: !get().isExerciseHubOpen });
      },
      setExerciseHubOpen: (open) => set({ isExerciseHubOpen: open }),
      addExerciseToActiveLog: (ex) => {
        tactileEngine.triggerSelectionBuzz();
        set({ activeSession: true });
        updateExercisesWithMetrics([ex, ...get().exercises]);
      },
      addExercisesToActiveLog: (newExs) => {
        tactileEngine.playPRCelebration();
        set({ activeSession: true });
        updateExercisesWithMetrics([...newExs, ...get().exercises]);
      },
      clearActiveLog: () => updateExercisesWithMetrics([]),
      commitSession: () => {
        const exercises = get().exercises;
        const ledger = sessionLedger(exercises);
        if (ledger.completedSets === 0) return null;
        const title = get().activeRoutine || 'Workout';
        const todayKey = localTodayKey();
        getTelemetryHistoryState().updateDayRecord(todayKey, 'workout', mergeWorkoutDay(dayBaseline(todayKey), ledger, title));
        safeStorage.removeItem(BASELINE_KEY);
        const committed = exercises
          .map((e) => ({ ...e, sets: (e.sets || []).filter((s) => s.completed) }))
          .filter((e) => e.sets.length > 0);
        updateExercisesWithMetrics([]);
        set({ activeSession: false, activeRoutine: '' });
        return { id: `session-${crypto.randomUUID()}`, title, dateKey: todayKey, ...ledger, items: committed };
      },
      cycleWallpaper: () => {
        tactileEngine.triggerDialHaptic();
        set({ currentWallpaperIndex: (get().currentWallpaperIndex + 1) % 3, customWallpaperUrl: null });
      },
      setWallpaperIndex: (index) => set({ currentWallpaperIndex: index, customWallpaperUrl: null }),
      setCustomWallpaperUrl: (url) => set({ customWallpaperUrl: url }),
      setActiveRoutine: (routine) => set({ activeRoutine: routine }),
      setActiveLogs: (exercisesOrUpdater) => {
        const current = get().exercises;
        const next = typeof exercisesOrUpdater === 'function' ? exercisesOrUpdater(current) : exercisesOrUpdater;
        updateExercisesWithMetrics(next);
      },
      setExercises: (exercisesOrUpdater) => {
        const current = get().exercises;
        const next = typeof exercisesOrUpdater === 'function' ? exercisesOrUpdater(current) : exercisesOrUpdater;
        updateExercisesWithMetrics(next);
      },
      swapExercise: (oldExerciseId, newExercise) => {
        tactileEngine.triggerSelectionBuzz();
        const updated = get().exercises.map((ex) =>
          ex.id === oldExerciseId
            ? { ...ex, ...newExercise, sets: newExercise.sets || ex.sets.map((s) => ({ ...s, completed: false })) }
            : ex
        );
        updateExercisesWithMetrics(updated);
      },
      deployProtocol: (newExercises) => updateExercisesWithMetrics([...newExercises, ...get().exercises]),
      loadSevenWorkouts: (programTitle) => {
        const sevenWorkouts = createSevenWorkouts(programTitle);
        updateExercisesWithMetrics([...sevenWorkouts, ...get().exercises]);
        tactileEngine.playPRCelebration();
      },
      postCardio: (cardioData) => {
        const now = new Date();
        const todayDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        try {
          useTelemetryHistoryStore.getState().updateDayRecord(todayDateKey, 'cardio', {
            hasData: true,
            durationMinutes: cardioData.durationMins,
            burnedKcal: cardioData.calories,
            distanceKm: 0,
            steps: cardioData.steps > 0 ? cardioData.steps : 0,
            avgHeartRateBpm: cardioData.avgHr > 0 ? cardioData.avgHr : 0,
            zone2Minutes: 0,
            activityType: cardioData.type || 'Cardio',
          });
        } catch {}
        tactileEngine.triggerSelectionBuzz();
      },
      appendExercise: (exercise) => {
        updateExercisesWithMetrics([exercise, ...get().exercises]);
        tactileEngine.triggerSelectionBuzz();
      },
      addRecoveryExercise: (drill) => {
        const recoveryEx = createRecoveryExercise(drill);
        updateExercisesWithMetrics([recoveryEx, ...get().exercises]);
        tactileEngine.triggerSelectionBuzz();
      },
      updateExerciseSet: (exerciseId, setNumber, updates) => {
        updateExercisesWithMetrics(updateSetInExercises(get().exercises, exerciseId, setNumber, updates));
      },
      updateSet: (exerciseId, setIndex, field, value) => {
        const exercises = get().exercises;
        const targetEx = exercises.find((e) => e.id === exerciseId);
        if (!targetEx) return;
        const targetSet = targetEx.sets[setIndex] ?? targetEx.sets.find((s) => s.setNumber === setIndex);
        const setNumber = targetSet ? targetSet.setNumber : setIndex + 1;
        if (field === 'completed' && value === true) tactileEngine.triggerSelectionBuzz();
        updateExercisesWithMetrics(updateSetInExercises(exercises, exerciseId, setNumber, { [field]: value }));
      },
      addSet: (exerciseId) => {
        tactileEngine.triggerDialHaptic();
        updateExercisesWithMetrics(addSetToExercises(get().exercises, exerciseId));
      },
      removeSet: (exerciseId, setNumber) => {
        tactileEngine.triggerSelectionBuzz();
        updateExercisesWithMetrics(removeSetFromExercises(get().exercises, exerciseId, setNumber));
      },
      toggleSetCompleted: (exerciseId, setNumber) => {
        const exercises = get().exercises;
        const targetEx = exercises.find((e) => e.id === exerciseId);
        const targetSet = targetEx?.sets.find((s) => s.setNumber === setNumber);
        const willComplete = targetSet ? !targetSet.completed : true;
        if (willComplete) tactileEngine.triggerSelectionBuzz();
        updateExercisesWithMetrics(toggleSetInExercises(exercises, exerciseId, setNumber, willComplete));
      },
      setHydrationLiters: (litersOrUpdater) => {
        const current = get().hydrationLiters;
        const next = typeof litersOrUpdater === 'function' ? litersOrUpdater(current) : litersOrUpdater;
        set({ hydrationLiters: Math.max(0, Math.min(3.0, Number(next.toFixed(2)))) });
      },
      toggleRestDay: () => {
        tactileEngine.triggerSelectionBuzz();
        const nextRest = !get().isRestDayActive;
        const metrics = computeSessionMetrics(get().exercises, nextRest);
        set({ isRestDayActive: nextRest, recoveryEnergyScore: metrics.recoveryEnergyScore });
      },
      setSupplementsLogged: (countOrUpdater) => {
        const current = get().supplementsLogged;
        const next = typeof countOrUpdater === 'function' ? countOrUpdater(current) : countOrUpdater;
        set({ supplementsLogged: Math.max(0, next) });
      },
      setSelectedProgramTitle: (title) => set({ selectedProgramTitle: title }),
      clearDailyWorkout: () => {
        updateExercisesWithMetrics([]);
        set({ activeSession: false, activeLogs: [], activeExercises: [], hydrationLiters: 0.0, supplementsLogged: 0 });
      },
      seedWorkoutDemo: () => {
        // Genuine data only - no mock seeding
      },
      clearWorkoutState: () => {
        updateExercisesWithMetrics([]);
        set({
          activeSession: false,
          activeLogs: [],
          activeExercises: [],
          isExerciseHubOpen: false,
          sessionTonnageKg: 0,
          completedSetsCount: 0,
          totalRepsCount: 0,
          weeklyVolumeData: [],
        });
      },
      showToast: () => {},
      clearToast: () => set({ toastMessage: null }),
    };
  }
);

export const useWorkoutStore = workoutStore.useStore;
export const getWorkoutState = workoutStore.getState;
export const setWorkoutState = workoutStore.setState;
export const workoutActions = workoutStore.actions;
