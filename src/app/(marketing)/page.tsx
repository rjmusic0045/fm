import { Hero } from "@/components/home/hero";
import { StationsSection } from "@/components/home/stations-section";
import { SongsSection } from "@/components/home/songs-section";
import { FeaturesSection } from "@/components/home/features-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { PricingTeaser } from "@/components/home/pricing-teaser";
import { CtaSection } from "@/components/home/cta-section";
import { getPlans } from "@/lib/plans";

// Plan prices are admin-editable: refresh the cached page at most once a minute.
export const revalidate = 60;

export default async function HomePage() {
  const plans = await getPlans();
  return (
    <>
      <Hero />
      <StationsSection />
      <SongsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingTeaser plans={plans} />
      <CtaSection />
    </>
  );
}
