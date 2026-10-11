-- coach_profiles: public card columns are readable by everyone; money, payout and
-- verification columns are server-only (service_role) and exposed to the owner via my_coach_account().

ALTER TABLE public.coach_profiles
  ADD COLUMN IF NOT EXISTS accepting_new_athletes BOOLEAN NOT NULL DEFAULT TRUE;

REVOKE SELECT, INSERT, UPDATE ON public.coach_profiles FROM anon, authenticated;

GRANT SELECT (id, display_name, avatar_url, specialties, bio, hourly_rate, monthly_coaching_rate,
              is_id_verified, accepting_new_athletes, created_at)
  ON public.coach_profiles TO anon, authenticated;

GRANT INSERT (id, display_name, avatar_url, specialties, bio, hourly_rate, monthly_coaching_rate, accepting_new_athletes),
      UPDATE (display_name, avatar_url, specialties, bio, hourly_rate, monthly_coaching_rate, accepting_new_athletes)
  ON public.coach_profiles TO authenticated;

GRANT ALL ON public.coach_profiles TO service_role;

CREATE OR REPLACE FUNCTION public.my_coach_account()
RETURNS TABLE (
  id UUID,
  stripe_connect_account_id TEXT,
  stripe_payouts_enabled BOOLEAN,
  is_id_verified BOOLEAN,
  identity_status TEXT,
  verified_at TIMESTAMPTZ,
  accepting_new_athletes BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.id,
         cp.stripe_connect_account_id::TEXT,
         COALESCE(cp.stripe_payouts_enabled, FALSE),
         COALESCE(cp.is_id_verified, FALSE),
         cp.identity_status::TEXT,
         cp.verified_at::TIMESTAMPTZ,
         cp.accepting_new_athletes
  FROM public.coach_profiles cp
  WHERE cp.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.my_coach_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_coach_account() TO authenticated;

NOTIFY pgrst, 'reload schema';
