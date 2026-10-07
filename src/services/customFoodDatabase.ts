import { FoodItemRecord, FoodCategoryType } from './foodData/types';

const STORAGE_KEY = 'o1fc_custom_foods_catalog';

/**
 * Loads all custom foods from persistent localStorage
 */
export function getCustomFoods(): FoodItemRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        ...item,
        is_custom: true,
        source: 'custom',
      }));
    }
  } catch (err) {
    console.warn('[customFoodDatabase] Failed to read custom foods from storage:', err);
  }
  return [];
}

/**
 * Persists a new or updated custom food permanently in localStorage
 */
export function saveCustomFood(food: Omit<FoodItemRecord, 'id' | 'is_custom'> & { id?: string }): FoodItemRecord {
  const current = getCustomFoods();
  const id = food.id || `custom-food-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const record: FoodItemRecord = {
    id,
    name: food.name.trim(),
    brand: food.brand ? food.brand.trim() : 'Custom / My Foods',
    calories: Math.max(0, Math.round(food.calories)),
    protein: Math.max(0, Math.round(food.protein * 10) / 10),
    carbs: Math.max(0, Math.round(food.carbs * 10) / 10),
    fats: Math.max(0, Math.round(food.fats * 10) / 10),
    serving_size: food.serving_size ? food.serving_size.trim() : `${food.serving_grams || 100}g`,
    serving_grams: food.serving_grams && food.serving_grams > 0 ? food.serving_grams : 100,
    category: food.category || 'protein',
    country: food.country || 'AU',
    is_custom: true,
    source: 'custom',
  };

  const existingIdx = current.findIndex((item) => item.id === id);
  let updated: FoodItemRecord[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = record;
  } else {
    updated = [record, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[customFoodDatabase] Failed to persist custom food:', err);
  }

  // Dispatch custom storage event for live multi-component synchronization
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('o1fc_custom_foods_updated', { detail: record }));
  }

  return record;
}

/**
 * Deletes a custom food permanently from localStorage
 */
export function deleteCustomFood(id: string): void {
  const current = getCustomFoods();
  const updated = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('o1fc_custom_foods_updated'));
    }
  } catch (err) {
    console.error('[customFoodDatabase] Failed to delete custom food:', err);
  }
}

/**
 * Filters custom foods matching a specific category and query
 */
export function filterCustomFoods(
  category?: FoodCategoryType,
  query: string = ''
): FoodItemRecord[] {
  const all = getCustomFoods();
  const trimmed = query.trim().toLowerCase();

  return all.filter((item) => {
    // If category is provided, match category
    if (category && item.category !== category) {
      return false;
    }
    // If search query is provided, match food name or brand
    if (trimmed) {
      const matchName = item.name.toLowerCase().includes(trimmed);
      const matchBrand = item.brand.toLowerCase().includes(trimmed);
      return matchName || matchBrand;
    }
    return true;
  });
}
