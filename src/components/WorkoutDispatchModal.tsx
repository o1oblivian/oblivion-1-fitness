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
  Lock,
  Send,
  RefreshCw,
  Target,
  Bookmark,
  BookmarkCheck,
  Pencil,
} from 'lucide-react';
import { useSubscription } from '../utils/useSubscription';
import { AthleteData } from '../types';
import { DispatchedExercise, dispatchWorkout } from '../utils/dispatchStore';
import {
  CoachSavedBlueprint,
  getCoachSavedBlueprints,
  saveCoachBlueprint,
  deleteCoachBlueprint,
  updateCoachBlueprintTitle,
} from '../utils/coachBlueprintStore';
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

export const WorkoutDispatchModal: React.FC<WorkoutDispatchModalProps> = ({
  isOpen,
  onClose,
  clients,
  initialSelectedClientKeys = [],
  onDispatchSuccess,
  coachName = '',
}) => {
  const { isCoachRole } = useSubscription();

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

  // ─── O1FC Intelligent Blueprint Synthesizer State ───
  const [synthIntent, setSynthIntent] = useState<
    'PUSH' | 'PULL' | 'LEGS' | 'UPPER' | 'LOWER' | 'SPEED' | 'HYROX' | 'STRENGTH' | 'RECOVERY'
  >('PUSH');
  const [synthDuration, setSynthDuration] = useState<'30m' | '45m' | '60m'>('45m');
  const [synthEquipment, setSynthEquipment] = useState<'FULL' | 'DUMBBELL' | 'BODYWEIGHT'>('FULL');
  const [synthRpe, setSynthRpe] = useState<'PROGRESSIVE' | 'FAILURE'>('PROGRESSIVE');
  const [synthSeed, setSynthSeed] = useState<number>(0);
  const [isSynthDispatching, setIsSynthDispatching] = useState<boolean>(false);

  // ─── Coach Saved Blueprints Vault State ───
  const [savedBlueprints, setSavedBlueprints] = useState<CoachSavedBlueprint[]>(() => getCoachSavedBlueprints());
  const [expandedSavedBpId, setExpandedSavedBpId] = useState<string | null>(null);
  const [editingBpId, setEditingBpId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  useEffect(() => {
    const handleUpdate = () => {
      setSavedBlueprints(getCoachSavedBlueprints());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('o1fc-coach-blueprints-updated', handleUpdate);
      return () => {
        window.removeEventListener('o1fc-coach-blueprints-updated', handleUpdate);
      };
    }
  }, []);

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

  // ─── Biomechanical Blueprint Synthesizer Engine ───
  const synthesizedBlueprint = useMemo(() => {
    const isAlt = synthSeed % 2 === 1;

    interface MovementDescriptor {
      name: string;
      category: string;
      primaryMuscle: string;
      movementType: 'Compound' | 'Isolation' | 'Functional' | 'Plyometric' | 'Mobility';
      tier: string;
      defaultSets: number;
      defaultReps: number;
      defaultWeight: number;
      tempo: string;
      restSec: number;
      cue: string;
    }

    let title = '';
    let split = 'PUSH';
    let focus = '';
    let notes = '';
    let movements: MovementDescriptor[] = [];

    switch (synthIntent) {
      case 'PUSH':
        split = 'PUSH';
        title = `O1FC Push Alpha • ${synthEquipment === 'BODYWEIGHT' ? 'Calisthenics Armor' : synthEquipment === 'DUMBBELL' ? 'Dumbbell Tension' : 'Chest & Delts'}`;
        focus = 'Sternal & Clavicular Hypertrophy, Scapular Drive';
        notes = 'Full mechanical stretch. Maintain retracted scapulae and pause 1s at maximum eccentric depth.';
        if (synthEquipment === 'BODYWEIGHT') {
          movements = [
            { name: isAlt ? 'Archer Push-ups' : 'Decline Deficit Push-ups', category: 'Push', primaryMuscle: 'Chest', movementType: 'Compound', tier: 'Tier 1: Heavy CNS Compound', defaultSets: 4, defaultReps: 10, defaultWeight: 0, tempo: '3-1-1-0', restSec: 90, cue: 'Drive through outer palms, full chest stretch.' },
            { name: 'Dips (Chest Leaning)', category: 'Push', primaryMuscle: 'Chest', movementType: 'Compound', tier: 'Tier 2: Length-Tension Stretch', defaultSets: 4, defaultReps: 12, defaultWeight: 0, tempo: '3-1-1-0', restSec: 75, cue: 'Forward lean to prioritize lower sternal fibers.' },
            { name: 'Pike Push-ups to Handstand Push-up Progression', category: 'Push', primaryMuscle: 'Shoulders', movementType: 'Compound', tier: 'Tier 3: Contraction Isolator', defaultSets: 3, defaultReps: 8, defaultWeight: 0, tempo: '2-1-1-0', restSec: 60, cue: 'Elbows track at 45 degrees, head touches floor.' },
            { name: 'Diamond Push-ups (Triceps Burnout)', category: 'Push', primaryMuscle: 'Arms', movementType: 'Isolation', tier: 'Tier 4: Unilateral Vector', defaultSets: 3, defaultReps: 15, defaultWeight: 0, tempo: '2-0-1-1', restSec: 60, cue: 'Tuck elbows tight to ribs, lock out triceps.' },
            { name: 'Hindu Push-ups (Dynamic Armor)', category: 'Push', primaryMuscle: 'Shoulders', movementType: 'Functional', tier: 'Tier 5: Synergist Finisher', defaultSets: 3, defaultReps: 12, defaultWeight: 0, tempo: '2-1-1-0', restSec: 60, cue: 'Smooth swoop from downward dog to cobra extension.' },
            { name: 'Plank Shoulder Taps (Anti-Rotation Core)', category: 'Push', primaryMuscle: 'Core', movementType: 'Functional', tier: 'Tier 6: Metabolic Burnout', defaultSets: 3, defaultReps: 20, defaultWeight: 0, tempo: '1-0-1-0', restSec: 45, cue: 'Zero pelvic sway. Contract glutes and anterior core.' },
          ];
        } else if (synthEquipment === 'DUMBBELL') {
          movements = [
            { name: isAlt ? 'Incline Dumbbell Bench Press (30°)' : 'Flat Dumbbell Bench Press', category: 'Push', primaryMuscle: 'Chest', movementType: 'Compound', tier: 'Tier 1: Heavy CNS Compound', defaultSets: 4, defaultReps: 8, defaultWeight: 34, tempo: '3-1-1-0', restSec: 100, cue: 'Deep eccentric stretch. Converge dumbbells without touching.' },
            { name: isAlt ? 'Flat Dumbbell Press (Neutral Grip)' : 'Incline Dumbbell Press (45°)', category: 'Push', primaryMuscle: 'Chest', movementType: 'Compound', tier: 'Tier 2: Length-Tension Stretch', defaultSets: 3, defaultReps: 10, defaultWeight: 28, tempo: '3-1-1-0', restSec: 75, cue: 'Controlled 3-second descent, feel the clavicular head stretch.' },
            { name: 'Dumbbell Floor Chest Flyes', category: 'Push', primaryMuscle: 'Chest', movementType: 'Isolation', tier: 'Tier 3: Contraction Isolator', defaultSets: 3, defaultReps: 12, defaultWeight: 16, tempo: '2-1-1-1', restSec: 60, cue: 'Elbows lightly touch floor to protect shoulder joints.' },
            { name: 'Standing Dumbbell Lateral Raise', category: 'Push', primaryMuscle: 'Shoulders', movementType: 'Isolation', tier: 'Tier 4: Unilateral Vector', defaultSets: 4, defaultReps: 15, defaultWeight: 12, tempo: '2-0-1-1', restSec: 60, cue: 'Lead with elbows. Stop at parallel, 1-second squeeze.' },
            { name: 'Overhead Dumbbell Triceps Extension', category: 'Push', primaryMuscle: 'Arms', movementType: 'Isolation', tier: 'Tier 5: Synergist Finisher', defaultSets: 3, defaultReps: 12, defaultWeight: 24, tempo: '3-0-1-0', restSec: 60, cue: 'Maximum long-head tricep stretch behind the neck.' },
            { name: 'Deficit Dumbbell Push-ups to Failure', category: 'Push', primaryMuscle: 'Chest', movementType: 'Compound', tier: 'Tier 6: Metabolic Burnout', defaultSets: 3, defaultReps: 20, defaultWeight: 0, tempo: '2-0-1-0', restSec: 45, cue: 'Chest sinks below handle height for maximum pump.' },
          ];
        } else {
          movements = [
            { name: isAlt ? 'Incline Barbell Bench Press (30°)' : 'Barbell Flat Bench Press', category: 'Push', primaryMuscle: 'Chest', movementType: 'Compound', tier: 'Tier 1: Heavy CNS Compound', defaultSets: 4, defaultReps: 6, defaultWeight: 85, tempo: '3-1-1-0', restSec: 120, cue: 'Plant feet, touch mid-sternum, drive bar up and back.' },
            { name: isAlt ? 'Incline Dumbbell Press' : 'Weighted Dips (Chest Leaning)', category: 'Push', primaryMuscle: 'Chest', movementType: 'Compound', tier: 'Tier 2: Length-Tension Stretch', defaultSets: 3, defaultReps: 8, defaultWeight: 32, tempo: '3-1-1-0', restSec: 90, cue: 'Full mechanical stretch, feel chest stretch under load.' },
            { name: 'Cable Chest Flyes (Mid-Height)', category: 'Push', primaryMuscle: 'Chest', movementType: 'Isolation', tier: 'Tier 3: Contraction Isolator', defaultSets: 3, defaultReps: 12, defaultWeight: 15, tempo: '2-1-1-1', restSec: 60, cue: 'Cross hands at midline for peak sternal contraction.' },
            { name: 'Cable Lateral Raise (Behind Body)', category: 'Push', primaryMuscle: 'Shoulders', movementType: 'Isolation', tier: 'Tier 4: Unilateral Vector', defaultSets: 4, defaultReps: 15, defaultWeight: 10, tempo: '2-0-1-1', restSec: 60, cue: 'Constant tension throughout full range, lead with elbows.' },
            { name: 'Triceps Pushdown (Rope)', category: 'Push', primaryMuscle: 'Arms', movementType: 'Isolation', tier: 'Tier 5: Synergist Finisher', defaultSets: 3, defaultReps: 12, defaultWeight: 25, tempo: '2-0-1-1', restSec: 60, cue: 'Flare rope outward at bottom for lateral head contraction.' },
            { name: 'Overhead Cable Triceps Extension', category: 'Push', primaryMuscle: 'Arms', movementType: 'Isolation', tier: 'Tier 6: Metabolic Burnout', defaultSets: 3, defaultReps: 15, defaultWeight: 20, tempo: '3-0-1-0', restSec: 45, cue: 'Full extension overhead, keeping upper arms pinned.' },
          ];
        }
        break;

      case 'PULL':
        split = 'PULL';
        title = `O1FC Pull Beta • ${synthEquipment === 'BODYWEIGHT' ? 'Calisthenics Lat Armor' : synthEquipment === 'DUMBBELL' ? 'Unilateral Lat Density' : 'Lat Density & Chain'}`;
        focus = 'Thoracic Retraction, Latissimus Dorsi & Biceps Armor';
        notes = 'Initiate all pulls by depressing the scapulae. Pull elbows into pockets.';
        if (synthEquipment === 'BODYWEIGHT') {
          movements = [
            { name: isAlt ? 'Weighted Dead-Hang Pull-ups' : 'Strict Dead-Hang Pull-ups', category: 'Pull', primaryMuscle: 'Back', movementType: 'Compound', tier: 'Tier 1: Heavy CNS Compound', defaultSets: 4, defaultReps: 8, defaultWeight: 0, tempo: '2-1-1-0', restSec: 90, cue: 'Chest to bar, full dead-hang at bottom.' },
            { name: 'Inverted Bodyweight Rows (Bar or Rings)', category: 'Pull', primaryMuscle: 'Back', movementType: 'Compound', tier: 'Tier 2: Length-Tension Stretch', defaultSets: 4, defaultReps: 12, defaultWeight: 0, tempo: '2-0-1-1', restSec: 60, cue: 'Retract scapulae and squeeze mid-traps at top.' },
            { name: 'Chin-ups (Underhand Bicep Focus)', category: 'Pull', primaryMuscle: 'Arms', movementType: 'Compound', tier: 'Tier 3: Contraction Isolator', defaultSets: 3, defaultReps: 10, defaultWeight: 0, tempo: '3-0-1-0', restSec: 75, cue: 'Full range of motion, biceps load on eccentric descent.' },
            { name: 'Scapular Pull-ups (Retraction Power)', category: 'Pull', primaryMuscle: 'Back', movementType: 'Isolation', tier: 'Tier 4: Unilateral Vector', defaultSets: 3, defaultReps: 15, defaultWeight: 0, tempo: '1-2-1-0', restSec: 45, cue: 'Depress shoulders without bending elbows.' },
            { name: 'Doorframe / Towel Bicep Curls (Isometric)', category: 'Pull', primaryMuscle: 'Arms', movementType: 'Isolation', tier: 'Tier 5: Synergist Finisher', defaultSets: 3, defaultReps: 15, defaultWeight: 0, tempo: '2-1-1-1', restSec: 45, cue: 'Continuous peak contraction against resistance.' },
            { name: 'Bar Dead Hang (Spinal Decompression & Grip)', category: 'Pull', primaryMuscle: 'Back', movementType: 'Mobility', tier: 'Tier 6: Metabolic Burnout', defaultSets: 3, defaultReps: 60, defaultWeight: 0, tempo: 'Static', restSec: 45, cue: 'Passive lat stretch, deep belly breathing.' },
          ];
        } else if (synthEquipment === 'DUMBBELL') {
          movements = [
            { name: isAlt ? 'Dual Dumbbell Romanian Deadlift' : 'Heavy Single-Arm Dumbbell Row', category: 'Pull', primaryMuscle: 'Back', movementType: 'Compound', tier: 'Tier 1: Heavy CNS Compound', defaultSets: 4, defaultReps: 8, defaultWeight: 36, tempo: '3-1-1-0', restSec: 90, cue: 'Brace core, pull dumbbell to hip pocket.' },
            { name: 'Chest-Supported Incline Dumbbell Row', category: 'Pull', primaryMuscle: 'Back', movementType: 'Compound', tier: 'Tier 2: Length-Tension Stretch', defaultSets: 4, defaultReps: 10, defaultWeight: 26, tempo: '2-1-1-1', restSec: 75, cue: 'Eliminate momentum, focus on upper back squeeze.' },
            { name: 'Dumbbell Incline Bicep Curl', category: 'Pull', primaryMuscle: 'Arms', movementType: 'Isolation', tier: 'Tier 3: Contraction Isolator', defaultSets: 3, defaultReps: 12, defaultWeight: 14, tempo: '3-0-1-1', restSec: 60, cue: 'Full biceps long-head stretch at bottom of incline.' },
            { name: 'Dumbbell Rear Delt Prone Flyes', category: 'Pull', primaryMuscle: 'Shoulders', movementType: 'Isolation', tier: 'Tier 4: Unilateral Vector', defaultSets: 4, defaultReps: 15, defaultWeight: 10, tempo: '2-0-1-1', restSec: 45, cue: 'Chest against bench, squeeze rear delts at top.' },
            { name: 'Dumbbell Hammer Curls', category: 'Pull', primaryMuscle: 'Arms', movementType: 'Isolation', tier: 'Tier 5: Synergist Finisher', defaultSets: 3, defaultReps: 12, defaultWeight: 16, tempo: '2-0-1-0', restSec: 45, cue: 'Target brachialis and forearm grip strength.' },
            { name: 'Dumbbell Shrugs (2-Second Hold)', category: 'Pull', primaryMuscle: 'Back', movementType: 'Isolation', tier: 'Tier 6: Metabolic Burnout', defaultSets: 3, defaultReps: 15, defaultWeight: 30, tempo: '1-2-1-0', restSec: 45, cue: 'Elevate scapulae towards ears, hard isometric squeeze.' },
          ];
        } else {
          movements = [
            { name: isAlt ? 'Conventional Deadlift' : 'Barbell Bent-Over Row', category: 'Pull', primaryMuscle: 'Back', movementType: 'Compound', tier: 'Tier 1: Heavy CNS Compound', defaultSets: 4, defaultReps: 6, defaultWeight: 110, tempo: '3-1-1-0', restSec: 150, cue: 'Lock lats, push floor away, explosive lockout.' },
            { name: isAlt ? 'Weighted Pull-ups' : 'Wide-Grip Lat Pulldown', category: 'Pull', primaryMuscle: 'Back', movementType: 'Compound', tier: 'Tier 2: Length-Tension Stretch', defaultSets: 4, defaultReps: 8, defaultWeight: 75, tempo: '3-1-1-0', restSec: 90, cue: 'Drive elbows down and back to touch collarbone.' },
            { name: 'T-Bar Row (Close Grip)', category: 'Pull', primaryMuscle: 'Back', movementType: 'Compound', tier: 'Tier 3: Contraction Isolator', defaultSets: 3, defaultReps: 10, defaultWeight: 60, tempo: '2-1-1-1', restSec: 75, cue: 'Keep lumbar spine neutral, full stretch at bottom.' },
            { name: 'Face Pulls (Cable Rope to Forehead)', category: 'Pull', primaryMuscle: 'Shoulders', movementType: 'Isolation', tier: 'Tier 4: Unilateral Vector', defaultSets: 4, defaultReps: 15, defaultWeight: 25, tempo: '2-0-1-1', restSec: 60, cue: 'External rotation focus for rear delt and rotator cuff longevity.' },
            { name: 'Incline Dumbbell Bicep Curl', category: 'Pull', primaryMuscle: 'Arms', movementType: 'Isolation', tier: 'Tier 5: Synergist Finisher', defaultSets: 3, defaultReps: 12, defaultWeight: 14, tempo: '3-0-1-0', restSec: 60, cue: 'Deep supinated stretch, slow 3-second descent.' },
            { name: 'Cable Rope Hammer Curls', category: 'Pull', primaryMuscle: 'Arms', movementType: 'Isolation', tier: 'Tier 6: Metabolic Burnout', defaultSets: 3, defaultReps: 15, defaultWeight: 25, tempo: '2-0-1-0', restSec: 45, cue: 'Flare rope outward at top, forearm pump.' },
          ];
        }
        break;

      case 'LEGS':
        split = 'LEGS';
        title = `O1FC Legs Alpha • ${synthEquipment === 'BODYWEIGHT' ? 'Unilateral Force Transfer' : synthEquipment === 'DUMBBELL' ? 'Goblet & Split Squat' : 'Quad & Posterior Chain'}`;
        focus = 'Bilateral Knee Extension & Hip Hinge Kinetics';
        notes = 'Hit parallel or deeper on squats. Control eccentric descent on knee-dominant movements.';
        if (synthEquipment === 'BODYWEIGHT') {
          movements = [
            { name: isAlt ? 'Pistol Squats (Single Leg)' : 'Bulgarian Split Squat (Tempo 3-1-1-0)', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Compound', tier: 'Tier 1: Heavy CNS Compound', defaultSets: 4, defaultReps: 8, defaultWeight: 0, tempo: '3-1-1-0', restSec: 90, cue: 'Full single-leg balance and quad extension.' },
            { name: 'Nordic Hamstring Curl (Assisted)', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Compound', tier: 'Tier 2: Length-Tension Stretch', defaultSets: 4, defaultReps: 6, defaultWeight: 0, tempo: '4-0-1-0', restSec: 90, cue: 'Resist forward fall with eccentric hamstring tension.' },
            { name: 'Single-Leg Glute Bridge (Elevated Foot)', category: 'Legs', primaryMuscle: 'Glutes', movementType: 'Isolation', tier: 'Tier 3: Contraction Isolator', defaultSets: 3, defaultReps: 12, defaultWeight: 0, tempo: '2-2-1-0', restSec: 60, cue: 'Full hip extension, 2-second glute squeeze at peak.' },
            { name: 'Jump Squats (Explosive Ground Contact)', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Plyometric', tier: 'Tier 4: Unilateral Vector', defaultSets: 3, defaultReps: 12, defaultWeight: 0, tempo: '1-0-X-0', restSec: 60, cue: 'Triple extension at ankles, knees, and hips.' },
            { name: 'Standing Single-Leg Calf Raise', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Isolation', tier: 'Tier 5: Synergist Finisher', defaultSets: 4, defaultReps: 20, defaultWeight: 0, tempo: '2-1-1-1', restSec: 45, cue: 'Full dorsiflexion stretch, pause 1 second at top.' },
            { name: 'Wall Sit Iso-Hold (45s Hold)', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Functional', tier: 'Tier 6: Metabolic Burnout', defaultSets: 3, defaultReps: 45, defaultWeight: 0, tempo: 'Static', restSec: 45, cue: 'Thighs parallel to floor, contract quads.' },
          ];
        } else if (synthEquipment === 'DUMBBELL') {
          movements = [
            { name: isAlt ? 'Heavy Dumbbell Goblet Squat' : 'Dumbbell Front Rack Squats', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Compound', tier: 'Tier 1: Heavy CNS Compound', defaultSets: 4, defaultReps: 10, defaultWeight: 36, tempo: '3-1-1-0', restSec: 90, cue: 'Tall chest, spread floor with feet, full depth.' },
            { name: 'Dumbbell Romanian Deadlift', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Compound', tier: 'Tier 2: Length-Tension Stretch', defaultSets: 4, defaultReps: 10, defaultWeight: 30, tempo: '3-1-1-0', restSec: 90, cue: 'Hinge back into hips, keep dumbbells grazing shins.' },
            { name: 'Bulgarian Split Squat (Dual Dumbbells)', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Compound', tier: 'Tier 3: Contraction Isolator', defaultSets: 3, defaultReps: 10, defaultWeight: 18, tempo: '3-0-1-0', restSec: 75, cue: 'Forward torso lean to recruit glutes and quad stretch.' },
            { name: 'Dumbbell Walking Lunges', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Compound', tier: 'Tier 4: Unilateral Vector', defaultSets: 3, defaultReps: 20, defaultWeight: 16, tempo: '2-0-1-0', restSec: 60, cue: 'Touch back knee softly to floor, explosive step.' },
            { name: 'Standing Single-Leg Dumbbell Calf Raise', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Isolation', tier: 'Tier 5: Synergist Finisher', defaultSets: 4, defaultReps: 15, defaultWeight: 16, tempo: '2-1-1-1', restSec: 45, cue: 'Pause in deepest dorsiflexion stretch.' },
            { name: 'Dumbbell Sumo Squat Pulse Finisher', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Isolation', tier: 'Tier 6: Metabolic Burnout', defaultSets: 3, defaultReps: 15, defaultWeight: 24, tempo: '1-1-1-0', restSec: 45, cue: 'Maintain bottom 50% range of motion for lactic burn.' },
          ];
        } else {
          movements = [
            { name: isAlt ? 'Barbell Front Squat' : 'Barbell Back Squat', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Compound', tier: 'Tier 1: Heavy CNS Compound', defaultSets: 4, defaultReps: 6, defaultWeight: 105, tempo: '3-1-1-0', restSec: 150, cue: 'Break at hips and knees simultaneously, hit below parallel.' },
            { name: 'Romanian Deadlift (Barbell)', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Compound', tier: 'Tier 2: Length-Tension Stretch', defaultSets: 4, defaultReps: 8, defaultWeight: 90, tempo: '3-1-1-0', restSec: 100, cue: 'Maximum hamstring stretch at bottom, snap hips at top.' },
            { name: 'Leg Press (45-Degree High Foot Placement)', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Compound', tier: 'Tier 3: Contraction Isolator', defaultSets: 3, defaultReps: 12, defaultWeight: 180, tempo: '3-0-1-0', restSec: 90, cue: 'Control descent without pelvis tucking off pad.' },
            { name: 'Leg Extension (Machine)', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Isolation', tier: 'Tier 4: Unilateral Vector', defaultSets: 3, defaultReps: 15, defaultWeight: 60, tempo: '2-1-1-1', restSec: 60, cue: '2-second peak isometric contraction at full lockout.' },
            { name: 'Lying Hamstring Leg Curl', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Isolation', tier: 'Tier 5: Synergist Finisher', defaultSets: 3, defaultReps: 12, defaultWeight: 50, tempo: '2-0-1-1', restSec: 60, cue: 'Dorsiflex ankles, squeeze heels toward glutes.' },
            { name: 'Standing Machine Calf Raise', category: 'Legs', primaryMuscle: 'Legs', movementType: 'Isolation', tier: 'Tier 6: Metabolic Burnout', defaultSets: 4, defaultReps: 15, defaultWeight: 70, tempo: '2-1-1-1', restSec: 45, cue: 'Strict 2-second pause in full stretch before driving up.' },
          ];
        }
        break;

      case 'UPPER':
        split = 'UPPER';
        title = 'O1FC Upper Body • Antagonist Armor & Power';
        focus = 'Horizontal/Vertical Push-Pull Balance & Shoulder Health';
        notes = 'Superset pushing and pulling movement patterns for balanced joint kinematics.';
        movements = [
          { name: isAlt ? 'Incline Barbell Bench Press' : 'Barbell Flat Bench Press', category: 'Upper', primaryMuscle: 'Chest', movementType: 'Compound', tier: 'Tier 1: Heavy CNS Compound', defaultSets: 4, defaultReps: 6, defaultWeight: 80, tempo: '3-1-1-0', restSec: 120, cue: 'Tight upper back arch, drive bar explosively.' },
          { name: 'Weighted Pull-ups or Lat Pulldown', category: 'Upper', primaryMuscle: 'Back', movementType: 'Compound', tier: 'Tier 2: Length-Tension Stretch', defaultSets: 4, defaultReps: 8, defaultWeight: 70, tempo: '3-1-1-0', restSec: 90, cue: 'Chest to bar, pull elbows into ribcage.' },
          { name: 'Standing Dumbbell Overhead Press', category: 'Upper', primaryMuscle: 'Shoulders', movementType: 'Compound', tier: 'Tier 3: Contraction Isolator', defaultSets: 3, defaultReps: 8, defaultWeight: 22, tempo: '2-1-1-0', restSec: 75, cue: 'Neutral grip, lock out over midfoot without hyperextending back.' },
          { name: 'Chest-Supported T-Bar or Dumbbell Row', category: 'Upper', primaryMuscle: 'Back', movementType: 'Compound', tier: 'Tier 4: Unilateral Vector', defaultSets: 3, defaultReps: 10, defaultWeight: 50, tempo: '2-1-1-1', restSec: 60, cue: 'Full stretch at bottom, squeeze shoulder blades together.' },
          { name: 'Cable Lateral Raise (Behind Body)', category: 'Upper', primaryMuscle: 'Shoulders', movementType: 'Isolation', tier: 'Tier 5: Synergist Finisher', defaultSets: 3, defaultReps: 15, defaultWeight: 10, tempo: '2-0-1-1', restSec: 45, cue: 'Constant tension, lead with elbows.' },
          { name: 'Antagonist Biceps/Triceps Superset', category: 'Upper', primaryMuscle: 'Arms', movementType: 'Isolation', tier: 'Tier 6: Metabolic Burnout', defaultSets: 3, defaultReps: 12, defaultWeight: 20, tempo: '2-0-1-0', restSec: 45, cue: 'Incline curls paired with cable rope pushdowns back-to-back.' },
        ];
        break;

      case 'LOWER':
        split = 'LOWER';
        title = 'O1FC Lower Body • Explosive Triple Extension';
        focus = 'Bilateral Power, Posterior Chain & Unilateral Deceleration';
        notes = 'Focus on explosive hip drive out of the hole and deep eccentric control on lunges.';
        movements = [
          { name: isAlt ? 'Trap Bar Deadlift (High Velocity)' : 'Competition Barbell Squat', category: 'Lower', primaryMuscle: 'Legs', movementType: 'Compound', tier: 'Tier 1: Heavy CNS Compound', defaultSets: 4, defaultReps: 5, defaultWeight: 110, tempo: '3-1-X-0', restSec: 150, cue: 'Maximum acceleration on concentric drive.' },
          { name: 'Barbell Romanian Deadlift', category: 'Lower', primaryMuscle: 'Legs', movementType: 'Compound', tier: 'Tier 2: Length-Tension Stretch', defaultSets: 4, defaultReps: 8, defaultWeight: 85, tempo: '3-1-1-0', restSec: 90, cue: 'Hamstring stretch, snap glutes forward at top.' },
          { name: 'Bulgarian Split Squat (Dumbbells)', category: 'Lower', primaryMuscle: 'Legs', movementType: 'Compound', tier: 'Tier 3: Contraction Isolator', defaultSets: 3, defaultReps: 10, defaultWeight: 20, tempo: '3-0-1-0', restSec: 75, cue: 'Maintain knee alignment, full hip extension.' },
          { name: 'Barbell Hip Thrust (2s Squeeze)', category: 'Lower', primaryMuscle: 'Glutes', movementType: 'Compound', tier: 'Tier 4: Unilateral Vector', defaultSets: 3, defaultReps: 10, defaultWeight: 90, tempo: '2-0-1-2', restSec: 60, cue: 'Tuck chin, full hip lockout at top without arching lower back.' },
          { name: 'Lying Hamstring Curl', category: 'Lower', primaryMuscle: 'Legs', movementType: 'Isolation', tier: 'Tier 5: Synergist Finisher', defaultSets: 3, defaultReps: 12, defaultWeight: 50, tempo: '2-0-1-1', restSec: 60, cue: 'Dorsiflex toes, slow 3-second eccentric phase.' },
          { name: 'Standing Calf Raise with 2s Stretch', category: 'Lower', primaryMuscle: 'Legs', movementType: 'Isolation', tier: 'Tier 6: Metabolic Burnout', defaultSets: 4, defaultReps: 15, defaultWeight: 60, tempo: '2-1-1-1', restSec: 45, cue: 'Deep stretch at bottom, drive up onto big toe.' },
        ];
        break;

      case 'SPEED':
        split = 'SPORT';
        title = 'O1FC Kinetic Speed • Agility & Deceleration';
        focus = 'Rate of Force Development, First-Step Shin Angles & COD';
        notes = 'Rest sufficiently between sprint efforts to ensure maximum neurological power output.';
        movements = [
          { name: isAlt ? '20m Acceleration Sprints (3-Point Stance)' : '10m Fly-In Sprints (Max Velocity)', category: 'Speed', primaryMuscle: 'Legs', movementType: 'Plyometric', tier: 'Tier 1: Heavy CNS Compound', defaultSets: 6, defaultReps: 1, defaultWeight: 0, tempo: 'Max Velocity', restSec: 120, cue: 'Low forward shin angle, drive track backward aggressively.' },
          { name: 'Lateral Skater Bounds with Stick Landing', category: 'Speed', primaryMuscle: 'Legs', movementType: 'Plyometric', tier: 'Tier 2: Length-Tension Stretch', defaultSets: 4, defaultReps: 6, defaultWeight: 0, tempo: '1-0-X-1', restSec: 60, cue: 'Absorb landing softly in a loaded athletic hinge stance.' },
          { name: 'Trap Bar Speed Pull (65% 1RM + Bands)', category: 'Speed', primaryMuscle: 'Legs', movementType: 'Compound', tier: 'Tier 3: Contraction Isolator', defaultSets: 4, defaultReps: 3, defaultWeight: 80, tempo: '1-0-X-0', restSec: 90, cue: 'Pull with maximal violent velocity from the floor.' },
          { name: '5-10-5 Pro Agility Shuttle Drill', category: 'Speed', primaryMuscle: 'Legs', movementType: 'Functional', tier: 'Tier 4: Unilateral Vector', defaultSets: 4, defaultReps: 1, defaultWeight: 0, tempo: 'COD', restSec: 90, cue: 'Low center of mass at change-of-direction lines.' },
          { name: 'Rotational Medicine Ball Slam', category: 'Speed', primaryMuscle: 'Core', movementType: 'Plyometric', tier: 'Tier 5: Synergist Finisher', defaultSets: 4, defaultReps: 8, defaultWeight: 8, tempo: 'Explosive', restSec: 60, cue: 'Violent hip rotation transfer into the floor.' },
          { name: 'Deceleration 5-Step Braking Drill', category: 'Speed', primaryMuscle: 'Legs', movementType: 'Functional', tier: 'Tier 6: Metabolic Burnout', defaultSets: 3, defaultReps: 4, defaultWeight: 0, tempo: 'Decel', restSec: 45, cue: 'Drop hips and absorb deceleration through the front quad.' },
        ];
        break;

      case 'HYROX':
        split = 'HYROX';
        title = 'O1FC Hyrox Engine • Sled & Threshold Capacity';
        focus = 'Compromised Running Economy & Lactate Station Stamina';
        notes = 'Simulate competition station transitions without pacing collapse.';
        movements = [
          { name: isAlt ? 'Concept2 SkiErg 1000m Interval' : 'Concept2 Rowing 1000m Interval', category: 'Hyrox', primaryMuscle: 'Full Body', movementType: 'Functional', tier: 'Tier 1: Heavy CNS Compound', defaultSets: 2, defaultReps: 1000, defaultWeight: 0, tempo: 'Race Pace', restSec: 90, cue: 'Maintain strong hip hinge and stroke rhythm.' },
          { name: 'Heavy Sled Push 50m (Comp Weight)', category: 'Hyrox', primaryMuscle: 'Legs', movementType: 'Functional', tier: 'Tier 2: Length-Tension Stretch', defaultSets: 3, defaultReps: 50, defaultWeight: 140, tempo: 'Constant Drive', restSec: 90, cue: 'Low torso angle, continuous high knee drive.' },
          { name: 'Burpee Broad Jumps (80m or 4x20m)', category: 'Hyrox', primaryMuscle: 'Full Body', movementType: 'Plyometric', tier: 'Tier 3: Contraction Isolator', defaultSets: 3, defaultReps: 20, defaultWeight: 0, tempo: 'Cadence', restSec: 60, cue: 'Jump forward immediately out of the burpee push-up.' },
          { name: 'Heavy Farmers Carry 200m (2x28kg or 2x32kg)', category: 'Hyrox', primaryMuscle: 'Full Body', movementType: 'Functional', tier: 'Tier 4: Unilateral Vector', defaultSets: 3, defaultReps: 200, defaultWeight: 56, tempo: 'Upright', restSec: 60, cue: 'Tall posture, proud chest, unbreakable grip.' },
          { name: 'Wall Balls 100 Reps (6kg/9kg)', category: 'Hyrox', primaryMuscle: 'Full Body', movementType: 'Functional', tier: 'Tier 5: Synergist Finisher', defaultSets: 4, defaultReps: 25, defaultWeight: 9, tempo: 'Rhythmic', restSec: 45, cue: 'Full squat depth, catch ball and drive straight up.' },
          { name: 'Sandbag Walking Lunges (100m)', category: 'Hyrox', primaryMuscle: 'Legs', movementType: 'Functional', tier: 'Tier 6: Metabolic Burnout', defaultSets: 2, defaultReps: 50, defaultWeight: 20, tempo: 'Cadence', restSec: 45, cue: 'Upright torso, knee touches floor on every stride.' },
        ];
        break;

      case 'STRENGTH':
        split = 'STRENGTH';
        title = 'O1FC Max Strength • 5x5 CNS Peaking';
        focus = 'Absolute Neurological Recruitment & Structural Tension';
        notes = 'Take 3-4 minutes rest between primary sets. Maximum competition intent.';
        movements = [
          { name: isAlt ? 'Competition Low Bar Squat (3x3)' : 'Competition Low Bar Squat (5x5)', category: 'Strength', primaryMuscle: 'Legs', movementType: 'Compound', tier: 'Tier 1: Heavy CNS Compound', defaultSets: 5, defaultReps: 3, defaultWeight: 130, tempo: '3-1-X-0', restSec: 180, cue: 'Brace abdominal wall with 360-degree intra-abdominal pressure.' },
          { name: 'Competition Paused Bench Press (Sternum 1s Pause)', category: 'Strength', primaryMuscle: 'Chest', movementType: 'Compound', tier: 'Tier 2: Length-Tension Stretch', defaultSets: 5, defaultReps: 3, defaultWeight: 95, tempo: '2-1-X-0', restSec: 180, cue: 'Leg drive active before bar touches chest. Violent press.' },
          { name: 'Deficit Deadlift or Heavy Conventional Pull', category: 'Strength', primaryMuscle: 'Back', movementType: 'Compound', tier: 'Tier 3: Contraction Isolator', defaultSets: 4, defaultReps: 3, defaultWeight: 140, tempo: '1-1-X-0', restSec: 180, cue: 'Overcome the off-the-floor sticking point with locked lats.' },
          { name: 'Weighted Dips (Heavy 3x5)', category: 'Strength', primaryMuscle: 'Chest', movementType: 'Compound', tier: 'Tier 4: Unilateral Vector', defaultSets: 3, defaultReps: 5, defaultWeight: 20, tempo: '2-1-X-0', restSec: 120, cue: 'Tricep and lower chest overload.' },
          { name: 'Barbell Shrugs (Heavy 2-Second Hold)', category: 'Strength', primaryMuscle: 'Back', movementType: 'Isolation', tier: 'Tier 5: Synergist Finisher', defaultSets: 3, defaultReps: 8, defaultWeight: 100, tempo: '1-2-1-0', restSec: 75, cue: 'Reinforce upper back shelf and grip strength.' },
          { name: 'Ab Wheel Rollout from Knees', category: 'Strength', primaryMuscle: 'Core', movementType: 'Functional', tier: 'Tier 6: Metabolic Burnout', defaultSets: 3, defaultReps: 10, defaultWeight: 0, tempo: '3-1-1-0', restSec: 60, cue: 'Anterior core bracing under heavy spinal shear load.' },
        ];
        break;

      case 'RECOVERY':
        split = 'RECOVERY';
        title = 'O1FC Bio-Recovery • Joint Flow & Decompression';
        focus = 'Parasympathetic Shift, Joint Capsule CARs & Disc Traction';
        notes = 'Nasal diaphragmatic breathing throughout. Do not force joint pain.';
        movements = [
          { name: '90/90 Hip Transition & Active CARs', category: 'Recovery', primaryMuscle: 'Glutes', movementType: 'Mobility', tier: 'Tier 1: Heavy CNS Compound', defaultSets: 3, defaultReps: 8, defaultWeight: 0, tempo: 'Flow', restSec: 30, cue: 'Smooth internal and external rotation of the hip capsules.' },
          { name: 'Segmental Cat-Cow Flow (Breath Synchronized)', category: 'Recovery', primaryMuscle: 'Back', movementType: 'Mobility', tier: 'Tier 2: Length-Tension Stretch', defaultSets: 3, defaultReps: 10, defaultWeight: 0, tempo: 'Flow', restSec: 30, cue: 'Articulate each spinal vertebra individually.' },
          { name: 'Dead Hang Spinal Decompression (Bar or Rings)', category: 'Recovery', primaryMuscle: 'Back', movementType: 'Mobility', tier: 'Tier 3: Contraction Isolator', defaultSets: 3, defaultReps: 60, defaultWeight: 0, tempo: 'Static', restSec: 45, cue: 'Release tension in lumbar spine and allow shoulders to elevate naturally.' },
          { name: 'Cossack Squat (Deep Lateral Hip Opener)', category: 'Recovery', primaryMuscle: 'Legs', movementType: 'Mobility', tier: 'Tier 4: Unilateral Vector', defaultSets: 3, defaultReps: 8, defaultWeight: 0, tempo: 'Flow', restSec: 45, cue: 'Keep grounded heel flat, open adductor long-head.' },
          { name: 'Thread the Needle Thoracic Reach', category: 'Recovery', primaryMuscle: 'Back', movementType: 'Mobility', tier: 'Tier 5: Synergist Finisher', defaultSets: 3, defaultReps: 8, defaultWeight: 0, tempo: 'Flow', restSec: 30, cue: 'Deep thoracic rotation and rib expansion.' },
          { name: 'Diaphragmatic Box Breathing (4s in / 4s hold / 4s out)', category: 'Recovery', primaryMuscle: 'Core', movementType: 'Mobility', tier: 'Tier 6: Metabolic Burnout', defaultSets: 1, defaultReps: 5, defaultWeight: 0, tempo: 'Box Breathing', restSec: 0, cue: 'Trigger parasympathetic nervous recovery tone.' },
        ];
        break;
    }

    // Filter count by duration
    const count = synthDuration === '30m' ? 3 : synthDuration === '45m' ? 5 : 6;
    const selectedDescriptors = movements.slice(0, count);

    // Map to StagedExercise array
    const mappedExercises: StagedExercise[] = selectedDescriptors.map((desc, idx) => {
      const setsCount = desc.defaultSets;
      const sets: IntelligentSet[] = Array.from({ length: setsCount }, (_, sIdx) => {
        const isLast = sIdx === setsCount - 1;
        const isFailure = synthRpe === 'FAILURE';
        return {
          setNum: sIdx + 1,
          type: isFailure && isLast ? 'dropset' : (sIdx === 0 && desc.defaultWeight > 60 ? 'warmup' : 'working'),
          reps: isFailure && isLast ? Math.max(6, desc.defaultReps + 2) : desc.defaultReps,
          weight: isFailure && isLast ? Math.max(0, Math.round(desc.defaultWeight * 0.8)) : desc.defaultWeight,
          rpe: isFailure ? (isLast ? 10 : 9) : (7.5 + sIdx * 0.5),
        };
      });

      return {
        id: `synth_${synthIntent.toLowerCase()}_${idx}_${Date.now()}`,
        name: desc.name,
        category: desc.category,
        primaryMuscle: desc.primaryMuscle,
        movementType: desc.movementType,
        restSec: desc.restSec,
        tempo: desc.tempo,
        progressionScheme: synthRpe === 'FAILURE' ? 'Reverse Pyramid' : 'Straight',
        notes: `[${desc.tier}] ${desc.cue}`,
        isExpanded: false,
        sets,
      };
    });

    const estMinutes = synthDuration === '30m' ? 30 : synthDuration === '45m' ? 45 : 65;

    return {
      title,
      split,
      focus,
      notes,
      estimatedMinutes: estMinutes,
      exercises: mappedExercises,
    };
  }, [synthIntent, synthDuration, synthEquipment, synthRpe, synthSeed]);

  // ─── Load Synthesized Blueprint Into Stack ───
  const handleLoadSynthIntoStack = () => {
    setStagedExercises(synthesizedBlueprint.exercises);
    setRoutineTitle(synthesizedBlueprint.title);
    setActiveTab('stack');
    showToast(`Loaded "${synthesizedBlueprint.title}" into Stack`);
  };

  // ─── Instant Dispatch Synthesized Blueprint to Selected Athletes ───
  const handleInstantSynthDispatch = async () => {
    if (selectedClientKeys.length === 0) {
      showToast('Select target athletes to dispatch this blueprint');
      setIsClientSheetOpen(true);
      return;
    }

    setIsSynthDispatching(true);
    const synth = synthesizedBlueprint;

    const transformedExercises: DispatchedExercise[] = synth.exercises.map((ex) => {
      const primarySet = ex.sets[0] || { reps: 10, weight: 50 };
      return {
        name: ex.name,
        sets: ex.sets.length,
        reps: `${primarySet.reps} reps`,
        targetLoad: `${primarySet.weight > 0 ? `${primarySet.weight} kg • ` : ''}Tempo ${ex.tempo}`,
        notes: `${ex.notes} [${ex.progressionScheme}]`,
      };
    });

    const selectedClientNames = selectedClientKeys.map(
      (key) => clients[key]?.name || key
    );

    try {
      await dispatchWorkout({
        coachId: 'coach_main',
        coachName: coachName || 'Head Coach',
        clientIds: selectedClientKeys,
        clientNames: selectedClientNames,
        title: synth.title,
        routineCategory: synth.split,
        scheduledDay,
        scheduledDate: new Date().toISOString().split('T')[0],
        exercises: transformedExercises,
        notes: `[O1FC Blueprint • ${synthDuration} • ${synthEquipment} • ${synthRpe === 'FAILURE' ? 'Failure' : 'Progressive'}] ${synth.notes}`,
      });

      // Align active stack as well
      setStagedExercises(synth.exercises);
      setRoutineTitle(synth.title);
      setIsSynthDispatching(false);

      if (onDispatchSuccess) {
        onDispatchSuccess(selectedClientKeys.length);
      }
      showToast(`Dispatched "${synth.title}" to ${selectedClientKeys.length} athlete(s)!`);
    } catch (e) {
      setIsSynthDispatching(false);
      showToast('Dispatch failed. Retrying...');
    }
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

  // ─── Coach Blueprint Saved Handlers ───
  const handleSaveSynthesizedBlueprint = () => {
    const newBp = saveCoachBlueprint({
      title: synthesizedBlueprint.title,
      split: synthesizedBlueprint.split,
      focus: synthesizedBlueprint.focus,
      notes: synthesizedBlueprint.notes,
      estimatedMinutes: synthesizedBlueprint.estimatedMinutes,
      equipment: synthEquipment === 'FULL' ? 'Full Gym' : synthEquipment === 'DUMBBELL' ? 'DB & Bench' : 'Bodyweight',
      intensity: synthRpe === 'FAILURE' ? 'Failure Dropset' : 'Progressive RPE 8',
      exercises: synthesizedBlueprint.exercises,
    });
    setSavedBlueprints(getCoachSavedBlueprints());
    showToast(`Saved "${newBp.title}" to My Blueprints`);
  };

  const handleSaveActiveStackAsBlueprint = () => {
    if (stagedExercises.length === 0) {
      showToast('Add at least one exercise to save as a blueprint');
      return;
    }
    const title = routineTitle.trim() || 'Custom Workout Prescription';
    const newBp = saveCoachBlueprint({
      title,
      split: selectedSplit || 'PUSH',
      focus: coachPrescription || `${periodizationFocus} • ${stagedExercises.length} movements`,
      notes: coachPrescription,
      estimatedMinutes: Math.max(25, stagedExercises.length * 8),
      equipment: 'Custom',
      intensity: periodizationFocus,
      exercises: stagedExercises,
    });
    setSavedBlueprints(getCoachSavedBlueprints());
    showToast(`Saved "${newBp.title}" to My Blueprints`);
  };

  const handleLoadSavedBlueprint = (bp: CoachSavedBlueprint) => {
    setRoutineTitle(bp.title);
    if (bp.split) {
      setSelectedSplit(bp.split as any);
    }

    const cloned: StagedExercise[] = bp.exercises.map((ex, idx) => ({
      ...ex,
      id: `stg_${Date.now()}_${idx}`,
      sets: ex.sets ? ex.sets.map((s) => ({ ...s })) : [],
      isExpanded: false,
    }));

    setStagedExercises(cloned);
    setActiveTab('stack');
    showToast(`Loaded "${bp.title}" into Stack`);
  };

  const handleDeleteSavedBlueprint = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteCoachBlueprint(id);
    setSavedBlueprints(updated);
    showToast(`Removed "${title}" from Blueprints`);
  };

  const handleUpdateBlueprintTitle = (id: string, newTitle: string) => {
    if (!newTitle.trim()) {
      setEditingBpId(null);
      return;
    }
    const updated = updateCoachBlueprintTitle(id, newTitle);
    setSavedBlueprints(updated);
    setEditingBpId(null);
    showToast('Blueprint title updated');
  };

  const handleInstantDispatchSavedBlueprint = async (bp: CoachSavedBlueprint) => {
    if (selectedClientKeys.length === 0) {
      showToast('Select target athletes to dispatch this blueprint');
      setIsClientSheetOpen(true);
      return;
    }

    setIsSynthDispatching(true);

    const transformedExercises: DispatchedExercise[] = bp.exercises.map((ex) => {
      const primarySet = ex.sets[0] || { reps: 10, weight: 50 };
      return {
        name: ex.name,
        sets: ex.sets.length,
        reps: `${primarySet.reps} reps`,
        targetLoad: `${primarySet.weight > 0 ? `${primarySet.weight} kg • ` : ''}Tempo ${ex.tempo}`,
        notes: `${ex.notes} [${ex.progressionScheme}]`,
      };
    });

    const selectedClientNames = selectedClientKeys.map(
      (key) => clients[key]?.name || key
    );

    try {
      await dispatchWorkout({
        coachId: 'coach_main',
        coachName: coachName || 'Head Coach',
        clientIds: selectedClientKeys,
        clientNames: selectedClientNames,
        title: bp.title,
        routineCategory: bp.split,
        scheduledDay,
        scheduledDate: new Date().toISOString().split('T')[0],
        exercises: transformedExercises,
        notes: `[O1FC Saved Blueprint • ${bp.equipment || 'Gym'} • ${bp.estimatedMinutes}m] ${bp.notes || bp.focus}`,
      });

      // Align active stack as well
      setStagedExercises(bp.exercises);
      setRoutineTitle(bp.title);
      setIsSynthDispatching(false);

      if (onDispatchSuccess) {
        onDispatchSuccess(selectedClientKeys.length);
      }
      showToast(`Dispatched "${bp.title}" to ${selectedClientKeys.length} athlete(s)!`);
    } catch (e) {
      setIsSynthDispatching(false);
      showToast('Dispatch failed. Please check connection.');
    }
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

  if (!isCoachRole) {
    return createPortal(
      <div
        id="workout-dispatch-auth-guard"
        className="fixed inset-0 z-[99990] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
      >
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121214] p-6 text-center flex flex-col items-center gap-3.5 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-600/10 dark:bg-red-500/15 border border-red-600/20 flex items-center justify-center text-red-600 dark:text-red-400">
            <Lock size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-black dark:text-white">
              Coach Pro License Required
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
              Multi-athlete workout dispatch, custom periodization stacks, and telemetry push require an active O1FC Coach Pro license.
            </p>
          </div>
          <div className="w-full flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('open_pay_plan_coach'));
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Upgrade to Coach Pro
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const modalContent = (
    <div
      id="studio-builder-modal"
      className="fixed inset-0 z-[99990] bg-white text-black flex flex-col w-full h-full overflow-hidden font-sans select-none animate-in fade-in duration-150 overscroll-contain"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          CLEAN LIGHT TOP BAR
          ═══════════════════════════════════════════════════════════════════════ */}
      <header className="bg-white border-b border-zinc-200 shrink-0 z-30 pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 min-h-[44px]">
          {/* Title & Movements Counter */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 mr-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-black flex items-center gap-1.5 min-w-0 overflow-hidden">
              <span className="truncate">Workout Dispatch Studio</span>
              <span className="text-[11px] font-semibold text-zinc-700 shrink-0">
                ({stagedExercises.length})
              </span>
            </h1>
          </div>

          {/* Top Actions: Athlete Selector & Close */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsClientSheetOpen(true)}
              className="p-1 sm:p-1.5 flex items-center gap-1 sm:gap-1.5 text-xs font-bold text-black hover:text-red-600 transition-colors cursor-pointer bg-transparent border-0 active:scale-95 shrink-0"
              title="Select Athletes"
            >
              <Users className="w-4 h-4 text-black stroke-[2] shrink-0" />
              <span className="truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[180px]">
                {selectedClientKeys.length === 1
                  ? clients[selectedClientKeys[0]]?.name || '1 Athlete'
                  : `${selectedClientKeys.length} Athletes`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-black stroke-[2.5] shrink-0" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 -mr-1 flex items-center justify-center text-black hover:text-red-600 transition-all active:scale-90 cursor-pointer bg-transparent border-0 shrink-0"
              title="Close Studio"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* ─── LIVE TELEMETRY & MUSCLE LOAD HUD (Clean Light Theme) ─── */}
        <div className="bg-white border-t border-zinc-200 px-3 sm:px-4 py-2">
          <div className="w-full max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-black">
            <div className="flex items-center gap-3 sm:gap-5 text-xs">
              <div>
                <span className="text-zinc-600 font-medium">Sets: </span>
                <span className="text-black font-bold">{telemetry.totalSets}</span>
              </div>
              <div>
                <span className="text-zinc-600 font-medium">Est. Time: </span>
                <span className="text-black font-bold">{telemetry.estDurationMinutes}m</span>
              </div>
              <div>
                <span className="text-zinc-600 font-medium">Volume: </span>
                <span className="text-black font-bold">
                  {(telemetry.totalVolumeKg / 1000).toFixed(1)}k kg
                </span>
              </div>
            </div>

            {/* Muscle Breakdown Pills */}
            {telemetry.muscleBreakdown.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0">
                {telemetry.muscleBreakdown.slice(0, 2).map((item) => (
                  <span
                    key={item.muscle}
                    className="px-2 py-0.5 rounded-md bg-white border border-zinc-300 text-[11px] text-black font-semibold whitespace-nowrap shrink-0 shadow-xs"
                  >
                    {item.muscle} <span className="text-red-600 font-bold">{item.percent}%</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── 3 STANDARDIZED CAPSULES (Apple Pro Height, Clean White & Red) ─── */}
        <div className="border-t border-zinc-200 px-3 sm:px-4 py-2 bg-white">
          <div className="w-full max-w-5xl mx-auto grid grid-cols-3 gap-1.5 sm:gap-2">
            <button
              id="tab-workout-stack"
              type="button"
              onClick={() => setActiveTab('stack')}
              className={`h-9 px-2 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'stack'
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                  : 'bg-white text-black hover:bg-zinc-50 border border-zinc-300 hover:border-black'
              }`}
            >
              <Dumbbell className="w-4 h-4 shrink-0 stroke-[2]" />
              <span>Stack ({stagedExercises.length})</span>
            </button>

            <button
              id="tab-exercise-library"
              type="button"
              onClick={() => setActiveTab('library')}
              className={`h-9 px-2 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'library'
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                  : 'bg-white text-black hover:bg-zinc-50 border border-zinc-300 hover:border-black'
              }`}
            >
              <Search className="w-4 h-4 shrink-0 stroke-[2]" />
              <span>Library</span>
            </button>

            <button
              id="tab-o1fc-blueprints"
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`h-9 px-2 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'templates'
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                  : 'bg-white text-black hover:bg-zinc-50 border border-zinc-300 hover:border-black'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 stroke-[2]" />
              <span>Blueprints {savedBlueprints.length > 0 ? `(${savedBlueprints.length})` : ''}</span>
            </button>
          </div>
        </div>
      </header>

      {/* TOAST ALERTS */}
      {toastMessage && (
        <div className="bg-black text-white px-4 py-2 text-xs font-bold text-center tracking-wide shrink-0 animate-in fade-in z-50">
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
            <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <SlidersHorizontal className="w-4 h-4 text-black stroke-[2] shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-black truncate">
                    Workout Parameters
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsParamsExpanded(!isParamsExpanded)}
                  className="text-xs text-black hover:text-red-600 font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                >
                  <span>{isParamsExpanded ? 'Hide Details' : 'Edit Setup'}</span>
                  {isParamsExpanded ? <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" /> : <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />}
                </button>
              </div>

              {/* Quick Summary row when collapsed */}
              {!isParamsExpanded && (
                <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
                  <div className="font-bold text-black truncate max-w-[200px] sm:max-w-xs">
                    {routineTitle || 'Custom Workout Prescription'}
                  </div>
                  <span className="text-zinc-300">•</span>
                  <span className="text-black font-semibold">{scheduledDay}</span>
                  <span className="text-zinc-300">•</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-300 text-[11px] text-black font-bold">
                    {periodizationFocus}
                  </span>
                </div>
              )}

              {/* Full inputs when expanded */}
              {isParamsExpanded && (
                <div className="space-y-2.5 pt-2 border-t border-zinc-200 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    {/* Routine Title */}
                    <div className="md:col-span-6 space-y-1">
                      <label className="text-[10px] font-bold text-black uppercase tracking-wider">Workout Title</label>
                      <input
                        type="text"
                        value={routineTitle}
                        onChange={(e) => setRoutineTitle(e.target.value)}
                        placeholder="e.g. Push Hypertrophy Heavy"
                        className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-black font-bold placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                      />
                    </div>

                    {/* Scheduled Day */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] font-bold text-black uppercase tracking-wider">Schedule Day</label>
                      <select
                        value={scheduledDay}
                        onChange={(e) => setScheduledDay(e.target.value as any)}
                        className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-black font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                      >
                        {['Today', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                          <option key={d} value={d} className="bg-white text-black font-semibold">
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Periodization Focus */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] font-bold text-black uppercase tracking-wider">Target Goal</label>
                      <select
                        value={periodizationFocus}
                        onChange={(e) => setPeriodizationFocus(e.target.value as any)}
                        className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-black font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                    <label className="text-[10px] font-bold text-black uppercase tracking-wider">Technique Focus & Coaching Notes</label>
                    <input
                      type="text"
                      value={coachPrescription}
                      onChange={(e) => setCoachPrescription(e.target.value)}
                      placeholder="e.g. Explode on concentric drive, control 3-second descent..."
                      className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-black font-semibold placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* STAGED EXERCISES LIST */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-black">
                    Programmed Exercises ({stagedExercises.length})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSaveActiveStackAsBlueprint}
                    disabled={stagedExercises.length === 0}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-300 hover:border-black text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-40"
                    title="Save current stack to your Blueprints list"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-red-600 stroke-[2.5]" />
                    <span className="hidden sm:inline">Save Stack as Blueprint</span>
                    <span className="sm:hidden">Save</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('library')}
                    className="px-3 py-1.5 rounded-lg bg-black text-white hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add Exercise</span>
                  </button>
                </div>
              </div>

              {stagedExercises.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white border border-dashed border-zinc-300 space-y-3 shadow-xs">
                  <Dumbbell className="w-8 h-8 mx-auto text-black stroke-[1.5]" />
                  <p className="text-sm font-bold text-black">No exercises in this workout yet</p>
                  <p className="text-xs text-zinc-700 max-w-sm mx-auto font-medium">
                    Add movements from the Exercise Library or pick an O1FC Blueprint to start programming.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('library')}
                      className="px-4 py-2 rounded-xl bg-black text-white hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Search className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Browse Library</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('templates')}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/30"
                    >
                      <Sparkles className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Load O1FC Blueprint</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {stagedExercises.map((ex, exIdx) => {
                    const isCollapsed = ex.isExpanded === false;

                    return (
                      <div
                        key={ex.id}
                        className={`rounded-2xl bg-white border border-zinc-200 text-black transition-all shadow-sm ${
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
                            <Dumbbell className="w-4 h-4 text-black stroke-[2] shrink-0" />
                            <h4 className="text-xs sm:text-sm font-bold text-black tracking-tight truncate">
                              {ex.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-zinc-700">
                              {ex.sets.length} {ex.sets.length === 1 ? 'set' : 'sets'}
                            </span>
                            <div className="p-0.5 text-black hover:text-red-600 transition-colors">
                              {isCollapsed ? (
                                <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                              ) : (
                                <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                              )}
                            </div>
                          </div>
                        </div>

                        {!isCollapsed && (
                          <>
                            {/* Column Header Labels */}
                            <div className="grid grid-cols-[28px_1fr_1fr_1fr_28px] items-center gap-1.5 text-[10px] font-bold tracking-wider text-black uppercase font-mono px-0.5">
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
                                  className="grid grid-cols-[28px_1fr_1fr_1fr_28px] items-center gap-1.5"
                                >
                                  {/* SET NUMBER */}
                                  <span className="text-center font-bold text-xs text-black font-mono">
                                    {s.setNum || sIdx + 1}
                                  </span>

                                  {/* REPS INPUT BOX */}
                                  <div className="h-7 sm:h-7.5 bg-white border border-zinc-300 rounded-lg px-1 flex items-center justify-center focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all overflow-hidden">
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
                                      className="w-full bg-transparent text-center font-bold text-xs sm:text-sm text-black focus:outline-none p-0 m-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>

                                  {/* KG INPUT BOX */}
                                  <div className="h-7 sm:h-7.5 bg-white border border-zinc-300 rounded-lg px-1 flex items-center justify-center focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all overflow-hidden">
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
                                      className="w-full bg-transparent text-center font-bold text-xs sm:text-sm text-black focus:outline-none p-0 m-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>

                                  {/* RPE INPUT BOX */}
                                  <div className="h-7 sm:h-7.5 bg-white border border-zinc-300 rounded-lg px-1 flex items-center justify-center focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all overflow-hidden">
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
                                      className="w-full bg-transparent text-center font-bold text-xs sm:text-sm text-black focus:outline-none p-0 m-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>

                                  {/* Delete Set icon */}
                                  <div className="flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSet(ex.id, sIdx)}
                                      disabled={ex.sets.length <= 1}
                                      className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-red-600 disabled:opacity-0 transition-colors p-0 cursor-pointer bg-transparent border-0"
                                      title="Delete Set"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Bottom Action Row: Add Set & Delete Exercise */}
                            <div className="flex items-center justify-between gap-2 pt-1 px-0.5">
                              <button
                                type="button"
                                onClick={() => handleAddSet(ex.id)}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold text-xs py-0.5 px-0 transition-colors cursor-pointer bg-transparent border-0 active:opacity-75"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Add Set</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveExercise(ex.id)}
                                className="text-zinc-500 hover:text-red-600 p-0.5 transition-colors cursor-pointer bg-transparent border-0 active:opacity-75"
                                title="Delete Exercise"
                                aria-label="Delete Exercise"
                              >
                                <Trash2 className="w-4 h-4" />
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
              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 space-y-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-black stroke-[2]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-black">
                    Suggested Next Movements
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {smartSuggestions.map((sug) => (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => handleAddExercise(sug)}
                      className="p-2.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-black text-left transition-all group cursor-pointer flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-black truncate">
                          {sug.name}
                        </div>
                        <div className="text-[10px] text-zinc-700 font-semibold truncate">
                          {sug.muscleGroup} • {sug.type}
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-md bg-white border border-zinc-300 flex items-center justify-center text-black shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
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
          <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 space-y-3 animate-in fade-in shadow-sm">
            {/* Header & Movement Type Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                  Exercise Directory
                </h3>
                <p className="text-[10px] text-zinc-700 font-semibold">
                  {availableExercises.length} Movements matching filters
                </p>
              </div>

              {/* Movement Type Filter Chips */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-zinc-200">
                {(['ALL', 'Compound', 'Isolation', 'Functional'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMovementTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      movementTypeFilter === t
                        ? 'bg-black text-white font-bold shadow-xs'
                        : 'text-black hover:bg-zinc-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-black stroke-[2] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by exercise name, muscle or equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-zinc-300 rounded-lg pl-9 pr-8 py-2 text-xs text-black font-bold placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-black hover:text-red-600 text-xs cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2]" />
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-white text-black hover:bg-zinc-50 border-zinc-200 hover:border-black'
                    }`}
                  >
                    {split.label}
                  </button>
                );
              })}
            </div>

            {/* Exercise Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto hide-scrollbar pr-0.5">
              {availableExercises.map((curated) => {
                const isAdded = stagedExercises.some(
                  (e) => e.name.toLowerCase() === curated.name.toLowerCase()
                );

                return (
                  <div
                    key={curated.id}
                    onClick={() => handleAddExercise(curated)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                      isAdded
                        ? 'bg-zinc-50 border-black text-black shadow-xs'
                        : 'bg-white hover:bg-zinc-50 border-zinc-200 hover:border-black text-black shadow-xs'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-xs font-bold text-black truncate">{curated.name}</div>
                      <div className="text-[10px] text-zinc-700 truncate flex items-center gap-1.5 font-medium">
                        <span className="text-black font-bold">{curated.muscleGroup}</span>
                        <span>•</span>
                        <span>{curated.subMuscle}</span>
                        <span>•</span>
                        <span className="text-zinc-600">{curated.type}</span>
                      </div>
                      {curated.coachingCue && (
                        <p className="text-[10px] text-zinc-600 line-clamp-1 font-normal">
                          {curated.coachingCue}
                        </p>
                      )}
                    </div>

                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 transition-transform active:scale-90 ${
                        isAdded
                          ? 'bg-black text-white font-bold shadow-xs'
                          : 'bg-white border border-zinc-300 text-black hover:bg-black hover:text-white'
                      }`}
                    >
                      {isAdded ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
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
          <div className="space-y-4 animate-in fade-in">
            {/* ═══ O1FC INTELLIGENT BLUEPRINT SYNTHESIZER ═══ */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-3">
              {/* Header (Compact Single-Row Header) */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-200">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                    <Zap className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs sm:text-sm font-bold text-black tracking-tight truncate">
                        Blueprint Synthesizer
                      </h3>
                      <span className="px-1.5 py-0.2 rounded bg-red-100 border border-red-200 text-red-600 font-bold uppercase text-[8px] tracking-wider shrink-0">
                        Live
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-700 font-medium truncate">
                      Sports-science vector synthesis
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSynthSeed((s) => s + 1)}
                  className="h-7 px-2.5 rounded-lg bg-white border border-zinc-300 hover:border-black text-black hover:bg-zinc-50 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 active:scale-95 shadow-2xs"
                  title="Shuffle movement variation within current vector"
                >
                  <RefreshCw className="w-3 h-3 stroke-[2.5]" />
                  <span>Shuffle</span>
                </button>
              </div>

              {/* Vector Selection (Athletic Intent) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-red-600 stroke-[2.5]" />
                  <span>1. Target Athletic Vector</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'PUSH', label: 'Push Alpha' },
                      { id: 'PULL', label: 'Pull Beta' },
                      { id: 'LEGS', label: 'Legs Alpha' },
                      { id: 'UPPER', label: 'Upper Body' },
                      { id: 'LOWER', label: 'Lower Body' },
                      { id: 'SPEED', label: 'Speed & COD' },
                      { id: 'HYROX', label: 'Hyrox Metcon' },
                      { id: 'STRENGTH', label: 'Strength 5x5' },
                      { id: 'RECOVERY', label: 'Bio-Recovery' },
                    ] as const
                  ).map((v) => {
                    const isSelected = synthIntent === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSynthIntent(v.id)}
                        className={`h-7 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-red-600 text-white border-red-600 shadow-xs ring-1 ring-red-400'
                            : 'bg-white text-black border-zinc-300 hover:border-black hover:bg-zinc-50'
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Micro-Constraints Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
                {/* Duration */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-black flex items-center gap-1">
                    <Clock className="w-3 h-3 text-black stroke-[2]" />
                    <span>Duration</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-0.5 bg-white rounded-lg border border-zinc-300">
                    {(
                      [
                        { id: '30m', label: '30m (3)' },
                        { id: '45m', label: '45m (5)' },
                        { id: '60m', label: '60m (6)' },
                      ] as const
                    ).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSynthDuration(d.id)}
                        className={`h-6 text-[10px] font-bold rounded-md transition-all text-center cursor-pointer flex items-center justify-center ${
                          synthDuration === d.id
                            ? 'bg-black text-white shadow-xs'
                            : 'text-black hover:bg-zinc-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Equipment */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-black flex items-center gap-1">
                    <Dumbbell className="w-3 h-3 text-black stroke-[2]" />
                    <span>Facility / Gear</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-0.5 bg-white rounded-lg border border-zinc-300">
                    {(
                      [
                        { id: 'FULL', label: 'Full Gym' },
                        { id: 'DUMBBELL', label: 'DB & Bench' },
                        { id: 'BODYWEIGHT', label: 'Bodyweight' },
                      ] as const
                    ).map((eq) => (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => setSynthEquipment(eq.id)}
                        className={`h-6 text-[10px] font-bold rounded-md transition-all text-center cursor-pointer flex items-center justify-center ${
                          synthEquipment === eq.id
                            ? 'bg-black text-white shadow-xs'
                            : 'text-black hover:bg-zinc-100'
                        }`}
                      >
                        {eq.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intensity */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-black flex items-center gap-1">
                    <Flame className="w-3 h-3 text-black stroke-[2]" />
                    <span>Intensity Ceiling</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-0.5 bg-white rounded-lg border border-zinc-300">
                    {(
                      [
                        { id: 'PROGRESSIVE', label: 'Progressive RPE 8' },
                        { id: 'FAILURE', label: 'Failure Dropset' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSynthRpe(m.id)}
                        className={`h-6 text-[10px] font-bold rounded-md transition-all text-center cursor-pointer flex items-center justify-center ${
                          synthRpe === m.id
                            ? 'bg-black text-white shadow-xs'
                            : 'text-black hover:bg-zinc-100'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Synthesized Routine Preview Card */}
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-zinc-200">
                  <div className="min-w-0">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-red-600">
                      Synthesized Workout Blueprint
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-black tracking-tight truncate">
                      {synthesizedBlueprint.title}
                    </h4>
                    <p className="text-[10px] text-zinc-700 font-semibold truncate">
                      {synthesizedBlueprint.focus}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-300 text-black font-bold text-[10px]">
                      ~{synthesizedBlueprint.estimatedMinutes}m
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-300 text-black font-bold text-[10px]">
                      {synthesizedBlueprint.exercises.length} Moves • {synthesizedBlueprint.exercises.reduce((a, b) => a + b.sets.length, 0)} Sets
                    </span>
                  </div>
                </div>

                {/* Movements List Preview */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto hide-scrollbar">
                  {synthesizedBlueprint.exercises.map((ex, idx) => (
                    <div
                      key={ex.id || idx}
                      className="p-2.5 rounded-lg bg-white border border-zinc-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded bg-black text-white font-mono font-bold text-[9px] flex items-center justify-center shrink-0">
                          0{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-black truncate text-[11px]">
                              {ex.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-zinc-100 text-black border border-zinc-200 uppercase">
                              {ex.primaryMuscle}
                            </span>
                          </div>
                          <p className="text-[9px] text-zinc-600 truncate font-normal">
                            {ex.notes}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-700 font-bold shrink-0">
                        <span className="font-bold text-black">
                          {ex.sets.length}×{ex.sets[0]?.reps || 10}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[9px] text-zinc-600">
                          {ex.tempo}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Action Controls */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setIsClientSheetOpen(true)}
                    className="h-8 px-2.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-300 hover:border-black text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Users className="w-3.5 h-3.5 text-red-600 stroke-[2.5]" />
                    <span>{selectedClientKeys.length} Athlete{selectedClientKeys.length !== 1 ? 's' : ''}</span>
                    <ChevronDown className="w-3 h-3 text-black stroke-[2]" />
                  </button>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={handleSaveSynthesizedBlueprint}
                      className="h-8 px-3 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-300 hover:border-black text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
                      title="Save this synthesized workout blueprint to your library"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-red-600 stroke-[2.5]" />
                      <span>Save Blueprint</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLoadSynthIntoStack}
                      className="h-8 px-3 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-300 hover:border-black text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <Layers className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Load Into Stack</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSynthDispatching}
                      onClick={handleInstantSynthDispatch}
                      className="h-8 px-3.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-red-600/30 active:scale-95 disabled:opacity-50"
                    >
                      {isSynthDispatching ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin stroke-[2.5]" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3 stroke-[2.5]" />
                          <span>Instant Dispatch</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ MY SAVED BLUEPRINTS VAULT ═══ */}
            <div className="pt-2 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-0.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                      My Saved Blueprints
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-black text-white font-mono text-[10px] font-bold">
                      {savedBlueprints.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-700 font-semibold mt-0.5">
                    Your personal playbook of saved workouts for recurring client programming and rapid dispatch
                  </p>
                </div>

                {stagedExercises.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveActiveStackAsBlueprint}
                    className="h-7 px-2.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-300 hover:border-black text-black text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto shadow-2xs"
                    title="Save current active stack as a custom blueprint"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-red-600 stroke-[2.5]" />
                    <span>Save Active Stack ({stagedExercises.length})</span>
                  </button>
                )}
              </div>

              {savedBlueprints.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white border border-dashed border-zinc-300 space-y-2.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-black">
                    <Bookmark className="w-5 h-5 stroke-[2] text-zinc-500" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-black">
                    No Saved Blueprints Yet
                  </h4>
                  <p className="text-[11px] text-zinc-600 max-w-sm mx-auto leading-relaxed">
                    Generate an athletic split above or build your Stack, then tap{' '}
                    <span className="font-bold text-black">"Save Blueprint"</span> to save it here for frequent reuse.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {savedBlueprints.map((bp) => {
                    const isExpanded = expandedSavedBpId === bp.id;
                    const isEditing = editingBpId === bp.id;
                    const totalSets = bp.exercises.reduce((a, b) => a + (b.sets?.length || 0), 0);

                    return (
                      <div
                        key={bp.id}
                        className="p-3.5 rounded-2xl bg-white border border-zinc-200 hover:border-black transition-all flex flex-col justify-between gap-3 shadow-xs"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-black text-white font-bold uppercase text-[9px] shadow-2xs">
                                {bp.split}
                              </span>
                              {bp.equipment && (
                                <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-black font-semibold text-[9px]">
                                  {bp.equipment}
                                </span>
                              )}
                              <span className="text-[10px] text-zinc-500 font-medium">
                                {new Date(bp.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isEditing) {
                                    handleUpdateBlueprintTitle(bp.id, editingTitle);
                                  } else {
                                    setEditingBpId(bp.id);
                                    setEditingTitle(bp.title);
                                  }
                                }}
                                className="p-1 rounded-md text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
                                title={isEditing ? 'Save title' : 'Rename blueprint'}
                              >
                                {isEditing ? <Check className="w-3.5 h-3.5 text-red-600 stroke-[2.5]" /> : <Pencil className="w-3.5 h-3.5 stroke-[2]" />}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleDeleteSavedBlueprint(bp.id, bp.title, e)}
                                className="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete blueprint"
                              >
                                <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                              </button>
                            </div>
                          </div>

                          <div>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateBlueprintTitle(bp.id, editingTitle);
                                  if (e.key === 'Escape') setEditingBpId(null);
                                }}
                                autoFocus
                                className="w-full text-xs font-bold text-black border border-black rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
                              />
                            ) : (
                              <h4 className="text-xs sm:text-sm font-bold text-black leading-snug">
                                {bp.title}
                              </h4>
                            )}
                            <p className="text-[11px] text-zinc-700 font-medium line-clamp-1 mt-0.5">
                              {bp.focus}
                            </p>
                          </div>

                          {/* Quick Stats Pill */}
                          <div className="flex items-center gap-2 text-[10px] text-zinc-700 font-semibold">
                            <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-black font-bold">
                              ~{bp.estimatedMinutes}m
                            </span>
                            <span>•</span>
                            <span>{bp.exercises.length} Movements</span>
                            <span>•</span>
                            <span>{totalSets} Sets</span>
                          </div>

                          {/* Expandable Exercise Preview */}
                          <div>
                            <button
                              type="button"
                              onClick={() => setExpandedSavedBpId(isExpanded ? null : bp.id)}
                              className="text-[10px] font-bold text-black hover:text-red-600 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>{isExpanded ? 'Hide movements' : `Preview ${bp.exercises.length} movements`}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3 stroke-[2.5]" /> : <ChevronDown className="w-3 h-3 stroke-[2.5]" />}
                            </button>

                            {isExpanded && (
                              <div className="mt-2 space-y-1 max-h-36 overflow-y-auto hide-scrollbar border-t border-zinc-100 pt-2">
                                {bp.exercises.map((ex, idx) => (
                                  <div
                                    key={ex.id || idx}
                                    className="p-1.5 rounded-md bg-zinc-50 border border-zinc-200 flex items-center justify-between text-[11px]"
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="font-mono text-[9px] font-bold text-zinc-500">
                                        {idx + 1}.
                                      </span>
                                      <span className="font-bold text-black truncate">
                                        {ex.name}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-zinc-600 font-semibold shrink-0">
                                      {ex.sets?.length || 4}×{ex.sets?.[0]?.reps || 10}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons: Load into stack or Quick Dispatch */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100">
                          <button
                            type="button"
                            onClick={() => handleLoadSavedBlueprint(bp)}
                            className="h-8 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            <Layers className="w-3.5 h-3.5 stroke-[2]" />
                            <span>Load Into Stack</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleInstantDispatchSavedBlueprint(bp)}
                            disabled={isSynthDispatching}
                            className="h-8 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shadow-red-600/20 active:scale-95 disabled:opacity-50"
                          >
                            <Send className="w-3 h-3 stroke-[2.5]" />
                            <span>Quick Dispatch</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          OBSIDIAN BOTTOM DISPATCH DOCK (Rendered ONLY on active workout stack)
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'stack' && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 p-3 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.875rem))] shadow-lg">
          <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="min-w-0 w-full sm:w-auto text-left">
              <div className="text-xs font-bold text-black truncate flex items-center gap-2">
                <span>{routineTitle || 'Workout Prescription'}</span>
                <span className="text-zinc-600 font-semibold">({scheduledDay})</span>
              </div>
              <div className="text-[11px] text-zinc-700 font-medium truncate mt-0.5">
                {stagedExercises.length} Movements • {telemetry.totalSets} Sets • Target:{' '}
                <span className="font-bold text-black">{selectedClientKeys.length} Athlete{selectedClientKeys.length > 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsClientSheetOpen(true)}
                className="h-9 px-3.5 bg-white hover:bg-zinc-50 border border-zinc-300 hover:border-black rounded-xl text-xs font-bold text-black cursor-pointer transition-colors shadow-2xs"
              >
                Select Athletes ({selectedClientKeys.length})
              </button>

              <button
                type="button"
                onClick={handleDispatch}
                disabled={isDispatching || selectedClientKeys.length === 0 || stagedExercises.length === 0}
                className="h-9 px-6 bg-red-600 hover:bg-red-500 text-white disabled:opacity-30 rounded-xl text-xs font-bold tracking-tight transition-transform active:scale-95 cursor-pointer shadow-md shadow-red-600/30 shrink-0 flex items-center gap-2 justify-center"
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
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          ATHLETE TARGET SELECTOR SHEET
          ═══════════════════════════════════════════════════════════════════════ */}
      {isClientSheetOpen && (
        <div
          className="fixed inset-0 z-[99995] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150 overscroll-contain"
          onClick={() => setIsClientSheetOpen(false)}
        >
          <div
            className="bg-white border-t sm:border border-zinc-200 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-4 space-y-3 shadow-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col mb-0 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] sm:pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-black uppercase tracking-wider truncate">
                  Target Athletes ({selectedClientKeys.length})
                </h3>
                <p className="text-[10px] text-zinc-600 font-medium truncate">Select athletes who will receive this workout</p>
              </div>
              <button
                type="button"
                onClick={() => setIsClientSheetOpen(false)}
                className="p-1 -mr-1 text-black hover:text-red-600 flex items-center justify-center cursor-pointer shrink-0 transition-all bg-transparent border-0 active:scale-90"
                title="Close"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Athlete Search */}
            <input
              type="text"
              placeholder="Search athlete by name or handle..."
              value={clientSearchQuery}
              onChange={(e) => setClientSearchQuery(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-black font-bold placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
            />

            {/* Quick Actions */}
            <div className="flex items-center justify-between text-xs px-0.5">
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedClientKeys(Object.keys(clients))}
                  className="text-black hover:underline font-bold cursor-pointer text-xs"
                >
                  Select All ({Object.keys(clients).length})
                </button>
                <span className="text-zinc-300">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedClientKeys([])}
                  className="text-zinc-600 hover:text-black cursor-pointer text-xs font-semibold"
                >
                  Clear All
                </button>
              </div>
              <span className="text-[10px] font-mono font-bold text-black">
                {selectedClientKeys.length} / {Object.keys(clients).length} Selected
              </span>
            </div>

            {/* Unified Client List Container */}
            <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-200 overflow-y-auto max-h-[50vh] sm:max-h-60 hide-scrollbar">
              {Object.keys(clients).length === 0 ? (
                <div className="p-6 text-center text-zinc-600 space-y-1">
                  <div className="text-xs font-bold text-black">No Live Athletes Yet</div>
                  <p className="text-[11px] leading-relaxed">
                    Athletes who join via your Coach Link will appear here automatically.
                  </p>
                </div>
              ) : Object.entries(clients).filter(([k, athlete]) =>
                  (athlete?.name || k).toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                  (athlete?.handle || '').toLowerCase().includes(clientSearchQuery.toLowerCase())
                ).length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-600">
                  No athletes match "{clientSearchQuery}"
                </div>
              ) : (
                Object.entries(clients)
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
                        className={`px-3 py-2.5 cursor-pointer flex items-center justify-between transition-colors text-xs ${
                          isSelected
                            ? 'bg-zinc-100 text-black font-bold'
                            : 'hover:bg-zinc-50 text-black'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-black truncate">{athlete?.name || k}</div>
                          <div className="text-[10px] text-zinc-600 truncate leading-tight mt-0.5">
                            {athlete?.handle || `@${k}`} {athlete?.badge ? `• ${athlete.badge}` : ''}
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center text-xs shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-black text-white font-bold'
                              : 'border border-zinc-300'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsClientSheetOpen(false)}
              className="w-full py-2.5 bg-black text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs hover:bg-zinc-800 active:scale-98 transition-all"
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
