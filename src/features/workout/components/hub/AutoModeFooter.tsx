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
      <span
        className="text-xs text-neutral-400 font-medium"
        title={`${totalKcal} kcal`}
      >
        {totalMins} min · {exerciseCount} moves · {totalSets} sets
      </span>
      <button
        type="button"
        onClick={onAddExercises}
        className="bg-o1-crimson hover:bg-o1-crimson-hover active:scale-95 text-white text-xs font-semibold px-5 py-2 rounded-full shadow-sm flex items-center gap-1 transition-all cursor-pointer"
      >
        Start
      </button>
    </div>
  );
};
