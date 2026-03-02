import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PropertySearch, { type Filters } from "@/components/PropertySearch";
import FeaturedProperties from "@/components/FeaturedProperties";
import StatsSection from "@/components/StatsSection";
import Footer from "@/components/Footer";

const defaultFilters: Filters = {
  location: "All Locations",
  propertyType: "All Types",
  bedrooms: "Any",
  priceRange: "Any Price",
};

const Index = () => {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <PropertySearch onFilter={setFilters} />
        <FeaturedProperties filters={filters} />
        <StatsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
