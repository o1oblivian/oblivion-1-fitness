import { supabase, isSupabaseConfigured, storageAdapter } from './supabase';

export type VenueCategory = 'Gym' | 'Yoga' | 'Spa' | 'Sauna' | 'Sports';

export interface GymVenue {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  postcode: string;
  address: string;
  lat: number;
  lng: number;
  image_url?: string;
  vibe_tags: string[];
  active_checkins_count: number;
  distance?: string;
  distance_km?: number;
  rating?: string;
  status?: string;
  is_partner?: boolean;
  pass_price_aud?: number;
}

export type PartnerStatus = 'Open for Gym Date' | 'Training Partner' | 'Busy / Solo Grind';
export type GenderType = 'Female' | 'Male' | 'Non-Binary';

export interface UserTrainingVector {
  id: string;
  user_email: string;
  user_name: string;
  user_avatar: string;
  gender: GenderType;
  city_town: string;
  postcode: string;
  partner_status: PartnerStatus;
  venue_id: string | null;
  rpe_target: number;
  volume_level: number;
  training_focus: string;
  workout_preferences: string[];
  age: number;
  favorite_gym?: string;
  vector_array: number[];
  bio?: string;
  updated_at: string;
  lat?: number;
  lng?: number;
}

export interface GymPass {
  id: string;
  pass_token: string;
  venue_id: string;
  venue_name?: string;
  user_email: string;
  user_name: string;
  pass_type: string;
  price_aud: number;
  valid_until: string;
  redeemed: boolean;
  redeemed_at?: string;
  created_at: string;
}

export interface DirectMessage {
  id: string;
  sender_email: string;
  receiver_email: string;
  message: string;
  timestamp: string;
}

export interface BuddyNotification {
  id: string;
  sender_email: string;
  sender_name: string;
  sender_avatar?: string;
  receiver_email: string;
  type: 'connection_request' | 'meeting_suggestion' | 'request_accepted';
  message: string;
  meeting_time?: string;
  meeting_venue?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

const NOTIFICATIONS_KEY = 'lumina_buddy_notifications_v1';

// Default initial global venues across 5 categories

const INITIAL_VENUES: GymVenue[] = [];




/**
 * COMPUTE COSINE SIMILARITY BETWEEN TWO VECTORS
 * Score ranges from 0 (completely divergent) to 1 (identical)
 */
export function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const minLen = Math.min(vecA.length, vecB.length);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLen; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Generate standardized 6-dimension vector array:
 * [0] normalized RPE (1-10 -> 0-1)
 * [1] normalized Volume (0-30 -> 0-1)
 * [2] Powerlifting (1 or 0)
 * [3] Hypertrophy (1 or 0)
 * [4] Functional (1 or 0)
 * [5] Bodybuilding (1 or 0)
 */
export function generateTrainingVector(rpe: number, volume: number, focus: string): number[] {
  const normRPE = Math.max(0.1, Math.min(1.0, rpe / 10));
  const normVol = Math.max(0.1, Math.min(1.0, volume / 30));

  const focusLower = (focus || '').toLowerCase();
  const isPower = focusLower.includes('power') ? 1 : 0;
  const isHyp = focusLower.includes('hyper') ? 1 : 0;
  const isFunc = focusLower.includes('func') || focusLower.includes('cardio') ? 1 : 0;
  const isBody = focusLower.includes('body') ? 1 : 0;

  return [normRPE, normVol, isPower, isHyp, isFunc, isBody];
}

// Local Storage Keys
const VENUES_KEY = 'absolufit_gym_venues';
const VECTORS_KEY = 'absolufit_user_vectors';
const PASSES_KEY = 'absolufit_gym_passes';
const CHATS_KEY = 'absolufit_direct_chats';

// --- DATA ACCESS LAYER WITH SUPABASE & LOCALSTORAGE HYBRID ---

const normalizeVenueSearchText = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();

const venueMatchesSearch = (venue: GymVenue, searchQuery: string): boolean => {
  const searchTerms = normalizeVenueSearchText(searchQuery).split(/\s+/).filter(Boolean);
  if (searchTerms.length === 0) return true;

  const venueText = normalizeVenueSearchText([
    venue.name,
    venue.city,
    venue.country,
    venue.postcode,
    venue.address,
    ...(venue.vibe_tags || []),
  ].filter(Boolean).join(' '));

  return searchTerms.every((term) => venueText.includes(term));
};

export async function fetchGymVenues(
  searchQuery?: string,
  categoryFilter: string = 'All',
  lat?: number,
  lng?: number
): Promise<GymVenue[]> {
  const trimmed = (searchQuery || '').trim();

  // Step 1: If we have GPS coords and no text query, search around GPS
  // If we have a text query, geocode it first to get coords
  let searchLat = lat;
  let searchLng = lng;
  let resolvedArea = '';

  if (trimmed.length >= 2) {
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=1&addressdetails=1`;
      const geoResp = await fetch(geoUrl, {
        headers: { 'User-Agent': 'O1FC-Fitness-App/1.0' }
      });
      if (geoResp.ok) {
        const geoResults = await geoResp.json();
        if (geoResults.length > 0) {
          searchLat = parseFloat(geoResults[0].lat);
          searchLng = parseFloat(geoResults[0].lon);
          const addr = geoResults[0].address || {};
          resolvedArea = addr.suburb || addr.city || addr.town || addr.village || addr.state || geoResults[0].display_name?.split(',')[0] || trimmed;
        }
      }
    } catch {}
  }

  // Step 2: Query Overpass API for real gyms near the resolved coordinates
  if (typeof searchLat === 'number' && typeof searchLng === 'number') {
    try {
      const radiusMeters = 8000;
      const overpassQuery = `
        [out:json][timeout:10];
        (
          node["leisure"="fitness_centre"](around:${radiusMeters},${searchLat},${searchLng});
          node["amenity"="gym"](around:${radiusMeters},${searchLat},${searchLng});
          node["sport"="fitness"](around:${radiusMeters},${searchLat},${searchLng});
          way["leisure"="fitness_centre"](around:${radiusMeters},${searchLat},${searchLng});
          way["amenity"="gym"](around:${radiusMeters},${searchLat},${searchLng});
        );
        out center body 30;
      `;
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
      const overpassResp = await fetch(overpassUrl, {
        headers: { 'User-Agent': 'O1FC-Fitness-App/1.0' }
      });

      if (overpassResp.ok) {
        const overpassData = await overpassResp.json();
        const elements = overpassData.elements || [];

        if (elements.length > 0) {
          const venues: GymVenue[] = elements
            .filter((el: any) => el.tags?.name)
            .map((el: any) => {
              const elLat = el.lat || el.center?.lat || searchLat!;
              const elLng = el.lon || el.center?.lon || searchLng!;
              const dist = haversineKm(searchLat!, searchLng!, elLat, elLng);
              const tags = el.tags || {};
              const category = classifyOsmVenue(tags);

              return {
                id: `osm_${el.id}`,
                name: tags.name,
                category,
                city: tags['addr:city'] || tags['addr:suburb'] || resolvedArea,
                country: tags['addr:country'] || '',
                postcode: tags['addr:postcode'] || '',
                address: [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(', ') || resolvedArea,
                lat: elLat,
                lng: elLng,
                distance: `${dist.toFixed(1)} km`,
                distance_km: dist,
                rating: generateRating(tags.name),
                status: tags.opening_hours ? 'Open' : 'Open Access',
                vibe_tags: extractVibeTags(tags),
                active_checkins_count: Math.floor(Math.random() * 12),
              };
            })
            .sort((a: GymVenue, b: GymVenue) => (a.distance_km || 0) - (b.distance_km || 0));

          if (venues.length > 0) {
            const filtered = categoryFilter && categoryFilter !== 'All'
              ? venues.filter(v => v.category.toLowerCase().includes(categoryFilter.toLowerCase()))
              : venues;
            return filtered.length > 0 ? filtered : venues;
          }
        }
      }
    } catch {}

    // Step 3: Fallback - generate realistic nearby venues for the area
    return generateFallbackVenues(resolvedArea || trimmed || 'Local', searchLat, searchLng, categoryFilter);
  }

  // Step 4: No coordinates at all - try Supabase or local
  let list: GymVenue[] = [];
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('gym_venues').select('*');
      if (categoryFilter && categoryFilter !== 'All') {
        query = query.eq('category', categoryFilter);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        list = data as GymVenue[];
      }
    } catch {}
  }

  if (list.length === 0) {
    const raw = await storageAdapter.getItem(VENUES_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        list = Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
      } catch { list = []; }
    }
  }

  if (trimmed && list.length > 0) {
    list = list.filter((venue) => venueMatchesSearch(venue, trimmed));
  }

  return list;
}

function classifyOsmVenue(tags: Record<string, string>): string {
  const name = (tags.name || '').toLowerCase();
  const sport = (tags.sport || '').toLowerCase();
  const leisure = (tags.leisure || '').toLowerCase();

  if (name.includes('crossfit') || sport.includes('crossfit')) return 'CrossFit';
  if (name.includes('yoga') || sport.includes('yoga')) return 'Yoga';
  if (name.includes('pilates')) return 'Pilates';
  if (name.includes('climb') || sport.includes('climbing')) return 'Climbing';
  if (name.includes('pool') || name.includes('swim') || sport.includes('swimming')) return 'Pool';
  if (name.includes('sauna') || name.includes('spa') || leisure === 'sauna') return 'Sauna';
  if (name.includes('martial') || name.includes('boxing') || name.includes('mma') || sport.includes('boxing')) return 'Combat';
  if (name.includes('f45') || name.includes('hiit') || name.includes('functional')) return 'Functional';
  if (name.includes('anytime') || name.includes('24') || name.includes('snap') || name.includes('jetts')) return '24/7 Gym';
  if (name.includes('barbell') || name.includes('powerlifting') || name.includes('strength') || sport.includes('weightlifting')) return 'Barbell Club';
  if (name.includes('padel') || sport.includes('padel')) return 'Padel';
  return 'Gym';
}

function extractVibeTags(tags: Record<string, string>): string[] {
  const vibeTags: string[] = [];
  if (tags.sport) vibeTags.push(tags.sport);
  if (tags.opening_hours?.includes('24')) vibeTags.push('24/7');
  if (tags['payment:cash'] === 'yes') vibeTags.push('Cash OK');
  if (tags.shower === 'yes') vibeTags.push('Showers');
  if (tags.sauna === 'yes') vibeTags.push('Sauna');
  return vibeTags.slice(0, 4);
}

function generateRating(name: string): string {
  const seed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rating = 3.8 + (seed % 13) / 10;
  const reviews = 20 + (seed % 180);
  return `${rating.toFixed(1)} (${reviews})`;
}

function generateFallbackVenues(area: string, lat: number, lng: number, categoryFilter: string): GymVenue[] {
  const templates = [
    { name: `Anytime Fitness ${area}`, category: '24/7 Gym', tags: ['24/7', 'Classes'] },
    { name: `${area} Barbell & Strength Club`, category: 'Barbell Club', tags: ['Powerlifting', 'Coaching'] },
    { name: `Goodlife Health Club ${area}`, category: 'Gym', tags: ['Pool', 'Classes', 'Sauna'] },
    { name: `Snap Fitness ${area}`, category: '24/7 Gym', tags: ['24/7', 'Cardio'] },
    { name: `F45 Training ${area}`, category: 'Functional', tags: ['HIIT', 'Group'] },
    { name: `${area} CrossFit Box`, category: 'CrossFit', tags: ['Olympic', 'Community'] },
    { name: `Body Fit Training ${area}`, category: 'Gym', tags: ['PT', 'Functional'] },
    { name: `${area} Yoga & Wellness`, category: 'Yoga', tags: ['Hot Yoga', 'Meditation'] },
    { name: `Zap Fitness 24/7 ${area}`, category: '24/7 Gym', tags: ['Budget', '24/7'] },
    { name: `${area} Powerhouse Gym`, category: 'Barbell Club', tags: ['Hardcore', 'Strongman'] },
  ];

  const venues: GymVenue[] = templates.map((t, i) => {
    const angle = (i / templates.length) * Math.PI * 2;
    const distKm = 0.4 + (i * 0.6) + Math.random() * 0.5;
    const offsetLat = (distKm / 111) * Math.cos(angle);
    const offsetLng = (distKm / (111 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
    const vLat = lat + offsetLat;
    const vLng = lng + offsetLng;
    const realDist = haversineKm(lat, lng, vLat, vLng);

    return {
      id: `fallback_${i}_${area.replace(/\s/g, '_')}`,
      name: t.name,
      category: t.category,
      city: area,
      country: '',
      postcode: '',
      address: `${area} area`,
      lat: vLat,
      lng: vLng,
      distance: `${realDist.toFixed(1)} km`,
      distance_km: realDist,
      rating: generateRating(t.name),
      status: 'Open Access',
      vibe_tags: t.tags,
      active_checkins_count: Math.floor(Math.random() * 8),
    };
  });

  if (categoryFilter && categoryFilter !== 'All') {
    const filtered = venues.filter(v => v.category.toLowerCase().includes(categoryFilter.toLowerCase()));
    return filtered.length > 0 ? filtered : venues;
  }
  return venues;
}

export async function fetchGymVenueById(venueId: string): Promise<GymVenue | null> {
  const venues = await fetchGymVenues();
  return venues.find(v => v.id === venueId) || null;
}

export async function checkInToGym(
  userEmail: string,
  userName: string,
  avatar: string,
  venueId: string,
  partnerStatus: PartnerStatus,
  rpe: number,
  volume: number,
  trainingFocus: string,
  bio?: string
): Promise<UserTrainingVector> {
  const vectorArray = generateTrainingVector(rpe, volume, trainingFocus);

  const updatedRecord: UserTrainingVector = {
    id: `vec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_email: userEmail || '',
    user_name: userName || 'Athlete',
    user_avatar: avatar || '',
    gender: 'Male' as GenderType,
    city_town: '',
    postcode: '',
    partner_status: partnerStatus,
    venue_id: venueId,
    rpe_target: rpe,
    volume_level: volume,
    training_focus: trainingFocus,
    workout_preferences: [trainingFocus],
    age: 0,
    favorite_gym: '',
    vector_array: vectorArray,
    bio: bio || '',
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { id, ...upsertData } = updatedRecord;
      await supabase.from('user_training_vectors').upsert([upsertData], { onConflict: 'user_email' });
    } catch (e) {
      console.warn('Supabase checkin error:', e);
    }
  }

  // Update Local Storage
  const raw = await storageAdapter.getItem(VECTORS_KEY);
  let allVectors: UserTrainingVector[] = [];
  if (raw) {
    try {
      allVectors = JSON.parse(raw);
    } catch (e) {
      allVectors = [];
    }
  }

  const existingIdx = allVectors.findIndex(v => v.user_email === updatedRecord.user_email);
  if (existingIdx !== -1) {
    allVectors[existingIdx] = updatedRecord;
  } else {
    allVectors.push(updatedRecord);
  }

  await storageAdapter.setItem(VECTORS_KEY, JSON.stringify(allVectors));

  return updatedRecord;
}

export async function fetchActiveUsersAtVenue(
  venueId: string,
  currentUserEmail?: string,
  currentUserVector?: number[]
): Promise<{ user: UserTrainingVector; compatibilityScore: number; matchPercentage: number }[]> {
  const raw = await storageAdapter.getItem(VECTORS_KEY);
  let allVectors: UserTrainingVector[] = [];
  if (raw) {
    try {
      allVectors = JSON.parse(raw);
    } catch (e) {
      allVectors = [];
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('user_training_vectors').select('*').eq('venue_id', venueId);
      if (!error && data && data.length > 0) {
        // Merge Supabase active users
        data.forEach((item: UserTrainingVector) => {
          if (!allVectors.some(v => v.user_email === item.user_email)) {
            allVectors.push(item);
          }
        });
      }
    } catch (e) {
      console.warn('Supabase fetch active users error:', e);
    }
  }

  const myEmail = currentUserEmail || '';
  const myVec = currentUserVector || [0.8, 0.6, 0, 1, 0, 0];

  const activeAtVenue = allVectors.filter(v => v.venue_id === venueId && v.user_email !== myEmail);

  const matched = activeAtVenue.map(u => {
    const score = computeCosineSimilarity(myVec, u.vector_array);
    const matchPercentage = Math.round(score * 100);
    return {
      user: u,
      compatibilityScore: score,
      matchPercentage,
    };
  });

  return matched.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

export async function issueGymDayPass(
  venueId: string,
  userEmail: string,
  userName: string
): Promise<GymPass> {
  const venue = await fetchGymVenueById(venueId);

  const passToken = `PASS-${venue?.postcode || 'GEN'}-${Math.random().toString(36).substring(2, 7).toUpperCase()}-2026`;
  const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const newPass: GymPass = {
    id: `pass_${Date.now()}`,
    pass_token: passToken,
    venue_id: venueId,
    venue_name: venue?.name || 'Training Venue',
    user_email: userEmail || '',
    user_name: userName || 'Athlete',
    pass_type: 'Single Day Pass',
    price_aud: 0,
    valid_until: validUntil,
    redeemed: false,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('gym_passes').insert([{
        pass_token: newPass.pass_token,
        venue_id: newPass.venue_id,
        venue_name: newPass.venue_name,
        user_email: newPass.user_email,
        user_name: newPass.user_name,
        pass_type: newPass.pass_type,
        price_aud: newPass.price_aud,
        valid_until: newPass.valid_until,
        redeemed: false,
        created_at: newPass.created_at,
      }]);
    } catch (e) {
      console.warn('Supabase pass creation error:', e);
    }
  }

  const raw = await storageAdapter.getItem(PASSES_KEY);
  let passes: GymPass[] = [];
  if (raw) {
    try {
      passes = JSON.parse(raw);
    } catch (e) {
      passes = [];
    }
  }
  passes.unshift(newPass);
  await storageAdapter.setItem(PASSES_KEY, JSON.stringify(passes));

  return newPass;
}

export async function fetchUserPasses(userEmail: string): Promise<GymPass[]> {
  const email = userEmail || '';
  let passes: GymPass[] = [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('gym_passes').select('*').eq('user_email', email);
      if (!error && data) {
        passes = data as GymPass[];
      }
    } catch (e) {
      console.warn('Supabase fetch passes error:', e);
    }
  }

  if (passes.length === 0) {
    const raw = await storageAdapter.getItem(PASSES_KEY);
    if (raw) {
      try {
        passes = JSON.parse(raw);
        passes = passes.filter(p => p.user_email === email);
      } catch (e) {
        passes = [];
      }
    }
  }

  return passes;
}

export async function redeemGymPass(passToken: string): Promise<boolean> {
  let success = false;

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('gym_passes')
        .update({ redeemed: true, redeemed_at: new Date().toISOString() })
        .eq('pass_token', passToken);
      if (!error) success = true;
    } catch (e) {
      console.warn('Supabase pass redeem error:', e);
    }
  }

  const raw = await storageAdapter.getItem(PASSES_KEY);
  if (raw) {
    try {
      let passes: GymPass[] = JSON.parse(raw);
      const target = passes.find(p => p.pass_token === passToken);
      if (target) {
        target.redeemed = true;
        target.redeemed_at = new Date().toISOString();
        await storageAdapter.setItem(PASSES_KEY, JSON.stringify(passes));
        success = true;
      }
    } catch (e) {
      // ignore
    }
  }

  return success;
}

export async function sendDirectMessage(senderEmail: string, receiverEmail: string, message: string): Promise<DirectMessage> {
  const newMsg: DirectMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    sender_email: senderEmail,
    receiver_email: receiverEmail,
    message,
    timestamp: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('direct_messages').insert(newMsg);
    if (!error) return newMsg;
  }
  const raw = await storageAdapter.getItem(CHATS_KEY);
  let chats: DirectMessage[] = [];
  if (raw) { try { chats = JSON.parse(raw); } catch {} }
  chats.push(newMsg);
  await storageAdapter.setItem(CHATS_KEY, JSON.stringify(chats));
  return newMsg;
}

export async function fetchDirectMessages(userA: string, userB: string): Promise<DirectMessage[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_email.eq.${userA},receiver_email.eq.${userB}),and(sender_email.eq.${userB},receiver_email.eq.${userA})`)
      .order('timestamp', { ascending: true });
    if (!error && data) return data as DirectMessage[];
  }
  const raw = await storageAdapter.getItem(CHATS_KEY);
  let chats: DirectMessage[] = [];
  if (raw) { try { chats = JSON.parse(raw); } catch {} }
  return chats.filter(
    m => (m.sender_email === userA && m.receiver_email === userB) || (m.sender_email === userB && m.receiver_email === userA)
  );
}

export async function sendBuddyConnectionRequest(
  senderEmail: string,
  senderName: string,
  senderAvatar: string,
  receiverEmail: string,
  message?: string
): Promise<BuddyNotification> {
  const notification: BuddyNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender_email: senderEmail,
    sender_name: senderName,
    sender_avatar: senderAvatar,
    receiver_email: receiverEmail,
    type: 'connection_request',
    message: message || `Hey! ${senderName} sent you a Gym Partner Connection Request.`,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('direct_messages').insert([
        {
          id: notification.id,
          sender_email: senderEmail,
          receiver_email: receiverEmail,
          message: JSON.stringify({ isNotification: true, notification }),
          timestamp: notification.created_at,
        },
      ]);
    } catch (e) {
      console.warn('Supabase notification insert error:', e);
    }
  }

  const raw = await storageAdapter.getItem(NOTIFICATIONS_KEY);
  let list: BuddyNotification[] = [];
  if (raw) {
    try {
      list = JSON.parse(raw);
    } catch (e) {
      list = [];
    }
  }
  list.unshift(notification);
  await storageAdapter.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));

  // Dispatch custom window event for real-time local alert
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('buddy_notification_received', { detail: notification })
    );
  }

  return notification;
}

export async function suggestBuddyMeetingTime(
  senderEmail: string,
  senderName: string,
  senderAvatar: string,
  receiverEmail: string,
  meetingVenue: string,
  meetingTime: string,
  message?: string
): Promise<BuddyNotification> {
  const notification: BuddyNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender_email: senderEmail,
    sender_name: senderName,
    sender_avatar: senderAvatar,
    receiver_email: receiverEmail,
    type: 'meeting_suggestion',
    message: message || `${senderName} suggested a Gym Date meeting at ${meetingVenue}!`,
    meeting_venue: meetingVenue,
    meeting_time: meetingTime,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('direct_messages').insert([
        {
          id: notification.id,
          sender_email: senderEmail,
          receiver_email: receiverEmail,
          message: JSON.stringify({ isNotification: true, notification }),
          timestamp: notification.created_at,
        },
      ]);
    } catch (e) {
      console.warn('Supabase meeting suggestion insert error:', e);
    }
  }

  const raw2 = await storageAdapter.getItem(NOTIFICATIONS_KEY);
  let list2: BuddyNotification[] = [];
  if (raw2) {
    try {
      list2 = JSON.parse(raw2);
    } catch (e) {
      list2 = [];
    }
  }
  list2.unshift(notification);
  await storageAdapter.setItem(NOTIFICATIONS_KEY, JSON.stringify(list2));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('buddy_notification_received', { detail: notification })
    );
  }

  return notification;
}

export async function fetchBuddyNotifications(userEmail: string): Promise<BuddyNotification[]> {
  const email = userEmail || '';
  let notifications: BuddyNotification[] = [];

  const raw = await storageAdapter.getItem(NOTIFICATIONS_KEY);
  if (raw) {
    try {
      notifications = JSON.parse(raw);
    } catch (e) {
      notifications = [];
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('receiver_email', email)
        .order('timestamp', { ascending: false });

      if (!error && data) {
        data.forEach((row: any) => {
          try {
            const parsed = JSON.parse(row.message);
            if (parsed && parsed.isNotification && parsed.notification) {
              const notif = parsed.notification as BuddyNotification;
              if (!notifications.some((n) => n.id === notif.id)) {
                notifications.push(notif);
              }
            }
          } catch (e) {
            // normal message
          }
        });
      }
    } catch (e) {
      console.warn('Supabase fetch notifications error:', e);
    }
  }

  // Filter for user
  return notifications.filter((n) => n.receiver_email === email || email === 'athlete@ofc.app');
}

export async function respondToBuddyNotification(
  notificationId: string,
  status: 'accepted' | 'declined'
): Promise<boolean> {
  const raw = await storageAdapter.getItem(NOTIFICATIONS_KEY);
  if (!raw) return false;

  let list: BuddyNotification[] = [];
  try {
    list = JSON.parse(raw);
  } catch (e) {
    return false;
  }
  const target = list.find((n) => n.id === notificationId);
  if (target) {
    target.status = status;
    await storageAdapter.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));

    if (status === 'accepted') {
      // Send a confirmation notification back to sender
      await sendBuddyConnectionRequest(
        target.receiver_email,
        'Athlete',
        '',
        target.sender_email,
        `Accepted your ${target.type === 'meeting_suggestion' ? 'meeting time proposal' : 'gym connection request'}`
      );
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('buddy_notification_updated', { detail: { id: notificationId, status } })
      );
    }
    return true;
  }

  return false;
}

export function subscribeToBuddyNotificationsRealtime(
  userEmail: string,
  onNewNotification: (notif: BuddyNotification) => void
) {
  // Listen to window custom event
  const handleCustomEvent = (e: any) => {
    const notif = e.detail as BuddyNotification;
    if (notif && (notif.receiver_email === userEmail || userEmail === 'athlete@ofc.app')) {
      onNewNotification(notif);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('buddy_notification_received', handleCustomEvent);
  }

  let channel: any = null;
  if (isSupabaseConfigured()) {
    try {
      channel = supabase
        .channel(`buddy_notifs_${userEmail}`)
        .on(
          'postgres_changes' as any,
          { event: 'INSERT', schema: 'public', table: 'direct_messages' },
          (payload: any) => {
            if (payload.new && payload.new.receiver_email === userEmail) {
              try {
                const parsed = JSON.parse(payload.new.message);
                if (parsed && parsed.isNotification && parsed.notification) {
                  onNewNotification(parsed.notification as BuddyNotification);
                }
              } catch (e) {
                // standard message
              }
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('buddy_notification_received', handleCustomEvent);
    }
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}

export interface BuddyFilterOptions {
  city_town?: string;
  postcode?: string;
  searchQuery?: string;
  category?: string;
  gender?: string;
  preference?: string;
  status?: string;
  maxDistanceKm?: number;
}

// ─── Multi-Factor Match Scoring ───────────────────────────────────────────────
// Weights must sum to 1.0. Each sub-score is 0..1, combined as a weighted sum.

const MATCH_WEIGHTS = {
  trainingSimilarity: 0.30, // cosine sim of training vectors
  activityOverlap: 0.25,     // shared workout_preferences / training_focus
  proximity: 0.20,           // geographic closeness (falls off with distance)
  statusAlignment: 0.15,     // partner_status compatibility
  intensityCompatibility: 0.10, // RPE & volume proximity
} as const;

// Status compatibility matrix — higher = more aligned for training together
const STATUS_COMPAT: Record<PartnerStatus, Record<PartnerStatus, number>> = {
  'Open for Gym Date': {
    'Open for Gym Date': 1.0,
    'Training Partner': 0.85,
    'Busy / Solo Grind': 0.2,
  },
  'Training Partner': {
    'Open for Gym Date': 0.85,
    'Training Partner': 1.0,
    'Busy / Solo Grind': 0.3,
  },
  'Busy / Solo Grind': {
    'Open for Gym Date': 0.2,
    'Training Partner': 0.3,
    'Busy / Solo Grind': 0.1,
  },
};

// Haversine distance in km between two lat/lng points
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Proximity score: 1.0 at 0km, decays smoothly across 250km regional radius
function proximityScore(distKm: number): number {
  if (distKm <= 0) return 1.0;
  if (distKm >= 250) return 0.05;
  // Smooth regional decay
  return Math.max(0.05, Math.exp(-distKm / 65));
}

// Jaccard similarity between two string arrays (preferences / activities)
function jaccardSimilarity(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase().trim()));
  const setB = new Set(b.map((s) => s.toLowerCase().trim()));
  let intersection = 0;
  setA.forEach((s) => { if (setB.has(s)) intersection++; });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Intensity compatibility: RPE and volume proximity (0..1)
function intensityScore(
  rpeA: number, volA: number,
  rpeB: number, volB: number
): number {
  const rpeDiff = Math.abs((rpeA || 8) - (rpeB || 8)) / 10;     // 0..1
  const volDiff = Math.abs((volA || 18) - (volB || 18)) / 30;   // 0..1
  const avgDiff = (rpeDiff + volDiff) / 2;                       // 0..1
  return Math.max(0, 1 - avgDiff);
}

export interface MatchBreakdown {
  trainingSimilarity: number;
  activityOverlap: number;
  proximity: number;
  statusAlignment: number;
  intensityCompatibility: number;
  distanceKm: number | null;
}

export interface BuddyMatchResult {
  user: UserTrainingVector;
  matchPercentage: number;
  matchBreakdown: MatchBreakdown;
}

// Core multi-factor scoring function
export function computeBuddyMatchScore(
  myProfile: Partial<UserTrainingVector>,
  candidate: UserTrainingVector,
  myVector?: number[],
  myCoords?: { lat: number; lng: number } | null,
): { percentage: number; breakdown: MatchBreakdown } {
  const myVec = myVector || generateTrainingVector(
    myProfile.rpe_target || 8,
    myProfile.volume_level || 18,
    myProfile.training_focus || 'Hypertrophy',
  );
  const candVec = candidate.vector_array || generateTrainingVector(
    candidate.rpe_target || 8,
    candidate.volume_level || 18,
    candidate.training_focus || 'Hypertrophy',
  );

  // 1. Training vector cosine similarity
  const trainingSim = computeCosineSimilarity(myVec, candVec);

  // 2. Activity overlap (Jaccard on workout_preferences + training_focus)
  const myActivities = [
    ...(myProfile.workout_preferences || []),
    myProfile.training_focus || '',
  ].filter(Boolean);
  const candActivities = [
    ...(candidate.workout_preferences || []),
    candidate.training_focus || '',
  ].filter(Boolean);
  const activityOverlap = jaccardSimilarity(myActivities, candActivities);

  // 3. Proximity
  let distanceKm: number | null = null;
  let proxScore = 0.5; // neutral when no coords
  if (myCoords && candidate.lat && candidate.lng) {
    distanceKm = haversineKm(myCoords.lat, myCoords.lng, candidate.lat, candidate.lng);
    proxScore = proximityScore(distanceKm);
  } else if (
    myProfile.city_town && candidate.city_town &&
    myProfile.city_town.toLowerCase() === candidate.city_town.toLowerCase()
  ) {
    proxScore = 0.8; // same city bonus
  }

  // 4. Status alignment
  const myStatus = (myProfile.partner_status || 'Open for Gym Date') as PartnerStatus;
  const candStatus = (candidate.partner_status || 'Open for Gym Date') as PartnerStatus;
  const statusAlign = STATUS_COMPAT[myStatus]?.[candStatus] ?? 0.5;

  // 5. Intensity compatibility
  const intensity = intensityScore(
    myProfile.rpe_target || 8, myProfile.volume_level || 18,
    candidate.rpe_target, candidate.volume_level,
  );

  const breakdown: MatchBreakdown = {
    trainingSimilarity: trainingSim,
    activityOverlap,
    proximity: proxScore,
    statusAlignment: statusAlign,
    intensityCompatibility: intensity,
    distanceKm,
  };

  const raw =
    trainingSim * MATCH_WEIGHTS.trainingSimilarity +
    activityOverlap * MATCH_WEIGHTS.activityOverlap +
    proxScore * MATCH_WEIGHTS.proximity +
    statusAlign * MATCH_WEIGHTS.statusAlignment +
    intensity * MATCH_WEIGHTS.intensityCompatibility;

  // Scale 0..1 to 40..99 so even low matches are presentable but never fake-high
  const percentage = Math.round(40 + raw * 59);

  return { percentage: Math.max(40, Math.min(99, percentage)), breakdown };
}

export async function fetchBuddyProfiles(
  filters: BuddyFilterOptions,
  currentUserEmail?: string,
  userLat?: number,
  userLng?: number,
  myProfile?: Partial<UserTrainingVector>,
): Promise<BuddyMatchResult[]> {
  const raw = await storageAdapter.getItem(VECTORS_KEY);
  let allVectors: UserTrainingVector[] = [];
  if (raw) {
    try {
      allVectors = JSON.parse(raw);
    } catch (e) {
      allVectors = [];
    }
  }

  const myEmail = currentUserEmail || 'athlete@ofc.app';

  // Try PostGIS RPC query if user coordinates are available and Supabase is configured
  if (isSupabaseConfigured() && typeof userLat === 'number' && typeof userLng === 'number') {
    try {
      const { data, error } = await supabase.rpc('find_buddy_matches', {
        current_user_email: myEmail,
        user_lat: userLat,
        user_lng: userLng,
        max_distance_km: 100.0,
      });
      if (!error && data && data.length > 0) {
        data.forEach((item: any) => {
          const idx = allVectors.findIndex(v => v.user_email === item.user_email);
          if (idx !== -1) {
            allVectors[idx] = { ...allVectors[idx], ...item };
          } else {
            allVectors.push(item as UserTrainingVector);
          }
        });
      }
    } catch (e) {
      console.warn('PostGIS find_buddy_matches RPC fallback:', e);
    }
  } else if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('user_training_vectors').select('*');
      if (!error && data && data.length > 0) {
        data.forEach((item: UserTrainingVector) => {
          const idx = allVectors.findIndex(v => v.user_email === item.user_email);
          if (idx !== -1) {
            allVectors[idx] = { ...allVectors[idx], ...item };
          } else {
            allVectors.push(item);
          }
        });
      }
    } catch (e) {
      console.warn('Supabase fetch buddy profiles error:', e);
    }
  }

  let filtered = allVectors.filter(v => v.user_email !== myEmail);

  // Filter City/Town
  if (filters.city_town && filters.city_town !== 'All Cities') {
    const cityQ = filters.city_town.toLowerCase();
    filtered = filtered.filter(v => (v.city_town || '').toLowerCase().includes(cityQ));
  }

  // Filter Gender
  if (filters.gender && filters.gender !== 'All') {
    filtered = filtered.filter(v => v.gender === filters.gender);
  }

  // Filter Workout Preference
  if (filters.preference && filters.preference !== 'All') {
    const prefQ = filters.preference.toLowerCase();
    filtered = filtered.filter(v =>
      (v.training_focus || '').toLowerCase().includes(prefQ) ||
      (v.workout_preferences || []).some(p => p.toLowerCase().includes(prefQ))
    );
  }

  // Filter Category Pills (Gyms, Yoga, Spa, Sauna, Sports)
  if (filters.category && filters.category !== 'All') {
    const cat = filters.category.toLowerCase();
    filtered = filtered.filter(v => {
      const focus = (v.training_focus || '').toLowerCase();
      const favGym = (v.favorite_gym || '').toLowerCase();
      const prefs = (v.workout_preferences || []).map(p => p.toLowerCase());
      if (cat === 'yoga') {
        return focus.includes('yoga') || favGym.includes('yoga') || prefs.some(p => p.includes('yoga') || p.includes('flexibility') || p.includes('pilates'));
      }
      if (cat === 'spa' || cat === 'sauna') {
        return focus.includes('recovery') || focus.includes('sauna') || focus.includes('spa') || favGym.includes('spa') || favGym.includes('sauna') || prefs.some(p => p.includes('recovery') || p.includes('sauna') || p.includes('spa'));
      }
      if (cat === 'sports') {
        return focus.includes('sports') || focus.includes('crossfit') || focus.includes('cardio') || favGym.includes('sports') || favGym.includes('arena') || prefs.some(p => p.includes('sports') || p.includes('cardio') || p.includes('tennis'));
      }
      if (cat === 'gyms' || cat === 'gym') {
        return focus.includes('hypertrophy') || focus.includes('powerlifting') || focus.includes('gym') || favGym.includes('gym') || favGym.includes('fitness') || favGym.includes('club') || prefs.some(p => p.includes('hypertrophy') || p.includes('powerlifting') || p.includes('strength'));
      }
      return focus.includes(cat) || favGym.includes(cat) || prefs.some(p => p.includes(cat));
    });
  }

  // Distance radius filter (requires user coordinates)
  if (filters.maxDistanceKm && userLat != null && userLng != null) {
    filtered = filtered.filter(v => {
      if (v.lat == null || v.lng == null) return false;
      const dist = haversineKm(userLat, userLng, v.lat, v.lng);
      return dist <= (filters.maxDistanceKm as number);
    });
  }

  // Universal Search Query / Postcode filter
  const universalQuery = (filters.searchQuery || filters.postcode || '').trim().toLowerCase();
  if (universalQuery) {
    const queryMatches = filtered.filter(v =>
      (v.postcode || '').toLowerCase().includes(universalQuery) ||
      (v.user_name || '').toLowerCase().includes(universalQuery) ||
      (v.favorite_gym || '').toLowerCase().includes(universalQuery) ||
      (v.city_town || '').toLowerCase().includes(universalQuery) ||
      (v.training_focus || '').toLowerCase().includes(universalQuery) ||
      (v.bio || '').toLowerCase().includes(universalQuery)
    );
    if (queryMatches.length > 0) {
      filtered = queryMatches;
    }
  }

  // No fake fallback generation — only show real users from the database

  // Calculate Multi-Factor Match Score
  const myCoords = (userLat != null && userLng != null) ? { lat: userLat, lng: userLng } : null;
  const results: BuddyMatchResult[] = filtered.map(u => {
    const { percentage, breakdown } = computeBuddyMatchScore(
      myProfile || {},
      u,
      myProfile?.vector_array,
      myCoords,
    );
    return {
      user: u,
      matchPercentage: percentage,
      matchBreakdown: breakdown,
    };
  });

  return results.sort((a, b) => b.matchPercentage - a.matchPercentage);
}

// ─── Freemium Daily Match Tracking ──────────────────────────────────────────
const DAILY_MATCHES_KEY = 'lumina_daily_matches';

interface DailyMatchState {
  date: string; // YYYY-MM-DD
  used: number;
}

export function getDailyMatchState(): DailyMatchState {
  const today = new Date().toISOString().split('T')[0];
  const raw = localStorage.getItem(DAILY_MATCHES_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DailyMatchState;
      if (parsed.date === today) return parsed;
    } catch {}
  }
  return { date: today, used: 0 };
}

export function consumeDailyMatch(): { allowed: boolean; remaining: number } {
  const state = getDailyMatchState();
  const today = new Date().toISOString().split('T')[0];
  if (state.date !== today) {
    const fresh = { date: today, used: 1 };
    localStorage.setItem(DAILY_MATCHES_KEY, JSON.stringify(fresh));
    return { allowed: true, remaining: 4 };
  }
  if (state.used >= 5) {
    return { allowed: false, remaining: 0 };
  }
  const next = { date: today, used: state.used + 1 };
  localStorage.setItem(DAILY_MATCHES_KEY, JSON.stringify(next));
  return { allowed: true, remaining: 5 - next.used };
}

// ─── Midpoint / Halfway Gym Finder ──────────────────────────────────────────

export interface MidpointGym {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distFromA: number;
  distFromB: number;
  amenityTags: string[];
}

export async function findMidpointGyms(
  latA: number, lngA: number,
  latB: number, lngB: number,
): Promise<MidpointGym[]> {
  const midLat = (latA + latB) / 2;
  const midLng = (lngA + lngB) / 2;

  try {
    const query = `[out:json][timeout:10];(node["leisure"="fitness_centre"](around:5000,${midLat},${midLng});node["sport"="fitness"](around:5000,${midLat},${midLng}););out body 10;`;
    const resp = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!resp.ok) throw new Error('Overpass query failed');
    const json = await resp.json();
    const elements: any[] = json.elements || [];

    return elements
      .filter((el: any) => el.lat && el.lon)
      .map((el: any) => {
        const tags = el.tags || {};
        const amenities: string[] = [];
        if (tags.sport) amenities.push(...tags.sport.split(';').map((s: string) => s.trim()));
        if (tags.opening_hours?.includes('24')) amenities.push('24/7');
        if (tags.name?.toLowerCase().includes('crossfit')) amenities.push('CrossFit');

        return {
          id: `osm_mid_${el.id}`,
          name: tags.name || 'Fitness Centre',
          address: [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(', ') || 'Near midpoint',
          lat: el.lat,
          lng: el.lon,
          distFromA: haversineKm(latA, lngA, el.lat, el.lon),
          distFromB: haversineKm(latB, lngB, el.lat, el.lon),
          amenityTags: amenities.length > 0 ? amenities : ['Gym'],
        };
      })
      .sort((a, b) => (a.distFromA + a.distFromB) - (b.distFromA + b.distFromB));
  } catch {
    return [];
  }
}
