# Buddy (archived)

Buddy and Radar were removed from the live app. These files are kept for reference only.

- Nothing here is imported by the app, and `tsconfig.json` excludes this folder, so it is not type-checked or built.
- Paths mirror the original layout (`src/features/radar`, `src/stores`, `src/services`, `src/components/settings`).
- Relative imports point at the old locations and will not resolve from here.
- The complete working app with Buddy is on the `buddy-standalone` branch.
- The Supabase tables and migrations for Buddy (`buddy_*`) were left in place.
