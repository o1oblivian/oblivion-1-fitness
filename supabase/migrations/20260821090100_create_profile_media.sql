/*
# Create profile_media table and storage bucket

1. New Tables
  - `profile_media`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users, defaults to auth.uid())
    - `media_url` (text, the public URL of the uploaded file)
    - `media_type` (text, 'image' or 'video')
    - `sort_order` (integer, display ordering)
    - `caption` (text, optional short caption)
    - `created_at` (timestamptz)

2. Security
  - Enable RLS on `profile_media`.
  - Authenticated users can CRUD their own media.
  - Anyone authenticated can SELECT all media (needed for buddy matching/viewing).

3. Storage
  - Create 'profile-media' bucket for uploads (public access for reading).

4. Notes
  - Max 6 media items per user enforced at application level.
  - sort_order determines gallery display order.
*/

-- Profile media table
CREATE TABLE IF NOT EXISTS profile_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  sort_order integer NOT NULL DEFAULT 0,
  caption text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_media_user_id ON profile_media(user_id);

ALTER TABLE profile_media ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view media (for buddy browsing)
DROP POLICY IF EXISTS "select_all_profile_media" ON profile_media;
CREATE POLICY "select_all_profile_media" ON profile_media FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile_media" ON profile_media;
CREATE POLICY "insert_own_profile_media" ON profile_media FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile_media" ON profile_media;
CREATE POLICY "update_own_profile_media" ON profile_media FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile_media" ON profile_media;
CREATE POLICY "delete_own_profile_media" ON profile_media FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for profile media
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-media', 'profile-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload to their own folder
DROP POLICY IF EXISTS "profile_media_upload" ON storage.objects;
CREATE POLICY "profile_media_upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "profile_media_update" ON storage.objects;
CREATE POLICY "profile_media_update" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "profile_media_delete" ON storage.objects;
CREATE POLICY "profile_media_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "profile_media_public_read" ON storage.objects;
CREATE POLICY "profile_media_public_read" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'profile-media');
