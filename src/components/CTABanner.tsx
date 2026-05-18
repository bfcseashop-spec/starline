import { Phone, Calendar } from "lucide-react";

const CTABanner = () => (
  <section className="py-16 bg-background">
    <div className="container">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-[hsl(160_70%_22%)] p-10 md:p-14 text-primary-foreground">
        <div className="absolute -top-16 -right-10 w-72 h-72 bg-accent/25 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-10 w-72 h-72 bg-accent/15 rounded-full blur-3xl" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-accent uppercase tracking-[0.25em] text-xs font-semibold">Schedule a Visit</span>
            <h2 className="mt-3 text-primary-foreground">Ready to find your next home?</h2>
            <p className="mt-4 text-primary-foreground/80 max-w-lg">
              Book a free site visit with our advisors. Walk through floor plans, sample apartments and explore financing options that suit you.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 transition"
            >
              <Calendar size={18} /> Book Site Visit
            </a>
            <a
              href="tel:+8801700000000"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 font-semibold hover:bg-primary-foreground/15 transition"
            >
              <Phone size={18} /> Call Us
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CTABanner;
