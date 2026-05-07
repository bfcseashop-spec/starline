const towerOneImage = "https://wellassetgroup.com/uploads/backend/images/projects/2103092219.jpg";
const neeraloyImage = "https://wellassetgroup.com/uploads/backend/images/projects/631571038.jpg";
const towerImage = "https://wellassetgroup.com/uploads/backend/images/projects/709332200.jpg";
const shantiNiketonImage = "https://wellassetgroup.com/uploads/backend/images/projects/1170747971.jpg";
const upcomingSenparaImage = "https://wellassetgroup.com/uploads/backend/images/projects/916057683.jpeg";
const upcomingShawraImage = "https://wellassetgroup.com/uploads/backend/images/projects/1286103583.jpeg";
const upcomingUttaraImage = "https://wellassetgroup.com/uploads/backend/images/projects/647424063.jpeg";

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

const starlineTowerOneImages = [
  "/properties/starline-tower-one/01.png",
  "/properties/starline-tower-one/02.png",
  "/properties/starline-tower-one/03.png",
];

export const properties: Property[] = [
  {
    id: 1,
    slug: "starline-tower-one",
    images: starlineTowerOneImages,
    title: "Starline Tower - 1",
    location: "Sector-11, Ave-5, Mirpur 11",
    price: "Contact for Price",
    priceNum: 0,
    beds: 3,
    baths: 3,
    sqft: "1,350",
    tag: "Featured",
    type: "Apartment",
    yearBuilt: 2026,
    garage: 1,
    lotSize: "4.5 katha",
    description:
      "Starline Tower - 1 is a contemporary residential development at Sector-11, Avenue 5, Mirpur 11, Dhaka. The project focuses on efficient apartment layouts, practical circulation, and quality materials to ensure long-term comfort for urban families.",
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
    images: [neeraloyImage, neeraloyImage, neeraloyImage],
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
    images: [towerImage, towerImage, towerImage],
    title: "Starline Sapiya Manjil",
    location: "Mirpur-10, Dhaka",
    price: "Handover Complete",
    priceNum: 0,
    beds: 3,
    baths: 2,
    sqft: "1,187",
    tag: "Exclusive",
    type: "Handover",
    yearBuilt: 2025,
    garage: 0,
    lotSize: "N/A",
    description:
      "Starline Sapiya Manjil is one of our completed and handed-over properties in Mirpur-10. It reflects our commitment to timely delivery and quality-focused construction.",
    amenities: [
      "Completed Handover",
      "Practical Unit Layout",
      "Community-Oriented Location",
      "Durable Construction Finish",
      "Post-Handover Support",
    ],
  },
  {
    id: 4,
    slug: "starline-shanti-niketon",
    images: [shantiNiketonImage, shantiNiketonImage, shantiNiketonImage],
    title: "Starline Shanti Niketon",
    location: "Mirpur, Dhaka",
    price: "Contact for Price",
    priceNum: 0,
    beds: 3,
    baths: 3,
    sqft: "1,263",
    tag: "Ongoing",
    type: "Apartment",
    yearBuilt: 2026,
    garage: 1,
    lotSize: "N/A",
    description:
      "Starline Shanti Niketon is an ongoing residential development in East Kazipara, Mirpur designed for practical family living and better day-to-day comfort.",
    amenities: ["Modern Lift", "Generator Backup", "Ventilated Layout", "Parking", "Fire Safety"],
  },
  {
    id: 5,
    slug: "starline-tower",
    images: [towerImage, towerImage, towerImage],
    title: "Starline Tower",
    location: "Mirpur-1, Dhaka",
    price: "Contact for Price",
    priceNum: 0,
    beds: 3,
    baths: 3,
    sqft: "1,263",
    tag: "Ongoing",
    type: "Apartment",
    yearBuilt: 2026,
    garage: 1,
    lotSize: "N/A",
    description:
      "Starline Tower at Shah Ali Bug, Mirpur-1 is a signature corner development with practical floor planning and functional utility support.",
    amenities: ["Corner Plot Advantage", "Modern Lift", "Generator", "Security Provisions", "Parking"],
  },
  {
    id: 6,
    slug: "starline-nur-hosen-villa",
    images: [shantiNiketonImage, shantiNiketonImage, shantiNiketonImage],
    title: "Starline Nur Hosen Villa",
    location: "Mirpur, Dhaka",
    price: "Handover Complete",
    priceNum: 0,
    beds: 3,
    baths: 3,
    sqft: "1,263",
    tag: "Handover",
    type: "Handover",
    yearBuilt: 2025,
    garage: 1,
    lotSize: "N/A",
    description:
      "Starline Nur Hosen Villa is a completed project in Mirpur, delivered with a quality finish and reliable post-handover support.",
    amenities: ["Completed Handover", "Lift", "Generator Backup", "Functional Layout", "Community Location"],
  },
  {
    id: 7,
    slug: "starline-sarkar-villa",
    images: [towerOneImage, towerOneImage, towerOneImage],
    title: "Starline Sarkar Villa",
    location: "Mirpur, Dhaka",
    price: "Handover Complete",
    priceNum: 0,
    beds: 3,
    baths: 3,
    sqft: "1,350",
    tag: "Handover",
    type: "Handover",
    yearBuilt: 2025,
    garage: 1,
    lotSize: "N/A",
    description:
      "Starline Sarkar Villa is a completed corner-plot development with thoughtful circulation and daylight-focused planning.",
    amenities: ["Completed Handover", "Corner Plot Design", "Modern Lift", "Generator", "Security"],
  },
  {
    id: 8,
    slug: "starline-senpara-residence",
    images: [upcomingSenparaImage, upcomingSenparaImage, upcomingSenparaImage],
    title: "Starline Senpara Residence",
    location: "Mirpur, Dhaka",
    price: "Upcoming",
    priceNum: 0,
    beds: 3,
    baths: 3,
    sqft: "1,350",
    tag: "Upcoming",
    type: "Residential",
    yearBuilt: 2027,
    garage: 1,
    lotSize: "N/A",
    description: "Upcoming residential project in East Senpara, Monipur, Mirpur with modern planning and family-oriented layouts.",
    amenities: ["Planned Project", "Family Layout", "Parking", "Lift Provision", "Utility Planning"],
  },
  {
    id: 9,
    slug: "starline-shawra-para-heights",
    images: [upcomingShawraImage, upcomingShawraImage, upcomingShawraImage],
    title: "Starline Shawra Para Heights",
    location: "Mirpur, Dhaka",
    price: "Upcoming",
    priceNum: 0,
    beds: 3,
    baths: 3,
    sqft: "1,263",
    tag: "Upcoming",
    type: "Residential",
    yearBuilt: 2027,
    garage: 1,
    lotSize: "N/A",
    description: "Upcoming apartment project in East Shawra Para, Mirpur with efficient unit layouts and practical circulation.",
    amenities: ["Planned Project", "Efficient Layout", "Parking", "Lift Provision", "Utility Planning"],
  },
  {
    id: 10,
    slug: "starline-uttara-vista",
    images: [upcomingUttaraImage, upcomingUttaraImage, upcomingUttaraImage],
    title: "Starline Uttara Vista",
    location: "Uttara, Dhaka",
    price: "Upcoming",
    priceNum: 0,
    beds: 3,
    baths: 3,
    sqft: "1,187",
    tag: "Upcoming",
    type: "Residential",
    yearBuilt: 2027,
    garage: 1,
    lotSize: "N/A",
    description: "Future premium project in Uttara with modern design language and practical urban living standards.",
    amenities: ["Planned Project", "Modern Facade", "Parking", "Lift Provision", "Utility Planning"],
  },
];

export const getPropertyBySlug = (slug: string) =>
  properties.find((p) => p.slug === slug);
