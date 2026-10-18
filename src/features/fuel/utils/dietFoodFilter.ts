import type { DietFacts } from '../../../../shared/foodDiet';

const MEAT =
  /\b(chicken|beef|pork|lamb|turkey|bacon|ham|salami|chorizo|duck|bison|venison|kangaroo|boar|liver|gizzard|pepperoni|prosciutto|mince|steak|sirloin|ribeye|whopper|burger|grill'?d|nando|chipotle chicken|gyg|rotisserie)\b/i;
const LAND_MEAT =
  /\b(chicken|beef|pork|lamb|turkey|bacon|ham|salami|chorizo|duck|bison|venison|kangaroo|boar|liver|pepperoni|prosciutto|mince|steak|sirloin|ribeye|whopper|burger)\b/i;
const FISH =
  /\b(salmon|tuna|shrimp|prawn|cod|halibut|tilapia|sardine|crab|mahi|scallop|lobster|fish|basa|barramundi|anchov)\b/i;
const SHELLFISH = /\b(shrimp|prawn|crab|lobster|scallop|shellfish|mussel|oyster)\b/i;
const DAIRY =
  /\b(yogurt|yoghurt|cheese|cottage|milk|whey|casein|fairlife|chobani|fage|butter|ghee|kefir|quark|skyr|ricotta|cream|mozzarella|cheddar|fage)\b/i;
const EGG = /\begg\b/i;
const PORK = /\b(pork|bacon|ham|prosciutto|salami|chorizo|pepperoni|lard|gelatin)\b/i;
const GLUTEN =
  /\b(bread|pasta|wheat|bagel|wrap|pretzel|graham|couscous|farro|barley|weet-bix|sourdough|bun|flour|seitan)\b/i;
const ALCOHOL = /\b(wine|beer|vodka|whisky|rum|alcohol)\b/i;
const GRAIN_DAIRY =
  /\b(oat|rice|bread|pasta|yogurt|milk|cheese|whey|bean|lentil|quinoa|potato|sweet potato)\b/i;

/** Judges a food by its name alone. Used when the food database states nothing about the diet. */
function matchesByName(name: string, brand: string, protocol: string): boolean {
  const hay = `${name} ${brand}`;

  if (protocol === 'vegan') {
    return (
      !MEAT.test(hay) &&
      !FISH.test(hay) &&
      !DAIRY.test(hay) &&
      !EGG.test(hay) &&
      !/honey|collagen|gelatin/i.test(hay)
    );
  }
  if (protocol === 'vegetarian') {
    return !MEAT.test(hay) && !FISH.test(hay);
  }
  if (protocol === 'pescatarian') {
    return !LAND_MEAT.test(hay);
  }
  if (protocol === 'carnivore') {
    return isLikelyCarnivoreStaple(name, brand);
  }
  if (protocol === 'paleo') {
    return !DAIRY.test(hay) && !GLUTEN.test(hay) && !/\b(bean|lentil|peanut|soy|tofu)\b/i.test(hay);
  }
  if (protocol === 'keto') {
    const carbsHint =
      /\b(rice|oat|bread|pasta|banana|apple|potato|honey|syrup|juice|bagel|wrap|cereal)\b/i;
    return !carbsHint.test(hay);
  }
  if (protocol === 'mediterranean') {
    return !PORK.test(hay);
  }
  if (protocol === 'halal') {
    return !PORK.test(hay) && !ALCOHOL.test(hay);
  }
  if (protocol === 'kosher') {
    return !PORK.test(hay) && !SHELLFISH.test(hay);
  }
  if (protocol === 'gluten-free') {
    return !GLUTEN.test(hay);
  }
  if (protocol === 'dairy-free') {
    return !DAIRY.test(hay);
  }
  return true;
}

/** Name-only carnivore check can over-include salads named with chicken — keep inclusive for animal proteins. */
function isLikelyCarnivoreStaple(name: string, brand: string): boolean {
  const hay = `${name} ${brand}`;
  if (GRAIN_DAIRY.test(hay) && !MEAT.test(hay) && !FISH.test(hay) && !EGG.test(hay)) return false;
  return MEAT.test(hay) || FISH.test(hay) || EGG.test(hay) || /\b(whey|casein)\b/i.test(hay);
}

/** The fact each diet depends on, when a database can state it. */
const FACT_FOR_DIET: Record<string, keyof DietFacts> = {
  vegan: 'vegan',
  vegetarian: 'vegetarian',
  'gluten-free': 'glutenFree',
  'dairy-free': 'dairyFree',
  halal: 'halal',
  kosher: 'kosher',
};

interface DietCheckable {
  name: string;
  brand?: string;
  diet?: DietFacts;
}

/**
 * Whether a food fits the chosen diet. The food database's own statement (Open Food Facts
 * vegan, gluten and allergen data) decides when it has one; otherwise the food's name does.
 */
export function foodMatchesDiet(food: DietCheckable, diet?: string): boolean {
  const protocol = (diet || 'Omnivore').toLowerCase();
  if (protocol === 'omnivore') return true;

  const fact = FACT_FOR_DIET[protocol];
  const stated = fact ? food.diet?.[fact] : undefined;
  if (stated !== undefined) return stated;
  // A vegetarian product is also fine for a pescatarian.
  if (protocol === 'pescatarian' && food.diet?.vegetarian === true) return true;

  return matchesByName(food.name, food.brand ?? '', protocol);
}
