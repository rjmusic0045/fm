import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Visualizer } from "@/components/audio/visualizer";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="space-y-6">
        <Visualizer playing={false} bars={7} className="h-10" barClassName="w-1.5" />
        <h1 className="text-6xl font-bold md:text-8xl">
          <span className="text-gradient">404</span>
        </h1>
        <p className="text-lg text-muted-foreground">Dead air. This frequency isn&apos;t broadcasting.</p>
        <Button asChild size="lg">
          <Link href="/">Back to the music</Link>
        </Button>
      </div>
    </main>
  );
}
