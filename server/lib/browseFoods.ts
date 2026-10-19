/**
 * Turns the live USDA catalogue into the Add Food category lists, and describes the Open Food Facts
 * requests that add a country's own packaged products on top.
 */
import type { FoodBrowseId } from '../../shared/foodBrowse';
import type { CatalogFood } from './usdaCatalog';

/** How many plain foods one category returns at most. */
export const GENERIC_LIMIT = 400;

/** A food as the category list shows it. Numbers are per 100 g. */
export interface BrowseFood {
  id: string;
  name: string;
  brand: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
  servingGrams: number;
  country: string;
  source: 'usda' | 'openfoodfacts';
}

/** Records nobody logs: baby food, wild game of the far north, ceremonial and school-programme foods. */
const SKIP =
  /^(babyfood|infant formula|toddler formula|child formula|school lunch|whale|seal|walrus|sea lion|bear|beaver|caribou|moose|squirrel|muskrat|opossum|raccoon|horse|agutuk|frybread|oil, whale|oil, seal)\b|usda commodity|alaska native|navajo|northern plains|apache|hopi|shoshone|oglala|pima|\bnfs\b|human\b/i;

const SOUPS_AND_SAUCES = /\b(broth|soup|stock|sauce|gravy|souffle|souffl[eé]|bouillon)\b/i;
const SWEET_FRUIT = /^(fruit syrup|candied|fruit leather|fruit-flavored|milk and cereal bar)/i;

const FAST_FOOD =
  /^(fast foods?|restaurant|mcdonald's|kfc|burger king|popeyes|wendy's|denny's|applebee's|subway|taco bell|cracker barrel|t\.g\.i\. friday's|olive garden|on the border|carrabba's italian grill|chick-fil-a|domino's|pizza hut|papa john's|digiorno pizza|little caesars|arby's|jack in the box|sonic|dairy queen|chili's|outback|panda express|chipotle|starbucks|dunkin|hardee's|carl's jr)/i;
const DRINKS =
  /juice|nectar|smoothie|lemonade|beverage|\bwater\b|soymilk|coffee|\btea\b|cocoa mix|alcoholic|\bbeer\b|\bwine\b|liqueur|\bcola\b|carbonated|energy drink|\bdrink\b|milk shake|milkshake|whiskey|\brum\b|vodka/i;
const PROTEIN =
  /^(beef|pork|lamb|veal|chicken|turkey|duck|goose|fish|mollusks|crustaceans|salmon|tuna|ham|bacon|sausage|frankfurter|bologna|salami|luncheon meat|pate|bratwurst|kielbasa|beerwurst|canadian bacon|tofu|tempeh|natto|miso|edamame|soybeans|lentils|chickpeas|cowpeas|beans|lima beans|mung beans|refried beans|winged beans|mothbeans|pigeon peas|lupins|game meat|quail|pheasant|guinea hen|squab|bison|buffalo|elk|poultry|oscar mayer|hormel|meat|egg substitute)\b|^egg$/i;
const DAIRY =
  /^(cheese|yogurt|milk|cream|sour cream|whey|kefir|cream substitute|dessert topping|eggnog|buttermilk|half and half)\b/i;
const FATS =
  /^(nuts|seeds|oil|peanuts|peanut butter|margarine|margarine-like|shortening|butter|fish oil|salad dressing|mayonnaise|avocados?|olives|fat|creamy dressing|ghee|lard|tahini|coconut)\b/i;
const CARBS =
  /^(cereals ready-to-eat|cereals|cereal|potatoes|potato|bread|rice|pasta|rolls|noodles|wheat flour|cornmeal|bagels|tortillas|pancakes|waffles?|muffins|english muffins|croissants|couscous|bulgur|barley|millet|amaranth grain|buckwheat|quinoa|oats?|corn flour|rye flour|rice flour|corn grain|hominy|sweet potato|yam|taro|plantains|cassava|spaghetti|lasagna|ravioli|macaroni|stuffing|french toast|wheat|rye|sorghum|spelt|semolina|farina|crispbread|biscuits)\b/i;
const FRUIT =
  /\b(apples?|apricots?|pears?|cherries|peaches|plums?|blueberries|grapefruit|pineapple|raspberries|figs?|grapes?|oranges?|strawberries|tangerines?|bananas?|melons?|kiwifruit|dates|raisins|prunes|mangos?|papayas?|cranberries|currants|blackberries|boysenberries|gooseberries|guavas?|jackfruit|nectarines?|lemons?|limes?|persimmons?|pomegranates?|applesauce|fruit|cherimoya|carambola|lychees?|longans?|loganberries|mulberries|elderberries|kumquats|passion-?fruit|sapodilla|tamarinds?|watermelon|cantaloupe|honeydew|clementines?|acerola|breadfruit|jujube|crabapples|pummelo|quinces|soursop|star fruit|berries)\b/i;
const VEG =
  /greens|leaves|sprouts|lettuce|cabbage|squash|pepper|onion|tomato|broccoli|carrot|cauliflower|spinach|beets?\b|celery|cucumber|eggplant|radish|okra|pumpkin|artichoke|leek|mushroom|asparagus|\bkale\b|collard|chard|kohlrabi|turnip|parsnip|rutabaga|gourd|chayote|cress|garlic|ginger|lotus|bamboo|seaweed|pickle|vegetables|\bcorn\b|\bpeas\b|succotash|salsify|celeriac|cardoon|arrowhead|jicama|yambean|yardlong|waxgourd|fennel|endive|escarole|chicory|chives|parsley|basil|dill|coriander|mustard|borage|purslane|nopales|hearts of palm|fiddlehead|burdock|butterbur|lambsquarters|jute|drumstick|broadbeans|\bbeans\b/i;
const SNACKS =
  /^(snacks?|candies|cookies?|crackers?|cake|pie|puddings?|ice creams?|ice cream.*|frozen yogurts?|frozen novelties|doughnuts|danish pastry|toaster pastries|turnover|sweet rolls|brownies|formulated bar|popcorn|pretzels?|chips?|chocolate|desserts|gelatin desserts|frostings|jams and preserves|jellies|chewing gum|marshmallow|pie fillings|pie crust|granola bars?|fruit snacks?)\b/i;

/** American brand names are written in capitals (KELLOGG'S, SILK); they mean nothing in most countries. */
function isCapsBrand(name: string): boolean {
  return /\b[A-Z][A-Z'&.]{2,}\b/.test(name.replace(/\b(USDA|NFS|UHT|PB&J)\b/g, ''));
}

/** Which Add Food category a USDA record belongs under, by how USDA words the start of its name. */
export function categoryOf(food: CatalogFood): FoodBrowseId | null {
  const name = food.name.trim();
  if (SKIP.test(name)) return null;
  const lead = name.split(',')[0].trim();
  if (FAST_FOOD.test(lead)) return 'fastfood';
  // American brand names are written in capitals (KELLOGG'S, SILK); they mean nothing in most countries.
  if (isCapsBrand(name)) return null;
  if (SOUPS_AND_SAUCES.test(lead)) return null;
  if (SWEET_FRUIT.test(lead)) return 'snacks';
  if (DRINKS.test(lead)) return 'drinks';
  if (/^beans$/i.test(lead) && /\b(snap|green|yellow|wax)\b/i.test(name)) return 'veg';
  if (PROTEIN.test(lead)) return 'protein';
  if (SNACKS.test(lead)) return 'snacks';
  if (DAIRY.test(lead)) return 'dairy';
  if (FATS.test(lead)) return 'fats';
  if (CARBS.test(lead)) return 'carbs';
  if (FRUIT.test(lead)) return 'fruit';
  if (VEG.test(lead)) return 'veg';
  return null;
}

/** Plain, everyday forms first: fewer qualifiers, cooked before raw. */
function plainness(name: string): number {
  const parts = name.split(',').length;
  let score = parts;
  if (/\b(cooked|grilled|roasted|broiled|boiled|baked|steamed|toasted)\b/i.test(name)) score -= 0.6;
  if (/\braw\b/i.test(name)) score += 0.3;
  if (/\b(canned|frozen|dried|dehydrated|restaurant|imitation|substitute|powder)\b/i.test(name)) {
    score += 0.4;
  }
  return score;
}

/** How a chain is written on screen; anything else is title-cased. */
const CHAIN_NAMES: Record<string, string> = {
  "mcdonald's": "McDonald's",
  kfc: 'KFC',
  "t.g.i. friday's": "T.G.I. Friday's",
  'chick-fil-a': 'Chick-fil-A',
  "domino's": "Domino's",
  digiorno: 'DiGiorno',
};

function titleCase(text: string): string {
  return text.replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/'S\b/g, "'s");
}

/** A takeaway record split into the chain that sells it and the item, or the item alone for generic takeaway. */
function takeaway(name: string): { brand: string; item: string } {
  const chain = name.match(FAST_FOOD)?.[0] ?? '';
  const rest = name
    .slice(chain.length)
    .replace(/^[,\s]+/, '')
    .trim();
  const lower = chain.toLowerCase();
  if (!chain || /^(fast foods?|restaurant)$/.test(lower)) {
    return { brand: 'Takeaway', item: rest ? rest[0].toUpperCase() + rest.slice(1) : name };
  }
  const brand = CHAIN_NAMES[lower] ?? titleCase(lower);
  return { brand, item: rest ? `${brand} ${rest}` : brand };
}

function tidy(name: string): string {
  return name
    .replace(/\s*\(Includes foods for USDA's Food Distribution Program\)/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',')
    .trim();
}

/** A catalogue record as the app shows it; takeaway records are split into chain and item. */
function toBrowseFood(food: CatalogFood, takeawayRecord: boolean): BrowseFood {
  const label = takeawayRecord ? takeaway(food.name) : null;
  return {
    id: food.id,
    name: tidy(label ? label.item : food.name),
    brand: label ? label.brand : 'Generic',
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fats: food.fats,
    servingSize: '100 g',
    servingGrams: 100,
    country: 'US',
    source: 'usda' as const,
  };
}

const QUERY_WORD = /[a-z0-9]+/g;

function wordsOf(text: string): string[] {
  return text.toLowerCase().match(QUERY_WORD) ?? [];
}

/** The plain singular forms of a typed word: "eggs" is "egg", "tomatoes" is "tomato", "berries" is "berry". */
function singulars(token: string): string[] {
  if (token.length <= 3) return [];
  const forms: string[] = [];
  if (token.endsWith('ies')) forms.push(`${token.slice(0, -3)}y`);
  if (token.endsWith('es')) forms.push(token.slice(0, -2));
  if (token.endsWith('s')) forms.push(token.slice(0, -1));
  return forms;
}

/** A word matches when it starts with the typed word, or is exactly its singular ("eggs" finds "egg", not "eggplant"). */
function startsWithWord(words: readonly string[], token: string): boolean {
  const forms = singulars(token);
  return words.some((w) => w.startsWith(token) || forms.includes(w));
}

/** Whether the typed word is exactly one of these words, or its plural form is. */
function isWord(words: readonly string[], token: string): boolean {
  return words.includes(token) || singulars(token).some((form) => words.includes(form));
}

/** Prepared or packaged forms, which rank below the plain food unless the person typed them. */
const PROCESSED =
  /\b(breaded|battered|nuggets|tenders|patties|roll|mix|dry|powder|substitute|imitation|canned|frozen|dehydrated|dried|snack|bar|drink|fortified|custards?|pudding|dessert|sauce|salad|sandwich|pie|cake)\b/g;

/**
 * Searches the in-memory catalogue. Every typed word must start a word of the name; names that lead with
 * the typed words and are plainer rank first. Answers in a few milliseconds, with no call to USDA.
 */
export function searchGeneric(
  catalog: readonly CatalogFood[],
  query: string,
  limit: number,
): BrowseFood[] {
  const typed = wordsOf(query);
  if (typed.length === 0) return [];
  const scored: { food: CatalogFood; rank: number }[] = [];
  for (const food of catalog) {
    const lead = food.name.split(',')[0].trim();
    if (SKIP.test(food.name.trim()) || (isCapsBrand(food.name) && !FAST_FOOD.test(lead))) continue;
    const nameWords = wordsOf(food.name);
    if (!typed.every((t) => startsWithWord(nameWords, t))) continue;
    const leadWords = wordsOf(lead);
    let rank = 0;
    for (const t of typed) rank += startsWithWord(leadWords, t) ? 3 : 1;
    if (startsWithWord(leadWords.slice(0, 1), typed[0])) rank += 4;
    // The record named by exactly the typed words ("Egg, whole, raw" for "eggs") leads.
    if (leadWords.length === typed.length && typed.every((t) => isWord(leadWords, t))) rank += 6;
    const processed = (food.name.toLowerCase().match(PROCESSED) ?? []).filter(
      (w) => !typed.includes(w),
    ).length;
    scored.push({ food, rank: (rank - processed * 2) * 10 - plainness(food.name) });
  }
  scored.sort(
    (a, b) =>
      b.rank - a.rank || a.food.name.localeCompare(b.food.name, 'en', { sensitivity: 'base' }),
  );
  const seen = new Set<string>();
  const rows: BrowseFood[] = [];
  for (const { food } of scored) {
    const key = food.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(toBrowseFood(food, FAST_FOOD.test(food.name.split(',')[0].trim())));
    if (rows.length >= limit) break;
  }
  return rows;
}

/** The plain foods of one category, best-known forms first, with nothing repeated. */
export function genericFoodsFor(
  category: FoodBrowseId,
  catalog: readonly CatalogFood[],
  limit: number = GENERIC_LIMIT,
): BrowseFood[] {
  const seen = new Set<string>();
  return catalog
    .filter((food) => categoryOf(food) === category)
    .map((food) => ({ food, rank: plainness(food.name) }))
    .sort(
      (a, b) =>
        Math.floor(a.rank) - Math.floor(b.rank) ||
        a.food.name.localeCompare(b.food.name, 'en', { sensitivity: 'base' }),
    )
    .filter(({ food }) => {
      const key = food.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map(({ food }) => toBrowseFood(food, category === 'fastfood'));
}

/** Open Food Facts categories that make up each Add Food category. */
export const OFF_CATEGORY_TAGS: Record<FoodBrowseId, string[]> = {
  protein: ['meats'],
  carbs: ['breads'],
  fats: ['nuts'],
  veg: ['vegetables'],
  fruit: ['fruits'],
  dairy: ['dairies'],
  snacks: ['snacks'],
  drinks: ['beverages'],
  fastfood: ['meals'],
};

/**
 * Open Food Facts allows about ten searches a minute, so the app keeps to six and queues the rest briefly.
 * Each call returns how many milliseconds a new search must wait and books its slot, or null when the
 * wait would be longer than `maxWaitMs`, in which case nothing is booked.
 */
export function createSearchPacer(
  perMinute: number,
  maxWaitMs: number,
  now: () => number = Date.now,
) {
  const starts: number[] = [];
  return (): number | null => {
    const t = now();
    while (starts.length > 0 && starts[0] <= t - 60_000) starts.shift();
    const wait = starts.length < perMinute ? 0 : starts[starts.length - perMinute] + 60_000 - t;
    if (wait > maxWaitMs) return null;
    starts.push(t + wait);
    return wait;
  };
}

/** Open Food Facts spells a few countries differently from the usual English name. */
const OFF_COUNTRY_NAMES: Record<string, string> = {
  CZ: 'czech-republic',
  TR: 'turkey',
  CI: 'ivory-coast',
  MM: 'myanmar',
  SZ: 'eswatini',
  CV: 'cape-verde',
  PS: 'palestinian-territory',
  MK: 'north-macedonia',
  CD: 'democratic-republic-of-the-congo',
  CG: 'republic-of-the-congo',
  GB: 'united-kingdom',
  US: 'united-states',
  KR: 'south-korea',
  KP: 'north-korea',
  HK: 'hong-kong',
  VA: 'vatican-city',
};

/** The Open Food Facts country tag for a two-letter code, or null for an unknown code. */
export function offCountryTag(code: string): string | null {
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  const known = OFF_COUNTRY_NAMES[upper];
  if (known) return known;
  let name: string | undefined;
  try {
    name = new Intl.DisplayNames(['en'], { type: 'region' }).of(upper);
  } catch {
    return null;
  }
  if (!name || name === upper) return null;
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const OFF_FIELDS_FOR_BROWSE = [
  'code',
  'product_name',
  'product_name_en',
  'brands',
  'brand_owner',
  'nutriments',
  'labels_tags',
  'allergens_tags',
  'ingredients_analysis_tags',
  'unique_scans_n',
].join(',');

/** The request for one Open Food Facts category in one country, most-scanned first. */
export function offBrowseUrl(countryTag: string, tag: string, pageSize: number): string {
  const search = new URLSearchParams({
    countries_tags_en: countryTag,
    categories_tags_en: tag,
    sort_by: 'unique_scans_n',
    page_size: String(pageSize),
    fields: OFF_FIELDS_FOR_BROWSE,
  });
  return `https://world.openfoodfacts.org/api/v2/search?${search.toString()}`;
}

/** Takes one product from each category in turn, so no single category fills the list. */
export function interleave<T>(lists: readonly (readonly T[])[], limit: number): T[] {
  const out: T[] = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));
  for (let i = 0; i < longest && out.length < limit; i++) {
    for (const list of lists) {
      if (i < list.length && out.length < limit) out.push(list[i]);
    }
  }
  return out;
}
