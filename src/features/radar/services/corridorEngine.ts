import { supabase } from '../../../services/supabaseClient';
import { DemoAthlete, Coordinates } from '../types';
import { calculateDistance } from './matchingEngine';
import { DEFAULT_CORRIDOR_BUDDIES, LOCAL_MOCK_BUDDIES } from '../radarCorridorTypes';

export { DEFAULT_CORRIDOR_BUDDIES, LOCAL_MOCK_BUDDIES };

/**
 * Corridor Engine
 * Binds exclusively to live Supabase buddy_profiles queries.
 * Never injects synthetic or mock buddies.
 */
export interface CorridorQueryOptions {
  userCoords: Coordinates;
  radiusKm: number;
  searchQuery?: string;
  destinationCity?: string;
  verifiedOnly?: boolean;
}

export const corridorEngine = {
  /**
   * Fetch active corridor athletes exclusively from live Supabase buddy_profiles table
   */
  async fetchCorridorAthletes(options: CorridorQueryOptions): Promise<{ athletes: DemoAthlete[]; error: string | null }> {
    try {
      let query = supabase.from('buddy_profiles').select('*').eq('is_ghost_mode', false);

      if (options.verifiedOnly) {
        query = query.eq('is_verified', true);
      }

      const cleanQuery = options.searchQuery?.trim().toLowerCase() || options.destinationCity?.trim().toLowerCase();
      if (cleanQuery) {
        query = query.or(
          `athlete_name.ilike.%${cleanQuery}%,home_gym.ilike.%${cleanQuery}%,discipline.ilike.%${cleanQuery}%,handle.ilike.%${cleanQuery}%,current_split.ilike.%${cleanQuery}%`
        );
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error('[CorridorEngine] Live Supabase buddy_profiles query error:', error);
        return { athletes: [], error: error.message };
      }

      if (!Array.isArray(data) || data.length === 0) {
        return { athletes: [], error: null };
      }

      const mapped: DemoAthlete[] = data.map((item: any) => {
        const lat = Number(item.latitude) || options.userCoords.latitude;
        const lon = Number(item.longitude) || options.userCoords.longitude;
        const dist = Number(calculateDistance(options.userCoords.latitude, options.userCoords.longitude, lat, lon).toFixed(1));

        return {
          id: String(item.id),
          name: item.athlete_name || item.name || 'Athletic Member',
          handle: item.handle || '@athlete',
          age: Number(item.age) || 25,
          home_gym: item.home_gym || 'Oblivion 1 Partner Gym',
          distance_km: dist,
          match_score: Number(item.match_score) || 85,
          image_url: item.avatar_url || item.image_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
          photos: item.photos || [item.avatar_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'],
          discipline: item.discipline || 'Fitness',
          training_discipline: item.discipline?.toUpperCase() || 'GENERAL ATHLETICS',
          current_split: item.current_split || 'Standard Split',
          bio: item.bio || 'Oblivion 1 athlete active in corridor.',
          is_online: !item.is_ghost_mode,
          is_verified: Boolean(item.is_verified),
          verified_at: item.verified_at,
        };
      }).filter((ath) => ath.distance_km <= options.radiusKm);

      return { athletes: mapped, error: null };
    } catch (err: any) {
      console.error('[CorridorEngine] Critical error querying Supabase buddy_profiles:', err);
      return { athletes: [], error: err?.message || 'Database network failure' };
    }
  },
};
