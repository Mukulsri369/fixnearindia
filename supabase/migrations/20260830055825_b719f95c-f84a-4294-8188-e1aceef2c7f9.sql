-- 1. Extend technicians
ALTER TABLE public.technicians
  ADD COLUMN IF NOT EXISTS technician_type text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS segments text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_modes text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS availability jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pricing jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS workshop jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS business jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS experience_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS completion_percent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.technicians
  DROP CONSTRAINT IF EXISTS technicians_onboarding_status_check;
ALTER TABLE public.technicians
  ADD CONSTRAINT technicians_onboarding_status_check CHECK (onboarding_status IN
    ('draft','profile_incomplete','submitted','under_review','verification_required','verified','active','suspended','rejected','inactive'));

UPDATE public.technicians SET onboarding_status = CASE WHEN is_approved THEN 'active' ELSE 'submitted' END;

-- 2. Onboarding draft progress
CREATE TABLE IF NOT EXISTS public.technician_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  technician_id uuid REFERENCES public.technicians(id) ON DELETE SET NULL,
  current_step integer NOT NULL DEFAULT 1,
  completion_percent integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_onboarding TO authenticated;
GRANT ALL ON public.technician_onboarding TO service_role;
ALTER TABLE public.technician_onboarding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own onboarding" ON public.technician_onboarding
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage all onboarding" ON public.technician_onboarding
  FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER update_technician_onboarding_updated_at BEFORE UPDATE ON public.technician_onboarding
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

-- 3. Capabilities
CREATE TABLE IF NOT EXISTS public.technician_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  segment text NOT NULL,
  category text,
  equipment text,
  equipment_type text,
  brand text,
  skill text,
  service text,
  experience_years integer NOT NULL DEFAULT 0,
  skill_level text,
  verification_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS technician_capabilities_lookup_idx
  ON public.technician_capabilities (segment, category, equipment, brand, skill, service);
CREATE INDEX IF NOT EXISTS technician_capabilities_tech_idx ON public.technician_capabilities (technician_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_capabilities TO authenticated;
GRANT ALL ON public.technician_capabilities TO service_role;
ALTER TABLE public.technician_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Technicians manage their own capabilities" ON public.technician_capabilities
  FOR ALL TO authenticated USING (technician_id = private.current_technician_id()) WITH CHECK (technician_id = private.current_technician_id());
CREATE POLICY "Signed in users read approved technician capabilities" ON public.technician_capabilities
  FOR SELECT TO authenticated USING (technician_id IN (SELECT id FROM public.technicians WHERE is_approved = true));
CREATE POLICY "Admins manage all capabilities" ON public.technician_capabilities
  FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER update_technician_capabilities_updated_at BEFORE UPDATE ON public.technician_capabilities
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

-- 4. Qualifications
CREATE TABLE IF NOT EXISTS public.technician_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  qualification text NOT NULL,
  institute text,
  year integer,
  certificate_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_qualifications TO authenticated;
GRANT ALL ON public.technician_qualifications TO service_role;
ALTER TABLE public.technician_qualifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Technicians manage their own qualifications" ON public.technician_qualifications
  FOR ALL TO authenticated USING (technician_id = private.current_technician_id()) WITH CHECK (technician_id = private.current_technician_id());
CREATE POLICY "Admins manage all qualifications" ON public.technician_qualifications
  FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER update_technician_qualifications_updated_at BEFORE UPDATE ON public.technician_qualifications
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

-- 5. Certifications
CREATE TABLE IF NOT EXISTS public.technician_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuing_organization text,
  certificate_number text,
  issue_date date,
  expiry_date date,
  certificate_url text,
  verification_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_certifications TO authenticated;
GRANT ALL ON public.technician_certifications TO service_role;
ALTER TABLE public.technician_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Technicians manage their own certifications" ON public.technician_certifications
  FOR ALL TO authenticated USING (technician_id = private.current_technician_id()) WITH CHECK (technician_id = private.current_technician_id());
CREATE POLICY "Admins manage all certifications" ON public.technician_certifications
  FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER update_technician_certifications_updated_at BEFORE UPDATE ON public.technician_certifications
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

-- 6. Documents
CREATE TABLE IF NOT EXISTS public.technician_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_path text NOT NULL,
  verification_status text NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_documents TO authenticated;
GRANT ALL ON public.technician_documents TO service_role;
ALTER TABLE public.technician_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Technicians manage their own documents" ON public.technician_documents
  FOR ALL TO authenticated USING (technician_id = private.current_technician_id()) WITH CHECK (technician_id = private.current_technician_id());
CREATE POLICY "Admins manage all technician documents" ON public.technician_documents
  FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER update_technician_documents_updated_at BEFORE UPDATE ON public.technician_documents
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

-- 7. Payment details (never public)
CREATE TABLE IF NOT EXISTS public.technician_payment_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL UNIQUE REFERENCES public.technicians(id) ON DELETE CASCADE,
  account_holder_name text,
  account_number text,
  ifsc text,
  upi_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_payment_details TO authenticated;
GRANT ALL ON public.technician_payment_details TO service_role;
ALTER TABLE public.technician_payment_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Technicians manage their own payment details" ON public.technician_payment_details
  FOR ALL TO authenticated USING (technician_id = private.current_technician_id()) WITH CHECK (technician_id = private.current_technician_id());
CREATE POLICY "Admins manage all payment details" ON public.technician_payment_details
  FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER update_technician_payment_details_updated_at BEFORE UPDATE ON public.technician_payment_details
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

-- 8. Extend service areas
ALTER TABLE public.technician_service_areas
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS locality text,
  ADD COLUMN IF NOT EXISTS radius_km integer,
  ADD COLUMN IF NOT EXISTS pan_india boolean NOT NULL DEFAULT false;

-- 9. Custom catalog requests
CREATE TABLE IF NOT EXISTS public.custom_catalog_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  technician_id uuid REFERENCES public.technicians(id) ON DELETE SET NULL,
  kind text NOT NULL,
  name text NOT NULL,
  segment text,
  category text,
  brand text,
  model_number text,
  description text,
  photo_path text,
  status text NOT NULL DEFAULT 'pending_admin_review',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_catalog_requests TO authenticated;
GRANT ALL ON public.custom_catalog_requests TO service_role;
ALTER TABLE public.custom_catalog_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own catalog requests" ON public.custom_catalog_requests
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage all catalog requests" ON public.custom_catalog_requests
  FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER update_custom_catalog_requests_updated_at BEFORE UPDATE ON public.custom_catalog_requests
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();