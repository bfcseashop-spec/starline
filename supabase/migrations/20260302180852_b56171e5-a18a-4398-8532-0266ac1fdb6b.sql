
-- Create project_images table for gallery
CREATE TABLE public.project_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.customer_projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

-- Customers can view images of their own projects; admins can see all
CREATE POLICY "View project images"
ON public.project_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customer_projects cp
    WHERE cp.id = project_images.project_id
    AND (cp.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Only admins can manage images
CREATE POLICY "Admins insert images"
ON public.project_images
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update images"
ON public.project_images
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete images"
ON public.project_images
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
