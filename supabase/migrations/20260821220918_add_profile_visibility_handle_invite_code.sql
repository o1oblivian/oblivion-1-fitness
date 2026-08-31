/*
# Add Profile Visibility, Handle, and Invite Code to user_profiles

1. Modified Tables
   - `user_profiles`
     - `handle` (text, unique) - the @username handle for buddy search
     - `invite_code` (text, unique) - 6-char code for buddy pairing
     - `gym_zone_sharing` (boolean, default true) - broadcast gym on buddy radar
     - `public_telemetry` (boolean, default false) - show stats publicly
     - `age` (int) - athlete age
     - `height_cm` (numeric) - height in cm
     - `weight_kg` (numeric) - weight in kg
     - `gender` (text) - gender
     - `primary_sport` (text) - training discipline
     - `experience_level` (text) - level

2. Security
   - Replace owner-only SELECT with open SELECT for authenticated (needed for buddy search)
   - UPDATE still restricted to own profile only
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='handle') THEN
    ALTER TABLE public.user_profiles ADD COLUMN handle text UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='invite_code') THEN
    ALTER TABLE public.user_profiles ADD COLUMN invite_code text UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='gym_zone_sharing') THEN
    ALTER TABLE public.user_profiles ADD COLUMN gym_zone_sharing boolean NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='public_telemetry') THEN
    ALTER TABLE public.user_profiles ADD COLUMN public_telemetry boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='age') THEN
    ALTER TABLE public.user_profiles ADD COLUMN age int;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='height_cm') THEN
    ALTER TABLE public.user_profiles ADD COLUMN height_cm numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='weight_kg') THEN
    ALTER TABLE public.user_profiles ADD COLUMN weight_kg numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='gender') THEN
    ALTER TABLE public.user_profiles ADD COLUMN gender text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='primary_sport') THEN
    ALTER TABLE public.user_profiles ADD COLUMN primary_sport text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='experience_level') THEN
    ALTER TABLE public.user_profiles ADD COLUMN experience_level text;
  END IF;
END $$;

-- Allow any authenticated user to search/view profiles (for buddy discovery)
DROP POLICY IF EXISTS "select_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "select_any_profile" ON public.user_profiles;
CREATE POLICY "select_any_profile" ON public.user_profiles FOR SELECT
  TO authenticated USING (true);
