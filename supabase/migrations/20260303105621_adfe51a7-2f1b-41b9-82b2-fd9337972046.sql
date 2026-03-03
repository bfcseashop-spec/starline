-- Allow authenticated users to upload their own payment slips
CREATE POLICY "Users can upload own payment slips"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view payment slip images
CREATE POLICY "Users can view payment slips"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-images'
);

-- Allow authenticated users to delete their own payment slips
CREATE POLICY "Users can delete own payment slips"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);