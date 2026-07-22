CREATE POLICY "Authenticated users can insert repair images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'repair-images');

CREATE POLICY "Authenticated users can update repair images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'repair-images');

CREATE POLICY "Authenticated users can select repair images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'repair-images');

CREATE POLICY "Public can read repair images"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'repair-images');