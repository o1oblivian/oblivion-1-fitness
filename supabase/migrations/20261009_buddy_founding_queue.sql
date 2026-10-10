-- Founding Lifters queue. Safe to run more than once.
-- Buddy stays on the queue until you flip is_buddy_active.

CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  is_buddy_active BOOLEAN NOT NULL DEFAULT FALSE,
  threshold INTEGER NOT NULL DEFAULT 250,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_config ADD COLUMN IF NOT EXISTS is_buddy_active BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.app_config ADD COLUMN IF NOT EXISTS threshold INTEGER NOT NULL DEFAULT 250;
ALTER TABLE public.app_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

INSERT INTO public.app_config (key, is_buddy_active, threshold)
VALUES ('buddy', FALSE, 250)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_config_read" ON public.app_config;
CREATE POLICY "app_config_read" ON public.app_config
  FOR SELECT TO anon, authenticated
  USING (true);

GRANT SELECT ON public.app_config TO anon, authenticated;

ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS region_key TEXT;
CREATE INDEX IF NOT EXISTS buddy_profiles_region_key_idx ON public.buddy_profiles (region_key);
CREATE INDEX IF NOT EXISTS buddy_profiles_lat_lng_idx ON public.buddy_profiles (latitude, longitude);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- Open the deck later with:
-- UPDATE public.app_config
-- SET is_buddy_active = TRUE, updated_at = NOW()
-- WHERE key = 'buddy';
