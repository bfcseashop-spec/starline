import { motion } from "framer-motion";
import { Building2, Tag, Key, MapPin } from "lucide-react";

const summaryItems = [
  { icon: Building2, value: "124", label: "Total Properties", gradient: "bg-dash-blue" },
  { icon: Tag, value: "68", label: "For Sale", gradient: "bg-dash-green" },
  { icon: Key, value: "42", label: "For Rent", gradient: "bg-dash-orange" },
  { icon: MapPin, value: "15", label: "Cities", gradient: "bg-dash-purple" },
];

const PropertySummary = () => (
  <section className="relative z-20 -mt-16">
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-xl flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl ${item.gradient} shrink-0`}>
              <item.icon size={22} className="text-white" />
            </div>
            <div>
              <p className="font-heading text-2xl font-bold text-foreground">{item.value}</p>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{item.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PropertySummary;
