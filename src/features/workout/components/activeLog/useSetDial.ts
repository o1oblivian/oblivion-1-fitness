import { useState } from 'react';
import type { ExerciseItem } from '../../../../types';
import { tactileEngine } from '../../../../services/tactileEngine';
import { readAthleteSettingsSnapshot } from '../../../../utils/athleteSettingsSnapshot';
import { displayToKg, kgToDisplay, loadUnitLabel } from '../../../../utils/weightUnits';

export type DialField = 'weight' | 'reps' | 'rpe';

interface DialConfig {
  isOpen: boolean;
  exerciseId: string;
  setNumber: number;
  setId?: string;
  setIndex?: number;
  type: DialField;
  initialValue: number;
}

type SetExercises = (update: (prev: ExerciseItem[]) => ExerciseItem[]) => void;

interface DialTarget {
  exerciseId: string;
  setNumber: number;
  setId?: string;
  setIndex?: number;
}

/**
 * Writes one value into the set the dial was opened for. The set is found by id, number or
 * position, whichever the caller supplied. Weight is stored in kilograms.
 */
export function applyDialValue(
  exercises: ExerciseItem[],
  target: DialTarget,
  field: DialField,
  value: number,
): ExerciseItem[] {
  return exercises.map((ex) => {
    if (ex.id !== target.exerciseId) return ex;
    const sets = ex.sets.map((s, idx) => {
      const isTarget =
        (target.setId && s.id === target.setId) ||
        Number(s.setNumber) === Number(target.setNumber) ||
        (target.setIndex !== undefined && idx === target.setIndex);
      if (!isTarget) return s;
      if (field === 'weight') return { ...s, weight: value, weightKg: value };
      return { ...s, [field]: value };
    });
    return { ...ex, sets };
  });
}

const CLOSED: DialConfig = {
  isOpen: false,
  exerciseId: '',
  setNumber: 1,
  type: 'weight',
  initialValue: 0,
};

/** State for the rotary dial that edits a set's weight, reps or effort. */
export function useSetDial(
  setExercises: SetExercises,
  completeEarlierSets: (exerciseId: string, setNumber: number) => void,
) {
  const [config, setConfig] = useState<DialConfig>(CLOSED);

  const open = (
    exerciseId: string,
    setNumber: number,
    type: DialField,
    currentVal: number,
    setId?: string,
    setIndex?: number,
  ) => {
    tactileEngine.triggerSelectionBuzz();
    completeEarlierSets(exerciseId, setNumber);
    setConfig({
      isOpen: true,
      exerciseId,
      setNumber,
      setId,
      setIndex,
      type,
      initialValue:
        type === 'weight'
          ? kgToDisplay(currentVal ?? 0, readAthleteSettingsSnapshot().weightUnit)
          : (currentVal ?? (type === 'reps' ? 10 : 8)),
    });
  };

  const close = () => setConfig((prev) => ({ ...prev, isOpen: false }));

  const confirm = (val: number) => {
    if (!config.exerciseId) return;
    tactileEngine.triggerSelectionBuzz();
    const weightUnit = readAthleteSettingsSnapshot().weightUnit;
    const value = config.type === 'weight' ? displayToKg(Number(val), weightUnit) : Number(val);
    setExercises((prev) => applyDialValue(prev, config, config.type, value));
  };

  const unitLabel =
    config.type === 'weight'
      ? loadUnitLabel(readAthleteSettingsSnapshot().weightUnit)
      : config.type === 'reps'
        ? 'Reps'
        : 'rpe';

  return {
    isOpen: config.isOpen,
    initialValue: config.initialValue,
    unitLabel,
    open,
    close,
    confirm,
  };
}
