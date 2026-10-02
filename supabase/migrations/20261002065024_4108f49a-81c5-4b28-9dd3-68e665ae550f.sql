CREATE TABLE public.customer_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  category_id uuid NOT NULL REFERENCES public.categories(id),
  brand text,
  model text,
  serial_number text,
  purchase_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_assets TO authenticated;
GRANT ALL ON public.customer_assets TO service_role;

ALTER TABLE public.customer_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own assets"
ON public.customer_assets FOR SELECT TO authenticated
USING (customer_id = auth.uid());

CREATE POLICY "Customers can add their own assets"
ON public.customer_assets FOR INSERT TO authenticated
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update their own assets"
ON public.customer_assets FOR UPDATE TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can remove their own assets"
ON public.customer_assets FOR DELETE TO authenticated
USING (customer_id = auth.uid());

CREATE TRIGGER update_customer_assets_updated_at
BEFORE UPDATE ON public.customer_assets
FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

ALTER TABLE public.repair_requests
ADD COLUMN asset_id uuid REFERENCES public.customer_assets(id) ON DELETE RESTRICT;

CREATE INDEX customer_assets_customer_id_idx ON public.customer_assets(customer_id);
CREATE INDEX repair_requests_asset_id_idx ON public.repair_requests(asset_id);