
-- Public marketing projects
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming | ready | ongoing
  cover_url TEXT,
  video_url TEXT,
  short_description TEXT,
  description TEXT,
  price_min NUMERIC,
  price_max NUMERIC,
  plots_count INTEGER,
  unit_type TEXT DEFAULT 'flat', -- flat | plot
  size_min NUMERIC,
  size_max NUMERIC,
  amenities JSONB DEFAULT '[]'::jsonb,
  floor_plan_url TEXT,
  brochure_url TEXT,
  map_embed TEXT,
  handover_date DATE,
  down_payment NUMERIC,
  monthly_installment NUMERIC,
  installment_months INTEGER,
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Admins insert projects" ON public.projects FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update projects" ON public.projects FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete projects" ON public.projects FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Media gallery (images + youtube)
CREATE TABLE public.project_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL DEFAULT 'image', -- image | youtube
  url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view project media" ON public.project_media FOR SELECT USING (true);
CREATE POLICY "Admins insert media" ON public.project_media FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update media" ON public.project_media FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete media" ON public.project_media FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Inquiries per project
CREATE TABLE public.project_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit inquiries" ON public.project_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view inquiries" ON public.project_inquiries FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update inquiries" ON public.project_inquiries FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete inquiries" ON public.project_inquiries FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Contact messages from landing page
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view contact" ON public.contact_messages FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update contact" ON public.contact_messages FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete contact" ON public.contact_messages FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_project_media_project ON public.project_media(project_id);
