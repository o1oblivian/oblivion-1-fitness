import React from 'react';
import { Flame, Utensils } from 'lucide-react';
import type { FoodItemRecord } from '../../../services/foodCatalogService';

/** One food in the Add Food list: name, brand, calories, serving and macros. Tap to pick a portion. */
export const FoodResultRow: React.FC<{
  food: FoodItemRecord;
  onSelect: (food: FoodItemRecord) => void;
}> = ({ food, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(food)}
    className="w-full text-left p-3 rounded-2xl bg-o1-surface border border-white/[0.08] flex items-center justify-between gap-3 transition-colors cursor-pointer active:scale-[0.99]"
  >
    <div className="w-10 h-10 rounded-2xl bg-o1-sheet border border-white/[0.08] flex items-center justify-center shrink-0">
      <Utensils className="w-4 h-4 text-o1-muted" />
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs sm:text-sm font-semibold text-o1-text truncate">
            {food.name}
          </span>
          {(food.is_custom || food.source === 'custom') && (
            <span className="px-1.5 py-0.5 rounded-md bg-white/[0.08] text-o1-text text-o1-label tabular-nums font-bold shrink-0 border border-white/[0.08]">
              My Food
            </span>
          )}
          {food.source === 'openfoodfacts' && (
            <span className="px-1.5 py-0.5 rounded-md bg-transparent text-o1-blue text-o1-label tabular-nums font-bold shrink-0 border border-o1-blue/40">
              Live
            </span>
          )}
        </div>
        <span className="text-o1-label text-o1-muted font-sans truncate shrink-0 max-w-[110px]">
          {food.brand}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs mt-1">
        <div className="flex items-center gap-1.5 text-o1-muted">
          <Flame className="w-3 h-3 text-o1-crimson shrink-0" />
          <span className="font-semibold text-o1-text">{food.calories} kcal</span>
          <span className="text-white/20">·</span>
          <span>
            {food.serving_size || (food.serving_grams ? `${food.serving_grams}g` : '1 serving')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-o1-label tabular-nums">
          <span className="text-o1-crimson font-bold">{food.protein}p</span>
          <span className="text-o1-yellow font-bold">{food.carbs}c</span>
          <span className="text-o1-olive font-bold">{food.fats}f</span>
        </div>
      </div>
    </div>
  </button>
);
