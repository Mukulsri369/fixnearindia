ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS gst_number text;

CREATE POLICY "Technicians can read their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'technician-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Technicians can upload their own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'technician-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can read technician documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'technician-docs' AND private.has_role(auth.uid(), 'admin'::app_role));