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
  const { system, company, social, socialPlatforms, headerConfig, loading } = useSiteSettings();

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
          bannerTitle={system.banner_title}
          bannerSubtitle={system.banner_subtitle}
          bannerImageUrl={system.banner_image_url}
          badgeText={(system as any).badge_text}
          showBadge={(system as any).show_badge}
          ctaPrimaryText={(system as any).cta_primary_text}
          ctaPrimaryLink={(system as any).cta_primary_link}
          ctaSecondaryText={(system as any).cta_secondary_text}
          ctaSecondaryLink={(system as any).cta_secondary_link}
          overlayColor={(system as any).overlay_color}
          overlayOpacity={(system as any).overlay_opacity}
          textAlignment={(system as any).text_alignment}
          minHeight={(system as any).min_height}
          showScrollIndicator={(system as any).show_scroll_indicator}
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
