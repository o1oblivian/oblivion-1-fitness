-- Intake options and the program marketplace.
-- Run once in the Supabase SQL editor. Safe to re-run.
-- Published programs are written by coaches. This file does not insert program titles.

CREATE TABLE IF NOT EXISTS public.club_taxonomy_options (
  id TEXT PRIMARY KEY,
  group_key TEXT NOT NULL,
  option_key TEXT NOT NULL,
  label TEXT NOT NULL,
  detail TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  UNIQUE (group_key, option_key)
);

CREATE TABLE IF NOT EXISTS public.program_catalog (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  discipline TEXT,
  days_per_week INT,
  focus TEXT,
  price_cents INT,
  currency TEXT DEFAULT 'usd',
  tier TEXT,
  duration_label TEXT,
  split_label TEXT,
  volume_label TEXT,
  equipment TEXT,
  cover_url TEXT,
  week_one JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0
);

ALTER TABLE public.coach_programs ADD COLUMN IF NOT EXISTS price_cents INT;
ALTER TABLE public.coach_programs ADD COLUMN IF NOT EXISTS days_per_week INT;
ALTER TABLE public.coach_programs ADD COLUMN IF NOT EXISTS focus TEXT;
ALTER TABLE public.coach_programs ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE public.coach_programs ADD COLUMN IF NOT EXISTS discipline TEXT;
ALTER TABLE public.coach_programs ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.coach_programs ADD COLUMN IF NOT EXISTS week_one JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.coach_programs ADD COLUMN IF NOT EXISTS equipment TEXT;
ALTER TABLE public.coach_programs ADD COLUMN IF NOT EXISTS volume_label TEXT;
ALTER TABLE public.coach_programs ADD COLUMN IF NOT EXISTS duration_label TEXT;
ALTER TABLE public.coach_programs ADD COLUMN IF NOT EXISTS listed BOOLEAN DEFAULT FALSE;

ALTER TABLE public.club_taxonomy_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS club_taxonomy_read ON public.club_taxonomy_options;
CREATE POLICY club_taxonomy_read ON public.club_taxonomy_options
  FOR SELECT TO authenticated
  USING (active = TRUE);

DROP POLICY IF EXISTS program_catalog_read ON public.program_catalog;
CREATE POLICY program_catalog_read ON public.program_catalog
  FOR SELECT TO authenticated
  USING (active = TRUE);

GRANT SELECT ON public.club_taxonomy_options TO authenticated;
GRANT SELECT ON public.program_catalog TO authenticated;

INSERT INTO public.club_taxonomy_options (id, group_key, option_key, label, detail, sort_order, active) VALUES
  ('discipline:hyrox', 'discipline', 'hyrox', 'Hyrox', 'Engine stations and mixed pace.', 1, TRUE),
  ('discipline:running', 'discipline', 'running', 'Running', 'Kilometres, minutes, and heart rate.', 2, TRUE),
  ('discipline:mobility', 'discipline', 'mobility', 'Mobility', 'Joints, range, and easy strength.', 3, TRUE),
  ('discipline:hypertrophy', 'discipline', 'hypertrophy', 'Hypertrophy', 'Volume blocks and muscle.', 4, TRUE),
  ('discipline:powerlifting', 'discipline', 'powerlifting', 'Powerlifting', 'Squat, bench, and deadlift.', 5, TRUE),
  ('discipline:crossfit', 'discipline', 'crossfit', 'CrossFit', 'Mixed sessions and conditioning.', 6, TRUE),
  ('discipline:hybrid', 'discipline', 'hybrid', 'Hybrid', 'Strength plus engine.', 7, TRUE),
  ('training_age:lt1', 'training_age', '<1yr', 'Under 1 year', '', 1, TRUE),
  ('training_age:1-3', 'training_age', '1-3yrs', '1–3 years', '', 2, TRUE),
  ('training_age:3-5', 'training_age', '3-5yrs', '3–5 years', '', 3, TRUE),
  ('training_age:5', 'training_age', '5+yrs', '5+ years', '', 4, TRUE),
  ('coaching_intent:1on1', 'coaching_intent', '1-on-1', '1-on-1 mentorship', '', 1, TRUE),
  ('coaching_intent:telemetry', 'coaching_intent', 'telemetry-only', 'Telemetry feedback', '', 2, TRUE),
  ('coaching_intent:self', 'coaching_intent', 'self-guided', 'Autonomous', '', 3, TRUE),
  ('coaching_style:bio', 'coaching_style', 'biometrics', 'Data and biometrics', '', 1, TRUE),
  ('coaching_style:mech', 'coaching_style', 'biomechanics', 'Form and biomechanics', '', 2, TRUE),
  ('coaching_style:hard', 'coaching_style', 'hardcore', 'Hardcore drill', '', 3, TRUE),
  ('facility:commercial', 'facility', 'commercial', 'Commercial gym', '', 1, TRUE),
  ('facility:garage', 'facility', 'garage_minimal', 'Garage or minimal', '', 2, TRUE),
  ('frequency:3', 'frequency', '3', '3 days', '', 1, TRUE),
  ('frequency:4', 'frequency', '4', '4 days', '', 2, TRUE),
  ('frequency:5', 'frequency', '5', '5 days', '', 3, TRUE),
  ('frequency:6', 'frequency', '6', '6 days', '', 4, TRUE),
  ('membership_tier:core', 'membership_tier', 'core', 'Core', 'Daily tracking, public feed, 1 active cycle.', 1, TRUE),
  ('membership_tier:pro', 'membership_tier', 'pro', 'Pro', 'Telemetry, ACWR, rolling microcycles, sorted feed.', 2, TRUE),
  ('membership_tier:founders', 'membership_tier', 'founders_pass', 'Founders Pass', 'Lifetime access and the founding lifter badge.', 3, TRUE),
  ('membership_tier:coach', 'membership_tier', 'coach', 'Coach', 'Roster, dispatch, and program publishing.', 4, TRUE),
  ('membership_tier:coach_pro', 'membership_tier', 'coach_pro', 'Coach Pro', 'Unlimited roster and the lower platform fee.', 5, TRUE),
  ('discovery:all', 'discovery', 'all', 'All', '', 0, TRUE),
  ('discovery:hyrox', 'discovery', 'hyrox', 'Hyrox', '', 1, TRUE),
  ('discovery:running', 'discovery', 'running', 'Running', '', 2, TRUE),
  ('discovery:mobility', 'discovery', 'mobility', 'Mobility', '', 3, TRUE),
  ('discovery:hypertrophy', 'discovery', 'hypertrophy', 'Hypertrophy', '', 4, TRUE),
  ('discovery:powerlifting', 'discovery', 'powerlifting', 'Powerlifting', '', 5, TRUE),
  ('discovery:crossfit', 'discovery', 'crossfit', 'CrossFit', '', 6, TRUE),
  ('discovery:hybrid', 'discovery', 'hybrid', 'Hybrid', '', 7, TRUE),
  ('discovery:heavy', 'discovery', 'heavy_compound', 'Heavy Compound', '', 8, TRUE),
  ('discovery:biomech', 'discovery', 'biomechanics', 'Biomechanics', '', 9, TRUE),
  ('discovery:nutrition', 'discovery', 'nutrition', 'Nutrition', '', 10, TRUE)
ON CONFLICT (id) DO UPDATE SET
  group_key = EXCLUDED.group_key,
  option_key = EXCLUDED.option_key,
  label = EXCLUDED.label,
  detail = EXCLUDED.detail,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;
