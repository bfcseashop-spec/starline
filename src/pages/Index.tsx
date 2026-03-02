import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PropertySummary from "@/components/PropertySummary";
import PropertySearch, { type Filters } from "@/components/PropertySearch";
import FeaturedProperties from "@/components/FeaturedProperties";
import StatsSection from "@/components/StatsSection";
import ComingSoon from "@/components/ComingSoon";
import WhyStarline from "@/components/WhyStarline";
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
  const { system, company, social, loading } = useSiteSettings();

  return (
    <div className="min-h-screen bg-background">
      {!loading && (
        <style>{`
          :root {
            --dynamic-primary: ${system.primary_color};
            --dynamic-accent: ${system.accent_color};
          }
        `}</style>
      )}
      <Navbar company={company} headerStyle={system.header_style} social={social} />
      <main>
        <HeroSection
          bannerTitle={system.banner_title}
          bannerSubtitle={system.banner_subtitle}
          bannerImageUrl={system.banner_image_url}
        />
        <PropertySummary />
        <PropertySearch onFilter={setFilters} />
        {system.show_featured && <FeaturedProperties filters={filters} />}
        {system.show_stats && <StatsSection />}
        <ComingSoon />
        <WhyStarline />
      </main>
      <Footer company={company} social={social} />
    </div>
  );
};

export default Index;
