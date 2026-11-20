import { Download, Headphones, ListMusic, ShieldOff } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";

const features = [
  {
    icon: ShieldOff,
    title: "Ad-free listening",
    text: "No jingles, no sponsor reads. Just uninterrupted music on Premium.",
    tint: "from-neon-violet/30",
  },
  {
    icon: Headphones,
    title: "HD audio",
    text: "Up to 320 kbps streams tuned for headphones, car stereos and smart speakers.",
    tint: "from-neon-pink/30",
  },
  {
    icon: Download,
    title: "Offline mode",
    text: "Save tracks and replay shows on the metro, on flights, anywhere.",
    tint: "from-neon-amber/30",
  },
  {
    icon: ListMusic,
    title: "Custom playlists",
    text: "Mix songs and stations into playlists that follow you across devices.",
    tint: "from-sky-500/30",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" aria-labelledby="features-title" className="container scroll-mt-28 py-20">
      <SectionHeading
        id="features-title"
        eyebrow="Why Lumen"
        title={
          <>
            Radio, <span className="text-gradient">reimagined</span>
          </>
        }
        description="Everything you love about FM, upgraded for the way you listen today."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, text, tint }, i) => (
          <Reveal key={title} delay={i * 0.08}>
            <GlassCard interactive className="h-full p-6">
              <div
                className={`mb-5 grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${tint} to-transparent ring-1 ring-foreground/10 transition-transform duration-300 group-hover/card:-rotate-6 group-hover/card:scale-110`}
              >
                <Icon className="size-5 text-white" aria-hidden />
              </div>
              <h3 className="font-sans text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
