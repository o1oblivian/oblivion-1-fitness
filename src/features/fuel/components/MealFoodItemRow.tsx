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
    <div className="bg-white/[0.03] min-h-[44px] px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <button
          type="button"
          onClick={onToggleLogged}
          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
            food.logged
              ? 'bg-o1-crimson text-white shadow-xs'
              : 'bg-o1-well border border-white/[0.07] text-transparent'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>

        <div className="truncate">
          <h5 className="text-xs font-semibold text-zinc-200 truncate">
            {food.name}
          </h5>
          <div className="flex items-center gap-2 text-[10px] font-telemetry text-zinc-500 mt-0.5">
            <span>{food.portion}</span>
            <span>•</span>
            <span className="text-o1-crimson">{food.protein}g P</span>
            <span>•</span>
            <span className="text-amber-400">{food.carbs}g C</span>
            <span>•</span>
            <span className="text-emerald-400">{food.fats}g F</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="font-telemetry text-xs font-bold text-zinc-200">
          {food.calories} kcal
        </span>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-zinc-500 hover:text-[#EF4444] transition-colors cursor-pointer"
          title="Remove"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
