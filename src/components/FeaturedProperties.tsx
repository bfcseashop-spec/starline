import { motion, AnimatePresence } from "framer-motion";
import { Bed, Bath, Maximize, ArrowRight } from "lucide-react";
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
          <p className="text-gold uppercase tracking-[0.3em] text-sm font-semibold mb-3">Our Portfolio</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground">Featured Properties</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Hand-picked premium properties for discerning buyers and investors.</p>
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
                  className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <Link to={`/property/${property.slug}`}>
                    <div className="relative overflow-hidden aspect-[4/3]">
                      <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <span className="absolute top-4 left-4 bg-gold-gradient text-accent-foreground text-xs font-bold px-3 py-1.5 rounded-lg shadow-md">{property.tag}</span>
                      <span className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md text-white text-sm font-bold px-3 py-1.5 rounded-lg">{property.price}</span>
                    </div>
                    <div className="p-6">
                      <h3 className="font-heading text-xl font-bold text-foreground mb-1 group-hover:text-gold transition-colors">{property.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{property.location}</p>
                      <div className="flex items-center gap-4 text-muted-foreground text-sm border-t border-border pt-4">
                        <span className="flex items-center gap-1.5"><Bed size={15} className="text-gold" /> {property.beds} Beds</span>
                        <span className="flex items-center gap-1.5"><Bath size={15} className="text-gold" /> {property.baths} Baths</span>
                        <span className="flex items-center gap-1.5"><Maximize size={15} className="text-gold" /> {property.sqft} sqft</span>
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

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <a href="/#properties" className="inline-flex items-center gap-2 text-gold font-semibold text-sm hover:gap-3 transition-all">
            View All Properties <ArrowRight size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProperties;
