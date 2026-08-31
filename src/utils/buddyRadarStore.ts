import { supabase, isSupabaseConfigured, findBuddyMatchesPostGIS } from './supabase';
import { encodeGeohash, getGeohashPrefixForRadius, globalProfileCache, deltaSyncQueue, globalApiRateLimiter, swipeBatchBuffer } from './scaleEngine';

export interface BuddyProfile {
  id: string;
  user_email: string;
  user_name: string;
  avatar_url: string;
  handle: string;
  photos: string[];
  age: number;
  height: number;
  weight: number;
  show_weight?: boolean;
  training_focus?: string;
  discipline: string;
  experience_level: string;
  preferred_time: string;
  home_gym: string;
  current_gym: string;
  gym_zone_sharing: boolean;
  public_telemetry: boolean;
  is_ghost_mode: boolean;
  latitude: number;
  longitude: number;
  last_active_at: string;
  distance_km?: number;
}

export interface BuddyConnection {
  id: string;
  user_email: string;
  buddy_email: string;
  status: 'pending' | 'connected' | 'fist_bumped';
  created_at: string;
}

export interface RadarFilters {
  ageRange: [number, number];
  radiusKm: number;
  disciplines: string[];
  preferredTimes: string[];
}

export const DEFAULT_FILTERS: RadarFilters = {
  ageRange: [18, 55],
  radiusKm: 50,
  disciplines: [],
  preferredTimes: [],
};

export const DISCIPLINES = [
  'Hypertrophy', 'Powerlifting', 'CrossFit', 'Calisthenics',
  'Olympic Lifting', 'Bodybuilding', 'Functional', 'HIIT',
  'Endurance', 'Martial Arts', 'Yoga', 'Sport-Specific',
];

export const TIME_SLOTS = [
  'Early Bird (5-7 AM)', 'Morning (7-9 AM)', 'Mid-Morning (9-11 AM)',
  'Lunch (11 AM-1 PM)', 'Afternoon (1-4 PM)', 'Evening (4-7 PM)',
  'Night (7-10 PM)', 'Late Night (10 PM+)',
];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchRadarBuddies(
  currentEmail: string,
  myLat: number,
  myLng: number,
  filters: RadarFilters,
  limit = 40
): Promise<BuddyProfile[]> {
  const cacheKey = `radar_${myLat.toFixed(2)}_${myLng.toFixed(2)}_${filters.radiusKm}_${filters.disciplines.join(',')}`;
  const cached = globalProfileCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 30000) {
    return cached.data;
  }

  if (!isSupabaseConfigured()) {
    const mock = generateMockBuddies(myLat, myLng);
    globalProfileCache.set(cacheKey, { data: mock, timestamp: Date.now() });
    return mock;
  }

  // Fast-resolve with 1.2s timeout so the UI opens instantly even on cold start or network lag
  const remoteFetchPromise = async (): Promise<BuddyProfile[]> => {
    // Attempt PostGIS RPC for 100M-scale indexed geospatial lookup
    try {
      const postGisMatches = await findBuddyMatchesPostGIS(currentEmail, myLat, myLng, filters.radiusKm);
      if (postGisMatches && postGisMatches.length > 0) {
        const buddies = (postGisMatches as BuddyProfile[]).filter((b) => {
          if (b.age < filters.ageRange[0] || b.age > filters.ageRange[1]) return false;
          if (filters.disciplines.length > 0 && !filters.disciplines.includes(b.discipline)) return false;
          if (filters.preferredTimes.length > 0 && !filters.preferredTimes.includes(b.preferred_time)) return false;
          return true;
        });
        globalProfileCache.set(cacheKey, { data: buddies, timestamp: Date.now() });
        return buddies;
      }
    } catch (e) {
      console.warn('[BuddyRadarStore] PostGIS fallback:', e);
    }

    // Fallback: Bounded Bounding Box Query with Geohash
    const degPerKm = 1 / 111.32;
    const latDelta = filters.radiusKm * degPerKm;
    const lngDelta = (filters.radiusKm * degPerKm) / Math.cos((myLat * Math.PI) / 180);

    const query = supabase
      .from('profiles')
      .select('id, user_email, user_name, avatar_url, handle, photos, age, height, weight, show_weight, training_focus, discipline, experience_level, preferred_time, home_gym, current_gym, gym_zone_sharing, public_telemetry, is_ghost_mode, latitude, longitude, last_active_at')
      .neq('user_email', currentEmail)
      .eq('is_ghost_mode', false)
      .gte('latitude', myLat - latDelta)
      .lte('latitude', myLat + latDelta)
      .gte('longitude', myLng - lngDelta)
      .lte('longitude', myLng + lngDelta)
      .limit(limit);

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      const mock = generateMockBuddies(myLat, myLng);
      globalProfileCache.set(cacheKey, { data: mock, timestamp: Date.now() });
      return mock;
    }

    const ids = data.map(d => d.id);
    const { data: vaultPhotos } = await supabase
      .from('profile_media')
      .select('user_id, media_url')
      .in('user_id', ids.slice(0, 50))
      .eq('show_on_buddy', true)
      .order('sort_order', { ascending: true });

    const photosByUser: Record<string, string[]> = {};
    if (vaultPhotos) {
      for (const row of vaultPhotos) {
        if (!photosByUser[row.user_id]) photosByUser[row.user_id] = [];
        photosByUser[row.user_id].push(row.media_url);
      }
    }

    const results = (data as BuddyProfile[])
      .map((b) => ({
        ...b,
        photos: photosByUser[b.id] || b.photos || [],
        distance_km: haversineKm(myLat, myLng, b.latitude, b.longitude),
      }))
      .filter((b) => {
        if (b.age < filters.ageRange[0] || b.age > filters.ageRange[1]) return false;
        if (b.distance_km! > filters.radiusKm) return false;
        if (filters.disciplines.length > 0 && !filters.disciplines.includes(b.discipline)) return false;
        if (filters.preferredTimes.length > 0 && !filters.preferredTimes.includes(b.preferred_time)) return false;
        return true;
      })
      .sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));

    globalProfileCache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;
  };

  try {
    const timeoutPromise = new Promise<BuddyProfile[]>((resolve) =>
      setTimeout(() => {
        const mock = generateMockBuddies(myLat, myLng);
        resolve(mock);
      }, 1500)
    );
    return await Promise.race([remoteFetchPromise(), timeoutPromise]);
  } catch {
    const mock = generateMockBuddies(myLat, myLng);
    return mock;
  }
}

export async function fetchMyConnections(email: string): Promise<BuddyConnection[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase
    .from('buddy_connections')
    .select('*')
    .or(`user_email.eq.${email},buddy_email.eq.${email}`)
    .limit(100);
  return (data as BuddyConnection[]) || [];
}

export async function sendFistBump(myEmail: string, buddyEmail: string): Promise<boolean> {
  // Queue in idempotent delta queue and batch buffer for high scale
  swipeBatchBuffer.recordSwipe({
    userId: myEmail,
    targetId: buddyEmail,
    action: 'fist_bump',
    timestamp: Date.now(),
  });

  deltaSyncQueue.enqueue('buddy_connections', 'UPSERT', {
    user_email: myEmail,
    buddy_email: buddyEmail,
    status: 'fist_bumped',
  });

  if (!isSupabaseConfigured()) return true;
  const { error } = await supabase
    .from('buddy_connections')
    .upsert(
      { user_email: myEmail, buddy_email: buddyEmail, status: 'fist_bumped' },
      { onConflict: 'user_email,buddy_email' }
    );
  return !error;
}

export function recordBuddySwipe(myEmail: string, buddyEmail: string, action: 'like' | 'pass' | 'superlike' | 'fist_bump'): void {
  swipeBatchBuffer.recordSwipe({
    userId: myEmail,
    targetId: buddyEmail,
    action,
    timestamp: Date.now(),
  });
}


export async function updateMyRadarProfile(
  email: string,
  fields: Partial<BuddyProfile>
): Promise<boolean> {
  deltaSyncQueue.enqueue('profiles', 'UPDATE', { user_email: email, ...fields });
  if (!isSupabaseConfigured()) return true;
  const { error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('user_email', email);
  return !error;
}

const MOCK_ATHLETES: Array<{
  name: string; age: number; height: number; weight: number;
  show_weight?: boolean; training_focus?: string;
  discipline: string; level: string; time: string;
  homeGym: string; currentGym: string; photos: string[];
}> = [
  {
    name: 'Alex Torres', age: 27, height: 183, weight: 88, show_weight: true, training_focus: 'Mass & Strength',
    discipline: 'Hypertrophy', level: 'Advanced', time: 'Evening (4-7 PM)',
    homeGym: 'Iron Works', currentGym: 'Iron Works',
    photos: ['https://images.pexels.com/photos/36085104/pexels-photo-36085104.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
  },
  {
    name: 'Jordan Kim', age: 24, height: 170, weight: 62, show_weight: false, training_focus: 'SBD Prep',
    discipline: 'Powerlifting', level: 'Intermediate', time: 'Morning (7-9 AM)',
    homeGym: 'Fitness First', currentGym: 'Fitness First',
    photos: ['https://images.pexels.com/photos/7900679/pexels-photo-7900679.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
  },
  {
    name: 'Sam Rivera', age: 31, height: 178, weight: 82, show_weight: true, training_focus: 'MetCon Endurance',
    discipline: 'CrossFit', level: 'Elite', time: 'Early Bird (5-7 AM)',
    homeGym: 'CrossFit Box', currentGym: 'CrossFit Box',
    photos: ['https://images.pexels.com/photos/13951271/pexels-photo-13951271.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
  },
  {
    name: 'Casey Chen', age: 22, height: 165, weight: 58, show_weight: false, training_focus: 'Bodyweight Mastery',
    discipline: 'Calisthenics', level: 'Intermediate', time: 'Afternoon (1-4 PM)',
    homeGym: 'Gold\'s Gym', currentGym: 'Gold\'s Gym',
    photos: ['https://images.pexels.com/photos/13464105/pexels-photo-13464105.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
  },
  {
    name: 'Riley Brooks', age: 29, height: 188, weight: 95, show_weight: true, training_focus: 'Heavy Compounds',
    discipline: 'Powerlifting', level: 'Advanced', time: 'Evening (4-7 PM)',
    homeGym: 'Iron Works', currentGym: 'Iron Works',
    photos: ['https://images.pexels.com/photos/17210041/pexels-photo-17210041.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
  },
  {
    name: 'Morgan Lee', age: 26, height: 168, weight: 60, show_weight: false, training_focus: 'Agility & Core',
    discipline: 'Functional', level: 'Intermediate', time: 'Lunch (11 AM-1 PM)',
    homeGym: 'F45 Training', currentGym: 'Anytime Fitness',
    photos: ['https://images.pexels.com/photos/14055666/pexels-photo-14055666.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
  },
  {
    name: 'Drew Patel', age: 34, height: 175, weight: 79, show_weight: true, training_focus: 'Snatch & C&J',
    discipline: 'Olympic Lifting', level: 'Elite', time: 'Morning (7-9 AM)',
    homeGym: 'Fitness First', currentGym: 'Iron Works',
    photos: ['https://images.pexels.com/photos/8874919/pexels-photo-8874919.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
  },
  {
    name: 'Jamie Cruz', age: 25, height: 172, weight: 67, show_weight: false, training_focus: 'HIIT Conditioning',
    discipline: 'HIIT', level: 'Intermediate', time: 'Night (7-10 PM)',
    homeGym: 'Anytime Fitness', currentGym: 'Anytime Fitness',
    photos: ['https://images.pexels.com/photos/17232317/pexels-photo-17232317.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
  },
  {
    name: 'Taylor Singh', age: 28, height: 180, weight: 84, show_weight: true, training_focus: 'PPL Hypertrophy',
    discipline: 'Bodybuilding', level: 'Advanced', time: 'Evening (4-7 PM)',
    homeGym: 'Gold\'s Gym', currentGym: 'Gold\'s Gym',
    photos: ['https://images.pexels.com/photos/8612474/pexels-photo-8612474.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
  },
  {
    name: 'Avery Okafor', age: 23, height: 176, weight: 73, show_weight: false, training_focus: 'Zone 2 & Sprint',
    discipline: 'Endurance', level: 'Beginner', time: 'Early Bird (5-7 AM)',
    homeGym: 'F45 Training', currentGym: 'F45 Training',
    photos: ['https://images.pexels.com/photos/14593311/pexels-photo-14593311.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
  },
  {
    name: 'Quinn Nakamura', age: 30, height: 169, weight: 71, show_weight: false, training_focus: 'Striking & Grapple',
    discipline: 'Martial Arts', level: 'Advanced', time: 'Night (7-10 PM)',
    homeGym: 'CrossFit Box', currentGym: 'CrossFit Box',
    photos: ['https://images.pexels.com/photos/29981151/pexels-photo-29981151.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
  },
  {
    name: 'Blake Williams', age: 33, height: 185, weight: 90, show_weight: true, training_focus: 'Upper Hypertrophy',
    discipline: 'Hypertrophy', level: 'Elite', time: 'Afternoon (1-4 PM)',
    homeGym: 'Iron Works', currentGym: 'Iron Works',
    photos: ['https://images.pexels.com/photos/13077328/pexels-photo-13077328.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
  },
];

export function generateMockBuddies(myLat: number, myLng: number): BuddyProfile[] {
  // Pre-determined realistic distance offsets in km to represent local to 250km regional hubs
  const DISTANCE_OFFSETS_KM = [
    2.4,   // Hyper-local (Gym floor / Suburb)
    4.8,   // Local
    8.2,   // Metro neighborhood
    14.5,  // Suburb
    22.0,  // City metro
    38.0,  // Greater metro
    48.5,  // 50km boundary
    76.0,  // Regional corridor
    115.0, // Multi-city transit (100km+)
    145.0, // Intercity zone (150km)
    195.0, // Regional state (200km)
    238.0, // Max regional radius (250km)
  ];

  return MOCK_ATHLETES.map((a, i) => {
    const targetDistKm = DISTANCE_OFFSETS_KM[i % DISTANCE_OFFSETS_KM.length];
    // Convert target distance (km) to angular offset in degrees (approx 111 km per deg)
    const angle = (i * (360 / MOCK_ATHLETES.length) * Math.PI) / 180;
    const dLat = (targetDistKm / 111) * Math.cos(angle);
    const dLng = (targetDistKm / (111 * Math.cos((myLat * Math.PI) / 180))) * Math.sin(angle);
    const lat = myLat + dLat;
    const lng = myLng + dLng;

    return {
      id: `mock-${i}`,
      user_email: `${a.name.toLowerCase().replace(' ', '.')}@example.com`,
      user_name: a.name,
      avatar_url: a.photos[0] || '',
      handle: `@${a.name.toLowerCase().replace(' ', '_')}`,
      photos: a.photos,
      age: a.age,
      height: a.height,
      weight: a.weight,
      show_weight: a.show_weight ?? true,
      training_focus: a.training_focus || a.discipline,
      discipline: a.discipline,
      experience_level: a.level,
      preferred_time: a.time,
      home_gym: a.homeGym,
      current_gym: a.currentGym,
      gym_zone_sharing: true,
      public_telemetry: Math.random() > 0.2,
      is_ghost_mode: false,
      latitude: lat,
      longitude: lng,
      last_active_at: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
      distance_km: Math.round(haversineKm(myLat, myLng, lat, lng) * 10) / 10,
    };
  });
}
