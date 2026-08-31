import type { Request, Response } from 'express';
import type {
  WebResult,
  FoodResult,
  VenueResult,
  WebSearchResponse,
  FoodSearchResponse,
  VenueSearchResponse,
} from './searchTypes';

const FETCH_TIMEOUT = 8000;

async function fetchWithTimeout(url: string, opts: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res as unknown as Response;
  } finally {
    clearTimeout(timer);
  }
}

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return await (res as unknown as { json: () => Promise<T> }).json();
  } catch {
    return null;
  }
}

/* ---- Web search via DuckDuckGo Instant Answer API ---- */
async function webSearch(q: string): Promise<WebResult[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(trimmed)}&format=json&no_html=1&skip_disambig=1`;
  const ddgRes = await fetchWithTimeout(ddgUrl, {
    headers: { 'User-Agent': 'OFCFitnessApp/1.0' },
  });
  const ddgJson = await safeJson<any>(ddgRes);
  const results: WebResult[] = [];

  if (ddgJson) {
    if (ddgJson.AbstractText && ddgJson.AbstractURL) {
      results.push({
        title: ddgJson.Heading || trimmed,
        url: ddgJson.AbstractURL,
        snippet: ddgJson.AbstractText,
        source: ddgJson.AbstractSource || 'DuckDuckGo',
      });
    }
    if (Array.isArray(ddgJson.RelatedTopics)) {
      for (const t of ddgJson.RelatedTopics.slice(0, 8)) {
        if (t && t.Text && t.FirstURL) {
          results.push({
            title: t.Text.split(' - ')[0] || trimmed,
            url: t.FirstURL,
            snippet: t.Text,
            source: 'DuckDuckGo',
          });
        }
      }
    }
  }

  // Fallback: Wikipedia API if DDG returned nothing
  if (results.length === 0) {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(trimmed + ' exercise fitness biomechanics')}&format=json&srlimit=5`;
    const wikiRes = await fetchWithTimeout(wikiUrl, {
      headers: { 'User-Agent': 'OFCFitnessApp/1.0' },
    });
    const wikiJson = await safeJson<any>(wikiRes);
    if (wikiJson?.query?.search) {
      for (const item of wikiJson.query.search) {
        results.push({
          title: item.title,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
          snippet: (item.snippet || '').replace(/<[^>]+>/g, ''),
          source: 'Wikipedia',
        });
      }
    }
  }

  return results.slice(0, 10);
}

/* ---- Food search via OpenFoodFacts ---- */
async function foodSearch(q: string): Promise<FoodResult[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(trimmed)}&search_simple=1&action=process&json=1&page_size=12`;
  const offRes = await fetchWithTimeout(offUrl, {
    headers: { 'User-Agent': 'OFCFitnessApp/1.0' },
  });
  const offJson = await safeJson<any>(offRes);
  const results: FoodResult[] = [];

  if (offJson?.products) {
    for (const p of offJson.products) {
      const n = p.nutriments || {};
      results.push({
        name: p.product_name || p.generic_name || 'Unknown product',
        brand: p.brands || undefined,
        calories: Math.round(n['energy-kcal_100g'] || n.energy_100g / 4.184 || 0),
        protein: Math.round((n.proteins_100g || 0) * 10) / 10,
        carbs: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
        fat: Math.round((n.fat_100g || 0) * 10) / 10,
        servingSize: p.serving_size || '100g',
        imageUrl: p.image_front_small_url || p.image_small_url || undefined,
        barcode: p.code || undefined,
      });
    }
  }

  return results.filter((r) => r.name !== 'Unknown product').slice(0, 10);
}

/* ---- Venue search via Nominatim + Overpass (OpenStreetMap) ---- */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

async function venueSearch(
  q: string,
  lat?: number,
  lng?: number,
): Promise<VenueResult[]> {
  const trimmed = q.trim();
  if (!trimmed && lat == null) return [];

  let centerLat: number;
  let centerLng: number;

  if (lat != null && lng != null) {
    centerLat = lat;
    centerLng = lng;
  } else {
    // Geocode the user-entered place name
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1`;
    const nomRes = await fetchWithTimeout(nomUrl, {
      headers: { 'User-Agent': 'OFCFitnessApp/1.0' },
    });
    const nomJson = await safeJson<any[]>(nomRes);
    if (!nomJson || nomJson.length === 0) return [];
    centerLat = parseFloat(nomJson[0].lat);
    centerLng = parseFloat(nomJson[0].lon);
  }

  // Overpass: find fitness/gym/sport venues within 5km
  const radius = 5000;
  const overpassQuery = `
    [out:json][timeout:10];
    (
      node["leisure"~"fitness_centre|sports_centre|stadium|pitch|track"](around:${radius},${centerLat},${centerLng});
      node["sport"](around:${radius},${centerLat},${centerLng});
      node["amenity"="gym"](around:${radius},${centerLat},${centerLng});
    );
    out body 30;
  `;
  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  const opRes = await fetchWithTimeout(overpassUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(overpassQuery),
  });
  const opJson = await safeJson<any>(opRes);
  const results: VenueResult[] = [];

  if (opJson?.elements) {
    for (const el of opJson.elements) {
      const tags = el.tags || {};
      const name =
        tags.name ||
        tags.brand ||
        tags.sport ||
        tags.leisure ||
        'Fitness Venue';
      const category =
        tags.leisure === 'fitness_centre'
          ? 'Gym'
          : tags.leisure === 'sports_centre'
            ? 'Sports Centre'
            : tags.leisure === 'stadium'
              ? 'Stadium'
              : tags.leisure === 'pitch'
                ? 'Sports Pitch'
                : tags.leisure === 'track'
                  ? 'Running Track'
                  : tags.sport
                    ? tags.sport.charAt(0).toUpperCase() + tags.sport.slice(1)
                    : 'Fitness';
      results.push({
        name,
        category,
        lat: el.lat,
        lng: el.lon,
        address: tags['addr:street']
          ? `${tags['addr:street']}${tags['addr:housenumber'] ? ' ' + tags['addr:housenumber'] : ''}`
          : undefined,
        distanceKm: haversineKm(centerLat, centerLng, el.lat, el.lon),
      });
    }
  }

  return results.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0)).slice(0, 15);
}

/* ---- Express route handler ---- */
export async function handleSearch(req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'public, max-age=60');

  const kind = req.params.kind;
  const q = (req.query.q as string) || '';
  const lat = req.query.lat != null ? parseFloat(req.query.lat as string) : undefined;
  const lng = req.query.lng != null ? parseFloat(req.query.lng as string) : undefined;

  try {
    if (kind === 'web') {
      const results = await webSearch(q);
      const payload: WebSearchResponse = { results };
      res.json(payload);
    } else if (kind === 'food') {
      const results = await foodSearch(q);
      const payload: FoodSearchResponse = { results };
      res.json(payload);
    } else if (kind === 'venue') {
      const results = await venueSearch(q, lat, lng);
      const payload: VenueSearchResponse = { results };
      res.json(payload);
    } else {
      res.status(400).json({ error: 'Unknown search kind. Use web, food, or venue.' });
    }
  } catch (err) {
    console.error('Search proxy error:', err);
    res.status(502).json({ results: [], error: 'Search service is temporarily unavailable. Please try again.' });
  }
}
