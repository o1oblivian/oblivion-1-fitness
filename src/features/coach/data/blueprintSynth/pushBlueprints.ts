import type {
  AthleticVector,
  BlueprintBuilder,
  BlueprintContext,
  SynthesizedBlueprint,
} from './synthTypes';

/** PUSH ALPHA: Sternal & Upper Chest Hypertrophy + Lateral Delts */
export function pushAlpha({
  duration,
  gear,
  intensity,
  config,
}: BlueprintContext): SynthesizedBlueprint {
  return {
    id: `bp-push-alpha-${duration}-${gear.replace(/\s+/g, '')}`,
    vector: 'Push Alpha',
    title: 'O1FC Push Alpha • Chest & Delts',
    tagline: 'Sternal & Clavicular Hypertrophy, Scapular Drive',
    durationMins: config.mins,
    movesCount: config.moves,
    totalSets: config.moves * 3 + 2,
    intensityMode: intensity,
    gear,
    exercises: [
      {
        id: 'bp-push-1',
        name:
          gear === 'Bodyweight'
            ? 'Deficit Push-Ups'
            : gear === 'DB & Bench'
              ? 'Flat Dumbbell Press'
              : 'Barbell Flat Bench Press',
        muscle: 'Chest • Mid Sternal Pecs',
        sets: 4,
        reps: '6-8',
        rpe: intensity === 'Progressive RPE' ? '8.0-9.0' : '9.5-10',
        tempo: '3-1-1-0',
        cue: 'Plant feet firmly, retract scapulae, drive bar back over shoulders.',
        targetWeightKg: gear === 'Full Gym' ? 85 : gear === 'DB & Bench' ? 34 : 0,
      },
      {
        id: 'bp-push-2',
        name: gear === 'Bodyweight' ? 'Pike Push-Ups' : 'Incline Dumbbell Press',
        muscle: 'Chest • Upper Clavicular Pecs',
        sets: 4,
        reps: '8-10',
        rpe: '8.5',
        tempo: '3-0-1-0',
        cue: 'Deep stretch at bottom. Converge dumbbells upward without clacking.',
        targetWeightKg: gear === 'Full Gym' ? 32 : gear === 'DB & Bench' ? 28 : 0,
      },
      {
        id: 'bp-push-3',
        name:
          gear === 'Full Gym'
            ? 'Cable Lateral Raise (Behind Body)'
            : 'Seated Dumbbell Lateral Raise',
        muscle: 'Shoulders • Lateral Deltoid Cap',
        sets: 4,
        reps: '12-15',
        rpe: '9.0',
        tempo: '2-0-1-1',
        cue: 'Lead with elbow and pinky, keep continuous tension through scapular plane.',
        targetWeightKg: gear === 'Full Gym' ? 10 : gear === 'DB & Bench' ? 12 : 0,
      },
      ...(config.moves >= 4
        ? [
            {
              id: 'bp-push-4',
              name:
                gear === 'Full Gym'
                  ? 'Pec Deck Machine Fly'
                  : gear === 'DB & Bench'
                    ? 'Flat Dumbbell Fly'
                    : 'Diamond Push-Ups',
              muscle: 'Chest • Sternal Division',
              sets: 3,
              reps: '12-15',
              rpe: '9.0',
              tempo: '2-1-1-1',
              cue: 'Hold peak contraction for 1 second. Control 2-second negative stretch.',
              targetWeightKg: gear === 'Full Gym' ? 55 : gear === 'DB & Bench' ? 16 : 0,
            },
          ]
        : []),
      ...(config.moves >= 5
        ? [
            {
              id: 'bp-push-5',
              name:
                gear === 'Full Gym'
                  ? 'Tricep Rope Pushdown'
                  : 'Two-Arm Overhead Dumbbell Extension',
              muscle: 'Triceps • Lateral & Long Heads',
              sets: 3,
              reps: '12-15',
              rpe: '9.0',
              tempo: '2-0-1-1',
              cue: 'Pin elbows to ribs. Flare rope apart at lockout for peak contraction.',
              targetWeightKg: gear === 'Full Gym' ? 30 : gear === 'DB & Bench' ? 24 : 0,
            },
          ]
        : []),
      ...(config.moves >= 6
        ? [
            {
              id: 'bp-push-6',
              name:
                gear === 'Full Gym'
                  ? 'Overhead Cable Tricep Extension'
                  : 'Dumbbell Kickbacks with Squeeze',
              muscle: 'Triceps • Long Head Stretch',
              sets: 3,
              reps: '15',
              rpe: '9.5',
              tempo: '2-0-1-0',
              cue: 'Deep stretch overhead behind neck, explosive concentric extension.',
              targetWeightKg: gear === 'Full Gym' ? 25 : 12,
            },
          ]
        : []),
    ].slice(0, config.moves),
  };
}

/** PUSH BETA: Overhead Power & Tricep Specialization */
export function pushBeta({
  duration,
  gear,
  intensity,
  config,
}: BlueprintContext): SynthesizedBlueprint {
  return {
    id: `bp-push-beta-${duration}-${gear.replace(/\s+/g, '')}`,
    vector: 'Push Beta',
    title: 'O1FC Push Beta • Overhead Armor & Triceps',
    tagline: 'Deltoid Density, Overhead Kinetic Power & Elbow Extension',
    durationMins: config.mins,
    movesCount: config.moves,
    totalSets: config.moves * 3 + 2,
    intensityMode: intensity,
    gear,
    exercises: [
      {
        id: 'bp-push-b1',
        name:
          gear === 'Full Gym'
            ? 'Standing Overhead Military Press'
            : gear === 'DB & Bench'
              ? 'Seated Dumbbell Shoulder Press'
              : 'Pike Push-Ups (Elevated Feet)',
        muscle: 'Shoulders • Anterior & Medial Delts',
        sets: 4,
        reps: '6-8',
        rpe: '8.5',
        tempo: '2-1-1-0',
        cue: 'Brace core and glutes. Press bar straight vertically, head through the window.',
        targetWeightKg: gear === 'Full Gym' ? 55 : gear === 'DB & Bench' ? 28 : 0,
      },
      {
        id: 'bp-push-b2',
        name:
          gear === 'Full Gym'
            ? 'Weighted Chest Dips'
            : gear === 'DB & Bench'
              ? 'Incline Dumbbell Press'
              : 'Chair / Parallel Dips',
        muscle: 'Chest & Anterior Deltoid',
        sets: 4,
        reps: '8-10',
        rpe: '9.0',
        tempo: '3-0-1-0',
        cue: 'Lean forward slightly to engage lower pectorals, drive through palms.',
        targetWeightKg: gear === 'Full Gym' ? 20 : gear === 'DB & Bench' ? 30 : 0,
      },
      {
        id: 'bp-push-b3',
        name:
          gear === 'Full Gym'
            ? 'Close-Grip Barbell Bench Press'
            : gear === 'DB & Bench'
              ? 'Close-Grip Dumbbell Press'
              : 'Diamond Push-Ups',
        muscle: 'Triceps • Medial & Lateral Heads',
        sets: 4,
        reps: '8-10',
        rpe: '8.5',
        tempo: '3-1-1-0',
        cue: 'Shoulder-width grip. Keep elbows tight against ribs on descent.',
        targetWeightKg: gear === 'Full Gym' ? 70 : gear === 'DB & Bench' ? 26 : 0,
      },
      ...(config.moves >= 4
        ? [
            {
              id: 'bp-push-b4',
              name:
                gear === 'Full Gym'
                  ? 'Cable Lateral Raise (Behind Body)'
                  : 'Seated Dumbbell Lateral Raise',
              muscle: 'Shoulders • Lateral Deltoid Cap',
              sets: 4,
              reps: '15',
              rpe: '9.0',
              tempo: '2-0-1-1',
              cue: 'Continuous tension on lateral delt head. No momentum or torso swing.',
              targetWeightKg: gear === 'Full Gym' ? 10 : 12,
            },
          ]
        : []),
      ...(config.moves >= 5
        ? [
            {
              id: 'bp-push-b5',
              name:
                gear === 'Full Gym'
                  ? 'EZ-Bar Skull Crusher'
                  : 'Two-Arm Overhead Dumbbell Extension',
              muscle: 'Triceps • Long Head',
              sets: 3,
              reps: '12',
              rpe: '9.0',
              tempo: '3-0-1-0',
              cue: 'Angle upper arms backward slightly for continuous long head loading.',
              targetWeightKg: gear === 'Full Gym' ? 35 : 24,
            },
          ]
        : []),
    ].slice(0, config.moves),
  };
}

export const pushBlueprints = {
  'Push Alpha': pushAlpha,
  'Push Beta': pushBeta,
} satisfies Partial<Record<AthleticVector, BlueprintBuilder>>;
