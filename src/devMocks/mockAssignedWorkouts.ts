import type { CoachDispatchedWorkout } from '../types/coach';

export const MOCK_ASSIGNED_WORKOUTS: CoachDispatchedWorkout[] = [
  {
    id: 'mock-push-day',
    title: 'Push Day · Chest & Shoulder Overload',
    coachName: 'Marcus Reid',
    category: 'Hypertrophy',
    totalSets: 13,
    durationMins: 55,
    status: 'pending',
    dispatchedAt: '2026-10-10T08:00:00.000Z',
    notes: 'Controlled 3s eccentric tempo. Full stretch on each repetition.',
    exercises: [
      { id: 'mock-push-1', name: 'Incline Barbell Bench Press', sets: 4, reps: 8, rpe: 8.5, weightKg: 80, targetMuscle: 'Upper Chest', restSecs: 90 },
      { id: 'mock-push-2', name: 'Seated DB Shoulder Press', sets: 3, reps: 10, rpe: 8.5, weightKg: 28, targetMuscle: 'Front Deltoids', restSecs: 90 },
      { id: 'mock-push-3', name: 'Cable Lateral Raise', sets: 3, reps: 12, rpe: 9, weightKg: 12, targetMuscle: 'Lateral Deltoids', restSecs: 60 },
      { id: 'mock-push-4', name: 'Incline Cable Flye', sets: 3, reps: 12, rpe: 8.5, weightKg: 16, targetMuscle: 'Pectoralis Major', restSecs: 60 },
    ],
  },
  {
    id: 'mock-heavy-squat',
    title: 'Heavy Squat & CNS Primer',
    coachName: 'Dr. Jason Reed',
    category: 'Strength',
    totalSets: 18,
    durationMins: 65,
    status: 'pending',
    dispatchedAt: '2026-10-09T08:00:00.000Z',
    notes: 'Strict 3-second eccentric on working squat sets. Zero bounce out of the hole.',
    exercises: [
      { id: 'mock-squat-1', name: 'Barbell High-Bar Pause Squat', sets: 4, reps: 5, rpe: 8.5, targetMuscle: 'Quads & Glute Max', restSecs: 150, notes: '2-second dead pause at parallel depth' },
      { id: 'mock-squat-2', name: 'Deficit Romanian Deadlift', sets: 4, reps: 6, rpe: 8, targetMuscle: 'Hamstrings & Spinal Erectors', restSecs: 120 },
      { id: 'mock-squat-3', name: 'Weighted Neutral Pull-Ups', sets: 3, reps: 6, rpe: 8.5, targetMuscle: 'Latissimus Dorsi', restSecs: 90 },
      { id: 'mock-squat-4', name: 'Standing Overhead Barbell Press', sets: 4, reps: 6, rpe: 8.5, targetMuscle: 'Anterior Delts & Core', restSecs: 90 },
      { id: 'mock-squat-5', name: 'Hanging Leg Raises to Bar', sets: 3, reps: 10, rpe: 8, targetMuscle: 'Rectus Abdominis', restSecs: 60 },
    ],
  },
];
