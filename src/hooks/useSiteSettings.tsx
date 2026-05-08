import { useEffect, useState } from "react";
import { backend } from "@/lib/backendClient";

export interface SystemSettings {
  banner_title: string;
  banner_subtitle: string;
  banner_image_url: string;
  /** Managed hero carousel image URLs (empty = use defaults on frontend) */
  hero_slide_urls?: string[];
  primary_color: string;
  accent_color: string;
  theme: string;
  header_style: string;
  show_stats: boolean;
  show_featured: boolean;
  show_contact: boolean;
  meta_title?: string;
  meta_description?: string;
  favicon_url?: string;
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
  linkedin: string;
  tiktok: string;
  whatsapp: string;
  telegram: string;
  youtube: string;
}

export interface PlatformConfig {
  link: string;
  group_link: string;
  qr_code_url: string;
  phone: string;
}

export interface ComingSoonProject {
  title: string;
  location: string;
  type: string;
  units: string;
  eta: string;
  image_url?: string;
  video_url?: string;
}

export interface WhyUsReason {
  title: string;
  desc: string;
  iconName: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface FooterContent {
  description: string;
  copyright: string;
  quick_links: string;
}

export type SocialPlatforms = Record<string, PlatformConfig>;

export interface HeaderConfig {
  nav_items: { id: string; label: string; href: string; visible: boolean }[];
  bg_color_scrolled: string;
  bg_color_initial: string;
  bg_opacity: number;
  logo_size: string;
  show_social_bar: boolean;
  social_bar_bg: string;
  social_bar_text: string;
  header_style: string;
  sticky: boolean;
  nav_font_color: string;
  slogan: string;
  slogan_color: string;
}

const DEFAULT_HEADER: HeaderConfig = {
  nav_items: [
    { id: "1", label: "Home", href: "/", visible: true },
    { id: "2", label: "Properties", href: "/#properties", visible: true },
    { id: "3", label: "About", href: "/about", visible: true },
    { id: "4", label: "Contact", href: "/#contact", visible: true },
  ],
  bg_color_scrolled: "#1a1a2e",
  bg_color_initial: "transparent",
  bg_opacity: 80,
  logo_size: "default",
  show_social_bar: true,
  social_bar_bg: "#1a1a2e",
  social_bar_text: "Welcome to Starline Builder's Ltd.",
  header_style: "default",
  sticky: true,
  nav_font_color: "#ffffff",
  slogan: "",
  slogan_color: "#c9a55a",
};

const DEFAULT_SYSTEM: SystemSettings = {
  banner_title: "",
  banner_subtitle: "",
  banner_image_url: "",
  hero_slide_urls: [],
  primary_color: "#c9a55a",
  accent_color: "#1a1a2e",
  theme: "dark",
  header_style: "default",
  show_stats: true,
  show_featured: true,
  show_contact: true,
  meta_title: "",
  meta_description: "",
  favicon_url: "",
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
  instagram: "https://www.instagram.com/sales.starlinebd/",
  linkedin: "https://www.linkedin.com/company/starline-builders-ltd-bd",
  tiktok: "",
  whatsapp: "",
  telegram: "",
  youtube: "https://www.youtube.com/@StarlineBuildersLTD",
};

export const useSiteSettings = () => {
  const [system, setSystem] = useState<SystemSettings>(DEFAULT_SYSTEM);
  const [company, setCompany] = useState<CompanySettings>(DEFAULT_COMPANY);
  const [social, setSocial] = useState<SocialLinks>(DEFAULT_SOCIAL);
  const [socialPlatforms, setSocialPlatforms] = useState<SocialPlatforms>({});
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(DEFAULT_HEADER);
  const [comingSoon, setComingSoon] = useState<ComingSoonProject[]>([]);
  const [whyUsReasons, setWhyUsReasons] = useState<WhyUsReason[]>([]);
  const [statsItems, setStatsItems] = useState<StatItem[]>([]);
  const [footerContent, setFooterContent] = useState<FooterContent>({ description: "", copyright: "", quick_links: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await backend.from("site_settings").select("setting_key, setting_value");
      if (data) {
        data.forEach((r: any) => {
          if (r.setting_key === "system") setSystem({ ...DEFAULT_SYSTEM, ...r.setting_value });
          if (r.setting_key === "company_info") setCompany({ ...DEFAULT_COMPANY, ...r.setting_value });
          if (r.setting_key === "social_links") setSocial({ ...DEFAULT_SOCIAL, ...r.setting_value });
          if (r.setting_key === "social_platforms") setSocialPlatforms(r.setting_value || {});
          if (r.setting_key === "header_config") setHeaderConfig({ ...DEFAULT_HEADER, ...r.setting_value });
          if (r.setting_key === "coming_soon") setComingSoon(r.setting_value?.items || []);
          if (r.setting_key === "why_us_reasons") setWhyUsReasons(r.setting_value?.items || []);
          if (r.setting_key === "stats_items") setStatsItems(r.setting_value?.items || []);
          if (r.setting_key === "footer_content") setFooterContent(r.setting_value || { description: "", copyright: "", quick_links: "" });
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { system, company, social, socialPlatforms, headerConfig, comingSoon, whyUsReasons, statsItems, footerContent, loading };
};
