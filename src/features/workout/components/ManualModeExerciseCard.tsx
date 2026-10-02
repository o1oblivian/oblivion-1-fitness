import React from 'react';
import { Plus } from 'lucide-react';
import { ExerciseDefinition } from '../../../types/workout';
import { calculateCalorieBurn, getAthleteWeightKg } from '../../../utils/physiologyEngine';

interface ManualModeExerciseCardProps {
  exercise: ExerciseDefinition;
  onAdd: (exercise: ExerciseDefinition) => void;
}

export const ManualModeExerciseCard: React.FC<ManualModeExerciseCardProps> = ({
  exercise,
  onAdd,
}) => {
  const athleteWeightKg = getAthleteWeightKg();
  const estimatedMins = (exercise.defaultSets || 3) * 2.25;
  const computedKcal = calculateCalorieBurn(
    exercise.baseMET || 6.0,
    athleteWeightKg,
    estimatedMins,
    'STEADY'
  );

  return (
    <div className="p-3 bg-neutral-50 dark:bg-[#0E0E11] border border-neutral-200/60 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white shadow-xs flex items-center justify-between gap-3 select-none transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-mono text-neutral-400 uppercase font-bold tracking-wider">
            {exercise.category || exercise.primaryMuscleGroup}
          </span>
          <span className="text-neutral-300 dark:text-neutral-600">•</span>
          <span className="text-[9px] font-mono text-neutral-500 dark:text-neutral-400 font-medium">
            {exercise.equipment}
          </span>
          {exercise.tier && (
            <span className="text-[8px] font-mono text-neutral-600 dark:text-neutral-300 bg-neutral-200/60 dark:bg-white/10 px-1.5 py-0.5 rounded">
              {exercise.tier}
            </span>
          )}
        </div>
        <h5 className="font-bold text-xs text-neutral-900 dark:text-white truncate mt-0.5">
          {exercise.name}
        </h5>
        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
          <span>
            {exercise.defaultSets || 3} sets × {exercise.defaultReps || 10} reps
          </span>
          <span>•</span>
          <span>Est: {computedKcal} kcal</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAdd(exercise)}
        className="px-3 py-1.5 rounded-xl border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white active:scale-95 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add</span>
      </button>
    </div>
  );
};
