import {
  gramsInLabel,
  readGrams,
  readNutrient,
  readText,
  resolveCalories,
  ScannedMealBreakdown,
} from './mealVisionTypes';
import { apiFetch } from './apiBase';
import { ScanError, serverFailure } from './scanErrors';

/** Only the fields the scanner reads, so the reply is a few hundred bytes instead of the whole product record. */
const OFF_FIELDS =
  'product_name,product_name_en,brands,serving_size,serving_quantity,nutriments,ingredients_tags';
const OFF_TIMEOUT_MS = 5_000;
/** Open Food Facts reports every `*_100g` nutriment per 100 g of product. */
const REGISTRY_BASIS_GRAMS = 100;

/** "Acme Oat Bar" from brand and name, or `null` when the source gave neither. */
function productTitle(brand: string | null, name: string | null): string | null {
  return [brand, name].filter(Boolean).join(' ') || null;
}

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
  const brand = readText(p.brands);
  const servingLabel = readText(p.serving_size);
  const servingGrams = readGrams(p.serving_quantity) ?? gramsInLabel(servingLabel);
  // Without a serving weight the figures stay per 100 g and the athlete enters the grams eaten.
  const scale = servingGrams === null ? 1 : servingGrams / REGISTRY_BASIS_GRAMS;

  const n = p.nutriments || {};
  const perServing = (per100g: unknown): number | null =>
    readNutrient(per100g) === null ? null : readNutrient(Number(per100g) * scale);
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
    dishName: productTitle(brand, readText(p.product_name) ?? readText(p.product_name_en)),
    servingDescription: servingGrams === null ? null : servingLabel,
    servingGrams,
    per100g: servingGrams === null,
    calories: cal,
    proteinGrams: prot,
    carbsGrams: carb,
    fatsGrams: fat,
    confidenceScore: null,
    ingredientsDetected: Array.isArray(p.ingredients_tags)
      ? p.ingredients_tags.slice(0, 4).map((i: string) => i.replace(/^en:/, ''))
      : [],
    barcode: clean,
    brand: brand ?? undefined,
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
  } catch (err) {
    // The API exists but refused these formats, so this device has no usable reader.
    console.error('[Barcode] BarcodeDetector could not start', err);
    return null;
  }
}

export function canDetectBarcodes(): boolean {
  return getDetector() !== null;
}

/**
 * The barcode digits in an image or video frame, or `null` when none are in view.
 * Returns `null` without a reader on this device; throws when the reader itself fails.
 */
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
        return readText(found[0]?.rawValue);
      } finally {
        bitmap.close();
      }
    }
    const found = await reader.detect(source);
    return readText(found[0]?.rawValue);
  } catch (err) {
    const reason = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    throw new ScanError('unsupported', `The barcode reader failed. ${reason}`, { cause: err });
  }
}

/** Looks a product up by its barcode number. Names are not searched here. */
export async function lookupBarcodeNumber(barcode: string): Promise<ScannedMealBreakdown> {
  const clean = barcode.trim();
  if (!/^\d{6,14}$/.test(clean)) {
    throw new Error('Enter the digits printed under the barcode, 6 to 14 numbers.');
  }
  const notFound = (message?: string) =>
    new ScanError(
      'not_found',
      message || `No product found for ${clean}. Photograph the Nutrition Facts panel instead.`,
    );

  let registryError: unknown;
  try {
    const found = await fetchOpenFoodFactsProduct(clean);
    if (found) return found;
    // The registry answered and does not know this code; asking the server would query the same registry again.
    throw notFound();
  } catch (err) {
    if (err instanceof ScanError) throw err;
    // The registry could not be reached from this device; the server can try from its side.
    console.warn('[Barcode] Open Food Facts unreachable from the device', err);
    registryError = err;
  }

  let res: Response;
  try {
    res = await apiFetch('/api/fuel/scan-barcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: clean }),
    });
  } catch (err) {
    throw new ScanError(
      'network',
      'Barcode lookup failed: no connection to the food registry or the server.',
      { cause: { registry: registryError, server: err } },
    );
  }
  if (!res.ok) throw await serverFailure(res, 'Barcode lookup');

  const data = await res.json().catch((err: unknown) => {
    throw new ScanError('server', 'Barcode lookup failed: the server reply was unreadable.', {
      status: res.status,
      cause: err,
    });
  });
  if (!data.found || !data.item) throw notFound(readText(data.message) ?? undefined);

  const it = data.item;
  const prot = readNutrient(it.protein);
  const carb = readNutrient(it.carbs);
  const fat = readNutrient(it.fats);
  const portion = readText(it.portion);
  return {
    dishName: productTitle(readText(it.brand), readText(it.name)),
    servingDescription: portion,
    servingGrams: readGrams(it.portionGrams) ?? gramsInLabel(portion),
    per100g: it.per100g === true,
    calories: resolveCalories(readNutrient(it.calories), prot, carb, fat),
    proteinGrams: prot,
    carbsGrams: carb,
    fatsGrams: fat,
    confidenceScore: null,
    ingredientsDetected: [],
    barcode: clean,
    brand: readText(it.brand) ?? undefined,
  };
}
