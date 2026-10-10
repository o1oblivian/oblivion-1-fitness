-- Store subscription status (RevenueCat). Read by the coach platform-fee split and the Buddy premium check.
-- Only the server (service role, via the RevenueCat webhook) may write; users can read their own row.
CREATE TABLE IF NOT EXISTS public.user_entitlements (
  user_id TEXT PRIMARY KEY,
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  platform TEXT DEFAULT 'web',
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on user_entitlements" ON public.user_entitlements;
DROP POLICY IF EXISTS "Allow public upsert on user_entitlements" ON public.user_entitlements;
DROP POLICY IF EXISTS "user_entitlements_read_own" ON public.user_entitlements;

CREATE POLICY "user_entitlements_read_own" ON public.user_entitlements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

REVOKE INSERT, UPDATE, DELETE ON public.user_entitlements FROM anon, authenticated;
GRANT SELECT ON public.user_entitlements TO authenticated;
