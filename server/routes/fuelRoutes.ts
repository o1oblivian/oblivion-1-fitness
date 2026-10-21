import type { Express } from 'express';
import { errorMessage } from '../../shared/errorMessage';
import { SUPPLEMENT_KNOWLEDGE_BASE } from '../data/supplementKnowledgeBase';
import { generateContentWithFallback, getGenAI, parseGeminiJson } from '../lib/gemini';
import { registerBrowseFoods } from './browseFoods';
import { registerLiveFoodSearch } from './liveFoodSearch';
import { registerMealSuggestionRoute } from './mealSuggestionRoute';

/** Barcode lookup, supplement search, and the live food and meal routes registered below. */
export function registerFuelRoutes(app: Express): void {
  registerLiveFoodSearch(app);
  registerBrowseFoods(app);
  registerMealSuggestionRoute(app);

  // 2. REAL BARCODE SCANNER & OPEN FOOD FACTS LOOKUP
  app.post('/api/fuel/scan-barcode', async (req, res) => {
    try {
      const { barcode } = req.body;
      if (!barcode || typeof barcode !== 'string') {
        return res.status(400).json({ error: 'Barcode number required' });
      }

      const cleanCode = barcode.trim().replace(/[^0-9]/g, '');

      // Query OpenFoodFacts API for genuine global food products
      try {
        const offRes = await fetch(
          `https://world.openfoodfacts.org/api/v0/product/${cleanCode}.json`,
          {
            headers: { 'User-Agent': 'Oblivion1Fitness-FuelOS/1.0' },
          },
        );

        if (offRes.ok) {
          const offData = await offRes.json();
          if (offData.status === 1 && offData.product) {
            const prod = offData.product;
            const nutriments = prod.nutriments || {};

            // Use one basis for every number: per serving when the registry has it, otherwise per 100 g.
            // Mixing the two would label 100 g figures as a serving.
            const perServing =
              Number(nutriments['energy-kcal_serving']) > 0 && Boolean(prod.serving_size);
            const suffix = perServing ? '_serving' : '_100g';
            const kcal = Number(nutriments[`energy-kcal${suffix}`]);
            if (!Number.isFinite(kcal) || kcal <= 0) {
              // The registry knows the product but not its nutrition. Do not invent calories.
              return res.json({
                success: true,
                found: false,
                message: 'This product has no nutrition data. Enter it by hand.',
              });
            }
            const per = (key: string) =>
              Math.round(Number(nutriments[`${key}${suffix}`] || 0) * 10) / 10;
            const item = {
              name: prod.product_name || prod.product_name_en || `Scanned Item (${cleanCode})`,
              brand: prod.brands || '',
              portion: perServing ? String(prod.serving_size) : '100g',
              calories: Math.round(kcal),
              protein: per('proteins'),
              carbs: per('carbohydrates'),
              fats: per('fat'),
              category: 'snack',
            };

            return res.json({
              success: true,
              found: true,
              source: 'OpenFoodFacts Global Registry',
              item,
            });
          }
        }
      } catch (fetchErr) {
        console.warn('OpenFoodFacts lookup network error:', fetchErr);
      }

      // If not in OFF, provide structured estimation
      return res.json({
        success: true,
        found: false,
        barcode: cleanCode,
        message: 'Barcode recognized but not yet mapped in global registry. Quick-log enabled.',
      });
    } catch (err) {
      console.error('Error in /api/fuel/scan-barcode:', err);
      res
        .status(500)
        .json({ error: errorMessage(err, 'Internal server error during barcode lookup') });
    }
  });

  // 4. SUPPLEMENT STACK DESIGN & ONLINE SEARCH
  app.get('/api/fuel/supplement-search', async (req, res) => {
    try {
      const query = String(req.query.q || '')
        .trim()
        .toLowerCase();

      // Filter existing knowledge base
      let results = SUPPLEMENT_KNOWLEDGE_BASE;
      if (query) {
        results = SUPPLEMENT_KNOWLEDGE_BASE.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.category.toLowerCase().includes(query) ||
            s.primaryBenefits.toLowerCase().includes(query) ||
            s.mechanismOfAction.toLowerCase().includes(query),
        );
      }

      // If user queries a supplement not in the base catalog, query Gemini for real biochemical profile
      if (results.length === 0 && query.length > 2) {
        const genAI = getGenAI();
        if (genAI) {
          try {
            const prompt = `You are a clinical pharmacologist and sports biochemist.
Provide an objective scientific profile for the dietary supplement or compound "${query}".
Respond ONLY with a valid JSON object matching this schema:
{
  "name": "${query.charAt(0).toUpperCase() + query.slice(1)}",
  "category": "e.g. Cognitive / Energy / Joint / Hormone",
  "clinicalDosage": "Standard evidence-based human dosage (e.g. 500mg daily)",
  "timing": "Optimal timing (e.g. Morning with meal, Pre-workout)",
  "primaryBenefits": "Primary evidence-backed performance or health outcome",
  "mechanismOfAction": "Biochemical pathway and physiological mechanism",
  "synergyStack": "Complementary compounds it stacks well with"
}`;

            const response = await generateContentWithFallback(genAI, [
              { role: 'user', parts: [{ text: prompt }] },
            ]);

            const text = response.text || '';
            const parsed = parseGeminiJson(text);
            return res.json({
              success: true,
              supplements: [parsed],
              provider: 'gemini-clinical-search',
            });
          } catch (aiErr) {
            console.warn('Gemini supplement lookup fallback:', aiErr);
          }
        }
      }

      res.json({ success: true, supplements: results, provider: 'o1-pharmacopeia' });
    } catch (err) {
      console.error('Error in /api/fuel/supplement-search:', err);
      res
        .status(500)
        .json({ error: errorMessage(err, 'Internal server error searching supplements') });
    }
  });
}
