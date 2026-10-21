import type {
  AthleticVector,
  BlueprintBuilder,
  BlueprintContext,
  SynthesizedBlueprint,
} from './synthTypes';

/** PULL ALPHA: Vertical Lat Width & Scapular Depression */
export function pullAlpha({
  duration,
  gear,
  intensity,
  config,
}: BlueprintContext): SynthesizedBlueprint {
  return {
    id: `bp-pull-alpha-${duration}-${gear.replace(/\s+/g, '')}`,
    vector: 'Pull Alpha',
    title: 'O1FC Pull Alpha • V-Taper Lat Width',
    tagline: 'Frontal Lat Flare, Teres Major Stretch & Scapular Depression',
    durationMins: config.mins,
    movesCount: config.moves,
    totalSets: config.moves * 3 + 2,
    intensityMode: intensity,
    gear,
    exercises: [
      {
        id: 'bp-pull-a1',
        name:
          gear === 'Bodyweight'
            ? 'Weighted Pull-Ups'
            : gear === 'DB & Bench'
              ? 'Heavy Single-Arm Dumbbell Row'
              : 'Neutral Grip Lat Pulldown',
        muscle: 'Back • Latissimus Dorsi',
        sets: 4,
        reps: '8-10',
        rpe: '8.5',
        tempo: '3-1-1-0',
        cue: 'Depress shoulder blades first, pull elbows down into back pockets.',
        targetWeightKg: gear === 'Full Gym' ? 65 : gear === 'DB & Bench' ? 36 : 15,
      },
      {
        id: 'bp-pull-a2',
        name:
          gear === 'Full Gym' ? 'Straight-Arm Cable Pullover' : 'Dumbbell Pullover (Across Bench)',
        muscle: 'Back • Lower Latissimus',
        sets: 4,
        reps: '12',
        rpe: '8.5',
        tempo: '2-1-1-1',
        cue: 'Slight torso forward lean. Sweep bar down in wide arc without elbow flexion.',
        targetWeightKg: gear === 'Full Gym' ? 28 : gear === 'DB & Bench' ? 24 : 0,
      },
      {
        id: 'bp-pull-a3',
        name: gear === 'Full Gym' ? 'Chest-Supported T-Bar Row' : 'Bent-Over Dumbbell Row',
        muscle: 'Back • Upper Back & Rhomboids',
        sets: 4,
        reps: '10',
        rpe: '8.5',
        tempo: '2-0-1-1',
        cue: 'Chest glued to pad. Flare elbows at 45 degrees, 1-second scapular squeeze.',
        targetWeightKg: gear === 'Full Gym' ? 50 : gear === 'DB & Bench' ? 28 : 0,
      },
      ...(config.moves >= 4
        ? [
            {
              id: 'bp-pull-a4',
              name: gear === 'Full Gym' ? 'Cable Rope Face Pull' : 'Incline Bench Rear Delt Fly',
              muscle: 'Upper Back • Rear Delts & Rotator Cuff',
              sets: 4,
              reps: '15',
              rpe: '8.5',
              tempo: '2-0-1-1',
              cue: 'Pull rope apart toward eyes. External rotate hands back at peak.',
              targetWeightKg: gear === 'Full Gym' ? 25 : 12,
            },
          ]
        : []),
      ...(config.moves >= 5
        ? [
            {
              id: 'bp-pull-a5',
              name: gear === 'Full Gym' ? 'Bayesian Cable Curl' : 'Incline Dumbbell Bicep Curl',
              muscle: 'Biceps • Long Head Stretch',
              sets: 3,
              reps: '12',
              rpe: '9.0',
              tempo: '3-0-1-1',
              cue: 'Deep stretch behind torso, supinate wrists hard at contraction.',
              targetWeightKg: gear === 'Full Gym' ? 16 : 14,
            },
          ]
        : []),
    ].slice(0, config.moves),
  };
}

/** PULL BETA: Latissimus Thickness & Posterior Chain Hinge */
export function pullBeta({
  duration,
  gear,
  intensity,
  config,
}: BlueprintContext): SynthesizedBlueprint {
  return {
    id: `bp-pull-beta-${duration}-${gear.replace(/\s+/g, '')}`,
    vector: 'Pull Beta',
    title: 'O1FC Pull Beta • Lat Thickness & Posterior Chain',
    tagline: 'Mid-Trap Density, Spinal Erector Armor & Heavy Hinge',
    durationMins: config.mins,
    movesCount: config.moves,
    totalSets: config.moves * 3 + 2,
    intensityMode: intensity,
    gear,
    exercises: [
      {
        id: 'bp-pull-b1',
        name: gear === 'Full Gym' ? 'Deficit Romanian Deadlift' : 'Dumbbell Romanian Deadlift',
        muscle: 'Posterior Chain • Glute & Hamstrings',
        sets: 4,
        reps: '8-10',
        rpe: '8.5',
        tempo: '3-1-1-0',
        cue: 'Hinge hips backwards until hamstring stretch peaks. Keep bar brushing shins.',
        targetWeightKg: gear === 'Full Gym' ? 105 : gear === 'DB & Bench' ? 40 : 0,
      },
      {
        id: 'bp-pull-b2',
        name:
          gear === 'Full Gym' ? 'Pendlay Barbell Row (Deadstop)' : 'Heavy Single-Arm Dumbbell Row',
        muscle: 'Back • Mid Traps & Rhomboids',
        sets: 4,
        reps: '6-8',
        rpe: '8.5',
        tempo: '2-0-1-0',
        cue: 'Reset on floor each rep, explosive drive into lower sternum.',
        targetWeightKg: gear === 'Full Gym' ? 80 : gear === 'DB & Bench' ? 38 : 0,
      },
      {
        id: 'bp-pull-b3',
        name: gear === 'Full Gym' ? 'Neutral Grip Lat Pulldown' : 'Weighted Pull-Ups',
        muscle: 'Back • Latissimus Dorsi',
        sets: 4,
        reps: '10',
        rpe: '8.5',
        tempo: '3-0-1-0',
        cue: 'Full extension stretch at top, pull elbows into hip line.',
        targetWeightKg: gear === 'Full Gym' ? 65 : 15,
      },
      ...(config.moves >= 4
        ? [
            {
              id: 'bp-pull-b4',
              name:
                gear === 'Full Gym'
                  ? 'Chest-Supported Rear Delt Row'
                  : 'Incline Bench Rear Delt Fly',
              muscle: 'Upper Back • Posterior Delts',
              sets: 3,
              reps: '12-15',
              rpe: '9.0',
              tempo: '2-0-1-1',
              cue: 'Wide elbow flare 70 degrees, squeeze back of shoulders.',
              targetWeightKg: gear === 'Full Gym' ? 40 : 12,
            },
          ]
        : []),
      ...(config.moves >= 5
        ? [
            {
              id: 'bp-pull-b5',
              name:
                gear === 'Full Gym' ? 'Cable Rope Hammer Curl' : 'Cross-Body Dumbbell Hammer Curl',
              muscle: 'Arms • Brachialis & Forearms',
              sets: 3,
              reps: '10-12',
              rpe: '9.0',
              tempo: '2-0-1-1',
              cue: 'Pin elbows to sides, curl across body with strict neutral wrist.',
              targetWeightKg: gear === 'Full Gym' ? 25 : 18,
            },
          ]
        : []),
    ].slice(0, config.moves),
  };
}

export const pullBlueprints = {
  'Pull Alpha': pullAlpha,
  'Pull Beta': pullBeta,
} satisfies Partial<Record<AthleticVector, BlueprintBuilder>>;
