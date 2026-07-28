-- 1) Restrict sensitive technician columns via column-level privileges
REVOKE SELECT ON public.technicians FROM anon;
REVOKE SELECT ON public.technicians FROM authenticated;

-- anon: only basic public marketplace info
GRANT SELECT (id, profile_id, business_name, experience_years, city, district, state, service_radius_km, is_approved, is_available, avg_rating, total_reviews, profile_photo_url, shop_photo_url, created_at, updated_at)
  ON public.technicians TO anon;

-- authenticated: everything except KYC documents
GRANT SELECT (id, profile_id, business_name, experience_years, address, city, district, state, pincode, lat, lng, service_radius_km, is_approved, is_available, avg_rating, total_reviews, profile_photo_url, shop_photo_url, visiting_card_url, created_at, updated_at)
  ON public.technicians TO authenticated;

GRANT ALL ON public.technicians TO service_role;

-- 2) Lock down has_role() direct execution (still usable inside RLS policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 3) Ownership-scoped storage policies for repair-images
DROP POLICY IF EXISTS "Authenticated users can insert repair images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can select repair images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update repair images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete repair images" ON storage.objects;
DROP POLICY IF EXISTS "repair images are public" ON storage.objects;
DROP POLICY IF EXISTS "authenticated upload repair images" ON storage.objects;
DROP POLICY IF EXISTS "owners delete repair images" ON storage.objects;

CREATE OR REPLACE FUNCTION public.can_access_repair_object(_path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.repair_requests r
    WHERE r.id::text = split_part(_path, '/', 1)
      AND (
        r.customer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.request_assignments ra
          JOIN public.technicians t ON t.id = ra.technician_id
          JOIN public.profiles p ON p.id = t.profile_id
          WHERE ra.repair_request_id = r.id AND p.user_id = auth.uid()
        )
      )
  ) OR public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_repair_object(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_repair_object(text) TO service_role;

CREATE POLICY "Repair image owners can read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'repair-images' AND public.can_access_repair_object(name));

CREATE POLICY "Repair image owners can insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'repair-images' AND public.can_access_repair_object(name));

CREATE POLICY "Repair image owners can update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'repair-images' AND public.can_access_repair_object(name))
  WITH CHECK (bucket_id = 'repair-images' AND public.can_access_repair_object(name));

CREATE POLICY "Repair image owners can delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'repair-images' AND public.can_access_repair_object(name));