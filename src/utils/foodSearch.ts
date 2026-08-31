import { FoodItem } from '../types';

// Brand & Keyword Alias Map for instantaneous smart matching
const ALIAS_MAP: Record<string, string[]> = {
  gyg: ['guzman y gomez', 'guzman', 'mexican', 'burrito', 'taco', 'nachos', 'quesadilla', 'enchilada', 'cali'],
  guzman: ['guzman y gomez', 'gyg'],
  mc: ['mcdonald\'s', 'mcdonalds', 'maccas', 'mcd'],
  mcd: ['mcdonald\'s', 'mcdonalds', 'maccas'],
  maccas: ['mcdonald\'s', 'mcdonalds'],
  mcspicy: ['mcspicy', 'mcdonald\'s', 'chicken', 'burger', 'spicy'],
  mcchicken: ['mcchicken', 'mcdonald\'s', 'chicken', 'burger'],
  subway: ['subway', 'sub', 'roll', 'sandwich', 'footlong', 'six inch', 'wrap'],
  sub: ['subway', 'roll', 'sandwich', 'hoagie'],
  roll: ['subway', 'sub', 'sandwich', 'wrap', 'sushi', 'spring roll', 'sausage roll'],
  rolls: ['subway', 'sub', 'sandwich', 'wrap', 'sushi', 'spring roll', 'sausage roll'],
  kfc: ['kfc', 'kentucky fried chicken', 'zinger', 'colonel', 'popcorn chicken', 'tenders'],
  zinger: ['zinger', 'kfc', 'chicken', 'burger', 'spicy'],
  bk: ['burger king', 'hungry jack\'s', 'hungry jacks', 'whopper'],
  whopper: ['whopper', 'burger king', 'hungry jack\'s', 'hungry jacks', 'burger'],
  hj: ['hungry jack\'s', 'hungry jacks', 'burger king'],
  'hungry jacks': ['hungry jack\'s', 'burger king'],
  cfa: ['chick-fil-a', 'chickfila'],
  chickfila: ['chick-fil-a'],
  baconator: ['wendy\'s', 'wendys', 'burger', 'bacon'],
  oporto: ['oporto', 'bondi', 'burger', 'chicken', 'portuguese'],
  grilld: ['grill\'d', 'burger', 'chips'],
  'grill\'d': ['grill\'d', 'grilld', 'burger'],
  nandos: ['nando\'s', 'nandos', 'peri peri', 'chicken'],
  dominos: ['domino\'s', 'dominos', 'pizza'],
  pizzahut: ['pizza hut', 'pizza'],
  starbucks: ['starbucks', 'coffee', 'latte', 'macchiato', 'frappuccino'],
  coke: ['coca-cola', 'coca cola', 'coke zero', 'diet coke', 'cola', 'soda'],
  pepsi: ['pepsi max', 'pepsi zero', 'pepsico', 'cola', 'soda'],
};

// Normalize plural/singular and stem common words
function normalizeWord(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('es') && w.length > 4 && (w.endsWith('shes') || w.endsWith('ches') || w.endsWith('xes') || w.endsWith('zes'))) {
    return w.slice(0, -2);
  }
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) {
    return w.slice(0, -1);
  }
  return w;
}

export function matchFoodSearch(
  item: FoodItem,
  query: string,
  normalizedCategory: string,
  userCountry: string = 'GLOBAL'
): { matches: boolean; score: number } {
  const rawQ = query.toLowerCase().trim();
  if (!rawQ) return { matches: true, score: 0 };

  const itemName = (item.name || '').toLowerCase();
  const itemBrand = (item.brand || '').toLowerCase();
  const itemCat = (normalizedCategory || item.category || '').toLowerCase();
  const itemCountry = (item.country || '').toLowerCase();

  // Combine full text corpus for the item
  const fullText = `${itemName} ${itemBrand} ${itemCat} ${itemCountry}`.toLowerCase();

  // 1. Direct exact or substring match gets highest score
  if (itemName === rawQ || itemBrand === rawQ) {
    return { matches: true, score: 1000 };
  }
  if (itemName.startsWith(rawQ) || itemBrand.startsWith(rawQ)) {
    return { matches: true, score: 800 };
  }
  if (fullText.includes(rawQ)) {
    return { matches: true, score: 600 };
  }

  // 2. Tokenize search query
  const queryTokens = rawQ
    .split(/[\s,_\-+/]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (queryTokens.length === 0) return { matches: true, score: 0 };

  let tokenMatchCount = 0;
  let bonusScore = 0;

  for (const token of queryTokens) {
    const normToken = normalizeWord(token);
    const aliases = ALIAS_MAP[token] || ALIAS_MAP[normToken] || [];

    // Check if token or stemmed token directly exists in item text
    const inName = itemName.includes(token) || itemName.includes(normToken);
    const inBrand = itemBrand.includes(token) || itemBrand.includes(normToken);
    const inCat = itemCat.includes(token) || itemCat.includes(normToken);

    // Check aliases
    const inAliases = aliases.some((alias) => fullText.includes(alias.toLowerCase()));

    if (inName || inBrand || inCat || inAliases) {
      tokenMatchCount++;
      if (inName) bonusScore += 50;
      if (inBrand) bonusScore += 40;
      if (inAliases) bonusScore += 30;
    } else {
      // Fuzzy substring check for words longer than 3 chars
      const nameWords = itemName.split(/[\s,_\-+/]+/).map(normalizeWord);
      const brandWords = itemBrand.split(/[\s,_\-+/]+/).map(normalizeWord);
      const allWords = [...nameWords, ...brandWords];

      const fuzzyMatch = allWords.some(
        (w) =>
          (w.length >= 3 && normToken.length >= 3 && (w.startsWith(normToken) || normToken.startsWith(w))) ||
          (w.length >= 4 && normToken.length >= 4 && (w.includes(normToken) || normToken.includes(w)))
      );

      if (fuzzyMatch) {
        tokenMatchCount++;
        bonusScore += 20;
      }
    }
  }

  // Require ALL tokens to match for high precision, or at least majority if 3+ tokens
  const minRequiredMatches = queryTokens.length >= 3 ? queryTokens.length - 1 : queryTokens.length;

  if (tokenMatchCount >= minRequiredMatches && tokenMatchCount > 0) {
    let finalScore = tokenMatchCount * 100 + bonusScore;

    // Bonus for matching user's active country
    if (userCountry && userCountry !== 'GLOBAL') {
      if (itemCountry.toUpperCase() === userCountry.toUpperCase() || itemBrand.includes(userCountry.toLowerCase())) {
        finalScore += 200;
      }
    }

    return { matches: true, score: finalScore };
  }

  return { matches: false, score: 0 };
}
