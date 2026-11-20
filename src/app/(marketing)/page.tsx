import { Hero } from "@/components/home/hero";
import { StationsSection } from "@/components/home/stations-section";
import { SongsSection } from "@/components/home/songs-section";
import { FeaturesSection } from "@/components/home/features-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { PricingTeaser } from "@/components/home/pricing-teaser";
import { CtaSection } from "@/components/home/cta-section";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StationsSection />
      <SongsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingTeaser />
      <CtaSection />
    </>
  );
}
