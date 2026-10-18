/**
 * Finds a food in a local copy of USDA FoodData Central by its USDA-style name.
 * Used when the bundled popular-food lists are built, so no network call is made per food.
 */

export interface UsdaRecord {
  id: string;
  description: string;
  dataType: 'Foundation' | 'SR Legacy';
  /** Per 100 g. */
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface UsdaMatch {
  record: UsdaRecord;
  /** 0 to 1. 1 means the wording is identical. */
  score: number;
}

/** Words that carry no meaning for telling one food from another. */
const FILLER = new Set([
  'and',
  'or',
  'with',
  'without',
  'of',
  'the',
  'a',
  'in',
  'ns',
  'nfs',
  'raw',
]);

/** A food has to look this much like the request before it is accepted. */
export const MIN_MATCH_SCORE = 0.62;

function stem(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith('es') && /(ch|sh|x|s|o)es$/.test(word))
    return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

/** Lower-case word stems, without filler. "Eggs, whole" and "Egg whole" give the same list. */
export function tokensOf(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return words.filter((word) => !FILLER.has(word)).map(stem);
}

/** Sørensen–Dice overlap of two word lists, so a long record that merely contains the request scores lower. */
export function overlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const setA = new Set(a);
  let shared = 0;
  for (const word of setA) if (setB.has(word)) shared += 1;
  return (2 * shared) / (setA.size + setB.size);
}

export interface IndexedRecord {
  record: UsdaRecord;
  tokens: string[];
}

export function indexRecords(records: UsdaRecord[]): IndexedRecord[] {
  return records.map((record) => ({ record, tokens: tokensOf(record.description) }));
}

/** The closest record to a USDA-style name, or null when nothing is close enough to trust. */
export function bestMatch(query: string, index: IndexedRecord[]): UsdaMatch | null {
  const wanted = tokensOf(query);
  if (wanted.length === 0) return null;
  let best: UsdaMatch | null = null;
  for (const entry of index) {
    const score = overlap(wanted, entry.tokens);
    if (score < MIN_MATCH_SCORE) continue;
    // Foundation records are newer; prefer them when two records read equally well.
    const better =
      !best ||
      score > best.score + 1e-9 ||
      (Math.abs(score - best.score) < 1e-9 &&
        entry.record.dataType === 'Foundation' &&
        best.record.dataType !== 'Foundation');
    if (better) best = { record: entry.record, score };
  }
  return best;
}
