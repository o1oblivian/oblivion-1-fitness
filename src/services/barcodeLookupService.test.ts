import { afterEach, describe, expect, it, vi } from 'vitest';

const apiFetch = vi.fn();
vi.mock('./apiBase', () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));

import { lookupBarcodeNumber } from './barcodeLookupService';
import { ScanError } from './scanErrors';

const product = {
  status: 1,
  product: {
    product_name: 'Oat Bar',
    brands: 'Acme',
    serving_size: '40 g',
    nutriments: {
      'energy-kcal_100g': 400,
      proteins_100g: 10,
      carbohydrates_100g: 60,
      fat_100g: 12,
    },
  },
};

function registryAnswers(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  apiFetch.mockReset();
});

describe('lookupBarcodeNumber', () => {
  it('reads a product straight from the registry, scaled to one serving', async () => {
    registryAnswers(200, product);
    const meal = await lookupBarcodeNumber('5012345678900');
    expect(meal).toMatchObject({
      dishName: 'Acme Oat Bar',
      calories: 160,
      proteinGrams: 4,
      carbsGrams: 24,
      fatsGrams: 5,
      barcode: '5012345678900',
    });
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('asks only for the fields it reads', async () => {
    registryAnswers(200, product);
    await lookupBarcodeNumber('5012345678900');
    const url = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(url).toContain('fields=');
    expect(url).toContain('nutriments');
  });

  it('stops when the registry does not know the code instead of asking the server to repeat it', async () => {
    registryAnswers(404, { status: 0 });
    await expect(lookupBarcodeNumber('5012345678900')).rejects.toThrow(/No product found/);
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('tries the server when the registry cannot be reached from the phone', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')));
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        found: true,
        item: {
          name: 'Oat Bar',
          brand: 'Acme',
          portion: '40g',
          calories: 160,
          protein: 4,
          carbs: 24,
          fats: 5,
        },
      }),
    });
    const meal = await lookupBarcodeNumber('5012345678900');
    expect(meal.dishName).toBe('Acme Oat Bar');
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('reports a server failure as a server error, not as an unknown product', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')));
    apiFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'The food registry could not be reached. Try again.' }),
    });
    const err = await lookupBarcodeNumber('5012345678900').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ScanError);
    expect(err).toMatchObject({ code: 'server', status: 502 });
    expect((err as Error).message).not.toMatch(/No product found/);
  });

  it('reports a dropped connection on both routes as a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')));
    apiFetch.mockRejectedValue(new TypeError('network down'));
    await expect(lookupBarcodeNumber('5012345678900')).rejects.toMatchObject({ code: 'network' });
  });

  it('leaves the serving empty for the athlete and invents no confidence or ingredients', async () => {
    registryAnswers(200, {
      status: 1,
      product: {
        product_name: 'Oat Bar',
        nutriments: { 'energy-kcal_100g': 400, proteins_100g: 10, carbohydrates_100g: 60 },
      },
    });
    const meal = await lookupBarcodeNumber('5012345678900');
    expect(meal).toMatchObject({
      dishName: 'Oat Bar',
      servingDescription: null,
      servingGrams: null,
      per100g: true,
      calories: 400,
      proteinGrams: 10,
      fatsGrams: null,
      confidenceScore: null,
      ingredientsDetected: [],
    });
  });

  it('leaves the name empty when the registry has none', async () => {
    registryAnswers(200, { status: 1, product: { nutriments: { 'energy-kcal_100g': 120 } } });
    expect((await lookupBarcodeNumber('5012345678900')).dishName).toBeNull();
  });

  it('rejects text that is not a barcode number before any request', async () => {
    registryAnswers(200, product);
    await expect(lookupBarcodeNumber('protein bar')).rejects.toThrow(/digits/);
    expect(fetch).not.toHaveBeenCalled();
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
