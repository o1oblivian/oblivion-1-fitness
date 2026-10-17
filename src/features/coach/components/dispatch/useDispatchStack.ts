import { useMemo, useState } from 'react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { UNIFIED_DISPATCH_CATALOG } from '../../data/unifiedDispatchCatalog';
import type { DispatchCatalogExercise } from '../../data/dispatchExerciseCatalog';
import type { SynthesizedBlueprint } from '../../data/dispatchBlueprintSynthesizer';
import type { StackExercise, StackExerciseSet } from './dispatchTypes';

const DEFAULT_CUE = 'Maintain strict biomechanical stability and controlled eccentric tempo.';

function muscleGroup(ex: StackExercise): string {
  const muscle = ex.muscle.toLowerCase();
  if (muscle.includes('chest') || ex.category.includes('Push')) return 'Chest';
  if (muscle.includes('shoulder') || ex.category.includes('Shoulders')) return 'Shoulders';
  if (muscle.includes('back') || ex.category.includes('Pull')) return 'Back';
  if (muscle.includes('leg') || ex.category.includes('Legs')) return 'Legs';
  if (muscle.includes('arm') || ex.category.includes('Arms')) return 'Arms';
  return 'Other';
}

/** The workout being built: exercises, their sets and cues, and the live totals. */
export function useDispatchStack() {
  const [stack, setStack] = useState<StackExercise[]>([]);

  const updateExercise = (id: string, change: (ex: StackExercise) => StackExercise) =>
    setStack((prev) => prev.map((ex) => (ex.id === id ? change(ex) : ex)));

  const telemetry = useMemo(() => {
    let sets = 0;
    let tonnageKg = 0;
    const counts: Record<string, number> = {};
    stack.forEach((ex) => {
      sets += ex.sets.length;
      ex.sets.forEach((s) => {
        tonnageKg += s.weightKg * s.reps;
      });
      const group = muscleGroup(ex);
      counts[group] = (counts[group] || 0) + ex.sets.length;
    });
    const muscleDistribution = Object.entries(counts)
      .map(([muscle, count]) => ({
        muscle,
        percentage: sets > 0 ? Math.round((count / sets) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
    return {
      sets,
      estTime: sets > 0 ? Math.round(sets * 2.3) : 0,
      volumeTons: (tonnageKg / 1000).toFixed(1),
      muscleDistribution,
    };
  }, [stack]);

  const toggleExpand = (id: string) => {
    tactileEngine.triggerSelectionBuzz();
    updateExercise(id, (ex) => ({ ...ex, expanded: !ex.expanded }));
  };

  const removeExercise = (id: string) => {
    tactileEngine.triggerSelectionBuzz();
    setStack((prev) => prev.filter((ex) => ex.id !== id));
  };

  const addSet = (exerciseId: string) => {
    tactileEngine.triggerSelectionBuzz();
    updateExercise(exerciseId, (ex) => {
      const last = ex.sets[ex.sets.length - 1];
      const next: StackExerciseSet = {
        id: `set-${Date.now()}-${ex.sets.length}`,
        setNumber: ex.sets.length + 1,
        weightKg: last ? last.weightKg : 60,
        reps: last ? last.reps : 8,
        rpe: last ? last.rpe : 8.5,
        restSecs: 90,
      };
      return { ...ex, sets: [...ex.sets, next], expanded: true };
    });
  };

  const removeSet = (exerciseId: string, setId: string) => {
    tactileEngine.triggerSelectionBuzz();
    updateExercise(exerciseId, (ex) => ({
      ...ex,
      sets: ex.sets
        .filter((s) => s.id !== setId)
        .map((s, index) => ({ ...s, setNumber: index + 1 })),
    }));
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: keyof StackExerciseSet,
    value: number,
  ) =>
    updateExercise(exerciseId, (ex) => ({
      ...ex,
      sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
    }));

  const setCue = (exerciseId: string, cue: string) =>
    updateExercise(exerciseId, (ex) => ({ ...ex, cue }));

  const appendCue = (exerciseId: string, chip: string) => {
    tactileEngine.triggerSelectionBuzz();
    updateExercise(exerciseId, (ex) => {
      const current = ex.cue.trim();
      const separator = current.length > 0 ? (current.endsWith('.') ? ' ' : '. ') : '';
      return { ...ex, cue: `${current}${separator}${chip}.` };
    });
  };

  const resetCue = (exerciseId: string) => {
    tactileEngine.triggerSelectionBuzz();
    updateExercise(exerciseId, (ex) => ({
      ...ex,
      cue: UNIFIED_DISPATCH_CATALOG.find((c) => c.name === ex.name)?.cue || DEFAULT_CUE,
    }));
  };

  const addFromCatalog = (item: DispatchCatalogExercise) => {
    tactileEngine.triggerImpactPulse();
    const reps =
      typeof item.defaultReps === 'number'
        ? item.defaultReps
        : parseInt(String(item.defaultReps), 10) || 10;
    const stamp = Date.now();
    const exercise: StackExercise = {
      id: `stack-${stamp}`,
      catalogId: item.id,
      name: item.name,
      muscle: item.muscleTarget,
      category: item.category,
      cue: item.cue || 'Maintain biomechanical stability.',
      expanded: false,
      sets: Array.from({ length: item.defaultSets || 3 }, (_, i) => ({
        id: `s-${stamp}-${i}`,
        setNumber: i + 1,
        weightKg: item.defaultWeightKg || 20,
        reps,
        rpe: item.defaultRpe || 8.5,
        restSecs: 75,
      })),
    };
    setStack((prev) => [...prev, exercise]);
  };

  const loadBlueprint = (bp: SynthesizedBlueprint) => {
    tactileEngine.triggerImpactPulse();
    const stamp = Date.now();
    setStack(
      bp.exercises.map((ex, idx) => {
        const reps = parseInt(ex.reps.split('-')[0], 10) || 8;
        const rpe = parseFloat(ex.rpe.split('-')[0]) || 8.5;
        return {
          id: `stack-bp-${idx}-${stamp}`,
          name: ex.name,
          muscle: ex.muscle,
          category: bp.vector,
          cue: ex.cue,
          expanded: false,
          sets: Array.from({ length: ex.sets }, (_, i) => ({
            id: `set-${stamp}-${idx}-${i}`,
            setNumber: i + 1,
            weightKg: ex.targetWeightKg || 50,
            reps,
            rpe,
            restSecs: 75,
          })),
        };
      }),
    );
  };

  return {
    stack,
    telemetry,
    toggleExpand,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    setCue,
    appendCue,
    resetCue,
    addFromCatalog,
    loadBlueprint,
  };
}

export type DispatchStack = ReturnType<typeof useDispatchStack>;
