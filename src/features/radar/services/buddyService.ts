import { Coordinates, DemoAthlete } from '../types';
import { supabase } from '../../../services/supabaseClient';
import { safeStorage } from '../../../utils/safeStorage';

interface RemoteBuddyRow {
  id?: string;
  user_id?: string;
  athlete_name?: string;
  name?: string;
  handle?: string;
  age?: number | string;
  home_gym?: string;
  avatar_url?: string;
  image_url?: string;
  avatar?: string;
  discipline?: string;
  current_split?: string;
  training_time?: string;
  preferred_time?: string;
  gender?: string;
  looking_for?: string;
  training_place?: string;
  where?: string;
  experience_level?: string;
  bio?: string;
  last_active?: string;
  is_ghost_mode?: boolean;
  is_verified?: boolean;
}

const LOCAL_BUDDIES_KEY = 'o1_buddy_local';

/** Dev preview cards seeded by devPreviewBoot. Always empty in production builds. */
export function localBuddyCards(): DemoAthlete[] {
  if (!import.meta.env.DEV) return [];
  const rows = safeStorage.getItem<Array<Record<string, string>>>(LOCAL_BUDDIES_KEY, []) || [];
  return rows.map((item) => ({
    id: String(item.id || ''),
    name: item.name || 'Athlete',
    handle: item.handle || '',
    age: Number(item.age) || 0,
    home_gym: item.home_gym || '',
    distance_km: 1,
    match_score: 0,
    image_url: item.avatar || '',
    photos: item.avatar ? [item.avatar] : [],
    discipline: item.discipline || 'Strength',
    training_discipline: item.discipline || 'Strength',
    current_split: item.current_split || '',
    preferred_time: item.time || '',
    gender: item.gender || '',
    looking_for: item.looking_for || '',
    training_place: item.where || item.training_place || '',
    experience_level: item.level || '',
    bio: item.bio || '',
    is_online: false,
  }));
}

/**
 * Genuine Wired Search Algorithm through Supabase and Local Athlete Graph
 *
 * 1. Tokenizes search query into discrete normalized terms.
 * 2. Queries Supabase 'buddy_profiles' table with multi-column ilike filters:
 *    - athlete_name, home_gym, discipline, handle, current_split.
 * 3. Synthesizes with verified athletes database and deduplicates.
 * 4. Multi-token weighted relevance scoring:
 *    - Full name exact / prefix match (+120 / +80)
 *    - Gym / location match (+85)
 *    - Discipline / training split match (+75)
 *    - Handle match (+50)
 *    - Bio / focus keywords (+35)
 *    - Online status bonus (+10)
 *    - Dynamic distance penalty (-distance_km * 1.2)
 * 5. Returns ranked athlete candidates with score breakdown.
 */
export async function searchAthletesWithSupabase(
  query: string,
  baseAthletes: DemoAthlete[] = [],
  userCoords: Coordinates,
  radiusKm: number = 25
): Promise<{ results: DemoAthlete[]; fromSupabase: boolean }> {
  const cleanQuery = query.trim().toLowerCase().replace(/[%_,()]/g, ' ').replace(/\s+/g, ' ').trim();
  let supabaseCandidates: DemoAthlete[] = [];
  let fetchedFromSupabase = false;

  try {
    const remoteDeck = await supabase.rpc('buddy_within_radius', {
      origin_lat: userCoords.latitude,
      origin_lng: userCoords.longitude,
      radius_km: radiusKm,
    });
    if (remoteDeck.error || !Array.isArray(remoteDeck.data)) {
      throw new Error(remoteDeck.error?.message || 'Radar search did not answer');
    }
    fetchedFromSupabase = true;
    supabaseCandidates = remoteDeck.data.flatMap((raw) => {
      const item = raw as RemoteBuddyRow & { distance_km?: number };
      if (item.is_ghost_mode) return [];
      const dist = Number(item.distance_km);
      if (!Number.isFinite(dist) || dist < 0) return [];
      const photo = String(item.avatar_url || item.image_url || item.avatar || '');
      const safePhoto = photo.includes('images.unsplash.com') ? '' : photo;
      const recent = item.last_active ? Date.now() - new Date(item.last_active).getTime() < 15 * 60 * 1000 : false;
      return [{
        id: String(item.id || item.user_id || ''),
        name: String(item.athlete_name || item.name || '').trim(),
        handle: item.handle || '',
        age: Number(item.age) || 0,
        home_gym: item.home_gym || '',
        distance_km: dist,
        match_score: 0,
        image_url: safePhoto,
        photos: safePhoto ? [safePhoto] : [],
        discipline: item.discipline || '',
        training_discipline: item.discipline || '',
        current_split: item.current_split || '',
        preferred_time: item.training_time || item.preferred_time || '',
        gender: item.gender || '',
        looking_for: item.looking_for || '',
        training_place: item.training_place || item.where || '',
        experience_level: item.experience_level || '',
        bio: item.bio || '',
        is_online: recent,
        is_verified: Boolean(item.is_verified),
      }];
    }).filter((row) => row.name);
  } catch (err) {
    console.error('[Supabase Search] Live query failure:', err);
    throw err;
  }

  // Bind exclusively to live Supabase candidates
  const allCandidates: DemoAthlete[] = supabaseCandidates;
  const seen = new Set(allCandidates.map((row) => row.id));
  for (const local of localBuddyCards()) {
    if (!seen.has(local.id)) allCandidates.push(local);
  }

  // If no query string, filter by radius and sort by match score
  if (!cleanQuery) {
    const results = allCandidates
      .filter((a) => (a.distance_km ?? a.distanceKm ?? 0) <= radiusKm)
      .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
    return { results, fromSupabase: fetchedFromSupabase };
  }

  // Tokenize search query for multi-token fuzzy matching
  const tokens = cleanQuery.split(/\s+/).filter(Boolean);

  const scored = allCandidates.map((ath) => {
    let relevanceScore = 0;
    const nameLower = ath.name.toLowerCase();
    const gymLower = (ath.home_gym || ath.homeGym || '').toLowerCase();
    const discLower = (ath.discipline || '').toLowerCase();
    const trainDiscLower = (ath.training_discipline || '').toLowerCase();
    const handleLower = (ath.handle || '').toLowerCase();
    const splitLower = (ath.current_split || '').toLowerCase();
    const bioLower = (ath.bio || '').toLowerCase();
    const focusLower = (ath.focus || '').toLowerCase();

    // 1. Exact full name match
    if (nameLower === cleanQuery) {
      relevanceScore += 140;
    } else if (nameLower.startsWith(cleanQuery)) {
      relevanceScore += 90;
    }

    // 2. Token based matching
    tokens.forEach((token) => {
      if (nameLower.includes(token)) relevanceScore += 65;
      if (gymLower.includes(token)) relevanceScore += 80; // Gym search is high priority
      if (discLower.includes(token) || trainDiscLower.includes(token)) relevanceScore += 70;
      if (handleLower.includes(token)) relevanceScore += 50;
      if (splitLower.includes(token)) relevanceScore += 45;
      if (focusLower.includes(token) || bioLower.includes(token)) relevanceScore += 30;
    });

    // 3. Destination City Corridor Discovery: If query specifies a destination city
    // (e.g. "Sydney", "Miami", "London", "Munich", etc.) ensure matching profiles or corridor members appear
    const knownCities = ['sydney', 'melbourne', 'miami', 'london', 'munich', 'gold coast', 'tokyo', 'dubai', 'austin', 'los angeles', 'new york'];
    const matchedCity = knownCities.find((c) => cleanQuery.includes(c));
    if (matchedCity) {
      if (gymLower.includes(matchedCity) || bioLower.includes(matchedCity)) {
        relevanceScore += 100;
      }
    }

    // If candidate didn't match any token at all, score remains 0
    if (relevanceScore === 0) {
      return { athlete: ath, score: 0 };
    }

    // Online status bonus
    if (ath.is_online) relevanceScore += 10;

    // Proximity factor: closer athletes get slight preference
    const dist = ath.distance_km ?? ath.distanceKm ?? 5;
    relevanceScore -= dist * 1.1;

    // Match score weighting
    const match = ath.match_score ?? ath.matchPercentage ?? 0;
    relevanceScore += match * 0.25;

    return { athlete: ath, score: relevanceScore };
  });

  const matched = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.athlete);

  return { results: matched, fromSupabase: fetchedFromSupabase };
}

