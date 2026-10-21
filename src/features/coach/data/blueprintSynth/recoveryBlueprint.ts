import type { BlueprintContext, SynthesizedBlueprint } from './synthTypes';

/** BIO-RECOVERY: Tissue Reperfusion & Active Mobility */
export function bioRecovery({ duration, gear, config }: BlueprintContext): SynthesizedBlueprint {
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
