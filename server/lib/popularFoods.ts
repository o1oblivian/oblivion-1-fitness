/** Asks a model which foods a country eats most, then reads its answer defensively. */
import { FOOD_BROWSE_CATEGORIES, type FoodBrowseId } from '../../shared/foodBrowse';
import { isFoodBrowseId } from '../../shared/popularFoods';

/** Ask for extra so foods the database cannot match do not leave the list short. */
export const REQUEST_COUNT = 150;

/** One food as the model named it, before any nutrition is looked up. */
export interface PopularDraft {
  /** What the athlete reads: "Chicken breast, grilled". */
  name: string;
  /** The same food worded the way USDA FoodData Central names it, used to find the numbers. */
  usda: string;
  cat: FoodBrowseId;
  /** The model's own rough kcal per 100 g as eaten, only used to catch a wrong USDA match. Null when not given. */
  kcal: number | null;
}

/** A market the model is asked about. */
export interface MarketName {
  code: string;
  name: string;
}

export function buildPopularPrompt(
  market: MarketName | null,
  /** Foods already listed, when a second request tops up a list that came back short. */
  exclude: string[] = [],
): string {
  const audience = market
    ? `people eating in ${market.name} (${market.code})`
    : 'people eating anywhere in the world';
  const categories = FOOD_BROWSE_CATEGORIES.map(
    (category) => `${category.id}: ${category.hint}`,
  ).join('\n');
  return [
    `You are a nutrition database curator for a calorie tracking app.`,
    `List the ${REQUEST_COUNT} foods and drinks that ${audience} search for and log most often. Include the local staples and dishes of that cuisine, not only international foods.`,
    `Order from most to least popular overall. No duplicates. Spread the list across these categories, with at least 8 foods in each one:`,
    categories,
    ...(exclude.length > 0
      ? [`Do not repeat any of these, which are already listed: ${exclude.join('; ')}.`]
      : []),
    `Give each food: "name" as a person would type it, "usda" worded the way USDA FoodData Central (SR Legacy) names it, "cat" with one of the category ids above, and "kcal" with your best estimate of calories per 100 g as eaten.`,
    `Examples of USDA wording: "Chicken, broilers or fryers, breast, meat only, cooked, roasted"; "Rice, white, long-grain, regular, cooked"; "Bananas, raw". For a dish or a takeaway item with no plain USDA record, use the closest USDA record name, for example "Fast foods, hamburger, large, single meat patty, with condiments" or "McDONALD'S, Big Mac".`,
    `Answer with JSON only, in this shape:`,
    `{"foods":[{"name":"Chicken breast, grilled","usda":"Chicken, broilers or fryers, breast, meat only, cooked, roasted","cat":"protein","kcal":165}]}`,
  ].join('\n');
}

function clean(text: unknown, max: number): string {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Keeps well-formed, unique entries in the order the model ranked them. */
export function parsePopularDrafts(raw: unknown): PopularDraft[] {
  const list = (raw as { foods?: unknown })?.foods;
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const drafts: PopularDraft[] = [];
  for (const entry of list) {
    if (typeof entry !== 'object' || entry === null) continue;
    const row = entry as { name?: unknown; usda?: unknown; cat?: unknown; kcal?: unknown };
    const name = clean(row.name, 70);
    if (!name || !isFoodBrowseId(row.cat)) continue;
    const usda = clean(row.usda, 140) || name;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const kcal = typeof row.kcal === 'number' ? row.kcal : Number.NaN;
    drafts.push({
      name,
      usda,
      cat: row.cat,
      kcal: Number.isFinite(kcal) && kcal >= 0 ? kcal : null,
    });
  }
  return drafts;
}
