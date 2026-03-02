import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";

const locations = ["All Locations", "Manhattan, New York", "Brooklyn Heights, New York", "Beverly Hills, California", "Miami, Florida", "San Francisco, California"];
const propertyTypes = ["All Types", "Penthouse", "Villa", "Townhouse", "Condo", "Estate"];
const bedroomOptions = ["Any", "1+", "2+", "3+", "4+", "5+"];
const priceRanges = ["Any Price", "Under $1M", "$1M – $3M", "$3M – $5M", "$5M – $10M", "$10M+"];

export interface Filters {
  location: string;
  propertyType: string;
  bedrooms: string;
  priceRange: string;
}

interface Props {
  onFilter: (filters: Filters) => void;
}

const SelectField = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => (
  <div className="flex-1 min-w-[180px]">
    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block font-medium">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-muted text-foreground rounded-lg px-4 py-3 pr-10 text-sm outline-none border border-border focus:ring-2 focus:ring-gold/40 transition-shadow cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  </div>
);

const PropertySearch = ({ onFilter }: Props) => {
  const [filters, setFilters] = useState<Filters>({
    location: "All Locations",
    propertyType: "All Types",
    bedrooms: "Any",
    priceRange: "Any Price",
  });

  const update = (key: keyof Filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilter(next);
  };

  const reset = () => {
    const defaults: Filters = { location: "All Locations", propertyType: "All Types", bedrooms: "Any", priceRange: "Any Price" };
    setFilters(defaults);
    onFilter(defaults);
  };

  const hasFilters = filters.location !== "All Locations" || filters.propertyType !== "All Types" || filters.bedrooms !== "Any" || filters.priceRange !== "Any Price";

  return (
    <section className="relative z-20 -mt-14">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-2xl shadow-xl border border-border p-6 md:p-8"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Search size={18} className="text-gold" />
              <h3 className="font-heading text-lg font-semibold text-card-foreground">Find Your Property</h3>
            </div>
            {hasFilters && (
              <button onClick={reset} className="text-xs text-gold hover:underline font-medium">
                Clear Filters
              </button>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <SelectField label="Location" value={filters.location} options={locations} onChange={(v) => update("location", v)} />
            <SelectField label="Property Type" value={filters.propertyType} options={propertyTypes} onChange={(v) => update("propertyType", v)} />
            <SelectField label="Bedrooms" value={filters.bedrooms} options={bedroomOptions} onChange={(v) => update("bedrooms", v)} />
            <SelectField label="Price Range" value={filters.priceRange} options={priceRanges} onChange={(v) => update("priceRange", v)} />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PropertySearch;
