
-- Create storage bucket for customer documents
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-documents', 'customer-documents', true);

-- RLS policies for the bucket
CREATE POLICY "Admins can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'customer-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update documents" ON storage.objects FOR UPDATE USING (bucket_id = 'customer-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete documents" ON storage.objects FOR DELETE USING (bucket_id = 'customer-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'customer-documents');
