import { readNutrient, resolveCalories, ScannedMealBreakdown } from './mealVisionTypes';
import { apiUrl } from './apiBase';

export async function fetchOpenFoodFactsProduct(barcode: string): Promise<ScannedMealBreakdown | null> {
  const clean = barcode.trim();
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${clean}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 1 && data.product) {
      const p = data.product;
      const name = p.product_name || p.product_name_en || (p.brands ? `${p.brands} Product` : 'Packaged Food');
      const servingStr = p.serving_size || (p.serving_quantity ? `${p.serving_quantity}g` : '100g');
      const grams = parseInt(servingStr.match(/(\d+)\s*g/i)?.[1] || '100', 10);
      const scale = grams > 0 ? grams / 100 : 1;

      const n = p.nutriments || {};
      const perServing = (per100g: unknown): number | null => {
        const value = readNutrient(per100g);
        return value === null ? null : readNutrient(Number(per100g) * scale);
      };
      const prot = perServing(n.proteins_100g ?? n.proteins);
      const carb = perServing(n.carbohydrates_100g ?? n.carbohydrates);
      const fat = perServing(n.fat_100g ?? n.fat);
      const cal = resolveCalories(perServing(n['energy-kcal_100g'] ?? n['energy-kcal']), prot, carb, fat);

      return {
        dishName: p.brands ? `${p.brands} ${name}` : name,
        servingDescription: `${grams}g (${servingStr})`,
        calories: cal,
        proteinGrams: prot,
        carbsGrams: carb,
        fatsGrams: fat,
        confidenceScore: 100,
        ingredientsDetected: Array.isArray(p.ingredients_tags) && p.ingredients_tags.length
          ? p.ingredients_tags.slice(0, 4).map((i: string) => i.replace(/^en:/, ''))
          : ['OpenFoodFacts Verified Match'],
        barcode: clean,
        brand: p.brands,
      };
    }
  } catch {}
  return null;
}

export async function tryDetectNativeBarcode(source: Blob | HTMLVideoElement): Promise<string | null> {
  if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return null;
  try {
    const detector = new (window as any).BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
    });
    if (source instanceof Blob) {
      const img = new Image();
      const url = URL.createObjectURL(source);
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const barcodes = await detector.detect(img);
      URL.revokeObjectURL(url);
      return barcodes?.[0]?.rawValue?.trim() || null;
    } else {
      const barcodes = await detector.detect(source);
      return barcodes?.[0]?.rawValue?.trim() || null;
    }
  } catch {
    return null;
  }
}

export async function lookupBarcodeNumber(barcodeOrQuery: string): Promise<ScannedMealBreakdown> {
  const clean = barcodeOrQuery.trim();
  const offResult = await fetchOpenFoodFactsProduct(clean);
  if (offResult) return offResult;

  const res = await fetch(apiUrl('/api/fuel/scan-barcode'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barcode: clean }),
  });
  if (res.ok) {
    const data = await res.json();
    if (data.found && data.item) {
      const it = data.item;
      const prot = readNutrient(it.protein);
      const carb = readNutrient(it.carbs);
      const fat = readNutrient(it.fats);
      return {
        dishName: it.brand ? `${it.brand} ${it.name}` : it.name,
        servingDescription: it.portion || '1 serving',
        calories: resolveCalories(readNutrient(it.calories), prot, carb, fat),
        proteinGrams: prot,
        carbsGrams: carb,
        fatsGrams: fat,
        confidenceScore: 100,
        ingredientsDetected: [it.category || 'Packaged Nutrition'],
        barcode: clean,
        brand: it.brand,
      };
    }
  }
  throw new Error(`Product not found for "${clean}". Try scanning nutrition label.`);
}
