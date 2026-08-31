import { AthleteTelemetry } from '../types';

export const ATHLETE_TELEMETRY: Record<string, AthleteTelemetry> = {
  'Marcus Vance': {
    athleteId: 'marcus_vance',
    name: 'Marcus Vance',
    handle: '@marcus.lift',
    tier: 'PRO ELITE',
    recoveryScore: 92,
    recoveryTrend: [84, 86, 88, 85, 90, 89, 92],
    prs: [
      { exercise: 'Barbell Bench Press', weight: 142.5, delta: 5.0, date: 'Today' },
      { exercise: 'Incline DB Press', weight: 44.0, delta: 2.0, date: '4 days ago' },
      { exercise: 'Weighted Dips', weight: 30.0, delta: 5.0, date: '1 week ago' },
    ],
    bodyweightHistory: [
      { week: 'W1', weight: 84.5 },
      { week: 'W2', weight: 84.8 },
      { week: 'W3', weight: 84.6 },
      { week: 'W4', weight: 85.0 },
      { week: 'W5', weight: 85.2 },
      { week: 'W6', weight: 85.4 },
    ],
    compliance: {
      trainingAdherence: 96,
      nutritionAdherence: 92,
      weeklyStreak: 7,
    },
    aiBriefing: 'Athlete is demonstrating strong progressive overload adaptation. Acute-to-chronic workload ratio sits at 1.12 (optimal). Recommend 2.5% load progression on primary pressing lifts.',
    exerciseProgress: {
      'Barbell Bench Press': [
        { week: 'W1', estimated1RM: 140, topWeight: 130, totalVolume: 4200, avgRPE: 8 },
        { week: 'W2', estimated1RM: 143, topWeight: 132.5, totalVolume: 4350, avgRPE: 8.5 },
        { week: 'W3', estimated1RM: 146, topWeight: 135, totalVolume: 4500, avgRPE: 8 },
        { week: 'W4', estimated1RM: 148, topWeight: 137.5, totalVolume: 4600, avgRPE: 8.5 },
        { week: 'W5', estimated1RM: 151, topWeight: 140, totalVolume: 4800, avgRPE: 8.5 },
        { week: 'W6', estimated1RM: 154, topWeight: 142.5, totalVolume: 5100, avgRPE: 9 },
      ],
    },
    macroHistory: [
      { date: '2026-08-28', dateLabel: 'TODAY', calories: 2850, calorieTarget: 2800, protein: 195, proteinTarget: 190, carbs: 320, carbsTarget: 310, fat: 72, fatTarget: 70, hydration: 3.8, hydrationTarget: 3.5 },
      { date: '2026-08-27', dateLabel: 'YESTERDAY', calories: 2780, calorieTarget: 2800, protein: 188, proteinTarget: 190, carbs: 305, carbsTarget: 310, fat: 74, fatTarget: 70, hydration: 3.5, hydrationTarget: 3.5 },
      { date: '2026-08-26', dateLabel: 'WED', calories: 2910, calorieTarget: 2800, protein: 202, proteinTarget: 190, carbs: 330, carbsTarget: 310, fat: 70, fatTarget: 70, hydration: 4.0, hydrationTarget: 3.5 },
    ],
    sessions: [
      {
        id: 's-1',
        date: '2026-08-28',
        dateLabel: 'Today',
        title: 'Upper Push Heavy Hypertrophy',
        totalVolume: 6240,
        duration: '52 min',
        avgRPE: 8.4,
        completed: true,
        exercises: [
          { name: 'Barbell Bench Press', sets: [{ weight: 142.5, reps: 3, rpe: 9 }, { weight: 137.5, reps: 4, rpe: 8.5 }], isPR: true, prDelta: 5.0 },
          { name: 'Incline Dumbbell Press', sets: [{ weight: 44, reps: 8, rpe: 8.5 }, { weight: 44, reps: 8, rpe: 9 }] },
        ],
      },
    ],
  },
  'Elena Rostova': {
    athleteId: 'elena_rostova',
    name: 'Elena Rostova',
    handle: '@elena.cross',
    tier: 'HYROX PRO',
    recoveryScore: 78,
    recoveryTrend: [90, 88, 82, 80, 75, 76, 78],
    prs: [
      { exercise: 'Barbell Back Squat', weight: 115.0, delta: 2.5, date: 'Today' },
      { exercise: 'SkiErg 1000m', weight: 3.42, delta: 0.12, date: '3 days ago' },
    ],
    bodyweightHistory: [
      { week: 'W1', weight: 62.0 },
      { week: 'W2', weight: 62.2 },
      { week: 'W3', weight: 61.9 },
      { week: 'W4', weight: 62.1 },
    ],
    compliance: {
      trainingAdherence: 90,
      nutritionAdherence: 82,
      weeklyStreak: 5,
    },
    aiBriefing: 'Acute workload has spiked due to high-intensity sprint intervals combined with squat volume. Mild fatigue accumulation noted; consider deload on auxiliary movements.',
    exerciseProgress: {
      'Barbell Back Squat': [
        { week: 'W1', estimated1RM: 120, topWeight: 105, totalVolume: 3200, avgRPE: 7.5 },
        { week: 'W2', estimated1RM: 124, topWeight: 110, totalVolume: 3400, avgRPE: 8 },
        { week: 'W3', estimated1RM: 128, topWeight: 115, totalVolume: 3600, avgRPE: 8.5 },
      ],
    },
    macroHistory: [
      { date: '2026-08-28', dateLabel: 'TODAY', calories: 2100, calorieTarget: 2300, protein: 98, proteinTarget: 140, carbs: 240, carbsTarget: 270, fat: 55, fatTarget: 60, hydration: 2.6, hydrationTarget: 3.0 },
    ],
    sessions: [],
  },
  'Liam Chen': {
    athleteId: 'liam_chen',
    name: 'Liam Chen',
    handle: '@liam.power',
    tier: 'POWERLIFTING',
    recoveryScore: 88,
    recoveryTrend: [82, 85, 87, 86, 88, 87, 88],
    prs: [
      { exercise: 'Conventional Deadlift', weight: 230.0, delta: 10.0, date: 'Today' },
      { exercise: 'Pendlay Row', weight: 120.0, delta: 5.0, date: '2 days ago' },
    ],
    bodyweightHistory: [
      { week: 'W1', weight: 91.0 },
      { week: 'W2', weight: 91.4 },
      { week: 'W3', weight: 91.6 },
    ],
    compliance: {
      trainingAdherence: 100,
      nutritionAdherence: 94,
      weeklyStreak: 8,
    },
    aiBriefing: 'Deadlift mechanics exceptional. Plateau on flat bench indicates need for paused variations.',
    exerciseProgress: {},
    macroHistory: [],
    sessions: [],
  },
  'Sarah Jenkins': {
    athleteId: 'sarah_jenkins',
    name: 'Sarah Jenkins',
    handle: '@sarah.fit',
    tier: 'STRENGTH',
    recoveryScore: 91,
    recoveryTrend: [86, 88, 89, 91, 90, 91, 91],
    prs: [
      { exercise: 'Barbell Back Squat', weight: 135.0, delta: 7.5, date: 'Today' },
    ],
    bodyweightHistory: [
      { week: 'W1', weight: 67.5 },
      { week: 'W2', weight: 67.8 },
    ],
    compliance: {
      trainingAdherence: 98,
      nutritionAdherence: 95,
      weeklyStreak: 6,
    },
    aiBriefing: 'Excellent quad strength development. E1RM up by 7.5kg this month.',
    exerciseProgress: {},
    macroHistory: [],
    sessions: [],
  },
};

export const EMAIL_BY_ATHLETE: Record<string, string> = {
  'Marcus Vance': 'marcus.vance@ofc.app',
  'Elena Rostova': 'elena.rostova@ofc.app',
  'Liam Chen': 'liam.chen@ofc.app',
  'Sarah Jenkins': 'sarah.jenkins@ofc.app',
  'David Okafor': 'david.okafor@ofc.app',
};

export function getAthleteTelemetryByCoachLog(athleteName: string): AthleteTelemetry {
  if (ATHLETE_TELEMETRY[athleteName]) {
    return ATHLETE_TELEMETRY[athleteName];
  }
  // Default fallback for any athlete
  return {
    athleteId: athleteName.toLowerCase().replace(/\s+/g, '_'),
    name: athleteName,
    handle: `@${athleteName.toLowerCase().replace(/\s+/g, '.')}`,
    tier: 'PRO',
    recoveryScore: 88,
    recoveryTrend: [82, 85, 86, 88, 87, 88, 89],
    prs: [
      { exercise: 'Primary Compound Lift', weight: 120, delta: 2.5, date: 'Recent' },
    ],
    bodyweightHistory: [
      { week: 'W1', weight: 75.0 },
      { week: 'W2', weight: 75.2 },
      { week: 'W3', weight: 75.4 },
    ],
    compliance: {
      trainingAdherence: 92,
      nutritionAdherence: 90,
      weeklyStreak: 4,
    },
    aiBriefing: 'Athlete maintaining consistent training frequency with balanced load distribution.',
    exerciseProgress: {},
    macroHistory: [],
    sessions: [],
  };
}
