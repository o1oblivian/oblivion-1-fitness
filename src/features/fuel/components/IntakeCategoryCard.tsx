import React, { useState } from 'react';
import {
  Sun,
  Utensils,
  Moon,
  Box,
  Coffee,
  Zap,
  Plus,
  Mic,
  Camera,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MealFoodItem } from '../../../types';
import { MealFoodItemRow } from './MealFoodItemRow';
import { tactileEngine } from '../../../services/tactileEngine';

export type ExtendedMealCategory =
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Snack'
  | 'Drinks'
  | 'Supplements & Electrolytes';

export interface CategoryCardData {
  category: ExtendedMealCategory;
  calorieTarget: number;
  items: MealFoodItem[];
}

interface IntakeCategoryCardProps {
  catData: CategoryCardData;
  onAddFood: (category: ExtendedMealCategory) => void;
  onVoiceScan: (category: ExtendedMealCategory) => void;
  onCameraScan: (category: ExtendedMealCategory) => void;
  onToggleLogged: (category: ExtendedMealCategory, itemId: string) => void;
  onDeleteItem: (category: ExtendedMealCategory, itemId: string) => void;
}

export const IntakeCategoryCard: React.FC<IntakeCategoryCardProps> = ({
  catData,
  onAddFood,
  onVoiceScan,
  onCameraScan,
  onToggleLogged,
  onDeleteItem,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const { category, items } = catData;

  const totalCalories = items.reduce(
    (sum, item) => sum + (item.logged ? item.calories : 0),
    0
  );

  // High contrast dual-theme tactile icon box mapping (Zero muddy glows, crisp in both Light & Dark)
  const renderIconBox = () => {
    switch (category) {
      case 'Breakfast':
        return (
          <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
            <Sun className="w-4 h-4 stroke-[2.2]" />
          </div>
        );
      case 'Lunch':
        return (
          <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800/60 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-xs">
            <Utensils className="w-4 h-4 stroke-[2.2]" />
          </div>
        );
      case 'Dinner':
        return (
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
            <Moon className="w-4 h-4 stroke-[2.2]" />
          </div>
        );
      case 'Snack':
        return (
          <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 text-[#C4121A] dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
            <Box className="w-4 h-4 stroke-[2.2]" />
          </div>
        );
      case 'Drinks':
        return (
          <div className="w-9 h-9 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-xs">
            <Coffee className="w-4 h-4 stroke-[2.2]" />
          </div>
        );
      case 'Supplements & Electrolytes':
        return (
          <div className="w-9 h-9 rounded-2xl bg-green-50 dark:bg-green-950/40 border border-green-300 dark:border-green-800/60 text-green-700 dark:text-green-400 flex items-center justify-center shrink-0 shadow-xs">
            <Zap className="w-4 h-4 stroke-[2.2]" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-2xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0 shadow-xs">
            <Utensils className="w-4 h-4 stroke-[2.2]" />
          </div>
        );
    }
  };

  return (
    <div
      id={`intake-category-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 space-y-3 shadow-md dark:shadow-2xl transition-all"
    >
      {/* Category Header Row with Collapsible Toggle */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center gap-3 min-w-0 text-left hover:opacity-90 transition-opacity cursor-pointer"
        >
          {renderIconBox()}
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-tactical font-black text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
                {category}
              </h4>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              )}
            </div>
            <span className="font-telemetry font-mono text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
              {totalCalories} kcal
            </span>
          </div>
        </button>

        {/* Right Action Controls: Clean Dual-Theme Tactile Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onAddFood(category);
            }}
            className="py-1 px-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#18181c] dark:hover:bg-[#222228] text-neutral-800 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 text-[10px] font-tactical font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#C4121A]" />
            <span>+ Add</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onVoiceScan(category);
            }}
            className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#18181c] dark:hover:bg-[#222228] text-sky-600 dark:text-sky-400 border border-neutral-200 dark:border-neutral-800 transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Voice Log"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onCameraScan(category);
            }}
            className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#18181c] dark:hover:bg-[#222228] text-[#C4121A] dark:text-rose-400 border border-neutral-200 dark:border-neutral-800 transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Photo Meal Log"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Collapsible Content: Empty State or Logged Food Items */}
      {isExpanded && (
        <div className="pt-1 animate-in fade-in duration-150">
          {items.length === 0 ? (
            <div className="py-2.5 px-3 rounded-xl bg-neutral-50 dark:bg-[#08080a] border border-neutral-200/80 dark:border-neutral-800/50 text-center">
              <span className="text-xs font-telemetry text-neutral-500 tracking-wider">
                No items logged • 0 kcal
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {items.map((food: MealFoodItem) => (
                <MealFoodItemRow
                  key={food.id}
                  food={food}
                  onToggleLogged={() => onToggleLogged(category, food.id)}
                  onDelete={() => onDeleteItem(category, food.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntakeCategoryCard;
