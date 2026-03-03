
-- Investments table (e.g. "Capital Amount Investment")
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  total_capital NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view investments" ON public.investments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert investments" ON public.investments FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update investments" ON public.investments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete investments" ON public.investments FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Investors table
CREATE TABLE public.investors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view investors" ON public.investors FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert investors" ON public.investors FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update investors" ON public.investors FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete investors" ON public.investors FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Investment shares (investor ownership per investment)
CREATE TABLE public.investment_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  share_percent NUMERIC NOT NULL DEFAULT 0,
  capital_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(investment_id, investor_id)
);
ALTER TABLE public.investment_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view shares" ON public.investment_shares FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert shares" ON public.investment_shares FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update shares" ON public.investment_shares FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete shares" ON public.investment_shares FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Investment categories (e.g. Medicine, Service Cost, Rental payment)
CREATE TABLE public.investment_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investment_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view categories" ON public.investment_categories FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert categories" ON public.investment_categories FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update categories" ON public.investment_categories FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete categories" ON public.investment_categories FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Contributions (payment records)
CREATE TABLE public.contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.investment_categories(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  slip_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view contributions" ON public.contributions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert contributions" ON public.contributions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update contributions" ON public.contributions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete contributions" ON public.contributions FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON public.contributions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
