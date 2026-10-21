import type {
  AthleticVector,
  BlueprintBuilder,
  BlueprintContext,
  SynthesizedBlueprint,
} from './synthTypes';

/** UPPER BODY: Complete Torso Armor */
export function upperBody({
  duration,
  gear,
  intensity,
  config,
}: BlueprintContext): SynthesizedBlueprint {
  return {
    id: `bp-upper-${duration}-${gear.replace(/\s+/g, '')}`,
    vector: 'Upper Body',
    title: 'O1FC Upper Body • Complete Torso Armor',
    tagline: 'Horizontal Press, Vertical Pull, Shoulder Caps & Arms',
    durationMins: config.mins,
    movesCount: config.moves,
    totalSets: config.moves * 3 + 2,
    intensityMode: intensity,
    gear,
    exercises: [
      {
        id: 'bp-up-1',
        name:
          gear === 'Bodyweight'
            ? 'Weighted Chest Dips'
            : gear === 'DB & Bench'
              ? 'Incline Dumbbell Press'
              : 'Incline Barbell Bench Press',
        muscle: 'Chest • Upper Clavicular Pecs',
        sets: 4,
        reps: '8-10',
        rpe: '8.5',
        tempo: '3-1-1-0',
        cue: 'Drive bar back towards clavicle with elbows tucked 45 degrees.',
        targetWeightKg: gear === 'Full Gym' ? 75 : gear === 'DB & Bench' ? 32 : 15,
      },
      {
        id: 'bp-up-2',
        name:
          gear === 'Bodyweight'
            ? 'Pull-Ups (Deadstop)'
            : gear === 'DB & Bench'
              ? 'Heavy Single-Arm Dumbbell Row'
              : 'Neutral Grip Lat Pulldown',
        muscle: 'Back • Latissimus Dorsi',
        sets: 4,
        reps: '8-10',
        rpe: '8.5',
        tempo: '3-0-1-1',
        cue: 'Depress scapulae, drive elbows straight down into hips.',
        targetWeightKg: gear === 'Full Gym' ? 65 : gear === 'DB & Bench' ? 36 : 0,
      },
      {
        id: 'bp-up-3',
        name:
          gear === 'Full Gym'
            ? 'Seated Dumbbell Shoulder Press'
            : 'Standing Dumbbell Overhead Press',
        muscle: 'Shoulders • Anterior Deltoid',
        sets: 3,
        reps: '10',
        rpe: '8.5',
        tempo: '2-0-1-0',
        cue: 'Deep stretch at ear level, press upward in slight inward arc.',
        targetWeightKg: gear === 'Full Gym' ? 28 : 24,
      },
      ...(config.moves >= 4
        ? [
            {
              id: 'bp-up-4',
              name: gear === 'Full Gym' ? 'Chest-Supported T-Bar Row' : 'Bent-Over Dumbbell Row',
              muscle: 'Back • Upper Back & Rhomboids',
              sets: 3,
              reps: '10',
              rpe: '8.5',
              tempo: '2-0-1-1',
              cue: 'Squeeze scapulae hard together for 1-second pause.',
              targetWeightKg: gear === 'Full Gym' ? 50 : 28,
            },
          ]
        : []),
      ...(config.moves >= 5
        ? [
            {
              id: 'bp-up-5',
              name:
                gear === 'Full Gym'
                  ? 'Cable Lateral Raise (Behind Body)'
                  : 'Seated Dumbbell Lateral Raise',
              muscle: 'Shoulders • Lateral Deltoid',
              sets: 3,
              reps: '15',
              rpe: '9.0',
              tempo: '2-0-1-1',
              cue: 'Lead with elbow and pinky, keep continuous tension.',
              targetWeightKg: gear === 'Full Gym' ? 10 : 12,
            },
          ]
        : []),
      ...(config.moves >= 6
        ? [
            {
              id: 'bp-up-6',
              name:
                gear === 'Full Gym' ? 'Tricep Rope Pushdown' : 'Overhead Dumbbell Tricep Extension',
              muscle: 'Triceps • Lateral Head',
              sets: 3,
              reps: '12',
              rpe: '9.0',
              tempo: '2-0-1-1',
              cue: 'Flare rope apart at lockout for peak pump.',
              targetWeightKg: gear === 'Full Gym' ? 30 : 24,
            },
          ]
        : []),
    ].slice(0, config.moves),
  };
}

/** LOWER BODY: Complete Wheelbase */
export function lowerBody({
  duration,
  gear,
  intensity,
  config,
}: BlueprintContext): SynthesizedBlueprint {
  return {
    id: `bp-lower-${duration}-${gear.replace(/\s+/g, '')}`,
    vector: 'Lower Body',
    title: 'O1FC Lower Body • Complete Wheelbase',
    tagline: 'Squat Drive, Hamstring Hinge, Unilateral Stability & Calves',
    durationMins: config.mins,
    movesCount: config.moves,
    totalSets: config.moves * 3 + 2,
    intensityMode: intensity,
    gear,
    exercises: [
      {
        id: 'bp-low-1',
        name:
          gear === 'Full Gym'
            ? 'Barbell Back Squat'
            : gear === 'DB & Bench'
              ? 'Bulgarian Split Squat'
              : 'Air Squats (3s Pause)',
        muscle: 'Legs • Quadriceps & Glutes',
        sets: 4,
        reps: '6-8',
        rpe: '8.5',
        tempo: '3-1-1-0',
        cue: 'Brace core 360, sink deep below parallel, explode out of hole.',
        targetWeightKg: gear === 'Full Gym' ? 115 : gear === 'DB & Bench' ? 26 : 0,
      },
      {
        id: 'bp-low-2',
        name: gear === 'Full Gym' ? 'Deficit Romanian Deadlift' : 'Dumbbell Romanian Deadlift',
        muscle: 'Posterior Chain • Glute & Hamstrings',
        sets: 4,
        reps: '8-10',
        rpe: '8.5',
        tempo: '3-1-1-0',
        cue: 'Push hips back until hamstrings reach peak stretch, keep bar close.',
        targetWeightKg: gear === 'Full Gym' ? 105 : gear === 'DB & Bench' ? 38 : 0,
      },
      {
        id: 'bp-low-3',
        name: gear === 'Full Gym' ? 'Walking Dumbbell Lunges' : 'Reverse Lunges',
        muscle: 'Legs • Gluteus Maximus & Balance',
        sets: 3,
        reps: '12 / leg',
        rpe: '8.5',
        tempo: '2-0-1-0',
        cue: 'Long athletic stride, drive through front heel.',
        targetWeightKg: gear === 'Full Gym' ? 20 : 16,
      },
      ...(config.moves >= 4
        ? [
            {
              id: 'bp-low-4',
              name: gear === 'Full Gym' ? 'Lying Hamstring Leg Curl' : 'Nordic Hamstring Curl',
              muscle: 'Hamstrings • Biceps Femoris',
              sets: 3,
              reps: '12',
              rpe: '9.0',
              tempo: '3-0-1-1',
              cue: 'Slow 3-second negative eccentric return.',
              targetWeightKg: gear === 'Full Gym' ? 45 : 0,
            },
          ]
        : []),
      ...(config.moves >= 5
        ? [
            {
              id: 'bp-low-5',
              name: gear === 'Full Gym' ? 'Standing Calf Raise' : 'Single-Leg Dumbbell Calf Raise',
              muscle: 'Calves • Gastrocnemius',
              sets: 4,
              reps: '15',
              rpe: '9.0',
              tempo: '2-2-1-1',
              cue: '2-second dead pause at bottom stretch before driving up.',
              targetWeightKg: gear === 'Full Gym' ? 75 : 20,
            },
          ]
        : []),
    ].slice(0, config.moves),
  };
}

export const bodySplitBlueprints = {
  'Upper Body': upperBody,
  'Lower Body': lowerBody,
} satisfies Partial<Record<AthleticVector, BlueprintBuilder>>;
