import type { Express } from 'express';
import { generateContentWithFallback, getGenAI, parseGeminiJson } from '../lib/gemini';
import { lookupPer100g } from '../lib/usda';
import {
  buildMeal,
  buildPrompt,
  parseDraftMeals,
  parseRequest,
  rankMeals,
  type ResolvedIngredient,
} from '../lib/mealPlanner';
import type { MealSuggestion } from '../../shared/mealSuggestion';

/**
 * Live meal ideas sized to one meal's calories. Gemini proposes the meals; every ingredient is then
 * looked up in USDA FoodData Central and all numbers are recomputed from those values.
 */
export function registerMealSuggestionRoute(app: Express): void {
  app.post('/api/fuel/meal-suggestions', async (req, res) => {
    const request = parseRequest(req.body);
    if (!request) return res.status(400).json({ error: 'Send a meal slot and a calorie target.' });

    const apiKey = String(process.env.USDA_FDC_API_KEY || '').trim();
    const genAI = getGenAI();
    if (!genAI || !apiKey) {
      const missing = [!genAI ? 'Gemini' : '', !apiKey ? 'USDA' : ''].filter(Boolean).join(' and ');
      return res
        .status(503)
        .json({ error: `Meal ideas are not set up on the server (${missing} key missing).` });
    }

    try {
      const response = await generateContentWithFallback(
        genAI,
        [{ role: 'user', parts: [{ text: buildPrompt(request) }] }],
        { responseMimeType: 'application/json', temperature: 0.8 },
      );
      const drafts = parseDraftMeals(parseGeminiJson(response.text || ''));

      const meals: MealSuggestion[] = [];
      for (const [index, draft] of drafts.entries()) {
        const looked = await Promise.all(
          draft.ingredients.map(async (draftIngredient): Promise<ResolvedIngredient | null> => {
            try {
              const food = await lookupPer100g(draftIngredient.food, apiKey);
              return food
                ? {
                    draft: draftIngredient,
                    per100g: {
                      calories: food.calories,
                      protein: food.protein,
                      carbs: food.carbs,
                      fats: food.fats,
                    },
                  }
                : null;
            } catch {
              return null;
            }
          }),
        );
        const resolved = looked.filter((r): r is ResolvedIngredient => r !== null);
        const meal = buildMeal(
          draft,
          resolved,
          request.target,
          `live-${Date.now().toString(36)}-${index}`,
        );
        if (meal) meals.push(meal);
      }

      const ranked = rankMeals(meals);
      if (ranked.length === 0) {
        return res
          .status(502)
          .json({ error: 'No meal came close enough to the calorie target. Try refreshing.' });
      }
      return res.json({ success: true, meals: ranked });
    } catch (err) {
      console.warn('[meal-suggestions] failed:', err instanceof Error ? err.message : err);
      return res
        .status(502)
        .json({ error: 'The meal service did not answer. Try again in a moment.' });
    }
  });
}
