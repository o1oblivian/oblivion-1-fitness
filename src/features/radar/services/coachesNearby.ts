import { supabase } from '../../../services/supabaseClient';
import type { DemoAthlete } from '../types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface NearbyCoach {
  id: string;
  name: string;
  handle: string;
  photo: string;
  discipline: string;
  gym: string;
  distanceKm: number | null;
  rating: number | null;
  reviewCount: number;
  years: number | null;
  capacity: number | null;
  monthlyPriceCents: number | null;
  accepting: boolean;
}

function num(value: unknown): number | null {
  const n = Number(value);
  return value == null || !Number.isFinite(n) ? null : n;
}

function firstSpecialty(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? '');
  if (typeof value === 'string') return value.split(',')[0].trim();
  return '';
}

/** People in `nearby` who have a coach profile, nearest first, with their public offer. */
export async function findNearbyCoaches(nearby: DemoAthlete[]): Promise<NearbyCoach[]> {
  const people = new Map(nearby.filter((row) => UUID.test(row.id)).map((row) => [row.id, row]));
  if (people.size === 0) return [];
  const ids = [...people.keys()];
  const [profiles, fronts, reviews] = await Promise.all([
    supabase.from('coach_profiles').select('id, display_name, avatar_url, specialties').in('id', ids),
    supabase.from('coach_storefronts').select('coach_id, years_coaching, capacity, monthly_price_cents').in('coach_id', ids),
    supabase.from('coach_reviews').select('coach_id, stars').in('coach_id', ids),
  ]);
  if (profiles.error || !Array.isArray(profiles.data)) return [];

  const frontBy = new Map<string, Record<string, unknown>>();
  (fronts.data ?? []).forEach((row: Record<string, unknown>) => frontBy.set(String(row.coach_id), row));
  const starsBy = new Map<string, number[]>();
  (reviews.data ?? []).forEach((row: Record<string, unknown>) => {
    const stars = Number(row.stars);
    if (!Number.isFinite(stars)) return;
    const key = String(row.coach_id);
    starsBy.set(key, [...(starsBy.get(key) ?? []), stars]);
  });

  return profiles.data
    .map((row: Record<string, unknown>) => {
      const id = String(row.id);
      const person = people.get(id);
      if (!person) return null;
      const front = frontBy.get(id);
      const stars = starsBy.get(id) ?? [];
      const coach: NearbyCoach = {
        id,
        name: String(row.display_name || person.name || 'Coach').trim(),
        handle: person.handle || '',
        photo: person.image_url || person.avatar || person.photos?.[0] || String(row.avatar_url || ''),
        discipline: firstSpecialty(row.specialties) || person.training_discipline || person.discipline || '',
        gym: person.home_gym || person.homeGym || '',
        distanceKm: num(person.distance_km ?? person.distanceKm),
        rating: stars.length ? stars.reduce((sum, n) => sum + n, 0) / stars.length : null,
        reviewCount: stars.length,
        years: num(front?.years_coaching),
        capacity: num(front?.capacity),
        monthlyPriceCents: num(front?.monthly_price_cents),
        accepting: true,
      };
      return coach;
    })
    .filter((coach): coach is NearbyCoach => Boolean(coach))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
}

export function coachPriceLabel(cents: number | null): string {
  if (cents == null) return '';
  if (cents === 0) return 'Free';
  return `From $${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}/mo`;
}

export function coachDistanceLabel(km: number | null): string {
  if (km == null) return '';
  return km < 1 ? '<1 km' : `${Math.round(km)} km`;
}
