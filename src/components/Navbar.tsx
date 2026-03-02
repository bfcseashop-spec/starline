import { useState } from "react";
import { Menu, X, LogIn, LayoutDashboard } from "lucide-react";
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
  const { user, role } = useAuth();

  const dashboardPath = role === "admin" ? "/admin" : "/dashboard";
  const brandName = company?.name || "Starline Builder's";
  const logoUrl = company?.logo_url;
  const isCentered = headerStyle === "centered";
  const isMinimal = headerStyle === "minimal";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/90 backdrop-blur-md border-b border-navy-light">
      <div className={`max-w-7xl mx-auto px-6 flex items-center ${isCentered ? "justify-center" : "justify-between"} h-20`}>
        <a href="#" className={`font-heading text-2xl font-bold text-primary-foreground tracking-wide flex items-center gap-3 ${isCentered ? "mr-auto" : ""}`}>
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-lg object-contain" />
          )}
          {!isMinimal && (
            <>
              {brandName.includes("Ltd") ? (
                <>
                  {brandName.split("Ltd")[0]}<span className="text-gold">Ltd{brandName.split("Ltd")[1] || "."}</span>
                </>
              ) : (
                <>{brandName}<span className="text-gold">.</span></>
              )}
            </>
          )}
          {isMinimal && logoUrl && null}
          {isMinimal && !logoUrl && <span>{brandName.slice(0, 2)}</span>}
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-primary-foreground/70 hover:text-gold transition-colors tracking-wide uppercase"
            >
              {link.label}
            </a>
          ))}
          {user ? (
            <Link
              to={dashboardPath}
              className="bg-gold-gradient text-accent-foreground px-6 py-2.5 rounded text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          ) : (
            <Link
              to="/auth"
              className="bg-gold-gradient text-accent-foreground px-6 py-2.5 rounded text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <LogIn size={16} />
              Log In
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-primary-foreground" onClick={() => setOpen(!open)}>
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
            className="md:hidden bg-primary border-t border-navy-light overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-primary-foreground/70 hover:text-gold transition-colors text-sm uppercase tracking-wide"
                >
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
