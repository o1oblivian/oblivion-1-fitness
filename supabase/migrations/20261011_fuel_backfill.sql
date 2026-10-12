-- One-off: compute fuel_days totals for meals logged before the recalc trigger existed.
-- Idempotent; safe to re-run. Only touches the calories/protein/carbs/fats columns.
SELECT public.fuel_recalc_day(d.user_id, d.date)
FROM (SELECT DISTINCT user_id, date FROM public.meal_logs WHERE user_id IS NOT NULL AND date IS NOT NULL) AS d;
