import {
  FuelDayLog,
  HydrationLogEntry,
  MacroTarget,
  MealCategory,
  MealFoodItem,
  MealSectionData,
} from '../types';
import {
  DEFAULT_FUEL_DAY_LOG,
  DEFAULT_MACROS,
  VALID_CATEGORIES,
} from './fuelDefaults';

export * from './safeStorage';
export * from './coachSanitizers';
export * from './fuelDefaults';

/**
 * Defensive sanitizer for MealFoodItem.
 * Ensures non-null properties, numbers >= 0, and non-empty strings.
 */
export function sanitizeMealFoodItem(raw: unknown): MealFoodItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  const id = typeof item.id === 'string' && item.id.trim() ? item.id : `meal-${Date.now()}`;
  const name = typeof item.name === 'string' && item.name.trim() ? item.name : 'Unknown Nutrient Source';
  const portion = typeof item.portion === 'string' ? item.portion : '1 serving';
  const calories = typeof item.calories === 'number' && !isNaN(item.calories) ? Math.max(0, item.calories) : 0;
  const protein = typeof item.protein === 'number' && !isNaN(item.protein) ? Math.max(0, item.protein) : 0;
  const carbs = typeof item.carbs === 'number' && !isNaN(item.carbs) ? Math.max(0, item.carbs) : 0;
  const fats = typeof item.fats === 'number' && !isNaN(item.fats) ? Math.max(0, item.fats) : 0;
  const timestamp = typeof item.timestamp === 'string' ? item.timestamp : '08:00';
  const logged = Boolean(item.logged);

  return {
    id,
    name,
    portion,
    calories,
    protein,
    carbs,
    fats,
    timestamp,
    logged,
  };
}

/**
 * Defensive sanitizer for meal sections array.
 */
export function sanitizeMealSections(raw: unknown): MealSectionData[] {
  if (!Array.isArray(raw)) {
    return VALID_CATEGORIES.map((cat) => ({
      category: cat,
      recommendedKcal: cat === 'Breakfast' ? 750 : cat === 'Lunch' ? 950 : cat === 'Dinner' ? 850 : 250,
      items: [],
    }));
  }

  const validSections: MealSectionData[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const rec = entry as Record<string, unknown>;

    const categoryStr = typeof rec.category === 'string' ? rec.category : 'Breakfast';
    const category: MealCategory = VALID_CATEGORIES.includes(categoryStr as MealCategory)
      ? (categoryStr as MealCategory)
      : 'Breakfast';

    const recommendedKcal =
      typeof rec.recommendedKcal === 'number' && !isNaN(rec.recommendedKcal)
        ? Math.max(0, rec.recommendedKcal)
        : 500;

    const rawItems = Array.isArray(rec.items) ? rec.items : [];
    const sanitizedItems: MealFoodItem[] = [];

    for (const rawItem of rawItems) {
      const sanitized = sanitizeMealFoodItem(rawItem);
      if (sanitized) sanitizedItems.push(sanitized);
    }

    validSections.push({
      category,
      recommendedKcal,
      items: sanitizedItems,
    });
  }

  return validSections.length > 0
    ? validSections
    : VALID_CATEGORIES.map((cat) => ({
        category: cat,
        recommendedKcal: 500,
        items: [],
      }));
}

/**
 * Sanitizes Fuel OS logs and sections. Safely injects default macros and empty
 * arrays if meal objects are corrupted or undefined.
 */
export function sanitizeFuelLogs(raw: unknown): FuelDayLog {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_FUEL_DAY_LOG;
  }

  if (Array.isArray(raw)) {
    const sections = sanitizeMealSections(raw);
    const totalEaten = sections.reduce(
      (sum, s) => sum + s.items.reduce((secSum, i) => secSum + (i.calories || 0), 0),
      0
    );
    return {
      ...DEFAULT_FUEL_DAY_LOG,
      eaten: totalEaten > 0 ? totalEaten : DEFAULT_FUEL_DAY_LOG.eaten,
      meals: sections,
    };
  }

  const rec = raw as Record<string, unknown>;

  const caloriesBudget =
    typeof rec.caloriesBudget === 'number' && !isNaN(rec.caloriesBudget)
      ? Math.max(0, rec.caloriesBudget)
      : DEFAULT_FUEL_DAY_LOG.caloriesBudget;

  const eaten =
    typeof rec.eaten === 'number' && !isNaN(rec.eaten)
      ? Math.max(0, rec.eaten)
      : DEFAULT_FUEL_DAY_LOG.eaten;

  const burned =
    typeof rec.burned === 'number' && !isNaN(rec.burned)
      ? Math.max(0, rec.burned)
      : DEFAULT_FUEL_DAY_LOG.burned;

  const meals = sanitizeMealSections(rec.meals);

  const hydrationLogs: HydrationLogEntry[] = Array.isArray(rec.hydrationLogs)
    ? rec.hydrationLogs
        .filter((h): h is Record<string, unknown> => Boolean(h && typeof h === 'object'))
        .map((h, idx) => ({
          id: typeof h.id === 'string' && h.id ? h.id : `hyd-${idx}`,
          amountLiters:
            typeof h.amountLiters === 'number' && !isNaN(h.amountLiters)
              ? Math.max(0, h.amountLiters)
              : 0.5,
          timestamp: typeof h.timestamp === 'string' && h.timestamp ? h.timestamp : '12:00',
        }))
    : [...DEFAULT_FUEL_DAY_LOG.hydrationLogs];

  const macros =
    rec.macros && typeof rec.macros === 'object'
      ? {
          protein: (rec.macros as Record<string, unknown>).protein
            ? ((rec.macros as Record<string, unknown>).protein as MacroTarget)
            : DEFAULT_MACROS.protein,
          carbs: (rec.macros as Record<string, unknown>).carbs
            ? ((rec.macros as Record<string, unknown>).carbs as MacroTarget)
            : DEFAULT_MACROS.carbs,
          fats: (rec.macros as Record<string, unknown>).fats
            ? ((rec.macros as Record<string, unknown>).fats as MacroTarget)
            : DEFAULT_MACROS.fats,
        }
      : DEFAULT_MACROS;

  return {
    caloriesBudget,
    eaten,
    burned,
    macros,
    meals,
    hydrationLogs,
  };
}
