import { ExerciseItem } from '../../../types';

export const DEFAULT_DISPATCHED_EXERCISES: ExerciseItem[] = [
  {
    id: 'coach-ex-1',
    name: 'Incline Barbell Bench Press',
    targetMuscle: 'Upper Chest',
    restSecs: 90,
    equipment: 'barbell',
    tier: 'Coach Directive',
    sets: [
      { setNumber: 1, weightKg: 75, reps: 8, rpe: 8.0, completed: false },
      { setNumber: 2, weightKg: 80, reps: 8, rpe: 8.5, completed: false },
      { setNumber: 3, weightKg: 80, reps: 8, rpe: 8.5, completed: false },
      { setNumber: 4, weightKg: 82.5, reps: 6, rpe: 9.0, completed: false },
    ],
  },
  {
    id: 'coach-ex-2',
    name: 'Seated DB Shoulder Press',
    targetMuscle: 'Front Deltoids',
    restSecs: 90,
    equipment: 'dumbbell',
    tier: 'Coach Directive',
    sets: [
      { setNumber: 1, weightKg: 26, reps: 10, rpe: 8.0, completed: false },
      { setNumber: 2, weightKg: 28, reps: 10, rpe: 8.5, completed: false },
      { setNumber: 3, weightKg: 28, reps: 8, rpe: 9.0, completed: false },
    ],
  },
  {
    id: 'coach-ex-3',
    name: 'Cable Lateral Raise',
    targetMuscle: 'Lateral Deltoids',
    restSecs: 60,
    equipment: 'cable',
    tier: 'Coach Directive',
    sets: [
      { setNumber: 1, weightKg: 10, reps: 12, rpe: 8.5, completed: false },
      { setNumber: 2, weightKg: 12, reps: 12, rpe: 9.0, completed: false },
      { setNumber: 3, weightKg: 12, reps: 12, rpe: 9.0, completed: false },
    ],
  },
  {
    id: 'coach-ex-4',
    name: 'Incline Cable Flye',
    targetMuscle: 'Pectoralis Major',
    restSecs: 60,
    equipment: 'cable',
    tier: 'Coach Directive',
    sets: [
      { setNumber: 1, weightKg: 14, reps: 12, rpe: 8.0, completed: false },
      { setNumber: 2, weightKg: 16, reps: 12, rpe: 8.5, completed: false },
    ],
  },
];
