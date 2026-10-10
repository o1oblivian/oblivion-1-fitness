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
          <div className="w-9 h-9 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
            <Sun className="w-4 h-4 stroke-[2.2]" />
          </div>
        );
      case 'Lunch':
        return (
          <div className="w-9 h-9 rounded-2xl bg-sky-950/40 border border-sky-800/60 text-sky-400 flex items-center justify-center shrink-0 shadow-xs">
            <Utensils className="w-4 h-4 stroke-[2.2]" />
          </div>
        );
      case 'Dinner':
        return (
          <div className="w-9 h-9 rounded-2xl bg-sky-950/40 border border-sky-800/60 text-sky-400 flex items-center justify-center shrink-0 shadow-xs">
            <Moon className="w-4 h-4 stroke-[2.2]" />
          </div>
        );
      case 'Snack':
        return (
          <div className="w-9 h-9 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-400 flex items-center justify-center shrink-0 shadow-xs">
            <Box className="w-4 h-4 stroke-[2.2]" />
          </div>
        );
      case 'Drinks':
        return (
          <div className="w-9 h-9 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
            <Coffee className="w-4 h-4 stroke-[2.2]" />
          </div>
        );
      case 'Supplements & Electrolytes':
        return (
          <div className="w-9 h-9 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
            <Zap className="w-4 h-4 stroke-[2.2]" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-2xl bg-o1-well border border-white/[0.07] text-neutral-300 flex items-center justify-center shrink-0 shadow-xs">
            <Utensils className="w-4 h-4 stroke-[2.2]" />
          </div>
        );
    }
  };

  return (
    <div
      id={`intake-category-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      className="bg-o1-card border border-white/[0.07] rounded-2xl p-2.5 space-y-2 transition-all"
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
              <h4 className="font-tactical font-black text-xs tracking-wider text-white">
                {category}
              </h4>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              )}
            </div>
            <span className="font-telemetry font-mono text-[11px] text-neutral-400 font-medium">
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
            className="py-1 px-2.5 rounded-xl bg-o1-well hover:bg-white/[0.06] text-neutral-200 hover:text-white border border-white/[0.07] text-[10px] font-tactical font-black tracking-wider flex items-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-o1-crimson" />
            <span>+ Add</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onVoiceScan(category);
            }}
            className="p-1.5 rounded-xl bg-o1-well hover:bg-white/[0.06] text-sky-400 border border-white/[0.07] transition-all active:scale-95 cursor-pointer shadow-xs"
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
            className="p-1.5 rounded-xl bg-o1-well hover:bg-white/[0.06] text-red-400 border border-white/[0.07] transition-all active:scale-95 cursor-pointer shadow-xs"
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
            <div className="py-2.5 px-3 rounded-xl bg-white/[0.03] text-center">
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
