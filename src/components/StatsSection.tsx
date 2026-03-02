import { motion } from "framer-motion";

const stats = [
  { value: "2,500+", label: "Properties Sold" },
  { value: "$4.8B", label: "Total Sales Volume" },
  { value: "15+", label: "Years of Experience" },
  { value: "98%", label: "Client Satisfaction" },
];

const StatsSection = () => {
  return (
    <section id="about" className="py-24 bg-primary">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-gold uppercase tracking-[0.3em] text-sm font-medium mb-3">Why Choose Us</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground">
            Trusted by Thousands
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-gradient-gold font-heading text-4xl md:text-5xl font-bold mb-2">
                {stat.value}
              </p>
              <p className="text-primary-foreground/60 text-sm uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
