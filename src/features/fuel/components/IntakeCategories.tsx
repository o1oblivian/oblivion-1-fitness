import React from 'react';
import {
  IntakeCategoryCard,
  ExtendedMealCategory,
  CategoryCardData,
} from './IntakeCategoryCard';

export type { ExtendedMealCategory, CategoryCardData };

const MEAL_CATEGORIES: ExtendedMealCategory[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Drinks',
];

export interface IntakeCategoriesProps {
  categoriesData: CategoryCardData[];
  onAddFood: (category: ExtendedMealCategory) => void;
  onVoiceScan: (category: ExtendedMealCategory) => void;
  onCameraScan: (category: ExtendedMealCategory) => void;
  onToggleLogged: (category: ExtendedMealCategory, itemId: string) => void;
  onDeleteItem: (category: ExtendedMealCategory, itemId: string) => void;
}

export const IntakeCategories: React.FC<IntakeCategoriesProps> = ({
  categoriesData,
  onAddFood,
  onVoiceScan,
  onCameraScan,
  onToggleLogged,
  onDeleteItem,
}) => {
  // Ensure we have entries for all 5 meal slots: Breakfast, Lunch, Dinner, Snack, Drinks
  const mealSlots: CategoryCardData[] = MEAL_CATEGORIES.map((catName) => {
    const found = categoriesData.find((c) => c.category === catName);
    if (found) return found;
    return {
      category: catName,
      calorieTarget: 500,
      items: [],
    };
  });

  const totalEaten = mealSlots.reduce((total, cat) => {
    const catSum = cat.items.reduce(
      (sum, item) => sum + (item.logged ? item.calories : 0),
      0
    );
    return total + catSum;
  }, 0);

  const totalTarget = mealSlots.reduce(
    (total, cat) => total + (cat.calorieTarget || 0),
    0
  );

  return (
    <div id="intake-categories-section" className="space-y-3">
      {/* Header: Intake with right-aligned caloric summary */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-tactical font-black text-sm uppercase tracking-wider text-neutral-900 dark:text-white">
          Intake Meal Slots
        </h3>
        <span className="text-[11px] font-telemetry font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          {totalEaten.toLocaleString()} / {totalTarget.toLocaleString()} kcal
        </span>
      </div>

      {/* 5 Collapsible Meal Slot Category Cards */}
      <div className="space-y-2.5">
        {mealSlots.map((catData) => (
          <IntakeCategoryCard
            key={catData.category}
            catData={catData}
            onAddFood={onAddFood}
            onVoiceScan={onVoiceScan}
            onCameraScan={onCameraScan}
            onToggleLogged={onToggleLogged}
            onDeleteItem={onDeleteItem}
          />
        ))}
      </div>
    </div>
  );
};

export default IntakeCategories;
