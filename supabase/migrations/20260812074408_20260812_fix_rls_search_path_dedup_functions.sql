-- Drop old duplicate function signatures from the original migration
DROP FUNCTION IF EXISTS public.find_buddy_matches(text, numeric, numeric, numeric);
DROP FUNCTION IF EXISTS public.get_nearby_gym_venues(numeric, numeric, numeric);

-- Fix search_path on remaining functions
ALTER FUNCTION public.find_buddy_matches(text, double precision, double precision, double precision) SET search_path = public, extensions;

-- Recreate get_nearby_gym_venues with double precision args and search_path
CREATE OR REPLACE FUNCTION public.get_nearby_gym_venues(
  user_lat double precision,
  user_lng double precision,
  radius_meters integer DEFAULT 25000
)
RETURNS TABLE (
  id text,
  name text,
  postcode text,
  address text,
  lat numeric,
  lng numeric,
  image_url text,
  is_partner boolean,
  vibe_tags text[],
  pass_price_aud numeric,
  active_checkins_count integer,
  distance_km numeric
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT
    v.id,
    v.name,
    v.postcode,
    v.address,
    v.lat,
    v.lng,
    v.image_url,
    v.is_partner,
    v.vibe_tags,
    v.pass_price_aud,
    v.active_checkins_count,
    ST_Distance(
      v.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1000.0 AS distance_km
  FROM gym_venues v
  WHERE v.location IS NOT NULL
    AND ST_DWithin(
      v.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_km ASC
  LIMIT 50;
$$;

-- Ensure RLS on workout_logs
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies before recreating
DROP POLICY IF EXISTS "Allow read workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "Allow write workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "select_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "insert_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "update_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "delete_workout_logs" ON workout_logs;

CREATE POLICY "select_workout_logs" ON workout_logs FOR SELECT
  TO authenticated USING (auth.uid()::text = user_email);
CREATE POLICY "insert_workout_logs" ON workout_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = user_email);
CREATE POLICY "update_workout_logs" ON workout_logs FOR UPDATE
  TO authenticated USING (auth.uid()::text = user_email) WITH CHECK (auth.uid()::text = user_email);
CREATE POLICY "delete_workout_logs" ON workout_logs FOR DELETE
  TO authenticated USING (auth.uid()::text = user_email);