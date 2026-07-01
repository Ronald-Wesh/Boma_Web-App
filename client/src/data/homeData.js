// Static content extracted from the Stitch "Boma Editorial" Home design.
// Kept out of components so the markup stays presentational.
export const primaryNav = [
  { label: "listings", to: "/listings" },
  { label: "map", to: "/map" },
  { label: "roommates", to: "/roommates" },
  { label: "reviews", to: "/reviews" },
  { label: "forums", to: "/forums" },
];

export const heroContent = {
  eyebrow: "Student Housing · Verified · Kenya",
  titleLines: ["find your people,", "then your place."],
  searchPlaceholder: "Which campus?",
  searchCta: "search houses",
  stats: [
    { value: "12.4k+", label: "active students" },
    { value: "850+", label: "verified houses" },
    { value: "24/7", label: "support team" },
  ],
};

export const differentiators = [
  {
    icon: "group",
    title: "roommate matching",
    body: "connect with peers based on lifestyle, study habits, and budget before signing a lease.",
    to: "/roommates",
  },
  {
    icon: "verified_user",
    title: "resident reviews",
    body: "read honest feedback from current and former student residents about landlords and facilities.",
    to: "/reviews",
  },
  {
    icon: "forum",
    title: "campus forums",
    body: "stay updated with hyper-local campus news, events, and safety alerts from your boma community.",
    to: "/forums",
  },
];

export const featured = {
  eyebrow: "Editor's Picks",
  heading: "fresh near campus",
  link: { label: "view all listings", to: "/listings" },
};

export const ctaBand = {
  heading: "your next place is one search away.",
  cta: "browse listings",
  to: "/listings",
};

export const siteFooter = {
  tagline:
    "redefining the student living experience through community and verified trust.",
  columns: [
    {
      heading: "listings",
      links: [
        { label: "Nairobi Central", to: "/listings" },
        { label: "Westlands / Parklands", to: "/listings" },
        { label: "Juja / Thika Road", to: "/listings" },
        { label: "Rongai / Madaraka", to: "/listings" },
      ],
    },
    {
      heading: "community",
      links: [
        { label: "Find Roommates", to: "/roommates" },
        { label: "Campus Forums", to: "/forums" },
        { label: "Resident Reviews", to: "/reviews" },
        { label: "Safety Guidelines", to: "/forums" },
      ],
    },
    {
      heading: "legal",
      links: [
        { label: "Privacy Policy", to: "/privacy" },
        { label: "Terms of Service", to: "/terms" },
        { label: "Property Listing Rules", to: "/rules" },
        { label: "Contact Support", to: "/support" },
      ],
    },
  ],
  legal: {
    copyright: "© 2024 boma. All rights reserved.",
    notes: ["Made for students, by students.", "Nairobi, Kenya"],
  },
};
