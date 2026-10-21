import type {
  AthleticVector,
  BlueprintBuilder,
  BlueprintContext,
  SynthesizedBlueprint,
} from './synthTypes';

/** HYROX / METCON: Race Simulation & Work Capacity */
export function hyroxMetcon({
  duration,
  gear,
  intensity,
  config,
}: BlueprintContext): SynthesizedBlueprint {
  return {
    id: `bp-hyrox-${duration}-${gear.replace(/\s+/g, '')}`,
    vector: 'Hyrox/Metcon',
    title: 'O1FC Conditioning & Metcon • Engine Capacity',
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
}

/** SPEED & COD: Elastic Rate of Force Development */
export function speedCod({
  duration,
  gear,
  intensity,
  config,
}: BlueprintContext): SynthesizedBlueprint {
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
}

/** STRENGTH S&C: Central Nervous System Potentiation */
export function strengthSc({
  duration,
  gear,
  intensity,
  config,
}: BlueprintContext): SynthesizedBlueprint {
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
}

export const conditioningBlueprints = {
  'Hyrox/Metcon': hyroxMetcon,
  'Speed & COD': speedCod,
  'Strength S&C': strengthSc,
} satisfies Partial<Record<AthleticVector, BlueprintBuilder>>;
