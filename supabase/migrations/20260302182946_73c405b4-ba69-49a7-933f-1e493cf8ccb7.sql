
-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public) VALUES ('project-images', 'project-images', true);

-- Anyone can view project images (public bucket)
CREATE POLICY "Public read access for project images"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

-- Only admins can upload project images
CREATE POLICY "Admins can upload project images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update project images
CREATE POLICY "Admins can update project images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete project images
CREATE POLICY "Admins can delete project images"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all profiles (needed for customer management)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Drop the old restrictive policy and recreate if it exists
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
