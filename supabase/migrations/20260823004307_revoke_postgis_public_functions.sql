/*
# Revoke public access to PostGIS internal functions

1. Security Changes
  - Revoke EXECUTE on `st_estimatedextent` (all overloads) from anon and authenticated roles.
  - These are internal PostGIS functions that should not be callable via the public API.

2. Important Notes
  - The PostGIS extension itself remains installed; only the API-accessible function calls are locked down.
  - This resolves the security advisor warning about SECURITY DEFINER functions callable without auth.
*/

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text) FROM anon, authenticated;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) FROM anon, authenticated;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM anon, authenticated;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;