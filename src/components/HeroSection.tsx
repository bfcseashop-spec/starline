import { motion } from "framer-motion";
import { Search, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-skyline.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Luxury city skyline at dusk" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-navy-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-20">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-gold uppercase tracking-[0.3em] text-sm font-medium mb-6"
        >
          Luxury Real Estate
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-heading text-5xl md:text-7xl font-bold text-primary-foreground leading-tight mb-6"
        >
          Find Your Dream
          <br />
          <span className="text-gradient-gold">Property</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-primary-foreground/60 text-lg md:text-xl max-w-2xl mx-auto mb-10"
        >
          Discover exceptional properties in the world's most sought-after locations. Your next chapter begins here.
        </motion.p>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-card/10 backdrop-blur-lg rounded-xl p-2 flex flex-col md:flex-row gap-2 max-w-2xl mx-auto border border-primary-foreground/10"
        >
          <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-card/10 rounded-lg">
            <MapPin size={18} className="text-gold shrink-0" />
            <input
              type="text"
              placeholder="City, neighborhood or address"
              className="bg-transparent text-primary-foreground placeholder:text-primary-foreground/40 outline-none w-full text-sm"
            />
          </div>
          <button className="bg-gold-gradient text-accent-foreground px-8 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <Search size={16} />
            Search
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
