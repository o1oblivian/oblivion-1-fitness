import { ScannedMealBreakdown } from './mealVisionTypes';
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
      const kcal100 = Number(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0);
      const prot100 = Number(n.proteins_100g ?? n.proteins ?? 0);
      const carb100 = Number(n.carbohydrates_100g ?? n.carbohydrates ?? 0);
      const fat100 = Number(n.fat_100g ?? n.fat ?? 0);

      const prot = Math.max(0, Math.round(prot100 * scale));
      const carb = Math.max(0, Math.round(carb100 * scale));
      const fat = Math.max(0, Math.round(fat100 * scale));
      const cal = Math.max(0, Math.round(kcal100 * scale)) || Math.round(prot * 4 + carb * 4 + fat * 9);

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
      return {
        dishName: it.brand ? `${it.brand} ${it.name}` : it.name,
        servingDescription: it.portion || '1 serving',
        calories: Math.round(Number(it.calories) || 0),
        proteinGrams: Math.round(Number(it.protein) || 0),
        carbsGrams: Math.round(Number(it.carbs) || 0),
        fatsGrams: Math.round(Number(it.fats) || 0),
        confidenceScore: 100,
        ingredientsDetected: [it.category || 'Packaged Nutrition'],
        barcode: clean,
        brand: it.brand,
      };
    }
  }
  throw new Error(`Product not found for "${clean}". Try scanning nutrition label.`);
}
