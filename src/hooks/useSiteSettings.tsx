import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SystemSettings {
  banner_title: string;
  banner_subtitle: string;
  banner_image_url: string;
  primary_color: string;
  accent_color: string;
  theme: string;
  header_style: string;
  show_stats: boolean;
  show_featured: boolean;
  show_contact: boolean;
}

export interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  tax_id: string;
  logo_url: string | null;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
  telegram: string;
  youtube: string;
}

const DEFAULT_SYSTEM: SystemSettings = {
  banner_title: "",
  banner_subtitle: "",
  banner_image_url: "",
  primary_color: "#c9a55a",
  accent_color: "#1a1a2e",
  theme: "dark",
  header_style: "default",
  show_stats: true,
  show_featured: true,
  show_contact: true,
};

const DEFAULT_COMPANY: CompanySettings = {
  name: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  tax_id: "",
  logo_url: null,
};

const DEFAULT_SOCIAL: SocialLinks = {
  facebook: "",
  instagram: "",
  tiktok: "",
  whatsapp: "",
  telegram: "",
  youtube: "",
};

export const useSiteSettings = () => {
  const [system, setSystem] = useState<SystemSettings>(DEFAULT_SYSTEM);
  const [company, setCompany] = useState<CompanySettings>(DEFAULT_COMPANY);
  const [social, setSocial] = useState<SocialLinks>(DEFAULT_SOCIAL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("site_settings").select("setting_key, setting_value");
      if (data) {
        data.forEach((r: any) => {
          if (r.setting_key === "system") setSystem({ ...DEFAULT_SYSTEM, ...r.setting_value });
          if (r.setting_key === "company_info") setCompany({ ...DEFAULT_COMPANY, ...r.setting_value });
          if (r.setting_key === "social_links") setSocial({ ...DEFAULT_SOCIAL, ...r.setting_value });
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { system, company, social, loading };
};
