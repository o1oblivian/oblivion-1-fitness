import React, { useEffect, useState } from 'react';
import { NutritionDayRecord, useTelemetryHistoryStore } from '../../store/useTelemetryHistoryStore';
import { FuelMeals, useFuelStore } from '../../../fuel/store/useFuelStore';
import { sanitizeNumericInput } from '../../../../utils/numberInputUtils';
import { releaseForgotten } from '../../services/dayLogService';
import { readNum, type DayLogContext, type SaveOutcome } from './shared';

/** Food day: edit the meals that were logged, or type one meal or the day totals. */
export function useNutritionLogForm({ isOpen, dayMeta, category, mode, onSaved }: DayLogContext) {
  const historyByDate = useTelemetryHistoryStore((s) => s.historyByDate);
  const updateDayRecord = useTelemetryHistoryStore((s) => s.updateDayRecord);

  const [nutritionCalories, setNutritionCalories] = useState('');
  const [nutritionProtein, setNutritionProtein] = useState('');
  const [nutritionCarbs, setNutritionCarbs] = useState('');
  const [nutritionFats, setNutritionFats] = useState('');
  const [nutritionCalorieTarget, setNutritionCalorieTarget] = useState('');
  const [mealName, setMealName] = useState('');
  const [mealDrafts, setMealDrafts] = useState<
    Array<{
      name: string;
      slot: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drinks' | 'supplements';
      calories: string;
      protein: string;
      carbs: string;
      fats: string;
    }>
  >([]);

  useEffect(() => {
    if (!isOpen || !dayMeta) return;
    setMealDrafts([]);
    if (category !== 'nutrition') return;
    const dayRecord = historyByDate[dayMeta.dateKey]?.[category];
    const rec = dayRecord as NutritionDayRecord | undefined;
    const fuelCalTarget = useFuelStore.getState().calorieTarget || 0;
    if (rec?.hasData) {
      const fmt = (n: number) => {
        const r = Math.round(n * 10) / 10;
        return r % 1 === 0 ? r.toFixed(0) : r.toFixed(1);
      };
      setNutritionCalories(String(Math.round(rec.calories || 0)));
      setNutritionProtein(fmt(rec.proteinG || 0));
      setNutritionCarbs(fmt(rec.carbsG || 0));
      setNutritionFats(fmt(rec.fatsG || 0));
      setNutritionCalorieTarget(
        rec.calorieTarget > 0
          ? String(rec.calorieTarget)
          : fuelCalTarget > 0
            ? String(fuelCalTarget)
            : '',
      );
      if (rec.meals?.[0]) {
        setMealName(rec.meals[0].name);
      }
      const figure = (value: number) => (value > 0 ? String(Math.round(value * 10) / 10) : '');
      if (dayMeta.isToday) {
        const fuelMeals = useFuelStore.getState().meals;
        const slots = ['breakfast', 'lunch', 'dinner', 'snack', 'drinks', 'supplements'] as const;
        const drafts = slots.flatMap((slot) =>
          (fuelMeals[slot] || []).map((meal) => ({
            name: meal.name,
            slot,
            calories: meal.calories > 0 ? String(Math.round(meal.calories)) : '',
            protein: figure(meal.protein || 0),
            carbs: figure(meal.carbs || 0),
            fats: figure(meal.fats || 0),
          })),
        );
        if (drafts.length > 0) setMealDrafts(drafts);
      } else if (rec.meals?.length) {
        setMealDrafts(
          rec.meals.map((meal) => ({
            name: meal.name,
            slot: meal.slot || 'dinner',
            calories: meal.calories > 0 ? String(Math.round(meal.calories)) : '',
            protein: figure(meal.proteinG || 0),
            carbs: figure(meal.carbsG || 0),
            fats: figure(meal.fatsG || 0),
          })),
        );
      }
    } else {
      setNutritionCalories('');
      setNutritionProtein('');
      setNutritionCarbs('');
      setNutritionFats('');
      setMealName('');
      setNutritionCalorieTarget(fuelCalTarget > 0 ? String(fuelCalTarget) : '');
      if (dayMeta.isToday) {
        const fuelMeals = useFuelStore.getState().meals;
        const slots = ['breakfast', 'lunch', 'dinner', 'snack', 'drinks', 'supplements'] as const;
        const drafts = slots.flatMap((slot) =>
          (fuelMeals[slot] || []).map((meal) => ({
            name: meal.name,
            slot,
            calories: meal.calories > 0 ? String(Math.round(meal.calories)) : '',
            protein: meal.protein > 0 ? String(meal.protein) : '',
            carbs: meal.carbs > 0 ? String(meal.carbs) : '',
            fats: meal.fats > 0 ? String(meal.fats) : '',
          })),
        );
        if (drafts.length > 0) setMealDrafts(drafts);
      }
    }
  }, [isOpen, dayMeta, category, historyByDate]);

  const save = (): SaveOutcome => {
    if (!dayMeta) return 'stay';
    if (mode === 'edit' && mealDrafts.length > 0) {
      const meals = mealDrafts
        .map((draft) => ({
          name: draft.name.trim() || 'Logged meal',
          category:
            draft.slot === 'breakfast'
              ? ('Breakfast' as const)
              : draft.slot === 'dinner'
                ? ('Dinner' as const)
                : draft.slot === 'snack'
                  ? ('Snacks' as const)
                  : ('Lunch' as const),
          slot: draft.slot,
          calories: Math.round(Number(draft.calories) || 0),
          proteinG: Number(draft.protein) || 0,
          carbsG: Number(draft.carbs) || 0,
          fatsG: Number(draft.fats) || 0,
        }))
        .filter(
          (meal) => meal.calories > 0 || meal.proteinG > 0 || meal.carbsG > 0 || meal.fatsG > 0,
        );
      if (meals.length === 0) {
        onSaved?.('Add a number first');
        return 'stay';
      }
      releaseForgotten(dayMeta.dateKey, 'nutrition');
      if (dayMeta.isToday) {
        const fuel = useFuelStore.getState();
        (Object.keys(fuel.meals) as Array<keyof FuelMeals>).forEach((slot) => {
          [...fuel.meals[slot]].forEach((item) =>
            useFuelStore.getState().removeMealItem(slot, item.id),
          );
        });
        meals.forEach((meal, index) => {
          useFuelStore.getState().addMealItem(meal.slot || 'dinner', {
            id: `meal-edit-${Date.now()}-${index}`,
            name: meal.name,
            calories: meal.calories,
            protein: meal.proteinG,
            carbs: meal.carbsG,
            fats: meal.fatsG,
          });
        });
      } else {
        const sum = (
          pick: (meal: {
            calories: number;
            proteinG: number;
            carbsG: number;
            fatsG: number;
          }) => number,
        ) => Math.round(meals.reduce((acc, meal) => acc + pick(meal), 0) * 10) / 10;
        const existing = historyByDate[dayMeta.dateKey]?.nutrition;
        const record = {
          hasData: true,
          calories: Math.round(sum((meal) => meal.calories)),
          calorieTarget: readNum(nutritionCalorieTarget) ?? existing?.calorieTarget ?? 0,
          proteinG: sum((meal) => meal.proteinG),
          proteinTargetG: existing?.proteinTargetG || 0,
          carbsG: sum((meal) => meal.carbsG),
          carbsTargetG: existing?.carbsTargetG || 0,
          fatsG: sum((meal) => meal.fatsG),
          fatsTargetG: existing?.fatsTargetG || 0,
          meals,
        };
        updateDayRecord(dayMeta.dateKey, 'nutrition', record);
      }
      onSaved?.('Food updated');
      return 'closed';
    }
    const calNum = readNum(nutritionCalories);
    const proNum = readNum(nutritionProtein);
    const carbNum = readNum(nutritionCarbs);
    const fatNum = readNum(nutritionFats);
    const fuelState = useFuelStore.getState();
    const enteredTarget = readNum(nutritionCalorieTarget);
    if (enteredTarget != null && enteredTarget > 0 && enteredTarget !== fuelState.calorieTarget) {
      fuelState.setEnergyTargets(
        enteredTarget,
        fuelState.targetProteinG ?? 0,
        fuelState.targetCarbsG ?? 0,
        fuelState.targetFatsG ?? 0,
      );
    }
    if (calNum == null && proNum == null && carbNum == null && fatNum == null && !mealName.trim()) {
      onSaved?.(enteredTarget != null ? 'Calorie target saved' : 'Add a number first');
      return enteredTarget != null ? 'closed' : 'stay';
    }
    const meal = {
      name: mealName.trim() || 'Logged meal',
      category: 'Dinner' as const,
      calories: calNum ?? 0,
      proteinG: proNum ?? 0,
      carbsG: carbNum ?? 0,
      fatsG: fatNum ?? 0,
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    };
    if (dayMeta.isToday) {
      if (mode === 'edit') {
        const fuel = useFuelStore.getState();
        (Object.keys(fuel.meals) as Array<keyof typeof fuel.meals>).forEach((slot) => {
          [...fuel.meals[slot]].forEach((item) =>
            useFuelStore.getState().removeMealItem(slot, item.id),
          );
        });
      }
      useFuelStore.getState().addMealItem('dinner', {
        id: `manual-meal-${Date.now()}`,
        name: meal.name,
        calories: meal.calories,
        protein: meal.proteinG,
        carbs: meal.carbsG,
        fats: meal.fatsG,
      });
    } else {
      const existing = historyByDate[dayMeta.dateKey]?.nutrition;
      const meals = mode === 'edit' ? [meal] : [...(existing?.meals || []), meal];
      const sum = (
        pick: (item: {
          calories: number;
          proteinG: number;
          carbsG: number;
          fatsG: number;
        }) => number,
      ) => Math.round(meals.reduce((acc, item) => acc + pick(item), 0) * 10) / 10;
      const record = {
        hasData: true,
        calories: Math.round(sum((m) => m.calories)),
        calorieTarget: enteredTarget ?? existing?.calorieTarget ?? fuelState.calorieTarget ?? 0,
        proteinG: sum((m) => m.proteinG),
        proteinTargetG: existing?.proteinTargetG || fuelState.targetProteinG || 0,
        carbsG: sum((m) => m.carbsG),
        carbsTargetG: existing?.carbsTargetG || fuelState.targetCarbsG || 0,
        fatsG: sum((m) => m.fatsG),
        fatsTargetG: existing?.fatsTargetG || fuelState.targetFatsG || 0,
        meals,
      };
      updateDayRecord(dayMeta.dateKey, 'nutrition', record);
    }
    onSaved?.(mode === 'edit' ? 'Food updated' : 'Food logged');
    return 'done';
  };

  return {
    nutritionCalories,
    setNutritionCalories,
    nutritionProtein,
    setNutritionProtein,
    nutritionCarbs,
    setNutritionCarbs,
    nutritionFats,
    setNutritionFats,
    nutritionCalorieTarget,
    setNutritionCalorieTarget,
    mealName,
    setMealName,
    mealDrafts,
    setMealDrafts,
    save,
  };
}

export type NutritionLogForm = ReturnType<typeof useNutritionLogForm>;

export function NutritionLogFields({ form }: { form: NutritionLogForm }) {
  const {
    nutritionCalories,
    setNutritionCalories,
    nutritionProtein,
    setNutritionProtein,
    nutritionCarbs,
    setNutritionCarbs,
    nutritionFats,
    setNutritionFats,
    nutritionCalorieTarget,
    setNutritionCalorieTarget,
    mealName,
    setMealName,
    mealDrafts,
    setMealDrafts,
  } = form;
  return (
    <div className="space-y-3.5">
      {/* Client Daily Calorie Target Adjustment */}
      <div className="p-3 rounded-2xl bg-o1-brown-wash/20 border border-o1-brown-deep/40 space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-o1-label text-o1-yellow font-bold tracking-wider block">
            Daily Calorie Target (KCAL)
          </label>
          <span className="text-o1-label text-o1-faint font-num">Client Goal</span>
        </div>
        <input
          type="number"
          value={nutritionCalorieTarget}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setNutritionCalorieTarget(sanitizeNumericInput(e.target.value))}
          className="w-full bg-o1-card border border-o1-brown-deep/80 rounded-xl px-3 py-2 text-white font-num font-bold focus:border-o1-crimson focus:outline-none text-sm placeholder:text-o1-muted"
          placeholder="Set custom daily goal (e.g. 2200, 2500)..."
        />
        <p className="text-o1-label text-o1-muted font-sans">
          Adjustable by client at any time. Saved across all nutrition and telemetry views.
        </p>
      </div>

      {mealDrafts.length > 0 ? (
        <div className="space-y-3">
          {mealDrafts.map((meal, mealIndex) => (
            <div key={`${meal.slot}-${meal.name}-${mealIndex}`} className="space-y-1.5">
              <div className="text-o1-label font-sans font-semibold text-white">{meal.name}</div>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    ['kcal', 'calories'],
                    ['P', 'protein'],
                    ['C', 'carbs'],
                    ['F', 'fats'],
                  ] as const
                ).map(([label, field]) => (
                  <label key={field} className="space-y-1">
                    <span className="text-o1-label text-o1-faint block">{label}</span>
                    <input
                      type="number"
                      value={meal[field]}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const value = sanitizeNumericInput(e.target.value);
                        setMealDrafts((current) =>
                          current.map((item, index) =>
                            index === mealIndex ? { ...item, [field]: value } : item,
                          ),
                        );
                      }}
                      className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2 py-1.5 text-white text-xs tabular-nums"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-o1-label text-o1-muted font-bold block mb-1">
                Meal / Logged (KCAL)
              </label>
              <input
                type="number"
                value={nutritionCalories}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setNutritionCalories(sanitizeNumericInput(e.target.value))}
                className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-o1-yellow font-bold focus:border-o1-yellow focus:outline-none text-sm"
                placeholder="e.g. 750"
              />
            </div>
            <div>
              <label className="text-o1-label text-o1-muted font-bold block mb-1">
                Protein (G)
              </label>
              <input
                type="number"
                value={nutritionProtein}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setNutritionProtein(sanitizeNumericInput(e.target.value))}
                className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-o1-teal font-bold focus:border-o1-yellow focus:outline-none text-sm"
                placeholder="e.g. 45"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-o1-label text-o1-muted font-bold block mb-1">
                Carbohydrates (G)
              </label>
              <input
                type="number"
                value={nutritionCarbs}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setNutritionCarbs(sanitizeNumericInput(e.target.value))}
                className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-o1-yellow focus:outline-none"
                placeholder="e.g. 80"
              />
            </div>
            <div>
              <label className="text-o1-label text-o1-muted font-bold block mb-1">
                Lipids &amp; Fats (G)
              </label>
              <input
                type="number"
                value={nutritionFats}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setNutritionFats(sanitizeNumericInput(e.target.value))}
                className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-o1-yellow focus:outline-none"
                placeholder="e.g. 20"
              />
            </div>
          </div>

          <div>
            <label className="text-o1-label text-o1-muted font-bold block mb-1">
              Itemized Meal Summary
            </label>
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-3 py-2 text-white focus:border-o1-yellow focus:outline-none text-xs font-num"
              placeholder="e.g. Grilled Chicken, Jasmine Rice & Avocado"
            />
          </div>
        </div>
      )}
    </div>
  );
}
