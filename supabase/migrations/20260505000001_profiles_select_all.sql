-- Phase 8: Allow all authenticated users to read profiles (display_name needed for MovementTable operator column)
-- Replaces restrictive profiles_select_own that only allowed reading own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

CREATE POLICY "profiles_select_all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
