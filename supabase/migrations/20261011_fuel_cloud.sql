-- Fuel cloud source of truth.
-- fuel_profiles: one row per athlete (targets, body details, market, diet, supplement stack).
-- fuel_days: one row per athlete per LOCAL calendar date (meal totals, water, burn, electrolytes, supplements taken).
-- meal_logs.date holds the athlete's local YYYY-MM-DD; totals in fuel_days are recalculated by trigger
-- inside the same transaction as every meal insert, update or delete.

CREATE TABLE IF NOT EXISTS public.fuel_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  calorie_target INTEGER CHECK (calorie_target IS NULL OR calorie_target BETWEEN 800 AND 10000),
  protein_g INTEGER CHECK (protein_g IS NULL OR protein_g BETWEEN 0 AND 1000),
  carbs_g INTEGER CHECK (carbs_g IS NULL OR carbs_g BETWEEN 0 AND 2000),
  fats_g INTEGER CHECK (fats_g IS NULL OR fats_g BETWEEN 0 AND 1000),
  hydration_target_ml INTEGER CHECK (hydration_target_ml IS NULL OR hydration_target_ml BETWEEN 500 AND 10000),
  weight_kg NUMERIC(5, 1) CHECK (weight_kg IS NULL OR weight_kg BETWEEN 20 AND 400),
  height_cm NUMERIC(5, 1) CHECK (height_cm IS NULL OR height_cm BETWEEN 100 AND 250),
  age_years INTEGER CHECK (age_years IS NULL OR age_years BETWEEN 13 AND 110),
  sex TEXT CHECK (sex IS NULL OR sex IN ('male', 'female')),
  country TEXT,
  diet TEXT,
  supplement_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fuel_days (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  date_key DATE NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC(7, 1) NOT NULL DEFAULT 0,
  carbs NUMERIC(7, 1) NOT NULL DEFAULT 0,
  fats NUMERIC(7, 1) NOT NULL DEFAULT 0,
  water_ml INTEGER NOT NULL DEFAULT 0 CHECK (water_ml BETWEEN 0 AND 10000),
  burned_kcal INTEGER NOT NULL DEFAULT 0 CHECK (burned_kcal BETWEEN 0 AND 20000),
  electrolytes JSONB NOT NULL DEFAULT '{}'::jsonb,
  supplements_taken JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, date_key)
);

CREATE INDEX IF NOT EXISTS meal_logs_user_date_idx ON public.meal_logs (user_id, date);

CREATE OR REPLACE FUNCTION public.fuel_recalc_day(p_user UUID, p_date TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user IS NULL OR p_date IS NULL OR p_date !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RETURN;
  END IF;
  INSERT INTO public.fuel_days (user_id, date_key, calories, protein, carbs, fats, updated_at)
  SELECT p_user, p_date::date,
         COALESCE(ROUND(SUM(m.calories)), 0),
         COALESCE(ROUND(SUM(m.protein), 1), 0),
         COALESCE(ROUND(SUM(m.carbs), 1), 0),
         COALESCE(ROUND(SUM(m.fats), 1), 0),
         NOW()
  FROM public.meal_logs m
  WHERE m.user_id = p_user AND m.date = p_date
  ON CONFLICT (user_id, date_key) DO UPDATE
    SET calories = EXCLUDED.calories,
        protein = EXCLUDED.protein,
        carbs = EXCLUDED.carbs,
        fats = EXCLUDED.fats,
        updated_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.fuel_recalc_day(UUID, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.meal_logs_recalc_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.fuel_recalc_day(NEW.user_id, NEW.date);
  END IF;
  IF TG_OP = 'DELETE'
     OR (TG_OP = 'UPDATE' AND (OLD.user_id IS DISTINCT FROM NEW.user_id OR OLD.date IS DISTINCT FROM NEW.date)) THEN
    PERFORM public.fuel_recalc_day(OLD.user_id, OLD.date);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS meal_logs_recalc ON public.meal_logs;
CREATE TRIGGER meal_logs_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.meal_logs
  FOR EACH ROW EXECUTE FUNCTION public.meal_logs_recalc_trigger();

ALTER TABLE public.fuel_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "athlete manages own fuel profile" ON public.fuel_profiles;
CREATE POLICY "athlete manages own fuel profile" ON public.fuel_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "athlete manages own fuel days" ON public.fuel_days;
CREATE POLICY "athlete manages own fuel days" ON public.fuel_days
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "athlete manages own meal logs" ON public.meal_logs;
CREATE POLICY "athlete manages own meal logs" ON public.meal_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "coach reads linked fuel profile" ON public.fuel_profiles;
CREATE POLICY "coach reads linked fuel profile" ON public.fuel_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.coach_clients c
                 WHERE c.client_id::text = fuel_profiles.user_id::text AND c.coach_id::text = auth.uid()::text));

DROP POLICY IF EXISTS "coach reads linked fuel days" ON public.fuel_days;
CREATE POLICY "coach reads linked fuel days" ON public.fuel_days
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.coach_clients c
                 WHERE c.client_id::text = fuel_days.user_id::text AND c.coach_id::text = auth.uid()::text));

DROP POLICY IF EXISTS "coach reads linked meal logs" ON public.meal_logs;
CREATE POLICY "coach reads linked meal logs" ON public.meal_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.coach_clients c
                 WHERE c.client_id::text = meal_logs.user_id::text AND c.coach_id::text = auth.uid()::text));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fuel_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fuel_days TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_logs TO authenticated;

-- Settings > Profile saves the avatar here; the column was missing.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

NOTIFY pgrst, 'reload schema';
