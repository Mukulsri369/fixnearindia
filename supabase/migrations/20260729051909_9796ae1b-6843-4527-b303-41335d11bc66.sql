-- Helper: can the current technician see this customer's profile?
CREATE OR REPLACE FUNCTION private.technician_can_view_profile(_profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.repair_requests r
    JOIN public.request_assignments ra ON ra.repair_request_id = r.id
    WHERE r.customer_id = _profile_user_id
      AND ra.technician_id = private.current_technician_id()
  )
$$;

REVOKE ALL ON FUNCTION private.technician_can_view_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.technician_can_view_profile(uuid) TO authenticated;

DROP POLICY IF EXISTS "Technicians can read customer profiles for their jobs" ON public.profiles;
CREATE POLICY "Technicians can read customer profiles for their jobs"
ON public.profiles FOR SELECT TO authenticated
USING (private.technician_can_view_profile(user_id));

-- Assignments policy referenced profiles/technicians directly, feeding the loop
DROP POLICY IF EXISTS "Technicians can read their own assignments" ON public.request_assignments;
CREATE POLICY "Technicians can read their own assignments"
ON public.request_assignments FOR SELECT TO authenticated
USING (technician_id = private.current_technician_id());

-- technicians self-management policy also queries profiles; use a definer helper
CREATE OR REPLACE FUNCTION private.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

REVOKE ALL ON FUNCTION private.current_profile_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_profile_id() TO authenticated;

DROP POLICY IF EXISTS "Technicians can manage their own technician profile" ON public.technicians;
CREATE POLICY "Technicians can manage their own technician profile"
ON public.technicians FOR ALL TO authenticated
USING (profile_id = private.current_profile_id())
WITH CHECK (profile_id = private.current_profile_id());

DROP POLICY IF EXISTS "Users can manage their own technician categories" ON public.technician_categories;
CREATE POLICY "Users can manage their own technician categories"
ON public.technician_categories FOR ALL TO authenticated
USING (technician_id = private.current_technician_id())
WITH CHECK (technician_id = private.current_technician_id());

DROP POLICY IF EXISTS "Users can manage their own service areas" ON public.technician_service_areas;
CREATE POLICY "Users can manage their own service areas"
ON public.technician_service_areas FOR ALL TO authenticated
USING (technician_id = private.current_technician_id())
WITH CHECK (technician_id = private.current_technician_id());