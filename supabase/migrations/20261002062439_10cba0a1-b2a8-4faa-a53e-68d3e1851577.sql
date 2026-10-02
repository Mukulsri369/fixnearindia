CREATE OR REPLACE FUNCTION private.can_post_request_message(_request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.repair_requests r
    WHERE r.id = _request_id
      AND r.customer_id = auth.uid()
  ) OR EXISTS (
    SELECT 1
    FROM public.request_assignments ra
    WHERE ra.repair_request_id = _request_id
      AND ra.technician_id = private.current_technician_id()
  ) OR private.has_role(auth.uid(), 'admin'::public.app_role)
$$;

REVOKE ALL ON FUNCTION private.can_post_request_message(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.can_post_request_message(uuid) TO authenticated;

DROP POLICY IF EXISTS "Thread participants can post messages" ON public.request_messages;
CREATE POLICY "Thread participants can post messages"
  ON public.request_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND private.can_post_request_message(repair_request_id)
  );