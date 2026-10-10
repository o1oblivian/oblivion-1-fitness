-- Vault bookmarks. A signed-in member can save and remove their own films.
-- Run once in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.vault_bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  reel_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, reel_id)
);

ALTER TABLE public.vault_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vault_bookmarks_owner ON public.vault_bookmarks;
CREATE POLICY vault_bookmarks_owner ON public.vault_bookmarks
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_bookmarks TO authenticated;

ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS is_pr BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS pr_count INTEGER NOT NULL DEFAULT 0;
