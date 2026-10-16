import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CoachRootView = 'athlete' | 'coach';
export type CoachFloorTab = 'films' | 'programs' | 'floor' | 'directives' | 'inbox' | 'earnings';

interface CoachViewState {
  view: CoachRootView;
  floorTab: CoachFloorTab;
  setView: (view: CoachRootView) => void;
  setFloorTab: (tab: CoachFloorTab) => void;
}

/** Which Coach tab view and console section a coach last had open; survives navigation and restarts. */
export const useCoachViewStore = create<CoachViewState>()(
  persist(
    (set) => ({
      view: 'coach',
      floorTab: 'floor',
      setView: (view) => set({ view }),
      setFloorTab: (floorTab) => set({ floorTab }),
    }),
    { name: 'o1fc_coach_view' },
  ),
);
