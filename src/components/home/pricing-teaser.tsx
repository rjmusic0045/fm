import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { plans } from "@/config/plans";
import { cn } from "@/lib/utils";

export function PricingTeaser() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="container scroll-mt-28 py-20">
      <SectionHeading
        id="pricing-title"
        eyebrow="Pricing"
        title={
          <>
            Simple plans, <span className="text-gradient">serious sound</span>
          </>
        }
        description="Start free. Upgrade when you're hooked. Cancel anytime."
      />
      <div className="mx-auto grid max-w-5xl items-stretch gap-5 md:grid-cols-3">
        {plans.map((plan, i) => (
          <Reveal key={plan.id} delay={i * 0.08} className="h-full">
            <GlassCard
              interactive
              gradientBorder={plan.highlighted}
              className={cn("flex h-full flex-col p-7", plan.highlighted && "bg-foreground/[0.06] shadow-glow md:-top-3")}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-sans text-lg font-semibold">{plan.name}</h3>
                {plan.highlighted && <Badge variant="gradient">Most popular</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">
                  {plan.price.inr === 0 ? "₹0" : `₹${plan.price.inr}`}
                </span>
                <span className="text-sm text-muted-foreground">
                  /month{plan.price.usd > 0 && ` · $${plan.price.usd}`}
                </span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-neon-pink" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full" variant={plan.highlighted ? "gradient" : "glass"}>
                <Link href="/signup">{plan.cta}</Link>
              </Button>
            </GlassCard>
          </Reveal>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Save 20% with yearly billing. All paid plans include a 7-day free trial.
      </p>
    </section>
  );
}
