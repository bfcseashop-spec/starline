import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const setMetaTag = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
};

const setLinkTag = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
};

const SiteMetaManager = () => {
  const { system, company } = useSiteSettings();

  useEffect(() => {
    const title = system.meta_title?.trim() || company.name?.trim() || "Starline Builder's Ltd | Luxury Real Estate";
    document.title = title;

    const description =
      system.meta_description?.trim() ||
      "Discover exceptional luxury properties in the world's most sought-after locations with Starline Builder's Ltd.";
    setMetaTag('meta[name="description"]', { name: "description", content: description });

    const iconUrl = system.favicon_url?.trim() || company.logo_url || "/favicon.png";
    setLinkTag('link[rel="icon"]', { rel: "icon", href: iconUrl });
    setLinkTag('link[rel="apple-touch-icon"]', { rel: "apple-touch-icon", href: iconUrl });

    const shareImage = company.logo_url || iconUrl || "/logo.png";
    setMetaTag('meta[property="og:title"]', { property: "og:title", content: title });
    setMetaTag('meta[property="og:description"]', { property: "og:description", content: description });
    setMetaTag('meta[property="og:image"]', { property: "og:image", content: shareImage });
    setMetaTag('meta[name="twitter:image"]', { name: "twitter:image", content: shareImage });
  }, [company.logo_url, company.name, system.favicon_url, system.meta_description, system.meta_title]);

  return null;
};

export default SiteMetaManager;
