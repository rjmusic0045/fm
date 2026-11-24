export const siteConfig = {
  name: "Lumen FM",
  shortName: "Lumen",
  tagline: "Your City. Your Sound. Live.",
  description:
    "Lumen FM is a premium live FM radio and music streaming platform. Tune into live stations, discover new music and listen ad-free in HD.",
  // `||` (not `??`): CI passes unset variables as empty strings, and new URL("") throws.
  url: process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000",
  nav: [
    { label: "Home", href: "/" },
    { label: "Stations", href: "/#stations" },
    { label: "Music", href: "/music" },
    { label: "People & Voices", href: "/voices" },
    { label: "Artist", href: "/artist" },
    { label: "Pricing", href: "/#pricing" },
  ],
  footer: {
    Product: [
      { label: "Live Radio", href: "/#stations" },
      { label: "Sample songs", href: "/#songs" },
      { label: "Pricing", href: "/#pricing" },
    ],
    Company: [
      { label: "About", href: "/#features" },
      { label: "Careers", href: "/#features" },
      { label: "Press", href: "/#testimonials" },
    ],
    Legal: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;
