-- Reels each member has opened. Drives the watched / unwatched rings on the Workout page.
-- Private: members read and write only their own rows. Run this once in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.reel_views (
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  reel_id TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, reel_id)
);

ALTER TABLE public.reel_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reel_views_read ON public.reel_views;
CREATE POLICY reel_views_read ON public.reel_views
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS reel_views_insert ON public.reel_views;
CREATE POLICY reel_views_insert ON public.reel_views
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS reel_views_delete ON public.reel_views;
CREATE POLICY reel_views_delete ON public.reel_views
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON public.reel_views TO authenticated;
