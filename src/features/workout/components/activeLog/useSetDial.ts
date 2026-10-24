import { useState } from 'react';
import type { ExerciseItem } from '../../../../types';
import { tactileEngine } from '../../../../services/tactileEngine';
import { readAthleteSettingsSnapshot } from '../../../../utils/athleteSettingsSnapshot';
import { displayToKg, kgToDisplay, loadUnitLabel } from '../../../../utils/weightUnits';
import type { WeightUnit } from '../../../../hooks/useAthleteSettings';

export type DialField = 'weight' | 'reps' | 'rpe';

/** A later field the dial should open after the current one is confirmed. Weight is kilograms. */
export interface DialFollowStep {
  field: DialField;
  value: number;
}

/** What the dial shows for a field. Empty reps start at 10, empty effort at 8. */
export function dialDisplayValue(field: DialField, value: number, weightUnit: WeightUnit): number {
  if (field === 'weight') return kgToDisplay(Number(value) || 0, weightUnit);
  const n = Number(value) || 0;
  if (n > 0) return n;
  return field === 'reps' ? 10 : 8;
}

/** The next dial in a reps → weight → effort sequence, or null when this confirm closes it. */
export function nextDialStep(follow: DialFollowStep[], weightUnit: WeightUnit) {
  const [next, ...rest] = follow;
  if (!next) return null;
  return {
    field: next.field,
    initialValue: dialDisplayValue(next.field, next.value, weightUnit),
    follow: rest,
  };
}

interface DialConfig {
  isOpen: boolean;
  exerciseId: string;
  setNumber: number;
  setId?: string;
  setIndex?: number;
  type: DialField;
  initialValue: number;
  follow: DialFollowStep[];
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
  follow: [],
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
    follow: DialFollowStep[] = [],
  ) => {
    tactileEngine.triggerSelectionBuzz();
    completeEarlierSets(exerciseId, setNumber);
    const weightUnit = readAthleteSettingsSnapshot().weightUnit;
    setConfig({
      isOpen: true,
      exerciseId,
      setNumber,
      setId,
      setIndex,
      type,
      initialValue: dialDisplayValue(type, currentVal ?? 0, weightUnit),
      follow,
    });
  };

  const close = () => setConfig((prev) => ({ ...prev, isOpen: false }));

  /** Writes the value. Returns true when the dial should stay open on the next field. */
  const confirm = (val: number): boolean => {
    if (!config.exerciseId) return false;
    tactileEngine.triggerSelectionBuzz();
    const weightUnit = readAthleteSettingsSnapshot().weightUnit;
    const value = config.type === 'weight' ? displayToKg(Number(val), weightUnit) : Number(val);
    setExercises((prev) => applyDialValue(prev, config, config.type, value));
    const next = nextDialStep(config.follow, weightUnit);
    if (!next) return false;
    setConfig((prev) => ({
      ...prev,
      type: next.field,
      initialValue: next.initialValue,
      follow: next.follow,
    }));
    return true;
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
