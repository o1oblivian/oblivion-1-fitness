import type { BlueprintExercise, WorkoutBlueprint } from '../../../data/workoutBlueprints';
import type { ExerciseItem, ExerciseSet } from '../../../types';

export type BlueprintTier = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export const TIER_LABEL: Record<BlueprintTier, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

export const TIER_SUMMARY: Record<BlueprintTier, string> = {
  BEGINNER: '2 Sets • RPE 7.0 • Extra Rest',
  INTERMEDIATE: '3 Sets • RPE 8.0 • Standard',
  ADVANCED: '4–5 Sets • RPE 9.0 • Peak Intensity',
};

export const TIER_DOT: Record<BlueprintTier, string> = {
  BEGINNER: 'bg-emerald-500',
  INTERMEDIATE: 'bg-amber-400',
  ADVANCED: 'bg-o1-crimson',
};

/** Beginners get the first five movements so a long blueprint doesn't bury them in volume. */
const BEGINNER_MOVEMENT_CAP = 5;

export const BLUEPRINT_TAGS = [
  'HYPERTROPHY',
  'STRENGTH',
  'HYBRID',
  'MOBILITY',
  'PLYOMETRICS',
  'Glute Lab',
  'CALISTHENICS',
  'OLYMPIC',
  'CORE',
] as const;

const TAG_TERMS: Record<string, { badge: string[]; focus: string[]; title: string[]; muscles?: string[] }> = {
  STRENGTH: { badge: ['STRENGTH', 'SBD'], focus: ['STRENGTH', 'PULL'], title: ['STRENGTH', 'PRESS', 'POWERLIFTING'] },
  PLYOMETRICS: { badge: ['PLYO', 'VELOCITY'], focus: ['PLYO', 'VELOCITY'], title: ['JUMP', 'VELOCITY'] },
  MOBILITY: {
    badge: ['MOBILITY', 'LONGEVITY'],
    focus: ['MOBILITY', 'LONGEVITY', 'REMODELING'],
    title: ['MOBILITY', 'KNEES'],
  },
  HYBRID: { badge: ['HYBRID', 'HYROX'], focus: ['HYBRID', 'THRESHOLD'], title: ['HYBRID', 'HYROX', 'CHIPPER'] },
  'GLUTE LAB': { badge: ['GLUTE'], focus: ['GLUTE'], title: ['BOOTY', 'GLUTE'] },
  CALISTHENICS: { badge: ['CALISTHENICS'], focus: ['CALISTHENICS'], title: ['CALISTHENICS', 'RING', 'WEIGHTED PUSH'] },
  OLYMPIC: { badge: ['OLYMPIC'], focus: ['OLYMPIC'], title: ['OLYMPIC', 'SNATCH', 'CLEAN'] },
  CORE: { badge: ['CORE'], focus: ['CORE'], title: ['CORE', 'ABS'], muscles: ['CORE', 'ABS', 'OBLIQUE'] },
};

export function blueprintMatchesTag(bp: WorkoutBlueprint, tag: string): boolean {
  const key = tag.toUpperCase();
  const badge = bp.badge.toUpperCase();
  const focus = bp.focus.toUpperCase();
  const title = bp.title.toUpperCase();
  const terms = TAG_TERMS[key];
  if (!terms) return badge.includes(key) || focus.includes(key) || title.includes(key);
  const muscles = (bp.targetMuscles || []).join(' ').toUpperCase();
  return (
    terms.badge.some((t) => badge.includes(t)) ||
    terms.focus.some((t) => focus.includes(t)) ||
    terms.title.some((t) => title.includes(t)) ||
    (terms.muscles ?? []).some((t) => muscles.includes(t))
  );
}

export function tierMovements(bp: WorkoutBlueprint, tier: BlueprintTier): BlueprintExercise[] {
  return tier === 'BEGINNER' ? bp.exercises.slice(0, BEGINNER_MOVEMENT_CAP) : bp.exercises;
}

export interface TierSpecs {
  sets: number;
  reps: string;
  weightKg: number;
  restSecs: number;
  rpe: number;
}

export function tierSpecs(be: BlueprintExercise, tier: BlueprintTier): TierSpecs {
  const baseWeight = be.defaultWeightKg || 0;
  const baseSets = be.sets || 3;
  const parsedRest = parseInt(be.rest.replace(/\D/g, ''), 10) || 90;

  if (tier === 'BEGINNER') {
    return {
      sets: 2,
      reps: '10–12 Controlled',
      weightKg: baseWeight > 0 ? Math.max(4, Math.round((baseWeight * 0.6) / 2) * 2) : 0,
      restSecs: parsedRest + 25,
      rpe: 7,
    };
  }
  if (tier === 'ADVANCED') {
    return {
      sets: Math.min(5, baseSets + 1),
      reps: `${be.reps} (Peak Intent)`,
      weightKg: baseWeight > 0 ? Math.round((baseWeight * 1.15) / 2.5) * 2.5 : 0,
      restSecs: Math.max(45, parsedRest - 15),
      rpe: 9,
    };
  }
  return { sets: baseSets, reps: be.reps, weightKg: baseWeight, restSecs: parsedRest, rpe: 8 };
}

/** Target reps for a rep string: the top of a range ("8-10" → 10), else the first number, else 10. */
export function targetReps(reps: string): number {
  const first = reps.match(/\d+/);
  if (!first) return 10;
  const top = parseInt(reps.split('-')[1] ?? '', 10);
  return Number.isNaN(top) ? parseInt(first[0], 10) : top;
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function blueprintExerciseToItem(be: BlueprintExercise, blueprintId: string, tier: BlueprintTier): ExerciseItem {
  const specs = tierSpecs(be, tier);
  const reps = targetReps(specs.reps);
  const sets: ExerciseSet[] = Array.from({ length: specs.sets }, (_, i) => ({
    id: `set-${uid()}-${i + 1}`,
    setNumber: i + 1,
    weightKg: specs.weightKg,
    reps,
    rpe: specs.rpe,
    completed: false,
  }));
  return {
    id: `bp-${blueprintId}-${be.id}-${uid()}`,
    name: be.name,
    targetMuscle: be.targetMuscle,
    sets,
    notes: `[${tier}] ${be.category} • Tempo ${be.tempo} • ${be.cues}`,
    restSecs: specs.restSecs,
    equipment: specs.weightKg > 0 ? 'Barbell / Cable / DB' : 'Bodyweight',
    tier: TIER_LABEL[tier],
  };
}
