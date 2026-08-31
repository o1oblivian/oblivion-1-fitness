/*
# Add trial_ends_at to user_profiles

1. Modified Tables
   - `user_profiles`
     - `trial_ends_at` (timestamptz, nullable) — when the user's 90-day free premium trial expires.
       NULL means no trial was activated (legacy accounts or paid users).

2. Important Notes
   - Existing rows remain NULL; new sign-ups will have this set by the app on profile creation.
   - No policy changes needed — existing RLS policies already cover the column.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN trial_ends_at timestamptz DEFAULT NULL;
  END IF;
END $$;
