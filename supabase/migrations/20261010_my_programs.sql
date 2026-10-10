-- My Programs: every program a member enrolls in stays in their library until they close it.
-- Each enrollment keeps a snapshot of the program so it still reads the same if the coach edits or unlists it.
-- Run this once in the Supabase SQL editor, after 20261010_coach_storefront.sql.

ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS cover_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS discipline TEXT NOT NULL DEFAULT '';
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS duration_label TEXT NOT NULL DEFAULT '';
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS days_per_week INT;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT '';
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS split_label TEXT NOT NULL DEFAULT '';
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS equipment TEXT NOT NULL DEFAULT '';
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS week_one JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS coach_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS coach_handle TEXT NOT NULL DEFAULT '';
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS coach_avatar TEXT NOT NULL DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'program_enrollments_status_check') THEN
    ALTER TABLE public.program_enrollments
      ADD CONSTRAINT program_enrollments_status_check CHECK (status IN ('active', 'closed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS program_enrollments_athlete_idx ON public.program_enrollments (athlete_id, status, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_enrollments TO authenticated;
