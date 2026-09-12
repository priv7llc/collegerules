# Rebuild the public College Rules homepage

A full redesign of the public landing page only. Nothing inside the logged-in app, payments, scholarships, routes, or admin is touched.

## Look and feel

Modern education-tech / premium SaaS: lots of white space, strong compact headlines, large real product screenshots in rounded frames with soft shadows, minimal decoration.

Colors blend the brief with the existing brand: existing Berkeley navy stays the primary, a brighter blue is added for links and highlight words, gold stays a sparing warm accent, warm off-white and soft-blue section backgrounds alternate. Inter for body, existing display font for headlines, with fluid sizes so the hero stays powerful on phones.

## Product imagery

Your six uploaded screenshots become real assets on the page (no fake mockups):

- My Transfer Routes - hero
- Diablo Valley dashboard - transfer planning section
- Major Courses - course planning section
- Scholarships - scholarships section
- My Applications - application tracking section
- Create Route - how-it-works visual

Each sits in a browser-style frame with rounded corners, thin border, subtle shadow, gentle hover lift. On mobile they stay legible with copy placed above the image.

## Page sections

1. Sticky white nav: logo, Transfer Planning, Scholarships, How It Works, Pricing, Resources, Log in, navy "Get Started Free" button, hamburger on mobile.
2. Hero: eyebrow, "Your path to a four-year degree starts here." (last line in blue), supporting copy, two CTAs, three trust points, routes screenshot with two small overlapping cards (scholarship match, funding gap).
3. Three core products: Transfer Planning, Scholarships, Affordability.
4. Transfer planner: headline, 3-step timeline, "Build My Route" CTA, dashboard screenshot, CA/TX pathway line.
5. Course planning: Major Courses screenshot plus simple check-list callouts.
6. Scholarships on soft-blue background with the scholarships screenshot.
7. Application tracking: three feature blurbs plus the kanban screenshot.
8. Affordability: dark navy section with a polished estimate card and a donut showing funded vs gap (illustrative figures, labeled as an example).
9. Everything works together: one connected profile-to-outcomes visual.
10. California + Texas cards plus a "more states coming soon" card.
11. Before/after: messy tabs vs one dashboard.
12. Pricing: Free $0, Transfer Route $10 (1 route), Best Value $25 (5 routes), with a short note on what a route is; CTAs go to signup and existing purchase flows.
13. FAQ accordion, final CTA band, and a full footer.

Interactions stay subtle: small hover lifts, smooth anchor scrolling, gentle fade-in on scroll.

## Technical notes

- Replace `src/pages/HomePage.tsx` with a composition of new components under `src/components/home/` (Navbar, HeroSection, PlatformFeatures, TransferPlannerSection, CoursePlanningSection, ScholarshipSection, ApplicationsSection, AffordabilitySection, ConnectedPlatformSection, StateSupportSection, BeforeAfterSection, PricingSection, FAQSection, FinalCTA, Footer).
- Screenshots registered through the assets CLI and imported as ES modules; alt text on every image.
- New blue/neutral tokens added to `src/index.css` and `tailwind.config.ts` alongside existing brand tokens; no hardcoded hex in components.
- Update `index.html` title, description, and Open Graph/Twitter tags; single H1; JSON-LD organization markup.
- No route, schema, auth, Stripe, edge-function, or admin changes.
