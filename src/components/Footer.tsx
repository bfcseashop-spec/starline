const Footer = () => {
  return (
    <footer id="contact" className="bg-primary border-t border-navy-light">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <h3 className="font-heading text-2xl font-bold text-primary-foreground mb-4">
              Starline Builder's<span className="text-gold"> Ltd.</span>
            </h3>
            <p className="text-primary-foreground/50 max-w-md text-sm leading-relaxed">
              Premium construction and real estate services by Starline Builder's Ltd, delivering extraordinary properties around the globe.
            </p>
          </div>
          <div>
            <h4 className="text-gold text-sm font-semibold uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {["Properties", "About Us", "Services", "Contact"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-primary-foreground/50 hover:text-gold text-sm transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-gold text-sm font-semibold uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-2 text-primary-foreground/50 text-sm">
              <li>info@starlinebuilders.com</li>
              <li>+1 (555) 123-4567</li>
              <li>100 Park Avenue, New York</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-navy-light mt-12 pt-8 text-center">
          <p className="text-primary-foreground/30 text-xs">
            © 2026 Starline Builder's Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
