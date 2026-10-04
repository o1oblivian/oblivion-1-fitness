export interface ProtocolExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  rpe: number;
  weightKg?: number;
  notes: string;
}

export const ROUTINE_PROTOCOLS = [
  'Upper Hypertrophy - Wave A',
  'Lower Strength & Posterior Chain',
  'Full Body Tactical Conditioning',
  'Recovery & Active Mobilization',
] as const;

export type RoutineProtocolTitle = (typeof ROUTINE_PROTOCOLS)[number];

export function getProtocolExercises(routineTitle: string): ProtocolExercise[] {
  switch (routineTitle) {
    case 'Upper Hypertrophy - Wave A':
      return [
        {
          id: 'ex-u1',
          name: 'Incline Dumbbell Bench Press',
          sets: 4,
          reps: 10,
          rpe: 8.5,
          weightKg: 34,
          notes: '2s eccentric tempo, full clavicular stretch',
        },
        {
          id: 'ex-u2',
          name: 'Weighted Neutral Pull-Ups',
          sets: 4,
          reps: 8,
          rpe: 8.0,
          weightKg: 15,
          notes: '1s dead pause at bottom stretch, zero swinging',
        },
        {
          id: 'ex-u3',
          name: 'Cable Lateral Raise',
          sets: 3,
          reps: 15,
          rpe: 9.0,
          weightKg: 10,
          notes: 'Slight forward torso lean, lead with lateral delts',
        },
        {
          id: 'ex-u4',
          name: 'Overhead EZ-Bar Skull Crushers',
          sets: 3,
          reps: 12,
          rpe: 8.0,
          weightKg: 30,
          notes: 'Elbows pinned inward, control terminal extension',
        },
      ];

    case 'Lower Strength & Posterior Chain':
      return [
        {
          id: 'ex-l1',
          name: 'Barbell Back Squat',
          sets: 5,
          reps: 5,
          rpe: 8.5,
          weightKg: 120,
          notes: 'Hit below parallel, explosive concentric drive',
        },
        {
          id: 'ex-l2',
          name: 'Romanian Deadlift (Barbell)',
          sets: 4,
          reps: 8,
          rpe: 8.0,
          weightKg: 100,
          notes: 'Deep hip hinge, maintain neutral cervical spine',
        },
        {
          id: 'ex-l3',
          name: 'Bulgarian Split Squat',
          sets: 3,
          reps: 10,
          rpe: 8.5,
          weightKg: 24,
          notes: 'Shin vertical, descent on 3-count tempo',
        },
        {
          id: 'ex-l4',
          name: 'Standing Single-Leg Calf Raise',
          sets: 4,
          reps: 12,
          rpe: 9.0,
          weightKg: 16,
          notes: '3s pause in full deep dorsiflexion stretch',
        },
      ];

    case 'Full Body Tactical Conditioning':
      return [
        {
          id: 'ex-t1',
          name: 'Trap Bar Deadlift (High Handle)',
          sets: 4,
          reps: 6,
          rpe: 8.0,
          weightKg: 140,
          notes: 'Braced valsalva, drive heels through floor',
        },
        {
          id: 'ex-t2',
          name: 'Barbell Push Press',
          sets: 4,
          reps: 5,
          rpe: 8.5,
          weightKg: 60,
          notes: 'Shallow knee dip, violent hip extension',
        },
        {
          id: 'ex-t3',
          name: 'Heavy Russian Kettlebell Swing',
          sets: 4,
          reps: 20,
          rpe: 8.0,
          weightKg: 32,
          notes: 'Powerful glute lock, horizontal projection',
        },
        {
          id: 'ex-t4',
          name: 'Farmer Walk Carries',
          sets: 3,
          reps: 45,
          rpe: 9.0,
          weightKg: 40,
          notes: '45 seconds constant stride, retracted scapulae',
        },
      ];

    case 'Recovery & Active Mobilization':
    default:
      return [
        {
          id: 'ex-r1',
          name: '90/90 Hip Flow & Shin Box',
          sets: 3,
          reps: 8,
          rpe: 6.0,
          weightKg: 0,
          notes: 'Smooth pelvic rotation, decompress capsules',
        },
        {
          id: 'ex-r2',
          name: 'Thoracic Extension & Foam Roller Openers',
          sets: 3,
          reps: 10,
          rpe: 5.0,
          weightKg: 0,
          notes: 'Synchronize exhale with thoracic arch',
        },
        {
          id: 'ex-r3',
          name: 'Banded Face Pulls & Rotator Cuff Primer',
          sets: 3,
          reps: 15,
          rpe: 6.5,
          weightKg: 5,
          notes: 'Slow external rotation hold at peak contraction',
        },
        {
          id: 'ex-r4',
          name: 'Dead Hang & Diaphragmatic Box Reset',
          sets: 3,
          reps: 60,
          rpe: 5.0,
          weightKg: 0,
          notes: '60 seconds decompressive hang with slow diaphragmatic breaths',
        },
      ];
  }
}
