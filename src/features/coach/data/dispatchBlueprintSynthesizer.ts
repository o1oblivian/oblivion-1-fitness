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

export function synthesizeDailyBlueprint(
  vector: AthleticVector,
  duration: SessionDuration = '45m',
  gear: FacilityGear = 'Full Gym',
  intensity: IntensityMode = 'Progressive RPE',
  seedIndex: number = 0
): SynthesizedBlueprint {
  const durationMap = {
    '20m': { mins: 20, moves: 3, setsPerMove: 3 },
    '30m': { mins: 30, moves: 3, setsPerMove: 3 },
    '45m': { mins: 45, moves: 5, setsPerMove: 4 },
    '60m': { mins: 60, moves: 6, setsPerMove: 4 },
    '75m': { mins: 75, moves: 7, setsPerMove: 4 },
  };
  const config = durationMap[duration] || durationMap['45m'];

  switch (vector) {
    // =========================================================================
    // 1. PUSH ALPHA: Sternal & Upper Chest Hypertrophy + Lateral Delts
    // =========================================================================
    case 'Push Alpha':
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
            name: gear === 'Bodyweight' ? 'Deficit Push-Ups' : gear === 'DB & Bench' ? 'Flat Dumbbell Press' : 'Barbell Flat Bench Press',
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
            name: gear === 'Full Gym' ? 'Cable Lateral Raise (Behind Body)' : 'Seated Dumbbell Lateral Raise',
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
                  name: gear === 'Full Gym' ? 'Pec Deck Machine Fly' : gear === 'DB & Bench' ? 'Flat Dumbbell Fly' : 'Diamond Push-Ups',
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
                  name: gear === 'Full Gym' ? 'Tricep Rope Pushdown' : 'Two-Arm Overhead Dumbbell Extension',
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
                  name: gear === 'Full Gym' ? 'Overhead Cable Tricep Extension' : 'Dumbbell Kickbacks with Squeeze',
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

    // =========================================================================
    // 2. PUSH BETA: Overhead Power & Tricep Specialization
    // =========================================================================
    case 'Push Beta':
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
            name: gear === 'Full Gym' ? 'Standing Overhead Military Press' : gear === 'DB & Bench' ? 'Seated Dumbbell Shoulder Press' : 'Pike Push-Ups (Elevated Feet)',
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
            name: gear === 'Full Gym' ? 'Weighted Chest Dips' : gear === 'DB & Bench' ? 'Incline Dumbbell Press' : 'Chair / Parallel Dips',
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
            name: gear === 'Full Gym' ? 'Close-Grip Barbell Bench Press' : gear === 'DB & Bench' ? 'Close-Grip Dumbbell Press' : 'Diamond Push-Ups',
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
                  name: gear === 'Full Gym' ? 'Cable Lateral Raise (Behind Body)' : 'Seated Dumbbell Lateral Raise',
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
                  name: gear === 'Full Gym' ? 'EZ-Bar Skull Crusher' : 'Two-Arm Overhead Dumbbell Extension',
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

    // =========================================================================
    // 3. PULL ALPHA: Vertical Lat Width & Scapular Depression
    // =========================================================================
    case 'Pull Alpha':
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
            name: gear === 'Bodyweight' ? 'Weighted Pull-Ups' : gear === 'DB & Bench' ? 'Heavy Single-Arm Dumbbell Row' : 'Neutral Grip Lat Pulldown',
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
            name: gear === 'Full Gym' ? 'Straight-Arm Cable Pullover' : 'Dumbbell Pullover (Across Bench)',
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

    // =========================================================================
    // 4. PULL BETA: Latissimus Thickness & Posterior Chain Hinge
    // =========================================================================
    case 'Pull Beta':
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
            name: gear === 'Full Gym' ? 'Pendlay Barbell Row (Deadstop)' : 'Heavy Single-Arm Dumbbell Row',
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
                  name: gear === 'Full Gym' ? 'Chest-Supported Rear Delt Row' : 'Incline Bench Rear Delt Fly',
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
                  name: gear === 'Full Gym' ? 'Cable Rope Hammer Curl' : 'Cross-Body Dumbbell Hammer Curl',
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

    // =========================================================================
    // 5. LEGS ALPHA: Knee Extension & Quadriceps Focus
    // =========================================================================
    case 'Legs Alpha':
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
            name: gear === 'Full Gym' ? 'Barbell Back Squat' : gear === 'DB & Bench' ? 'Bulgarian Split Squat' : 'Air Squats (3s Pause)',
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

    // =========================================================================
    // 6. LEGS BETA: Posterior Chain & Hamstring / Glute Tie-In
    // =========================================================================
    case 'Legs Beta':
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

    // =========================================================================
    // 7. UPPER BODY: Complete Torso Armor
    // =========================================================================
    case 'Upper Body':
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
            name: gear === 'Bodyweight' ? 'Weighted Chest Dips' : gear === 'DB & Bench' ? 'Incline Dumbbell Press' : 'Incline Barbell Bench Press',
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
            name: gear === 'Bodyweight' ? 'Pull-Ups (Deadstop)' : gear === 'DB & Bench' ? 'Heavy Single-Arm Dumbbell Row' : 'Neutral Grip Lat Pulldown',
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
            name: gear === 'Full Gym' ? 'Seated Dumbbell Shoulder Press' : 'Standing Dumbbell Overhead Press',
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
                  name: gear === 'Full Gym' ? 'Cable Lateral Raise (Behind Body)' : 'Seated Dumbbell Lateral Raise',
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
                  name: gear === 'Full Gym' ? 'Tricep Rope Pushdown' : 'Overhead Dumbbell Tricep Extension',
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

    // =========================================================================
    // 8. LOWER BODY: Complete Wheelbase
    // =========================================================================
    case 'Lower Body':
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
            name: gear === 'Full Gym' ? 'Barbell Back Squat' : gear === 'DB & Bench' ? 'Bulgarian Split Squat' : 'Air Squats (3s Pause)',
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

    // =========================================================================
    // 9. HYROX / METCON: Race Simulation & Work Capacity
    // =========================================================================
    case 'Hyrox/Metcon':
      return {
        id: `bp-hyrox-${duration}-${gear.replace(/\s+/g, '')}`,
        vector: 'Hyrox/Metcon',
        title: 'O1FC Hyrox & Metcon • Engine Capacity',
        tagline: 'Sled Drive, Ergometer Pacing, Grip Strength & Lung Capacity',
        durationMins: config.mins,
        movesCount: config.moves,
        totalSets: config.moves * 3,
        intensityMode: intensity,
        gear,
        exercises: [
          {
            id: 'bp-hy-1',
            name: gear === 'Full Gym' ? 'Heavy Sled Push (Prowler)' : 'Burpee Broad Jumps',
            muscle: 'Full Body • Quad & Aerobic Drive',
            sets: 4,
            reps: '25m',
            rpe: '9.0',
            tempo: '1-0-1-0',
            cue: 'Torso at 45 degrees, drive through forefoot with aggressive leg piston.',
            targetWeightKg: gear === 'Full Gym' ? 140 : 0,
          },
          {
            id: 'bp-hy-2',
            name: gear === 'Full Gym' ? 'Concept2 SkiErg 500m Pace' : 'Hardstyle Kettlebell Swing',
            muscle: 'Upper Body & Aerobic Engine',
            sets: 3,
            reps: '500m',
            rpe: '9.0',
            tempo: '1-0-1-0',
            cue: 'Hinge at hips, bend knees, drive handles down using full core crunch.',
            targetWeightKg: gear === 'Full Gym' ? 0 : 28,
          },
          {
            id: 'bp-hy-3',
            name: 'Heavy Farmers Walk Carry',
            muscle: 'Grip, Traps & Core Stability',
            sets: 4,
            reps: '40m',
            rpe: '8.5',
            tempo: '1-0-1-0',
            cue: 'Tall posture, proud chest, rapid heel-to-toe stride with zero sway.',
            targetWeightKg: 32,
          },
          ...(config.moves >= 4
            ? [
                {
                  id: 'bp-hy-4',
                  name: gear === 'Full Gym' ? 'RowErg 500m Pace Intervals' : 'Burpee Broad Jumps',
                  muscle: 'Posterior Chain & Lungs',
                  sets: 3,
                  reps: '500m',
                  rpe: '9.0',
                  tempo: '1-0-1-0',
                  cue: 'Drive with legs (60%), swing with hips (20%), pull with arms (20%).',
                  targetWeightKg: 0,
                },
              ]
            : []),
          ...(config.moves >= 5
            ? [
                {
                  id: 'bp-hy-5',
                  name: 'Wall Balls (20lb to 10ft Target)',
                  muscle: 'Legs, Shoulders & Anaerobic Heart',
                  sets: 3,
                  reps: '20',
                  rpe: '9.0',
                  tempo: '1-0-1-0',
                  cue: 'Deep hip crease squat, launch medicine ball high onto target center.',
                  targetWeightKg: 9,
                },
              ]
            : []),
        ].slice(0, config.moves),
      };

    // =========================================================================
    // 10. SPEED & COD: Elastic Rate of Force Development
    // =========================================================================
    case 'Speed & COD':
      return {
        id: `bp-speed-${duration}-${gear.replace(/\s+/g, '')}`,
        vector: 'Speed & COD',
        title: 'O1FC Speed & COD • Rate of Force Development',
        tagline: 'Triple Extension Power, Elastic Deceleration & Rotational Torque',
        durationMins: config.mins,
        movesCount: config.moves,
        totalSets: config.moves * 4,
        intensityMode: intensity,
        gear,
        exercises: [
          {
            id: 'bp-sp-1',
            name: gear === 'Full Gym' ? 'Trap Bar Speed Deadlift' : 'Hardstyle Kettlebell Swing',
            muscle: 'Full Body • Rate of Force Development',
            sets: 5,
            reps: '3',
            rpe: '7.5',
            tempo: '1-0-X-0',
            cue: 'Violent hip extension off floor. Maximum concentric acceleration.',
            targetWeightKg: gear === 'Full Gym' ? 120 : 32,
          },
          {
            id: 'bp-sp-2',
            name: 'Box Jumps with Depth Land',
            muscle: 'Lower Body • Plyometric Elasticity',
            sets: 4,
            reps: '5',
            rpe: '7.5',
            tempo: '1-0-X-0',
            cue: 'Land quietly like a ninja in power position, absorbing force through hips.',
            targetWeightKg: 0,
          },
          {
            id: 'bp-sp-3',
            name: 'Rotational Medicine Ball Slam',
            muscle: 'Torso & Transverse Power',
            sets: 3,
            reps: '8 / side',
            rpe: '8.0',
            tempo: '1-0-X-0',
            cue: 'Pivot rear foot, load hips, slam ball into floor with maximum rotational torque.',
            targetWeightKg: 8,
          },
          ...(config.moves >= 4
            ? [
                {
                  id: 'bp-sp-4',
                  name: 'Nordic Hamstring Curl',
                  muscle: 'Hamstrings • Eccentric Tendon Armor',
                  sets: 3,
                  reps: '5',
                  rpe: '9.0',
                  tempo: '4-0-1-0',
                  cue: 'Slow eccentric fall, resist with hamstrings as far as possible.',
                  targetWeightKg: 0,
                },
              ]
            : []),
          ...(config.moves >= 5
            ? [
                {
                  id: 'bp-sp-5',
                  name: 'Copenhagen Side Plank (Adductor)',
                  muscle: 'Groin • Adductors & Lateral Core',
                  sets: 3,
                  reps: '30s / side',
                  rpe: '8.5',
                  tempo: 'Static',
                  cue: 'Top foot rested on bench, bottom leg hovered. Solid hip line.',
                  targetWeightKg: 0,
                },
              ]
            : []),
        ].slice(0, config.moves),
      };

    // =========================================================================
    // 11. STRENGTH S&C: Central Nervous System Potentiation
    // =========================================================================
    case 'Strength S&C':
      return {
        id: `bp-strength-${duration}-${gear.replace(/\s+/g, '')}`,
        vector: 'Strength S&C',
        title: 'O1FC Strength S&C • CNS Potentiation',
        tagline: 'Maximal Motor Unit Recruitment, Heavy Triples & Structural Armor',
        durationMins: config.mins,
        movesCount: config.moves,
        totalSets: config.moves * 4,
        intensityMode: intensity,
        gear,
        exercises: [
          {
            id: 'bp-str-1',
            name: gear === 'Full Gym' ? 'Barbell Back Squat' : 'Heavy Dumbbell Front Squat',
            muscle: 'Lower Body • Squat Pattern',
            sets: 5,
            reps: '3-5',
            rpe: '8.5',
            tempo: '3-1-1-0',
            cue: 'Brace 360 intra-abdominal wall, drive out of hole with violent intent.',
            targetWeightKg: gear === 'Full Gym' ? 125 : 36,
          },
          {
            id: 'bp-str-2',
            name: gear === 'Full Gym' ? 'Barbell Flat Bench Press' : 'Flat Dumbbell Press',
            muscle: 'Upper Body • Horizontal Press',
            sets: 5,
            reps: '3-5',
            rpe: '8.5',
            tempo: '3-1-1-0',
            cue: 'Plant heels, retract shoulder blades, touch lower sternum.',
            targetWeightKg: gear === 'Full Gym' ? 95 : 38,
          },
          {
            id: 'bp-str-3',
            name: gear === 'Full Gym' ? 'Deficit Romanian Deadlift' : 'Heavy Single-Arm Dumbbell Row',
            muscle: 'Posterior Chain • Hinge Pattern',
            sets: 4,
            reps: '6',
            rpe: '8.5',
            tempo: '3-1-1-0',
            cue: 'Hinge hips backward until hamstrings peak stretch, maintain spine neutrality.',
            targetWeightKg: gear === 'Full Gym' ? 115 : 42,
          },
          ...(config.moves >= 4
            ? [
                {
                  id: 'bp-str-4',
                  name: gear === 'Full Gym' ? 'Weighted Pull-Ups' : 'Chest-Supported T-Bar Row',
                  muscle: 'Back • Vertical Pull',
                  sets: 4,
                  reps: '5',
                  rpe: '9.0',
                  tempo: '2-1-1-0',
                  cue: 'Chest to bar, pause 1 second at top contraction.',
                  targetWeightKg: gear === 'Full Gym' ? 20 : 50,
                },
              ]
            : []),
          ...(config.moves >= 5
            ? [
                {
                  id: 'bp-str-5',
                  name: 'Cable Pallof Press with Isometric Hold',
                  muscle: 'Core • Anti-Rotation Bracing',
                  sets: 3,
                  reps: '8 / side',
                  rpe: '8.0',
                  tempo: '2-2-1-0',
                  cue: 'Resist rotational torque with rock-solid oblique bracing.',
                  targetWeightKg: 18,
                },
              ]
            : []),
        ].slice(0, config.moves),
      };

    // =========================================================================
    // 12. BIO-RECOVERY: Tissue Reperfusion & Active Mobility
    // =========================================================================
    case 'Bio-Recovery':
    default:
      return {
        id: `bp-rec-${duration}-${gear.replace(/\s+/g, '')}`,
        vector: 'Bio-Recovery',
        title: 'O1FC Bio-Recovery • Tissue Reperfusion',
        tagline: 'Vagal Nerve Activation, Joint Decoupling & Fascial Rehydration',
        durationMins: config.mins,
        movesCount: config.moves,
        totalSets: config.moves * 2,
        intensityMode: 'Progressive RPE',
        gear: 'Bodyweight',
        exercises: [
          {
            id: 'bp-rc-1',
            name: '90/90 Hip Mobility & Rotation Flow',
            muscle: 'Hips • Internal & External Rotators',
            sets: 2,
            reps: '10 switches',
            rpe: '5.5',
            tempo: 'Slow',
            cue: 'Sit with both knees at 90 degrees. Transition smoothly across midline without hands.',
            targetWeightKg: 0,
          },
          {
            id: 'bp-rc-2',
            name: 'Couch Stretch with Pelvic Tuck',
            muscle: 'Quads & Psoas Hip Flexors',
            sets: 2,
            reps: '60s / side',
            rpe: '6.0',
            tempo: 'Static',
            cue: 'Shin against wall, squeeze glute forward to open anterior hip capsule.',
            targetWeightKg: 0,
          },
          {
            id: 'bp-rc-3',
            name: 'Thoracic Spine Extension on Foam Roller',
            muscle: 'Spine • Thoracic Extension',
            sets: 2,
            reps: '8 reps',
            rpe: '5.5',
            tempo: 'Gentle',
            cue: 'Inhale over roller, exhale relaxing ribs down.',
            targetWeightKg: 0,
          },
          ...(config.moves >= 4
            ? [
                {
                  id: 'bp-rc-4',
                  name: 'Down-Regulation Box Breathing',
                  muscle: 'Nervous System • Vagal Nerve Reset',
                  sets: 1,
                  reps: '4 mins',
                  rpe: '4.0',
                  tempo: '4-4-4-4',
                  cue: '4s inhale through nose, 4s hold, 4s slow exhale, 4s empty hold. Drop heart rate.',
                  targetWeightKg: 0,
                },
              ]
            : []),
          ...(config.moves >= 5
            ? [
                {
                  id: 'bp-rc-5',
                  name: 'Ab Wheel Rollout (From Knees)',
                  muscle: 'Core • Low-Load Bracing',
                  sets: 2,
                  reps: '8',
                  rpe: '6.5',
                  tempo: '3-0-1-0',
                  cue: 'Tuck pelvis, gentle smooth rollout under control.',
                  targetWeightKg: 0,
                },
              ]
            : []),
        ].slice(0, config.moves),
      };
  }
}
