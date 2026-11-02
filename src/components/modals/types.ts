import type { ExploreReelItem } from '../../features/reels/reelTypes';

export type ModalType =
  | 'SETTINGS'
  | 'REELS'
  | 'COACH_PROFILE'
  | 'CARDIO_SCANNER'
  | 'EXERCISE_SWAPPER'
  | 'HYDRATION'
  | 'SUPPLEMENTS';

export interface ReelsPayload {
  initialMode?: 'grid' | 'player';
  initialReelId?: string;
  initialCategory?: ExploreReelItem['category'];
  /** Opens the upload sheet straight away. */
  openUpload?: boolean;
}

export interface CoachProfilePayload {
  coachId: string;
  initialTab?: 'programs' | 'coaching';
}

export interface ExerciseSwapperPayload {
  activePreset?: string;
  onSelectPreset?: (preset: string) => void;
}

export interface HydrationPayload {
  currentLiters?: number;
  onAddLiters?: (amount: number) => void;
}

export interface GenericToastPayload {
  onShowToast?: (msg: string) => void;
}

export type ModalPayloadMap = {
  SETTINGS: GenericToastPayload;
  REELS: ReelsPayload;
  COACH_PROFILE: CoachProfilePayload;
  CARDIO_SCANNER: Record<string, never>;
  EXERCISE_SWAPPER: ExerciseSwapperPayload;
  HYDRATION: HydrationPayload;
  SUPPLEMENTS: GenericToastPayload;
};
