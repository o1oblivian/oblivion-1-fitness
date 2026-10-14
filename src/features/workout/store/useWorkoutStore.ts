import { createStore } from '../../../utils/createStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { safeStorage } from '../../../utils/safeStorage';
import {
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
  addSetToExercises,
  completeSetsBefore,
  removeSetFromExercises,
  toggleSetInExercises,
  updateSetInExercises,
  computeSessionMetrics,
  sessionLedger,
  mergeWorkoutDay,
} from './workoutSetOperations';
import { estimateSessionEnergy, resetSessionClock, trackSessionClock } from '../utils/sessionEnergy';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { useRestTimerStore } from './useRestTimerStore';
import { prefillFromHistory } from '../services/setCoach';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';
import type { ExerciseItem, ExerciseSet } from '../../../types';

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
const savedExercisesRaw = safeStorage.getItem<ExerciseItem[]>(STORAGE_WORKOUT_KEY, []);
// Clean out any misclassified cardio items from resistance workout sessions
const savedExercises = (savedExercisesRaw || [])
  .filter(
    (e) => !e.name?.toLowerCase().startsWith('cardio:') && !e.name?.toLowerCase().includes('telemetry')
  )
    .map((e) => ({
      ...e,
      sets: (e.sets || []).map((s: ExerciseSet) => {
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
    const updateExercisesWithMetrics = (nextExercises: ExerciseItem[]) => {
      const metrics = computeSessionMetrics(nextExercises, get().isRestDayActive);
      
      if (nextExercises.length > 0) {
        safeStorage.setItem(STORAGE_WORKOUT_KEY, nextExercises);
      } else {
        safeStorage.removeItem(STORAGE_WORKOUT_KEY);
      }

      set({
        exercises: nextExercises,
        activeLogs: nextExercises,
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
        trackSessionClock(ledger.completedSets);
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
      addExerciseToActiveLog: (ex) => {
        tactileEngine.triggerSelectionBuzz();
        set({ activeSession: true });
        updateExercisesWithMetrics([...prefillFromHistory([ex]), ...get().exercises]);
      },
      addExercisesToActiveLog: (newExs) => {
        tactileEngine.playPRCelebration();
        set({ activeSession: true });
        updateExercisesWithMetrics([...prefillFromHistory(newExs), ...get().exercises]);
      },
      clearActiveLog: () => updateExercisesWithMetrics([]),
      commitSession: () => {
        const exercises = get().exercises;
        const ledger = sessionLedger(exercises);
        if (ledger.completedSets === 0) return null;
        const title = get().activeRoutine || 'Workout';
        const todayKey = localTodayKey();
        const committed = exercises
          .map((e) => ({ ...e, sets: (e.sets || []).filter((s) => s.completed) }))
          .filter((e) => e.sets.length > 0);
        const energy = estimateSessionEnergy(committed, ledger.completedSets);
        getTelemetryHistoryState().updateDayRecord(todayKey, 'workout', mergeWorkoutDay(dayBaseline(todayKey), ledger, title, energy));
        if (energy.burnedKcal) useFuelStore.getState().logBurned(energy.burnedKcal);
        safeStorage.removeItem(BASELINE_KEY);
        resetSessionClock();
        useRestTimerStore.getState().skip();
        updateExercisesWithMetrics([]);
        set({ activeSession: false, activeRoutine: '' });
        return { id: `session-${crypto.randomUUID()}`, title, dateKey: todayKey, ...ledger, items: committed, ...energy };
      },
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
      deployProtocol: (newExercises) => updateExercisesWithMetrics([...prefillFromHistory(newExercises), ...get().exercises]),
      updateExerciseSet: (exerciseId, setNumber, updates) => {
        updateExercisesWithMetrics(updateSetInExercises(get().exercises, exerciseId, setNumber, updates));
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
        const toggled = toggleSetInExercises(exercises, exerciseId, setNumber, willComplete);
        updateExercisesWithMetrics(willComplete ? completeSetsBefore(toggled, exerciseId, setNumber) : toggled);
        const restTimer = useRestTimerStore.getState();
        const autoRest = readAthleteSettingsSnapshot().defaultRestSeconds !== 0;
        if (willComplete && targetEx && autoRest) restTimer.start(Number(targetEx.restSecs) || 90, targetEx.name || targetEx.exerciseName || 'Rest');
        else if (!willComplete && restTimer.timer?.exerciseName === (targetEx?.name || targetEx?.exerciseName)) restTimer.skip();
      },
      completeEarlierSets: (exerciseId, setNumber) => {
        const current = get().exercises;
        const next = completeSetsBefore(current, exerciseId, setNumber);
        if (next !== current) updateExercisesWithMetrics(next);
      },
      clearDailyWorkout: () => {
        updateExercisesWithMetrics([]);
        set({ activeSession: false, activeRoutine: '' });
      },
    };
  }
);

export const useWorkoutStore = workoutStore.useStore;
export const getWorkoutState = workoutStore.getState;
export const setWorkoutState = workoutStore.setState;
export const workoutActions = workoutStore.actions;
