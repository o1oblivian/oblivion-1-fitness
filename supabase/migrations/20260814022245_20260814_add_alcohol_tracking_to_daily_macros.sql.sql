/*
# Add alcohol tracking column to daily_macros

1. Modified Tables
- `daily_macros`: Add `alcohol_drinks` (numeric, default 0) — number of alcoholic drinks logged that day.
- `daily_macros`: Add `alcohol_grams` (numeric, default 0) — total grams of alcohol consumed (for calorie/nutrition calculations).

2. Security
- No changes to existing RLS policies. The new columns inherit the table's existing policies.
- Users can only read/write their own rows (scoped by user_email, same as existing columns).

3. Notes
- `alcohol_drinks` represents standard drinks (1 drink = ~14g pure alcohol).
- `alcohol_grams` is the cumulative grams of alcohol for the day, used for calorie calculations (7 kcal/g).
- Both default to 0 so existing rows are unaffected.
*/

ALTER TABLE daily_macros
  ADD COLUMN IF NOT EXISTS alcohol_drinks numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS alcohol_grams numeric DEFAULT 0;