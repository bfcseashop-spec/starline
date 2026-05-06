import { useState, useEffect, useRef } from "react";
import { Menu, X, LogIn, LayoutDashboard, ExternalLink, Users, QrCode, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { CompanySettings, SocialLinks, SocialPlatforms, HeaderConfig } from "@/hooks/useSiteSettings";
import defaultLogo from "@/assets/logo.png";

const socialDefs = [
  { key: "facebook" as const, label: "Facebook", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  )},
  { key: "instagram" as const, label: "Instagram", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  )},
  { key: "tiktok" as const, label: "TikTok", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
  )},
  { key: "whatsapp" as const, label: "WhatsApp", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  )},
  { key: "telegram" as const, label: "Telegram", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0 12 12 0 0011.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
  )},
  { key: "youtube" as const, label: "YouTube", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  )},
  { key: "twitter" as const, label: "Twitter / X", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  )},
  { key: "linkedin" as const, label: "LinkedIn", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  )},
  { key: "website" as const, label: "Website", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  )},
];

interface Props {
  company?: CompanySettings;
  headerConfig?: HeaderConfig;
  social?: SocialLinks;
  socialPlatforms?: SocialPlatforms;
}

/* ── Popover for a single social platform ── */
const SocialPopover = ({
  platformKey,
  label,
  icon,
  config,
  simpleLink,
}: {
  platformKey: string;
  label: string;
  icon: React.ReactNode;
  config?: { link: string; group_link: string; qr_code_url: string; phone: string };
  simpleLink?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const link = config?.link || simpleLink || "";
  const group = config?.group_link || "";
  const qr = config?.qr_code_url || "";
  const phone = config?.phone || "";
  const hasMultiple = [link, group, qr, phone].filter(Boolean).length > 1;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // If only a simple link, just render a normal anchor
  if (!hasMultiple && link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" title={label}
        className="text-white/40 hover:text-gold p-1.5 rounded-md hover:bg-white/5 transition-all">
        {icon}
      </a>
    );
  }

  if (!link && !group && !qr && !phone) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        title={label}
        className="text-white/40 hover:text-gold p-1.5 rounded-md hover:bg-white/5 transition-all"
      >
        {icon}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[70]"
          >
            <div className="px-3 py-2.5 border-b border-border bg-muted/50">
              <p className="text-xs font-bold text-foreground">{label}</p>
            </div>
            <div className="p-1.5 space-y-0.5">
              {link && (
                <a href={link} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                  <ExternalLink size={14} className="text-primary shrink-0" />
                  <span className="truncate">Profile Link</span>
                </a>
              )}
              {group && (
                <a href={group} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                  <Users size={14} className="text-emerald-500 shrink-0" />
                  <span className="truncate">Group / Channel</span>
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                  <Phone size={14} className="text-amber-500 shrink-0" />
                  <span className="truncate">{phone}</span>
                </a>
              )}
              {qr && (
                <button onClick={() => { window.open(qr, "_blank"); setOpen(false); }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors w-full text-left">
                  <QrCode size={14} className="text-violet-500 shrink-0" />
                  <span className="truncate">View QR Code</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Navbar = ({ company, headerConfig, social, socialPlatforms }: Props) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, role } = useAuth();

  const hc = headerConfig;
  const visibleNavItems = hc?.nav_items?.filter(n => n.visible) || [];
  const isMinimal = (hc?.header_style || "default") === "minimal";
  const showSocialBar = hc?.show_social_bar !== false;
  const socialBarBg = hc?.social_bar_bg || "#1a1a2e";
  const socialBarText = hc?.social_bar_text || "Welcome to Starline Builder's Ltd.";
  const bgScrolled = hc?.bg_color_scrolled || "#1a1a2e";
  const bgOpacity = hc?.bg_opacity ?? 80;
  const logoSize = hc?.logo_size || "default";
  const navFontColor = hc?.nav_font_color || "#ffffff";
  const slogan = hc?.slogan || "";
  const sloganColor = hc?.slogan_color || "#c9a55a";

  const logoSizeClass: Record<string, string> = {
    small: "w-7 h-7",
    default: "w-9 h-9",
    large: "w-12 h-12",
    xlarge: "w-16 h-16",
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashboardPath = role === "admin" ? "/admin" : "/dashboard";
  const brandName = company?.name || "Starline Builder's Ltd.";
  const logoUrl = company?.logo_url || defaultLogo;

  const normalizeHref = (href: string) => {
    if (!href) return "/";
    if (href.startsWith("#")) return `/${href}`;
    return href;
  };

  const isExternal = (href: string) => /^https?:\/\//i.test(href);
  const isInternal = (href: string) => href.startsWith("/") || href.startsWith("#");

  const activeSocials = socialDefs.filter((s) => {
    const cfg = socialPlatforms?.[s.key];
    if (cfg && (cfg.link || cfg.group_link || cfg.qr_code_url || cfg.phone)) return true;
    if (social && (social as any)[s.key]) return true;
    return false;
  });

  // Convert hex opacity
  const hexOpacity = Math.round((bgOpacity / 100) * 255).toString(16).padStart(2, "0");

  return (
    <>
      {/* Top social bar */}
      {showSocialBar && (
        <div className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
          scrolled ? "h-0 opacity-0 overflow-hidden" : "h-10"
        }`}>
          <div className="h-full" style={{ backgroundColor: socialBarBg }}>
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
              <p className="text-white/40 text-xs hidden sm:block">{socialBarText}</p>
              <div className="flex items-center gap-1 ml-auto">
                {activeSocials.map((s) => (
                  <SocialPopover
                    key={s.key}
                    platformKey={s.key}
                    label={s.label}
                    icon={s.icon}
                    config={socialPlatforms?.[s.key]}
                    simpleLink={(social as any)?.[s.key]}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main navbar */}
      <nav
        className={`fixed left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "top-0 shadow-2xl shadow-black/20"
            : `${showSocialBar ? "top-10" : "top-0"}`
        }`}
        style={{
          backgroundColor: bgScrolled,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="font-heading text-xl font-bold flex items-center gap-3">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className={`${logoSizeClass[logoSize]} rounded-xl object-contain`} />
            )}
            {!isMinimal && (
              <div className="flex flex-col">
                <span className="text-white">
                  {brandName.includes("Ltd") ? (
                    <>{brandName.split("Ltd")[0]}<span className="text-gold">Ltd{brandName.split("Ltd")[1] || "."}</span></>
                  ) : (
                    <>{brandName}<span className="text-gold">.</span></>
                  )}
                </span>
                {slogan && (
                  <span className="text-[10px] uppercase tracking-widest leading-tight" style={{ color: sloganColor }}>{slogan}</span>
                )}
              </div>
            )}
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {visibleNavItems.map((link) => (
              isExternal(link.href) ? (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition-all tracking-wide"
                  style={{ color: navFontColor, opacity: 0.85 }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
                >
                  {link.label}
                </a>
              ) : isInternal(link.href) ? (
                <Link
                  key={link.id}
                  to={normalizeHref(link.href)}
                  className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition-all tracking-wide"
                  style={{ color: navFontColor, opacity: 0.85 }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.id}
                  href={link.href}
                  className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition-all tracking-wide"
                  style={{ color: navFontColor, opacity: 0.85 }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
                >
                  {link.label}
                </a>
              )
            ))}

            <div className="w-px h-6 bg-white/15 mx-3" />

            {user ? (
              <Link
                to={dashboardPath}
                className="bg-gold-gradient text-accent-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-gold/20"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
            ) : (
              <Link
                to="/auth"
                className="bg-gold-gradient text-accent-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-gold/20"
              >
                <LogIn size={15} />
                Log In
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-white p-2" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 overflow-hidden"
              style={{ backgroundColor: bgScrolled }}
            >
              <div className="px-6 py-5 flex flex-col gap-3">
                {visibleNavItems.map((link) => (
                  isExternal(link.href) ? (
                    <a
                      key={link.id}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="transition-colors text-sm py-2 border-b border-white/5"
                      style={{ color: navFontColor, opacity: 0.85 }}
                    >
                      {link.label}
                    </a>
                  ) : isInternal(link.href) ? (
                    <Link
                      key={link.id}
                      to={normalizeHref(link.href)}
                      onClick={() => setOpen(false)}
                      className="transition-colors text-sm py-2 border-b border-white/5"
                      style={{ color: navFontColor, opacity: 0.85 }}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.id}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="transition-colors text-sm py-2 border-b border-white/5"
                      style={{ color: navFontColor, opacity: 0.85 }}
                    >
                      {link.label}
                    </a>
                  )
                ))}

                {/* Social icons in mobile */}
                <div className="flex items-center gap-2 py-3">
                  {activeSocials.map((s) => (
                    <SocialPopover
                      key={s.key}
                      platformKey={s.key}
                      label={s.label}
                      icon={s.icon}
                      config={socialPlatforms?.[s.key]}
                      simpleLink={(social as any)?.[s.key]}
                    />
                  ))}
                </div>

                {user ? (
                  <Link to={dashboardPath} onClick={() => setOpen(false)} className="bg-gold-gradient text-accent-foreground px-5 py-3 rounded-lg text-sm font-semibold text-center flex items-center justify-center gap-2">
                    <LayoutDashboard size={15} /> Dashboard
                  </Link>
                ) : (
                  <Link to="/auth" onClick={() => setOpen(false)} className="bg-gold-gradient text-accent-foreground px-5 py-3 rounded-lg text-sm font-semibold text-center flex items-center justify-center gap-2">
                    <LogIn size={15} /> Log In
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default Navbar;