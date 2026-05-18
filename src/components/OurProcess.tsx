import { Compass, PencilRuler, HardHat, KeyRound, ShieldCheck } from "lucide-react";

const steps = [
  { icon: Compass, title: "Site Selection", desc: "We carefully evaluate land, location and legal documents before acquiring any project site." },
  { icon: PencilRuler, title: "Design & Planning", desc: "Architects and engineers craft layouts focused on light, ventilation and modern living." },
  { icon: ShieldCheck, title: "Approvals & Compliance", desc: "All Rajuk, civic and utility approvals are managed in-house with full transparency." },
  { icon: HardHat, title: "Quality Construction", desc: "Verified materials, certified contractors and on-site engineers ensure structural excellence." },
  { icon: KeyRound, title: "Handover & Support", desc: "Timely delivery with documented handover and continued after-sales relationship." },
];

const OurProcess = () => (
  <section id="process" className="py-20 bg-secondary/40">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="text-accent uppercase tracking-[0.25em] text-xs font-semibold">How We Build</span>
        <h2 className="mt-3 text-foreground">A Process Built on Trust</h2>
        <p className="mt-4 text-muted-foreground">
          From the first site visit to the day you receive the keys, every step is documented, transparent and led by experienced professionals.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {steps.map((s, i) => (
          <div key={s.title} className="relative bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="absolute -top-3 left-6 text-xs font-semibold tracking-widest text-accent">STEP {String(i + 1).padStart(2, "0")}</div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <s.icon size={22} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default OurProcess;
