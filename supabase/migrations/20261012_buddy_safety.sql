-- Buddy safety. Safe to run more than once in the Supabase SQL editor.
-- 1. Locations live in a private table, snapped to about 1 km. Nobody can read them from the app.
-- 2. The radius search returns a whole-km distance only, and only to signed-in athletes.
-- 3. Verification badges can only be set by the server.
-- 4. Reports go to a private table that only the team can read.
-- 5. Messages can only be sent between mutual matches where neither side has blocked the other.

-- ---------------------------------------------------------------------------
-- 1. Private coarse locations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.buddy_locations (
  user_id TEXT PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.buddy_locations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.buddy_locations FROM anon, authenticated;
GRANT DELETE ON public.buddy_locations TO authenticated;

DROP POLICY IF EXISTS "buddy_locations_delete_own" ON public.buddy_locations;
CREATE POLICY "buddy_locations_delete_own" ON public.buddy_locations
  FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- The public columns are always blanked by the guard below, so they must accept NULL.
ALTER TABLE public.buddy_profiles ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE public.buddy_profiles ALTER COLUMN longitude DROP NOT NULL;

ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.buddy_profiles_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL
     AND NOT (NEW.latitude = 0 AND NEW.longitude = 0)
     AND NEW.latitude BETWEEN -90 AND 90
     AND NEW.longitude BETWEEN -180 AND 180 THEN
    INSERT INTO public.buddy_locations (user_id, latitude, longitude, updated_at)
    VALUES (
      NEW.id::text,
      round(NEW.latitude::numeric, 2)::double precision,
      round(NEW.longitude::numeric, 2)::double precision,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
      SET latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          updated_at = NOW();
  END IF;
  NEW.latitude := NULL;
  NEW.longitude := NULL;

  IF COALESCE(auth.role(), '') IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_verified := FALSE;
      NEW.verified_at := NULL;
    ELSE
      NEW.is_verified := OLD.is_verified;
      NEW.verified_at := OLD.verified_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS buddy_profiles_guard ON public.buddy_profiles;
CREATE TRIGGER buddy_profiles_guard
  BEFORE INSERT OR UPDATE ON public.buddy_profiles
  FOR EACH ROW EXECUTE FUNCTION public.buddy_profiles_guard();

-- Moves every stored coordinate into buddy_locations and blanks the public columns.
UPDATE public.buddy_profiles SET latitude = latitude WHERE latitude IS NOT NULL OR longitude IS NOT NULL;

-- Profiles are for signed-in athletes only.
DROP POLICY IF EXISTS "buddy_profiles_read" ON public.buddy_profiles;
CREATE POLICY "buddy_profiles_read" ON public.buddy_profiles
  FOR SELECT TO authenticated
  USING (COALESCE(is_ghost_mode, false) = false OR id::text = auth.uid()::text);
REVOKE ALL ON public.buddy_profiles FROM anon;

-- ---------------------------------------------------------------------------
-- 2. Distance-only radius search
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.buddy_within_radius(double precision, double precision, double precision);

CREATE FUNCTION public.buddy_within_radius(
  origin_lat double precision,
  origin_lng double precision,
  radius_km double precision
)
RETURNS TABLE (
  id text,
  user_id text,
  athlete_name text,
  handle text,
  age integer,
  home_gym text,
  avatar_url text,
  image_url text,
  discipline text,
  current_split text,
  training_time text,
  gender text,
  looking_for text,
  training_place text,
  experience_level text,
  bio text,
  last_active timestamptz,
  is_verified boolean,
  distance_km double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT auth.uid()::text AS uid, LEAST(GREATEST(COALESCE(radius_km, 25), 1), 250) AS r
  )
  SELECT
    ranked.id, ranked.user_id, ranked.athlete_name, ranked.handle, ranked.age, ranked.home_gym,
    ranked.avatar_url, ranked.image_url, ranked.discipline, ranked.current_split,
    ranked.training_time, ranked.gender, ranked.looking_for, ranked.training_place,
    ranked.experience_level, ranked.bio, ranked.last_active, ranked.is_verified,
    GREATEST(1, round(ranked.raw_km))::double precision AS distance_km
  FROM (
    SELECT
      p.id::text AS id,
      p.user_id::text AS user_id,
      p.athlete_name,
      p.handle,
      p.age,
      p.home_gym,
      p.avatar_url,
      p.image_url,
      p.discipline,
      p.current_split,
      p.training_time,
      p.gender,
      p.looking_for,
      p.training_place,
      p.experience_level,
      p.bio,
      p.last_active,
      COALESCE(p.is_verified, false) AS is_verified,
      6371 * acos(LEAST(1::double precision, GREATEST(-1::double precision,
        cos(radians(origin_lat)) * cos(radians(l.latitude))
        * cos(radians(l.longitude) - radians(origin_lng))
        + sin(radians(origin_lat)) * sin(radians(l.latitude))
      ))) AS raw_km
    FROM public.buddy_profiles p
    JOIN public.buddy_locations l ON l.user_id = p.id::text
    CROSS JOIN me
    WHERE me.uid IS NOT NULL
      AND p.id::text <> me.uid
      AND COALESCE(p.is_ghost_mode, false) = false
      AND p.age >= 18
      AND l.latitude BETWEEN origin_lat - (me.r / 110.574) AND origin_lat + (me.r / 110.574)
      AND l.longitude BETWEEN
        origin_lng - (me.r / (111.32 * GREATEST(0.2, abs(cos(radians(origin_lat))))))
        AND origin_lng + (me.r / (111.32 * GREATEST(0.2, abs(cos(radians(origin_lat))))))
      AND NOT EXISTS (
        SELECT 1 FROM public.buddy_likes b
        WHERE b.id IN ('b|' || me.uid || '|' || p.id::text, 'b|' || p.id::text || '|' || me.uid)
      )
  ) ranked
  CROSS JOIN me
  WHERE ranked.raw_km <= me.r
  ORDER BY ranked.raw_km
  LIMIT 200;
$$;

REVOKE ALL ON FUNCTION public.buddy_within_radius(double precision, double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buddy_within_radius(double precision, double precision, double precision) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Private reports (shared by Buddy and Coach)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.safety_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id TEXT NOT NULL DEFAULT auth.uid()::text,
  reported_id TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT 'buddy' CHECK (context IN ('buddy', 'coach')),
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 200),
  details TEXT CHECK (details IS NULL OR char_length(details) <= 2000),
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.safety_reports FROM anon, authenticated;
GRANT INSERT ON public.safety_reports TO authenticated;

DROP POLICY IF EXISTS "safety_reports_insert_own" ON public.safety_reports;
CREATE POLICY "safety_reports_insert_own" ON public.safety_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid()::text AND reported_id <> reporter_id);

-- Old reports were stored as r| rows that the reported person could read. Move them, then remove them.
INSERT INTO public.safety_reports (reporter_id, reported_id, context, reason, details, created_at)
SELECT
  split_part(l.id, '|', 2),
  l.to_id,
  'buddy',
  'Imported report',
  left(COALESCE(substring(l.id FROM '^r\|[^|]*\|[^|]*\|[^|]*\|raw\|(.*)$'), ''), 2000),
  COALESCE(l.created_at, NOW())
FROM public.buddy_likes l
WHERE l.id LIKE 'r|%' AND split_part(l.id, '|', 2) <> l.to_id;

DELETE FROM public.buddy_likes WHERE id LIKE 'r|%';

-- ---------------------------------------------------------------------------
-- 5. Likes, blocks and messages
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.buddy_can_message(me text, them text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT me IS NOT NULL AND them IS NOT NULL AND me <> them
    AND EXISTS (SELECT 1 FROM public.buddy_likes WHERE id = me || ':' || them)
    AND EXISTS (SELECT 1 FROM public.buddy_likes WHERE id = them || ':' || me)
    AND NOT EXISTS (
      SELECT 1 FROM public.buddy_likes
      WHERE id IN ('b|' || me || '|' || them, 'b|' || them || '|' || me)
    );
$$;

REVOKE ALL ON FUNCTION public.buddy_can_message(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buddy_can_message(text, text) TO authenticated;

DROP POLICY IF EXISTS "buddy_likes_read" ON public.buddy_likes;
DROP POLICY IF EXISTS "buddy_likes_insert" ON public.buddy_likes;
DROP POLICY IF EXISTS "buddy_likes_update" ON public.buddy_likes;

CREATE POLICY "buddy_likes_read" ON public.buddy_likes
  FOR SELECT TO authenticated
  USING (
    to_id::text = auth.uid()::text
    OR from_id::text = auth.uid()::text
    OR from_id::text = 'm|' || auth.uid()::text
    OR from_id::text = 'b|' || auth.uid()::text
  );

CREATE POLICY "buddy_likes_insert" ON public.buddy_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    (from_id::text = auth.uid()::text AND to_id::text <> auth.uid()::text
      AND id::text = auth.uid()::text || ':' || to_id::text)
    OR (from_id::text = 'b|' || auth.uid()::text AND to_id::text <> auth.uid()::text
      AND id::text = 'b|' || auth.uid()::text || '|' || to_id::text)
    OR (from_id::text = 'm|' || auth.uid()::text
      AND starts_with(id::text, 'm|' || auth.uid()::text || '|' || to_id::text || '|')
      AND public.buddy_can_message(auth.uid()::text, to_id::text))
  );

CREATE POLICY "buddy_likes_update" ON public.buddy_likes
  FOR UPDATE TO authenticated
  USING (from_id::text = auth.uid()::text OR from_id::text = 'b|' || auth.uid()::text)
  WITH CHECK (
    (from_id::text = auth.uid()::text AND id::text = auth.uid()::text || ':' || to_id::text)
    OR (from_id::text = 'b|' || auth.uid()::text AND id::text = 'b|' || auth.uid()::text || '|' || to_id::text)
  );
