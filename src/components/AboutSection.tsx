import { Target, Eye, Award } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

const cards = [
  { icon: Target, title: "Our Mission", body: "Deliver thoughtfully designed homes that combine craftsmanship, transparency and lasting value for every family we serve." },
  { icon: Eye, title: "Our Vision", body: "To be Bangladesh's most trusted residential developer — known for ethical practice, on-time delivery and timeless architecture." },
  { icon: Award, title: "Our Promise", body: "Every project is backed by verified land, in-house engineering and an after-handover relationship that lasts a lifetime." },
];

const AboutSection = () => {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container">
        <div ref={ref} className={cn("grid lg:grid-cols-2 gap-12 items-center transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80"
              alt="Starline Builder's Ltd construction site"
              className="rounded-2xl shadow-xl w-full h-[420px] object-cover"
              loading="lazy"
            />
            <div className="absolute -bottom-6 -right-6 bg-card border border-border rounded-2xl px-6 py-5 shadow-lg hidden sm:block">
              <div className="text-3xl font-bold text-primary font-heading">14+</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">Years of Trust</div>
            </div>
          </div>
          <div>
            <span className="text-accent uppercase tracking-[0.25em] text-xs font-semibold">About Starline</span>
            <h2 className="mt-3 text-foreground">Building homes that stand the test of time.</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Founded in 2010, Starline Builder's Ltd. has quietly become one of Dhaka's most respected residential developers. We work with a single principle — build the kind of home our own families would live in.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              From land due-diligence to final handover, every step is owned by an in-house team of architects, structural engineers and project managers. The result: homes that look beautiful on day one and stay that way for decades.
            </p>
            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              {cards.map((c) => (
                <div key={c.title} className="bg-secondary/40 border border-border rounded-xl p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <c.icon size={18} />
                  </div>
                  <div className="font-semibold text-foreground mb-1">{c.title}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
