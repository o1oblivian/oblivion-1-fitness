import { supabase } from '../../../services/supabaseClient';

export const DEFAULT_AREA_THRESHOLD = 250;

export interface BuddyGate {
  active: boolean;
  threshold: number;
  count: number | null;
}

const CLOSED_GATE: BuddyGate = {
  active: false,
  threshold: DEFAULT_AREA_THRESHOLD,
  count: null,
};

/** Half-degree cell, about 55 km on a side. The queue counts cards in this cell. */
export function areaKey(latitude: number, longitude: number): string {
  const latCell = Math.floor(latitude * 2) / 2;
  const lngCell = Math.floor(longitude * 2) / 2;
  return `${latCell.toFixed(1)}:${lngCell.toFixed(1)}`;
}

export function radiusBox(latitude: number, longitude: number, radiusKm: number): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const latDelta = radiusKm / 110.574;
  const cos = Math.cos((latitude * Math.PI) / 180);
  const lngDelta = radiusKm / (111.32 * Math.max(0.2, Math.abs(cos)));
  return {
    minLat: Math.max(-90, latitude - latDelta),
    maxLat: Math.min(90, latitude + latDelta),
    minLng: longitude - lngDelta,
    maxLng: longitude + lngDelta,
  };
}

export async function readBuddyGate(coords: { latitude: number; longitude: number } | null): Promise<BuddyGate> {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('is_buddy_active, threshold')
      .eq('key', 'buddy')
      .maybeSingle();
    if (error || !data) return CLOSED_GATE;
    const threshold = Number(data.threshold);
    const gate: BuddyGate = {
      active: Boolean(data.is_buddy_active),
      threshold: Number.isFinite(threshold) && threshold > 0 ? threshold : DEFAULT_AREA_THRESHOLD,
      count: null,
    };
    if (!coords) return gate;
    const counted = await supabase
      .from('buddy_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('region_key', areaKey(coords.latitude, coords.longitude))
      .eq('is_ghost_mode', false)
      .gte('age', 18);
    if (!counted.error && counted.count != null) gate.count = counted.count;
    return gate;
  } catch {
    return CLOSED_GATE;
  }
}

export function subscribeBuddyGate(onChange: () => void): () => void {
  const channel = supabase
    .channel('app-config-buddy')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'app_config', filter: 'key=eq.buddy' },
      () => onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
