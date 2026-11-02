export type ModalType =
  | 'SETTINGS'
  | 'COACH_PROFILE'
  | 'CARDIO_SCANNER'
  | 'EXERCISE_SWAPPER'
  | 'HYDRATION'
  | 'SUPPLEMENTS';

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
  COACH_PROFILE: CoachProfilePayload;
  CARDIO_SCANNER: Record<string, never>;
  EXERCISE_SWAPPER: ExerciseSwapperPayload;
  HYDRATION: HydrationPayload;
  SUPPLEMENTS: GenericToastPayload;
};
