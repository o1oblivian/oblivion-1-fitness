-- A coach can read the profile of an athlete already linked on coach_clients.
-- Own-row access stays on "athlete manages own profile".

DROP POLICY IF EXISTS "coach reads linked athlete profile" ON public.profiles;
CREATE POLICY "coach reads linked athlete profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_clients c
      WHERE c.client_id::text = profiles.id::text
        AND c.coach_id::text = auth.uid()::text
        AND c.status = 'active'
    )
  );
