import { CoachDirective, CoachDispatchedWorkout } from '../../../types';

export type DirectiveItem = CoachDirective;

export const INITIAL_DIRECTIVES: DirectiveItem[] = [
  {
    id: 'dir-1',
    tag: 'RECOVERY',
    title: 'Parasympathetic Reset Protocol',
    summary:
      'Prescribe 15 min box breathing & cold immersion to 3 athletes with elevated CNS fatigue score.',
    affectedCount: 3,
    priority: 'HIGH',
    badgeStyle: 'bg-purple-950/50 text-purple-400 border-purple-800/60',
  },
  {
    id: 'dir-2',
    tag: 'TRAINING',
    title: 'Kinematic Eccentric Tempo Cap',
    summary:
      'Enforce strict 3-second eccentric phase on working squat sets to stabilize knee valgus deviation.',
    affectedCount: 5,
    priority: 'HIGH',
    badgeStyle: 'bg-red-950/50 text-red-400 border-red-800/60',
  },
  {
    id: 'dir-3',
    tag: 'NUTRITION',
    title: 'Carbohydrate Re-Partitioning',
    summary:
      'Scale intra-workout cyclic dextrin by +25g for high-volume microcycle training days.',
    affectedCount: 8,
    priority: 'MEDIUM',
    badgeStyle: 'bg-amber-950/50 text-amber-400 border-amber-800/60',
  },
  {
    id: 'dir-4',
    tag: 'PERFORMANCE',
    title: 'Deltoid Width Hypertrophy Focus',
    summary:
      'Rotate to lateral cable raise drop-sets with 30s rest periods to accelerate deltoid density.',
    affectedCount: 4,
    priority: 'NORMAL',
    badgeStyle: 'bg-blue-950/50 text-blue-400 border-blue-800/60',
  },
];

export const createSampleDispatchedWorkout = (): CoachDispatchedWorkout => {
  return {
    id: `dispatched-${Date.now()}`,
    title: 'Heavy Squat & CNS Primer',
    coachName: 'Lead Coach',
    coachAvatar: 'LC',
    category: 'Strength',
    totalSets: 18,
    durationMins: 65,
    status: 'pending',
    dispatchedAt: new Date().toISOString(),
    notes:
      'Enforce strict 3-second eccentric on working squat sets. Record velocity telemetry on set 3. Zero bounce out of hole.',
    exercises: [
      {
        id: 'disp-ex-1',
        name: 'Barbell High-Bar Pause Squat',
        sets: 4,
        reps: 5,
        rpe: 8.5,
        targetMuscle: 'Quads & Glute Max',
        restSecs: 150,
        notes: '2-second dead pause at parallel depth',
      },
      {
        id: 'disp-ex-2',
        name: 'Deficit Romanian Deadlift',
        sets: 4,
        reps: 6,
        rpe: 8.0,
        targetMuscle: 'Hamstring & Spinal Erectors',
        restSecs: 120,
        notes: 'Stand on 2-inch bumper plate, maintain neutral cervical spine',
      },
      {
        id: 'disp-ex-3',
        name: 'Weighted Neutral Pull-Ups',
        sets: 3,
        reps: 6,
        rpe: 8.5,
        targetMuscle: 'Latissimus Dorsi & Lower Traps',
        restSecs: 90,
        notes: 'Pause 1 second with chin clear over bar',
      },
      {
        id: 'disp-ex-4',
        name: 'Standing Overhead Barbell Press',
        sets: 4,
        reps: 6,
        rpe: 8.5,
        targetMuscle: 'Anterior Delts & Core Brace',
        restSecs: 90,
        notes: 'Glutes locked, head through the window at lockout',
      },
      {
        id: 'disp-ex-5',
        name: 'Hanging Leg Raises to Bar',
        sets: 3,
        reps: 10,
        rpe: 8.0,
        targetMuscle: 'Rectus Abdominis & Grip',
        restSecs: 60,
        notes: 'Slow controlled cadence without swing momentum',
      },
    ],
  };
};
