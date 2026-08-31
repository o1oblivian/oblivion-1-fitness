INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reels-media',
  'reels-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to reels-media bucket
CREATE POLICY "allow_authenticated_upload_reels" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reels-media');

-- Allow public read access to reels-media
CREATE POLICY "allow_public_read_reels" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'reels-media');

-- Allow users to delete their own uploads
CREATE POLICY "allow_owner_delete_reels" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'reels-media');