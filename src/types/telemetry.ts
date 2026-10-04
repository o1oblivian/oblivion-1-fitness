import { MacroTarget, MealSectionData } from './fuel';

export type TrainingSplit = 'Push' | 'Full' | 'Legs' | 'Custom' | 'Pull' | 'HYBRID PERIODIZATION';

export interface MicrocycleDayTelemetry {
  date: string;
  dayName: string;
  locomotiveStrain: number;
  readinessScore: number;
  recoveryPercent: number;
  sleepHours: number;
  deepSleepHours: number;
  rhrBpm: number;
  hrvMs: number;
  totalVolumeKg: number;
}

export interface SupplementScheduleItem {
  readonly id: string;
  readonly name: string;
  readonly time: string;
  readonly dosage: string;
  readonly taken: boolean;
}

export interface TelemetryMetrics {
  readonly hydration: {
    readonly current: number;
    readonly target: number;
    readonly unit: 'L' | 'ml';
  };
  readonly bioSync: {
    readonly phase: 'Follicular' | 'Ovulatory' | 'Luteal' | 'Menstrual';
    readonly day: number;
    readonly peakStatus: string;
  };
  readonly supplements: {
    readonly logged: number;
    readonly total: number;
    readonly items: readonly SupplementScheduleItem[];
  };
  readonly fastCleanStreak: number;
}

export interface HydrationLogEntry {
  readonly id: string;
  readonly amountLiters: number;
  readonly timestamp: string;
}

export interface FuelDayLog {
  readonly caloriesBudget: number;
  readonly eaten: number;
  readonly burned: number;
  readonly macros: {
    readonly protein: MacroTarget;
    readonly carbs: MacroTarget;
    readonly fats: MacroTarget;
  };
  readonly meals: readonly MealSectionData[];
  readonly hydrationLogs: readonly HydrationLogEntry[];
}
