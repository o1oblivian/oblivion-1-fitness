import type { StoryArchetype } from '../components/modals/ProgramReelsModal';
import type { Athlete } from '../features/coach/services/coachService';
import type { ExploreCoach, ExploreReelItem } from '../features/reels/reelTypes';
import type { ProgramDetailInfo } from '../features/workout/data/programDetailsData';
import type { CoachDispatchedWorkout } from '../types/coach';

export interface CoverArt {
  id: string;
  title: string;
  url: string;
}

interface DevMockModule {
  MOCK_PROGRAMS?: Record<string, unknown>[];
  MOCK_COACHES?: Record<string, ExploreCoach>;
  MOCK_REELS?: ExploreReelItem[];
  MOCK_FLOOR_ATHLETES?: Athlete[];
  MOCK_ASSIGNED_WORKOUTS?: CoachDispatchedWorkout[];
  MOCK_COVER_ART?: CoverArt[];
  MOCK_ARCHETYPE_STORIES?: StoryArchetype[];
  MOCK_PROGRAM_DETAILS?: Record<string, ProgramDetailInfo>;
}

// Picks up src/devMocks/* on the dev server only. Deleting that folder needs no other code change,
// and release builds never include it.
const modules: DevMockModule[] = import.meta.env.DEV
  ? Object.values(import.meta.glob<DevMockModule>('../devMocks/*.ts', { eager: true }))
  : [];

function collect<T>(pick: (mod: DevMockModule) => T[] | undefined): T[] {
  return modules.flatMap((mod) => pick(mod) ?? []);
}

/** Rows in the `program_catalog` shape, so they flow through the same mapper as real rows. */
export const mockProgramRows = () => collect((mod) => mod.MOCK_PROGRAMS);
export const mockCoaches = () => collect((mod) => (mod.MOCK_COACHES ? Object.values(mod.MOCK_COACHES) : undefined));
export const mockReels = () => collect((mod) => mod.MOCK_REELS);
export const mockFloorAthletes = () => collect((mod) => mod.MOCK_FLOOR_ATHLETES);
export const mockAssignedWorkouts = () => collect((mod) => mod.MOCK_ASSIGNED_WORKOUTS);
export const mockCoverArt = () => collect((mod) => mod.MOCK_COVER_ART);
export const mockArchetypeStories = () => collect((mod) => mod.MOCK_ARCHETYPE_STORIES);

export function mockProgramDetails(): Record<string, ProgramDetailInfo> {
  return Object.assign({}, ...modules.map((mod) => mod.MOCK_PROGRAM_DETAILS ?? {}));
}
