import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Visualizer } from "@/components/audio/visualizer";
import { Reveal } from "@/components/motion/reveal";

export function CtaSection() {
  return (
    <section aria-labelledby="cta-title" className="container py-20">
      <Reveal>
        <div className="noise relative overflow-hidden rounded-[2rem] bg-neon-gradient p-10 text-center md:p-16">
          <div aria-hidden className="absolute -right-20 -top-20 size-72 rounded-full bg-foreground/20 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -left-10 size-72 rounded-full bg-black/20 blur-3xl" />
          <div className="relative">
            <Visualizer bars={9} className="mx-auto mb-6 h-10" barClassName="w-1.5 bg-white bg-none" />
            <h2 id="cta-title" className="text-3xl font-bold text-white md:text-5xl">
              The city never stops playing.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/85">
              Join over two million listeners. Free forever, Premium when you want more.
            </p>
            <Button asChild size="lg" variant="outline" className="group mt-8 border-transparent bg-white text-primary hover:bg-white/90">
              <Link href="/signup">
                Create your free account
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
