-- Reel likes. Anyone signed in can read counts; members add and remove only their own like.
-- Run this once in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.reel_likes (
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  reel_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, reel_id)
);
CREATE INDEX IF NOT EXISTS reel_likes_reel_idx ON public.reel_likes (reel_id);

ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reel_likes_read ON public.reel_likes;
CREATE POLICY reel_likes_read ON public.reel_likes
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS reel_likes_insert ON public.reel_likes;
CREATE POLICY reel_likes_insert ON public.reel_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS reel_likes_delete ON public.reel_likes;
CREATE POLICY reel_likes_delete ON public.reel_likes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON public.reel_likes TO authenticated;
