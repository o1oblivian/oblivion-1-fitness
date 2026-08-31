/*
# Add bio and training_tags to user_profiles

1. Modified Tables
  - `user_profiles`
    - `bio` (text, optional short profile bio)
    - `training_tags` (text[], array of training style tags)
    - `streak_days` (integer, current streak)

2. Notes
  - These fields power the new Athlete Showcase profile card.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bio') THEN
    ALTER TABLE user_profiles ADD COLUMN bio text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'training_tags') THEN
    ALTER TABLE user_profiles ADD COLUMN training_tags text[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'streak_days') THEN
    ALTER TABLE user_profiles ADD COLUMN streak_days integer DEFAULT 0;
  END IF;
END $$;
