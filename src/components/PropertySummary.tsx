import { motion } from "framer-motion";
import { Building2, Tag, Key, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { properties } from "@/data/properties";

const PropertySummary = () => {
  const { data } = useQuery({
    queryKey: ["property-summary"],
    queryFn: async () => {
      const { data: projects, error } = await supabase.from("customer_projects").select("status, location");
      if (error || !projects || projects.length === 0) {
        const total = properties.length;
        const forSale = properties.filter((p) => p.type !== "Handover").length;
        const forRent = 0;
        const cities = new Set(properties.map((p) => p.location.split(",").slice(-1)[0]?.trim()).filter(Boolean)).size;
        return { total, forSale, forRent, cities };
      }

      const total = projects.length;
      const forSale = projects.filter((p) => p.status === "completed" || p.status === "for_sale" || p.status === "in_progress").length;
      const forRent = projects.filter((p) => p.status === "for_rent").length;
      const cities = new Set(
        projects
          .map((p) => p.location?.split(",").slice(-1)[0]?.trim())
          .filter(Boolean),
      ).size;
      return { total, forSale, forRent, cities };
    },
  });

  const items = [
    { icon: Building2, value: String(data?.total ?? 0), label: "Total Properties", gradient: "bg-dash-blue", to: "/properties/ongoing" },
    { icon: Tag, value: String(data?.forSale ?? 0), label: "For Sale", gradient: "bg-dash-green", to: "/properties/ongoing" },
    { icon: Key, value: String(data?.forRent ?? 0), label: "For Rent", gradient: "bg-dash-orange", to: "/properties/handover" },
    { icon: MapPin, value: String(data?.cities ?? 0), label: "Cities", gradient: "bg-dash-purple", to: "/properties/upcoming" },
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
