-- Real media storage: one public bucket, each member writes only inside their own folder (<user id>/...).
-- Also creates the reels and media_vault tables the app writes to. Run once in the Supabase SQL editor.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS media_owner_read ON storage.objects;
CREATE POLICY media_owner_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS media_owner_insert ON storage.objects;
CREATE POLICY media_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS media_owner_update ON storage.objects;
CREATE POLICY media_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS media_owner_delete ON storage.objects;
CREATE POLICY media_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Coach reels: anyone can watch, only the coach can add or remove their own.
CREATE TABLE IF NOT EXISTS public.reels (
  id TEXT PRIMARY KEY,
  coach_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  filter_tag TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  cues TEXT,
  duration_secs INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reels_coach_idx ON public.reels (coach_id, created_at DESC);

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reels_read ON public.reels;
CREATE POLICY reels_read ON public.reels FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS reels_insert_own ON public.reels;
CREATE POLICY reels_insert_own ON public.reels FOR INSERT TO authenticated WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS reels_delete_own ON public.reels;
CREATE POLICY reels_delete_own ON public.reels FOR DELETE TO authenticated USING (coach_id = auth.uid());

GRANT SELECT ON public.reels TO anon, authenticated;
GRANT INSERT, DELETE ON public.reels TO authenticated;

-- Private media library: each member sees only their own items.
CREATE TABLE IF NOT EXISTS public.media_vault (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'photo' CHECK (type IN ('photo', 'video')),
  title TEXT,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS media_vault_user_idx ON public.media_vault (user_id, created_at DESC);

ALTER TABLE public.media_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_vault_own ON public.media_vault;
CREATE POLICY media_vault_own ON public.media_vault
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_vault TO authenticated;
GRANT ALL ON public.reels, public.media_vault TO service_role;
