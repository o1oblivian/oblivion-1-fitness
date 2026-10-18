import { readNutrient, resolveCalories, ScannedMealBreakdown } from './mealVisionTypes';
import { apiFetch } from './apiBase';

/** Only the fields the scanner reads, so the reply is a few hundred bytes instead of the whole product record. */
const OFF_FIELDS =
  'product_name,product_name_en,brands,serving_size,serving_quantity,nutriments,ingredients_tags';
const OFF_TIMEOUT_MS = 5_000;

/**
 * Reads one product from the Open Food Facts registry.
 * Returns null when the registry does not know the code; throws when it could not be reached.
 */
async function fetchOpenFoodFactsProduct(barcode: string): Promise<ScannedMealBreakdown | null> {
  const clean = barcode.trim();
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(clean)}.json?fields=${OFF_FIELDS}`,
    { signal: AbortSignal.timeout(OFF_TIMEOUT_MS) },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts answered ${res.status}`);
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const name =
    p.product_name || p.product_name_en || (p.brands ? `${p.brands} Product` : 'Packaged Food');
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
  const cal = resolveCalories(
    perServing(n['energy-kcal_100g'] ?? n['energy-kcal']),
    prot,
    carb,
    fat,
  );

  return {
    dishName: p.brands ? `${p.brands} ${name}` : name,
    servingDescription: `${grams}g (${servingStr})`,
    calories: cal,
    proteinGrams: prot,
    carbsGrams: carb,
    fatsGrams: fat,
    confidenceScore: 100,
    ingredientsDetected:
      Array.isArray(p.ingredients_tags) && p.ingredients_tags.length
        ? p.ingredients_tags.slice(0, 4).map((i: string) => i.replace(/^en:/, ''))
        : ['OpenFoodFacts Verified Match'],
    barcode: clean,
    brand: p.brands,
  };
}

/** The browser's built-in barcode reader, which TypeScript's DOM types do not describe. */
interface BarcodeDetectorLike {
  detect(source: Blob | HTMLImageElement | HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
}
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorLike;

let detector: BarcodeDetectorLike | null = null;

/** One reader for the whole session; building it per frame made live scanning stutter. */
function getDetector(): BarcodeDetectorLike | null {
  if (detector) return detector;
  if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return null;
  try {
    const Detector = (window as unknown as { BarcodeDetector: BarcodeDetectorConstructor })
      .BarcodeDetector;
    detector = new Detector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
    });
    return detector;
  } catch {
    return null;
  }
}

export function canDetectBarcodes(): boolean {
  return getDetector() !== null;
}

export async function tryDetectNativeBarcode(
  source: Blob | HTMLVideoElement,
): Promise<string | null> {
  const reader = getDetector();
  if (!reader) return null;
  try {
    if (source instanceof Blob) {
      const bitmap = await createImageBitmap(source);
      try {
        const found = await reader.detect(bitmap as unknown as HTMLImageElement);
        return found?.[0]?.rawValue?.trim() || null;
      } finally {
        bitmap.close();
      }
    }
    const found = await reader.detect(source);
    return found?.[0]?.rawValue?.trim() || null;
  } catch {
    return null;
  }
}

/** Looks a product up by its barcode number. Names are not searched here. */
export async function lookupBarcodeNumber(barcode: string): Promise<ScannedMealBreakdown> {
  const clean = barcode.trim();
  if (!/^\d{6,14}$/.test(clean)) {
    throw new Error('Enter the digits printed under the barcode, 6 to 14 numbers.');
  }
  const notFound = new Error(
    `No product found for ${clean}. Photograph the Nutrition Facts panel instead.`,
  );

  try {
    const found = await fetchOpenFoodFactsProduct(clean);
    if (found) return found;
    // The registry answered and does not know this code; asking the server would query the same registry again.
    throw notFound;
  } catch (err) {
    if (err === notFound) throw err;
    // The registry could not be reached from this device; the server can try from its side.
  }

  const res = await apiFetch('/api/fuel/scan-barcode', {
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
  throw notFound;
}
