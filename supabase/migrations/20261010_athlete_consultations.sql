-- One consultation row per athlete. Discovery reads it on the phone.
-- Run once in the Supabase SQL editor.

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
