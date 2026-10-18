import type { DietFacts } from '../../shared/foodDiet';

/** The tag lists Open Food Facts attaches to a product. */
export interface OffDietTags {
  labels_tags?: string[];
  allergens_tags?: string[];
  ingredients_analysis_tags?: string[];
}

const has = (tags: string[] | undefined, ...wanted: string[]): boolean =>
  Array.isArray(tags) && wanted.some((tag) => tags.includes(tag));

/**
 * Reads diet suitability from Open Food Facts' own analysis, labels and allergen list.
 * Only what the product record states is returned; anything it is silent on stays unknown,
 * so the app can fall back to judging by the food's name.
 */
export function dietFactsFromOff(product: OffDietTags): DietFacts | undefined {
  const analysis = product.ingredients_analysis_tags;
  const labels = product.labels_tags;
  const allergens = product.allergens_tags;
  const facts: DietFacts = {};

  if (has(analysis, 'en:vegan') || has(labels, 'en:vegan')) {
    facts.vegan = true;
    facts.vegetarian = true;
    facts.dairyFree = true;
  } else if (has(analysis, 'en:non-vegan')) {
    facts.vegan = false;
  }

  if (has(analysis, 'en:non-vegetarian')) {
    facts.vegetarian = false;
    facts.vegan = false;
  } else if (has(analysis, 'en:vegetarian') || has(labels, 'en:vegetarian')) {
    facts.vegetarian = true;
  }

  if (has(allergens, 'en:gluten')) facts.glutenFree = false;
  else if (has(labels, 'en:gluten-free', 'en:no-gluten')) facts.glutenFree = true;

  if (has(allergens, 'en:milk')) facts.dairyFree = false;
  else if (has(labels, 'en:dairy-free', 'en:no-dairy', 'en:no-milk')) facts.dairyFree = true;

  if (has(labels, 'en:halal')) facts.halal = true;
  if (has(labels, 'en:kosher')) facts.kosher = true;

  return Object.keys(facts).length > 0 ? facts : undefined;
}
