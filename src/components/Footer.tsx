import { MapPin, Mail, Phone, ArrowUpRight, Facebook, Instagram, Linkedin, Music2, MessageCircle, Send, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import type { CompanySettings, SocialLinks, FooterContent } from "@/hooks/useSiteSettings";
import { useState } from "react";

const socialLabels: { key: keyof SocialLinks; label: string }[] = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "tiktok", label: "TikTok" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "telegram", label: "Telegram" },
  { key: "youtube", label: "YouTube" },
];

const socialIcons: Partial<Record<keyof SocialLinks, typeof Facebook>> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Music2,
  whatsapp: MessageCircle,
  telegram: Send,
  youtube: Youtube,
};

interface Props {
  company?: CompanySettings;
  social?: SocialLinks;
  content?: FooterContent;
}

const Footer = ({ company, social, content }: Props) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const pick = (value: string | null | undefined, fallback: string) => {
    const normalized = (value || "").trim();
    return normalized.length > 0 ? normalized : fallback;
  };
  const brandName = pick(company?.name, "Starline Builder's");
  const logoUrl = !logoFailed && (company?.logo_url || "").trim() ? (company?.logo_url as string) : "/logo-main.png";
  const activeSocials = socialLabels.filter((s) => s.key === "facebook" || social?.[s.key]);
  const description = pick(content?.description, "Premium construction and real estate services delivering extraordinary properties. Building trust, quality, and lifelong relationships since 2010.");
  const copyright = pick(content?.copyright, `© 2026 ${brandName} All rights reserved.`);
  const primaryPhone = pick(company?.phone, "+880 1334-563765");
  const website = pick(company?.website, "https://starlineb.com");
  const fallbackAddress = "3-No, Gate, Road#11, House#E43, Block#E, Level-1, B-1, Niketon, Gulshan, Dhaka-1212";
  const primaryEmail = pick(company?.email, "admin@starlineb.com");
  const quickLinks = [
    { label: "Home", to: "/" },
    { label: "Properties", to: "/properties/ongoing" },
    { label: "Upcoming", to: "/properties/upcoming" },
    { label: "Handover", to: "/properties/handover" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/#contact" },
  ];
  const serviceLinks = [
    { label: "Customer Login", to: "/auth" },
    { label: "Admin Panel", to: "/auth" },
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms & Conditions", to: "/terms" },
  ];

  return (
    <footer id="contact" className="relative overflow-hidden bg-gradient-to-b from-[#06122b] to-[#030712] border-t border-white/10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <img src={logoUrl} alt="Starline logo" onError={() => setLogoFailed(true)} className="w-auto h-12 object-contain" />
              <div>
                <p className="font-heading text-xl font-bold text-white">{brandName}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Premium Real Estate Partner</p>
              </div>
            </div>
            <p className="text-white/65 text-sm leading-relaxed max-w-md">{description}</p>
            <div className="mt-6 grid gap-3">
              <a href={`mailto:${primaryEmail}`} className="inline-flex items-center gap-2 text-white/80 hover:text-gold text-sm">
                <Mail size={15} className="text-gold" />
                {primaryEmail}
              </a>
              <p className="inline-flex items-center gap-2 text-white/80 text-sm">
                <Phone size={15} className="text-gold" />
                {primaryPhone}
              </p>
              <p className="inline-flex items-center gap-2 text-white/80 text-sm">
                <Phone size={15} className="text-gold" />
                +880 9614-720401
              </p>
              <p className="inline-flex items-start gap-2 text-white/75 text-sm leading-relaxed">
                <MapPin size={15} className="text-gold mt-0.5 shrink-0" />
                {pick(company?.address, fallbackAddress)}
              </p>
              <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/80 hover:text-gold text-sm">
                <ArrowUpRight size={15} className="text-gold" />
                {website}
              </a>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-gold text-sm font-semibold uppercase tracking-wider mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-white/65 hover:text-white text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-gold text-sm font-semibold uppercase tracking-wider mb-5">Support</h4>
            <ul className="space-y-3">
              {serviceLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-white/65 hover:text-white text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-gold text-sm font-semibold uppercase tracking-wider mb-5">Connect</h4>
            <div className="flex flex-col gap-2.5">
              {activeSocials.length > 0 ? (
                activeSocials.map((s) => {
                  const Icon = socialIcons[s.key] || ArrowUpRight;
                  return (
                    <a
                      key={s.key}
                      href={social?.[s.key] || (s.key === "facebook" ? "https://facebook.com" : "#")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-gold text-sm border border-white/10 rounded-lg px-3 py-2 hover:border-gold/40 transition-all inline-flex items-center justify-between"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon size={14} />
                        {s.label}
                      </span>
                      <ArrowUpRight size={13} />
                    </a>
                  );
                })
              ) : (
                <p className="text-white/45 text-sm">Social links will appear here.</p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-7 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/35 text-xs">{copyright}</p>
          {content?.quick_links && (
            <p className="text-white/30 text-xs text-center md:text-right">
              {content.quick_links}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
