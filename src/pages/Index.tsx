import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PropertySearch, { type Filters } from "@/components/PropertySearch";
import FeaturedProperties from "@/components/FeaturedProperties";
import StatsSection from "@/components/StatsSection";
import Footer from "@/components/Footer";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const defaultFilters: Filters = {
  location: "All Locations",
  propertyType: "All Types",
  bedrooms: "Any",
  priceRange: "Any Price",
};

const Index = () => {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const { system, company, loading } = useSiteSettings();

  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic CSS custom properties from system settings */}
      {!loading && (
        <style>{`
          :root {
            --dynamic-primary: ${system.primary_color};
            --dynamic-accent: ${system.accent_color};
          }
        `}</style>
      )}
      <Navbar company={company} headerStyle={system.header_style} />
      <main>
        <HeroSection
          bannerTitle={system.banner_title}
          bannerSubtitle={system.banner_subtitle}
          bannerImageUrl={system.banner_image_url}
        />
        <PropertySearch onFilter={setFilters} />
        {system.show_featured && <FeaturedProperties filters={filters} />}
        {system.show_stats && <StatsSection />}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
