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
  "/properties/starline-tower-one/1.png",
  "/properties/starline-tower-one/02.png",
  "/properties/starline-tower-one/03.png",
];
const starlineNeeraloyVillaImages = [
  "/properties/starline-neeraloy-villa/01.png",
  "/properties/starline-neeraloy-villa/02.png",
  "/properties/starline-neeraloy-villa/03.png",
];
const starlineSapiyaManjilImages = [
  "/properties/starline-sapiya-manjil/01.png",
  "/properties/starline-sapiya-manjil/02.png",
  "/properties/starline-sapiya-manjil/03.png",
];
const starlineShantiNiketonImages = [
  "/properties/starline-shanti-niketon/01.png",
  "/properties/starline-shanti-niketon/02.png",
  "/properties/starline-shanti-niketon/03.png",
];
const starlineNurHosenVillaImages = [
  "/properties/starline-nur-hosen-villa/01.png",
  "/properties/starline-nur-hosen-villa/02.png",
  "/properties/starline-nur-hosen-villa/03.png",
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
    type: "Ongoing",
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
    images: starlineNeeraloyVillaImages,
    title: "Starline Niraloy Villa",
    location: "Shekhertek, Mohammadpur",
    price: "Contact for Price",
    priceNum: 0,
    beds: 3,
    baths: 3,
    sqft: "1,450",
    tag: "New",
    type: "Ongoing",
    yearBuilt: 2026,
    garage: 1,
    lotSize: "2.5 katha",
    description:
      "Starline Niraloy Villa delivers comfortable city living with practical planning for family use. Located in Shekhertek, Mohammadpur, the project combines modern architecture with thoughtful natural light and ventilation strategies.",
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
    images: starlineSapiyaManjilImages,
    title: "Starline Tower",
    location: "Shah Ali bug, Mirpur",
    price: "Handover Complete",
    priceNum: 0,
    beds: 3,
    baths: 2,
    sqft: "1,187",
    tag: "Exclusive",
    type: "Ongoing",
    yearBuilt: 2025,
    garage: 0,
    lotSize: "2.5 katha",
    description:
      "Starline Tower is one of our completed and handed-over properties in Shah Ali Bug, Mirpur. It reflects our commitment to timely delivery and quality-focused construction.",
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
    images: starlineShantiNiketonImages,
    title: "Starline Shanti Niketon",
    location: "Kazipara, Mirpur",
    price: "Contact for Price",
    priceNum: 0,
    beds: 3,
    baths: 3,
    sqft: "1,263",
    tag: "Ongoing",
    type: "Ongoing",
    yearBuilt: 2026,
    garage: 1,
    lotSize: "N/A",
    description:
      "Starline Shanti Niketon is an ongoing residential development in Kazipara, Mirpur designed for practical family living and better day-to-day comfort.",
    amenities: ["Modern Lift", "Generator Backup", "Ventilated Layout", "Parking", "Fire Safety"],
  },
  {
    id: 6,
    slug: "starline-nur-hosen-villa",
    images: starlineNurHosenVillaImages,
    title: "Starline Nur Hosen Villa",
    location: "Sector-11, Mirpur-11",
    price: "Handover Complete",
    priceNum: 0,
    beds: 3,
    baths: 3,
    sqft: "1,263",
    tag: "Handover",
    type: "Handed-over",
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
