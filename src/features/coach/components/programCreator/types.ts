export type ProgramCategory =
  | 'Hypertrophy'
  | 'Push Pull Legs'
  | 'Strength'
  | 'Powerlifting'
  | 'HYROX'
  | 'Combat & Boxing'
  | 'Endurance'
  | 'Mobility'
  | 'Sport-Specific'
  | 'Calisthenics'
  | 'Conditioning'
  | 'Body Recomp'
  | 'Weight Loss'
  | 'Upper / Lower'
  | 'Full Body'
  | 'Beginner Friendly';

export type ProgramDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';

export interface ProgramExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  cue?: string;
  demoUrl?: string;
}

export interface ProgramDayPlan {
  id: string;
  dayName: string;
  splitFocus: string;
  exercises: ProgramExerciseItem[];
}

export interface ProgramWeekPlan {
  weekNumber: number;
  days: ProgramDayPlan[];
}

export interface ProgramFormData {
  title: string;
  description: string;
  shortOverview: string;
  fullMethodology: string;
  descriptionMode: 'short' | 'methodology';
  category: ProgramCategory;
  difficulty: ProgramDifficulty;
  durationWeeks: number;
  trainingDaysPerWeek: number;
  coverImage: string;
  coverSource: 'vault' | 'presets' | 'upload' | 'url';
  weeks: ProgramWeekPlan[];
  isFreeCommunity: boolean;
  priceUsd: number;
  discountPercent: number;
  startDate?: string;
  endDate?: string;
}
