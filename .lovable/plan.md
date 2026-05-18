## Goal
Deliver a polished, informative public site with three core experiences: Landing, Project Listings, and Project Detail. Keep current Emerald & Gold theme (Libre Baskerville + IBM Plex) and Lovable Cloud backend.

## Scope

### 1. Landing Page (`/`) — enhance existing
Already in place: Hero carousel, PropertySummary, PropertySearch, FeaturedProperties, Stats, OurProcess, ComingSoon, WhyStarline, Testimonials, FAQ, CTABanner, Footer.

Add / upgrade:
- **Hero**: stronger tagline overlay + dual CTAs ("Explore Projects", "Contact Us"), subtle parallax on scroll, fade-in heading
- **About Us section** (new): company story, mission, vision, founder/team highlight cards
- **Gallery section** (new): masonry image grid pulling from project_images
- **Contact section** (new): form (saves to a `contact_messages` table) + address/phone/email + embedded Google Map iframe
- **Animated counters** on Stats section (count-up on viewport enter)
- **Scroll reveals** (fade-in / slide-in) using `animate-fade-in` + IntersectionObserver hook
- Confirm full responsive behavior at mobile/tablet/desktop

### 2. Project Listings Page (`/projects`)
- Filter bar tabs: All | Upcoming | Ready | Ongoing (color-coded badges)
- Grid of project cards: cover, name, location, status badge, price range, plots/flats count, size range, short description
- Cards link to `/projects/:id`
- Replaces / consolidates the existing Upcoming/Ongoing/Handover separate pages (keep redirects)

### 3. Project Detail Page (`/projects/:id`)
- Full-width hero image (or video if provided)
- Title, location, status badge
- Details panel: price/unit, installment plan (down payment, monthly, duration), area, unit count, size options, handover date, amenities list
- Media gallery (images grid + embedded YouTube)
- Floor plan / map section
- Download brochure button (PDF URL)
- Project-specific inquiry form (saves to `project_inquiries`)
- Share buttons (Facebook, WhatsApp, copy link)

## Technical Notes

### New components
`AboutSection`, `GallerySection`, `ContactSection`, `AnimatedCounter`, `useInView` hook, `ProjectsListPage`, `ProjectDetailPage`, `ProjectCard`, `StatusBadge`, `ShareButtons`, `InquiryForm`.

### Backend (Lovable Cloud)
Reuse existing `customer_projects` + `project_images` where possible for public showcase data — OR introduce a dedicated public `projects` table with fields: name, slug, location, status (`upcoming|ready|ongoing`), cover_url, video_url, price_min, price_max, plots_count, size_min, size_max, description, amenities (jsonb), floor_plan_url, brochure_url, map_embed, handover_date, down_payment, monthly_installment, installment_months. Plus `project_media` (image/video) and `project_inquiries`, `contact_messages`. Public SELECT; admin write. (Will use a new `projects` table to keep customer data separate from public marketing data.)

### Routing
Add routes in `App.tsx`: `/projects`, `/projects/:id`. Update navbar links.

### Animations
Tailwind `animate-fade-in`, custom `useInView` hook (no new lib). Counters with `requestAnimationFrame`. Parallax via simple `scroll` transform.

## Approach
1. Create migration for `projects`, `project_media`, `project_inquiries`, `contact_messages` tables with RLS (public read, admin write; public insert on inquiries/messages)
2. Build shared utilities (`useInView`, `AnimatedCounter`, `StatusBadge`, `ShareButtons`)
3. Add landing-page sections (About, Gallery, Contact) and wire animations
4. Build `/projects` listings page with filters
5. Build `/projects/:id` detail page with inquiry form
6. Wire navbar + routes; QA in browser at desktop and mobile widths

## Out of scope (for now)
- Admin CRUD UI for the new public `projects` table (data can be seeded via SQL initially; admin UI in a follow-up)
- Real PDF brochure generation (use uploaded URL)
- Real Google Maps API (use iframe embed string per project)

Confirm and I'll start with the migration, then build top-down.