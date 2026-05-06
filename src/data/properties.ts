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
    slug: "starline-tower-one",
    images: [property1, property1b, property1c],
    title: "Starline Tower - 1",
    location: "Mirpur, Dhaka",
    price: "Contact for Price",
    priceNum: 0,
    beds: 3,
    baths: 3,
    sqft: "1,350",
    tag: "Featured",
    type: "Apartment",
    yearBuilt: 2026,
    garage: 1,
    lotSize: "N/A",
    description:
      "Starline Tower - 1 is a contemporary residential development in Mirpur, Dhaka. The project focuses on efficient apartment layouts, practical circulation, and quality materials to ensure long-term comfort for urban families.",
    amenities: [
      "Modern Lift",
      "Generator Backup",
      "Fire Safety Features",
      "Wide Staircase",
      "Rooftop Utility Space",
      "Optimized Ventilation",
    ],
  },
  {
    id: 2,
    slug: "starline-neeraloy-villa",
    images: [property2, property2b, property2c],
    title: "Starline Neeraloy Villa",
    location: "Mohammadpur, Dhaka",
    price: "Contact for Price",
    priceNum: 0,
    beds: 3,
    baths: 3,
    sqft: "1,450",
    tag: "New",
    type: "Residential",
    yearBuilt: 2026,
    garage: 1,
    lotSize: "N/A",
    description:
      "Starline Neeraloy Villa delivers comfortable city living with practical planning for family use. Located in Mohammadpur, the project combines modern architecture with thoughtful natural light and ventilation strategies.",
    amenities: [
      "Contemporary Facade",
      "Functional Balcony Layouts",
      "Quality Tile & Paint Finish",
      "Security Provisions",
      "Parking Support",
      "Reliable Utility Planning",
    ],
  },
  {
    id: 3,
    slug: "starline-sapiya-manjil",
    images: [property3, property3b, property3c],
    title: "Starline Sapiya Manjil",
    location: "Mirpur-10, Dhaka",
    price: "Handover Complete",
    priceNum: 0,
    beds: 3,
    baths: 2,
    sqft: "1,280",
    tag: "Exclusive",
    type: "Handover",
    yearBuilt: 2025,
    garage: 0,
    lotSize: "N/A",
    description:
      "Starline Sapiya Manjil is one of our completed and handed-over properties in Mirpur-10. It reflects our commitment to delivery reliability, construction quality, and homeowner satisfaction.",
    amenities: [
      "Completed Handover",
      "Practical Unit Layout",
      "Community-Oriented Location",
      "Durable Construction Finish",
      "Post-Handover Support",
    ],
  },
];

export const getPropertyBySlug = (slug: string) =>
  properties.find((p) => p.slug === slug);
