import type { Metadata } from "next";
import { Headphones, Heart, Play, Radio, Sparkles, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Visualizer } from "@/components/audio/visualizer";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "Design System", robots: { index: false } };

const swatches = [
  { name: "White", hex: "#FFFFFF", className: "bg-ink-950 ring-1 ring-border" },
  { name: "Zinc 50", hex: "#FAFAFA", className: "bg-ink-900 ring-1 ring-border" },
  { name: "Zinc 100", hex: "#F4F4F5", className: "bg-ink-800 ring-1 ring-border" },
  { name: "Indigo 600", hex: "#4F46E5", className: "bg-neon-violet" },
  { name: "Indigo 500", hex: "#6366F1", className: "bg-neon-pink" },
  { name: "Amber 600", hex: "#D97706", className: "bg-neon-amber" },
];

const features = [
  { icon: Sparkles, title: "Ad-free", text: "Pure music, zero interruptions." },
  { icon: Headphones, title: "HD audio", text: "320 kbps lossless-grade streams." },
  { icon: WifiOff, title: "Offline", text: "Download and listen anywhere." },
  { icon: Heart, title: "Playlists", text: "Curate your own soundtrack." },
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal as="section" className="space-y-5">
      <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h2>
      {children}
    </Reveal>
  );
}

export default function StyleguidePage() {
  return (
    <div className="container space-y-16 pb-12">
      <SectionHeading
        eyebrow="Design system"
        title={
          <>
            The <span className="text-gradient">Lumen</span> look
          </>
        }
        description="Dark-first, neon-accented, glassy. Every component reacts to hover, focus and press."
      />

      <Block title="Colour">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {swatches.map((s) => (
            <div key={s.name} className="space-y-2">
              <div className={`h-20 rounded-2xl border border-foreground/10 ${s.className}`} />
              <p className="text-sm font-medium">{s.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{s.hex}</p>
            </div>
          ))}
        </div>
        <div className="h-16 animate-gradient-pan rounded-2xl bg-neon-gradient bg-[length:200%_200%]" />
      </Block>

      <Block title="Typography">
        <div className="space-y-3">
          <p className="font-display text-6xl font-bold">Sora Display</p>
          <p className="font-display text-3xl font-semibold">Heading, semibold, tight tracking</p>
          <p className="max-w-2xl text-base text-muted-foreground">
            Inter for UI and body copy. Muted text uses a 70% lightness tone so it keeps WCAG AA contrast on the
            ink background.
          </p>
        </div>
      </Block>

      <Block title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Gradient</Button>
          <Button variant="primary">Primary</Button>
          <Button variant="glass">Glass</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="facebook">Facebook</Button>
          <Button loading>Loading</Button>
          <Button variant="gradient" size="icon-lg" aria-label="Play">
            <Play className="fill-current" />
          </Button>
        </div>
      </Block>

      <Block title="Badges & visualizer">
        <div className="flex flex-wrap items-center gap-3">
          <LiveBadge />
          <Badge variant="gradient">Premium</Badge>
          <Badge variant="violet">98.3 FM</Badge>
          <Badge variant="amber">Save 20%</Badge>
          <Badge variant="muted">Lo-fi</Badge>
          <Visualizer />
          <Visualizer bars={6} className="h-8" barClassName="w-1" />
          <Visualizer playing={false} bars={6} className="h-8" barClassName="w-1" />
        </div>
      </Block>

      <Block title="Glass cards">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <GlassCard key={title} interactive className="p-6">
              <div className="mb-4 grid size-11 place-items-center rounded-xl bg-neon-gradient-soft ring-1 ring-foreground/10">
                <Icon className="size-5 text-primary" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </GlassCard>
          ))}
        </div>
        <GlassCard gradientBorder interactive className="flex items-center gap-4 p-5">
          <div className="grid size-14 place-items-center rounded-xl bg-neon-gradient">
            <Radio className="size-6 text-white" aria-hidden />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Neon Nights</h3>
              <LiveBadge />
            </div>
            <p className="text-sm text-muted-foreground">98.3 FM · Synthwave · 12.4K listening</p>
          </div>
          <Visualizer className="h-6" />
        </GlassCard>
      </Block>
    </div>
  );
}
