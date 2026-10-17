/** Brand shortcuts so “gyg” finds Guzman y Gomez, etc. Keys and values are normalized words. */
const SEARCH_ALIASES: Record<string, string[]> = {
  gyg: ['guzman'],
  guzman: ['gyg'],
  maccas: ['mcdonalds'],
  mcdonalds: ['maccas'],
  macca: ['mcdonalds'],
  nando: ['nandos'],
  hj: ['hungry'],
  hjs: ['hungry'],
  kfc: ['kentucky'],
};

/** Words that describe the dish type, not which item; they still boost ranking when present. */
const FILLER_WORDS = new Set([
  'a', 'an', 'the', 'and', 'with', 'of', 'from', 'at', 'in', 'on', 'my',
  'burger', 'burgers', 'meal', 'serve', 'order',
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9.]+/g, ' ')
    .trim();
}

function words(text: string): string[] {
  return normalize(text).split(' ').filter(Boolean);
}

function tokenHits(token: string, hayWords: string[]): boolean {
  const variants = [token, ...(SEARCH_ALIASES[token] ?? [])];
  return variants.some((v) => hayWords.some((w) => w.startsWith(v)));
}

/** 0 = no match. Higher = better: every meaningful word must prefix-match a word in name or brand. */
function foodQueryScore(name: string, brand: string, query: string): number {
  const all = words(query);
  if (all.length === 0) return 1;

  const core = all.filter((t) => !FILLER_WORDS.has(t));
  const required = core.length > 0 ? core : all;

  const nameWords = words(name);
  const hayWords = [...nameWords, ...words(brand)];
  if (!required.every((t) => tokenHits(t, hayWords))) return 0;

  let score = 10;
  for (const t of required) if (tokenHits(t, nameWords)) score += 3;
  for (const t of all) if (FILLER_WORDS.has(t) && tokenHits(t, hayWords)) score += 1;
  const nq = normalize(query);
  const nn = normalize(name);
  if (nn.includes(nq)) score += 6;
  if (nn.startsWith(nq)) score += 2;
  return score;
}

export function matchesFoodQuery(name: string, brand: string, query: string): boolean {
  return foodQueryScore(name, brand, query) > 0;
}

/** Stable sort by match score; unmatched rows (e.g. live results with odd names) keep their order at the end. */
export function rankByFoodQuery<T extends { name: string; brand: string }>(items: T[], query: string): T[] {
  if (!query.trim()) return items;
  return items
    .map((item, i) => ({ item, i, s: foodQueryScore(item.name, item.brand, query) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((r) => r.item);
}
