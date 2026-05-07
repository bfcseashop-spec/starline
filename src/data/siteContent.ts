export type ProjectCategory = "upcoming" | "ongoing" | "handover";

export interface ProjectSummary {
  name: string;
  slug?: string;
  address: string;
  city: string;
  notes?: string;
  image: string;
}

const PROJECT_IMAGES = {
  ongoing: {
    towerOne: "/properties/starline-tower-one/1.png",
    neeraloyVilla: "/properties/starline-neeraloy-villa/01.png",
    tower: "https://wellassetgroup.com/uploads/backend/images/projects/709332200.jpg",
    shantiNiketon: "/properties/starline-shanti-niketon/01.png",
  },
  upcoming: {
    eastSenpara: "https://wellassetgroup.com/uploads/backend/images/projects/916057683.jpeg",
    eastShawraPara: "https://wellassetgroup.com/uploads/backend/images/projects/1286103583.jpeg",
    uttara: "https://wellassetgroup.com/uploads/backend/images/projects/647424063.jpeg",
  },
  handoverFallback:
    "https://wellassetgroup.com/uploads/backend/images/projects/1170747971.jpg",
} as const;

export interface AboutContentSection {
  title: string;
  body: string;
}

export interface AboutPageContent {
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  sections: AboutContentSection[];
}

export interface LegalPageContent {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
  lastUpdated: string;
}

export const aboutContent: AboutPageContent = {
  heroTitle: "Building Excellence, Delivering Trust",
  heroSubtitle: "Premium real estate developments inspired by decades of experience in Bangladesh.",
  intro:
    "Starline Builder's Ltd. is dedicated to delivering durable, beautiful and comfortable homes. We focus on thoughtful locations, functional design and quality construction that stands the test of time.",
  sections: [
    {
      title: "Our Story",
      body:
        "Housing shapes how people live, work and build a future for their families. Our journey began with a simple question: what truly makes a home feel secure, inviting and long‑lasting? The answer lies in getting every detail right—from planning and approvals to design, materials and after‑handover service. Today, Starline Builder's Ltd. brings together experienced professionals who have delivered numerous successful apartment projects in Dhaka, always with a commitment to integrity and on‑time handover.",
    },
    {
      title: "The Challenge We Embrace",
      body:
        "Developing a home is like solving a complex puzzle. Beautiful visuals alone are not enough; the structure must be safe, practical and comfortable. Our teams continuously balance design, engineering and budget so that each project finds the right harmony between aesthetics and function. From soil tests and structural design to ventilation, light and common‑area planning, we aim to deliver apartments that feel generous, livable and future‑ready.",
    },
    {
      title: "People Behind the Projects",
      body:
        "Behind every Starline building is a coordinated team of architects, structural engineers, electrical and plumbing consultants, interior specialists, site supervisors and skilled construction workers. Many of them have decades of experience in the country’s leading developments. Their combined expertise allows us to offer a variety of layouts and finishes while keeping quality consistent from foundation to finishing.",
    },
    {
      title: "Quality, Materials & Compliance",
      body:
        "We are meticulous about sourcing verified materials from trusted suppliers—cement, steel, bricks, cables, tiles, sanitary fittings, lifts and generators are all selected against strict criteria. Our logistics and operations team manages approvals, utility connections and regulatory documentation so that owners receive legally compliant and fully supported properties.",
    },
    {
      title: "Long‑Term Relationships",
      body:
        "For us, handing over keys is not the end of the relationship. We focus on after‑handover support, guiding owners on building management, maintenance coordination and future enhancements. Many of our new clients come through referrals from existing homeowners, which we treat as the highest form of trust.",
    },
  ],
};

export const termsContent: LegalPageContent = {
  title: "Terms & Conditions",
  intro:
    "These Terms & Conditions govern your use of Starline Builder's Ltd. services and this website. By visiting our site, submitting an inquiry or entering into a booking agreement, you agree to the following terms.",
  lastUpdated: "Last updated: May 2026",
  sections: [
    {
      heading: "Use of Website",
      body:
        "Information on this website is provided for general guidance about our projects and services. While we aim to keep all content accurate and current, layouts, specifications, prices, availability and statutory approvals are subject to change without prior notice. Any visuals, 3D renders or sample apartments shown are indicative only.",
    },
    {
      heading: "Enquiries, Booking & Allotment",
      body:
        "Submitting an enquiry form or visiting our office does not by itself create a booking. An apartment is considered provisionally booked only after payment of the prescribed booking amount and completion of all necessary documentation. Final allotment is subject to execution of the agreement and timely payment as per the agreed schedule.",
    },
    {
      heading: "Payments & Delays",
      body:
        "All payments must be made according to the agreed instalment plan using the approved modes of payment. Delayed payments may attract penalties, interest or result in cancellation of the booking as per the terms of the agreement. In such cases, refunds, if any, will be processed according to the applicable company policy and local regulations.",
    },
    {
      heading: "Changes to Design & Specifications",
      body:
        "To comply with updated regulations, construction practices or site conditions, Starline Builder's Ltd. reserves the right to make reasonable changes to plans, specifications, amenities or materials without compromising overall quality. Any major variation impacting apartment area or key deliverables will be communicated to customers in line with applicable laws.",
    },
    {
      heading: "Limitation of Liability",
      body:
        "Starline Builder's Ltd. shall not be liable for any indirect, incidental or consequential loss arising from use of this website or from reliance on information contained herein. Our liability, if any, will be limited strictly to the extent specified in the signed agreement with the customer and subject to governing law.",
    },
  ],
};

export const privacyContent: LegalPageContent = {
  title: "Privacy Policy",
  intro:
    "We respect your privacy and are committed to protecting the personal information you share with Starline Builder's Ltd. This policy explains what data we collect, how we use it and the choices you have.",
  lastUpdated: "Last updated: May 2026",
  sections: [
    {
      heading: "Information We Collect",
      body:
        "When you contact us, register interest in a project or visit our office, we may collect information such as your name, email address, phone number, preferred location, budget range and any other details you choose to share. We may also collect basic technical information when you browse this website, including IP address, browser type and pages visited.",
    },
    {
      heading: "How We Use Your Information",
      body:
        "We use the information you provide to respond to enquiries, share project details, schedule site visits, prepare proposals and improve our services. From time to time, we may send you updates about new launches, offers or events that are relevant to your interests. You may opt out of marketing communications at any time.",
    },
    {
      heading: "Data Sharing & Disclosure",
      body:
        "We do not sell your personal information. We may share it with trusted service providers, consultants or agents who support our operations (for example, sales partners or IT service providers) under appropriate confidentiality obligations. We may also disclose information if required by law, court order or regulatory authorities.",
    },
    {
      heading: "Data Security & Retention",
      body:
        "Reasonable administrative, technical and physical safeguards are used to protect your data from unauthorized access, alteration or misuse. However, no method of transmission or storage is completely secure. We retain personal information only for as long as necessary to fulfil the purposes described in this policy or as required by law.",
    },
    {
      heading: "Your Choices",
      body:
        "You may contact us to review, update or correct your personal information, or to withdraw consent for certain uses where applicable. If you opt out of marketing communications, we may still contact you with important transactional or legal information related to an existing booking or agreement.",
    },
  ],
};

export const upcomingProjects: ProjectSummary[] = [
  {
    name: "Starline Senpara Residence",
    slug: "starline-senpara-residence",
    address: "East Senpara, Monipur, Mirpur",
    city: "Dhaka",
    notes: "Planned residential development in a well‑connected neighbourhood of Mirpur.",
    image: PROJECT_IMAGES.upcoming.eastSenpara,
  },
  {
    name: "Starline Shawra Para Heights",
    slug: "starline-shawra-para-heights",
    address: "East Shawra Para, Mirpur",
    city: "Dhaka 1216",
    notes: "Upcoming apartment complex with modern amenities and efficient layouts.",
    image: PROJECT_IMAGES.upcoming.eastShawraPara,
  },
  {
    name: "Starline Uttara Vista",
    slug: "starline-uttara-vista",
    address: "Uttara",
    city: "Dhaka",
    notes: "Future premium project in a fast‑growing urban hub of the capital.",
    image: PROJECT_IMAGES.upcoming.uttara,
  },
];

export const ongoingProjects: ProjectSummary[] = [
  {
    name: "Starline Tower - 1",
    slug: "starline-tower-one",
    address: "House: 291–298, Road 18, Block A, Avenue 5, Section 11, Mirpur",
    city: "Dhaka 1216",
    notes: "High‑rise residential tower with contemporary façade and smart planning.",
    image: PROJECT_IMAGES.ongoing.towerOne,
  },
  {
    name: "Starline Niraloy Villa",
    slug: "starline-neeraloy-villa",
    address: "Shekhertek, Mohammadpur",
    city: "Dhaka 1207",
    notes: "Family‑focused apartments with attention to light, air and circulation.",
    image: PROJECT_IMAGES.ongoing.neeraloyVilla,
  },
  {
    name: "Starline Shanti Niketon",
    slug: "starline-shanti-niketon",
    address: "Kazipara, Mirpur",
    city: "Dhaka 1216",
    notes: "Community‑oriented project designed for everyday comfort.",
    image: PROJECT_IMAGES.ongoing.shantiNiketon,
  },
];

export const handoverProjects: ProjectSummary[] = [
  {
    name: "Starline Tower",
    slug: "starline-sapiya-manjil",
    address: "Shah Ali bug, Mirpur",
    city: "Dhaka 1216",
    notes: "Completed and handed‑over apartments known for reliable construction quality.",
    image: "/properties/starline-sapiya-manjil/01.png",
  },
  {
    name: "Starline Nur Hosen Villa",
    slug: "starline-nur-hosen-villa",
    address: "Sector-11, Mirpur-11",
    city: "Dhaka 1216",
    notes: "Delivered on time with satisfied homeowners and strong community feedback.",
    image: "/properties/starline-nur-hosen-villa/01.png",
  },
  {
    name: "Starline Sarkar Villa",
    slug: "starline-sarkar-villa",
    address: "Sector-11, Mirpur-11",
    city: "Dhaka 1216",
    notes: "Corner plot development emphasizing light, ventilation and functional layouts.",
    image: "/properties/starline-sarkar-villa/01.png",
  },
];

