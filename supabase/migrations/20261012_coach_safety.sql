-- Coach safety. Safe to run more than once in the Supabase SQL editor. Run after 20261012_buddy_safety.sql.
-- 1. Athletes join a roster only with a real invite code or an accepted application.
-- 2. Invite codes are readable only by the coach who made them.
-- 3. Athletes can enroll themselves only in free programs or programs from an accepted application.
--    Paid purchases are enrolled by the server after Stripe confirms payment.
-- 4. Blocking works in coach messages, and coaches cannot message athletes who never reached out.

-- ---------------------------------------------------------------------------
-- 1. Roster joins
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coach_clients' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.coach_clients', p.policyname);
  END LOOP;
END $$;

ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_clients ADD COLUMN IF NOT EXISTS client_avatar TEXT;
REVOKE ALL ON public.coach_clients FROM anon;

DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS coach_clients_pair_idx ON public.coach_clients (coach_id, client_id);
EXCEPTION
  WHEN unique_violation THEN RAISE NOTICE 'coach_clients has duplicate pairs; the existing unique constraint is used instead';
END $$;

CREATE POLICY "coach_clients_read" ON public.coach_clients
  FOR SELECT TO authenticated
  USING (coach_id::text = auth.uid()::text OR client_id::text = auth.uid()::text);

CREATE POLICY "coach_clients_coach_writes" ON public.coach_clients
  FOR INSERT TO authenticated
  WITH CHECK (coach_id::text = auth.uid()::text AND client_id::text <> auth.uid()::text);

CREATE POLICY "coach_clients_coach_updates" ON public.coach_clients
  FOR UPDATE TO authenticated
  USING (coach_id::text = auth.uid()::text)
  WITH CHECK (coach_id::text = auth.uid()::text);

CREATE POLICY "coach_clients_leave" ON public.coach_clients
  FOR DELETE TO authenticated
  USING (coach_id::text = auth.uid()::text OR client_id::text = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.join_coach_by_invite(invite_code text, display_name text DEFAULT '', avatar text DEFAULT '')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me text := auth.uid()::text;
  inv public.coach_invites%ROWTYPE;
BEGIN
  IF me IS NULL OR invite_code IS NULL OR btrim(invite_code) = '' THEN
    RETURN NULL;
  END IF;
  SELECT * INTO inv FROM public.coach_invites WHERE code = btrim(invite_code);
  IF NOT FOUND OR inv.coach_id = me THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.coach_clients (coach_id, client_id, client_name, client_avatar, status)
  VALUES (inv.coach_id, me, COALESCE(NULLIF(left(btrim(display_name), 80), ''), 'Athlete'), NULLIF(left(avatar, 2000), ''), 'active')
  ON CONFLICT (coach_id, client_id) DO UPDATE SET status = 'active';
  RETURN jsonb_build_object(
    'coach_id', inv.coach_id,
    'coach_name', inv.coach_name,
    'coach_handle', COALESCE(inv.coach_handle, ''),
    'coach_avatar', COALESCE(inv.coach_avatar, '')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.join_coach_from_application(coach text, display_name text DEFAULT '')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me text := auth.uid()::text;
BEGIN
  IF me IS NULL OR coach IS NULL OR coach = me THEN
    RETURN false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.coaching_applications a
    WHERE a.athlete_id::text = me AND a.coach_id = coach AND a.status = 'accepted'
  ) THEN
    RETURN false;
  END IF;
  INSERT INTO public.coach_clients (coach_id, client_id, client_name, status)
  VALUES (coach, me, COALESCE(NULLIF(left(btrim(display_name), 80), ''), 'Athlete'), 'active')
  ON CONFLICT (coach_id, client_id) DO UPDATE SET status = 'active';
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.join_coach_by_invite(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_coach_from_application(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_coach_by_invite(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_coach_from_application(text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Invite codes
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "coach_invites_read" ON public.coach_invites;
CREATE POLICY "coach_invites_read" ON public.coach_invites
  FOR SELECT TO authenticated
  USING (coach_id::text = auth.uid()::text);
REVOKE ALL ON public.coach_invites FROM anon;

-- ---------------------------------------------------------------------------
-- 3. Program enrollments
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.program_enrollment_allowed(athlete text, program text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT athlete IS NOT NULL AND program IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.coach_programs p WHERE p.id::text = program AND COALESCE(p.listed, false) AND COALESCE(p.price_cents, 0) = 0)
    OR EXISTS (SELECT 1 FROM public.program_catalog c WHERE c.id::text = program AND COALESCE(c.active, false) AND COALESCE(c.price_cents, 0) = 0)
    OR EXISTS (
      SELECT 1 FROM public.coaching_applications a
      WHERE a.athlete_id::text = athlete AND a.program_id = program AND a.status = 'accepted'
    )
  );
$$;

REVOKE ALL ON FUNCTION public.program_enrollment_allowed(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.program_enrollment_allowed(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.program_enrollments_lock_keys()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.athlete_id IS DISTINCT FROM OLD.athlete_id
     OR NEW.program_id IS DISTINCT FROM OLD.program_id
     OR NEW.coach_id IS DISTINCT FROM OLD.coach_id THEN
    RAISE EXCEPTION 'Enrollment keys cannot change';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS program_enrollments_lock_keys ON public.program_enrollments;
CREATE TRIGGER program_enrollments_lock_keys
  BEFORE UPDATE ON public.program_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.program_enrollments_lock_keys();

DROP POLICY IF EXISTS program_enrollments_own ON public.program_enrollments;
DROP POLICY IF EXISTS program_enrollments_read ON public.program_enrollments;
DROP POLICY IF EXISTS program_enrollments_join ON public.program_enrollments;
DROP POLICY IF EXISTS program_enrollments_update ON public.program_enrollments;
DROP POLICY IF EXISTS program_enrollments_leave ON public.program_enrollments;

CREATE POLICY program_enrollments_read ON public.program_enrollments
  FOR SELECT TO authenticated USING (athlete_id = auth.uid());
CREATE POLICY program_enrollments_join ON public.program_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (athlete_id = auth.uid() AND public.program_enrollment_allowed(auth.uid()::text, program_id));
CREATE POLICY program_enrollments_update ON public.program_enrollments
  FOR UPDATE TO authenticated USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());
CREATE POLICY program_enrollments_leave ON public.program_enrollments
  FOR DELETE TO authenticated USING (athlete_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. Blocks and coach messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id TEXT NOT NULL DEFAULT auth.uid()::text,
  blocked_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_blocks FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;

DROP POLICY IF EXISTS "user_blocks_own" ON public.user_blocks;
CREATE POLICY "user_blocks_own" ON public.user_blocks
  FOR ALL TO authenticated
  USING (blocker_id = auth.uid()::text)
  WITH CHECK (blocker_id = auth.uid()::text AND blocked_id <> blocker_id);

CREATE OR REPLACE FUNCTION public.users_blocked(a text, b text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = a AND blocked_id = b) OR (blocker_id = b AND blocked_id = a)
  );
$$;

REVOKE ALL ON FUNCTION public.users_blocked(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.users_blocked(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.coach_thread_open(coach text, athlete text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.coach_clients c WHERE c.coach_id::text = coach AND c.client_id::text = athlete)
    OR EXISTS (SELECT 1 FROM public.coaching_applications a WHERE a.coach_id = coach AND a.athlete_id::text = athlete)
    OR EXISTS (SELECT 1 FROM public.coach_messages m WHERE m.coach_id::text = coach AND m.athlete_id::text = athlete);
$$;

REVOKE ALL ON FUNCTION public.coach_thread_open(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.coach_thread_open(text, text) TO authenticated;

DROP POLICY IF EXISTS "coach_messages_parties" ON public.coach_messages;
DROP POLICY IF EXISTS "coach_messages_read" ON public.coach_messages;
DROP POLICY IF EXISTS "coach_messages_send" ON public.coach_messages;
DROP POLICY IF EXISTS "coach_messages_delete" ON public.coach_messages;

CREATE POLICY "coach_messages_read" ON public.coach_messages
  FOR SELECT TO authenticated
  USING (coach_id::text = auth.uid()::text OR athlete_id::text = auth.uid()::text);

CREATE POLICY "coach_messages_send" ON public.coach_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (athlete_id::text = auth.uid()::text AND coach_id::text <> auth.uid()::text
      AND starts_with(id, 'msg-athlete-')
      AND NOT public.users_blocked(auth.uid()::text, coach_id::text))
    OR (coach_id::text = auth.uid()::text AND athlete_id IS NOT NULL AND athlete_id::text <> auth.uid()::text
      AND starts_with(id, 'msg-coach-')
      AND NOT public.users_blocked(auth.uid()::text, athlete_id::text)
      AND public.coach_thread_open(auth.uid()::text, athlete_id::text))
  );

CREATE POLICY "coach_messages_delete" ON public.coach_messages
  FOR DELETE TO authenticated
  USING (coach_id::text = auth.uid()::text OR athlete_id::text = auth.uid()::text);

REVOKE UPDATE ON public.coach_messages FROM authenticated;
