import property1 from "@/assets/property-1.jpg";
import property1b from "@/assets/property-1b.jpg";
import property1c from "@/assets/property-1c.jpg";
import property2 from "@/assets/property-2.jpg";
import property2b from "@/assets/property-2b.jpg";
import property2c from "@/assets/property-2c.jpg";
import property3 from "@/assets/property-3.jpg";
import property3b from "@/assets/property-3b.jpg";
import property3c from "@/assets/property-3c.jpg";

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

export const properties: Property[] = [
  {
    id: 1,
    slug: "skyview-penthouse",
    images: [property1, property1b, property1c],
    title: "The Skyview Penthouse",
    location: "Manhattan, New York",
    price: "$4,250,000",
    priceNum: 4250000,
    beds: 4,
    baths: 3,
    sqft: "3,200",
    tag: "Featured",
    type: "Penthouse",
    yearBuilt: 2021,
    garage: 2,
    lotSize: "N/A",
    description:
      "Perched atop one of Manhattan's most iconic residential towers, The Skyview Penthouse offers unparalleled 360-degree views of the city skyline. This exquisite residence features floor-to-ceiling windows, a chef's kitchen with Calacatta marble countertops, and a grand living space bathed in natural light. The private terrace provides a serene escape above the city, perfect for entertaining or quiet evenings. Every detail has been curated to the highest standard of luxury living.",
    amenities: [
      "24/7 Concierge",
      "Private Terrace",
      "Chef's Kitchen",
      "Floor-to-Ceiling Windows",
      "Smart Home System",
      "Wine Cellar",
      "Private Elevator",
      "Fitness Center Access",
      "Heated Floors",
      "Built-in Sound System",
    ],
  },
  {
    id: 2,
    slug: "azure-villa-estate",
    images: [property2, property2b, property2c],
    title: "Azure Villa Estate",
    location: "Beverly Hills, California",
    price: "$8,750,000",
    priceNum: 8750000,
    beds: 6,
    baths: 5,
    sqft: "7,400",
    tag: "New",
    type: "Villa",
    yearBuilt: 2023,
    garage: 4,
    lotSize: "1.2 acres",
    description:
      "Azure Villa Estate is a masterpiece of contemporary architecture set on over an acre of meticulously landscaped grounds in Beverly Hills. The estate features an infinity pool overlooking the canyon, a grand double-height living room with a statement fireplace, and six luxuriously appointed bedroom suites. The outdoor entertaining areas include a summer kitchen, fire pit lounge, and lush tropical gardens. This is California living at its finest.",
    amenities: [
      "Infinity Pool & Spa",
      "Summer Kitchen",
      "Home Theater",
      "Double-Height Ceilings",
      "4-Car Garage",
      "Guest House",
      "Fire Pit Lounge",
      "Landscaped Gardens",
      "Security System",
      "Solar Panels",
    ],
  },
  {
    id: 3,
    slug: "heritage-brownstone",
    images: [property3, property3b, property3c],
    title: "Heritage Brownstone",
    location: "Brooklyn Heights, New York",
    price: "$3,100,000",
    priceNum: 3100000,
    beds: 5,
    baths: 4,
    sqft: "4,800",
    tag: "Exclusive",
    type: "Townhouse",
    yearBuilt: 1892,
    garage: 0,
    lotSize: "2,400 sqft",
    description:
      "A rare gem in the heart of Brooklyn Heights, this meticulously restored 1892 brownstone seamlessly blends historic grandeur with modern luxury. Original details including exposed brick walls, ornate fireplaces, and hardwood floors have been lovingly preserved. The private rooftop terrace offers breathtaking views of the Manhattan skyline. Spread across four floors, this home provides generous living space while maintaining the intimate charm of a bygone era.",
    amenities: [
      "Rooftop Terrace",
      "Original Fireplaces",
      "Exposed Brick",
      "Hardwood Floors",
      "Garden Level",
      "Central Air",
      "Custom Millwork",
      "Chef's Kitchen",
      "Built-in Bookshelves",
      "Restored Details",
    ],
  },
];

export const getPropertyBySlug = (slug: string) =>
  properties.find((p) => p.slug === slug);
