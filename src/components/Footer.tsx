import { MapPin, Mail, Phone, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { CompanySettings, SocialLinks, FooterContent } from "@/hooks/useSiteSettings";

const socialLabels: { key: keyof SocialLinks; label: string }[] = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "telegram", label: "Telegram" },
  { key: "youtube", label: "YouTube" },
];

interface Props {
  company?: CompanySettings;
  social?: SocialLinks;
  content?: FooterContent;
}

const Footer = ({ company, social, content }: Props) => {
  const brandName = company?.name || "Starline Builder's";
  const activeSocials = socialLabels.filter((s) => social?.[s.key]);
  const description = content?.description || "Premium construction and real estate services delivering extraordinary properties. Building trust, quality, and lifelong relationships since 2010.";
  const copyright = content?.copyright || `© 2026 ${brandName} All rights reserved.`;
  const quickLinks = content?.quick_links
    ? content.quick_links.split(",").map((l) => l.trim()).filter(Boolean)
    : ["Properties", "About Us", "Ongoing Projects", "Upcoming Projects", "Handover Projects"];

  return (
    <footer id="contact" className="bg-navy">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-heading text-2xl font-bold text-white mb-4">
              {brandName.includes("Ltd") ? (
                <>{brandName.split("Ltd")[0]}<span className="text-gold">Ltd{brandName.split("Ltd")[1] || "."}</span></>
              ) : (
                <>{brandName}<span className="text-gold">.</span></>
              )}
            </h3>
            <p className="text-white/45 max-w-md text-sm leading-relaxed mb-6">{description}</p>
            {activeSocials.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {activeSocials.map((s) => (
                  <a key={s.key} href={social?.[s.key] || "#"} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-gold text-xs border border-white/10 rounded-lg px-3 py-2 hover:border-gold/30 transition-all flex items-center gap-1">
                    {s.label} <ArrowUpRight size={12} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gold text-sm font-semibold uppercase tracking-wider mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((label) => {
                let href = "#";
                if (label.toLowerCase().includes("property")) href = "/#properties";
                if (label.toLowerCase().includes("about")) href = "/about";
                if (label.toLowerCase().includes("ongoing")) href = "/projects/ongoing";
                if (label.toLowerCase().includes("upcoming")) href = "/projects/upcoming";
                if (label.toLowerCase().includes("handover")) href = "/projects/handover";
                if (label.toLowerCase().includes("contact")) href = "/#contact";

                return (
                  <li key={label}>
                    <Link to={href} className="text-white/40 hover:text-white text-sm transition-colors">
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gold text-sm font-semibold uppercase tracking-wider mb-5">Contact Us</h4>
            <ul className="space-y-3 text-white/40 text-sm">
              <li className="flex items-start gap-2"><Mail size={14} className="text-gold shrink-0 mt-0.5" /> {company?.email || "info@starlinebuilders.com"}</li>
              <li className="flex items-start gap-2"><Phone size={14} className="text-gold shrink-0 mt-0.5" /> {company?.phone || "+1 (555) 123-4567"}</li>
              <li className="flex items-start gap-2"><MapPin size={14} className="text-gold shrink-0 mt-0.5" /> {company?.address || "100 Park Avenue, New York"}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-xs">{copyright}</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-white/25 hover:text-white/50 text-xs transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-white/25 hover:text-white/50 text-xs transition-colors">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
