import React from 'react';

interface AutoModeFooterProps {
  totalMins: number;
  totalKcal: number;
  exerciseCount: number;
  totalSets: number;
  onAddExercises: () => void;
}

export const AutoModeFooter: React.FC<AutoModeFooterProps> = ({
  totalMins,
  totalKcal,
  exerciseCount,
  totalSets,
  onAddExercises,
}) => {
  return (
    <div className="flex items-center justify-between pt-3">
      <span className="text-xs text-neutral-400 font-mono">
        {totalMins} mins · {totalKcal} kcal · {exerciseCount} exercises · {totalSets} sets
      </span>
      <button
        type="button"
        onClick={onAddExercises}
        className="bg-[#C4121A] hover:bg-[#a50f16] active:scale-95 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm flex items-center gap-1 transition-all cursor-pointer"
      >
        + Add
      </button>
    </div>
  );
};
