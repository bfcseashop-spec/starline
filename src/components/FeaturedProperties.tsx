import { motion, AnimatePresence } from "framer-motion";
import { Bed, Bath, Maximize } from "lucide-react";
import { Link } from "react-router-dom";
import { properties } from "@/data/properties";
import type { Filters } from "./PropertySearch";

const priceFilter = (priceNum: number, range: string) => {
  if (range === "Any Price") return true;
  if (range === "Under $1M") return priceNum < 1_000_000;
  if (range === "$1M – $3M") return priceNum >= 1_000_000 && priceNum <= 3_000_000;
  if (range === "$3M – $5M") return priceNum >= 3_000_000 && priceNum <= 5_000_000;
  if (range === "$5M – $10M") return priceNum >= 5_000_000 && priceNum <= 10_000_000;
  if (range === "$10M+") return priceNum >= 10_000_000;
  return true;
};

const bedsFilter = (beds: number, opt: string) => {
  if (opt === "Any") return true;
  return beds >= parseInt(opt);
};

interface Props {
  filters: Filters;
}

const FeaturedProperties = ({ filters }: Props) => {
  const filtered = properties.filter((p) => {
    if (filters.location !== "All Locations" && p.location !== filters.location) return false;
    if (filters.propertyType !== "All Types" && p.type !== filters.propertyType) return false;
    if (!bedsFilter(p.beds, filters.bedrooms)) return false;
    if (!priceFilter(p.priceNum, filters.priceRange)) return false;
    return true;
  });

  return (
    <section id="properties" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-gold uppercase tracking-[0.3em] text-sm font-medium mb-3">Our Portfolio</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground">Featured Properties</h2>
        </motion.div>

        <AnimatePresence mode="wait">
          {filtered.length > 0 ? (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid md:grid-cols-3 gap-8">
              {filtered.map((property, i) => (
                <motion.article
                  key={property.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-xl transition-shadow duration-300"
                >
                  <Link to={`/property/${property.slug}`}>
                    <div className="relative overflow-hidden aspect-[4/3]">
                      <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <span className="absolute top-4 left-4 bg-gold-gradient text-accent-foreground text-xs font-semibold px-3 py-1 rounded">{property.tag}</span>
                    </div>
                    <div className="p-6">
                      <p className="text-gold font-semibold text-lg mb-1">{property.price}</p>
                      <h3 className="font-heading text-xl font-semibold text-card-foreground mb-1">{property.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{property.location}</p>
                      <div className="flex items-center gap-4 text-muted-foreground text-sm border-t border-border pt-4">
                        <span className="flex items-center gap-1.5"><Bed size={15} /> {property.beds} Beds</span>
                        <span className="flex items-center gap-1.5"><Bath size={15} /> {property.baths} Baths</span>
                        <span className="flex items-center gap-1.5"><Maximize size={15} /> {property.sqft} sqft</span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
              <p className="text-muted-foreground text-lg">No properties match your filters.</p>
              <p className="text-muted-foreground/60 text-sm mt-1">Try adjusting your search criteria.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default FeaturedProperties;
