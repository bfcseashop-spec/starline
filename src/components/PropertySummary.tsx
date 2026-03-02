import { motion } from "framer-motion";
import { Building2, Tag, Key, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PropertySummary = () => {
  const { data } = useQuery({
    queryKey: ["property-summary"],
    queryFn: async () => {
      const { data: projects } = await supabase.from("customer_projects").select("status, location");
      if (!projects) return { total: 0, forSale: 0, forRent: 0, cities: 0 };
      const total = projects.length;
      const forSale = projects.filter((p) => p.status === "completed" || p.status === "for_sale").length;
      const forRent = projects.filter((p) => p.status === "for_rent").length;
      const cities = new Set(projects.map((p) => p.location).filter(Boolean)).size;
      return { total, forSale, forRent, cities };
    },
  });

  const items = [
    { icon: Building2, value: String(data?.total ?? 0), label: "Total Properties", gradient: "bg-dash-blue" },
    { icon: Tag, value: String(data?.forSale ?? 0), label: "For Sale", gradient: "bg-dash-green" },
    { icon: Key, value: String(data?.forRent ?? 0), label: "For Rent", gradient: "bg-dash-orange" },
    { icon: MapPin, value: String(data?.cities ?? 0), label: "Cities", gradient: "bg-dash-purple" },
  ];

  return (
    <section className="relative z-20 -mt-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item, i) => (
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
};

export default PropertySummary;
