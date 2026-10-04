// ============================================================================
// PROGRAM & BLUEPRINT TYPE CONTRACTS & MASTER REPOSITORY
// ============================================================================

export type BlueprintCategory =
  | 'Warm-Up'
  | 'Activation / Prime'
  | 'Main Lifts'
  | 'Accessories'
  | 'Finisher';

export interface BlueprintExercise {
  id: string;
  name: string;
  category: BlueprintCategory;
  sets: number;
  reps: string;
  rest: string;
  tempo: string;
  cues: string;
  targetMuscle: string;
  defaultWeightKg?: number;
}

export interface WorkoutBlueprint {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  phase: string;
  focus: string;
  estimatedTime: string;
  description: string;
  targetMuscles: string[];
  exercises: BlueprintExercise[];
}

export interface CoachService {
  id: string;
  title: string;
  price: string;
  duration: string;
  description: string;
}

export interface ProgramStoryHeader {
  id: string;
  blueprintId: string;
  name: string;
  badge: string;
  isReels?: boolean;
  image: string;
  description: string;
}

export interface MicrocycleDayPlan {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  full: string;
  title: string;
  volume: number;
  sets: number;
  targetVol: number;
  targetSets: number;
}

// Re-export all modular category blueprint repositories
export * from './blueprints';

// Aggregate master collection of all 37 blueprints
import { ALL_MASTER_BLUEPRINTS } from './blueprints';

export const WORKOUT_BLUEPRINTS: WorkoutBlueprint[] = ALL_MASTER_BLUEPRINTS;

// Helper record map for O(1) key lookups across all screens
export const WORKOUT_BLUEPRINTS_MAP: Record<string, WorkoutBlueprint> = WORKOUT_BLUEPRINTS.reduce(
  (acc, bp) => {
    acc[bp.id] = bp;
    return acc;
  },
  {} as Record<string, WorkoutBlueprint>
);

export const getWorkoutBlueprint = (id: string): WorkoutBlueprint | undefined => {
  return WORKOUT_BLUEPRINTS_MAP[id] || WORKOUT_BLUEPRINTS.find((b) => b.id === id);
};

export const COACH_PROGRAM_SERVICES: Record<string, CoachService[]> = {
  marcus_vance: [
    {
      id: 's-1',
      title: 'Custom V-Taper Periodization',
      price: '$150',
      duration: 'Monthly Program',
      description: 'Bespoke 4-week clavicular expansion, progressive overload pacing, and weekly form check breakdowns.',
    },
    {
      id: 's-2',
      title: 'Live Video Biomechanics Audit',
      price: '$85',
      duration: '45-Min Video Call',
      description: 'Full anatomical assessment of your bench, lat pulldown, and squat mechanics with custom setup cues.',
    },
  ],
  elena_rostova: [
    {
      id: 's-3',
      title: 'Glute Engine 12-Week Overload',
      price: '$135',
      duration: 'Monthly Mentorship',
      description: 'Targeted hip thrust mechanics, pelvic tilt correction, and shortened/lengthened split programming.',
    },
    {
      id: 's-4',
      title: 'Pelvic & Lumbar Health Assessment',
      price: '$75',
      duration: '30-Min Consultation',
      description: 'Assess lumbar-glute hinge issues, SI joint discomfort, and muscle activation disparities.',
    },
  ],
  kai_lindqvist: [
    {
      id: 's-5',
      title: 'Hyrox Race Pacing Strategy',
      price: '$160',
      duration: 'Monthly Programming',
      description: 'Calibrated compromised running paces, station transition drills, and aerobic engine conditioning.',
    },
    {
      id: 's-6',
      title: 'Sled & SkiErg Power Consultation',
      price: '$90',
      duration: '45-Min Session',
      description: 'Kinetic transfer techniques to shave 2+ minutes off your competition sled push/pull and SkiErg split.',
    },
  ],
  tarik_almansoor: [
    {
      id: 's-7',
      title: 'SBD Platform Peaking Program',
      price: '$175',
      duration: 'Monthly Elite Coaching',
      description: 'Autoregulated RPE sheets, taper timing, fatigue management, and real-time warm-up room handler access.',
    },
  ],
};

export const MICROCYCLE_DAYS: MicrocycleDayPlan[] = [
  { day: 'Mon', full: 'Monday', title: 'Push A (Heavy Bench & Delts)', volume: 6400, sets: 18, targetVol: 6500, targetSets: 18 },
  { day: 'Tue', full: 'Tuesday', title: 'Pull A (Deadlift & Lat Focus)', volume: 7200, sets: 19, targetVol: 7000, targetSets: 18 },
  { day: 'Wed', full: 'Wednesday', title: 'Legs A (Squat & Hamstrings)', volume: 9100, sets: 21, targetVol: 9000, targetSets: 20 },
  { day: 'Thu', full: 'Thursday', title: 'Hyrox Aerobic Interval Run', volume: 2200, sets: 8, targetVol: 2500, targetSets: 8 },
  { day: 'Fri', full: 'Friday', title: 'Push B (Incline & Triceps)', volume: 5800, sets: 16, targetVol: 6000, targetSets: 16 },
  { day: 'Sat', full: 'Saturday', title: 'Pull B (Rows & Biceps Peak)', volume: 6600, sets: 18, targetVol: 6500, targetSets: 18 },
  { day: 'Sun', full: 'Sunday', title: 'Active Recovery & Breathwork', volume: 800, sets: 4, targetVol: 1000, targetSets: 4 },
];
