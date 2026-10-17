import type { Express } from 'express';
import { SUPPLEMENT_KNOWLEDGE_BASE } from '../data/supplementKnowledgeBase';
import { VERIFIED_BARCODES } from '../data/verifiedBarcodes';
import { generateContentWithFallback, getGenAI, parseGeminiJson } from '../lib/gemini';

/** Barcode lookup, live food search and supplement search. */
export function registerFuelRoutes(app: Express): void {
  // 2. REAL BARCODE SCANNER & OPEN FOOD FACTS LOOKUP
  app.post('/api/fuel/scan-barcode', async (req, res) => {
    try {
      const { barcode } = req.body;
      if (!barcode || typeof barcode !== 'string') {
        return res.status(400).json({ error: 'Barcode number required' });
      }

      const cleanCode = barcode.trim().replace(/[^0-9]/g, '');

      // Check verified local database first
      if (VERIFIED_BARCODES[cleanCode]) {
        return res.json({
          success: true,
          found: true,
          source: 'O1 Verified Fitness Catalog',
          item: VERIFIED_BARCODES[cleanCode],
        });
      }

      // Query OpenFoodFacts API for genuine global food products
      try {
        const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${cleanCode}.json`, {
          headers: { 'User-Agent': 'Oblivion1Fitness-FuelOS/1.0' },
        });

        if (offRes.ok) {
          const offData = await offRes.json();
          if (offData.status === 1 && offData.product) {
            const prod = offData.product;
            const nutriments = prod.nutriments || {};

            // Use one basis for every number: per serving when the registry has it, otherwise per 100 g.
            // Mixing the two would label 100 g figures as a serving.
            const perServing = Number(nutriments['energy-kcal_serving']) > 0 && Boolean(prod.serving_size);
            const suffix = perServing ? '_serving' : '_100g';
            const kcal = Number(nutriments[`energy-kcal${suffix}`]);
            if (!Number.isFinite(kcal) || kcal <= 0) {
              // The registry knows the product but not its nutrition. Do not invent calories.
              return res.json({ success: true, found: false, message: 'This product has no nutrition data. Enter it by hand.' });
            }
            const per = (key: string) => Math.round(Number(nutriments[`${key}${suffix}`] || 0) * 10) / 10;
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
    } catch (err: any) {
      console.error('Error in /api/fuel/scan-barcode:', err);
      res.status(500).json({ error: err.message || 'Internal server error during barcode lookup' });
    }
  });

  // Live branded search: OpenFoodFacts. Optional USDA FDC overlay for US when USDA_FDC_API_KEY is set.
  app.get('/api/fuel/live-food-search', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      const country = String(req.query.country || 'AU').toUpperCase();
      const category = String(req.query.category || 'protein').toLowerCase();
      const limit = Math.min(Number(req.query.limit) || 40, 100);

      if (!q) {
        return res.json({ success: true, items: [], source: 'none', live: false });
      }

      const items: any[] = [];
      const domainMap: Record<string, string> = {
        AU: 'au', US: 'us', GB: 'uk', DE: 'de', FR: 'fr',
        IT: 'it', ES: 'es', NL: 'nl', CA: 'ca', JP: 'jp',
        IN: 'in', BR: 'br', MX: 'mx', ZA: 'za', NZ: 'nz',
      };
      const offDomain = domainMap[country] || 'world';

      try {
        const offUrl = `https://${offDomain}.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          q
        )}&search_simple=1&action=process&json=1&page_size=${Math.min(limit * 2, 40)}`;

        const offRes = await fetch(offUrl, {
          headers: {
            'User-Agent': 'Oblivion1Fitness-FuelOS/1.0 (o1oblivionfitness@gmail.com)',
            Accept: 'application/json',
          },
        });

        if (offRes.ok) {
          const offData = await offRes.json();
          if (Array.isArray(offData.products)) {
            for (const p of offData.products) {
              if (!p || (!p.product_name && !p.product_name_en)) continue;
              const name = (p.product_name || p.product_name_en || 'Food Item').trim();
              const brand = (p.brands || p.brand_owner || 'OpenFoodFacts').split(',')[0].trim();

              const rawKcal =
                p.nutriments?.['energy-kcal_100g'] ??
                p.nutriments?.['energy-kcal'] ??
                p.nutriments?.['energy-kcal_serving'] ??
                (p.nutriments?.['energy-kj_100g'] ? p.nutriments['energy-kj_100g'] / 4.184 : 0);

              const calories = Math.round(Number(rawKcal) || 0);
              const protein = Math.round((Number(p.nutriments?.proteins_100g ?? p.nutriments?.proteins ?? 0)) * 10) / 10;
              const carbs = Math.round((Number(p.nutriments?.carbohydrates_100g ?? p.nutriments?.carbohydrates ?? 0)) * 10) / 10;
              const fats = Math.round((Number(p.nutriments?.fat_100g ?? p.nutriments?.fat ?? 0)) * 10) / 10;

              if (calories <= 0 && protein <= 0 && carbs <= 0 && fats <= 0) continue;

              const rawServing = String(p.serving_size || '100g').trim();
              let servingGrams = 100;
              const match = rawServing.match(/(\d+(?:\.\d+)?)\s*(?:g|ml)/i);
              if (match) {
                servingGrams = parseFloat(match[1]) || 100;
              }

              items.push({
                id: `off-${p.code || Math.random().toString(36).slice(2, 9)}`,
                name,
                brand,
                calories,
                protein,
                carbs,
                fats,
                servingSize: rawServing,
                servingGrams,
                category,
                country,
                source: 'openfoodfacts',
              });

              if (items.length >= limit) break;
            }
          }
        }
      } catch (offErr) {
        console.warn('OpenFoodFacts proxy search failed:', offErr);
      }

      const fdcKey = String(process.env.USDA_FDC_API_KEY || '').trim();
      if (fdcKey && country === 'US' && items.length < limit) {
        try {
          const fdcUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(fdcKey)}&query=${encodeURIComponent(q)}&pageSize=${Math.min(20, limit)}&dataType=Foundation,SR Legacy,Branded`;
          const fdcRes = await fetch(fdcUrl, { headers: { Accept: 'application/json' } });
          if (fdcRes.ok) {
            const fdcData = await fdcRes.json();
            const seen = new Set(items.map((it) => String(it.name).toLowerCase()));
            for (const food of fdcData.foods || []) {
              const name = String(food.description || '').trim();
              if (!name) continue;
              const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];
              const pick = (names: string[]) => {
                const row = nutrients.find((n: any) => names.includes(String(n.nutrientName || n.nutrient?.name || '')));
                return Number(row?.value ?? row?.amount ?? 0) || 0;
              };
              const calories = Math.round(pick(['Energy', 'Energy (Atwater General Factors)', 'Calories']));
              const protein = Math.round(pick(['Protein']) * 10) / 10;
              const carbs = Math.round(pick(['Carbohydrate, by difference', 'Carbohydrate']) * 10) / 10;
              const fats = Math.round(pick(['Total lipid (fat)', 'Total fat (NLEA)', 'Fat']) * 10) / 10;
              if (calories <= 0 && protein <= 0 && carbs <= 0 && fats <= 0) continue;
              if (seen.has(name.toLowerCase())) continue;
              seen.add(name.toLowerCase());
              items.push({
                id: `usda-${food.fdcId}`,
                name,
                brand: food.brandOwner || food.brandName || 'USDA FDC',
                calories,
                protein,
                carbs,
                fats,
                servingSize: '100g',
                servingGrams: 100,
                category,
                country: 'US',
                source: 'usda',
              });
              if (items.length >= limit) break;
            }
          }
        } catch (fdcErr) {
          console.warn('USDA FDC overlay failed:', fdcErr);
        }
      }

      const sources = Array.from(new Set(items.map((it) => it.source).filter(Boolean)));
      res.json({
        success: true,
        items,
        source: sources.includes('usda') ? 'openfoodfacts+usda' : 'openfoodfacts',
        live: true,
      });
    } catch (err: any) {
      console.error('Error in /api/fuel/live-food-search:', err);
      res.status(500).json({ error: err.message || 'Error searching live food database' });
    }
  });

  // 4. SUPPLEMENT STACK DESIGN & ONLINE SEARCH
  app.get('/api/fuel/supplement-search', async (req, res) => {
    try {
      const query = String(req.query.q || '').trim().toLowerCase();

      // Filter existing knowledge base
      let results = SUPPLEMENT_KNOWLEDGE_BASE;
      if (query) {
        results = SUPPLEMENT_KNOWLEDGE_BASE.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.category.toLowerCase().includes(query) ||
            s.primaryBenefits.toLowerCase().includes(query) ||
            s.mechanismOfAction.toLowerCase().includes(query)
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

            const response = await generateContentWithFallback(genAI, [{ role: 'user', parts: [{ text: prompt }] }]);

            const text = response.text || '';
            const parsed = parseGeminiJson(text);
            return res.json({ success: true, supplements: [parsed], provider: 'gemini-clinical-search' });
          } catch (aiErr) {
            console.warn('Gemini supplement lookup fallback:', aiErr);
          }
        }
      }

      res.json({ success: true, supplements: results, provider: 'o1-pharmacopeia' });
    } catch (err: any) {
      console.error('Error in /api/fuel/supplement-search:', err);
      res.status(500).json({ error: err.message || 'Internal server error searching supplements' });
    }
  });
}
