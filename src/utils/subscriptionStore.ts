import { supabase, isSupabaseConfigured } from './supabase';
import { apiFetch } from './apiUrl';

export type UserRole = 'athlete' | 'coach';
export type SubscriptionTier = 'free' | 'freemium' | 'premium' | 'premium_travel' | 'founder_pass' | 'coach_free' | 'coach_pro';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  profile_image_url: string | null;
  workout_focus: string | null;
  postcode: string | null;
  subscription_tier: SubscriptionTier;
  trial_ends_at: string | null;
  payout_method: string | null;
  payout_email: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CoachEarning {
  id: string;
  coach_user_id: string;
  purchase_id: string | null;
  buyer_email: string;
  program_title: string;
  sale_amount_cents: number;
  platform_fee_cents: number;
  coach_payout_cents: number;
  payout_status: 'pending' | 'processing' | 'paid';
  paid_at: string | null;
  created_at: string;
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function upsertUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...profile, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .maybeSingle();
    if (error) return null;
    return data as UserProfile;
  }

  const trialEndsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      id: user.id,
      email: user.email || '',
      role: profile.role || 'athlete',
      display_name: profile.display_name || user.user_metadata?.full_name || '',
      subscription_tier: profile.subscription_tier || (profile.role === 'coach' ? 'coach_free' : 'free'),
      trial_ends_at: trialEndsAt,
      ...profile,
    })
    .select()
    .maybeSingle();

  if (error) return null;
  return data as UserProfile;
}

export async function getUserTier(): Promise<SubscriptionTier> {
  const profile = await fetchUserProfile();
  return profile?.subscription_tier || 'free';
}

export async function getUserRole(): Promise<UserRole> {
  const profile = await fetchUserProfile();
  return profile?.role || 'athlete';
}

export function isPremium(tier: SubscriptionTier): boolean {
  return tier === 'premium' || tier === 'premium_travel' || tier === 'founder_pass' || tier === 'coach_pro';
}

export function isCoach(tier: SubscriptionTier): boolean {
  return tier === 'coach_free' || tier === 'coach_pro';
}

export async function fetchCoachEarnings(): Promise<CoachEarning[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('coach_earnings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as CoachEarning[];
}

export async function fetchEarningsSummary(): Promise<{
  totalEarned: number;
  pendingPayout: number;
  totalPaid: number;
  salesCount: number;
}> {
  const earnings = await fetchCoachEarnings();
  return {
    totalEarned: earnings.reduce((s, e) => s + e.coach_payout_cents, 0),
    pendingPayout: earnings.filter(e => e.payout_status === 'pending').reduce((s, e) => s + e.coach_payout_cents, 0),
    totalPaid: earnings.filter(e => e.payout_status === 'paid').reduce((s, e) => s + e.coach_payout_cents, 0),
    salesCount: earnings.length,
  };
}

export async function recordCoachEarning(params: {
  purchaseId?: string;
  buyerEmail: string;
  programTitle: string;
  saleAmountCents: number;
  platformFeeCents: number;
  coachPayoutCents: number;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await supabase.from('coach_earnings').insert({
    purchase_id: params.purchaseId || null,
    buyer_email: params.buyerEmail,
    program_title: params.programTitle,
    sale_amount_cents: params.saleAmountCents,
    platform_fee_cents: params.platformFeeCents,
    coach_payout_cents: params.coachPayoutCents,
  });
  return !error;
}

export interface FounderPassStats {
  totalLimit: number;
  claimedCount: number;
  remainingCount: number;
  isLive: boolean;
}

export async function fetchFounderPassLiveStats(): Promise<FounderPassStats> {
  try {
    const res = await apiFetch('/api/founder-pass-stats');
    if (res.ok) {
      const data = await res.json();
      return {
        totalLimit: data.totalLimit || 5000,
        claimedCount: data.claimedCount || 0,
        remainingCount: data.remainingCount ?? 5000,
        isLive: true,
      };
    }
  } catch (e) {
    console.warn('Founder pass live stats API warning:', e);
  }

  // Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { count, error } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_tier', 'founder_pass');

      if (!error && typeof count === 'number') {
        return {
          totalLimit: 5000,
          claimedCount: count,
          remainingCount: Math.max(0, 5000 - count),
          isLive: true,
        };
      }
    } catch {}
  }

  return {
    totalLimit: 5000,
    claimedCount: 0,
    remainingCount: 5000,
    isLive: true,
  };
}

