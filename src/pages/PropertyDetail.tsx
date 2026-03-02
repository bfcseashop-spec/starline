import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bed, Bath, Maximize, Calendar, Car, Ruler, MapPin, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageGallery from "@/components/ImageGallery";
import ContactForm from "@/components/ContactForm";
import { getPropertyBySlug } from "@/data/properties";

const PropertyDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const property = getPropertyBySlug(slug || "");

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh] pt-20">
          <div className="text-center">
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Property Not Found</h1>
            <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist.</p>
            <Link to="/" className="bg-gold-gradient text-accent-foreground px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
              Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const details = [
    { icon: Bed, label: "Bedrooms", value: property.beds },
    { icon: Bath, label: "Bathrooms", value: property.baths },
    { icon: Maximize, label: "Sq. Ft.", value: property.sqft },
    { icon: Calendar, label: "Year Built", value: property.yearBuilt },
    { icon: Car, label: "Garage", value: property.garage > 0 ? `${property.garage}-Car` : "None" },
    { icon: Ruler, label: "Lot Size", value: property.lotSize },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Back link */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-gold text-sm font-medium transition-colors mb-8">
              <ArrowLeft size={16} /> Back to Properties
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Left: Gallery + Details */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <ImageGallery images={property.images} title={property.title} />
              </motion.div>

              {/* Header */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="bg-gold-gradient text-accent-foreground text-xs font-semibold px-3 py-1 rounded mb-3 inline-block">{property.tag}</span>
                    <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">{property.title}</h1>
                    <p className="text-muted-foreground flex items-center gap-1.5 mt-2"><MapPin size={15} /> {property.location}</p>
                  </div>
                  <p className="text-gold font-heading text-3xl font-bold">{property.price}</p>
                </div>
              </motion.div>

              {/* Details grid */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {details.map((d) => (
                  <div key={d.label} className="bg-card rounded-xl border border-border p-4 text-center">
                    <d.icon size={20} className="text-gold mx-auto mb-2" />
                    <p className="text-foreground font-semibold text-sm">{d.value}</p>
                    <p className="text-muted-foreground text-xs">{d.label}</p>
                  </div>
                ))}
              </motion.div>

              {/* Description */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">About This Property</h2>
                <p className="text-muted-foreground leading-relaxed">{property.description}</p>
              </motion.div>

              {/* Amenities */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">Amenities & Features</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2.5 bg-card rounded-lg border border-border px-4 py-3">
                      <Check size={16} className="text-gold shrink-0" />
                      <span className="text-foreground text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right: Contact form (sticky) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:sticky lg:top-28 lg:self-start">
              <ContactForm propertyTitle={property.title} />
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetail;
