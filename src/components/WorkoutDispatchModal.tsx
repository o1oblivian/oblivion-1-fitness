import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Trash2,
  Search,
  Check,
  Users,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  ArrowUpRight,
  Flame,
  Zap,
  Layers,
  Sparkles,
  Link2,
  Unlink,
  RotateCcw,
  SlidersHorizontal,
  Activity,
  CheckCircle2,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { AthleteData } from '../types';
import { DispatchedExercise, dispatchWorkout } from '../utils/dispatchStore';
import {
  EXERCISE_DATABASE,
  SPORTS_CATEGORIES,
  RECOVERY_CATEGORIES,
} from '../data/exerciseDatabase';

interface WorkoutDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Record<string, AthleteData>;
  initialSelectedClientKeys?: string[];
  onDispatchSuccess?: (count: number) => void;
  coachName?: string;
}

export type SetType = 'working' | 'warmup' | 'dropset' | 'amrap' | 'cluster';

export interface IntelligentSet {
  setNum: number;
  type: SetType;
  reps: number;
  weight: number;
  rpe: number;
}

export interface StagedExercise {
  id: string;
  name: string;
  category: string;
  primaryMuscle: string;
  movementType: 'Compound' | 'Isolation' | 'Functional' | 'Plyometric' | 'Mobility';
  restSec: number;
  tempo: string;
  supersetGroup?: string; // e.g. 'A1', 'A2', 'B1', 'B2'
  progressionScheme: 'Straight' | 'Ascending' | 'Pyramid' | 'Reverse Pyramid' | 'Wave 5/3/1' | 'Cluster 4x(2+2)';
  sets: IntelligentSet[];
  notes: string;
  isExpanded?: boolean;
}

export interface CuratedExercise {
  id: string;
  name: string;
  split: 'PUSH' | 'PULL' | 'LEGS' | 'ARMS' | 'SHOULDERS' | 'CORE' | 'HYROX' | 'SPORT' | 'RECOVERY' | 'FULL_BODY';
  muscleGroup: string;
  subMuscle: string;
  type: 'Compound' | 'Isolation' | 'Functional' | 'Plyometric' | 'Mobility';
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
  defaultRpe: number;
  defaultRestSec: number;
  defaultTempo: string;
  coachingCue: string;
  smartPairings?: string[]; // Recommended next moves
}

// ═══════════════════════════════════════════════════════════════════════
// STRICT & INTELLIGENT ANATOMICAL EXERCISE VAULT
// ═══════════════════════════════════════════════════════════════════════
export const CURATED_EXERCISE_LIBRARY: CuratedExercise[] = [
  // ─── PUSH (Strictly Chest, Anterior/Lateral Delts, Triceps) ───
  {
    id: 'push_bb_flat_bench',
    name: 'Barbell Flat Bench Press',
    split: 'PUSH',
    muscleGroup: 'Chest',
    subMuscle: 'Mid Sternal Pecs',
    type: 'Compound',
    defaultSets: 4,
    defaultReps: 6,
    defaultWeight: 80,
    defaultRpe: 8.5,
    defaultRestSec: 120,
    defaultTempo: '3-1-1-0',
    coachingCue: 'Plant feet firmly. Touch mid-sternum, drive bar back over shoulders.',
    smartPairings: ['Incline Dumbbell Press', 'Cable Chest Flyes', 'Triceps Pushdown (Rope)'],
  },
  {
    id: 'push_incline_bb_press',
    name: 'Incline Barbell Bench Press (30°)',
    split: 'PUSH',
    muscleGroup: 'Chest',
    subMuscle: 'Upper Clavicular Pecs',
    type: 'Compound',
    defaultSets: 4,
    defaultReps: 8,
    defaultWeight: 70,
    defaultRpe: 8,
    defaultRestSec: 90,
    defaultTempo: '3-0-1-0',
    coachingCue: 'Touch upper sternum. Retract scapulae, maintain slight wrist extension.',
    smartPairings: ['Flat Dumbbell Press', 'Pec Deck Fly', 'Overhead Tricep Extension'],
  },
  {
    id: 'push_incline_db_press',
    name: 'Incline Dumbbell Press',
    split: 'PUSH',
    muscleGroup: 'Chest',
    subMuscle: 'Upper Clavicular Pecs',
    type: 'Compound',
    defaultSets: 4,
    defaultReps: 10,
    defaultWeight: 32,
    defaultRpe: 8.5,
    defaultRestSec: 90,
    defaultTempo: '3-1-1-0',
    coachingCue: 'Deep stretch at bottom. Drive dumbbells up and inwards without clacking.',
    smartPairings: ['Dips (Chest Focus)', 'Cable Lateral Raise', 'Skull Crushers (EZ Bar)'],
  },
  {
    id: 'push_flat_db_press',
    name: 'Flat Dumbbell Press',
    split: 'PUSH',
    muscleGroup: 'Chest',
    subMuscle: 'Mid Sternal Pecs',
    type: 'Compound',
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: 34,
    defaultRpe: 8,
    defaultRestSec: 90,
    defaultTempo: '3-0-1-0',
    coachingCue: 'Elbows at 45 degrees. Explosive concentric drive.',
    smartPairings: ['Cable Chest Flyes', 'Overhead Dumbbell Press', 'Triceps Pushdown (Straight Bar)'],
  },
  {
    id: 'push_pec_deck_fly',
    name: 'Pec Deck Machine Fly',
    split: 'PUSH',
    muscleGroup: 'Chest',
    subMuscle: 'Inner/Sternal Pecs',
    type: 'Isolation',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 55,
    defaultRpe: 8.5,
    defaultRestSec: 60,
    defaultTempo: '3-0-1-1',
    coachingCue: 'Hold peak contraction for 1 second. Control 3-second negative stretch.',
    smartPairings: ['Overhead Cable Tricep Extension', 'Lateral Raise (Dumbbells)'],
  },
  {
    id: 'push_cable_crossover',
    name: 'Cable High-to-Low Crossover',
    split: 'PUSH',
    muscleGroup: 'Chest',
    subMuscle: 'Lower Costal Pecs',
    type: 'Isolation',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 20,
    defaultRpe: 8,
    defaultRestSec: 60,
    defaultTempo: '2-0-1-1',
    coachingCue: 'Cross hands at bottom. Squeeze lower chest firmly.',
    smartPairings: ['Triceps Pushdown (Rope)', 'Close Grip Bench Press'],
  },
  {
    id: 'push_dips_chest',
    name: 'Parallel Bar Dips (Weighted)',
    split: 'PUSH',
    muscleGroup: 'Chest',
    subMuscle: 'Lower Pecs & Triceps',
    type: 'Compound',
    defaultSets: 3,
    defaultReps: 8,
    defaultWeight: 15,
    defaultRpe: 8.5,
    defaultRestSec: 90,
    defaultTempo: '3-1-1-0',
    coachingCue: 'Lean torso forward 30 degrees to bias chest. Flare elbows slightly.',
    smartPairings: ['Cable Lateral Raise', 'Pec Deck Fly'],
  },
  {
    id: 'push_overhead_press',
    name: 'Overhead Barbell Military Press',
    split: 'PUSH',
    muscleGroup: 'Shoulders',
    subMuscle: 'Anterior Deltoids',
    type: 'Compound',
    defaultSets: 4,
    defaultReps: 6,
    defaultWeight: 55,
    defaultRpe: 8.5,
    defaultRestSec: 120,
    defaultTempo: '2-1-1-0',
    coachingCue: 'Glutes and core locked. Press straight up, push head through window at top.',
    smartPairings: ['Cable Lateral Raise', 'Dumbbell Incline Press', 'Skull Crushers (EZ Bar)'],
  },
  {
    id: 'push_db_shoulder_press',
    name: 'Seated Dumbbell Shoulder Press',
    split: 'PUSH',
    muscleGroup: 'Shoulders',
    subMuscle: 'Anterior & Lateral Delts',
    type: 'Compound',
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: 24,
    defaultRpe: 8,
    defaultRestSec: 90,
    defaultTempo: '3-0-1-0',
    coachingCue: 'Lower dumbbells to ear level. Drive up in smooth arc without locking elbows.',
    smartPairings: ['Cable Lateral Raise', 'Triceps Pushdown (Rope)'],
  },
  {
    id: 'push_cable_lateral_raise',
    name: 'Cable Lateral Raise (Behind Body)',
    split: 'PUSH',
    muscleGroup: 'Shoulders',
    subMuscle: 'Lateral Deltoids',
    type: 'Isolation',
    defaultSets: 4,
    defaultReps: 15,
    defaultWeight: 10,
    defaultRpe: 9,
    defaultRestSec: 45,
    defaultTempo: '2-0-1-1',
    coachingCue: 'Constant tension throughout full range. Lead with elbows.',
    smartPairings: ['Overhead Tricep Extension', 'Pec Deck Fly'],
  },
  {
    id: 'push_db_lateral_raise',
    name: 'Dumbbell Lateral Raise',
    split: 'PUSH',
    muscleGroup: 'Shoulders',
    subMuscle: 'Lateral Deltoids',
    type: 'Isolation',
    defaultSets: 4,
    defaultReps: 12,
    defaultWeight: 12,
    defaultRpe: 8.5,
    defaultRestSec: 60,
    defaultTempo: '2-0-1-0',
    coachingCue: 'Slight torso forward lean. Raise outward to 90 degrees.',
    smartPairings: ['Triceps Pushdown (Rope)', 'Incline Dumbbell Press'],
  },
  {
    id: 'push_close_grip_bench',
    name: 'Close Grip Bench Press',
    split: 'PUSH',
    muscleGroup: 'Arms',
    subMuscle: 'Triceps (Medial & Lateral)',
    type: 'Compound',
    defaultSets: 3,
    defaultReps: 8,
    defaultWeight: 65,
    defaultRpe: 8,
    defaultRestSec: 90,
    defaultTempo: '3-1-1-0',
    coachingCue: 'Hands shoulder-width apart. Keep elbows tucked tightly against ribcage.',
    smartPairings: ['Overhead Cable Tricep Extension', 'Cable Lateral Raise'],
  },
  {
    id: 'push_tricep_rope_pushdown',
    name: 'Triceps Pushdown (Rope)',
    split: 'PUSH',
    muscleGroup: 'Arms',
    subMuscle: 'Triceps (Lateral Head)',
    type: 'Isolation',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 25,
    defaultRpe: 8.5,
    defaultRestSec: 60,
    defaultTempo: '2-0-1-1',
    coachingCue: 'Spread rope apart at bottom. Pin elbows stationary at sides.',
    smartPairings: ['Overhead Tricep Extension', 'Cable Chest Flyes'],
  },
  {
    id: 'push_overhead_tricep_ext',
    name: 'Overhead Cable Tricep Extension',
    split: 'PUSH',
    muscleGroup: 'Arms',
    subMuscle: 'Triceps (Long Head)',
    type: 'Isolation',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 22.5,
    defaultRpe: 8.5,
    defaultRestSec: 60,
    defaultTempo: '3-0-1-0',
    coachingCue: 'Full long head stretch behind head. Extend without flaring elbows.',
    smartPairings: ['Triceps Pushdown (Rope)', 'Pec Deck Fly'],
  },
  {
    id: 'push_skull_crushers',
    name: 'Skull Crushers (EZ Bar)',
    split: 'PUSH',
    muscleGroup: 'Arms',
    subMuscle: 'Triceps (Long & Medial)',
    type: 'Isolation',
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: 35,
    defaultRpe: 8.5,
    defaultRestSec: 75,
    defaultTempo: '3-1-1-0',
    coachingCue: 'Lower bar towards crown of head. Keep upper arms angled slightly back.',
    smartPairings: ['Dips (Chest Focus)', 'Cable Lateral Raise'],
  },

  // ─── PULL (Strictly Back, Lats, Rhomboids, Traps, Biceps, Rear Delts) ───
  {
    id: 'pull_deadlift_conv',
    name: 'Conventional Barbell Deadlift',
    split: 'PULL',
    muscleGroup: 'Back',
    subMuscle: 'Posterior Chain & Lats',
    type: 'Compound',
    defaultSets: 4,
    defaultReps: 5,
    defaultWeight: 140,
    defaultRpe: 8.5,
    defaultRestSec: 150,
    defaultTempo: '2-1-1-0',
    coachingCue: 'Pack lats before pulling. Push floor away, lockout with glutes.',
    smartPairings: ['Weighted Pull-ups', 'Chest-Supported T-Bar Row', 'Incline Dumbbell Curl'],
  },
  {
    id: 'pull_weighted_pullups',
    name: 'Weighted Pull-ups',
    split: 'PULL',
    muscleGroup: 'Back',
    subMuscle: 'Latissimus Dorsi',
    type: 'Compound',
    defaultSets: 4,
    defaultReps: 6,
    defaultWeight: 15,
    defaultRpe: 8.5,
    defaultRestSec: 120,
    defaultTempo: '3-1-1-0',
    coachingCue: 'Full dead-hang at bottom. Drive elbows down to hips, chest to bar.',
    smartPairings: ['Chest-Supported T-Bar Row', 'Face Pulls (Cable)', 'Incline Dumbbell Curl'],
  },
  {
    id: 'pull_lat_pulldown_wide',
    name: 'Wide-Grip Lat Pulldown',
    split: 'PULL',
    muscleGroup: 'Back',
    subMuscle: 'Upper Lats & Teres Major',
    type: 'Compound',
    defaultSets: 4,
    defaultReps: 10,
    defaultWeight: 65,
    defaultRpe: 8,
    defaultRestSec: 90,
    defaultTempo: '3-0-1-1',
    coachingCue: 'Slight torso arch. Pull bar to upper collarbone, squeezing scapulae down.',
    smartPairings: ['Seated Cable Row', 'Reverse Pec Deck (Rear Delt)', 'Barbell Bicep Curl'],
  },
  {
    id: 'pull_tbar_row',
    name: 'Chest-Supported T-Bar Row',
    split: 'PULL',
    muscleGroup: 'Back',
    subMuscle: 'Mid Back & Rhomboids',
    type: 'Compound',
    defaultSets: 4,
    defaultReps: 8,
    defaultWeight: 60,
    defaultRpe: 8.5,
    defaultRestSec: 90,
    defaultTempo: '3-1-1-1',
    coachingCue: 'Chest pinned to pad. Retract rhomboids fully at apex.',
    smartPairings: ['Straight Arm Cable Pulldown', 'Hammer Curls (Dumbbell)', 'Face Pulls (Cable)'],
  },
  {
    id: 'pull_bb_bent_row',
    name: 'Barbell Bent-Over Row (Overhand)',
    split: 'PULL',
    muscleGroup: 'Back',
    subMuscle: 'Mid Back & Lats',
    type: 'Compound',
    defaultSets: 4,
    defaultReps: 8,
    defaultWeight: 80,
    defaultRpe: 8.5,
    defaultRestSec: 105,
    defaultTempo: '3-1-1-0',
    coachingCue: 'Torso at 45 degrees. Pull bar to belly button without swinging.',
    smartPairings: ['Lat Pulldown (Neutral Grip)', 'Incline Dumbbell Curl', 'Reverse Pec Deck (Rear Delt)'],
  },
  {
    id: 'pull_seated_cable_row',
    name: 'Seated Cable Row (Close Grip)',
    split: 'PULL',
    muscleGroup: 'Back',
    subMuscle: 'Mid Back & Low Lats',
    type: 'Compound',
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: 70,
    defaultRpe: 8,
    defaultRestSec: 75,
    defaultTempo: '3-0-1-1',
    coachingCue: 'Allow lats to stretch forward, then row handle into lower abdomen.',
    smartPairings: ['Straight Arm Cable Pulldown', 'Preacher Curl (EZ Bar)', 'Face Pulls (Cable)'],
  },
  {
    id: 'pull_single_arm_db_row',
    name: 'Single-Arm Dumbbell Row',
    split: 'PULL',
    muscleGroup: 'Back',
    subMuscle: 'Latissimus Dorsi',
    type: 'Compound',
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: 36,
    defaultRpe: 8.5,
    defaultRestSec: 75,
    defaultTempo: '3-0-1-0',
    coachingCue: 'Pull elbow back along hip pocket. Avoid rotating torso excessively.',
    smartPairings: ['Lat Pulldown (Neutral Grip)', 'Hammer Curls (Dumbbell)'],
  },
  {
    id: 'pull_straight_arm_pulldown',
    name: 'Straight Arm Cable Pulldown',
    split: 'PULL',
    muscleGroup: 'Back',
    subMuscle: 'Lats & Teres Major',
    type: 'Isolation',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 30,
    defaultRpe: 8,
    defaultRestSec: 60,
    defaultTempo: '3-0-1-1',
    coachingCue: 'Keep arms nearly straight. Pull bar in sweeping arc down to thighs.',
    smartPairings: ['Incline Dumbbell Curl', 'Face Pulls (Cable)'],
  },
  {
    id: 'pull_face_pulls',
    name: 'Face Pulls (Cable / Rope)',
    split: 'PULL',
    muscleGroup: 'Shoulders',
    subMuscle: 'Rear Delts & Rotator Cuff',
    type: 'Isolation',
    defaultSets: 4,
    defaultReps: 15,
    defaultWeight: 25,
    defaultRpe: 8,
    defaultRestSec: 60,
    defaultTempo: '2-0-1-1',
    coachingCue: 'Pull rope toward forehead, rotating hands backwards at finish.',
    smartPairings: ['Incline Dumbbell Curl', 'Chest-Supported T-Bar Row'],
  },
  {
    id: 'pull_rear_delt_fly',
    name: 'Reverse Pec Deck (Rear Delt)',
    split: 'PULL',
    muscleGroup: 'Shoulders',
    subMuscle: 'Posterior Deltoids',
    type: 'Isolation',
    defaultSets: 3,
    defaultReps: 15,
    defaultWeight: 45,
    defaultRpe: 8.5,
    defaultRestSec: 60,
    defaultTempo: '2-0-1-1',
    coachingCue: 'Keep elbows high and soft. Lead with back of shoulders.',
    smartPairings: ['Barbell Bicep Curl', 'Lat Pulldown (Neutral Grip)'],
  },
  {
    id: 'pull_barbell_bicep_curl',
    name: 'Standing Barbell Bicep Curl',
    split: 'PULL',
    muscleGroup: 'Arms',
    subMuscle: 'Biceps (Short & Long Head)',
    type: 'Isolation',
    defaultSets: 3,
    defaultReps: 8,
    defaultWeight: 40,
    defaultRpe: 8.5,
    defaultRestSec: 75,
    defaultTempo: '3-0-1-0',
    coachingCue: 'Strict torso posture. Squeeze biceps hard at top without swinging hips.',
    smartPairings: ['Hammer Curls (Dumbbell)', 'Face Pulls (Cable)'],
  },
  {
    id: 'pull_incline_db_curl',
    name: 'Incline Dumbbell Curl (45°)',
    split: 'PULL',
    muscleGroup: 'Arms',
    subMuscle: 'Biceps (Long Head Stretch)',
    type: 'Isolation',
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: 14,
    defaultRpe: 8.5,
    defaultRestSec: 60,
    defaultTempo: '3-1-1-0',
    coachingCue: 'Deep bicep stretch at bottom. Supinate wrist fully on ascent.',
    smartPairings: ['Hammer Curls (Dumbbell)', 'Straight Arm Cable Pulldown'],
  },
  {
    id: 'pull_hammer_curls',
    name: 'Hammer Curls (Dumbbell)',
    split: 'PULL',
    muscleGroup: 'Arms',
    subMuscle: 'Brachialis & Forearms',
    type: 'Isolation',
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: 16,
    defaultRpe: 8,
    defaultRestSec: 60,
    defaultTempo: '3-0-1-0',
    coachingCue: 'Neutral palms facing each other. Controlled eccentric lowering.',
    smartPairings: ['Preacher Curl (EZ Bar)', 'Face Pulls (Cable)'],
  },
  {
    id: 'pull_preacher_curl',
    name: 'Preacher Curl (EZ Bar)',
    split: 'PULL',
    muscleGroup: 'Arms',
    subMuscle: 'Biceps (Short Head Peak)',
    type: 'Isolation',
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: 30,
    defaultRpe: 8.5,
    defaultRestSec: 60,
    defaultTempo: '3-1-1-0',
    coachingCue: 'Armpits flush against pad. Avoid bouncing at bottom.',
    smartPairings: ['Reverse Pec Deck (Rear Delt)', 'Incline Dumbbell Curl'],
  },

  // ─── LEGS (Strictly Quads, Hamstrings, Glutes, Calves) ───
  {
    id: 'legs_back_squat',
    name: 'Barbell Back Squat (High Bar)',
    split: 'LEGS',
    muscleGroup: 'Quads',
    subMuscle: 'Quads & Glutes',
    type: 'Compound',
    defaultSets: 4,
    defaultReps: 6,
    defaultWeight: 120,
    defaultRpe: 8.5,
    defaultRestSec: 150,
    defaultTempo: '3-1-1-0',
    coachingCue: 'Brace abdominal wall. Break at hips and knees simultaneously to depth.',
    smartPairings: ['Romanian Deadlift (Barbell)', 'Leg Extension Machine', 'Standing Calf Raise'],
  },
  {
    id: 'legs_front_squat',
    name: 'Barbell Front Squat',
    split: 'LEGS',
    muscleGroup: 'Quads',
    subMuscle: 'Anterior Quads & Upper Back',
    type: 'Compound',
    defaultSets: 4,
    defaultReps: 6,
    defaultWeight: 90,
    defaultRpe: 8.5,
    defaultRestSec: 120,
    defaultTempo: '3-1-1-0',
    coachingCue: 'High elbows rack position. Keep torso completely upright.',
    smartPairings: ['Lying Leg Curl', 'Bulgarian Split Squat', 'Standing Calf Raise'],
  },
  {
    id: 'legs_hack_squat',
    name: 'Hack Squat Machine',
    split: 'LEGS',
    muscleGroup: 'Quads',
    subMuscle: 'Vastus Lateralis / Tear Drop',
    type: 'Compound',
    defaultSets: 4,
    defaultReps: 10,
    defaultWeight: 110,
    defaultRpe: 9,
    defaultRestSec: 105,
    defaultTempo: '3-1-1-0',
    coachingCue: 'Feet mid-platform. Achieve full knee flexion with controlled cadence.',
    smartPairings: ['Seated Hamstring Curl', 'Barbell Hip Thrust', 'Leg Extension Machine'],
  },
  {
    id: 'legs_leg_press',
    name: '45° Incline Leg Press',
    split: 'LEGS',
    muscleGroup: 'Quads',
    subMuscle: 'Quads & Adductors',
    type: 'Compound',
    defaultSets: 4,
    defaultReps: 12,
    defaultWeight: 200,
    defaultRpe: 8.5,
    defaultRestSec: 90,
    defaultTempo: '3-0-1-0',
    coachingCue: 'Do not allow lower back to round off pad at bottom.',
    smartPairings: ['Romanian Deadlift (Barbell)', 'Leg Extension Machine', 'Seated Calf Raise'],
  },
  {
    id: 'legs_bulgarian_split_squat',
    name: 'Bulgarian Split Squat (Dumbbells)',
    split: 'LEGS',
    muscleGroup: 'Glutes',
    subMuscle: 'Glute Max & Quads',
    type: 'Compound',
    defaultSets: 3,
    defaultReps: 8,
    defaultWeight: 24,
    defaultRpe: 8.5,
    defaultRestSec: 90,
    defaultTempo: '3-1-1-0',
    coachingCue: 'Rear foot elevated on bench. Drive through front heel with slight torso forward tilt.',
    smartPairings: ['Lying Leg Curl', 'Leg Extension Machine', 'Standing Calf Raise'],
  },
  {
    id: 'legs_rdl_barbell',
    name: 'Romanian Deadlift (Barbell)',
    split: 'LEGS',
    muscleGroup: 'Hamstrings',
    subMuscle: 'Hamstrings & Glute Fold',
    type: 'Compound',
    defaultSets: 4,
    defaultReps: 8,
    defaultWeight: 100,
    defaultRpe: 8.5,
    defaultRestSec: 105,
    defaultTempo: '3-1-1-0',
    coachingCue: 'Soft knees. Hinge hips back until deep hamstring stretch is felt.',
    smartPairings: ['Leg Extension Machine', 'Barbell Hip Thrust', 'Standing Calf Raise'],
  },
  {
    id: 'legs_hip_thrust',
    name: 'Barbell Hip Thrust',
    split: 'LEGS',
    muscleGroup: 'Glutes',
    subMuscle: 'Gluteus Maximus',
    type: 'Compound',
    defaultSets: 4,
    defaultReps: 10,
    defaultWeight: 130,
    defaultRpe: 8.5,
    defaultRestSec: 90,
    defaultTempo: '2-1-1-1',
    coachingCue: 'Chin tucked, ribs down. Full hip extension with 1s lockout at top.',
    smartPairings: ['Seated Hamstring Curl', 'Bulgarian Split Squat'],
  },
  {
    id: 'legs_leg_extension',
    name: 'Leg Extension Machine',
    split: 'LEGS',
    muscleGroup: 'Quads',
    subMuscle: 'Rectus Femoris',
    type: 'Isolation',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 60,
    defaultRpe: 9,
    defaultRestSec: 60,
    defaultTempo: '3-0-1-1',
    coachingCue: 'Point toes straight up. Squeeze quads aggressively at peak.',
    smartPairings: ['Seated Hamstring Curl', 'Standing Calf Raise'],
  },
  {
    id: 'legs_seated_leg_curl',
    name: 'Seated Hamstring Curl',
    split: 'LEGS',
    muscleGroup: 'Hamstrings',
    subMuscle: 'Biceps Femoris / Semitendinosus',
    type: 'Isolation',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 55,
    defaultRpe: 9,
    defaultRestSec: 60,
    defaultTempo: '3-0-1-1',
    coachingCue: 'Lean forward slightly for greater hamstring stretch. Full curl to pad.',
    smartPairings: ['Leg Extension Machine', 'Standing Calf Raise'],
  },
  {
    id: 'legs_standing_calf_raise',
    name: 'Standing Calf Raise',
    split: 'LEGS',
    muscleGroup: 'Calves',
    subMuscle: 'Gastrocnemius',
    type: 'Isolation',
    defaultSets: 4,
    defaultReps: 15,
    defaultWeight: 75,
    defaultRpe: 8.5,
    defaultRestSec: 45,
    defaultTempo: '3-1-1-1',
    coachingCue: 'Full 2-second stretch at bottom, drive onto big toes at top.',
    smartPairings: ['Leg Extension Machine', 'Seated Hamstring Curl'],
  },

  // ─── HYROX & FUNCTIONAL (Race Sim, Metcon, Ergonomics) ───
  {
    id: 'hyrox_skierg',
    name: 'SkiErg 1000m Race Pace',
    split: 'HYROX',
    muscleGroup: 'Full Body',
    subMuscle: 'Lats & Core Engine',
    type: 'Functional',
    defaultSets: 3,
    defaultReps: 1000,
    defaultWeight: 0,
    defaultRpe: 9,
    defaultRestSec: 120,
    defaultTempo: 'Continuous',
    coachingCue: 'Hinge hips, drive arms down through core. Maintain target 500m split.',
    smartPairings: ['Sled Push 50m Heavy', 'Wall Balls (9kg)', 'Burpee Broad Jumps 80m'],
  },
  {
    id: 'hyrox_sled_push',
    name: 'Sled Push 50m Heavy',
    split: 'HYROX',
    muscleGroup: 'Quads',
    subMuscle: 'Quads & Calves Drive',
    type: 'Functional',
    defaultSets: 4,
    defaultReps: 50,
    defaultWeight: 152,
    defaultRpe: 9.5,
    defaultRestSec: 90,
    defaultTempo: 'Power Cadence',
    coachingCue: 'Arms straight, 45 degree forward body angle. Short powerful strides.',
    smartPairings: ['Sled Pull 50m Heavy', 'Farmers Carry 200m (24kg)', 'Wall Balls (9kg)'],
  },
  {
    id: 'hyrox_sled_pull',
    name: 'Sled Pull 50m Heavy',
    split: 'HYROX',
    muscleGroup: 'Back',
    subMuscle: 'Hamstrings, Lats & Back',
    type: 'Functional',
    defaultSets: 4,
    defaultReps: 50,
    defaultWeight: 103,
    defaultRpe: 9,
    defaultRestSec: 90,
    defaultTempo: 'Rhythmic Pull',
    coachingCue: 'Deep hip hinge, pull rope hand-over-hand with explosive torso brace.',
    smartPairings: ['Burpee Broad Jumps 80m', 'Concept2 Row 1000m'],
  },
  {
    id: 'hyrox_burpee_broad_jump',
    name: 'Burpee Broad Jumps 80m',
    split: 'HYROX',
    muscleGroup: 'Full Body',
    subMuscle: 'Metabolic Power',
    type: 'Plyometric',
    defaultSets: 3,
    defaultReps: 80,
    defaultWeight: 0,
    defaultRpe: 9,
    defaultRestSec: 90,
    defaultTempo: 'Dynamic',
    coachingCue: 'Chest to floor on burpee, explode forward landing softly on full foot.',
    smartPairings: ['Farmers Carry 200m (24kg)', 'SkiErg 1000m Race Pace'],
  },
  {
    id: 'hyrox_concept2_row',
    name: 'Concept2 Row 1000m',
    split: 'HYROX',
    muscleGroup: 'Full Body',
    subMuscle: 'Posterior & Engine',
    type: 'Functional',
    defaultSets: 3,
    defaultReps: 1000,
    defaultWeight: 0,
    defaultRpe: 8.5,
    defaultRestSec: 120,
    defaultTempo: 'Pace 1:45/500m',
    coachingCue: 'Drive legs first, hinge back, pull handle to lower ribs.',
    smartPairings: ['Wall Balls (9kg)', 'Sandbag Lunges 100m (20kg)'],
  },
  {
    id: 'hyrox_farmers_carry',
    name: 'Farmers Carry 200m (24kg)',
    split: 'HYROX',
    muscleGroup: 'Arms',
    subMuscle: 'Grip & Traps Endurance',
    type: 'Functional',
    defaultSets: 3,
    defaultReps: 200,
    defaultWeight: 24,
    defaultRpe: 8.5,
    defaultRestSec: 60,
    defaultTempo: 'Brisk Walk',
    coachingCue: 'Shoulders pinned back and down. Strict upright posture, no swaying.',
    smartPairings: ['Sandbag Lunges 100m (20kg)', 'Wall Balls (9kg)'],
  },
  {
    id: 'hyrox_sandbag_lunges',
    name: 'Sandbag Lunges 100m (20kg)',
    split: 'HYROX',
    muscleGroup: 'Quads',
    subMuscle: 'Quads & Glutes Endurance',
    type: 'Functional',
    defaultSets: 3,
    defaultReps: 100,
    defaultWeight: 20,
    defaultRpe: 9,
    defaultRestSec: 90,
    defaultTempo: 'Step-through',
    coachingCue: 'Bag balanced across upper traps. 90 degree knee flexion each stride.',
    smartPairings: ['Wall Balls (9kg)', 'SkiErg 1000m Race Pace'],
  },
  {
    id: 'hyrox_wall_balls',
    name: 'Wall Balls (9kg Target)',
    split: 'HYROX',
    muscleGroup: 'Full Body',
    subMuscle: 'Quads, Shoulders & Engine',
    type: 'Functional',
    defaultSets: 4,
    defaultReps: 25,
    defaultWeight: 9,
    defaultRpe: 9,
    defaultRestSec: 60,
    defaultTempo: 'Continuous',
    coachingCue: 'Full squat depth, explode through heels and throw to 10ft target.',
    smartPairings: ['SkiErg 1000m Race Pace', 'Sled Push 50m Heavy'],
  },

  // ─── CORE & STABILITY ───
  {
    id: 'core_cable_crunch',
    name: 'Kneeling Cable Crunch',
    split: 'CORE',
    muscleGroup: 'Core',
    subMuscle: 'Rectus Abdominis',
    type: 'Isolation',
    defaultSets: 3,
    defaultReps: 15,
    defaultWeight: 35,
    defaultRpe: 8.5,
    defaultRestSec: 45,
    defaultTempo: '2-0-1-1',
    coachingCue: 'Round spine to crunch ribcage toward pelvis. Do not sit back onto heels.',
    smartPairings: ['Hanging Leg Raise', 'Pallof Press (Cable)'],
  },
  {
    id: 'core_hanging_leg_raise',
    name: 'Hanging Leg Raise (Strict)',
    split: 'CORE',
    muscleGroup: 'Core',
    subMuscle: 'Lower Rectus Abdominis',
    type: 'Isolation',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 0,
    defaultRpe: 8.5,
    defaultRestSec: 60,
    defaultTempo: '3-0-1-0',
    coachingCue: 'Posterior pelvic tilt. Raise toes to bar level without swinging.',
    smartPairings: ['Ab Wheel Rollout', 'Pallof Press (Cable)'],
  },
  {
    id: 'core_ab_wheel',
    name: 'Ab Wheel Rollout (from Knees)',
    split: 'CORE',
    muscleGroup: 'Core',
    subMuscle: 'Anti-Extension Midsection',
    type: 'Functional',
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: 0,
    defaultRpe: 8.5,
    defaultRestSec: 60,
    defaultTempo: '3-1-1-0',
    coachingCue: 'Maintain posterior tilt. Roll out until nose is 1 inch off floor.',
    smartPairings: ['Kneeling Cable Crunch', 'Hanging Leg Raise (Strict)'],
  },
  {
    id: 'core_pallof_press',
    name: 'Pallof Press (Cable / Band)',
    split: 'CORE',
    muscleGroup: 'Core',
    subMuscle: 'Anti-Rotation Obliques',
    type: 'Functional',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 15,
    defaultRpe: 8,
    defaultRestSec: 45,
    defaultTempo: '2-1-1-1',
    coachingCue: 'Resist cable pull. Press straight out from chest and hold 1 second.',
    smartPairings: ['Kneeling Cable Crunch', 'Hanging Leg Raise (Strict)'],
  },
];

const buildMasterCuratedLibrary = (): CuratedExercise[] => {
  const map = new Map<string, CuratedExercise>();

  // 1. Manually crafted exercises take precedence with rich anatomical data & coaching cues
  for (const ex of CURATED_EXERCISE_LIBRARY) {
    map.set(ex.name.toLowerCase(), ex);
  }

  // 2. Flood with all exercises across all categories from EXERCISE_DATABASE
  for (const [category, exerciseNames] of Object.entries(EXERCISE_DATABASE)) {
    let split: CuratedExercise['split'] = 'FULL_BODY';
    let muscleGroup = 'Full Body';
    let subMuscle = category;
    let type: CuratedExercise['type'] = 'Compound';
    let defaultSets = 3;
    let defaultReps = 10;
    let defaultWeight = 20;
    let defaultRpe = 8;
    let defaultRestSec = 60;
    let defaultTempo = '2-0-1-0';
    let coachingCue = `Execute ${category} movement with solid biomechanics, cadence, and full motor control.`;

    if (category === 'Chest & Triceps') {
      split = 'PUSH';
      muscleGroup = 'Chest';
      subMuscle = 'Pecs & Triceps';
      type = 'Compound';
      defaultWeight = 50;
    } else if (category === 'Back & Biceps') {
      split = 'PULL';
      muscleGroup = 'Back';
      subMuscle = 'Lats & Upper Back';
      type = 'Compound';
      defaultWeight = 50;
    } else if (category === 'Legs & Calves') {
      split = 'LEGS';
      muscleGroup = 'Legs';
      subMuscle = 'Quads, Hamstrings & Calves';
      type = 'Compound';
      defaultWeight = 60;
    } else if (category === 'Glutes & Posterior Chain') {
      split = 'LEGS';
      muscleGroup = 'Glutes';
      subMuscle = 'Posterior Chain';
      type = 'Compound';
      defaultWeight = 60;
    } else if (category === 'Shoulders & Abs') {
      split = 'SHOULDERS';
      muscleGroup = 'Shoulders';
      subMuscle = 'Delts & Core';
      type = 'Compound';
      defaultWeight = 20;
    } else if (
      category === 'Powerlifting' ||
      category === 'Olympic Weightlifting' ||
      category === 'Strongman' ||
      category === 'Highland Games' ||
      category === 'Powerbuilding'
    ) {
      split = 'FULL_BODY';
      muscleGroup = 'Max Strength & Power';
      subMuscle = category;
      type = 'Compound';
      defaultSets = 4;
      defaultReps = 5;
      defaultWeight = 80;
      defaultRpe = 8.5;
      defaultRestSec = 120;
    } else if (
      category === 'Bodybuilding' ||
      category === 'FST-7 & Hypertrophy' ||
      category === 'Classic Physique'
    ) {
      split = 'FULL_BODY';
      muscleGroup = 'Hypertrophy';
      subMuscle = category;
      type = 'Isolation';
      defaultSets = 4;
      defaultReps = 12;
      defaultWeight = 25;
      defaultRestSec = 60;
    } else if (
      category === 'Hyrox & Functional' ||
      category === 'CrossFit & Functional' ||
      category === 'Kettlebell & Functional'
    ) {
      split = 'HYROX';
      muscleGroup = 'Metabolic & Conditioning';
      subMuscle = category;
      type = 'Functional';
      defaultSets = 3;
      defaultReps = 15;
      defaultWeight = 16;
      defaultRestSec = 45;
    } else if (
      category === 'Calisthenics & Bodyweight' ||
      category === 'Street Workout & Bar Calisthenics' ||
      category === 'Gymnastics & Rings' ||
      category === 'Parkour & Movement'
    ) {
      split = 'FULL_BODY';
      muscleGroup = 'Calisthenics & Rings';
      subMuscle = category;
      type = 'Functional';
      defaultSets = 3;
      defaultReps = 10;
      defaultWeight = 0;
      defaultRestSec = 60;
    } else if (SPORTS_CATEGORIES.includes(category)) {
      split = 'SPORT';
      muscleGroup = 'Athletics & Sports';
      subMuscle = category;
      type = 'Functional';
      defaultSets = 3;
      defaultReps = 1;
      defaultWeight = 0;
      defaultRestSec = 60;
      coachingCue = `Athletic drill: ${category}. Maximize speed, agility, technical execution, and game conditioning.`;
    } else if (RECOVERY_CATEGORIES.includes(category)) {
      split = 'RECOVERY';
      muscleGroup = 'Active Recovery & Breath';
      subMuscle = category;
      type = 'Mobility';
      defaultSets = 1;
      defaultReps = 10;
      defaultWeight = 0;
      defaultRpe = 6;
      defaultRestSec = 30;
      defaultTempo = '4-0-4-0';
      coachingCue = `Decompression protocol: ${category}. Focus on parasympathetic down-regulation and tissue restoration.`;
    }

    for (const name of exerciseNames) {
      const lower = name.toLowerCase();
      if (!map.has(lower)) {
        const id = `ex_${category.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${name
          .replace(/[^a-zA-Z0-9]/g, '_')
          .toLowerCase()}`;
        map.set(lower, {
          id,
          name,
          split,
          muscleGroup,
          subMuscle,
          type,
          defaultSets,
          defaultReps,
          defaultWeight,
          defaultRpe,
          defaultRestSec,
          defaultTempo,
          coachingCue,
        });
      }
    }
  }

  return Array.from(map.values());
};

export const MASTER_EXERCISE_LIBRARY: CuratedExercise[] = buildMasterCuratedLibrary();

// ═══════════════════════════════════════════════════════════════════════
// INSTANT SPLIT ARCHITECTURES (1-Tap Smart Baselines)
// ═══════════════════════════════════════════════════════════════════════
export const SMART_SPLIT_BLUEPRINTS = [
  {
    id: 'arch_push_heavy',
    title: 'Push Alpha: Chest & Tricep Overload',
    split: 'PUSH',
    focus: 'Hypertrophy & Strength',
    description: 'Heavy competition paused bench followed by incline dumbbell press, dips, and triceps isolation.',
    exerciseIds: [
      'push_bb_flat_bench',
      'push_incline_db_press',
      'push_dips_chest',
      'push_cable_lateral_raise',
      'push_tricep_rope_pushdown',
    ],
  },
  {
    id: 'arch_pull_density',
    title: 'Pull Alpha: Lat Density & Biceps',
    split: 'PULL',
    focus: 'Hypertrophy & Power',
    description: 'Deadlift foundation paired with weighted pull-ups, chest-supported rows, and incline stretch curls.',
    exerciseIds: [
      'pull_deadlift_conv',
      'pull_weighted_pullups',
      'pull_tbar_row',
      'pull_face_pulls',
      'pull_incline_db_curl',
    ],
  },
  {
    id: 'arch_legs_quad_dom',
    title: 'Legs Alpha: Quad Focus & Posterior',
    split: 'LEGS',
    focus: 'Hypertrophy & Kinetic Power',
    description: 'Back squats paired with Romanian deadlifts, Bulgarian split squats, and isolation finishers.',
    exerciseIds: [
      'legs_back_squat',
      'legs_rdl_barbell',
      'legs_bulgarian_split_squat',
      'legs_leg_extension',
      'legs_standing_calf_raise',
    ],
  },
  {
    id: 'arch_hyrox_metcon',
    title: 'Hyrox Race Simulator',
    split: 'HYROX',
    focus: 'Engine & Threshold Conditioning',
    description: 'Race pace SkiErg, heavy sled push, burpee broad jumps, farmers carry, and wall ball finisher.',
    exerciseIds: [
      'hyrox_skierg',
      'hyrox_sled_push',
      'hyrox_burpee_broad_jump',
      'hyrox_farmers_carry',
      'hyrox_wall_balls',
    ],
  },
];

export const WorkoutDispatchModal: React.FC<WorkoutDispatchModalProps> = ({
  isOpen,
  onClose,
  clients,
  initialSelectedClientKeys = [],
  onDispatchSuccess,
  coachName = '',
}) => {
  // ─── Split Filter (STRICT & INSTANT) ───
  const [selectedSplit, setSelectedSplit] = useState<
    'PUSH' | 'PULL' | 'LEGS' | 'ARMS' | 'SHOULDERS' | 'CORE' | 'HYROX' | 'SPORT' | 'RECOVERY' | 'ALL'
  >('PUSH');
  const [selectedMuscleSubFilter, setSelectedMuscleSubFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'ALL' | 'Compound' | 'Isolation' | 'Functional'>('ALL');

  // ─── Routine Metadata ───
  const [routineTitle, setRoutineTitle] = useState('Push Day • Chest & Shoulder Overload');
  const [scheduledDay, setScheduledDay] = useState<'Today' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'>('Today');
  const [periodizationFocus, setPeriodizationFocus] = useState<
    'Hypertrophy (8-12)' | 'Max Strength (3-6)' | 'Power & Speed' | 'Conditioning' | 'Deload'
  >('Hypertrophy (8-12)');
  const [coachPrescription, setCoachPrescription] = useState(
    'Control eccentric tempo. Full mechanical stretch on every rep.'
  );

  // ─── Athlete Target Keys ───
  const [selectedClientKeys, setSelectedClientKeys] = useState<string[]>(() =>
    initialSelectedClientKeys.length > 0 ? initialSelectedClientKeys : Object.keys(clients).slice(0, 1)
  );
  const [isClientSheetOpen, setIsClientSheetOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  // ─── Staged Prescribed Stack (PINNED ON TOP) ───
  const [stagedExercises, setStagedExercises] = useState<StagedExercise[]>(() => [
    {
      id: 'stg_1',
      name: 'Barbell Flat Bench Press',
      category: 'Push',
      primaryMuscle: 'Chest',
      movementType: 'Compound',
      restSec: 120,
      tempo: '3-1-1-0',
      progressionScheme: 'Straight',
      notes: 'Plant feet firmly. Touch mid-sternum, drive bar back over shoulders.',
      isExpanded: false,
      sets: [
        { setNum: 1, type: 'warmup', reps: 10, weight: 60, rpe: 7 },
        { setNum: 2, type: 'working', reps: 8, weight: 80, rpe: 8 },
        { setNum: 3, type: 'working', reps: 6, weight: 90, rpe: 8.5 },
        { setNum: 4, type: 'working', reps: 6, weight: 90, rpe: 9 },
      ],
    },
    {
      id: 'stg_2',
      name: 'Incline Dumbbell Press',
      category: 'Push',
      primaryMuscle: 'Chest',
      movementType: 'Compound',
      restSec: 90,
      tempo: '3-1-1-0',
      progressionScheme: 'Straight',
      notes: 'Deep stretch at bottom. Drive dumbbells up and inwards without clacking.',
      isExpanded: false,
      sets: [
        { setNum: 1, type: 'working', reps: 10, weight: 32, rpe: 8 },
        { setNum: 2, type: 'working', reps: 10, weight: 32, rpe: 8.5 },
        { setNum: 3, type: 'working', reps: 8, weight: 34, rpe: 9 },
      ],
    },
    {
      id: 'stg_3',
      name: 'Cable Lateral Raise (Behind Body)',
      category: 'Push',
      primaryMuscle: 'Shoulders',
      movementType: 'Isolation',
      restSec: 60,
      tempo: '2-0-1-1',
      progressionScheme: 'Straight',
      notes: 'Constant tension throughout full range. Lead with elbows.',
      isExpanded: false,
      sets: [
        { setNum: 1, type: 'working', reps: 15, weight: 10, rpe: 8 },
        { setNum: 2, type: 'working', reps: 15, weight: 10, rpe: 8.5 },
        { setNum: 3, type: 'working', reps: 12, weight: 12.5, rpe: 9 },
      ],
    },
  ]);

  // ─── Main View Mode Tabs ───
  const [activeTab, setActiveTab] = useState<'stack' | 'library' | 'templates'>('stack');
  const [isParamsExpanded, setIsParamsExpanded] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Lock Body & HTML Scroll to completely strip background scroll
  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction = prevBodyTouchAction;
    };
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // ─── Progression Generator ───
  const generateSetsForScheme = (
    baseWeight: number,
    baseReps: number,
    scheme: StagedExercise['progressionScheme'],
    count = 3
  ): IntelligentSet[] => {
    const sets: IntelligentSet[] = [];
    for (let i = 0; i < count; i++) {
      let reps = baseReps;
      let weight = baseWeight;
      let rpe = 8 + (i * 0.5);
      let type: SetType = 'working';

      if (scheme === 'Ascending') {
        weight = Math.round(baseWeight + i * 5);
        reps = Math.max(2, baseReps - i * 2);
        type = i === 0 ? 'warmup' : 'working';
      } else if (scheme === 'Pyramid') {
        const half = Math.floor(count / 2);
        const diff = i <= half ? i * 5 : (count - 1 - i) * 5;
        weight = Math.round(baseWeight + diff);
        reps = Math.max(4, baseReps - (i <= half ? i * 2 : (count - 1 - i) * 2));
      } else if (scheme === 'Reverse Pyramid') {
        type = i === 0 ? 'working' : 'dropset';
        weight = Math.max(0, Math.round(baseWeight - i * 5));
        reps = baseReps + i * 2;
        rpe = i === 0 ? 9.5 : 8.5;
      } else if (scheme === 'Wave 5/3/1') {
        const waveReps = [5, 3, 1, 5, 3, 1];
        const waveMultipliers = [0.9, 0.95, 1.0, 0.92, 0.98, 1.05];
        reps = waveReps[i] || 3;
        weight = Math.round(baseWeight * (waveMultipliers[i] || 1.0));
      }

      sets.push({
        setNum: i + 1,
        type,
        reps,
        weight: Math.max(0, weight),
        rpe: Math.min(10, rpe),
      });
    }
    return sets;
  };

  // ─── Add Exercise to Pinned Top Stack ───
  const handleAddExercise = (curated: CuratedExercise) => {
    const isAlreadyAdded = stagedExercises.some((e) => e.name.toLowerCase() === curated.name.toLowerCase());
    if (isAlreadyAdded) {
      showToast(`${curated.name} is already in the stack`);
      return;
    }

    const sets = generateSetsForScheme(curated.defaultWeight, curated.defaultReps, 'Straight', curated.defaultSets);
    const newExercise: StagedExercise = {
      id: `stg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: curated.name,
      category: curated.split,
      primaryMuscle: curated.muscleGroup,
      movementType: curated.type,
      restSec: curated.defaultRestSec,
      tempo: curated.defaultTempo,
      progressionScheme: 'Straight',
      notes: curated.coachingCue,
      isExpanded: false,
      sets,
    };

    setStagedExercises((prev) => [...prev, newExercise]);
    showToast(`Added #${stagedExercises.length + 1}: ${curated.name}`);
  };

  // ─── Remove Exercise from Pinned Top Stack ───
  const handleRemoveExercise = (id: string) => {
    setStagedExercises((prev) => prev.filter((e) => e.id !== id));
  };

  // ─── Move Exercise Position in Stack ───
  const handleMoveExercise = (idx: number, direction: 'up' | 'down') => {
    setStagedExercises((prev) => {
      const copy = [...prev];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= copy.length) return prev;
      const tmp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = tmp;
      return copy;
    });
  };

  // ─── Manual Set Count Change ───
  const handleSetCountChange = (id: string, count: number) => {
    const validCount = Math.max(1, Math.min(30, count || 1));
    setStagedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        const currentSets = ex.sets;
        if (currentSets.length === validCount) return ex;
        if (currentSets.length < validCount) {
          const last = currentSets[currentSets.length - 1] || { reps: 10, weight: 50, rpe: 8, type: 'working' };
          const additional: IntelligentSet[] = Array.from({ length: validCount - currentSets.length }, (_, i) => ({
            setNum: currentSets.length + i + 1,
            type: last.type || 'working',
            reps: last.reps || 10,
            weight: last.weight || 0,
            rpe: last.rpe || 8,
          }));
          return { ...ex, sets: [...currentSets, ...additional] };
        } else {
          return { ...ex, sets: currentSets.slice(0, validCount) };
        }
      })
    );
  };

  // ─── Manual Reps Direct Change ───
  const handleRepsChange = (id: string, reps: number) => {
    const validReps = Math.max(1, Math.min(200, reps || 1));
    setStagedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => ({ ...s, reps: validReps })),
        };
      })
    );
  };

  // ─── Manual Weight Direct Change ───
  const handleWeightChange = (id: string, weight: number) => {
    const validWeight = Math.max(0, parseFloat((weight || 0).toFixed(1)));
    setStagedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => ({ ...s, weight: validWeight })),
        };
      })
    );
  };

  // ─── Quick Stepper for Reps across all sets in an exercise ───
  const handleStepReps = (id: string, delta: number) => {
    setStagedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => ({ ...s, reps: Math.max(1, s.reps + delta) })),
        };
      })
    );
  };

  // ─── Quick Stepper for Load / Weight across all sets in an exercise ───
  const handleStepWeight = (id: string, delta: number) => {
    setStagedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => ({ ...s, weight: Math.max(0, parseFloat((s.weight + delta).toFixed(1))) })),
        };
      })
    );
  };

  // ─── Add / Remove a set inside an exercise ───
  const handleAddSet = (id: string) => {
    setStagedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        const last = ex.sets[ex.sets.length - 1];
        const newSet: IntelligentSet = {
          setNum: ex.sets.length + 1,
          type: last ? last.type : 'working',
          reps: last ? last.reps : 10,
          weight: last ? last.weight : 40,
          rpe: last ? last.rpe : 8,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  };

  const handleRemoveSet = (id: string, setIdx: number) => {
    setStagedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        if (ex.sets.length <= 1) return ex;
        const filtered = ex.sets.filter((_, i) => i !== setIdx).map((s, i) => ({ ...s, setNum: i + 1 }));
        return { ...ex, sets: filtered };
      })
    );
  };

  const handleUpdateIndividualSet = (id: string, setIdx: number, field: keyof IntelligentSet, val: any) => {
    setStagedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        const updated = ex.sets.map((s, i) => (i === setIdx ? { ...s, [field]: val } : s));
        return { ...ex, sets: updated };
      })
    );
  };

  // ─── Toggle Superset Group ───
  const handleToggleSuperset = (idx: number) => {
    setStagedExercises((prev) => {
      const copy = [...prev];
      const curr = copy[idx];
      const next = copy[idx + 1];

      if (curr.supersetGroup) {
        // Clear superset
        const groupTag = curr.supersetGroup.substring(0, 1);
        return copy.map((e) => (e.supersetGroup?.startsWith(groupTag) ? { ...e, supersetGroup: undefined } : e));
      }

      if (next) {
        const groupLetter = String.fromCharCode(65 + (idx % 26)); // 'A', 'B', 'C'
        curr.supersetGroup = `${groupLetter}1`;
        next.supersetGroup = `${groupLetter}2`;
        showToast(`Linked Superset (${groupLetter}1 & ${groupLetter}2)`);
      }
      return [...copy];
    });
  };

  // ─── 1-Tap Load Full Blueprint ───
  const handleLoadBlueprint = (blueprint: typeof SMART_SPLIT_BLUEPRINTS[0]) => {
    setRoutineTitle(blueprint.title);
    setSelectedSplit(blueprint.split as any);

    const mapped: StagedExercise[] = blueprint.exerciseIds
      .map((exId, idx) => {
        const curated = CURATED_EXERCISE_LIBRARY.find((c) => c.id === exId);
        if (!curated) return null;
        const sets = generateSetsForScheme(curated.defaultWeight, curated.defaultReps, 'Straight', curated.defaultSets);
        return {
          id: `stg_${Date.now()}_${idx}`,
          name: curated.name,
          category: curated.split,
          primaryMuscle: curated.muscleGroup,
          movementType: curated.type,
          restSec: curated.defaultRestSec,
          tempo: curated.defaultTempo,
          progressionScheme: 'Straight' as const,
          notes: curated.coachingCue,
          isExpanded: false,
          sets,
        };
      })
      .filter(Boolean) as StagedExercise[];

    setStagedExercises(mapped);
    setActiveTab('stack');
    showToast(`Loaded ${blueprint.title}`);
  };

  // ─── Live Telemetry Engine ───
  const telemetry = useMemo(() => {
    const totalMovements = stagedExercises.length;
    const totalSets = stagedExercises.reduce((acc, ex) => acc + ex.sets.length, 0);

    let totalVolumeKg = 0;
    const muscleCount: Record<string, number> = {};

    stagedExercises.forEach((ex) => {
      muscleCount[ex.primaryMuscle] = (muscleCount[ex.primaryMuscle] || 0) + ex.sets.length;
      ex.sets.forEach((s) => {
        totalVolumeKg += s.reps * s.weight;
      });
    });

    const estDurationMinutes = Math.round(
      stagedExercises.reduce((acc, ex) => {
        const time = ex.sets.length * (45 + ex.restSec);
        return acc + time;
      }, 0) / 60
    );

    // Calculate percentage breakdown of muscles
    const muscleBreakdown = Object.entries(muscleCount)
      .map(([m, count]) => ({
        muscle: m,
        percent: Math.round((count / Math.max(1, totalSets)) * 100),
      }))
      .sort((a, b) => b.percent - a.percent);

    return {
      totalMovements,
      totalSets,
      totalVolumeKg,
      estDurationMinutes,
      muscleBreakdown,
    };
  }, [stagedExercises]);

  // ─── Filtered Curated Exercise Library ───
  const availableExercises = useMemo(() => {
    return MASTER_EXERCISE_LIBRARY.filter((ex) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ex.name.toLowerCase().includes(q) ||
          ex.muscleGroup.toLowerCase().includes(q) ||
          ex.subMuscle.toLowerCase().includes(q) ||
          ex.split.toLowerCase().includes(q)
        );
      }

      // 2. Strict Split Filter
      if (selectedSplit !== 'ALL') {
        if (selectedSplit === 'ARMS') {
          if (ex.muscleGroup !== 'Arms' && !ex.subMuscle.toLowerCase().includes('biceps') && !ex.subMuscle.toLowerCase().includes('triceps')) return false;
        } else if (selectedSplit === 'SHOULDERS') {
          if (ex.muscleGroup !== 'Shoulders') return false;
        } else if (ex.split !== selectedSplit) {
          return false;
        }
      }

      // 3. Sub-Muscle Filter
      if (selectedMuscleSubFilter !== 'ALL') {
        if (ex.muscleGroup !== selectedMuscleSubFilter) return false;
      }

      // 4. Movement Type Filter
      if (movementTypeFilter !== 'ALL') {
        if (ex.type !== movementTypeFilter) return false;
      }

      return true;
    });
  }, [selectedSplit, selectedMuscleSubFilter, movementTypeFilter, searchQuery]);

  // ─── Smart Dynamic Next Movement Suggestions ───
  const smartSuggestions = useMemo(() => {
    if (stagedExercises.length === 0) return [];
    const last = stagedExercises[stagedExercises.length - 1];
    const matchingCurated = MASTER_EXERCISE_LIBRARY.find(
      (c) => c.name.toLowerCase() === last.name.toLowerCase()
    );

    if (matchingCurated?.smartPairings && matchingCurated.smartPairings.length > 0) {
      return matchingCurated.smartPairings
        .map((name) => MASTER_EXERCISE_LIBRARY.find((c) => c.name.toLowerCase() === name.toLowerCase()))
        .filter((c): c is CuratedExercise => Boolean(c) && !stagedExercises.some((e) => e.name.toLowerCase() === c?.name.toLowerCase()));
    }

    // Default suggestions from same split that aren't already added
    return MASTER_EXERCISE_LIBRARY.filter(
      (c) =>
        c.split === last.category &&
        !stagedExercises.some((e) => e.name.toLowerCase() === c.name.toLowerCase())
    ).slice(0, 3);
  }, [stagedExercises]);

  // ─── Dispatch Execution ───
  const handleDispatch = async () => {
    if (selectedClientKeys.length === 0) {
      showToast('Select at least 1 athlete');
      return;
    }
    if (stagedExercises.length === 0) {
      showToast('Add at least 1 exercise to the stack');
      return;
    }

    setIsDispatching(true);
    const selectedClientNames = selectedClientKeys.map((k) => clients[k]?.name || k).filter(Boolean);

    const transformedExercises: DispatchedExercise[] = stagedExercises.map((ex) => {
      const firstSet = ex.sets[0];
      return {
        id: ex.id,
        name: ex.name,
        sets: ex.sets.length,
        reps: firstSet ? `${firstSet.reps} reps` : '10 reps',
        targetLoad: `${firstSet ? firstSet.weight : 0} kg @ RPE ${firstSet?.rpe || 8} (${ex.progressionScheme})`,
        notes: `Tempo ${ex.tempo} • Rest ${ex.restSec}s. ${ex.notes}`,
      };
    });

    try {
      await dispatchWorkout({
        coachId: 'coach_main',
        coachName: coachName || 'Head Coach',
        clientIds: selectedClientKeys,
        clientNames: selectedClientNames,
        title: routineTitle,
        routineCategory: selectedSplit,
        scheduledDay,
        scheduledDate: new Date().toISOString().split('T')[0],
        exercises: transformedExercises,
        notes: `[${periodizationFocus}] ${coachPrescription}`,
      });

      setIsDispatching(false);
      if (onDispatchSuccess) {
        onDispatchSuccess(selectedClientKeys.length);
      }
      onClose();
    } catch (e) {
      setIsDispatching(false);
      showToast('Dispatch failed. Retrying...');
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      id="studio-builder-modal"
      className="fixed inset-0 z-[99990] bg-[#F2F2F7] dark:bg-[#000000] text-zinc-900 dark:text-white flex flex-col w-full h-full overflow-hidden font-sans select-none backdrop-blur-3xl animate-in fade-in duration-150 overscroll-contain"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          OBSIDIAN TOP BAR
          ═══════════════════════════════════════════════════════════════════════ */}
      <header className="bg-[#F2F2F7]/95 dark:bg-[#000000]/95 backdrop-blur-xl border-b border-zinc-200/80 dark:border-white/10 shrink-0 z-30 pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 min-h-[44px]">
          {/* Title & Movements Counter (Robust flexbox with no overlap) */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 mr-1">
            <div className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-500 shrink-0" />
            <h1 className="text-xs sm:text-sm font-semibold tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5 min-w-0 overflow-hidden">
              <span className="truncate">Workout Dispatch Studio</span>
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
                ({stagedExercises.length})
              </span>
            </h1>
          </div>

          {/* Top Actions: Athlete Selector & Close (Nude & Clean) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsClientSheetOpen(true)}
              className="p-1 sm:p-1.5 flex items-center gap-1 sm:gap-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-0 active:scale-95 shrink-0"
              title="Select Athletes"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500 dark:text-zinc-400 stroke-[1.75] shrink-0" />
              <span className="truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[180px]">
                {selectedClientKeys.length === 1
                  ? clients[selectedClientKeys[0]]?.name || '1 Athlete'
                  : `${selectedClientKeys.length} Athletes`}
              </span>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-400 dark:text-zinc-500 stroke-[2] shrink-0" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 -mr-1 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all active:scale-90 cursor-pointer bg-transparent border-0 shrink-0"
              title="Close Studio"
            >
              <X className="w-5 h-5 stroke-[1.75]" />
            </button>
          </div>
        </div>

        {/* ─── LIVE TELEMETRY & MUSCLE LOAD HUD ─── */}
        <div className="bg-zinc-200/50 dark:bg-black/60 border-t border-zinc-200/80 dark:border-white/5 px-3 sm:px-4 py-2">
          <div className="w-full max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-4 text-[11px] sm:text-xs">
              <div>
                <span className="text-zinc-400 dark:text-zinc-500">Sets: </span>
                <span className="text-zinc-900 dark:text-white font-semibold">{telemetry.totalSets}</span>
              </div>
              <div>
                <span className="text-zinc-400 dark:text-zinc-500">Est. Time: </span>
                <span className="text-zinc-900 dark:text-white font-semibold">{telemetry.estDurationMinutes} min</span>
              </div>
              <div>
                <span className="text-zinc-400 dark:text-zinc-500">Volume: </span>
                <span className="text-zinc-900 dark:text-white font-semibold">
                  {(telemetry.totalVolumeKg / 1000).toFixed(1)}k kg
                </span>
              </div>
            </div>

            {/* Muscle Breakdown Pills */}
            {telemetry.muscleBreakdown.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0">
                {telemetry.muscleBreakdown.slice(0, 3).map((item) => (
                  <span
                    key={item.muscle}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-[10px] text-zinc-700 dark:text-zinc-300 font-medium whitespace-nowrap shrink-0 shadow-2xs"
                  >
                    {item.muscle} <span className="text-zinc-900 dark:text-white font-semibold">{item.percent}%</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── CLEAR SEGMENTED NAVIGATION TABS ─── */}
        <div className="border-t border-zinc-200/80 dark:border-white/10 px-3 sm:px-4 py-1.5 bg-[#F2F2F7]/90 dark:bg-zinc-950/60">
          <div className="w-full max-w-5xl mx-auto flex items-center gap-1 p-0.5 bg-zinc-200/70 dark:bg-black/60 rounded-xl border border-zinc-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('stack')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'stack'
                  ? 'bg-white dark:bg-white text-zinc-900 dark:text-black shadow-2xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Workout Stack ({stagedExercises.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'library'
                  ? 'bg-white dark:bg-white text-zinc-900 dark:text-black shadow-2xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Exercise Library ({availableExercises.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'templates'
                  ? 'bg-white dark:bg-white text-zinc-900 dark:text-black shadow-2xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Tap Presets ({SMART_SPLIT_BLUEPRINTS.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* TOAST ALERTS */}
      {toastMessage && (
        <div className="bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-1.5 text-xs font-semibold text-center tracking-wide shrink-0 animate-in fade-in z-50">
          {toastMessage}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA BASED ON ACTIVE TAB
          ═══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 hide-scrollbar pb-32 w-full max-w-5xl mx-auto">
        {/* ─────────────────────────────────────────────────────────────────
            TAB 1: WORKOUT STACK
            ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'stack' && (
          <div className="space-y-3 animate-in fade-in">
            {/* WORKOUT SETUP PARAMETERS CARD */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-white/10 backdrop-blur-xl space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white truncate">
                    Workout Parameters
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsParamsExpanded(!isParamsExpanded)}
                  className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>{isParamsExpanded ? 'Hide Details' : 'Edit Setup'}</span>
                  {isParamsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Quick Summary row when collapsed */}
              {!isParamsExpanded && (
                <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
                  <div className="font-semibold text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                    {routineTitle || 'Custom Workout Prescription'}
                  </div>
                  <span className="text-zinc-300 dark:text-zinc-600">•</span>
                  <span className="text-zinc-600 dark:text-zinc-400">{scheduledDay}</span>
                  <span className="text-zinc-300 dark:text-zinc-600">•</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#F2F2F7] dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-[10px] text-zinc-700 dark:text-zinc-300 font-medium">
                    {periodizationFocus}
                  </span>
                </div>
              )}

              {/* Full inputs when expanded */}
              {isParamsExpanded && (
                <div className="space-y-2.5 pt-2 border-t border-zinc-100 dark:border-white/5 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    {/* Routine Title */}
                    <div className="md:col-span-6 space-y-1">
                      <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Workout Title</label>
                      <input
                        type="text"
                        value={routineTitle}
                        onChange={(e) => setRoutineTitle(e.target.value)}
                        placeholder="e.g. Push Hypertrophy Heavy"
                        className="w-full bg-[#F2F2F7]/60 dark:bg-black/60 border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white font-medium focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
                      />
                    </div>

                    {/* Scheduled Day */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Schedule Day</label>
                      <select
                        value={scheduledDay}
                        onChange={(e) => setScheduledDay(e.target.value as any)}
                        className="w-full bg-[#F2F2F7]/60 dark:bg-black/60 border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white font-medium focus:outline-none focus:border-zinc-400 dark:focus:border-white"
                      >
                        {['Today', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                          <option key={d} value={d} className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Periodization Focus */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Target Goal</label>
                      <select
                        value={periodizationFocus}
                        onChange={(e) => setPeriodizationFocus(e.target.value as any)}
                        className="w-full bg-[#F2F2F7]/60 dark:bg-black/60 border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white font-medium focus:outline-none focus:border-zinc-400 dark:focus:border-white"
                      >
                        <option value="Hypertrophy (8-12)">Hypertrophy (8-12)</option>
                        <option value="Max Strength (3-6)">Max Strength (3-6)</option>
                        <option value="Power & Speed">Power & Speed</option>
                        <option value="Conditioning">Conditioning</option>
                        <option value="Deload">Deload</option>
                      </select>
                    </div>
                  </div>

                  {/* Coach Technique Cue */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Technique Focus & Coaching Notes</label>
                    <input
                      type="text"
                      value={coachPrescription}
                      onChange={(e) => setCoachPrescription(e.target.value)}
                      placeholder="e.g. Explode on concentric drive, control 3-second descent..."
                      className="w-full bg-[#F2F2F7]/60 dark:bg-black/60 border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-300 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* STAGED EXERCISES LIST */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                    Programmed Exercises ({stagedExercises.length})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Exercise</span>
                </button>
              </div>

              {stagedExercises.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-white dark:bg-zinc-950/60 border border-dashed border-zinc-200 dark:border-white/10 space-y-2.5 shadow-2xs">
                  <Dumbbell className="w-8 h-8 mx-auto text-zinc-400 dark:text-zinc-500" />
                  <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">No exercises in this workout yet</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                    Add movements from the Exercise Library or pick a 1-tap prebuilt template to start programming.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('library')}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-semibold flex items-center gap-1.5 hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer shadow-2xs"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Browse Library</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('templates')}
                      className="px-3.5 py-1.5 rounded-lg bg-[#F2F2F7] hover:bg-zinc-200/80 dark:bg-white/10 dark:hover:bg-white/15 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Load 1-Tap Preset</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {stagedExercises.map((ex, exIdx) => {
                    const isCollapsed = ex.isExpanded === false;

                    return (
                      <div
                        key={ex.id}
                        className={`rounded-2xl bg-white dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-white/10 backdrop-blur-xl text-zinc-900 dark:text-white transition-all shadow-2xs ${
                          isCollapsed ? 'px-3.5 py-2.5' : 'px-3.5 py-3 space-y-2.5'
                        }`}
                      >
                        {/* Header: Dumbbell icon, Title, Set count, and Collapse Toggle */}
                        <div
                          className="flex items-center justify-between gap-2 cursor-pointer select-none"
                          onClick={() =>
                            setStagedExercises((prev) =>
                              prev.map((item) =>
                                item.id === ex.id
                                  ? { ...item, isExpanded: item.isExpanded === false ? true : false }
                                  : item
                              )
                            )
                          }
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Dumbbell className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                              {ex.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                              {ex.sets.length} {ex.sets.length === 1 ? 'set' : 'sets'}
                            </span>
                            <div className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white transition-colors">
                              {isCollapsed ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronUp className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </div>
                        </div>

                        {!isCollapsed && (
                          <>
                            {/* Column Header Labels */}
                            <div className="grid grid-cols-[24px_1fr_1fr_1fr_24px] items-center gap-1.5 text-[9px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase font-mono px-0.5">
                              <span className="text-center">SET</span>
                              <span className="text-center">REPS</span>
                              <span className="text-center">KG</span>
                              <span className="text-center">RPE</span>
                              <span />
                            </div>

                            {/* Set Rows */}
                            <div className="space-y-1.5">
                              {ex.sets.map((s, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="grid grid-cols-[24px_1fr_1fr_1fr_24px] items-center gap-1.5"
                                >
                                  {/* SET NUMBER */}
                                  <span className="text-center font-bold text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                                    {s.setNum || sIdx + 1}
                                  </span>

                                  {/* REPS INPUT BOX */}
                                  <div className="h-7 sm:h-7.5 bg-[#F2F2F7] dark:bg-white/5 border border-zinc-200/90 dark:border-white/10 rounded-lg px-1 flex items-center justify-center focus-within:border-zinc-400 dark:focus-within:border-white/40 focus-within:bg-white dark:focus-within:bg-zinc-900 transition-all overflow-hidden">
                                    <input
                                      type="number"
                                      min={1}
                                      max={999}
                                      value={s.reps}
                                      onChange={(e) =>
                                        handleUpdateIndividualSet(
                                          ex.id,
                                          sIdx,
                                          'reps',
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      className="w-full bg-transparent text-center font-bold text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none p-0 m-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>

                                  {/* KG INPUT BOX */}
                                  <div className="h-7 sm:h-7.5 bg-[#F2F2F7] dark:bg-white/5 border border-zinc-200/90 dark:border-white/10 rounded-lg px-1 flex items-center justify-center focus-within:border-zinc-400 dark:focus-within:border-white/40 focus-within:bg-white dark:focus-within:bg-zinc-900 transition-all overflow-hidden">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min={0}
                                      max={999}
                                      value={s.weight}
                                      onChange={(e) =>
                                        handleUpdateIndividualSet(
                                          ex.id,
                                          sIdx,
                                          'weight',
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-full bg-transparent text-center font-bold text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none p-0 m-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>

                                  {/* RPE INPUT BOX */}
                                  <div className="h-7 sm:h-7.5 bg-[#F2F2F7] dark:bg-white/5 border border-zinc-200/90 dark:border-white/10 rounded-lg px-1 flex items-center justify-center focus-within:border-zinc-400 dark:focus-within:border-white/40 focus-within:bg-white dark:focus-within:bg-zinc-900 transition-all overflow-hidden">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min={1}
                                      max={10}
                                      value={s.rpe || 8}
                                      onChange={(e) =>
                                        handleUpdateIndividualSet(
                                          ex.id,
                                          sIdx,
                                          'rpe',
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-full bg-transparent text-center font-bold text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none p-0 m-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>

                                  {/* Delete Set icon */}
                                  <div className="flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSet(ex.id, sIdx)}
                                      disabled={ex.sets.length <= 1}
                                      className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-red-600 dark:text-zinc-600 dark:hover:text-red-400 disabled:opacity-0 transition-colors p-0 cursor-pointer bg-transparent border-0"
                                      title="Delete Set"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Bottom Action Row: Add Set & Delete Exercise */}
                            <div className="flex items-center justify-between gap-2 pt-0.5 px-0.5">
                              <button
                                type="button"
                                onClick={() => handleAddSet(ex.id)}
                                className="flex items-center gap-1 text-[#EA4335] hover:text-red-700 dark:text-[#EA4335] dark:hover:text-red-400 font-semibold text-xs py-0.5 px-0 transition-colors cursor-pointer bg-transparent border-0 active:opacity-75"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Set</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveExercise(ex.id)}
                                className="text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 p-0.5 transition-colors cursor-pointer bg-transparent border-0 active:opacity-75"
                                title="Delete Exercise"
                                aria-label="Delete Exercise"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SMART NEXT MOVE RECOMMENDATIONS */}
            {smartSuggestions.length > 0 && stagedExercises.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-white/10 backdrop-blur-xl space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-zinc-800 dark:text-white" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                    Suggested Next Movements
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {smartSuggestions.map((sug) => (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => handleAddExercise(sug)}
                      className="p-2.5 rounded-xl bg-[#F2F2F7]/60 hover:bg-[#F2F2F7] dark:bg-black/60 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10 text-left transition-all group cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                          {sug.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                          {sug.muscleGroup} • {sug.type}
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-md bg-zinc-200 dark:bg-white/10 flex items-center justify-center text-zinc-700 dark:text-white shrink-0 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                        <Plus className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            TAB 2: EXERCISE LIBRARY
            ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'library' && (
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-white/10 backdrop-blur-xl space-y-3 animate-in fade-in shadow-2xs">
            {/* Header & Movement Type Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                  Exercise Directory
                </h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {availableExercises.length} Movements matching filters
                </p>
              </div>

              {/* Movement Type Filter Chips */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-black/60 p-0.5 rounded-lg border border-zinc-200/80 dark:border-white/10">
                {(['ALL', 'Compound', 'Isolation', 'Functional'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMovementTypeFilter(t)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      movementTypeFilter === t
                        ? 'bg-white dark:bg-white text-zinc-900 dark:text-black font-semibold shadow-2xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by exercise name, muscle or equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F2F2F7]/70 dark:bg-black/60 border border-zinc-200 dark:border-white/10 rounded-lg pl-8 pr-8 py-1.5 text-xs text-zinc-900 dark:text-white font-medium focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Split Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              {[
                { key: 'ALL', label: 'All Library' },
                { key: 'PUSH', label: 'Push (Chest & Tris)' },
                { key: 'PULL', label: 'Pull (Back & Bis)' },
                { key: 'LEGS', label: 'Legs & Glutes' },
                { key: 'ARMS', label: 'Arms & Forearms' },
                { key: 'SHOULDERS', label: 'Shoulders & Delts' },
                { key: 'HYROX', label: 'Hyrox & Metcon' },
                { key: 'SPORT', label: 'Sports & Athletics' },
                { key: 'RECOVERY', label: 'Recovery & Breath' },
                { key: 'CORE', label: 'Core & Stability' },
              ].map((split) => {
                const isActive = selectedSplit === split.key && !searchQuery;
                return (
                  <button
                    key={split.key}
                    type="button"
                    onClick={() => {
                      setSelectedSplit(split.key as any);
                      setSelectedMuscleSubFilter('ALL');
                      setSearchQuery('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white shadow-2xs'
                        : 'bg-[#F2F2F7] dark:bg-black/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border-zinc-200/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                    }`}
                  >
                    {split.label}
                  </button>
                );
              })}
            </div>

            {/* Exercise Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[440px] overflow-y-auto hide-scrollbar pr-0.5">
              {availableExercises.map((curated) => {
                const isAdded = stagedExercises.some(
                  (e) => e.name.toLowerCase() === curated.name.toLowerCase()
                );

                return (
                  <div
                    key={curated.id}
                    onClick={() => handleAddExercise(curated)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                      isAdded
                        ? 'bg-zinc-200/80 dark:bg-white/10 border-zinc-300 dark:border-white/30 text-zinc-900 dark:text-white'
                        : 'bg-[#F2F2F7]/50 hover:bg-[#F2F2F7] dark:bg-black/60 dark:hover:bg-white/5 border-zinc-200/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{curated.name}</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1.5">
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">{curated.muscleGroup}</span>
                        <span>•</span>
                        <span>{curated.subMuscle}</span>
                        <span>•</span>
                        <span className="text-zinc-500 dark:text-zinc-400">{curated.type}</span>
                      </div>
                      {curated.coachingCue && (
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 font-normal">
                          {curated.coachingCue}
                        </p>
                      )}
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 transition-transform active:scale-90 ${
                        isAdded
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-black font-bold shadow-2xs'
                          : 'bg-zinc-200 dark:bg-white/10 border border-zinc-300 dark:border-white/15 text-zinc-700 dark:text-white hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-black'
                      }`}
                    >
                      {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            TAB 3: PRESETS & BLUEPRINT TEMPLATES
            ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'templates' && (
          <div className="space-y-2.5 animate-in fade-in">
            <div className="px-0.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                Prebuilt Split Architectures
              </h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                1-tap load standard athletic blueprints into your active workout stack
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {SMART_SPLIT_BLUEPRINTS.map((bp) => (
                <div
                  key={bp.id}
                  className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-zinc-950/90 border border-zinc-200/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all flex flex-col justify-between gap-2.5 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                      <span className="px-1.5 py-0.5 rounded-md bg-[#F2F2F7] dark:bg-white/10 border border-zinc-200/80 dark:border-white/10 text-zinc-800 dark:text-white font-semibold uppercase text-[9px]">
                        {bp.split}
                      </span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">{bp.focus}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">{bp.title}</h4>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">{bp.description}</p>
                    
                    {/* Exercise previews count */}
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 pt-0.5">
                      Includes {bp.exerciseIds.length} choreographed movements
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLoadBlueprint(bp)}
                    className="w-full py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>Load Architecture ({bp.exerciseIds.length} Moves)</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          OBSIDIAN BOTTOM DISPATCH DOCK
          ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 border-t border-zinc-200/80 dark:border-white/10 p-3.5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.875rem))] backdrop-blur-2xl shadow-2xl">
        <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="min-w-0 w-full sm:w-auto text-left">
            <div className="text-xs font-semibold text-zinc-900 dark:text-white truncate flex items-center gap-2">
              <span>{routineTitle || 'Workout Prescription'}</span>
              <span className="text-zinc-500 dark:text-zinc-400 font-normal">({scheduledDay})</span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {stagedExercises.length} Movements • {telemetry.totalSets} Sets • Target:{' '}
              {selectedClientKeys.length} Athlete{selectedClientKeys.length > 1 ? 's' : ''}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsClientSheetOpen(true)}
              className="px-3.5 py-2.5 bg-[#F2F2F7] hover:bg-zinc-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-white/10 rounded-xl text-xs font-medium text-zinc-900 dark:text-white cursor-pointer transition-colors"
            >
              Select Athletes ({selectedClientKeys.length})
            </button>

            <button
              type="button"
              onClick={handleDispatch}
              disabled={isDispatching || selectedClientKeys.length === 0 || stagedExercises.length === 0}
              className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-30 rounded-xl text-xs font-bold tracking-tight transition-transform active:scale-95 cursor-pointer shadow-lg shrink-0 flex items-center gap-2 justify-center"
            >
              {isDispatching ? (
                <span>Broadcasting...</span>
              ) : (
                <span>Dispatch to {selectedClientKeys.length} Athlete{selectedClientKeys.length > 1 ? 's' : ''}</span>
              )}
            </button>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════════════
          ATHLETE TARGET SELECTOR SHEET
          ═══════════════════════════════════════════════════════════════════════ */}
      {isClientSheetOpen && (
        <div
          className="fixed inset-0 z-[99995] bg-black/70 dark:bg-black/85 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-150 overscroll-contain"
          onClick={() => setIsClientSheetOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-950 border-t sm:border border-zinc-200 dark:border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-3.5 sm:p-4 space-y-2.5 shadow-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col mb-0 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] sm:pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-white/10 pb-2.5">
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider truncate">
                  Target Athletes ({selectedClientKeys.length})
                </h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Select athletes who will receive this workout</p>
              </div>
              <button
                type="button"
                onClick={() => setIsClientSheetOpen(false)}
                className="p-1 -mr-1 text-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center cursor-pointer shrink-0 transition-all bg-transparent border-0 active:scale-90"
                title="Close"
              >
                <X className="w-4 h-4 stroke-[1.75]" />
              </button>
            </div>

            {/* Athlete Search */}
            <input
              type="text"
              placeholder="Search athlete by name or handle..."
              value={clientSearchQuery}
              onChange={(e) => setClientSearchQuery(e.target.value)}
              className="w-full bg-[#F2F2F7]/70 dark:bg-black/60 border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
            />

            {/* Quick Actions */}
            <div className="flex items-center justify-between text-xs px-0.5">
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedClientKeys(Object.keys(clients))}
                  className="text-zinc-900 dark:text-white hover:underline font-semibold cursor-pointer text-xs"
                >
                  Select All ({Object.keys(clients).length})
                </button>
                <span className="text-zinc-300 dark:text-zinc-600">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedClientKeys([])}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer text-xs"
                >
                  Clear All
                </button>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                {selectedClientKeys.length} / {Object.keys(clients).length} Selected
              </span>
            </div>

            {/* Unified Client List Container */}
            <div className="bg-[#F2F2F7]/50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-xl divide-y divide-zinc-200/60 dark:divide-white/5 overflow-y-auto max-h-[50vh] sm:max-h-60 hide-scrollbar">
              {Object.entries(clients)
                .filter(([k, athlete]) =>
                  (athlete?.name || k).toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                  (athlete?.handle || '').toLowerCase().includes(clientSearchQuery.toLowerCase())
                )
                .map(([k, athlete]) => {
                  const isSelected = selectedClientKeys.includes(k);
                  return (
                    <div
                      key={k}
                      onClick={() => {
                        setSelectedClientKeys((prev) =>
                          isSelected ? prev.filter((id) => id !== k) : [...prev, k]
                        );
                      }}
                      className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors text-xs ${
                        isSelected
                          ? 'bg-zinc-200/90 dark:bg-white/10 text-zinc-900 dark:text-white'
                          : 'hover:bg-zinc-200/50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-zinc-900 dark:text-white truncate">{athlete?.name || k}</div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate leading-tight mt-0.5">
                          {athlete?.handle || `@${k}`} {athlete?.badge ? `• ${athlete.badge}` : ''}
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-black font-bold'
                            : 'border border-zinc-300 dark:border-white/20'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => setIsClientSheetOpen(false)}
              className="w-full py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold text-xs rounded-xl cursor-pointer shadow-2xs hover:opacity-90 active:scale-98 transition-all"
            >
              Done ({selectedClientKeys.length} Selected)
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
