-- Production coach_programs predates the repo migrations: id is UUID and program_data is required, so every
-- publish from coachBridge (text ids like 'prog-…', no program_data) is rejected. Align with the app. Safe to re-run.
-- Foreign keys pointing at coach_programs.id (e.g. legacy assigned_programs.program_id) are converted with it.
DO $$
DECLARE
  id_type TEXT;
  fk RECORD;
  restore TEXT[] := '{}';
  stmt TEXT;
BEGIN
  SELECT data_type INTO id_type FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'coach_programs' AND column_name = 'id';
  IF id_type = 'uuid' THEN
    FOR fk IN
      SELECT c.conname, c.conrelid::regclass::text AS ref_table, a.attname AS ref_column, pg_get_constraintdef(c.oid) AS def
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
      WHERE c.contype = 'f' AND c.confrelid = 'public.coach_programs'::regclass
    LOOP
      restore := restore || format('ALTER TABLE %s ADD CONSTRAINT %I %s', fk.ref_table, fk.conname, fk.def);
      EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.ref_table, fk.conname);
      EXECUTE format('ALTER TABLE %s ALTER COLUMN %I TYPE TEXT USING %I::text', fk.ref_table, fk.ref_column, fk.ref_column);
    END LOOP;
    ALTER TABLE public.coach_programs ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.coach_programs ALTER COLUMN id TYPE TEXT USING id::text;
    FOREACH stmt IN ARRAY restore LOOP
      EXECUTE stmt;
    END LOOP;
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
