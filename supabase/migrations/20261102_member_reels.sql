-- Member reels. Safe to run more than once in the Supabase SQL editor.
-- Every member, athlete or coach, can keep up to 6 reels. Keep the number 6 in step with REEL_LIMIT in
-- shared/reelLimits.ts (server/lib/reelLimit.test.ts fails if they drift).
-- `coach_id` is the uploader for every reel; the column name predates athlete uploads.

-- ---------------------------------------------------------------------------
-- 1. Who posted it and where the files live
-- ---------------------------------------------------------------------------
-- Profiles are private, so the name and photo the uploader chose to show are stored on the reel itself.
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS author_avatar TEXT;
-- Storage object paths, so deleting a reel also frees its files.
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS poster_path TEXT;

-- ---------------------------------------------------------------------------
-- 2. Six reels per member
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_reel_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  kept integer;
BEGIN
  -- One upload at a time per member, so two simultaneous uploads cannot both take the last slot.
  PERFORM pg_advisory_xact_lock(hashtext('reel_limit:' || NEW.coach_id::text));

  -- Reels hidden after reports still hold storage, so they count until the member deletes them.
  SELECT count(*) INTO kept FROM public.reels r WHERE r.coach_id = NEW.coach_id;

  IF kept >= 6 THEN
    RAISE EXCEPTION 'REEL_LIMIT' USING ERRCODE = 'P0001', HINT = '6';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_reel_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reels_member_limit ON public.reels;
CREATE TRIGGER reels_member_limit
  BEFORE INSERT ON public.reels
  FOR EACH ROW EXECUTE FUNCTION public.enforce_reel_limit();
