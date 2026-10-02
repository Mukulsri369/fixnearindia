CREATE TABLE public.amc_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL DEFAULT auth.uid(),
  asset_id uuid NOT NULL REFERENCES public.customer_assets(id) ON DELETE RESTRICT,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  requested_days integer NOT NULL CHECK (requested_days IN (30, 90, 180, 365)),
  service_notes text NOT NULL CHECK (char_length(service_notes) BETWEEN 10 AND 2000),
  address text,
  state text,
  city text NOT NULL,
  pincode text NOT NULL,
  invited_technician_id uuid REFERENCES public.technicians(id) ON DELETE SET NULL,
  source_repair_request_id uuid REFERENCES public.repair_requests(id) ON DELETE SET NULL,
  selected_offer_id uuid,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'selected', 'active', 'cancelled', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.amc_requests TO authenticated;
GRANT ALL ON public.amc_requests TO service_role;
ALTER TABLE public.amc_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.amc_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amc_request_id uuid NOT NULL REFERENCES public.amc_requests(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  coverage_details text NOT NULL CHECK (char_length(coverage_details) BETWEEN 10 AND 2000),
  terms text,
  status text NOT NULL DEFAULT 'offered' CHECK (status IN ('offered', 'selected', 'rejected', 'paid')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (amc_request_id, technician_id)
);
GRANT SELECT, INSERT ON public.amc_offers TO authenticated;
GRANT ALL ON public.amc_offers TO service_role;
ALTER TABLE public.amc_offers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.amc_requests
  ADD CONSTRAINT amc_requests_selected_offer_fkey
  FOREIGN KEY (selected_offer_id) REFERENCES public.amc_offers(id) ON DELETE SET NULL;

CREATE TABLE public.amc_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amc_request_id uuid NOT NULL REFERENCES public.amc_requests(id) ON DELETE CASCADE,
  technician_id uuid REFERENCES public.technicians(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('customer', 'technician')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.amc_messages TO authenticated;
GRANT ALL ON public.amc_messages TO service_role;
ALTER TABLE public.amc_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.amc_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amc_request_id uuid NOT NULL UNIQUE REFERENCES public.amc_requests(id) ON DELETE RESTRICT,
  offer_id uuid NOT NULL UNIQUE REFERENCES public.amc_offers(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL,
  asset_id uuid NOT NULL REFERENCES public.customer_assets(id) ON DELETE RESTRICT,
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE RESTRICT,
  duration_days integer NOT NULL CHECK (duration_days IN (30, 90, 180, 365)),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  response_sla_hours integer NOT NULL DEFAULT 6 CHECK (response_sla_hours = 6),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  paid_at timestamptz NOT NULL,
  reminder_7d_sent_at timestamptz,
  expiry_notice_sent_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
GRANT SELECT ON public.amc_contracts TO authenticated;
GRANT ALL ON public.amc_contracts TO service_role;
ALTER TABLE public.amc_contracts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.repair_requests
  ADD COLUMN amc_contract_id uuid REFERENCES public.amc_contracts(id) ON DELETE SET NULL,
  ADD COLUMN response_due_at timestamptz;

CREATE UNIQUE INDEX amc_contracts_one_active_asset_idx
  ON public.amc_contracts(asset_id) WHERE status = 'active';
CREATE UNIQUE INDEX amc_requests_one_pending_asset_idx
  ON public.amc_requests(asset_id) WHERE status IN ('open', 'selected');
CREATE INDEX amc_requests_customer_idx ON public.amc_requests(customer_id, created_at DESC);
CREATE INDEX amc_requests_category_status_idx ON public.amc_requests(category_id, status, created_at DESC);
CREATE INDEX amc_offers_request_idx ON public.amc_offers(amc_request_id, created_at);
CREATE INDEX amc_messages_request_idx ON public.amc_messages(amc_request_id, created_at);
CREATE INDEX amc_contracts_technician_idx ON public.amc_contracts(technician_id, status, ends_at);
CREATE INDEX amc_contracts_customer_idx ON public.amc_contracts(customer_id, status, ends_at);
CREATE INDEX repair_requests_amc_idx ON public.repair_requests(amc_contract_id, created_at DESC);

CREATE OR REPLACE FUNCTION private.can_view_amc_request(_request_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.amc_requests ar
    WHERE ar.id = _request_id AND ar.customer_id = auth.uid()
  ) OR EXISTS (
    SELECT 1
    FROM public.amc_requests ar
    JOIN public.technicians t ON t.id = private.current_technician_id()
    JOIN public.technician_categories tc ON tc.technician_id = t.id AND tc.category_id = ar.category_id
    WHERE ar.id = _request_id
      AND t.is_approved = true
      AND (
        (ar.status = 'open' AND ar.invited_technician_id IS NULL)
        OR ar.invited_technician_id = t.id
        OR EXISTS (SELECT 1 FROM public.amc_offers ao WHERE ao.amc_request_id = ar.id AND ao.technician_id = t.id)
        OR EXISTS (SELECT 1 FROM public.amc_contracts ac WHERE ac.amc_request_id = ar.id AND ac.technician_id = t.id)
      )
  ) OR private.has_role(auth.uid(), 'admin'::public.app_role)
$$;
REVOKE ALL ON FUNCTION private.can_view_amc_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.can_view_amc_request(uuid) TO authenticated;

CREATE POLICY "Customers can read their AMC requests"
ON public.amc_requests FOR SELECT TO authenticated
USING (customer_id = auth.uid() OR private.can_view_amc_request(id));
CREATE POLICY "Customers can create AMC requests"
ON public.amc_requests FOR INSERT TO authenticated
WITH CHECK (
  customer_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.customer_assets ca WHERE ca.id = asset_id AND ca.customer_id = auth.uid())
  AND (
    invited_technician_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.request_assignments ra
      JOIN public.repair_requests rr ON rr.id = ra.repair_request_id
      WHERE rr.id = source_repair_request_id
        AND rr.customer_id = auth.uid()
        AND rr.asset_id = asset_id
        AND ra.technician_id = invited_technician_id
        AND ra.status = 'completed'
    )
  )
);

CREATE POLICY "Participants can read AMC offers"
ON public.amc_offers FOR SELECT TO authenticated
USING (private.can_view_amc_request(amc_request_id));
CREATE POLICY "Approved technicians can create AMC offers"
ON public.amc_offers FOR INSERT TO authenticated
WITH CHECK (
  technician_id = private.current_technician_id()
  AND EXISTS (
    SELECT 1 FROM public.amc_requests ar
    JOIN public.technicians t ON t.id = technician_id
    JOIN public.technician_categories tc ON tc.technician_id = t.id AND tc.category_id = ar.category_id
    WHERE ar.id = amc_request_id
      AND ar.status = 'open'
      AND t.is_approved = true
      AND (ar.invited_technician_id IS NULL OR ar.invited_technician_id = technician_id)
  )
);

CREATE POLICY "AMC participants can read messages"
ON public.amc_messages FOR SELECT TO authenticated
USING (private.can_view_amc_request(amc_request_id));
CREATE POLICY "AMC participants can post messages"
ON public.amc_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND private.can_view_amc_request(amc_request_id)
  AND (
    EXISTS (SELECT 1 FROM public.amc_requests ar WHERE ar.id = amc_request_id AND ar.customer_id = auth.uid() AND sender_role = 'customer')
    OR (technician_id = private.current_technician_id() AND sender_role = 'technician'
      AND EXISTS (SELECT 1 FROM public.amc_offers ao WHERE ao.amc_request_id = amc_messages.amc_request_id AND ao.technician_id = private.current_technician_id()))
  )
);

CREATE POLICY "AMC participants can read contracts"
ON public.amc_contracts FOR SELECT TO authenticated
USING (customer_id = auth.uid() OR technician_id = private.current_technician_id() OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_amc_requests_updated_at BEFORE UPDATE ON public.amc_requests
FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();
CREATE TRIGGER update_amc_offers_updated_at BEFORE UPDATE ON public.amc_offers
FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();
CREATE TRIGGER update_amc_contracts_updated_at BEFORE UPDATE ON public.amc_contracts
FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE OR REPLACE FUNCTION private.process_amc_expiry_and_reminders()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
BEGIN
  INSERT INTO public.notifications(user_id, type, title, body, data)
  SELECT ac.customer_id, 'amc_expiring', 'AMC expires soon',
         'Your AMC has 7 days or less remaining. Reactivate it to keep direct technician coverage.',
         jsonb_build_object('contract_id', ac.id, 'asset_id', ac.asset_id)
  FROM public.amc_contracts ac
  WHERE ac.status = 'active'
    AND ac.ends_at > now()
    AND ac.ends_at <= now() + interval '7 days'
    AND ac.reminder_7d_sent_at IS NULL;

  UPDATE public.amc_contracts
  SET reminder_7d_sent_at = now()
  WHERE status = 'active'
    AND ends_at > now()
    AND ends_at <= now() + interval '7 days'
    AND reminder_7d_sent_at IS NULL;

  INSERT INTO public.notifications(user_id, type, title, body, data)
  SELECT ac.customer_id, 'amc_expired', 'AMC expired',
         'Your AMC has ended. New repair requests will be shared with matching technicians until you reactivate it.',
         jsonb_build_object('contract_id', ac.id, 'asset_id', ac.asset_id)
  FROM public.amc_contracts ac
  WHERE ac.status = 'active' AND ac.ends_at <= now() AND ac.expiry_notice_sent_at IS NULL;

  UPDATE public.amc_contracts
  SET status = 'expired', expiry_notice_sent_at = now()
  WHERE status = 'active' AND ends_at <= now();

  UPDATE public.amc_requests ar
  SET status = 'expired'
  FROM public.amc_contracts ac
  WHERE ac.amc_request_id = ar.id AND ac.status = 'expired' AND ar.status = 'active';
END;
$$;
REVOKE ALL ON FUNCTION private.process_amc_expiry_and_reminders() FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-amc-expiry-reminders') THEN
      PERFORM cron.schedule('process-amc-expiry-reminders', '15 0 * * *', 'SELECT private.process_amc_expiry_and_reminders()');
    END IF;
  END IF;
END;
$$;