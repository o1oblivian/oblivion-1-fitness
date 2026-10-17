import { create } from 'zustand';
import { tactileEngine } from '../services/tactileEngine';
import { CoachStore, CoachState } from './coachTypes';

export * from './coachTypes';

const initialState: CoachState = {
  athletes: [],
  liveTelemetry: {},
  finishedWorkouts: [],
  assignedWorkouts: [],
};

const newestFirst = (a: { completedAt: string }, b: { completedAt: string }) => b.completedAt.localeCompare(a.completedAt);

export const useCoachStore = create<CoachStore>((set) => ({
  ...initialState,

  dispatchWorkout: (workout) => {
    tactileEngine.triggerSelectionBuzz();
    set((s) => ({ assignedWorkouts: [workout, ...s.assignedWorkouts.filter((row) => row.id !== workout.id)] }));
  },
  ingestAssigned: (workout) => {
    set((s) => {
      if (s.assignedWorkouts.some((row) => row.id === workout.id)) return s;
      return { assignedWorkouts: [workout, ...s.assignedWorkouts] };
    });
  },
  completeAssigned: (id) => {
    set((s) => ({ assignedWorkouts: s.assignedWorkouts.filter((row) => row.id !== id) }));
  },
  updateLiveTelemetry: (telemetry) => {
    set((s) => ({ liveTelemetry: { ...s.liveTelemetry, [telemetry.athleteId]: telemetry } }));
  },
  recordFinishedWorkout: (log) => {
    tactileEngine.playPRCelebration();
    set((s) => ({
      liveTelemetry: {
        ...s.liveTelemetry,
        [log.athleteId]: {
          ...(s.liveTelemetry[log.athleteId] || { sessionTonnageKg: log.tonnageKg }),
          athleteId: log.athleteId,
          athleteName: log.athleteName,
          isLive: false,
          lastUpdated: 'Completed just now',
        },
      },
    }));
  },
  setFinishedWorkouts: (rows) => set({ finishedWorkouts: [...rows].sort(newestFirst) }),
  upsertFinishedWorkout: (row) => {
    set((s) => ({ finishedWorkouts: [row, ...s.finishedWorkouts.filter((w) => w.id !== row.id)].sort(newestFirst) }));
  },
  applyWorkoutFeedback: (workoutId, feedback, givenAt) => {
    set((s) => ({
      finishedWorkouts: s.finishedWorkouts.map((w) => (w.id === workoutId ? { ...w, feedback, feedbackGivenAt: givenAt } : w)),
    }));
  },
}));


