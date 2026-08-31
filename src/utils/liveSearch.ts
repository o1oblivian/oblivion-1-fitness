import type {
  WebResult,
  FoodResult,
  VenueResult,
  WebSearchResponse,
  FoodSearchResponse,
  VenueSearchResponse,
  SearchKind,
} from './searchTypes';

const API_BASE = '/api/search';

async function searchFetch<T>(kind: SearchKind, params: Record<string, string | number>): Promise<T> {
  const url = new URL(`${API_BASE}/${kind}`, window.location.origin);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Search request failed');
  }
  return res.json() as Promise<T>;
}

export function searchWeb(query: string): Promise<{ results: WebResult[] }> {
  return searchFetch<WebSearchResponse>('web', { q: query });
}

export function searchFood(query: string): Promise<{ results: FoodResult[] }> {
  return searchFetch<FoodSearchResponse>('food', { q: query });
}

export function searchVenues(
  query: string,
  coords?: { lat: number; lng: number },
): Promise<{ results: VenueResult[] }> {
  const params: Record<string, string | number> = { q: query };
  if (coords) {
    params.lat = coords.lat;
    params.lng = coords.lng;
  }
  return searchFetch<VenueSearchResponse>('venue', params);
}
