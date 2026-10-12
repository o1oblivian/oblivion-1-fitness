import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProgramDaySchedule {
  dayIndex: number;
  dayName: string; // e.g., 'Day 1', 'Day 2', 'Monday', 'Push Day'
  title: string; // e.g., 'Push Day • Chest & Shoulder Overload'
  focus: string; // e.g., 'Chest, Shoulders & Triceps'
  isRestDay: boolean;
  notes?: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weightKg: number;
    rpe: number;
    restSecs?: number;
    equipment?: string;
    targetMuscle?: string;
  }>;
}

export interface ActiveProgramState {
  hasActiveProgram: boolean;
  programId: string;
  programTitle: string;
  coachName: string;
  coachAvatar?: string;
  currentDayIndex: number; // 0-indexed day
  totalDays: number;
  schedule: ProgramDaySchedule[];
  lastCompletedDate: string | null;

  // Actions
  enrollProgram: (program: {
    id: string;
    title: string;
    coachName: string;
    coachAvatar?: string;
    schedule: ProgramDaySchedule[];
  }) => void;
  advanceToNextDay: () => ProgramDaySchedule | null;
  completeTodayAndAdvance: () => { nextDay: ProgramDaySchedule | null; isRestDay: boolean };
  getCurrentDayWorkout: () => ProgramDaySchedule | null;
  getNextDayWorkout: () => ProgramDaySchedule | null;
  clearActiveProgram: () => void;
}

export const useActiveProgramStore = create<ActiveProgramState>()(
  persist(
    (set, get) => ({
      hasActiveProgram: false,
      programId: '',
      programTitle: '',
      coachName: '',
      coachAvatar: '',
      currentDayIndex: 0,
      totalDays: 0,
      schedule: [],
      lastCompletedDate: null,

      enrollProgram: (program) => {
        set({
          hasActiveProgram: true,
          programId: program.id,
          programTitle: program.title,
          coachName: program.coachName,
          coachAvatar: program.coachAvatar || 'CV',
          currentDayIndex: 0,
          totalDays: program.schedule.length,
          schedule: program.schedule,
          lastCompletedDate: null,
        });
      },

      getCurrentDayWorkout: () => {
        const { schedule, currentDayIndex, hasActiveProgram } = get();
        if (!hasActiveProgram || !schedule || schedule.length === 0) return null;
        const safeIdx = currentDayIndex % (schedule.length || 1);
        return schedule[safeIdx] || null;
      },

      getNextDayWorkout: () => {
        const { schedule, currentDayIndex, hasActiveProgram } = get();
        if (!hasActiveProgram || !schedule || schedule.length === 0) return null;
        return schedule[(currentDayIndex + 1) % schedule.length] || null;
      },

      advanceToNextDay: () => {
        const { schedule, currentDayIndex } = get();
        if (!schedule || schedule.length === 0) return null;
        const nextIdx = (currentDayIndex + 1) % schedule.length;
        const now = new Date();
        set({
          currentDayIndex: nextIdx,
          lastCompletedDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        });
        return schedule[nextIdx] || null;
      },

      completeTodayAndAdvance: () => {
        const nextDay = get().advanceToNextDay();
        return {
          nextDay,
          isRestDay: Boolean(nextDay?.isRestDay),
        };
      },

      clearActiveProgram: () => {
        set({
          hasActiveProgram: false,
          currentDayIndex: 0,
        });
      },
    }),
    {
      name: 'o1fc_active_program_store',
    }
  )
);
