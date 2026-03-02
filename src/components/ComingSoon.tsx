import { motion } from "framer-motion";
import { Clock, Bell } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const upcomingProjects = [
  { title: "Starline Heights", location: "Downtown Metro", type: "Residential Tower", units: "120 Units", eta: "Q3 2026" },
  { title: "Emerald Business Park", location: "Tech Corridor", type: "Commercial Complex", units: "45 Offices", eta: "Q4 2026" },
  { title: "Sunset Villas", location: "Coastal Road", type: "Luxury Villas", units: "24 Villas", eta: "Q1 2027" },
];

const ComingSoon = () => {
  const [notified, setNotified] = useState<Set<number>>(new Set());

  const notify = (i: number) => {
    setNotified((prev) => new Set(prev).add(i));
    toast.success("You'll be notified when this project launches!");
  };

  return (
    <section className="py-24 bg-muted/40">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-gold/10 rounded-full px-4 py-2 mb-4">
            <Clock size={16} className="text-gold" />
            <span className="text-gold text-sm font-semibold">Launching Soon</span>
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground">Properties Coming Soon</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Be the first to know about our upcoming premium developments.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {upcomingProjects.map((project, i) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl border border-border p-6 hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="bg-gold/10 text-gold text-xs font-bold px-3 py-1 rounded-full">{project.eta}</span>
                <span className="text-xs text-muted-foreground font-medium">{project.type}</span>
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-1">{project.title}</h3>
              <p className="text-muted-foreground text-sm mb-1">{project.location}</p>
              <p className="text-gold text-sm font-semibold mb-5">{project.units}</p>
              <button
                onClick={() => notify(i)}
                disabled={notified.has(i)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  notified.has(i)
                    ? "bg-muted text-muted-foreground cursor-default"
                    : "bg-navy text-white hover:bg-navy-light"
                }`}
              >
                <Bell size={15} />
                {notified.has(i) ? "Notified" : "Notify Me"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComingSoon;
