/*
# Add show_on_buddy flag to profile_media (Unified Photo Vault)

1. Modified Tables
   - `profile_media`
     - `show_on_buddy` (boolean, default false) — when true, this photo appears on the user's buddy radar card for others to see

2. Notes
   - This enables a single-library, dual-view architecture:
     - The Vault (athlete page) shows ALL user photos
     - The Buddy radar card shows only photos where show_on_buddy = true
   - No additional storage cost — same file, just filtered differently
   - Existing SELECT policy already allows all authenticated users to read (needed for buddy browsing)
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profile_media' AND column_name='show_on_buddy') THEN
    ALTER TABLE profile_media ADD COLUMN show_on_buddy boolean NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profile_media_show_on_buddy ON profile_media(user_id) WHERE show_on_buddy = true;
