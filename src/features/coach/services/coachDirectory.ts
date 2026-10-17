import { supabase } from '../../../services/supabaseClient';
import type { ExploreCoach } from '../../reels/reelTypes';

export interface CoachCard {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  specialties: string[];
  hourlyRate: number | null;
  monthlyRate: number | null;
  verified: boolean;
  accepting: boolean;
}

type Row = Record<string, unknown>;

const CARD_COLUMNS =
  'id, display_name, avatar_url, specialties, bio, hourly_rate, monthly_coaching_rate, is_id_verified, accepting_new_athletes';

function rate(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** `@name` for display, or '' when the coach has not picked one. */
export function formatHandle(raw: string | null | undefined): string {
  const clean = String(raw || '')
    .trim()
    .replace(/^@+/, '');
  return clean ? `@${clean}` : '';
}

/** Handles live in their own column; a project without it still loads every card. */
async function handlesFor(ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {};
  const { data, error } = await supabase.from('coach_profiles').select('id, handle').in('id', ids);
  if (error || !Array.isArray(data)) return {};
  const out: Record<string, string> = {};
  for (const row of data as Row[]) if (row.handle) out[String(row.id)] = String(row.handle);
  return out;
}

function mapCard(row: Row, handles: Record<string, string>): CoachCard {
  const id = String(row.id);
  return {
    id,
    name: String(row.display_name || '').trim(),
    handle: handles[id] || '',
    avatar: String(row.avatar_url || ''),
    bio: String(row.bio || ''),
    specialties: Array.isArray(row.specialties) ? row.specialties.map(String).filter(Boolean) : [],
    hourlyRate: rate(row.hourly_rate),
    monthlyRate: rate(row.monthly_coaching_rate),
    verified: row.is_id_verified === true,
    accepting: row.accepting_new_athletes !== false,
  };
}

/** Public coach cards. Pass ids to load specific coaches; otherwise the newest 60. */
export async function fetchCoachCards(ids?: string[]): Promise<CoachCard[]> {
  const unique = ids ? [...new Set(ids.filter(Boolean))] : null;
  if (unique && !unique.length) return [];
  let query = supabase.from('coach_profiles').select(CARD_COLUMNS);
  query = unique
    ? query.in('id', unique)
    : query.order('created_at', { ascending: false }).limit(60);
  const { data, error } = await query;
  if (error || !Array.isArray(data)) return [];
  const rows = data as Row[];
  const handles = await handlesFor(rows.map((row) => String(row.id)));
  return rows.map((row) => mapCard(row, handles)).filter((card) => card.name);
}

export async function fetchCoachCard(id: string): Promise<CoachCard | null> {
  if (!id) return null;
  const { data, error } = await supabase
    .from('coach_profiles')
    .select(CARD_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return mapCard(data as Row, await handlesFor([id]));
}

export function toExploreCoach(card: CoachCard): ExploreCoach {
  const rateLabel =
    card.monthlyRate != null
      ? `$${Math.round(card.monthlyRate)}/mo`
      : card.hourlyRate != null
        ? `$${Math.round(card.hourlyRate)}/hr`
        : '';
  return {
    id: card.id,
    name: card.name,
    handle: formatHandle(card.handle),
    avatar: card.avatar,
    verified: card.verified,
    specialtyTitle: card.specialties[0] || 'Coach',
    specialty: card.specialties.join(', ') || undefined,
    rating: 0,
    reviewCount: 0,
    certificationPill: card.verified ? 'ID verified' : '',
    rate: rateLabel,
    slotsRemaining: card.accepting ? 1 : 0,
    bio: card.bio,
    disciplines: card.specialties,
  };
}
