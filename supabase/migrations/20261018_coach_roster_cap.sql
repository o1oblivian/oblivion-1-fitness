-- Coach roster cap. Safe to run more than once in the Supabase SQL editor.
-- Coach Starter keeps up to 5 active athletes. Coach Pro (an active coach_pro entitlement) is unlimited.
-- The rule lives in the database so every way onto a roster is covered: invite codes, accepted applications and
-- a coach adding an athlete directly. Keep the number 5 in step with COACH_PLANS.starter.rosterLimit in
-- shared/coachPlans.ts (server/lib/rosterCap.test.ts fails if they drift).
--
-- Athletes already on a roster are never removed. Going over the cap only blocks NEW or REACTIVATED athletes.

-- ---------------------------------------------------------------------------
-- 1. The cap for one coach. NULL means unlimited.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.coach_roster_limit(coach text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM public.user_entitlements e
    WHERE e.user_id = coach
      AND e.status = 'active'
      AND (e.expires_at IS NULL OR e.expires_at > now())
      AND lower(e.tier) LIKE '%coach_pro%'
  ) THEN NULL ELSE 5 END;
$$;

REVOKE ALL ON FUNCTION public.coach_roster_limit(text) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Block a new or reactivated athlete when the roster is full
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_coach_roster_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap integer;
  seated integer;
BEGIN
  IF COALESCE(NEW.status, '') <> 'active' THEN
    RETURN NEW;
  END IF;
  -- Editing a row that is already active on the same roster never counts as a new seat.
  IF TG_OP = 'UPDATE' AND COALESCE(OLD.status, '') = 'active' AND OLD.coach_id::text = NEW.coach_id::text THEN
    RETURN NEW;
  END IF;

  cap := public.coach_roster_limit(NEW.coach_id::text);
  IF cap IS NULL THEN
    RETURN NEW;
  END IF;

  -- One join at a time per coach, so two simultaneous joins cannot both take the last seat.
  PERFORM pg_advisory_xact_lock(hashtext('coach_roster:' || NEW.coach_id::text));

  SELECT count(*) INTO seated
  FROM public.coach_clients c
  WHERE c.coach_id::text = NEW.coach_id::text
    AND c.status = 'active'
    AND c.client_id::text <> NEW.client_id::text;

  IF seated >= cap THEN
    RAISE EXCEPTION 'ROSTER_FULL' USING ERRCODE = 'P0001', HINT = cap::text;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_coach_roster_cap() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS coach_clients_roster_cap ON public.coach_clients;
CREATE TRIGGER coach_clients_roster_cap
  BEFORE INSERT OR UPDATE OF status, coach_id ON public.coach_clients
  FOR EACH ROW EXECUTE FUNCTION public.enforce_coach_roster_cap();

-- ---------------------------------------------------------------------------
-- 3. A full Starter coach stops showing as "taking athletes"
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.close_full_coach_roster()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap integer;
  seated integer;
BEGIN
  IF COALESCE(NEW.status, '') <> 'active' THEN
    RETURN NULL;
  END IF;
  cap := public.coach_roster_limit(NEW.coach_id::text);
  IF cap IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT count(*) INTO seated
  FROM public.coach_clients c
  WHERE c.coach_id::text = NEW.coach_id::text AND c.status = 'active';
  IF seated >= cap THEN
    UPDATE public.coach_profiles SET accepting_new_athletes = false WHERE id::text = NEW.coach_id::text;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.close_full_coach_roster() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS coach_clients_close_when_full ON public.coach_clients;
CREATE TRIGGER coach_clients_close_when_full
  AFTER INSERT OR UPDATE OF status ON public.coach_clients
  FOR EACH ROW EXECUTE FUNCTION public.close_full_coach_roster();

-- ---------------------------------------------------------------------------
-- 4. What the coach screen shows: seats used and the cap (limit is null for Coach Pro)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_roster_status()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'active', (SELECT count(*) FROM public.coach_clients c WHERE c.coach_id::text = auth.uid()::text AND c.status = 'active'),
    'limit', public.coach_roster_limit(auth.uid()::text)
  );
$$;

REVOKE ALL ON FUNCTION public.my_roster_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_roster_status() TO authenticated;
