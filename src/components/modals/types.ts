export type ModalType =
  | 'SETTINGS'
  | 'FULL_ELITE_REELS'
  | 'CARDIO_SCANNER'
  | 'TRAVEL_PASS'
  | 'EXERCISE_SWAPPER'
  | 'HYDRATION'
  | 'SUPPLEMENTS';

export interface EliteReelsPayload {
  initialMode?: 'grid' | 'player';
  initialReelId?: string;
  initialCoachId?: string;
  initialProfileTab?: 'reels' | 'programs' | 'coaching';
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

export interface GenericToastPayload {
  onShowToast?: (msg: string) => void;
}

export type ModalPayloadMap = {
  SETTINGS: GenericToastPayload;
  FULL_ELITE_REELS: EliteReelsPayload;
  CARDIO_SCANNER: CardioScannerPayload;
  TRAVEL_PASS: TravelPassPayload;
  EXERCISE_SWAPPER: ExerciseSwapperPayload;
  HYDRATION: HydrationPayload;
  SUPPLEMENTS: GenericToastPayload;
};
