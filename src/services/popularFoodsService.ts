import type { FoodBrowseId } from '../../shared/foodBrowse';
import { GLOBAL_MARKET, isPopularFood, type PopularFood } from '../../shared/popularFoods';
import type { FoodItemRecord } from './foodTypes';

/** A food from a country's Top 100 list, with the category chip it belongs under. */
export type PopularFoodRecord = FoodItemRecord & { browse: FoodBrowseId };

export interface PopularList {
  /** The list actually used: the country's own, or the world list when the country has none. */
  market: string;
  foods: PopularFoodRecord[];
}

/** One small file per country, built into the app. Each is fetched only when its country is chosen. */
const lists = import.meta.glob<unknown>('../data/popularFoods/*.json', { import: 'default' });

const remembered = new Map<string, Promise<PopularList>>();

function pathFor(code: string): string {
  return `../data/popularFoods/${code}.json`;
}

/** The market whose list serves this country. */
export function popularMarketFor(country: string): string {
  const code = (country || '').toUpperCase();
  return pathFor(code) in lists ? code : GLOBAL_MARKET;
}

function toRecord(food: PopularFood, market: string): PopularFoodRecord {
  return {
    id: food.id,
    name: food.name,
    brand: 'USDA',
    calories: food.kcal,
    protein: food.protein,
    carbs: food.carbs,
    fats: food.fats,
    serving_size: '100 g',
    serving_grams: 100,
    country: market,
    source: 'usda',
    browse: food.cat,
  };
}

/**
 * The country's Top 100 foods, as ranked by a model's judgement of what people there eat most, with USDA numbers.
 * Built into the app, so it opens at once and works offline.
 */
export function loadPopularFoods(country: string): Promise<PopularList> {
  const market = popularMarketFor(country);
  const known = remembered.get(market);
  if (known) return known;
  const load = lists[pathFor(market)];
  const pending = (
    load
      ? load().then((raw) => {
          const foods = (Array.isArray(raw) ? raw : []).filter(isPopularFood);
          if (foods.length === 0) throw new Error('The popular foods list is empty.');
          return { market, foods: foods.map((food) => toRecord(food, market)) };
        })
      : Promise.reject(new Error('The popular foods list is missing from this build.'))
  ).catch((err: unknown) => {
    remembered.delete(market);
    throw err;
  });
  remembered.set(market, pending);
  return pending;
}
