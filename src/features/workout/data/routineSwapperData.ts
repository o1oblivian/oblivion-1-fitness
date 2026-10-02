import { ExerciseItem } from '../../../types';

export interface RoutinePresetItem {
  id: string;
  title: string;
  split: string;
  desc: string;
  volume: string;
  tier: string;
}

export interface MuscleSubstitutionItem {
  muscle: string;
  tag: string;
  exercises: ExerciseItem[];
}

export const PRESET_SPLITS: RoutinePresetItem[] = [
  {
    id: 'p1',
    title: 'Functional Hypertrophy',
    split: '4-Day Clavicular & Posterior Chain Priority',
    desc: 'Heavy mechanical tension matched with full active ROM. Maximum V-taper aesthetics.',
    volume: '16 Sets / Session',
    tier: 'Pro Builder',
  },
  {
    id: 'p2',
    title: 'Hybrid Hyrox',
    split: '3-Day Ergometer & Functional Power Split',
    desc: 'Combines threshold sled pulls, wall-balls, ski-erg pacing, and heavy lunges.',
    volume: 'Timed Intervals',
    tier: 'Endurance Elite',
  },
  {
    id: 'p3',
    title: 'Push / Pull / Legs (PPL)',
    split: '6-Day High-Frequency Periodization',
    desc: 'Classic bodybuilding microcycle. Dedicated chest/delts, posterior lats, and legs.',
    volume: '18 Sets / Session',
    tier: 'Master Protocol',
  },
  {
    id: 'p4',
    title: 'Upper / Lower Power',
    split: '4-Day High CNS Strength Split',
    desc: 'Compound wave loading on Squat, Bench, and Deadlift paired with core work.',
    volume: '14 Sets / Session',
    tier: 'Powerlifting',
  },
];

export const MUSCLE_SUBSTITUTIONS: MuscleSubstitutionItem[] = [
  {
    muscle: 'Chest & Pecs Focus',
    tag: 'ANTERIOR PUSH',
    exercises: [
      {
        id: 'sub-ch-1',
        name: 'Incline Dumbbell Press',
        targetMuscle: 'Upper Pecs',
        sets: [
          { setNumber: 1, weightKg: 36, reps: 10, rpe: 8.5, completed: false },
          { setNumber: 2, weightKg: 38, reps: 8, rpe: 9.0, completed: false },
          { setNumber: 3, weightKg: 40, reps: 6, rpe: 9.5, completed: false },
        ],
        restSecs: 90,
      },
      {
        id: 'sub-ch-2',
        name: 'Flat Barbell Bench Press',
        targetMuscle: 'Mid Pecs',
        sets: [
          { setNumber: 1, weightKg: 90, reps: 8, rpe: 8.0, completed: false },
          { setNumber: 2, weightKg: 95, reps: 6, rpe: 8.5, completed: false },
        ],
        restSecs: 120,
      },
      {
        id: 'sub-ch-3',
        name: 'Cable Chest Flyes',
        targetMuscle: 'Sternal Pecs',
        sets: [
          { setNumber: 1, weightKg: 20, reps: 12, rpe: 8.0, completed: false },
          { setNumber: 2, weightKg: 22.5, reps: 12, rpe: 9.0, completed: false },
        ],
        restSecs: 60,
      },
    ],
  },
  {
    muscle: 'Back & Lats Focus',
    tag: 'POSTERIOR PULL',
    exercises: [
      {
        id: 'sub-bk-1',
        name: 'Weighted Neutral Pull-Ups',
        targetMuscle: 'Lats & Teres Major',
        sets: [
          { setNumber: 1, weightKg: 20, reps: 6, rpe: 8.5, completed: false },
          { setNumber: 2, weightKg: 20, reps: 6, rpe: 9.0, completed: false },
        ],
        restSecs: 120,
      },
      {
        id: 'sub-bk-2',
        name: 'Chest-Supported T-Bar Row',
        targetMuscle: 'Rhomboids & Traps',
        sets: [
          { setNumber: 1, weightKg: 65, reps: 10, rpe: 8.0, completed: false },
          { setNumber: 2, weightKg: 70, reps: 8, rpe: 8.5, completed: false },
        ],
        restSecs: 90,
      },
      {
        id: 'sub-bk-3',
        name: 'Barbell Romanian Deadlift',
        targetMuscle: 'Spinal Erectors & Hamstrings',
        sets: [
          { setNumber: 1, weightKg: 120, reps: 8, rpe: 8.0, completed: false },
          { setNumber: 2, weightKg: 130, reps: 6, rpe: 8.5, completed: false },
        ],
        restSecs: 120,
      },
    ],
  },
  {
    muscle: 'Legs & Posterior Chain',
    tag: 'LOWER KINETIC',
    exercises: [
      {
        id: 'sub-lg-1',
        name: 'Barbell Paused Back Squat',
        targetMuscle: 'Quads & Glute Max',
        sets: [
          { setNumber: 1, weightKg: 125, reps: 5, rpe: 8.5, completed: false },
          { setNumber: 2, weightKg: 130, reps: 5, rpe: 9.0, completed: false },
        ],
        restSecs: 150,
      },
      {
        id: 'sub-lg-2',
        name: 'Bulgarian Split Squat',
        targetMuscle: 'Quad Vastus & Glutes',
        sets: [
          { setNumber: 1, weightKg: 28, reps: 10, rpe: 8.5, completed: false },
          { setNumber: 2, weightKg: 30, reps: 8, rpe: 9.0, completed: false },
        ],
        restSecs: 90,
      },
    ],
  },
  {
    muscle: 'Shoulders & Arms Focus',
    tag: 'UPPER ACCESSORY',
    exercises: [
      {
        id: 'sub-sh-1',
        name: 'Standing Overhead Barbell Press',
        targetMuscle: 'Anterior & Medial Delts',
        sets: [
          { setNumber: 1, weightKg: 60, reps: 6, rpe: 8.5, completed: false },
          { setNumber: 2, weightKg: 62.5, reps: 5, rpe: 9.0, completed: false },
        ],
        restSecs: 90,
      },
      {
        id: 'sub-sh-2',
        name: 'Cable Lateral Deltoid Raise',
        targetMuscle: 'Lateral Delts',
        sets: [
          { setNumber: 1, weightKg: 12.5, reps: 15, rpe: 8.5, completed: false },
          { setNumber: 2, weightKg: 15, reps: 12, rpe: 9.0, completed: false },
        ],
        restSecs: 60,
      },
    ],
  },
];
