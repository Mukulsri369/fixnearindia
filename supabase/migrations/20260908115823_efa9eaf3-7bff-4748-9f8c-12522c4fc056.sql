CREATE TABLE public.gst_bills (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repair_request_id uuid NOT NULL REFERENCES public.repair_requests(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  bill_number text NOT NULL,
  bill_date date NOT NULL DEFAULT current_date,
  firm_name text NOT NULL,
  firm_address text,
  firm_gstin text,
  firm_phone text,
  firm_email text,
  place_of_supply text,
  customer_name text,
  customer_address text,
  customer_gstin text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  tax_mode text NOT NULL DEFAULT 'cgst_sgst',
  notes text,
  pdf_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (repair_request_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gst_bills TO authenticated;
GRANT ALL ON public.gst_bills TO service_role;

ALTER TABLE public.gst_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Technician manages own gst bills"
ON public.gst_bills FOR ALL TO authenticated
USING (technician_id = private.current_technician_id())
WITH CHECK (technician_id = private.current_technician_id());

CREATE POLICY "Customer can view gst bill for own request"
ON public.gst_bills FOR SELECT TO authenticated
USING (customer_id = auth.uid());

CREATE TRIGGER update_gst_bills_updated_at
BEFORE UPDATE ON public.gst_bills
FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE POLICY "Technician can upload own gst bill pdf"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'gst-bills'
  AND EXISTS (
    SELECT 1 FROM public.gst_bills b
    WHERE b.repair_request_id::text = (storage.foldername(name))[1]
      AND b.technician_id = private.current_technician_id()
  )
);

CREATE POLICY "Technician can update own gst bill pdf"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'gst-bills'
  AND EXISTS (
    SELECT 1 FROM public.gst_bills b
    WHERE b.repair_request_id::text = (storage.foldername(name))[1]
      AND b.technician_id = private.current_technician_id()
  )
);

CREATE POLICY "Bill parties can read gst bill pdf"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'gst-bills'
  AND EXISTS (
    SELECT 1 FROM public.gst_bills b
    WHERE b.repair_request_id::text = (storage.foldername(name))[1]
      AND (b.customer_id = auth.uid() OR b.technician_id = private.current_technician_id())
  )
);