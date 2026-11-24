export type PlanId = "FREE" | "PREMIUM" | "FAMILY";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  // Monthly prices; yearly = monthly * 12 * 0.8
  price: { inr: number; usd: number };
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export const YEARLY_DISCOUNT = 0.2;

export const plans: Plan[] = [
  {
    id: "FREE",
    name: "Free",
    tagline: "Radio for everyone",
    price: { inr: 0, usd: 0 },
    features: ["All live FM stations", "Standard audio (128 kbps)", "6 skips per hour", "Occasional ads"],
    cta: "Start free",
  },
  {
    id: "PREMIUM",
    name: "Premium",
    tagline: "The full Lumen experience",
    price: { inr: 99, usd: 4.99 },
    features: ["Ad-free listening", "HD audio (320 kbps)", "Unlimited skips", "Offline downloads", "Unlimited playlists"],
    highlighted: true,
    cta: "Go Premium",
  },
  {
    id: "FAMILY",
    name: "Family",
    tagline: "Premium for up to 5",
    price: { inr: 179, usd: 7.99 },
    features: ["Everything in Premium", "Up to 5 accounts", "Individual libraries", "Parental controls"],
    cta: "Get Family",
  },
];
