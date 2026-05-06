import { useState, useEffect } from "react";
import { Menu, X, LogIn, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { CompanySettings, SocialLinks, SocialPlatforms, HeaderConfig } from "@/hooks/useSiteSettings";
import defaultLogo from "@/assets/logo.png";

interface Props {
  company?: CompanySettings;
  headerConfig?: HeaderConfig;
  social?: SocialLinks;
  socialPlatforms?: SocialPlatforms;
}

const Navbar = ({ company, headerConfig }: Props) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, role } = useAuth();

  const dashboardPath = role === "admin" ? "/admin" : "/dashboard";
  const logoUrl = company?.logo_url || defaultLogo;
  const brandName = company?.name || "Starline Builder's Ltd.";
  const slogan = headerConfig?.slogan || "Property Partner in Bangladesh";

  const links = [
    { label: "Home", to: "/" },
    { label: "Properties", to: "/properties/ongoing" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/#contact" },
  ];
  const configLinks = (headerConfig?.nav_items || [])
    .filter((n) => n.visible)
    .map((n) => {
      const href = n.href.startsWith("#") ? `/${n.href}` : n.href || "/";
      const isPropertiesHref = href.includes("/projects/") || href.includes("/properties/");
      return {
        label: isPropertiesHref ? "Properties" : n.label,
        to: isPropertiesHref ? "/properties/ongoing" : href,
      };
    });
  const navLinks = configLinks.length > 0 ? configLinks : links;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div
          className={`rounded-2xl border transition-all duration-300 ${
            scrolled
              ? "bg-white/95 border-border shadow-xl backdrop-blur-md"
              : "bg-white/85 border-white/40 shadow-lg backdrop-blur-md"
          }`}
        >
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 min-w-0">
              <img src={logoUrl} alt="Starline logo" className="w-10 h-10 rounded-xl object-contain shrink-0" />
              <div className="min-w-0">
                <p className="font-heading text-sm md:text-base font-bold text-navy truncate">{brandName}</p>
                <p className="text-[10px] md:text-xs uppercase tracking-[0.18em] text-muted-foreground truncate">{slogan}</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              {navLinks.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  className="px-4 py-2 text-sm font-semibold text-navy/80 hover:text-navy hover:bg-navy/5 rounded-lg transition-colors"
                >
                  {l.label}
                </Link>
              ))}

              {user ? (
                <Link to={dashboardPath} className="ml-1 bg-navy text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-navy-light transition-colors">
                  <LayoutDashboard size={15} />
                  Dashboard
                </Link>
              ) : (
                <Link to="/auth" className="ml-1 bg-gold-gradient text-accent-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity">
                  <LogIn size={15} />
                  Log In
                </Link>
              )}
            </nav>

            <button
              className="md:hidden text-navy p-2 rounded-lg hover:bg-navy/5"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {open && (
            <div className="md:hidden border-t border-border/80 px-4 pb-4 pt-3 bg-white rounded-b-2xl">
              <div className="flex flex-col gap-2">
                {navLinks.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-navy/85 hover:bg-navy/5"
                  >
                    {l.label}
                  </Link>
                ))}
                {user ? (
                  <Link
                    to={dashboardPath}
                    onClick={() => setOpen(false)}
                    className="mt-1 bg-navy text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard size={15} />
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="mt-1 bg-gold-gradient text-accent-foreground px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <LogIn size={15} />
                    Log In
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;