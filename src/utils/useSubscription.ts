import { useState, useEffect } from 'react';
import {
  SubscriptionTier,
  fetchUserProfile,
  isPremium,
  isCoach,
  UserProfile,
  UserRole,
  getStoredUserRole,
  cacheUserRole,
  upsertUserProfile,
} from './subscriptionStore';

interface SubscriptionState {
  tier: SubscriptionTier;
  role: UserRole;
  loading: boolean;
  isPaid: boolean;
  isTrialActive: boolean;
  isCoachRole: boolean;
  isCoachPro: boolean;
  canAccessCoachStudio: boolean;
  trialDaysLeft: number;
  canAccess: (feature: FeatureGate) => boolean;
  switchRole: (newRole: UserRole) => Promise<void>;
}

export type FeatureGate =
  | 'wallpapers'
  | 'watch_dials'
  | 'ai_scan'
  | 'ai_insights'
  | 'telemetry_edit'
  | 'photo_vault_unlimited'
  | 'data_export'
  | 'coach_purchase'
  | 'travel_pass'
  | 'unlimited_likes'
  | 'unlimited_messages'
  | 'archetypes';

const PREMIUM_FEATURES: FeatureGate[] = [
  'wallpapers',
  'watch_dials',
  'ai_scan',
  'telemetry_edit',
  'photo_vault_unlimited',
  'data_export',
  'coach_purchase',
  'unlimited_likes',
  'unlimited_messages',
  'archetypes',
];

const PRO_ONLY_FEATURES: FeatureGate[] = ['travel_pass'];
const ADDON_FEATURES: FeatureGate[] = ['ai_insights'];

function computeTrialFromProfile(profile: UserProfile | null): { active: boolean; daysLeft: number } {
  try {
    if (!profile?.trial_ends_at) {
      if (typeof window === 'undefined') return { active: true, daysLeft: 90 };
      const created = localStorage.getItem('o1fc_account_created');
      if (!created) {
        try { localStorage.setItem('o1fc_account_created', new Date().toISOString()); } catch {}
        return { active: true, daysLeft: 90 };
      }
      const createdTime = new Date(created).getTime();
      if (isNaN(createdTime)) return { active: true, daysLeft: 90 };
      const elapsed = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
      const daysLeft = Math.max(0, Math.ceil(90 - elapsed));
      return { active: daysLeft > 0, daysLeft };
    }
    const endsAt = new Date(profile.trial_ends_at).getTime();
    if (isNaN(endsAt)) return { active: true, daysLeft: 90 };
    const msLeft = endsAt - Date.now();
    const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    return { active: daysLeft > 0, daysLeft };
  } catch {
    return { active: true, daysLeft: 90 };
  }
}

export function useSubscription(): SubscriptionState {
  const [tier, setTier] = useState<SubscriptionTier>(() => {
    try {
      const active = localStorage.getItem('o1fc_active_subscription');
      if (active) {
        const parsed = JSON.parse(active);
        if (parsed.tier) return parsed.tier;
      }
    } catch {}
    return getStoredTier();
  });
  const [role, setRole] = useState<UserRole>(() => getStoredUserRole());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await fetchUserProfile();
      if (!cancelled) {
        setProfile(p);
        if (p?.subscription_tier) {
          setTier(p.subscription_tier);
        }
        if (p?.role) {
          setRole(p.role);
          cacheUserRole(p.role, p.email);
        }
        setLoading(false);
      }
    })();

    const handleUpdate = (e: any) => {
      const newTier = e?.detail?.tier;
      if (newTier) {
        setTier(newTier);
      }
    };

    const handleRoleUpdate = (e: any) => {
      const newRole = e?.detail?.role;
      if (newRole) {
        setRole(newRole);
      }
    };

    window.addEventListener('o1fc-subscription-updated', handleUpdate);
    window.addEventListener('o1fc-user-role-updated', handleRoleUpdate);
    window.addEventListener('storage', () => {
      try {
        const active = localStorage.getItem('o1fc_active_subscription');
        if (active) {
          const parsed = JSON.parse(active);
          if (parsed.tier) setTier(parsed.tier);
        }
        const storedRole = getStoredUserRole();
        setRole(storedRole);
      } catch {}
    });

    return () => {
      cancelled = true;
      window.removeEventListener('o1fc-subscription-updated', handleUpdate);
      window.removeEventListener('o1fc-user-role-updated', handleRoleUpdate);
    };
  }, []);

  const isPaid = isPremium(tier);
  const trial = computeTrialFromProfile(profile);
  const isTrialActive = !isPaid && trial.active;
  const isCoachRole = role === 'coach' || isCoach(tier);
  const isCoachPro = tier === 'coach_pro';
  const canAccessCoachStudio = isCoachRole;

  const canAccess = (feature: FeatureGate): boolean => {
    if (PRO_ONLY_FEATURES.includes(feature)) {
      return tier === 'premium_travel' || tier === 'founder_pass' || tier === 'coach_pro';
    }

    if (ADDON_FEATURES.includes(feature)) {
      return isPaid;
    }

    if (PREMIUM_FEATURES.includes(feature)) {
      return isPaid;
    }

    return true;
  };

  const switchRole = async (newRole: UserRole): Promise<void> => {
    setRole(newRole);
    cacheUserRole(newRole, profile?.email);
    try {
      await upsertUserProfile({ role: newRole });
    } catch {}
  };

  return {
    tier,
    role,
    loading,
    isPaid,
    isTrialActive,
    isCoachRole,
    isCoachPro,
    canAccessCoachStudio,
    trialDaysLeft: trial.daysLeft,
    canAccess,
    switchRole,
  };
}

export function getStoredTier(): SubscriptionTier {
  return (localStorage.getItem('o1fc_cached_tier') as SubscriptionTier) || 'free';
}

export function cacheCurrentTier(tier: SubscriptionTier): void {
  localStorage.setItem('o1fc_cached_tier', tier);
}
