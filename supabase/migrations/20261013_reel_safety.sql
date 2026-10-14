-- Reel categories, moderation and reporting.
-- Run in the Supabase SQL editor. Safe to run more than once.

-- ---------------------------------------------------------------------------
-- 1. One category per reel, from the app's fixed list
-- ---------------------------------------------------------------------------
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS hidden_reason TEXT;

UPDATE public.reels SET category = 'CONDITIONING'
WHERE category = 'HYROX' OR (category = 'ALL' AND filter_tag = 'HYROX / CONDITIONING');

UPDATE public.reels SET category = 'TUTORIAL'
WHERE category = 'ALL' AND filter_tag = 'TUTORIAL';

UPDATE public.reels SET filter_tag = NULL
WHERE filter_tag IS NOT NULL
  AND filter_tag NOT IN ('CHEST & TRICEPS', 'BACK & BICEPS', 'QUADS & GLUTES', 'SHOULDERS & ARMS');

-- Anything left without a valid category is hidden until the coach re-posts it.
UPDATE public.reels
SET category = NULL,
    hidden_at = COALESCE(hidden_at, NOW()),
    hidden_reason = COALESCE(hidden_reason, 'No category')
WHERE category IS NULL
   OR category NOT IN ('TUTORIAL', 'HYPERTROPHY', 'BIOMECHANICS', 'STRENGTH', 'MOBILITY', 'CONDITIONING', 'REHAB');

ALTER TABLE public.reels DROP CONSTRAINT IF EXISTS reels_category_check;
ALTER TABLE public.reels ADD CONSTRAINT reels_category_check
  CHECK (category IS NULL OR category IN ('TUTORIAL', 'HYPERTROPHY', 'BIOMECHANICS', 'STRENGTH', 'MOBILITY', 'CONDITIONING', 'REHAB'));

ALTER TABLE public.reels DROP CONSTRAINT IF EXISTS reels_filter_tag_check;
ALTER TABLE public.reels ADD CONSTRAINT reels_filter_tag_check
  CHECK (filter_tag IS NULL OR filter_tag IN ('CHEST & TRICEPS', 'BACK & BICEPS', 'QUADS & GLUTES', 'SHOULDERS & ARMS'));

-- New reels must name a category, and coaches cannot unhide their own reels.
DROP POLICY IF EXISTS reels_insert_own ON public.reels;
CREATE POLICY reels_insert_own ON public.reels FOR INSERT TO authenticated
  WITH CHECK (coach_id = auth.uid() AND category IS NOT NULL AND hidden_at IS NULL);

-- Hidden reels stay visible only to the coach who posted them.
DROP POLICY IF EXISTS reels_read ON public.reels;
CREATE POLICY reels_read ON public.reels FOR SELECT TO anon, authenticated
  USING (hidden_at IS NULL OR coach_id = auth.uid());

CREATE INDEX IF NOT EXISTS reels_category_idx ON public.reels (category, created_at DESC) WHERE hidden_at IS NULL;

-- ---------------------------------------------------------------------------
-- 2. Reel reports
-- ---------------------------------------------------------------------------
ALTER TABLE public.safety_reports ADD COLUMN IF NOT EXISTS reel_id TEXT;

ALTER TABLE public.safety_reports DROP CONSTRAINT IF EXISTS safety_reports_context_check;
ALTER TABLE public.safety_reports ADD CONSTRAINT safety_reports_context_check
  CHECK (context IN ('buddy', 'coach', 'reel'));

CREATE INDEX IF NOT EXISTS safety_reports_reel_idx ON public.safety_reports (reel_id) WHERE reel_id IS NOT NULL;

-- Three different members reporting the same reel hides it until the team reviews it.
CREATE OR REPLACE FUNCTION public.hide_reported_reel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reel_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF (SELECT COUNT(DISTINCT reporter_id) FROM public.safety_reports WHERE reel_id = NEW.reel_id) >= 3 THEN
    UPDATE public.reels
    SET hidden_at = NOW(), hidden_reason = 'Reported by members'
    WHERE id = NEW.reel_id AND hidden_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.hide_reported_reel() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS safety_reports_hide_reel ON public.safety_reports;
CREATE TRIGGER safety_reports_hide_reel
  AFTER INSERT ON public.safety_reports
  FOR EACH ROW EXECUTE FUNCTION public.hide_reported_reel();

-- ---------------------------------------------------------------------------
-- 3. Discovery chips use generic names, not trademarks
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.club_taxonomy_options') IS NOT NULL THEN
    UPDATE public.club_taxonomy_options SET label = 'Conditioning' WHERE id = 'discovery:hyrox';
    UPDATE public.club_taxonomy_options SET label = 'Metcon' WHERE id = 'discovery:crossfit';
  END IF;
END;
$$;
