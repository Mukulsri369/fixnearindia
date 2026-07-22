CREATE TYPE public.app_role AS ENUM ('admin', 'customer', 'technician');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  business_name text,
  experience_years integer DEFAULT 0,
  address text,
  state text,
  district text,
  city text,
  pincode text,
  lat numeric(10,8),
  lng numeric(11,8),
  service_radius_km integer DEFAULT 10,
  profile_photo_url text,
  aadhaar_url text,
  pan_url text,
  shop_photo_url text,
  visiting_card_url text,
  is_approved boolean DEFAULT false,
  is_available boolean DEFAULT true,
  avg_rating numeric(2,1) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.technicians TO authenticated;
GRANT ALL ON public.technicians TO service_role;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.technician_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid REFERENCES public.technicians(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (technician_id, category_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_categories TO authenticated;
GRANT ALL ON public.technician_categories TO service_role;
ALTER TABLE public.technician_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.technician_service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid REFERENCES public.technicians(id) ON DELETE CASCADE NOT NULL,
  city text NOT NULL,
  state text NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_service_areas TO authenticated;
GRANT ALL ON public.technician_service_areas TO service_role;
ALTER TABLE public.technician_service_areas ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.repair_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  brand text,
  model text,
  issue_description text NOT NULL,
  priority text DEFAULT 'normal',
  preferred_visit_time timestamptz,
  status text DEFAULT 'open',
  address text,
  state text,
  city text,
  pincode text,
  lat numeric(10,8),
  lng numeric(11,8),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_requests TO authenticated;
GRANT ALL ON public.repair_requests TO service_role;
ALTER TABLE public.repair_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.repair_request_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_request_id uuid REFERENCES public.repair_requests(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  sort_order integer DEFAULT 0
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_request_images TO authenticated;
GRANT ALL ON public.repair_request_images TO service_role;
ALTER TABLE public.repair_request_images ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.request_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_request_id uuid REFERENCES public.repair_requests(id) ON DELETE CASCADE NOT NULL,
  technician_id uuid REFERENCES public.technicians(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending',
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (repair_request_id, technician_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_assignments TO authenticated;
GRANT ALL ON public.request_assignments TO service_role;
ALTER TABLE public.request_assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.request_assignments(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text,
  title text NOT NULL,
  body text,
  read boolean DEFAULT false,
  data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE POLICY "Users can manage their own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Categories are public"
ON public.categories
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Authenticated users can read categories"
ON public.categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage categories"
ON public.categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can manage their own technician profile"
ON public.technicians
FOR ALL
TO authenticated
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all technicians"
ON public.technicians
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read approved technicians"
ON public.technicians
FOR SELECT
TO anon
USING (is_approved = true);

CREATE POLICY "Authenticated users can read approved technicians"
ON public.technicians
FOR SELECT
TO authenticated
USING (is_approved = true);

CREATE POLICY "Users can manage their own technician categories"
ON public.technician_categories
FOR ALL
TO authenticated
USING (technician_id IN (SELECT id FROM public.technicians WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())))
WITH CHECK (technician_id IN (SELECT id FROM public.technicians WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

CREATE POLICY "Admins can manage all technician categories"
ON public.technician_categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage their own service areas"
ON public.technician_service_areas
FOR ALL
TO authenticated
USING (technician_id IN (SELECT id FROM public.technicians WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())))
WITH CHECK (technician_id IN (SELECT id FROM public.technicians WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

CREATE POLICY "Admins can manage all service areas"
ON public.technician_service_areas
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers can manage their own repair requests"
ON public.repair_requests
FOR ALL
TO authenticated
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can manage all repair requests"
ON public.repair_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers can manage their own repair request images"
ON public.repair_request_images
FOR ALL
TO authenticated
USING (repair_request_id IN (SELECT id FROM public.repair_requests WHERE customer_id = auth.uid()))
WITH CHECK (repair_request_id IN (SELECT id FROM public.repair_requests WHERE customer_id = auth.uid()));

CREATE POLICY "Admins can manage all repair request images"
ON public.repair_request_images
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can read their own assignments"
ON public.request_assignments
FOR SELECT
TO authenticated
USING (technician_id IN (SELECT id FROM public.technicians WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

CREATE POLICY "Customers can read assignments for their requests"
ON public.request_assignments
FOR SELECT
TO authenticated
USING (repair_request_id IN (SELECT id FROM public.repair_requests WHERE customer_id = auth.uid()));

CREATE POLICY "Admins can manage all assignments"
ON public.request_assignments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read their own reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid());

CREATE POLICY "Admins can manage all reviews"
ON public.reviews
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage their own notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_technicians_updated_at
BEFORE UPDATE ON public.technicians
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repair_requests_updated_at
BEFORE UPDATE ON public.repair_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_request_assignments_updated_at
BEFORE UPDATE ON public.request_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.categories (name, slug, icon, description) VALUES
('Laptop', 'laptop', 'laptop', 'Laptop repair and servicing'),
('Desktop', 'desktop', 'desktop', 'Desktop computer repair'),
('UPS', 'ups', 'battery', 'UPS battery and inverter repair'),
('Inverter', 'inverter', 'zap', 'Home and commercial inverter repair'),
('Servo Stabilizer', 'servo-stabilizer', 'activity', 'Voltage stabilizer repair'),
('Washing Machine', 'washing-machine', 'droplet', 'Washing machine repair'),
('Refrigerator', 'refrigerator', 'snowflake', 'Fridge and freezer repair'),
('AC', 'ac', 'wind', 'Air conditioner repair and service'),
('Printer', 'printer', 'printer', 'Printer repair and maintenance'),
('CCTV', 'cctv', 'video', 'CCTV camera installation and repair'),
('Solar', 'solar', 'sun', 'Solar panel and inverter repair'),
('Industrial Electronics', 'industrial-electronics', 'factory', 'Industrial electronic equipment repair'),
('PLC', 'plc', 'cpu', 'PLC programming and repair'),
('Medical Equipment', 'medical-equipment', 'heart-pulse', 'Medical equipment repair'),
('Others', 'others', 'wrench', 'Other electronic repair services')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email IN ('admin@fixnear.in')
ON CONFLICT (user_id, role) DO NOTHING;