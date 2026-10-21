export type AthleticVector =
  | 'Push Alpha'
  | 'Push Beta'
  | 'Pull Alpha'
  | 'Pull Beta'
  | 'Legs Alpha'
  | 'Legs Beta'
  | 'Upper Body'
  | 'Lower Body'
  | 'Speed & COD'
  | 'Hyrox/Metcon'
  | 'Strength S&C'
  | 'Bio-Recovery';

export type SessionDuration = '20m' | '30m' | '45m' | '60m' | '75m';
export type FacilityGear = 'Full Gym' | 'DB & Bench' | 'Bodyweight';
export type IntensityMode = 'Progressive RPE' | 'Failure Dropset';

export interface SynthesizedBlueprintExercise {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  rpe: string;
  tempo: string;
  cue: string;
  targetWeightKg: number;
}

export interface SynthesizedBlueprint {
  id: string;
  vector: AthleticVector;
  title: string;
  tagline: string;
  durationMins: number;
  movesCount: number;
  totalSets: number;
  intensityMode: IntensityMode;
  gear: FacilityGear;
  exercises: SynthesizedBlueprintExercise[];
}

/** How long the session is: minutes, how many exercises to list, and the usual sets for each. */
export interface DurationConfig {
  mins: number;
  moves: number;
  setsPerMove: number;
}

/** What each blueprint builder needs: the athlete's choices and the session length they imply. */
export interface BlueprintContext {
  duration: SessionDuration;
  gear: FacilityGear;
  intensity: IntensityMode;
  config: DurationConfig;
}

export type BlueprintBuilder = (context: BlueprintContext) => SynthesizedBlueprint;
