import { motion } from "framer-motion";
import AnimatedCounter from "@/components/AnimatedCounter";
import type { StatItem } from "@/hooks/useSiteSettings";

const defaultStats: StatItem[] = [
  { value: "2500+", label: "Properties Delivered" },
  { value: "1800+", label: "Happy Families" },
  { value: "14+", label: "Years of Experience" },
  { value: "98%", label: "Client Satisfaction" },
];

interface Props {
  items?: StatItem[];
}

// Parses "2,500+" → { prefix:"", num:2500, suffix:"+" }
const parseStat = (raw: string) => {
  const match = raw.match(/^([^\d-]*)([\d.,]+)(.*)$/);
  if (!match) return { prefix: "", num: 0, suffix: raw };
  return {
    prefix: match[1] || "",
    num: parseFloat(match[2].replace(/,/g, "")) || 0,
    suffix: match[3] || "",
  };
};

const StatsSection = ({ items }: Props) => {
  const list = items && items.length > 0 ? items : defaultStats;

  return (
    <section className="py-12 md:py-16 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {list.map((stat, i) => {
            const p = parseStat(stat.value);
            return (
              <motion.div
                key={stat.label + i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center rounded-2xl border border-transparent hover:border-border hover:bg-muted/30 transition-colors py-4"
              >
                <AnimatedCounter
                  end={p.num}
                  prefix={p.prefix}
                  suffix={p.suffix}
                  className="text-gradient-gold font-heading text-4xl md:text-5xl font-bold mb-2 block"
                />
                <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

