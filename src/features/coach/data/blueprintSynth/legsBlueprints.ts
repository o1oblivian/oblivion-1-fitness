import type {
  AthleticVector,
  BlueprintBuilder,
  BlueprintContext,
  SynthesizedBlueprint,
} from './synthTypes';

/** LEGS ALPHA: Knee Extension & Quadriceps Focus */
export function legsAlpha({
  duration,
  gear,
  intensity,
  config,
}: BlueprintContext): SynthesizedBlueprint {
  return {
    id: `bp-legs-alpha-${duration}-${gear.replace(/\s+/g, '')}`,
    vector: 'Legs Alpha',
    title: 'O1FC Legs Alpha • Quad Dominance & Knee Extension',
    tagline: 'Vastus Lateralis Tear-Drop Hypertrophy & Unilateral Balance',
    durationMins: config.mins,
    movesCount: config.moves,
    totalSets: config.moves * 3 + 2,
    intensityMode: intensity,
    gear,
    exercises: [
      {
        id: 'bp-leg-a1',
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
        cue: 'Root feet into floor, brace 360 core, descend below parallel with knees tracking toes.',
        targetWeightKg: gear === 'Full Gym' ? 115 : gear === 'DB & Bench' ? 26 : 0,
      },
      {
        id: 'bp-leg-a2',
        name: gear === 'Full Gym' ? '45-Degree Sled Leg Press' : 'Dumbbell Goblet Squat',
        muscle: 'Legs • Vastus Lateralis & Gluteus',
        sets: 4,
        reps: '10-12',
        rpe: '9.0',
        tempo: '3-0-1-0',
        cue: 'Feet shoulder-width. Do not allow lower back to peel off seat cushion.',
        targetWeightKg: gear === 'Full Gym' ? 180 : gear === 'DB & Bench' ? 36 : 0,
      },
      {
        id: 'bp-leg-a3',
        name: gear === 'Full Gym' ? 'Bulgarian Split Squat' : 'Walking Dumbbell Lunges',
        muscle: 'Legs • Unilateral Quad & Glute',
        sets: 3,
        reps: '10 / leg',
        rpe: '8.5',
        tempo: '2-0-1-0',
        cue: 'Elevate rear foot on bench. Drop vertical with deep knee flexion on front leg.',
        targetWeightKg: gear === 'Full Gym' ? 22 : 20,
      },
      ...(config.moves >= 4
        ? [
            {
              id: 'bp-leg-a4',
              name: gear === 'Full Gym' ? 'Quad Leg Extension' : 'Sissy Squats (Bodyweight)',
              muscle: 'Legs • Rectus Femoris',
              sets: 3,
              reps: '15',
              rpe: '9.5',
              tempo: '2-0-1-1',
              cue: 'Lock hips down. Full extension with 1-second pause at top lockout.',
              targetWeightKg: gear === 'Full Gym' ? 55 : 0,
            },
          ]
        : []),
      ...(config.moves >= 5
        ? [
            {
              id: 'bp-leg-a5',
              name: gear === 'Full Gym' ? 'Standing Calf Raise' : 'Single-Leg Dumbbell Calf Raise',
              muscle: 'Calves • Gastrocnemius',
              sets: 4,
              reps: '15-20',
              rpe: '9.0',
              tempo: '2-2-1-1',
              cue: 'Dead pause 2 seconds in bottom deep stretch before driving onto balls of feet.',
              targetWeightKg: gear === 'Full Gym' ? 75 : 20,
            },
          ]
        : []),
    ].slice(0, config.moves),
  };
}

/** LEGS BETA: Posterior Chain & Hamstring / Glute Tie-In */
export function legsBeta({
  duration,
  gear,
  intensity,
  config,
}: BlueprintContext): SynthesizedBlueprint {
  return {
    id: `bp-legs-beta-${duration}-${gear.replace(/\s+/g, '')}`,
    vector: 'Legs Beta',
    title: 'O1FC Legs Beta • Posterior Chain & Hamstring Hinge',
    tagline: 'Glute-Hamstring Tie-In, Hip Thrust Power & Knee Flexion',
    durationMins: config.mins,
    movesCount: config.moves,
    totalSets: config.moves * 3 + 2,
    intensityMode: intensity,
    gear,
    exercises: [
      {
        id: 'bp-leg-b1',
        name: gear === 'Full Gym' ? 'Deficit Romanian Deadlift' : 'Dumbbell Romanian Deadlift',
        muscle: 'Posterior Chain • Glute & Hamstrings',
        sets: 4,
        reps: '8-10',
        rpe: '8.5',
        tempo: '3-1-1-0',
        cue: 'Soft knee bend. Push hips back as far as possible, maintain flat lumbar spine.',
        targetWeightKg: gear === 'Full Gym' ? 105 : gear === 'DB & Bench' ? 38 : 0,
      },
      {
        id: 'bp-leg-b2',
        name: gear === 'Full Gym' ? 'Barbell Hip Thrust' : 'Dumbbell Glute Bridge',
        muscle: 'Glutes • Gluteus Maximus',
        sets: 4,
        reps: '10-12',
        rpe: '9.0',
        tempo: '2-1-1-1',
        cue: 'Drive hips up into posterior pelvic tilt, 1-second violent glute contraction at top.',
        targetWeightKg: gear === 'Full Gym' ? 130 : gear === 'DB & Bench' ? 40 : 0,
      },
      {
        id: 'bp-leg-b3',
        name: gear === 'Full Gym' ? 'Lying Hamstring Leg Curl' : 'Nordic Hamstring Curl',
        muscle: 'Hamstrings • Biceps Femoris',
        sets: 4,
        reps: '12',
        rpe: '9.0',
        tempo: '3-0-1-1',
        cue: 'Dorsiflex toes toward shins, 3-second controlled eccentric descent.',
        targetWeightKg: gear === 'Full Gym' ? 45 : 0,
      },
      ...(config.moves >= 4
        ? [
            {
              id: 'bp-leg-b4',
              name: gear === 'Full Gym' ? 'Walking Dumbbell Lunges' : 'Reverse Lunges',
              muscle: 'Legs • Gluteus Maximus & Balance',
              sets: 3,
              reps: '12 / leg',
              rpe: '8.5',
              tempo: '2-0-1-0',
              cue: 'Long athletic stride, drive through front heel.',
              targetWeightKg: gear === 'Full Gym' ? 20 : 16,
            },
          ]
        : []),
      ...(config.moves >= 5
        ? [
            {
              id: 'bp-leg-b5',
              name: gear === 'Full Gym' ? 'Seated Calf Raise' : 'Dumbbell Seated Calf Raise',
              muscle: 'Calves • Soleus',
              sets: 4,
              reps: '15',
              rpe: '8.5',
              tempo: '2-2-1-0',
              cue: 'Knees bent 90 degrees isolates soleus deep in calf sheath.',
              targetWeightKg: gear === 'Full Gym' ? 40 : 24,
            },
          ]
        : []),
    ].slice(0, config.moves),
  };
}

export const legsBlueprints = {
  'Legs Alpha': legsAlpha,
  'Legs Beta': legsBeta,
} satisfies Partial<Record<AthleticVector, BlueprintBuilder>>;
