import { MapPin, Mail, Phone, ArrowUpRight } from "lucide-react";

const Footer = () => (
  <footer id="contact" className="bg-navy">
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-2">
          <h3 className="font-heading text-2xl font-bold text-white mb-4">
            Starline Builder's<span className="text-gold"> Ltd.</span>
          </h3>
          <p className="text-white/40 max-w-md text-sm leading-relaxed mb-6">
            Premium construction and real estate services delivering extraordinary properties. Building trust, quality, and lifelong relationships since 2010.
          </p>
          <div className="flex gap-3">
            {["Facebook", "Instagram", "LinkedIn"].map((s) => (
              <a key={s} href="#" className="text-white/30 hover:text-gold text-xs border border-white/10 rounded-lg px-3 py-2 hover:border-gold/30 transition-all flex items-center gap-1">
                {s} <ArrowUpRight size={12} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-gold text-sm font-semibold uppercase tracking-wider mb-5">Quick Links</h4>
          <ul className="space-y-3">
            {["Properties", "About Us", "Services", "Contact", "Careers"].map((l) => (
              <li key={l}>
                <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">{l}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-gold text-sm font-semibold uppercase tracking-wider mb-5">Contact Us</h4>
          <ul className="space-y-3 text-white/40 text-sm">
            <li className="flex items-start gap-2"><Mail size={14} className="text-gold shrink-0 mt-0.5" /> info@starlinebuilders.com</li>
            <li className="flex items-start gap-2"><Phone size={14} className="text-gold shrink-0 mt-0.5" /> +1 (555) 123-4567</li>
            <li className="flex items-start gap-2"><MapPin size={14} className="text-gold shrink-0 mt-0.5" /> 100 Park Avenue, New York</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-white/25 text-xs">© 2026 Starline Builder's Ltd. All rights reserved.</p>
        <div className="flex gap-6">
          {["Privacy Policy", "Terms of Service"].map((l) => (
            <a key={l} href="#" className="text-white/25 hover:text-white/50 text-xs transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
