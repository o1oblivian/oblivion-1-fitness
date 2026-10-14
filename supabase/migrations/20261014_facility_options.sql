-- Training places for the consultation. Members can pick several; the app stores them as a
-- comma list in athlete_consultations.facility. Run once in the Supabase SQL editor. Safe to re-run.

INSERT INTO public.club_taxonomy_options (id, group_key, option_key, label, detail, sort_order, active) VALUES
  ('facility:commercial', 'facility', 'commercial', 'Commercial gym', 'Racks, machines, cables and cardio.', 1, TRUE),
  ('facility:box', 'facility', 'functional_box', 'Functional or CrossFit box', 'Rigs, sleds, ergs and kettlebells.', 2, TRUE),
  ('facility:garage', 'facility', 'garage_minimal', 'Home or garage gym', 'Barbell, rack, dumbbells or kettlebells.', 3, TRUE),
  ('facility:outdoor', 'facility', 'outdoor', 'Outdoor', 'Parks, tracks, hills and pull-up bars.', 4, TRUE),
  ('facility:bodyweight', 'facility', 'bodyweight', 'No equipment or travel', 'Bodyweight only, anywhere.', 5, TRUE),
  ('facility:other', 'facility', 'other', 'Somewhere else', 'We won''t limit your equipment.', 6, TRUE)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  detail = EXCLUDED.detail,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;
