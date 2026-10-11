-- Production coach_programs predates the repo migrations: id is UUID and program_data is required, so every
-- publish from coachBridge (text ids like 'prog-…', no program_data) is rejected. Align with the app. Safe to re-run.
DO $$
DECLARE
  id_type TEXT;
BEGIN
  SELECT data_type INTO id_type FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'coach_programs' AND column_name = 'id';
  IF id_type = 'uuid' THEN
    ALTER TABLE public.coach_programs ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.coach_programs ALTER COLUMN id TYPE TEXT USING id::text;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'coach_programs' AND column_name = 'program_data') THEN
    ALTER TABLE public.coach_programs ALTER COLUMN program_data DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE public.coach_programs
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS price_cents INT,
  ADD COLUMN IF NOT EXISTS days_per_week INT,
  ADD COLUMN IF NOT EXISTS focus TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS discipline TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS week_one JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS duration_label TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS split_label TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS equipment TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS listed BOOLEAN DEFAULT FALSE;

NOTIFY pgrst, 'reload schema';
