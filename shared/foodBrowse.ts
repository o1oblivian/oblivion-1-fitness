/**
 * The categories on the Add Food screen. Only names and a plain-words hint for the live
 * recommender live here; every food and every number in a category comes from the live databases.
 */
export const FOOD_BROWSE_CATEGORIES = [
  {
    id: 'protein',
    label: 'Protein',
    hint: 'meat, poultry, fish, seafood, eggs, tofu, tempeh, legumes and protein powders',
  },
  {
    id: 'carbs',
    label: 'Carbs',
    hint: 'rice, pasta, bread, oats, potatoes, cereals, tortillas, noodles and grains',
  },
  {
    id: 'fats',
    label: 'Fats',
    hint: 'nuts, seeds, nut butters, oils, avocado, olives, cheese and fatty fish',
  },
  { id: 'veg', label: 'Veg', hint: 'vegetables and salad ingredients, raw or cooked' },
  { id: 'fruit', label: 'Fruit', hint: 'fresh, dried and frozen fruit' },
  {
    id: 'dairy',
    label: 'Dairy',
    hint: 'milk, yoghurt, cheese, cottage cheese, kefir and dairy alternatives',
  },
  {
    id: 'snacks',
    label: 'Snacks',
    hint: 'protein bars, crackers, chips, biscuits, chocolate, popcorn and lollies',
  },
  {
    id: 'drinks',
    label: 'Drinks',
    hint: 'water, coffee, tea, juice, soft drinks, sports drinks, protein shakes and alcohol',
  },
  {
    id: 'fastfood',
    label: 'Fast food',
    hint: 'burgers, pizza, fried chicken, wraps, fries and other takeaway meals',
  },
] as const;

export type FoodBrowseId = (typeof FOOD_BROWSE_CATEGORIES)[number]['id'];

export function foodBrowseCategory(id: unknown) {
  return FOOD_BROWSE_CATEGORIES.find((category) => category.id === id) ?? null;
}
