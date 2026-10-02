import { ExerciseItem } from '../../../types';
import { MobilityExercise } from '../../../data/recoveryRoutines';

export const createSevenWorkouts = (programTitle: string): ExerciseItem[] => {
  return [
    {
      id: `prog-${Date.now()}-1`,
      name: `${programTitle} #1: Primary Compound Foundation`,
      targetMuscle: 'Target Chain',
      restSecs: 90,
      sets: [
        { setNumber: 1, weightKg: 0, reps: 0, rpe: 8.0, completed: false },
        { setNumber: 2, weightKg: 0, reps: 0, rpe: 8.5, completed: false },
        { setNumber: 3, weightKg: 0, reps: 0, rpe: 9.0, completed: false },
      ],
    },
    {
      id: `prog-${Date.now()}-2`,
      name: `${programTitle} #2: Unilateral Deficit Bias`,
      targetMuscle: 'Eccentric & Stabilizers',
      restSecs: 75,
      sets: [
        { setNumber: 1, weightKg: 0, reps: 0, rpe: 8.0, completed: false },
        { setNumber: 2, weightKg: 0, reps: 0, rpe: 8.5, completed: false },
      ],
    },
    {
      id: `prog-${Date.now()}-3`,
      name: `${programTitle} #3: Peak Isometric Lockout`,
      targetMuscle: 'Peak Tension',
      restSecs: 60,
      sets: [
        { setNumber: 1, weightKg: 0, reps: 0, rpe: 8.5, completed: false },
        { setNumber: 2, weightKg: 0, reps: 0, rpe: 9.0, completed: false },
      ],
    },
    {
      id: `prog-${Date.now()}-4`,
      name: `${programTitle} #4: Mechanical Tension Finisher`,
      targetMuscle: 'Metabolic Flush',
      restSecs: 60,
      sets: [
        { setNumber: 1, weightKg: 0, reps: 0, rpe: 9.5, completed: false },
      ],
    },
  ];
};

export const createCardioExercise = (cardioData: {
  type: string;
  calories: number;
  durationMins: number;
  avgHr: number;
  steps: number;
}): ExerciseItem => {
  return {
    id: `cardio-${Date.now()}`,
    name: `Cardio: ${cardioData.type} (${cardioData.durationMins}m)`,
    targetMuscle: 'Aerobic / Zone 2',
    restSecs: 60,
    sets: [
      {
        setNumber: 1,
        weightKg: 0,
        reps: cardioData.steps > 0 ? Math.round(cardioData.steps / 100) : 10,
        rpe: 8.5,
        completed: true,
      },
    ],
  };
};

export const createRecoveryExercise = (drill: MobilityExercise): ExerciseItem => {
  return {
    id: `rec-${Date.now()}-${drill.id}`,
    name: drill.title,
    targetMuscle: drill.tierDescription,
    notes: `Focus: ${drill.anatomicalFocus.join(', ')} • Equipment: ${drill.equipment}`,
    restSecs: drill.restSecs || 30,
    sets: Array.from({ length: drill.targetSetsCount }).map((_, idx) => ({
      setNumber: idx + 1,
      weightKg: 0,
      reps: drill.targetRepsCount,
      rpe: drill.rpe || 5.0,
      completed: false,
    })),
  };
};

export const createDefaultSportsSession = (): ExerciseItem[] => {
  const list = [
    { name: 'Concept2 SkiErg Sprint', targetMuscle: 'Full Body' },
    { name: 'Burpee Broad Jumps', targetMuscle: 'Full Body' },
    { name: 'Sled Push', targetMuscle: 'Lower Body' },
    { name: 'Wall Balls', targetMuscle: 'Full Body' },
    { name: 'Kettlebell Farmers Walk', targetMuscle: 'Core & Grip' },
    { name: 'RowErg Sprint', targetMuscle: 'Full Body' },
    { name: 'Sandbag Walking Lunges', targetMuscle: 'Quads & Glutes' },
    { name: 'Assault AirBike Sprint', targetMuscle: 'Conditioning' },
  ];

  return list.map((item, index) => ({
    id: `sports-ex-${index + 1}`,
    name: item.name,
    targetMuscle: item.targetMuscle,
    restSecs: 60,
    sets: [
      {
        setNumber: 1,
        weightKg: 0,
        reps: 8,
        rpe: 8.0,
        completed: false,
      },
    ],
  }));
};
