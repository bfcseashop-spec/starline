import { useState, useEffect } from "react";
import { Menu, X, LogIn, LayoutDashboard, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { CompanySettings } from "@/hooks/useSiteSettings";

const navLinks = [
  { label: "Home", href: "#" },
  { label: "Properties", href: "#properties" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

interface Props {
  company?: CompanySettings;
  headerStyle?: string;
}

const Navbar = ({ company, headerStyle }: Props) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, role } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashboardPath = role === "admin" ? "/admin" : "/dashboard";
  const brandName = company?.name || "Starline Builder's";
  const logoUrl = company?.logo_url;
  const isMinimal = headerStyle === "minimal";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-card/95 backdrop-blur-md shadow-lg border-b border-border" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
        <a href="#" className="font-heading text-2xl font-bold flex items-center gap-3">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-contain" />
          )}
          {!isMinimal && (
            <span className={scrolled ? "text-foreground" : "text-white"}>
              {brandName.includes("Ltd") ? (
                <>{brandName.split("Ltd")[0]}<span className="text-gold">Ltd{brandName.split("Ltd")[1] || "."}</span></>
              ) : (
                <>{brandName}<span className="text-gold">.</span></>
              )}
            </span>
          )}
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`text-sm font-medium tracking-wide uppercase transition-colors ${
                scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
          <a href="tel:+15551234567" className={`flex items-center gap-1.5 text-sm font-medium ${scrolled ? "text-gold" : "text-gold-light"}`}>
            <Phone size={14} /> +1 (555) 123-4567
          </a>
          {user ? (
            <Link
              to={dashboardPath}
              className="bg-gold-gradient text-accent-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-md"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          ) : (
            <Link
              to="/auth"
              className="bg-gold-gradient text-accent-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-md"
            >
              <LogIn size={16} />
              Log In
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button className={`md:hidden ${scrolled ? "text-foreground" : "text-white"}`} onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-t border-border overflow-hidden shadow-xl"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} onClick={() => setOpen(false)} className="text-foreground/70 hover:text-foreground transition-colors text-sm uppercase tracking-wide">
                  {link.label}
                </a>
              ))}
              {user ? (
                <Link to={dashboardPath} onClick={() => setOpen(false)} className="text-gold text-sm uppercase tracking-wide flex items-center gap-2">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)} className="text-gold text-sm uppercase tracking-wide flex items-center gap-2">
                  <LogIn size={16} /> Log In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
