import React from 'react';
import { Trash2, CheckCircle2 } from 'lucide-react';
import { MealFoodItem } from '../../../types';

interface MealFoodItemRowProps {
  food: MealFoodItem;
  onToggleLogged: () => void;
  onDelete: () => void;
}

export const MealFoodItemRow: React.FC<MealFoodItemRowProps> = ({
  food,
  onToggleLogged,
  onDelete,
}) => {
  return (
    <div className="bg-neutral-50 dark:bg-[#08080A] p-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <button
          type="button"
          onClick={onToggleLogged}
          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
            food.logged
              ? 'bg-[#C4121A] text-white shadow-xs'
              : 'bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 text-transparent'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>

        <div className="truncate">
          <h5 className="text-xs font-semibold text-neutral-900 dark:text-zinc-200 truncate">
            {food.name}
          </h5>
          <div className="flex items-center gap-2 text-[10px] font-telemetry text-neutral-500 dark:text-zinc-500 mt-0.5">
            <span>{food.portion}</span>
            <span>•</span>
            <span className="text-red-500">{food.protein}g P</span>
            <span>•</span>
            <span className="text-amber-500">{food.carbs}g C</span>
            <span>•</span>
            <span className="text-cyan-400">{food.fats}g F</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="font-telemetry text-xs font-bold text-neutral-900 dark:text-zinc-200">
          {food.calories} kcal
        </span>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-neutral-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-[#FF3B30] transition-colors cursor-pointer"
          title="Remove"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
