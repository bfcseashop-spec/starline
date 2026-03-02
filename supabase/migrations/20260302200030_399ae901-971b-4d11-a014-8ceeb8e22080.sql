
CREATE POLICY "Admins update documents" ON public.documents FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
