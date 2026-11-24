import { cn } from "@/lib/utils";

interface VisualizerProps {
  // Animate bars; when false bars rest at a low height.
  playing?: boolean;
  bars?: number;
  className?: string;
  barClassName?: string;
}

// Lightweight CSS equalizer. Pure transform animation (GPU-composited)
// so it stays at 60fps even with many instances on screen.
export function Visualizer({ playing = true, bars = 4, className, barClassName }: VisualizerProps) {
  return (
    <span
      role="img"
      aria-label={playing ? "Audio playing" : "Audio paused"}
      className={cn("inline-flex h-4 items-end gap-[3px]", className)}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-full w-[3px] origin-bottom rounded-full bg-neon-gradient",
            playing ? "animate-eq-bar" : "scale-y-[0.25]",
            barClassName,
          )}
          style={
            playing
              ? { animationDelay: `${(i * 137) % 600}ms`, animationDuration: `${800 + ((i * 211) % 500)}ms` }
              : undefined
          }
        />
      ))}
    </span>
  );
}
