
-- ============ helper functions (private schema) ============
CREATE OR REPLACE FUNCTION private.current_technician_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  SELECT t.id FROM public.technicians t
  JOIN public.profiles p ON p.id = t.profile_id
  WHERE p.user_id = auth.uid()
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION private.current_technician_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_technician_id() TO authenticated;

CREATE OR REPLACE FUNCTION private.technician_can_view_request(_request_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.request_assignments ra
    WHERE ra.repair_request_id = _request_id
      AND ra.technician_id = private.current_technician_id()
  ) OR EXISTS (
    SELECT 1
    FROM public.repair_requests r
    JOIN public.technicians t ON t.id = private.current_technician_id()
    JOIN public.technician_categories tc
      ON tc.technician_id = t.id AND tc.category_id = r.category_id
    WHERE r.id = _request_id
      AND t.is_approved = true
      AND r.status = 'open'
  )
$$;
REVOKE ALL ON FUNCTION private.technician_can_view_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.technician_can_view_request(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.can_access_request_thread(_request_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.repair_requests r
    WHERE r.id = _request_id AND r.customer_id = auth.uid()
  ) OR private.technician_can_view_request(_request_id)
     OR private.has_role(auth.uid(), 'admin'::public.app_role)
$$;
REVOKE ALL ON FUNCTION private.can_access_request_thread(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.can_access_request_thread(uuid) TO authenticated;

-- ============ repair details on assignments ============
ALTER TABLE public.request_assignments
  ADD COLUMN IF NOT EXISTS repair_notes text,
  ADD COLUMN IF NOT EXISTS parts_replaced text,
  ADD COLUMN IF NOT EXISTS amount numeric(10,2);

-- technicians can view open requests in their categories / their own jobs
DROP POLICY IF EXISTS "Technicians can read matching or assigned requests" ON public.repair_requests;
CREATE POLICY "Technicians can read matching or assigned requests"
  ON public.repair_requests FOR SELECT TO authenticated
  USING (private.technician_can_view_request(id));

-- technicians can express interest and update their own rows
DROP POLICY IF EXISTS "Technicians can create their own assignments" ON public.request_assignments;
CREATE POLICY "Technicians can create their own assignments"
  ON public.request_assignments FOR INSERT TO authenticated
  WITH CHECK (technician_id = private.current_technician_id());

DROP POLICY IF EXISTS "Technicians can update their own assignments" ON public.request_assignments;
CREATE POLICY "Technicians can update their own assignments"
  ON public.request_assignments FOR UPDATE TO authenticated
  USING (technician_id = private.current_technician_id())
  WITH CHECK (technician_id = private.current_technician_id());

-- customers can create/update assignments on their own requests (select a technician)
DROP POLICY IF EXISTS "Customers can manage assignments on their requests" ON public.request_assignments;
CREATE POLICY "Customers can manage assignments on their requests"
  ON public.request_assignments FOR UPDATE TO authenticated
  USING (repair_request_id IN (SELECT id FROM public.repair_requests WHERE customer_id = auth.uid()))
  WITH CHECK (repair_request_id IN (SELECT id FROM public.repair_requests WHERE customer_id = auth.uid()));

-- technicians need the customer's contact profile on assigned jobs
DROP POLICY IF EXISTS "Technicians can read customer profiles for their jobs" ON public.profiles;
CREATE POLICY "Technicians can read customer profiles for their jobs"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT r.customer_id FROM public.repair_requests r
      JOIN public.request_assignments ra ON ra.repair_request_id = r.id
      WHERE ra.technician_id = private.current_technician_id()
    )
  );

-- ============ request messages (chat / comments) ============
CREATE TABLE IF NOT EXISTS public.request_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_request_id uuid NOT NULL REFERENCES public.repair_requests(id) ON DELETE CASCADE,
  technician_id uuid REFERENCES public.technicians(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'customer',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.request_messages TO authenticated;
GRANT ALL ON public.request_messages TO service_role;
ALTER TABLE public.request_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Thread participants can read messages" ON public.request_messages;
CREATE POLICY "Thread participants can read messages"
  ON public.request_messages FOR SELECT TO authenticated
  USING (private.can_access_request_thread(repair_request_id));

DROP POLICY IF EXISTS "Thread participants can post messages" ON public.request_messages;
CREATE POLICY "Thread participants can post messages"
  ON public.request_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND private.can_access_request_thread(repair_request_id));

CREATE INDEX IF NOT EXISTS request_messages_request_idx
  ON public.request_messages (repair_request_id, created_at);

-- ============ invoices ============
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL UNIQUE REFERENCES public.request_assignments(id) ON DELETE CASCADE,
  repair_request_id uuid NOT NULL REFERENCES public.repair_requests(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL,
  repair_notes text,
  parts_replaced text,
  status text NOT NULL DEFAULT 'issued',
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can read their invoices" ON public.invoices;
CREATE POLICY "Customers can read their invoices"
  ON public.invoices FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR technician_id = private.current_technician_id());

DROP POLICY IF EXISTS "Technicians can create invoices for their jobs" ON public.invoices;
CREATE POLICY "Technicians can create invoices for their jobs"
  ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (technician_id = private.current_technician_id());

DROP POLICY IF EXISTS "Participants can update invoices" ON public.invoices;
CREATE POLICY "Participants can update invoices"
  ON public.invoices FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() OR technician_id = private.current_technician_id())
  WITH CHECK (customer_id = auth.uid() OR technician_id = private.current_technician_id());

DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
CREATE POLICY "Admins can manage invoices"
  ON public.invoices FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

-- ============ notify admins when a technician applies ============
CREATE OR REPLACE FUNCTION private.notify_admins_new_technician()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT ur.user_id,
         'technician_application',
         'New technician application',
         'A technician has applied and is waiting for your approval.',
         jsonb_build_object('technician_id', NEW.id)
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::public.app_role;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.notify_admins_new_technician() FROM PUBLIC;

DROP TRIGGER IF EXISTS notify_admins_on_technician_insert ON public.technicians;
CREATE TRIGGER notify_admins_on_technician_insert
  AFTER INSERT ON public.technicians
  FOR EACH ROW EXECUTE FUNCTION private.notify_admins_new_technician();

-- ============ designate the platform admin ============
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'mukul.srivastava.025@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
