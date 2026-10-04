import { EXERCISE_REPOSITORY } from '../../../../data/exerciseRepository';
import { ExerciseDefinition } from '../../../../types/exercise';
import { ProgramExerciseItem } from './types';

export const ALL_DISCIPLINES = [
  'Push',
  'Pull',
  'Legs',
  'Upper Body',
  'Lower Body',
  'Chest & Triceps',
  'Back & Biceps',
  'Mobility',
  'HYROX',
  'Conditioning',
  'Strength',
  'Powerlifting',
  'Calisthenics',
  'Full Body',
] as const;

export type DisciplineFocus = typeof ALL_DISCIPLINES[number] | string;

/**
 * Real database query engine that filters the standardized O1FC Exercise Repository
 * based on the coach's selected discipline or movement focus.
 */
export function getExercisesForDiscipline(focus: string): ExerciseDefinition[] {
  const norm = (focus || '').toLowerCase().trim();

  const filtered = EXERCISE_REPOSITORY.filter((ex) => {
    const p = (ex.primaryMuscleGroup || '').toLowerCase();
    const sec = (ex.secondaryMuscles || []).map((m) => m.toLowerCase()).join(' ');
    const m = (ex.movementPattern || '').toLowerCase();
    const c = (ex.category || '').toLowerCase();
    const name = ex.name.toLowerCase();
    const disc = (ex.discipline || '').toLowerCase();
    const tier = (ex.tier || '').toLowerCase();

    // Pull / Back focus
    if (norm.includes('pull') || norm.includes('back')) {
      return (
        m === 'pull' ||
        m === 'hinge' ||
        p.includes('back') ||
        p.includes('lat') ||
        p.includes('posterior') ||
        c === 'back' ||
        sec.includes('back') ||
        sec.includes('biceps') ||
        name.includes('row') ||
        name.includes('pull') ||
        name.includes('deadlift')
      );
    }

    // Push / Chest focus
    if (norm.includes('push') || norm.includes('chest')) {
      return (
        m === 'push' ||
        p.includes('chest') ||
        p.includes('shoulder') ||
        c === 'chest' ||
        c === 'shoulders' ||
        sec.includes('triceps') ||
        sec.includes('chest') ||
        name.includes('press') ||
        name.includes('bench') ||
        name.includes('dip')
      );
    }

    // Legs / Lower body focus
    if (norm.includes('leg') || norm.includes('lower') || norm.includes('quad') || norm.includes('glute')) {
      return (
        m === 'squat' ||
        m === 'hinge' ||
        p.includes('quad') ||
        p.includes('hamstring') ||
        p.includes('glute') ||
        p.includes('lower') ||
        c === 'legs' ||
        name.includes('squat') ||
        name.includes('lunge') ||
        name.includes('rdl')
      );
    }

    // Mobility & Recovery focus
    if (norm.includes('mobility') || norm.includes('recovery') || norm.includes('stretch') || norm.includes('flow')) {
      return (
        disc === 'recovery' ||
        m === 'mobility' ||
        c.includes('mobility') ||
        c.includes('decompression') ||
        c.includes('breathwork') ||
        name.includes('flow') ||
        name.includes('stretch') ||
        name.includes('hang') ||
        name.includes('breathing')
      );
    }

    // HYROX / Conditioning / Hybrid sports
    if (norm.includes('hyrox') || norm.includes('conditioning') || norm.includes('endurance') || norm.includes('sport')) {
      return (
        disc === 'sports' ||
        c.includes('hyrox') ||
        c.includes('conditioning') ||
        m === 'locomotion' ||
        m === 'carry' ||
        name.includes('skierg') ||
        name.includes('row') ||
        name.includes('sled') ||
        name.includes('bike') ||
        name.includes('swing') ||
        name.includes('farmer')
      );
    }

    // Upper body focus
    if (norm.includes('upper')) {
      return (
        m === 'push' ||
        m === 'pull' ||
        p.includes('chest') ||
        p.includes('back') ||
        p.includes('shoulder') ||
        p.includes('arms') ||
        c === 'chest' ||
        c === 'back' ||
        c === 'shoulders' ||
        c === 'arms'
      );
    }

    // Chest & Triceps
    if (norm.includes('chest & triceps') || (norm.includes('chest') && norm.includes('tricep'))) {
      return (
        p.includes('chest') ||
        p.includes('arms') ||
        sec.includes('triceps') ||
        c === 'chest' ||
        name.includes('bench') ||
        name.includes('pushdown') ||
        name.includes('dip')
      );
    }

    // Back & Biceps
    if (norm.includes('back & biceps') || (norm.includes('back') && norm.includes('bicep'))) {
      return (
        p.includes('back') ||
        p.includes('arms') ||
        sec.includes('biceps') ||
        c === 'back' ||
        name.includes('row') ||
        name.includes('pull') ||
        name.includes('curl')
      );
    }

    // Strength & Powerlifting
    if (norm.includes('strength') || norm.includes('power')) {
      return (
        tier.includes('compound prime') ||
        ex.mechanic === 'compound' ||
        name.includes('barbell') ||
        name.includes('squat') ||
        name.includes('bench') ||
        name.includes('deadlift') ||
        name.includes('press')
      );
    }

    // Calisthenics & Bodyweight
    if (norm.includes('calisthenic') || norm.includes('bodyweight')) {
      return (
        ex.equipment === 'bodyweight' ||
        name.includes('pull-up') ||
        name.includes('dip') ||
        name.includes('push-up') ||
        name.includes('hang')
      );
    }

    // Full body
    if (norm.includes('full') || norm.includes('body')) {
      return ex.mechanic === 'compound' || disc === 'sports' || p.includes('full');
    }

    // Fallback: match by muscle or category name
    return (
      p.includes(norm) ||
      c.includes(norm) ||
      m.includes(norm) ||
      name.includes(norm) ||
      sec.includes(norm)
    );
  });

  return filtered.length >= 2 ? filtered : EXERCISE_REPOSITORY;
}

/**
 * Real-time Auto-Programmer:
 * Generates calibrated workout exercises from live O1FC repository database design.
 */
export function generateO1FCBlueprint(focus: string, count = 5): ProgramExerciseItem[] {
  const norm = (focus || '').toLowerCase();
  const pool = getExercisesForDiscipline(focus);

  // Separate compounds/prime lifts from accessories/flows for balanced programming
  const compounds = pool.filter(
    (e) => e.tier === 'Compound Prime' || e.mechanic === 'compound' || e.discipline === 'sports'
  );
  const accessories = pool.filter(
    (e) => e.tier !== 'Compound Prime' && e.mechanic !== 'compound'
  );

  const selectedList: ExerciseDefinition[] = [];

  // Pick primary compound lifts first if available
  if (compounds.length > 0) {
    selectedList.push(compounds[0]);
    if (compounds.length > 1 && count >= 3) {
      selectedList.push(compounds[1]);
    }
  }

  // Fill remainder from accessories or remaining pool
  for (const ex of accessories.concat(pool)) {
    if (selectedList.length >= count) break;
    if (!selectedList.some((s) => s.id === ex.id)) {
      selectedList.push(ex);
    }
  }

  // If still need more, take from beginning of pool
  for (const ex of pool) {
    if (selectedList.length >= count) break;
    if (!selectedList.some((s) => s.id === ex.id)) {
      selectedList.push(ex);
    }
  }

  const isMobility = norm.includes('mobility') || norm.includes('recovery');
  const isStrength = norm.includes('strength') || norm.includes('power');
  const isHyrox = norm.includes('hyrox') || norm.includes('conditioning');

  return selectedList.map((ex, idx) => {
    let repsString = '8-12';
    let sets = ex.defaultSets || 3;
    let restSeconds = ex.defaultRestSeconds || 90;

    if (isMobility) {
      sets = 3;
      restSeconds = 30;
      repsString = ex.defaultReps ? (ex.defaultReps > 20 ? `${ex.defaultReps}s hold` : `${ex.defaultReps} reps`) : '45s hold';
    } else if (isStrength) {
      sets = ex.mechanic === 'compound' ? 4 : 3;
      restSeconds = ex.mechanic === 'compound' ? 150 : 90;
      repsString = ex.mechanic === 'compound' ? '4-6' : '8-10';
    } else if (isHyrox) {
      sets = 4;
      restSeconds = ex.defaultRestSeconds || 90;
      repsString = ex.defaultReps === 1 ? '500m / Max Effort' : `${ex.defaultReps || 15} reps`;
    } else {
      // Standard Hypertrophy
      if (ex.mechanic === 'compound') {
        repsString = '6-10';
        sets = 4;
        restSeconds = 120;
      } else {
        repsString = '10-15';
        sets = 3;
        restSeconds = 60;
      }
    }

    const cue = ex.subLabel
      ? `${ex.subLabel} — execute with strict ${ex.mechanic || 'calibrated'} tempo & full active tension.`
      : `Maintain disciplined biomechanical control and explosive concentric intent.`;

    return {
      id: `bp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: ex.name,
      sets,
      reps: repsString,
      restSeconds,
      cue,
    };
  });
}

/**
 * Returns dynamic quick-add exercise suggestions pulled straight from real repository data.
 */
export function getQuickAddExercises(focus: string): string[] {
  const matches = getExercisesForDiscipline(focus);
  return matches.slice(0, 5).map((e) => e.name);
}

/**
 * Returns a recommended split layout for a week based on the selected program discipline.
 */
export function getDisciplineSplitSchedule(focus: string, numDays: number): { dayName: string; splitFocus: string }[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const norm = (focus || '').toLowerCase();

  let splitCycle = ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Conditioning', 'Mobility'];

  if (norm.includes('push') || norm.includes('pull') || norm.includes('leg')) {
    splitCycle = ['Push (Chest & Triceps)', 'Pull (Back & Biceps)', 'Legs (Quads & Glutes)', 'Active Recovery', 'Push (Shoulders & Chest)', 'Pull (Lats & Traps)', 'Legs (Posterior Chain)'];
  } else if (norm.includes('mobility') || norm.includes('recovery')) {
    splitCycle = ['Hip & Pelvic Flow', 'Thoracic Spine Flow', 'Dead Hang Decompression', 'Breathwork Reset', 'Deep Hip Anterior Stretch', 'Active Mobility Flow', 'Rest & Integration'];
  } else if (norm.includes('hyrox') || norm.includes('conditioning')) {
    splitCycle = ['SkiErg & Sled Push', 'Threshold Rower & Swings', 'Heavy Loaded Carries', 'Active Recovery & Mobility', 'Sandbag Triple Extension', '5-10-5 Shuttle Sprints', 'Engine Recovery'];
  } else if (norm.includes('upper') || norm.includes('lower')) {
    splitCycle = ['Upper Heavy Strength', 'Lower Knee Dominant', 'Spine & Hip Mobility', 'Upper Hypertrophy Volume', 'Lower Posterior Chain', 'Hybrid Engine Conditioning', 'Rest'];
  } else if (norm.includes('strength') || norm.includes('power')) {
    splitCycle = ['Squat Primary & Accessories', 'Bench Press Strength', 'Rest & Mobility', 'Deadlift & Posterior Chain', 'Overhead Press & Shoulders', 'Accessory Hypertrophy', 'Recovery'];
  }

  return Array.from({ length: Math.min(numDays, 7) }, (_, idx) => ({
    dayName: days[idx],
    splitFocus: splitCycle[idx % splitCycle.length],
  }));
}
