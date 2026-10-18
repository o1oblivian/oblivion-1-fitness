const FILLER = new Set([
  'gym',
  'gyms',
  'fitness',
  'club',
  'health',
  'the',
  'centre',
  'center',
  'studio',
  'and',
  'pty',
  'ltd',
  'co',
  'inc',
]);

function gymTokens(name: string): string[] {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((token) => token && !FILLER.has(token));
}

/**
 * True when two gym names point at the same place. Filler words are ignored, so
 * "Anytime Fitness Richmond" matches "anytime richmond" and "Anytime Fitness",
 * but not "Anytime Fitness Carlton", and a bare "Gym" matches nothing.
 */
export function sameGym(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = gymTokens(a || '');
  const right = gymTokens(b || '');
  if (!left.length || !right.length) return false;
  const [short, long] = left.length <= right.length ? [left, right] : [right, left];
  if (short.join('').length < 3) return false;
  const pool = new Set(long);
  return short.every((token) => pool.has(token));
}
