import { motion } from "framer-motion";
import { Bed, Bath, Maximize } from "lucide-react";
import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";

const properties = [
  {
    id: 1,
    image: property1,
    title: "The Skyview Penthouse",
    location: "Manhattan, New York",
    price: "$4,250,000",
    beds: 4,
    baths: 3,
    sqft: "3,200",
    tag: "Featured",
  },
  {
    id: 2,
    image: property2,
    title: "Azure Villa Estate",
    location: "Beverly Hills, California",
    price: "$8,750,000",
    beds: 6,
    baths: 5,
    sqft: "7,400",
    tag: "New",
  },
  {
    id: 3,
    image: property3,
    title: "Heritage Brownstone",
    location: "Brooklyn Heights, New York",
    price: "$3,100,000",
    beds: 5,
    baths: 4,
    sqft: "4,800",
    tag: "Exclusive",
  },
];

const FeaturedProperties = () => {
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
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground">
            Featured Properties
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {properties.map((property, i) => (
            <motion.article
              key={property.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative overflow-hidden aspect-[4/3]">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-gold-gradient text-accent-foreground text-xs font-semibold px-3 py-1 rounded">
                  {property.tag}
                </span>
              </div>
              <div className="p-6">
                <p className="text-gold font-semibold text-lg mb-1">{property.price}</p>
                <h3 className="font-heading text-xl font-semibold text-card-foreground mb-1">
                  {property.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">{property.location}</p>
                <div className="flex items-center gap-4 text-muted-foreground text-sm border-t border-border pt-4">
                  <span className="flex items-center gap-1.5"><Bed size={15} /> {property.beds} Beds</span>
                  <span className="flex items-center gap-1.5"><Bath size={15} /> {property.baths} Baths</span>
                  <span className="flex items-center gap-1.5"><Maximize size={15} /> {property.sqft} sqft</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;
