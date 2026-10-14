-- Consultation v2: age band, plain goal, chosen training days, session length, areas to protect
-- and competition date. Run once in the Supabase SQL editor. Safe to re-run.
-- Creates the consultation table first if 20261010_athlete_consultations.sql was never run.
-- Until this runs the app keeps saving the original answers and holds the new ones on the device.

CREATE TABLE IF NOT EXISTS public.athlete_consultations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_discipline TEXT,
  training_age TEXT,
  coaching_intent TEXT,
  coaching_style TEXT,
  frequency_days INTEGER,
  facility TEXT,
  selected_tier TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.athlete_consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS athlete_consultations_owner ON public.athlete_consultations;
CREATE POLICY athlete_consultations_owner ON public.athlete_consultations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_consultations TO authenticated;

ALTER TABLE public.athlete_consultations ADD COLUMN IF NOT EXISTS age_band TEXT;
ALTER TABLE public.athlete_consultations ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE public.athlete_consultations ADD COLUMN IF NOT EXISTS training_days TEXT;
ALTER TABLE public.athlete_consultations ADD COLUMN IF NOT EXISTS session_minutes INTEGER;
ALTER TABLE public.athlete_consultations ADD COLUMN IF NOT EXISTS injuries TEXT;
ALTER TABLE public.athlete_consultations ADD COLUMN IF NOT EXISTS competition_date DATE;

NOTIFY pgrst, 'reload schema';
