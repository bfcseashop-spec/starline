
-- Settings key-value store
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert settings" ON public.site_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update settings" ON public.site_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete settings" ON public.site_settings FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for company assets
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true);

CREATE POLICY "Anyone can view company assets" ON storage.objects FOR SELECT USING (bucket_id = 'company-assets');
CREATE POLICY "Admins upload company assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-assets' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update company assets" ON storage.objects FOR UPDATE USING (bucket_id = 'company-assets' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete company assets" ON storage.objects FOR DELETE USING (bucket_id = 'company-assets' AND public.has_role(auth.uid(), 'admin'::app_role));
