import { describe, expect, it } from 'vitest';
import {
  categoryOf,
  createSearchPacer,
  genericFoodsFor,
  interleave,
  offBrowseUrl,
  offCountryTag,
  searchGeneric,
} from './browseFoods';
import type { CatalogFood } from './usdaCatalog';

function food(name: string, id = name): CatalogFood {
  return { id: `usda-${id}`, name, group: '', calories: 100, protein: 10, carbs: 5, fats: 2 };
}

describe('categoryOf', () => {
  it('files plain foods under the category their USDA name starts with', () => {
    expect(categoryOf(food('Chicken, broilers or fryers, breast, cooked'))).toBe('protein');
    expect(categoryOf(food('Rice, white, long-grain, cooked'))).toBe('carbs');
    expect(categoryOf(food('Nuts, almonds'))).toBe('fats');
    expect(categoryOf(food('Broccoli, cooked, boiled'))).toBe('veg');
    expect(categoryOf(food('Bananas, raw'))).toBe('fruit');
    expect(categoryOf(food('Cheese, cheddar'))).toBe('dairy');
    expect(categoryOf(food('Candies, milk chocolate'))).toBe('snacks');
    expect(categoryOf(food('Beverages, tea, brewed'))).toBe('drinks');
    expect(categoryOf(food('Orange juice, raw'))).toBe('drinks');
    expect(categoryOf(food('Fast foods, hamburger, large'))).toBe('fastfood');
  });

  it('keeps snap beans with the vegetables and dry beans with the protein', () => {
    expect(categoryOf(food('Beans, snap, green, raw'))).toBe('veg');
    expect(categoryOf(food('Beans, kidney, mature seeds, cooked'))).toBe('protein');
  });

  it('leaves out baby food, soups, sauces and American brand names', () => {
    expect(categoryOf(food('Babyfood, cereal, rice'))).toBeNull();
    expect(categoryOf(food('Soup, chicken noodle'))).toBeNull();
    expect(categoryOf(food('Fish broth'))).toBeNull();
    expect(categoryOf(food("Cereals ready-to-eat, KELLOGG'S ALL-BRAN"))).toBeNull();
  });

  it('keeps takeaway chains, whose names are written in capitals', () => {
    expect(categoryOf(food("McDONALD'S, Big Mac"))).toBe('fastfood');
  });
});

describe('genericFoodsFor', () => {
  const catalog = [
    food('Chicken, breast, cooked', '1'),
    food('Chicken, breast, raw', '2'),
    food('Chicken, breast, cooked', '3'),
    food('Egg', '4'),
    food('Rice, white, cooked', '5'),
  ];

  it('returns one category with nothing repeated', () => {
    const rows = genericFoodsFor('protein', catalog);
    expect(rows.map((r) => r.name)).toEqual([
      'Egg',
      'Chicken, breast, cooked',
      'Chicken, breast, raw',
    ]);
  });

  it('labels plain foods Generic, not with the database name', () => {
    expect(genericFoodsFor('carbs', catalog)[0].brand).toBe('Generic');
  });

  it('respects the limit', () => {
    expect(genericFoodsFor('protein', catalog, 1)).toHaveLength(1);
  });

  it('names the chain on a takeaway item', () => {
    const rows = genericFoodsFor('fastfood', [food("McDONALD'S, Big Mac", 'm')]);
    expect(rows[0]).toMatchObject({ brand: "McDonald's", name: "McDonald's Big Mac" });
  });

  it('calls generic takeaway Takeaway', () => {
    const rows = genericFoodsFor('fastfood', [food('Fast foods, hamburger, large', 'h')]);
    expect(rows[0]).toMatchObject({ brand: 'Takeaway', name: 'Hamburger, large' });
  });
});

describe('searchGeneric', () => {
  const catalog = [
    food('Egg, whole, cooked, hard-boiled'),
    food('Egg, whole, raw, fresh'),
    food('Bread, egg'),
    food('Chicken, broilers or fryers, breast, meat only, cooked, roasted'),
    food('Babyfood, egg yolks'),
    food("KELLOGG'S, Corn Flakes"),
    food("McDONALD'S, Big Mac"),
    food('Soup, chicken noodle, canned'),
  ];

  it('finds a food by the start of its words, plural or not', () => {
    expect(searchGeneric(catalog, 'eggs', 10).map((f) => f.name)).toContain(
      'Egg, whole, cooked, hard-boiled',
    );
    expect(searchGeneric(catalog, 'chick bre', 10)[0].name).toMatch(/^Chicken/);
  });

  it('ranks a plural query like the singular name, and drops the USDA programme note', () => {
    const rows = searchGeneric(
      [
        food('Eggs, scrambled, frozen mixture'),
        food('Egg, whole, cooked, hard-boiled'),
        food("Oats (Includes foods for USDA's Food Distribution Program)"),
      ],
      'eggs',
      10,
    );
    expect(rows.map((r) => r.name)).toContain('Egg, whole, cooked, hard-boiled');
    const oats = searchGeneric(
      [food("Oats (Includes foods for USDA's Food Distribution Program)")],
      'oats',
      5,
    );
    expect(oats.map((r) => r.name)).toEqual(['Oats']);
  });

  it('puts foods that lead with the typed word first, plainer forms ahead', () => {
    const names = searchGeneric(catalog, 'egg', 10).map((f) => f.name);
    expect(names.indexOf('Bread, egg')).toBeGreaterThan(names.indexOf('Egg, whole, raw, fresh'));
    expect(names[0]).toBe('Egg, whole, cooked, hard-boiled');
  });

  it('leaves out baby food and American brand names but keeps takeaway chains', () => {
    expect(searchGeneric(catalog, 'egg', 10).map((f) => f.name)).not.toContain(
      'Babyfood, egg yolks',
    );
    expect(searchGeneric(catalog, 'kellogg', 10)).toEqual([]);
    expect(searchGeneric(catalog, 'big mac', 10)[0]).toMatchObject({ brand: "McDonald's" });
  });

  it('returns nothing for an empty or unmatched query and respects the limit', () => {
    expect(searchGeneric(catalog, '  ', 10)).toEqual([]);
    expect(searchGeneric(catalog, 'zzzz', 10)).toEqual([]);
    expect(searchGeneric(catalog, 'egg', 1)).toHaveLength(1);
  });
});

describe('offCountryTag', () => {
  it('turns a country code into the Open Food Facts tag', () => {
    expect(offCountryTag('AU')).toBe('australia');
    expect(offCountryTag('gb')).toBe('united-kingdom');
    expect(offCountryTag('CZ')).toBe('czech-republic');
    expect(offCountryTag('NZ')).toBe('new-zealand');
  });

  it('rejects what is not a country code', () => {
    expect(offCountryTag('')).toBeNull();
    expect(offCountryTag('AUS')).toBeNull();
    expect(offCountryTag('1')).toBeNull();
  });
});

describe('offBrowseUrl', () => {
  it('asks for one country and one category, most scanned first', () => {
    const url = offBrowseUrl('australia', 'meats', 50);
    expect(url).toContain('countries_tags_en=australia');
    expect(url).toContain('categories_tags_en=meats');
    expect(url).toContain('sort_by=unique_scans_n');
    expect(url).toContain('page_size=50');
  });
});

describe('createSearchPacer', () => {
  it('lets a search start at once while under the limit', () => {
    let t = 0;
    const pace = createSearchPacer(2, 10_000, () => t);
    expect(pace()).toBe(0);
    t = 1_000;
    expect(pace()).toBe(0);
  });

  it('queues a search until the oldest one is a minute old', () => {
    let t = 0;
    const pace = createSearchPacer(2, 70_000, () => t);
    pace();
    t = 5_000;
    pace();
    t = 10_000;
    expect(pace()).toBe(50_000);
  });

  it('refuses a search that would wait too long, and books nothing', () => {
    let t = 0;
    const pace = createSearchPacer(1, 8_000, () => t);
    expect(pace()).toBe(0);
    t = 1_000;
    expect(pace()).toBeNull();
    t = 60_000;
    expect(pace()).toBe(0);
  });
});

describe('interleave', () => {
  it('takes from each list in turn up to the limit', () => {
    expect(interleave([[1, 2, 3], [4, 5], [6]], 5)).toEqual([1, 4, 6, 2, 5]);
  });

  it('copes with no lists', () => {
    expect(interleave([], 5)).toEqual([]);
  });
});
