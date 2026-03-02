import { motion } from "framer-motion";

const stats = [
  { value: "2,500+", label: "Properties Sold" },
  { value: "$4.8B", label: "Total Sales Volume" },
  { value: "15+", label: "Years of Experience" },
  { value: "98%", label: "Client Satisfaction" },
];

const StatsSection = () => (
  <section className="py-20 bg-card border-y border-border">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <p className="text-gradient-gold font-heading text-4xl md:text-5xl font-bold mb-2">{stat.value}</p>
            <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;
