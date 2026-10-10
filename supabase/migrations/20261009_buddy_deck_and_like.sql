-- Exact radius deck and a locked daily like cap. Safe to run more than once.

CREATE OR REPLACE FUNCTION public.buddy_within_radius(
  origin_lat double precision,
  origin_lng double precision,
  radius_km double precision
)
RETURNS TABLE (
  id text,
  user_id text,
  athlete_name text,
  age integer,
  home_gym text,
  latitude double precision,
  longitude double precision,
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
  is_ghost_mode boolean,
  distance_km double precision
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    ranked.id,
    ranked.user_id,
    ranked.athlete_name,
    ranked.age,
    ranked.home_gym,
    ranked.latitude,
    ranked.longitude,
    ranked.avatar_url,
    ranked.image_url,
    ranked.discipline,
    ranked.current_split,
    ranked.training_time,
    ranked.gender,
    ranked.looking_for,
    ranked.training_place,
    ranked.experience_level,
    ranked.bio,
    ranked.last_active,
    ranked.is_ghost_mode,
    ranked.distance_km
  FROM (
    SELECT
      p.id::text AS id,
      p.user_id::text AS user_id,
      p.athlete_name,
      p.age,
      p.home_gym,
      p.latitude,
      p.longitude,
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
      p.is_ghost_mode,
      round((
        6371 * acos(least(1::double precision, greatest(-1::double precision,
          cos(radians(origin_lat)) * cos(radians(p.latitude))
          * cos(radians(p.longitude) - radians(origin_lng))
          + sin(radians(origin_lat)) * sin(radians(p.latitude))
        )))
      )::numeric, 1)::double precision AS distance_km
    FROM public.buddy_profiles p
    WHERE COALESCE(p.is_ghost_mode, false) = false
      AND p.age >= 18
      AND p.latitude IS NOT NULL
      AND p.longitude IS NOT NULL
      AND NOT (p.latitude = 0 AND p.longitude = 0)
      AND p.latitude BETWEEN origin_lat - (radius_km / 110.574) AND origin_lat + (radius_km / 110.574)
      AND p.longitude BETWEEN
        origin_lng - (radius_km / (111.32 * GREATEST(0.2, abs(cos(radians(origin_lat))))))
        AND origin_lng + (radius_km / (111.32 * GREATEST(0.2, abs(cos(radians(origin_lat))))))
  ) ranked
  WHERE ranked.distance_km <= radius_km
  ORDER BY ranked.distance_km
  LIMIT 200;
$$;

GRANT EXECUTE ON FUNCTION public.buddy_within_radius(double precision, double precision, double precision) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.send_buddy_like(their_id text, unlimited boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  me text := auth.uid()::text;
  like_id text;
  used integer;
  already boolean;
  mutual boolean;
  entitled boolean := false;
BEGIN
  IF me IS NULL OR their_id IS NULL OR btrim(their_id) = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'auth');
  END IF;

  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM public.user_entitlements e
      WHERE e.user_id = me
        AND e.status = 'active'
        AND e.tier IS NOT NULL
        AND lower(e.tier) NOT IN ('free', '')
        AND (e.expires_at IS NULL OR e.expires_at > now())
    ) INTO entitled;
  EXCEPTION
    WHEN undefined_table THEN entitled := false;
  END;

  like_id := me || ':' || their_id;
  PERFORM pg_advisory_xact_lock(hashtext(me));

  SELECT EXISTS (SELECT 1 FROM public.buddy_likes WHERE id = like_id) INTO already;
  IF NOT already AND NOT COALESCE(unlimited, false) AND NOT entitled THEN
    SELECT count(*)::integer INTO used
    FROM public.buddy_likes
    WHERE from_id = me
      AND created_at >= date_trunc('day', now());
    IF used >= 5 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'cap');
    END IF;
  END IF;

  INSERT INTO public.buddy_likes (id, from_id, to_id)
  VALUES (like_id, me, their_id)
  ON CONFLICT (id) DO NOTHING;

  SELECT EXISTS (
    SELECT 1 FROM public.buddy_likes
    WHERE from_id = their_id AND to_id = me
  ) INTO mutual;

  RETURN jsonb_build_object('ok', true, 'mutual', mutual);
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_buddy_like(text, boolean) TO authenticated;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.buddy_likes;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;
