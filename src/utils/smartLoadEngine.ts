import { getSmartDefault } from './frequencyDefaults';

export interface LoadSuggestion {
  weight: number;
  reps: number;
  rpe: number;
  source: 'history' | 'first_time';
  progressionNote?: string;
}

const PROGRESSION_INCREMENT_KG = 2.5;
const PROGRESSION_INCREMENT_KG_SMALL = 1.25;

function isIsolation(exerciseName: string): boolean {
  const lower = exerciseName.toLowerCase();
  return ['curl', 'extension', 'raise', 'fly', 'kickback', 'shrug', 'pullover', 'pushdown'].some(k => lower.includes(k));
}

export function getSmartLoadSuggestion(exerciseName: string, targetRpe: number = 8): LoadSuggestion {
  const prevWeight = getSmartDefault('exercise_weight_' + exerciseName, 0);
  const prevReps = getSmartDefault('exercise_reps_' + exerciseName, 0);
  const prevRpe = getSmartDefault('exercise_rpe_' + exerciseName, 0);

  if (prevWeight === 0 && prevReps === 0) {
    return {
      weight: 0,
      reps: 0,
      rpe: targetRpe,
      source: 'first_time',
    };
  }

  const increment = isIsolation(exerciseName)
    ? PROGRESSION_INCREMENT_KG_SMALL
    : PROGRESSION_INCREMENT_KG;

  const shouldProgress = prevRpe > 0 && prevRpe <= targetRpe && prevReps >= 8;
  const suggestedWeight = shouldProgress ? prevWeight + increment : prevWeight;

  const note = shouldProgress
    ? `+${increment}kg from last (${prevWeight}kg x ${prevReps})`
    : `Same as last: ${prevWeight}kg x ${prevReps}`;

  return {
    weight: suggestedWeight,
    reps: prevReps,
    rpe: targetRpe,
    source: 'history',
    progressionNote: note,
  };
}

export function formatLoadBadge(suggestion: LoadSuggestion): string {
  if (suggestion.source === 'first_time') return 'New — log your weight';
  return `${suggestion.weight}kg suggested`;
}
