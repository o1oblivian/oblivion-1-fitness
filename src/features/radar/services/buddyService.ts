import { Coordinates, BuddyProfile, MatchFilter, BuddyMatchResult, DemoAthlete } from '../types';
import { calculateDistance, calculateMatchScore } from './matchingEngine';
import { supabase } from '../../../services/supabaseClient';
import { safeStorage } from '../../../utils/safeStorage';
import { radiusBox } from './buddyLaunch';

interface RemoteBuddyRow {
  id?: string;
  user_id?: string;
  athlete_name?: string;
  name?: string;
  handle?: string;
  age?: number | string;
  home_gym?: string;
  latitude?: number | string;
  longitude?: number | string;
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
  verified?: boolean;
  is_verified?: boolean;
}

const LOCAL_BUDDIES_KEY = 'o1_buddy_local';

export function localBuddyCards(): DemoAthlete[] {
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

export const DEMO_BUDDY_ATHLETES: DemoAthlete[] = [];

export const FALLBACK_BUDDY_PROFILES: BuddyProfile[] = [];

export async function fetchNearbyBuddies(
  userCoords: Coordinates,
  filters: MatchFilter,
  userProfile: Partial<BuddyProfile> = {}
): Promise<BuddyMatchResult[]> {
  let candidates: BuddyProfile[] = [];

  try {
    const { data, error } = await supabase
      .from('buddy_profiles')
      .select('*')
      .eq('is_ghost_mode', false);
    if (!error && Array.isArray(data) && data.length > 0) {
      candidates = data as BuddyProfile[];
    } else {
      candidates = [];
    }
  } catch (err) {
    console.error('[BuddyService] Live Supabase query failed:', err);
    candidates = [];
  }

  const results: BuddyMatchResult[] = candidates
    .filter((candidate) => !candidate.is_ghost_mode)
    .map((candidate) => {
      const distanceKm = calculateDistance(
        userCoords.latitude,
        userCoords.longitude,
        candidate.latitude,
        candidate.longitude
      );
      const { score, reasons } = calculateMatchScore(userProfile, candidate, distanceKm);
      return {
        profile: candidate,
        distanceKm,
        compatibilityScore: score,
        matchReasons: reasons,
      };
    })
    .filter((match) => {
      if (filters.maxDistanceKm && match.distanceKm > filters.maxDistanceKm) return false;
      if (
        filters.discipline &&
        filters.discipline !== 'All' &&
        match.profile.discipline.toLowerCase() !== filters.discipline.toLowerCase()
      ) {
        return false;
      }
      if (filters.minCompatibility && match.compatibilityScore < filters.minCompatibility) return false;
      return true;
    })
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  return results;
}

export async function syncUserBuddyLocation(
  profile: Partial<BuddyProfile>,
  coords: Coordinates
): Promise<boolean> {
  try {
    const payload = {
      athlete_name: profile.athlete_name || 'Oblivion Athlete',
      handle: profile.handle || '@o1_athlete',
      latitude: coords.latitude,
      longitude: coords.longitude,
      discipline: profile.discipline || 'Hypertrophy',
      current_split: profile.current_split || 'Push Focus',
      is_ghost_mode: Boolean(profile.is_ghost_mode),
      last_active: new Date().toISOString(),
    };
    const { error } = await supabase.insert('buddy_profiles', payload);
    return !error;
  } catch (err) {
    console.warn('[BuddyService] Telemetry location sync deferred:', err);
    return false;
  }
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
    if (!remoteDeck.error && Array.isArray(remoteDeck.data)) {
      fetchedFromSupabase = true;
      supabaseCandidates = remoteDeck.data.flatMap((raw) => {
        const item = raw as RemoteBuddyRow & { distance_km?: number };
        const lat = Number(item.latitude);
        const lon = Number(item.longitude);
        if (item.is_ghost_mode) return [];
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) return [];
        const dist = Number(item.distance_km);
        const photo = String(item.avatar_url || item.image_url || item.avatar || '');
        const safePhoto = photo.includes('images.unsplash.com') ? '' : photo;
        const recent = item.last_active ? Date.now() - new Date(item.last_active).getTime() < 15 * 60 * 1000 : false;
        return [{
          id: String(item.id || item.user_id || ''),
          name: String(item.athlete_name || item.name || '').trim(),
          handle: item.handle || '',
          age: Number(item.age) || 0,
          home_gym: item.home_gym || '',
          distance_km: Number.isFinite(dist) ? dist : Number(calculateDistance(userCoords.latitude, userCoords.longitude, lat, lon).toFixed(1)),
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
          is_verified: Boolean(item.verified || item.is_verified),
        }];
      }).filter((row) => row.name);
    }
    const textMatch = `athlete_name.ilike.%${cleanQuery}%,home_gym.ilike.%${cleanQuery}%,current_split.ilike.%${cleanQuery}%`;
    const box = radiusBox(userCoords.latitude, userCoords.longitude, radiusKm);
    if (remoteDeck.error || !Array.isArray(remoteDeck.data)) {
    const columns = 'id,user_id,athlete_name,age,home_gym,latitude,longitude,avatar_url,image_url,discipline,current_split,training_time,gender,looking_for,training_place,experience_level,bio,last_active,is_ghost_mode,verified,is_verified,handle';
    const bounded = (withGhost: boolean) => {
      let query = supabase.from('buddy_profiles').select(columns).gte('latitude', box.minLat).lte('latitude', box.maxLat);
      if (box.minLng >= -180 && box.maxLng <= 180) {
        query = query.gte('longitude', box.minLng).lte('longitude', box.maxLng);
      }
      if (withGhost) query = query.eq('is_ghost_mode', false);
      if (cleanQuery) query = query.or(textMatch);
      return query.limit(200);
    };
    let { data, error } = await bounded(true);
    if (error) {
      const open = await bounded(false);
      data = open.data;
      error = open.error;
    }
    if (error) throw new Error(error.message);

    if (!error && Array.isArray(data)) {
      fetchedFromSupabase = true;
      supabaseCandidates = data.flatMap((raw) => {
        const item = raw as RemoteBuddyRow;
        const lat = Number(item.latitude);
        const lon = Number(item.longitude);
        if (item.is_ghost_mode) return [];
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) return [];
        const dist = Number(calculateDistance(userCoords.latitude, userCoords.longitude, lat, lon).toFixed(1));
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
          is_verified: Boolean(item.verified || item.is_verified),
        }];
      }).filter((row) => row.name);
    } else if (error) {
      console.error('[Supabase Search] PostgREST query error:', error);
    }
    }
  } catch (err) {
    console.error('[Supabase Search] Live query failure:', err);
    throw err;
  }

  // Bind exclusively to live Supabase candidates
  const allCandidates: DemoAthlete[] = supabaseCandidates;
  const seen = new Set(allCandidates.map((row) => row.id));
  if (import.meta.env.DEV) {
    for (const local of localBuddyCards()) {
      if (!seen.has(local.id)) allCandidates.push(local);
    }
  }

  // If no query string, filter by radius and sort by match score
  if (!cleanQuery) {
    const results = allCandidates
      .filter((a) => (a.distance_km ?? a.distanceKm ?? 0) <= radiusKm)
      .sort((a, b) => (b.match_score ?? 85) - (a.match_score ?? 85));
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

