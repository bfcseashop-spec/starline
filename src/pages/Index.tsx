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
  const { system, company, social, socialPlatforms, headerConfig, comingSoon, whyUsReasons, statsItems, footerContent, loading } = useSiteSettings();

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
      <Navbar company={company} headerConfig={headerConfig} social={social} socialPlatforms={socialPlatforms} />
      <main>
        <HeroSection
          heroSlideUrls={system.hero_slide_urls}
          bannerImageUrl={system.banner_image_url}
          overlayColor={(system as any).overlay_color}
          overlayOpacity={(system as any).overlay_opacity}
          minHeight={(system as any).min_height}
        />
        <PropertySummary />
        {(system as any).show_search !== false && <PropertySearch onFilter={setFilters} />}
        {system.show_featured && <FeaturedProperties filters={filters} />}
        {system.show_stats && <StatsSection items={statsItems} />}
        <ComingSoon projects={comingSoon} />
        {(system as any).show_why_us !== false && <WhyStarline reasons={whyUsReasons} />}
      </main>
      <Footer company={company} social={social} content={footerContent} />
    </div>
  );
};

export default Index;
