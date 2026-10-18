/** Asks a model which foods people log most, then reads its answer defensively. */

export const POPULAR_COUNT = 50;
/** Ask for a few extra so foods the database cannot match do not leave the list short. */
const REQUEST_COUNT = 100;

/** One food as the model named it, before any nutrition is looked up. */
export interface PopularDraft {
  /** What the athlete reads: "Chicken breast, grilled". */
  name: string;
  /** The same food worded the way USDA FoodData Central names it, used to find the numbers. */
  usda: string;
}

export function buildPopularPrompt(
  label: string,
  hint: string,
  country: string,
  /** Foods already listed, when a second request tops up a list that came back short. */
  exclude: string[] = [],
): string {
  return [
    `You are a nutrition database curator for a calorie tracking app.`,
    `List the ${REQUEST_COUNT} foods that people search for and log most often in the category "${label}" (${hint}).`,
    `Audience: people eating in ${country}. Order from most searched to least searched. No duplicates.`,
    ...(exclude.length > 0
      ? [`Do not repeat any of these, which are already listed: ${exclude.join('; ')}.`]
      : []),
    `Give each food twice: "name" as a person would type it, and "usda" worded the way USDA FoodData Central names it, for example "Chicken, broilers or fryers, breast, meat only, cooked, roasted" or "Rice, white, long-grain, cooked". For takeaway and packaged items use the common product name for both.`,
    `Answer with JSON only, in this shape:`,
    `{"foods":[{"name":"Chicken breast, grilled","usda":"Chicken, broilers or fryers, breast, meat only, cooked, roasted"}]}`,
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
    const asText = typeof entry === 'string';
    const name = clean(asText ? entry : (entry as { name?: unknown })?.name, 70);
    if (!name) continue;
    const usda = asText ? name : clean((entry as { usda?: unknown })?.usda, 140) || name;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    drafts.push({ name, usda });
  }
  return drafts;
}
