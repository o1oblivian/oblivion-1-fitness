import type { ExerciseItem } from '../../../types';
import { calibrateTemplate } from '../utils/calibrateLoads';

interface StarterMovement {
  name: string;
  exerciseName: string;
  targetMuscle: string;
  equipment: string;
  reps: number;
}

export interface BeginnerStarter {
  title: string;
  subtitle: string;
  badge: string;
  routineName: string;
  movements: StarterMovement[];
}

export const BEGINNER_STARTERS: BeginnerStarter[] = [
  {
    title: 'Full Body Foundation',
    subtitle: '35 mins • 4 classic movements',
    badge: 'Beginner Best',
    routineName: 'Full Body Foundation (Beginner)',
    movements: [
      { name: 'Goblet Squat (Dumbbell)', exerciseName: 'Goblet Squat', targetMuscle: 'Quadriceps / Glutes', equipment: 'Dumbbell', reps: 10 },
      { name: 'Dumbbell Flat Bench Press', exerciseName: 'Dumbbell Bench Press', targetMuscle: 'Chest / Triceps', equipment: 'Dumbbells', reps: 10 },
      { name: 'Lat Pulldown (Neutral Grip)', exerciseName: 'Lat Pulldown', targetMuscle: 'Upper Back / Lats', equipment: 'Cable Machine', reps: 12 },
      { name: 'Romanian Deadlift (Dumbbell)', exerciseName: 'Romanian Deadlift', targetMuscle: 'Hamstrings / Posterior', equipment: 'Dumbbells', reps: 10 },
    ],
  },
  {
    title: 'Upper Push & Pull Starter',
    subtitle: '30 mins • Arms & Upper Body',
    badge: 'Easy Start',
    routineName: 'Upper Body Starter (Beginner)',
    movements: [
      { name: 'Seated Cable Row', exerciseName: 'Seated Cable Row', targetMuscle: 'Upper Back', equipment: 'Cable Machine', reps: 12 },
      { name: 'Incline Dumbbell Press', exerciseName: 'Incline Dumbbell Press', targetMuscle: 'Upper Chest', equipment: 'Dumbbells', reps: 10 },
      { name: 'Standing Lateral Raise', exerciseName: 'Lateral Raise', targetMuscle: 'Side Delts', equipment: 'Dumbbells', reps: 12 },
    ],
  },
];

/** Three working sets per movement, loads taken from the athlete's own history (0 when unknown). */
export function buildStarterSession(starter: BeginnerStarter, stamp = Date.now()): ExerciseItem[] {
  const exercises: ExerciseItem[] = starter.movements.map((m, i) => ({
    id: `starter-${stamp}-${i}`,
    name: m.name,
    exerciseName: m.exerciseName,
    targetMuscle: m.targetMuscle,
    equipment: m.equipment,
    restSecs: 90,
    sets: [1, 2, 3].map((setNumber) => ({
      id: `starter-${stamp}-${i}-s${setNumber}`,
      setNumber,
      reps: m.reps,
      weightKg: 0,
      rpe: 0,
      completed: false,
    })),
  }));
  return calibrateTemplate(exercises);
}
