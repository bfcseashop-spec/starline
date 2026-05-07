import defaultPortfolio from "./defaultPortfolio.json";

export interface Property {
  id: number;
  slug: string;
  images: string[];
  title: string;
  location: string;
  price: string;
  priceNum: number;
  beds: number;
  baths: number;
  sqft: string;
  tag: string;
  type: string;
  description: string;
  amenities: string[];
  yearBuilt: number;
  garage: number;
  lotSize: string;
}

/** Static fallback when DB `marketing_properties` is empty — source of truth: `defaultPortfolio.json` */
export const properties = defaultPortfolio as Property[];

export const getPropertyBySlug = (slug: string) => properties.find((p) => p.slug === slug);
