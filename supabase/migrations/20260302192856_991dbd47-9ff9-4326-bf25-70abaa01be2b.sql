
-- Create a storage bucket for payment images
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-images', 'payment-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload payment images
CREATE POLICY "Admins upload payment images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow admins to update payment images
CREATE POLICY "Admins update payment images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'payment-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow admins to delete payment images
CREATE POLICY "Admins delete payment images"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow public read access to payment images
CREATE POLICY "Public read payment images"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-images');
