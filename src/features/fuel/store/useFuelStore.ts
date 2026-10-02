import React from 'react';
import { create } from 'zustand';
import { MealCategory, MealFoodItem } from '../../../types';
import { ExtendedMealCategory, CategoryCardData } from '../components/MealCategoryCards';
import { safeStorage } from '../../../utils/sanitizers';
import { tactileEngine } from '../../../services/tactileEngine';
import { syncEngine } from '../../../services/syncEngine';
import { supabase } from '../../../services/supabaseClient';
import { dispatchAthleteTelemetry } from '../../../services/coachSync';
import { getTelemetryHistoryState } from '../../log/store/useTelemetryHistoryStore';

export type { ExtendedMealCategory, CategoryCardData };

export interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface FuelMeals {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snack: MealItem[];
  drinks: MealItem[];
  supplements: MealItem[];
}

export interface FuelState {
  calorieTarget: number;       // default user target (e.g., 2000, 2500 or custom)
  burnedKcal: number;          // active burn (default: 0)
  weightKg: number;            // current weight in kg
  countryMarket: string;       // default: "US"
  dietPreference: string;      // default: "Omnivore"
  targetProteinG: number;      // target protein grams
  targetCarbsG: number;        // target carbs grams
  targetFatsG: number;         // target fats grams
  hydrationTargetL: number;    // default: 3.0
  hydrationCurrentL: number;   // default: 0.0
  meals: FuelMeals;

  // Actions
  setCalorieTarget: (kcal: number) => void;
  setMacroTargets: (p: number, c: number, f: number) => void;
  setWeightKg: (w: number) => void;
  setCountryMarket: (country: string) => void;
  setEnergyTargets: (cal: number, p: number, c: number, f: number, weight?: number) => void;
  setDietPreference: (diet: string) => void;
  logHydration: (liters: number) => void;
  addMealItem: (slot: keyof FuelMeals, item: MealItem) => void;
  removeMealItem: (slot: keyof FuelMeals, itemId: string) => void;
  clearDailyMeals: () => void;
  resetMeals: () => void;
  logBurned: (kcal: number) => void;
  setBurnedKcal: (kcal: number) => void;

  // Compatibility properties
  hydrationLiters: number;
  hydration: number;
  caloriesBudget: number;
  burned: number;
  proteinTarget: number;
  carbsTarget: number;
  fatsTarget: number;
  activeCategory: ExtendedMealCategory;
  categoriesData: CategoryCardData[];
  toastMessage: string | null;

  // Compatibility actions
  addHydration: (liters: number) => void;
  addFuelHydration: (liters: number) => void;
  setHydrationLiters: (liters: number) => void;
  addFoodItem: (category: ExtendedMealCategory | MealCategory, item: any) => void;
  toggleItemLogged: (category: ExtendedMealCategory, itemId: string) => void;
  deleteItem: (category: ExtendedMealCategory, itemId: string) => void;
  setActiveCategory: (category: ExtendedMealCategory) => void;
  setCaloriesBudget: (budget: number) => void;
  setCategoriesData: (data: CategoryCardData[]) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

const FUEL_STORAGE_KEY = 'o1fc_fuel_state_v5';

const defaultMeals: FuelMeals = {
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: [],
  drinks: [],
  supplements: [],
};

const mapMealsToCategoriesData = (meals: FuelMeals): CategoryCardData[] => {
  const mapSlot = (cat: ExtendedMealCategory, slot: keyof FuelMeals, target: number): CategoryCardData => ({
    category: cat,
    calorieTarget: target,
    items: (meals[slot] || []).map((it) => ({
      id: it.id,
      name: it.name,
      portion: '1 serving',
      calories: it.calories,
      protein: it.protein,
      carbs: it.carbs,
      fats: it.fats,
      timestamp: '12:00',
      logged: true,
    })),
  });

  return [
    mapSlot('Breakfast', 'breakfast', 0),
    mapSlot('Lunch', 'lunch', 0),
    mapSlot('Dinner', 'dinner', 0),
    mapSlot('Snack', 'snack', 0),
    mapSlot('Drinks', 'drinks', 0),
    mapSlot('Supplements & Electrolytes', 'supplements', 0),
  ];
};

const normalizeCategoryToSlot = (cat: string): keyof FuelMeals => {
  const lower = cat.toLowerCase();
  if (lower.includes('breakfast')) return 'breakfast';
  if (lower.includes('lunch')) return 'lunch';
  if (lower.includes('dinner')) return 'dinner';
  if (lower.includes('snack')) return 'snack';
  if (lower.includes('drink')) return 'drinks';
  if (lower.includes('supplement') || lower.includes('electrolyte')) return 'supplements';
  return 'breakfast';
};

const loadSavedState = () => {
  if (typeof window === 'undefined') {
    return {
      calorieTarget: 2200,
      burnedKcal: 0,
      weightKg: 78.5,
      countryMarket: 'US',
      dietPreference: 'Omnivore',
      targetProteinG: 165,
      targetCarbsG: 250,
      targetFatsG: 60,
      hydrationTargetL: 3.0,
      hydrationCurrentL: 0.0,
      meals: defaultMeals,
    };
  }

  const saved = safeStorage.getItem<any>(FUEL_STORAGE_KEY, null);
  if (saved && typeof saved === 'object') {
    const savedBurned = saved.burnedKcal === 1280 ? 0 : (saved.burnedKcal ?? 0);
    return {
      calorieTarget: (saved.calorieTarget && saved.calorieTarget > 0) ? saved.calorieTarget : 2200,
      burnedKcal: savedBurned,
      weightKg: (saved.weightKg && saved.weightKg > 0) ? saved.weightKg : 78.5,
      countryMarket: saved.countryMarket ?? 'US',
      dietPreference: saved.dietPreference ?? 'Omnivore',
      targetProteinG: (saved.targetProteinG && saved.targetProteinG > 0) ? saved.targetProteinG : 165,
      targetCarbsG: (saved.targetCarbsG && saved.targetCarbsG > 0) ? saved.targetCarbsG : 250,
      targetFatsG: (saved.targetFatsG && saved.targetFatsG > 0) ? saved.targetFatsG : 60,
      hydrationTargetL: (saved.hydrationTargetL && saved.hydrationTargetL > 0) ? saved.hydrationTargetL : 3.0,
      hydrationCurrentL: saved.hydrationCurrentL ?? 0.0,
      meals: {
        breakfast: Array.isArray(saved.meals?.breakfast) ? saved.meals.breakfast : [],
        lunch: Array.isArray(saved.meals?.lunch) ? saved.meals.lunch : [],
        dinner: Array.isArray(saved.meals?.dinner) ? saved.meals.dinner : [],
        snack: Array.isArray(saved.meals?.snack) ? saved.meals.snack : [],
        drinks: Array.isArray(saved.meals?.drinks) ? saved.meals.drinks : [],
        supplements: Array.isArray(saved.meals?.supplements) ? saved.meals.supplements : [],
      },
    };
  }

  return {
    calorieTarget: 2200,
    burnedKcal: 0,
    weightKg: 78.5,
    countryMarket: 'US',
    dietPreference: 'Omnivore',
    targetProteinG: 165,
    targetCarbsG: 250,
    targetFatsG: 60,
    hydrationTargetL: 3.0,
    hydrationCurrentL: 0.0,
    meals: defaultMeals,
  };
};

const initial = loadSavedState();

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export const useFuelStore = create<FuelState>((set, get) => {
  const persist = () => {
    const s = get();
    safeStorage.setItem(FUEL_STORAGE_KEY, {
      calorieTarget: s.calorieTarget,
      burnedKcal: s.burnedKcal,
      weightKg: s.weightKg,
      countryMarket: s.countryMarket,
      dietPreference: s.dietPreference,
      targetProteinG: s.targetProteinG,
      targetCarbsG: s.targetCarbsG,
      targetFatsG: s.targetFatsG,
      hydrationTargetL: s.hydrationTargetL,
      hydrationCurrentL: s.hydrationCurrentL,
      meals: s.meals,
    });
  };

  const triggerToast = (_msg?: string) => {
    // Intentionally neutralized: in-app toast banners disabled permanently
  };

  return {
    calorieTarget: initial.calorieTarget,
    burnedKcal: initial.burnedKcal,
    weightKg: initial.weightKg,
    countryMarket: initial.countryMarket,
    dietPreference: initial.dietPreference,
    targetProteinG: initial.targetProteinG,
    targetCarbsG: initial.targetCarbsG,
    targetFatsG: initial.targetFatsG,
    hydrationTargetL: initial.hydrationTargetL,
    hydrationCurrentL: initial.hydrationCurrentL,
    meals: initial.meals,

    // Compat fields
    hydrationLiters: initial.hydrationCurrentL,
    hydration: initial.hydrationCurrentL,
    caloriesBudget: initial.calorieTarget,
    burned: initial.burnedKcal,
    proteinTarget: initial.targetProteinG,
    carbsTarget: initial.targetCarbsG,
    fatsTarget: initial.targetFatsG,
    activeCategory: 'Breakfast',
    categoriesData: mapMealsToCategoriesData(initial.meals),
    toastMessage: null,

    setCalorieTarget: (kcal: number) => {
      set({ calorieTarget: kcal, caloriesBudget: kcal });
      persist();
    },

    setMacroTargets: (p: number, c: number, f: number) => {
      set({
        targetProteinG: p,
        proteinTarget: p,
        targetCarbsG: c,
        carbsTarget: c,
        targetFatsG: f,
        fatsTarget: f,
      });
      persist();
    },

    setWeightKg: (w: number) => {
      set({ weightKg: w });
      persist();
    },

    setCountryMarket: (country: string) => {
      set({ countryMarket: country });
      persist();
    },

    setEnergyTargets: (cal: number, p: number, c: number, f: number, weight?: number) => {
      set((state) => ({
        calorieTarget: cal,
        caloriesBudget: cal,
        targetProteinG: p,
        proteinTarget: p,
        targetCarbsG: c,
        carbsTarget: c,
        targetFatsG: f,
        fatsTarget: f,
        weightKg: weight !== undefined ? weight : state.weightKg,
      }));
      persist();
    },

    setDietPreference: (diet: string) => {
      set({ dietPreference: diet });
      persist();
    },

    logHydration: (liters: number) => {
      tactileEngine.triggerDialHaptic();
      const current = get().hydrationCurrentL;
      const next = Math.max(0, Math.min(6.0, Number((current + liters).toFixed(2))));
      set({
        hydrationCurrentL: next,
        hydrationLiters: next,
        hydration: next,
      });
      persist();
    },

    addMealItem: (slot: keyof FuelMeals, item: MealItem) => {
      tactileEngine.triggerSelectionBuzz();
      const currentSlot = get().meals[slot] || [];
      const updatedMeals = {
        ...get().meals,
        [slot]: [{ ...item }, ...currentSlot],
      };
      set({
        meals: updatedMeals,
        categoriesData: mapMealsToCategoriesData(updatedMeals),
      });
      persist();

      // Mirror to persistent telemetry history
      try {
        const allItems = Object.values(updatedMeals).flat();
        const totCals = Math.round(allItems.reduce((acc, m) => acc + (m.calories || 0), 0));
        const totP = Math.round(allItems.reduce((acc, m) => acc + (m.protein || 0), 0) * 10) / 10;
        const totC = Math.round(allItems.reduce((acc, m) => acc + (m.carbs || 0), 0) * 10) / 10;
        const totF = Math.round(allItems.reduce((acc, m) => acc + (m.fats || 0), 0) * 10) / 10;
        const now = new Date();
        const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        getTelemetryHistoryState().updateDayRecord(todayKey, 'nutrition', {
          hasData: true,
          calories: totCals,
          calorieTarget: get().calorieTarget || 2200,
          proteinG: totP,
          proteinTargetG: get().targetProteinG || 165,
          carbsG: totC,
          carbsTargetG: get().targetCarbsG || 250,
          fatsG: totF,
          fatsTargetG: get().targetFatsG || 60,
          meals: allItems.map((m) => ({
            name: m.name,
            category: 'Lunch',
            calories: m.calories,
            proteinG: m.protein,
            carbsG: m.carbs,
            fatsG: m.fats,
          })),
        });
      } catch (err) {
        console.warn('[FuelStore] History sync warning:', err);
      }

      // Persist to Supabase public.meal_logs & public.daily_macros
      try {
        const userId = (typeof window !== 'undefined' && localStorage.getItem('o1fc_user_id')) || 'default-athlete';
        const now = new Date();
        const todayDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        supabase.from('meal_logs').insert([{
          id: item.id || `meal-${Date.now()}`,
          user_id: userId,
          food_name: item.name,
          meal_slot: slot,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fats,
          created_at: now.toISOString(),
        }]).then(({ error }) => {
          if (error) console.warn('[FuelStore] meal_logs insert note:', error.message);
        });

        const allItems = Object.values(updatedMeals).flat();
        const totCals = Math.round(allItems.reduce((acc, m) => acc + (m.calories || 0), 0));
        const totP = Math.round(allItems.reduce((acc, m) => acc + (m.protein || 0), 0) * 10) / 10;
        const totC = Math.round(allItems.reduce((acc, m) => acc + (m.carbs || 0), 0) * 10) / 10;
        const totF = Math.round(allItems.reduce((acc, m) => acc + (m.fats || 0), 0) * 10) / 10;

        supabase.from('daily_macros').upsert([{
          user_id: userId,
          date: todayDateKey,
          calories: totCals,
          protein: totP,
          carbs: totC,
          fat: totF,
          calorie_target: get().calorieTarget || 2200,
          updated_at: now.toISOString(),
        }], { onConflict: 'user_id,date' }).then(({ error }) => {
          if (error) console.warn('[FuelStore] daily_macros upsert note:', error.message);
        });
      } catch (dbErr) {
        console.warn('[FuelStore] Supabase meal log exception:', dbErr);
      }

      syncEngine.dispatchMutation({
        table: 'food_logs',
        operation: 'UPSERT',
        payload: {
          id: item.id || `food-${Date.now()}`,
          athlete_id: 'default-athlete',
          meal_type: slot,
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fats,
          logged_at: new Date().toISOString(),
        },
      });

      dispatchAthleteTelemetry('default-athlete', {
        activeCals: item.calories,
      });
    },

    removeMealItem: (slot: keyof FuelMeals, itemId: string) => {
      tactileEngine.triggerSelectionBuzz();
      const currentSlot = get().meals[slot] || [];
      const updatedMeals = {
        ...get().meals,
        [slot]: currentSlot.filter((it) => it.id !== itemId),
      };
      set({
        meals: updatedMeals,
        categoriesData: mapMealsToCategoriesData(updatedMeals),
      });
      persist();

      try {
        const userId = (typeof window !== 'undefined' && localStorage.getItem('o1fc_user_id')) || 'default-athlete';
        supabase.from('meal_logs').delete().match({ id: itemId, user_id: userId }).then(({ error }) => {
          if (error) console.warn('[FuelStore] meal_logs delete note:', error.message);
        });
      } catch (delErr) {
        console.warn('[FuelStore] Supabase delete error:', delErr);
      }

      try {
        const allItems = Object.values(updatedMeals).flat();
        const totCals = Math.round(allItems.reduce((acc, m) => acc + (m.calories || 0), 0));
        const totP = Math.round(allItems.reduce((acc, m) => acc + (m.protein || 0), 0) * 10) / 10;
        const totC = Math.round(allItems.reduce((acc, m) => acc + (m.carbs || 0), 0) * 10) / 10;
        const totF = Math.round(allItems.reduce((acc, m) => acc + (m.fats || 0), 0) * 10) / 10;
        const now = new Date();
        const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        getTelemetryHistoryState().updateDayRecord(todayKey, 'nutrition', {
          hasData: allItems.length > 0,
          calories: totCals,
          calorieTarget: get().calorieTarget || 2200,
          proteinG: totP,
          proteinTargetG: get().targetProteinG || 165,
          carbsG: totC,
          carbsTargetG: get().targetCarbsG || 250,
          fatsG: totF,
          fatsTargetG: get().targetFatsG || 60,
          meals: allItems.map((m) => ({
            name: m.name,
            category: 'Lunch',
            calories: m.calories,
            proteinG: m.protein,
            carbsG: m.carbs,
            fatsG: m.fats,
          })),
        });
      } catch (err) {
        console.warn('[FuelStore] History sync warning:', err);
      }
    },

    clearDailyMeals: () => {
      const emptyMeals: FuelMeals = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
        drinks: [],
        supplements: [],
      };
      set({
        meals: emptyMeals,
        categoriesData: mapMealsToCategoriesData(emptyMeals),
        hydrationCurrentL: 0.0,
        hydrationLiters: 0.0,
        hydration: 0.0,
        burnedKcal: 0,
        burned: 0,
      });
      persist();
    },

    resetMeals: () => {
      get().clearDailyMeals();
    },

    logBurned: (kcal: number) => {
      const current = get().burnedKcal || 0;
      const next = Math.max(0, current + kcal);
      set({ burnedKcal: next, burned: next });
      persist();
    },

    setBurnedKcal: (kcal: number) => {
      const next = Math.max(0, kcal);
      set({ burnedKcal: next, burned: next });
      persist();
    },

    // Compat methods
    addHydration: (liters: number) => get().logHydration(liters),
    addFuelHydration: (liters: number) => get().logHydration(liters),
    setHydrationLiters: (liters: number) => {
      const next = Math.max(0, Math.min(6.0, Number(liters.toFixed(2))));
      set({ hydrationCurrentL: next, hydrationLiters: next, hydration: next });
      persist();
    },

    addFoodItem: (category: ExtendedMealCategory | MealCategory, item: any) => {
      const slot = normalizeCategoryToSlot(category as string);
      const mealItem: MealItem = {
        id: item.id || `food-${Date.now()}`,
        name: item.name || 'Food item',
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fats: Number(item.fats) || 0,
      };
      get().addMealItem(slot, mealItem);
    },

    toggleItemLogged: (category: ExtendedMealCategory, itemId: string) => {
      tactileEngine.triggerSelectionBuzz();
      const slot = normalizeCategoryToSlot(category);
      const item = (get().meals[slot] || []).find((i) => i.id === itemId);
      if (item) {
        // Toggle or no-op
      }
    },

    deleteItem: (category: ExtendedMealCategory, itemId: string) => {
      const slot = normalizeCategoryToSlot(category);
      get().removeMealItem(slot, itemId);
    },

    setActiveCategory: (cat: ExtendedMealCategory) => set({ activeCategory: cat }),
    setCaloriesBudget: (budget: number) => get().setCalorieTarget(budget),
    setCategoriesData: (data: CategoryCardData[]) => {
      const nextMeals: FuelMeals = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
        drinks: [],
        supplements: [],
      };
      for (const cat of data) {
        const slot = normalizeCategoryToSlot(cat.category);
        nextMeals[slot] = cat.items.map((it) => ({
          id: it.id,
          name: it.name,
          calories: it.calories,
          protein: it.protein,
          carbs: it.carbs,
          fats: it.fats,
        }));
      }
      set({ meals: nextMeals, categoriesData: data });
      persist();
    },
    showToast: triggerToast,
    clearToast: () => {
      if (toastTimeout) clearTimeout(toastTimeout);
      set({ toastMessage: null });
    },
  };
});

export const getFuelCalculations = (state: Pick<FuelState, 'meals' | 'calorieTarget' | 'burnedKcal'>) => {
  const allItems: MealItem[] = Object.values(state.meals || {}).flat();
  const eatenKcal = allItems.reduce((acc, item) => acc + (Number(item.calories) || 0), 0);
  const consumedProtein = allItems.reduce((acc, item) => acc + (Number(item.protein) || 0), 0);
  const consumedCarbs = allItems.reduce((acc, item) => acc + (Number(item.carbs) || 0), 0);
  const consumedFats = allItems.reduce((acc, item) => acc + (Number(item.fats) || 0), 0);
  const calorieTarget = Number(state.calorieTarget) || 0;
  const burnedKcal = Number(state.burnedKcal) || 0;
  const remainingKcal = Math.max(0, calorieTarget - eatenKcal + burnedKcal);
  const budgetPercent = calorieTarget > 0 ? Math.min(100, Math.round((eatenKcal / calorieTarget) * 100)) : 0;

  return {
    eatenKcal,
    consumedProtein,
    consumedCarbs,
    consumedFats,
    remainingKcal,
    budgetPercent,
  };
};

export const useFuelCalculations = () => {
  const meals = useFuelStore((state) => state.meals);
  const calorieTarget = useFuelStore((state) => state.calorieTarget);
  const burnedKcal = useFuelStore((state) => state.burnedKcal);

  return React.useMemo(() => {
    return getFuelCalculations({ meals, calorieTarget, burnedKcal });
  }, [meals, calorieTarget, burnedKcal]);
};

export const getFuelState = (): FuelState => useFuelStore.getState();
export const setFuelState = useFuelStore.setState;
export const fuelActions = {
  addHydration: (liters: number) => useFuelStore.getState().addHydration(liters),
  addFuelHydration: (liters: number) => useFuelStore.getState().addFuelHydration(liters),
  setHydrationLiters: (liters: number) => useFuelStore.getState().setHydrationLiters(liters),
  addFoodItem: (cat: any, item: any) => useFuelStore.getState().addFoodItem(cat, item),
  deleteItem: (cat: any, id: string) => useFuelStore.getState().deleteItem(cat, id),
  setActiveCategory: (cat: any) => useFuelStore.getState().setActiveCategory(cat),
  showToast: (msg: string) => useFuelStore.getState().showToast(msg),
  clearToast: () => useFuelStore.getState().clearToast(),
};

export default useFuelStore;
