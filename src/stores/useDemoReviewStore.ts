import { create } from 'zustand';
import { tactileEngine } from '../services/tactileEngine';
import { Athlete } from '../features/coach/services/coachService';
import { DirectiveItem } from '../features/coach/types/coachDirectives';
import { CoachEarningsTransaction } from '../types';

export interface DemoExerciseSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe: number;
  isPR?: boolean;
}

export interface DemoExerciseItem {
  id: string;
  name: string;
  muscle: string;
  sets: DemoExerciseSet[];
}

export interface DemoWorkoutSession {
  id: string;
  title: string;
  date: string;
  durationMinutes: number;
  volumeKg: number;
  rpeAvg: number;
  strainScore: number;
  exercises: DemoExerciseItem[];
}

export interface DemoMealItem {
  id: string;
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface DemoRadarBuddy {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  distanceKm: number;
  gym: string;
  readiness: number;
  focus: string;
}

export interface DemoPRItem {
  lift: string;
  weightKg: number;
  date: string;
  isRecent: boolean;
}

export interface DemoReviewState {
  isDemoMode: boolean;
  activeDemoTab: string | null;
  toggleDemoMode: () => void;
  setDemoMode: (enabled: boolean) => void;
  setActiveDemoTab: (tab: string | null) => void;
  resetDemoData: () => void;
}

export const DEMO_WORKOUT_SESSION: DemoWorkoutSession = {
  id: 'demo-workout-chest-delts',
  title: 'Hypertrophy Meso A — Chest & Anterior Delts',
  date: 'Today, 09:30 AM',
  durationMinutes: 54,
  volumeKg: 4820,
  rpeAvg: 8.4,
  strainScore: 14.8,
  exercises: [
    {
      id: 'ex-1',
      name: 'Barbell Flat Bench Press',
      muscle: 'Chest',
      sets: [
        { setNumber: 1, weightKg: 100, reps: 8, rpe: 8 },
        { setNumber: 2, weightKg: 100, reps: 8, rpe: 8.5 },
        { setNumber: 3, weightKg: 100, reps: 7, rpe: 9 },
        { setNumber: 4, weightKg: 95, reps: 8, rpe: 9, isPR: false },
      ],
    },
    {
      id: 'ex-2',
      name: 'Incline Dumbbell Press',
      muscle: 'Upper Chest',
      sets: [
        { setNumber: 1, weightKg: 36, reps: 10, rpe: 8 },
        { setNumber: 2, weightKg: 36, reps: 9, rpe: 8.5 },
        { setNumber: 3, weightKg: 34, reps: 10, rpe: 9 },
      ],
    },
    {
      id: 'ex-3',
      name: 'Weighted Chest Dips',
      muscle: 'Triceps & Lower Chest',
      sets: [
        { setNumber: 1, weightKg: 20, reps: 10, rpe: 8 },
        { setNumber: 2, weightKg: 20, reps: 10, rpe: 8.5 },
        { setNumber: 3, weightKg: 20, reps: 8, rpe: 9 },
      ],
    },
    {
      id: 'ex-4',
      name: 'Cable Lateral Raises (Dual Pulley)',
      muscle: 'Lateral Deltoids',
      sets: [
        { setNumber: 1, weightKg: 14, reps: 15, rpe: 8 },
        { setNumber: 2, weightKg: 14, reps: 15, rpe: 8.5 },
        { setNumber: 3, weightKg: 12, reps: 16, rpe: 9 },
      ],
    },
  ],
};

export const DEMO_FUEL_LOGS: DemoMealItem[] = [
  {
    id: 'demo-meal-1',
    name: '4 Whole Pasture Eggs + 2 Slices Sourdough Toast',
    time: '07:30 AM',
    calories: 520,
    protein: 36,
    carbs: 42,
    fats: 22,
  },
  {
    id: 'demo-meal-2',
    name: 'Whey Isolate Shake + 1 Ripe Banana + Oat Milk',
    time: '11:00 AM',
    calories: 340,
    protein: 38,
    carbs: 38,
    fats: 4,
  },
  {
    id: 'demo-meal-3',
    name: 'Grilled Chicken Breast (220g) + Jasmine Rice + Steamed Broccoli',
    time: '01:30 PM',
    calories: 680,
    protein: 64,
    carbs: 76,
    fats: 12,
  },
  {
    id: 'demo-meal-4',
    name: 'Wild Salmon Fillet (200g) + Baked Sweet Potato + Asparagus',
    time: '07:45 PM',
    calories: 600,
    protein: 44,
    carbs: 56,
    fats: 22,
  },
];

export const DEMO_VOICE_PROMPTS = [
  'Grilled chicken breast 220 grams with jasmine rice and olive oil',
  'Whey isolate shake with a banana and almond milk',
  'Wild salmon fillet 200 grams with baked sweet potato and asparagus',
];

export const DEMO_RADAR_BUDDIES: DemoRadarBuddy[] = [
  {
    id: 'buddy-1',
    name: 'Alex Rivers',
    handle: '@alex_rivers',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    distanceKm: 1.2,
    gym: 'MetroFlex Elite Gym',
    readiness: 94,
    focus: 'Heavy Squats & Deadlifts',
  },
  {
    id: 'buddy-2',
    name: 'Elena Rostova',
    handle: '@rostova_tactical',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    distanceKm: 2.4,
    gym: 'Equinox Tactical Center',
    readiness: 88,
    focus: 'HYROX Aerobic Capacity',
  },
  {
    id: 'buddy-3',
    name: 'Marcus Bennett',
    handle: '@bennett_strength',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    distanceKm: 3.8,
    gym: "Gold's Gym Venice",
    readiness: 81,
    focus: 'Upper Hypertrophy Deload',
  },
];

export const DEMO_PRS: DemoPRItem[] = [
  { lift: 'Conventional Deadlift', weightKg: 240, date: 'Sep 18, 2026', isRecent: true },
  { lift: 'Competition Bench Press', weightKg: 155, date: 'Sep 21, 2026', isRecent: true },
  { lift: 'Olympic High-Bar Squat', weightKg: 195, date: 'Aug 29, 2026', isRecent: false },
  { lift: 'Standing Strict Press', weightKg: 92.5, date: 'Sep 04, 2026', isRecent: false },
];

export const DEMO_REVIEW_ATHLETES: Athlete[] = [
  {
    id: 'ath-alex-rivers',
    client_id: 'ath-alex-rivers',
    name: 'Alex Rivers',
    handle: '@alex_rivers',
    status: 'Active',
    readiness: 92,
    volume: 46200,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    lastActive: 'Today, 07:45 AM',
  },
  {
    id: 'ath-elena-rostova',
    client_id: 'ath-elena-rostova',
    name: 'Elena Rostova',
    handle: '@rostova_tactical',
    status: 'Check-in',
    readiness: 88,
    volume: 38400,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    lastActive: 'Yesterday',
  },
  {
    id: 'ath-jordan-miller',
    client_id: 'ath-jordan-miller',
    name: 'Jordan Miller',
    handle: '@jmiller_power',
    status: 'Need Routine',
    readiness: 78,
    volume: 52100,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    lastActive: '2 days ago',
  },
];

export const DEMO_REVIEW_DIRECTIVES: DirectiveItem[] = [
  {
    id: 'demo-dir-1',
    tag: 'RECOVERY',
    title: 'CNS Autoregulation Flag',
    summary: '2 athletes flagged HRV drop > 15% following heavy deadlift microcycle.',
    affectedCount: 2,
    priority: 'HIGH',
    badgeStyle: 'bg-red-950/60 text-red-400 border-red-800/60',
  },
  {
    id: 'demo-dir-2',
    tag: 'TRAINING',
    title: 'Hypertrophy Meso A Transition',
    summary: 'Week 4 deload schedule pending broadcast for 12 roster members.',
    affectedCount: 12,
    priority: 'MEDIUM',
    badgeStyle: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
  },
  {
    id: 'demo-dir-3',
    tag: 'NUTRITION',
    title: 'Post-Workout Glycogen Audit',
    summary: 'Carbohydrate timing optimization active across endurance cohort.',
    affectedCount: 6,
    priority: 'NORMAL',
    badgeStyle: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
  },
];

export const DEMO_REVIEW_EARNINGS: CoachEarningsTransaction[] = [
  {
    id: 'demo-earn-1',
    athleteName: 'Alex Rivers',
    plan: '1-on-1 Premium S&C Retainer',
    amount: 149,
    date: 'Sep 22, 2026',
    status: 'COMPLETED',
  },
  {
    id: 'demo-earn-2',
    athleteName: 'Elena Rostova',
    plan: 'Tactical Conditioning Squad',
    amount: 59,
    date: 'Sep 20, 2026',
    status: 'COMPLETED',
  },
  {
    id: 'demo-earn-3',
    athleteName: 'Jordan Miller',
    plan: 'Biomechanics Video Audit',
    amount: 89,
    date: 'Sep 18, 2026',
    status: 'COMPLETED',
  },
];

const STORAGE_KEY = 'o1fc_demo_review_mode';

const getInitialDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'true') {
    // Clear stale demo mode flag so athlete's genuine logged data is always displayed
    localStorage.removeItem(STORAGE_KEY);
  }
  return false;
};

export const useDemoReviewStore = create<DemoReviewState>((set, get) => ({
  isDemoMode: getInitialDemoMode(),
  activeDemoTab: null,

  setActiveDemoTab: (tab: string | null) => {
    set({ activeDemoTab: tab });
  },

  toggleDemoMode: () => {
    tactileEngine.triggerSelectionBuzz();
    const next = !get().isDemoMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(next));
    }
    set({ isDemoMode: next });
  },

  setDemoMode: (enabled: boolean) => {
    tactileEngine.triggerSelectionBuzz();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    }
    set({ isDemoMode: enabled });
  },

  resetDemoData: () => {
    tactileEngine.playPRCelebration();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    set({ isDemoMode: true });
  },
}));
