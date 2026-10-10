import { create } from 'zustand';
import { tactileEngine } from '../services/tactileEngine';
import { persistFinishedLocal } from '../features/coach/services/coachBridge';
import { CoachStore, CoachState, CoachAthleteRecord } from './coachTypes';

export * from './coachTypes';

export const SAMPLE_COACH_ATHLETES: CoachAthleteRecord[] = [];

const initialState: CoachState = {
  selectedSubTab: 'INTEL',
  activeRosterCount: 0,
  rosterFilter: 'ALL',
  isRosterOpen: true,
  athletes: [],
  squadAthletes: [],
  isDispatcherOpen: false,
  selectedAthleteForDirective: null,
  toastMessage: null,
  liveTelemetry: {},
  finishedWorkouts: [],
  finishNotifications: [],
  directives: [],
  assignedWorkouts: [],
  earningsTransactions: [],
  auditAthlete: null,
  assignAthlete: null,
};

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export const useCoachStore = create<CoachStore>((set, get) => ({
  ...initialState,

  setSelectedSubTab: (tab) => {
    tactileEngine.triggerSelectionBuzz();
    set({ selectedSubTab: tab });
  },

  setRosterFilter: (filter) => {
    tactileEngine.triggerSelectionBuzz();
    set({ rosterFilter: filter });
  },

  toggleRoster: (open) => {
    tactileEngine.triggerSelectionBuzz();
    set((s) => ({ isRosterOpen: open !== undefined ? open : !s.isRosterOpen }));
  },

  toggleDispatcher: (open, athleteId) => {
    tactileEngine.triggerSelectionBuzz();
    set((s) => ({
      isDispatcherOpen: open !== undefined ? open : !s.isDispatcherOpen,
      selectedAthleteForDirective: athleteId !== undefined ? athleteId : s.selectedAthleteForDirective,
    }));
  },

  dispatchDirective: (payload) => {
    tactileEngine.playPRCelebration();
    const athlete = get().athletes.find((a) => a.id === payload.targetAthleteId);
    const athleteName = athlete ? athlete.name : 'Roster Squad';

    set((s) => {
      const updatedAthletes = s.athletes.map((a) => {
        if (a.id !== payload.targetAthleteId) return a;
        return {
          ...a,
          split: `${payload.split} (RPE ${payload.intensityRpe})`,
          status: `Directive Dispatched: ${payload.coachMemo || payload.split}`,
          lastActive: 'Just now',
          needsReview: false,
        };
      });

      return {
        isDispatcherOpen: false,
        athletes: updatedAthletes,
      };
    });

    get().showToast(`Directive Dispatched to ${athleteName}: ${payload.split} @ RPE ${payload.intensityRpe}`);
  },

  populateSampleRoster: () => {
    tactileEngine.playTimerChime();
    set({
      athletes: SAMPLE_COACH_ATHLETES,
      activeRosterCount: SAMPLE_COACH_ATHLETES.length,
    });
    get().showToast(`Enrolled ${SAMPLE_COACH_ATHLETES.length} athletes into tactical roster.`);
  },

  clearRoster: () => {
    tactileEngine.triggerSelectionBuzz();
    set({ athletes: [], activeRosterCount: 0 });
    get().showToast('Roster flushed to zero active athletes.');
  },

  showToast: (_msg) => {
    // Intentionally neutralized: in-app toast banners disabled permanently
  },

  clearToast: () => {
    if (toastTimeout) clearTimeout(toastTimeout);
    set({ toastMessage: null });
  },

  deployDirective: (dir) => {
    tactileEngine.playTimerChime();
    get().showToast(`Deployed ${dir.tag} directive: "${dir.title}"`);
  },

  setSquadAthletes: (ath) => set({ squadAthletes: ath }),
  setAuditAthlete: (ath) => set({ auditAthlete: ath }),
  setAssignAthlete: (ath) => set({ assignAthlete: ath }),
  completeAudit: (id) => {
    tactileEngine.playPRCelebration();
    get().showToast(`Audit confirmed for athlete #${id}. Score: 98% Optimal.`);
  },
  confirmAssign: (id, name) => {
    tactileEngine.playTimerChime();
    get().showToast(`Assigned protocol "${name}".`);
  },
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
    set((s) => ({
      liveTelemetry: {
        ...s.liveTelemetry,
        [telemetry.athleteId]: telemetry,
      },
    }));
  },
  recordFinishedWorkout: (log) => {
    tactileEngine.playPRCelebration();
    const completedAt = log.completedAt && !Number.isNaN(new Date(log.completedAt).getTime())
      ? log.completedAt
      : new Date().toISOString();
    const stored = { ...log, completedAt };
    persistFinishedLocal(stored);
    const notification = {
      id: `notif-${Date.now()}`,
      athleteId: log.athleteId,
      athleteName: log.athleteName,
      workoutTitle: log.title,
      tonnageKg: log.tonnageKg,
      timestamp: 'Just now',
      read: false,
    };
    set((s) => ({
      finishedWorkouts: [stored, ...s.finishedWorkouts.filter((row) => row.id !== stored.id)],
      finishNotifications: [notification, ...s.finishNotifications],
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
  submitCoachFeedback: (workoutId, feedback) => {
    tactileEngine.triggerImpactPulse();
    set((s) => ({
      finishedWorkouts: s.finishedWorkouts.map((w) =>
        w.id === workoutId
          ? { ...w, feedback, feedbackGivenAt: 'Just now' }
          : w
      ),
    }));
  },
  clearNotifications: () => {
    set((s) => ({
      finishNotifications: s.finishNotifications.map((n) => ({ ...n, read: true })),
    }));
  },
}));

export default useCoachStore;
