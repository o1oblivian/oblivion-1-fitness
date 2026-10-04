export type ModalType =
  | 'SETTINGS'
  | 'BIOMETRIC_SHEET'
  | 'FULL_ELITE_REELS'
  | 'CARDIO_SCANNER'
  | 'MEAL_SCANNER'
  | 'TRAVEL_PASS'
  | 'EXERCISE_SWAPPER'
  | 'HYDRATION'
  | 'BIO_SYNC'
  | 'SUPPLEMENTS'
  | 'PROGRAM_REELS_STORY';

export interface MealScannerPayload {
  defaultSlot?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drinks' | 'supplements';
  onConfirmMeal?: (mealName: string, kcal: number, p: number, c: number, f: number) => void;
}

export interface ProgramReelsStoryPayload {
  initialStoryId?: string;
  onAdoptBlueprint?: (title: string) => void;
}

export interface CardioScannerPayload {
  onPostCardio?: (data: {
    type: string;
    calories: number;
    durationMins: number;
    avgHr: number;
    steps: number;
  }) => void;
}

export interface TravelPassPayload {
  programTitle?: string;
  onLoadWorkouts?: (title: string) => void;
}

export interface ExerciseSwapperPayload {
  activePreset?: string;
  onSelectPreset?: (preset: string) => void;
}

export interface HydrationPayload {
  currentLiters?: number;
  onAddLiters?: (amount: number) => void;
}

export interface BioSyncPayload {
  onAutoAdjust?: () => void;
}

export interface GenericToastPayload {
  onShowToast?: (msg: string) => void;
}

export type ModalPayloadMap = {
  SETTINGS: GenericToastPayload;
  BIOMETRIC_SHEET: GenericToastPayload;
  FULL_ELITE_REELS: Record<string, never>;
  CARDIO_SCANNER: CardioScannerPayload;
  MEAL_SCANNER: MealScannerPayload;
  TRAVEL_PASS: TravelPassPayload;
  EXERCISE_SWAPPER: ExerciseSwapperPayload;
  HYDRATION: HydrationPayload;
  BIO_SYNC: BioSyncPayload;
  SUPPLEMENTS: GenericToastPayload;
  PROGRAM_REELS_STORY: ProgramReelsStoryPayload;
};
