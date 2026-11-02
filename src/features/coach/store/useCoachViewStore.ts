import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CoachRootView = 'athlete' | 'coach';
const FLOOR_TABS = ['programs', 'floor', 'directives', 'inbox', 'earnings'] as const;
export type CoachFloorTab = (typeof FLOOR_TABS)[number];

function isFloorTab(value: unknown): value is CoachFloorTab {
  return typeof value === 'string' && (FLOOR_TABS as readonly string[]).includes(value);
}

interface CoachViewState {
  view: CoachRootView;
  floorTab: CoachFloorTab;
  /** Last answer to "does this account have a public coach card", so the tab opens on the right layout. */
  coachCard: { userId: string; has: boolean } | null;
  setView: (view: CoachRootView) => void;
  setFloorTab: (tab: CoachFloorTab) => void;
  setCoachCard: (userId: string, has: boolean) => void;
}

interface CoachAccessInput {
  role?: string;
  userId: string;
  validUserId: boolean;
  cached: { userId: string; has: boolean } | null;
  checkFailed: boolean;
}

/**
 * Decides which Coach layout to paint. `awaitingFirstCheck` means "show nothing yet":
 * painting the athlete view for a coach and then swapping it is the flash this prevents.
 */
export function resolveCoachAccess({
  role,
  userId,
  validUserId,
  cached,
  checkFailed,
}: CoachAccessInput) {
  const known = cached && cached.userId === userId ? cached.has : null;
  return {
    isCoach: role === 'coach' || known === true,
    awaitingFirstCheck: role !== 'coach' && known === null && validUserId && !checkFailed,
  };
}

/** Which Coach tab view and console section a coach last had open; survives navigation and restarts. */
export const useCoachViewStore = create<CoachViewState>()(
  persist(
    (set) => ({
      view: 'coach',
      floorTab: 'floor',
      coachCard: null,
      setView: (view) => set({ view }),
      setFloorTab: (floorTab) => set({ floorTab }),
      setCoachCard: (userId, has) => set({ coachCard: { userId, has } }),
    }),
    {
      name: 'o1fc_coach_view',
      version: 1,
      // Version 0 could have saved the retired Films tab; anything unknown opens on Clients.
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<CoachViewState>;
        return { ...state, floorTab: isFloorTab(state.floorTab) ? state.floorTab : 'floor' };
      },
    },
  ),
);
