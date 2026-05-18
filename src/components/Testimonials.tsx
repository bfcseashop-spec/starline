import { Quote, Star } from "lucide-react";

const items = [
  {
    name: "Rashed Karim",
    role: "Homeowner, Starline Tower 1",
    quote: "Handover was on time and the build quality exceeded my expectations. The team kept us updated at every stage.",
  },
  {
    name: "Nusrat Jahan",
    role: "Owner, Niraloy Villa",
    quote: "Spacious layouts, excellent ventilation, and a thoughtful design. Truly a comfortable home for my family.",
  },
  {
    name: "Mahbub Alam",
    role: "Investor",
    quote: "Transparent paperwork, clear payment plan and professional staff. Easily the most trustworthy developer I've worked with.",
  },
];

const Testimonials = () => (
  <section id="testimonials" className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
    <div className="absolute top-10 right-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
    <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
    <div className="container relative">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="text-accent uppercase tracking-[0.25em] text-xs font-semibold">Testimonials</span>
        <h2 className="mt-3 text-primary-foreground">Voices of Our Homeowners</h2>
        <p className="mt-4 text-primary-foreground/75">Real stories from families and investors who chose Starline.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((t) => (
          <div key={t.name} className="bg-primary-foreground/5 backdrop-blur border border-primary-foreground/10 rounded-2xl p-7 hover:bg-primary-foreground/10 transition-colors">
            <Quote className="text-accent mb-4" size={28} />
            <p className="text-primary-foreground/90 leading-relaxed italic">"{t.quote}"</p>
            <div className="flex items-center gap-1 mt-5 text-accent">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
            </div>
            <div className="mt-4 pt-4 border-t border-primary-foreground/10">
              <div className="font-semibold">{t.name}</div>
              <div className="text-sm text-primary-foreground/65">{t.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
