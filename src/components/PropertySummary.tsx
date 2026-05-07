import { motion } from "framer-motion";
import { Building2, Tag, Key, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { properties as fallbackCatalog } from "@/data/properties";
import { usePropertyCatalog } from "@/hooks/usePropertyCatalog";

const PropertySummary = () => {
  const { data: catalog } = usePropertyCatalog();
  const counts = useMemo(() => {
    const list = catalog ?? fallbackCatalog;
    const total = list.length;
    const active = list.filter((p) => p.type === "Ongoing" || p.type === "Upcoming").length;
    const sold = list.filter((p) => p.type === "Handed-over").length;
    const cities = new Set(list.map((p) => p.location.split(",").slice(-1)[0]?.trim()).filter(Boolean)).size;
    return { total, active, sold, cities };
  }, [catalog]);

  const items = [
    { icon: Building2, value: String(counts.total), label: "Total Properties", gradient: "bg-dash-blue", to: "/properties/ongoing" },
    { icon: Tag, value: String(counts.active), label: "Active", gradient: "bg-dash-green", to: "/properties/ongoing" },
    { icon: Key, value: String(counts.sold), label: "Handover", gradient: "bg-dash-orange", to: "/properties/handover" },
    { icon: MapPin, value: String(counts.cities), label: "Areas", gradient: "bg-dash-purple", to: "/properties/upcoming" },
  ];

  return (
    <section className="relative z-20 -mt-10 md:-mt-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="h-full"
            >
              <Link
                to={item.to}
                className="bg-card rounded-2xl border border-border p-4 md:p-5 shadow-lg flex items-center gap-3 h-full hover:border-gold/45 hover:-translate-y-0.5 hover:shadow-xl transition-all"
              >
                <div className={`p-3 rounded-xl ${item.gradient} shrink-0`}>
                  <item.icon size={22} className="text-white" />
                </div>
                <div>
                  <p className="font-heading text-xl md:text-2xl font-bold text-foreground">{item.value}</p>
                  <p className="text-muted-foreground text-[10px] md:text-xs font-medium uppercase tracking-wider">{item.label}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropertySummary;
