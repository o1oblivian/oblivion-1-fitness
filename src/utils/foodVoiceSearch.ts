import { INITIAL_FOOD_DB } from '@/data/foodDatabase';
import { FoodItem } from '@/types';

export interface MatchedFood {
  item: FoodItem;
  category: string;
  score: number;
}

export function matchFoodFromDB(query: string, maxResults = 3): MatchedFood[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: MatchedFood[] = [];

  for (const [category, items] of Object.entries(INITIAL_FOOD_DB)) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const name = item.name.toLowerCase();
      let score = 0;
      if (name === q) score = 100;
      else if (name.startsWith(q)) score = 80;
      else if (name.includes(q)) score = 60;
      else if (q.split(' ').some(w => w.length > 2 && name.includes(w))) score = 40;

      if (score > 0) {
        results.push({ item, category, score });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
}

export function extractQuantity(text: string): { grams: number; multiplier: number } {
  const gramMatch = text.match(/(\d+)\s*g(?:rams?)?/i);
  if (gramMatch) return { grams: parseInt(gramMatch[1]), multiplier: 1 };

  const numMatch = text.match(/(\d+)\s*(?:pieces?|servings?|portions?|x)/i);
  if (numMatch) return { grams: 0, multiplier: parseInt(numMatch[1]) };

  const leadingNum = text.match(/^(\d+)\s/);
  if (leadingNum) return { grams: 0, multiplier: parseInt(leadingNum[1]) };

  return { grams: 0, multiplier: 1 };
}
