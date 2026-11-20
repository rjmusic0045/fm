import { Quote, Star } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { testimonials } from "@/data/catalog";

const avatarGradients = [
  "from-neon-violet to-neon-pink",
  "from-neon-pink to-neon-amber",
  "from-sky-500 to-neon-violet",
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" aria-labelledby="testimonials-title" className="container scroll-mt-28 py-20">
      <SectionHeading
        id="testimonials-title"
        eyebrow="Loved by listeners"
        title={
          <>
            Tuned in, <span className="text-gradient">turned up</span>
          </>
        }
      />
      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.1}>
            <GlassCard interactive className="flex h-full flex-col p-6">
              <Quote className="mb-4 size-8 text-neon-pink/60" aria-hidden />
              <blockquote className="flex-1 text-base leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
              <div className="mt-6 flex items-center gap-3">
                <div
                  aria-hidden
                  className={`grid size-11 place-items-center rounded-full bg-gradient-to-br ${avatarGradients[i % 3]} font-semibold text-white`}
                >
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
                <div className="flex" role="img" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} className="size-3.5 fill-neon-amber text-neon-amber" aria-hidden />
                  ))}
                </div>
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
