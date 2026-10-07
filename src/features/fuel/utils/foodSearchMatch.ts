/** Brand shortcuts so “gyg” finds Guzman y Gomez, etc. */
const SEARCH_ALIASES: Record<string, string[]> = {
  gyg: ['gyg', 'guzman', 'gomez', 'guzman y gomez'],
  maccas: ['maccas', 'mcdonald', "mcdonald's"],
  nandos: ['nando', "nando's"],
  grilld: ['grilld', "grill'd", 'grill d'],
};

export function matchesFoodQuery(name: string, brand: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const hay = `${name} ${brand}`.toLowerCase();
  if (hay.includes(q)) return true;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((token) => hay.includes(token))) return true;

  for (const aliases of Object.values(SEARCH_ALIASES)) {
    const queryHitsAlias = aliases.some((alias) => q === alias || q.includes(alias));
    if (!queryHitsAlias) continue;
    if (aliases.some((alias) => hay.includes(alias))) return true;
  }

  return false;
}
