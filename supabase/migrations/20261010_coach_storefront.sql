-- Coach storefront: follows, reviews, consultation applications, program enrollments,
-- the coach's own storefront details, and catalog programs linked to catalog coaches.
-- coach_id stays TEXT so catalog coach ids and auth user ids share the same tables.
-- Run this once in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.coach_follows (
  follower_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  coach_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, coach_id)
);
CREATE INDEX IF NOT EXISTS coach_follows_coach_idx ON public.coach_follows (coach_id);

CREATE TABLE IF NOT EXISTS public.coach_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id TEXT NOT NULL,
  athlete_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coach_id, athlete_id)
);
CREATE INDEX IF NOT EXISTS coach_reviews_coach_idx ON public.coach_reviews (coach_id);

CREATE TABLE IF NOT EXISTS public.coaching_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id TEXT NOT NULL,
  coach_name TEXT NOT NULL DEFAULT '',
  coach_handle TEXT NOT NULL DEFAULT '',
  coach_avatar TEXT NOT NULL DEFAULT '',
  athlete_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  athlete_name TEXT NOT NULL DEFAULT '',
  intake JSONB NOT NULL DEFAULT '{}'::jsonb,
  goal TEXT NOT NULL DEFAULT '',
  program_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS coaching_applications_coach_idx ON public.coaching_applications (coach_id, status);
CREATE INDEX IF NOT EXISTS coaching_applications_athlete_idx ON public.coaching_applications (athlete_id);

CREATE TABLE IF NOT EXISTS public.program_enrollments (
  athlete_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  program_id TEXT NOT NULL,
  coach_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (athlete_id, program_id)
);

CREATE TABLE IF NOT EXISTS public.coach_storefronts (
  coach_id TEXT PRIMARY KEY,
  years_coaching INT CHECK (years_coaching IS NULL OR years_coaching BETWEEN 0 AND 70),
  capacity INT CHECK (capacity IS NULL OR capacity BETWEEN 0 AND 500),
  monthly_price_cents INT CHECK (monthly_price_cents IS NULL OR monthly_price_cents >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.program_catalog ADD COLUMN IF NOT EXISTS catalog_coach_id TEXT;
CREATE INDEX IF NOT EXISTS program_catalog_coach_idx ON public.program_catalog (catalog_coach_id);

ALTER TABLE public.coach_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_storefronts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coach_follows_read ON public.coach_follows;
CREATE POLICY coach_follows_read ON public.coach_follows
  FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS coach_follows_own ON public.coach_follows;
CREATE POLICY coach_follows_own ON public.coach_follows
  FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
DROP POLICY IF EXISTS coach_follows_unfollow ON public.coach_follows;
CREATE POLICY coach_follows_unfollow ON public.coach_follows
  FOR DELETE TO authenticated USING (follower_id = auth.uid());

DROP POLICY IF EXISTS coach_reviews_read ON public.coach_reviews;
CREATE POLICY coach_reviews_read ON public.coach_reviews
  FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS coach_reviews_own ON public.coach_reviews;
CREATE POLICY coach_reviews_own ON public.coach_reviews
  FOR INSERT TO authenticated WITH CHECK (
    athlete_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.coaching_applications a
      WHERE a.athlete_id = auth.uid() AND a.coach_id = coach_reviews.coach_id AND a.status = 'accepted'
    )
  );

DROP POLICY IF EXISTS coaching_applications_athlete ON public.coaching_applications;
CREATE POLICY coaching_applications_athlete ON public.coaching_applications
  FOR SELECT TO authenticated USING (athlete_id = auth.uid() OR coach_id = auth.uid()::text);
DROP POLICY IF EXISTS coaching_applications_apply ON public.coaching_applications;
CREATE POLICY coaching_applications_apply ON public.coaching_applications
  FOR INSERT TO authenticated WITH CHECK (athlete_id = auth.uid() AND status = 'pending');
DROP POLICY IF EXISTS coaching_applications_decide ON public.coaching_applications;
CREATE POLICY coaching_applications_decide ON public.coaching_applications
  FOR UPDATE TO authenticated USING (coach_id = auth.uid()::text) WITH CHECK (coach_id = auth.uid()::text);

DROP POLICY IF EXISTS program_enrollments_own ON public.program_enrollments;
CREATE POLICY program_enrollments_own ON public.program_enrollments
  FOR ALL TO authenticated USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());

DROP POLICY IF EXISTS coach_storefronts_read ON public.coach_storefronts;
CREATE POLICY coach_storefronts_read ON public.coach_storefronts
  FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS coach_storefronts_own ON public.coach_storefronts;
CREATE POLICY coach_storefronts_own ON public.coach_storefronts
  FOR ALL TO authenticated USING (coach_id = auth.uid()::text) WITH CHECK (coach_id = auth.uid()::text);

GRANT SELECT, INSERT, DELETE ON public.coach_follows TO authenticated;
GRANT SELECT, INSERT ON public.coach_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.coaching_applications TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.program_enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.coach_storefronts TO authenticated;
